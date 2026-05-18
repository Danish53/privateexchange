import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { loadRequestActor } from '@/lib/authHelpers';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function isVercelRuntime() {
  const v = process.env.VERCEL;
  return v === '1' || String(v).toLowerCase() === 'true';
}

function getBlobReadWriteToken() {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  return typeof t === 'string' ? t.trim() : '';
}

function resolveImageExt(file) {
  const fromMime = MIME_TO_EXT[file.type];
  if (fromMime) return fromMime;
  const name = typeof file.name === 'string' ? file.name : '';
  const match = name.match(/\.(jpe?g|png|webp)$/i);
  if (!match) return null;
  const raw = match[1].toLowerCase();
  if (raw === 'jpeg' || raw === 'jpg') return 'jpg';
  return raw;
}

async function saveToLocalDisk(buf, filename) {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'deposit-proofs');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/deposit-proofs/${filename}`;
}

export async function POST(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;

    if (auth.user?.role !== 'user') {
      return NextResponse.json(
        { ok: false, error: 'Only member accounts can upload deposit proof.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string' || !('arrayBuffer' in file)) {
      return NextResponse.json({ ok: false, error: 'Image file required.' }, { status: 400 });
    }

    const ext = resolveImageExt(file);
    if (!ext) {
      return NextResponse.json(
        { ok: false, error: 'Use JPEG, PNG, or WebP.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: 'Image must be 5MB or smaller.' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const filename = `deposit-${auth.userId}-${Date.now()}.${ext}`;
    const blobToken = getBlobReadWriteToken();
    const onVercel = isVercelRuntime();
    const useBlob = onVercel && Boolean(blobToken);

    if (onVercel && !blobToken) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Proof upload is not configured on this deployment. Link Vercel Blob storage (BLOB_READ_WRITE_TOKEN).',
        },
        { status: 503 }
      );
    }

    let publicUrl;

    if (useBlob) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`deposit-proofs/${filename}`, buf, {
          access: 'public',
          contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          addRandomSuffix: false,
        });
        publicUrl = blob.url;
      } catch (blobErr) {
        console.error('deposit proof blob upload failed', blobErr);
        return NextResponse.json(
          {
            ok: false,
            error:
              'Cloud storage is misconfigured. Check BLOB_READ_WRITE_TOKEN and your Vercel Blob store.',
          },
          { status: 503 }
        );
      }
    } else {
      publicUrl = await saveToLocalDisk(buf, filename);
    }

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (e) {
    console.error('deposit proof POST', e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        error: 'Could not upload proof image.',
        ...(process.env.NODE_ENV !== 'production' ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
