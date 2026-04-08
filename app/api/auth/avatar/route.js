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
    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(dir, { recursive: true });

    const filename = `${auth.userId}-${Date.now()}.${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buf);

    await connectDB();
    const user = await User.findById(auth.userId);
    if (!user) {
      await unlink(filepath).catch(() => {});
      return NextResponse.json({ ok: false, error: 'User not found.' }, { status: 404 });
    }

    const prev = user.avatarUrl;
    if (prev && typeof prev === 'string' && prev.startsWith('/uploads/avatars/')) {
      const oldFile = path.join(process.cwd(), 'public', prev.replace(/^\//, ''));
      await unlink(oldFile).catch(() => {});
    }

    const publicPath = `/uploads/avatars/${filename}`;
    user.avatarUrl = publicPath;
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
