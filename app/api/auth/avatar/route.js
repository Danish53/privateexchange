import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { requireAuthUser, serializeUser } from '@/lib/authHelpers';

export const runtime = 'nodejs';

const MAX_BYTES = 2 * 1024 * 1024;
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function isVercelBlobUrl(url) {
  return typeof url === 'string' && url.includes('.public.blob.vercel-storage.com');
}

/** Vercel sets VERCEL=1 or VERCEL=true on their build/runtime. */
function isVercelRuntime() {
  const v = process.env.VERCEL;
  return v === '1' || String(v).toLowerCase() === 'true';
}

function getBlobReadWriteToken() {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  return typeof t === 'string' ? t.trim() : '';
}

async function removePreviousAvatar(prev, blobToken) {
  if (!prev || typeof prev !== 'string') return;
  if (prev.startsWith('/uploads/avatars/')) {
    const oldFile = path.join(process.cwd(), 'public', prev.replace(/^\//, ''));
    await unlink(oldFile).catch(() => {});
    return;
  }
  if (isVercelBlobUrl(prev)) {
    const { del } = await import('@vercel/blob');
    const opts = blobToken ? { token: blobToken } : undefined;
    await del(prev, opts).catch(() => {});
  }
}

export async function POST(request) {
  try {
    const auth = requireAuthUser(request);
    if ('error' in auth) return auth.error;

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string' || !('arrayBuffer' in file)) {
      return NextResponse.json({ ok: false, error: 'Image file required.' }, { status: 400 });
    }

    const mime = file.type;
    const ext = MIME_TO_EXT[mime];
    if (!ext) {
      return NextResponse.json(
        { ok: false, error: 'Use JPEG, PNG, WebP, or GIF.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'Image must be 2MB or smaller.' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const filename = `${auth.userId}-${Date.now()}.${ext}`;

    const blobToken = getBlobReadWriteToken();
    const useBlob = Boolean(blobToken);

    // Serverless filesystem is ephemeral: /uploads/... would 404 for visitors.
    if (isVercelRuntime() && !useBlob) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Avatar storage is not configured on this deployment. In the Vercel project: Storage → Blob, link a store (adds BLOB_READ_WRITE_TOKEN), then redeploy. For local dev, add BLOB_READ_WRITE_TOKEN to .env.local or use disk uploads without VERCEL.',
        },
        { status: 503 }
      );
    }

    let publicUrl;
    /** Local disk path when not using Blob (for rollback if user missing). */
    let localDiskPath = null;

    if (useBlob) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`avatars/${filename}`, buf, {
        access: 'public',
        contentType: mime,
        // token: blobToken,
        addRandomSuffix: false,
      });
      publicUrl = blob.url;
    } else {
      const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      await mkdir(dir, { recursive: true });
      localDiskPath = path.join(dir, filename);
      await writeFile(localDiskPath, buf);
      publicUrl = `/uploads/avatars/${filename}`;
    }

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      if (useBlob && isVercelBlobUrl(publicUrl)) {
        const { del } = await import('@vercel/blob');
        await del(publicUrl, { token: blobToken }).catch(() => {});
      } else if (localDiskPath) {
        await unlink(localDiskPath).catch(() => {});
      }
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }

    const prev = user.avatarUrl;
    await removePreviousAvatar(prev, blobToken);

    user.avatarUrl = publicUrl;
    await user.save();

    return NextResponse.json({ ok: true, user: serializeUser(user) });
  } catch (e) {
    console.error('avatar POST', e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: 'Could not upload image.', detail },
      { status: 500 }
    );
  }
}
