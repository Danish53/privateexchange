import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { loadRequestActor } from '@/lib/authHelpers';
import Drawing from '@/lib/models/Drawing';
import Token from '@/lib/models/Token';

export const runtime = 'nodejs';

const MAX_BYTES = 3 * 1024 * 1024;
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function requireSuperadmin(request) {
  const auth = await loadRequestActor(request);
  if ('error' in auth) return auth;
  if (auth.user?.role !== 'superadmin') {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return auth;
}

export async function PATCH(request, { params }) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;
    await connectDB();

    const p = await params;
    const id = String(p?.id || '');
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid drawing id.' }, { status: 400 });
    }

    const drawing = await Drawing.findById(id);
    if (!drawing) {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }

    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const prizeTitle = String(formData.get('prize_title') || '').trim();
    const prizeDescription = String(formData.get('prize_description') || '').trim();
    const rewardTokenId = String(formData.get('reward_token_id') || '').trim();
    const rewardTokenAmount = String(formData.get('reward_token_amount') || '').trim();
    const entryCost = String(formData.get('entry_cost') || '').trim();
    const entryTokenId = String(formData.get('entry_token_id') || '').trim();
    const totalEntriesRaw = String(formData.get('total_entries') || '').trim();
    const rewardType = String(formData.get('reward_type') || 'physical').trim();
    const drawDateRaw = String(formData.get('draw_date') || '').trim();
    const totalEntries = Number.parseInt(totalEntriesRaw || '0', 10);

    if (!title || !description || !prizeTitle || !prizeDescription || !entryTokenId || !entryCost || !drawDateRaw || !totalEntriesRaw || !rewardTokenAmount) {
      return NextResponse.json(
        { ok: false, error: 'All drawing fields are required.' },
        { status: 400 }
      );
    }
    if (!['physical', 'token', 'event_access', 'custom'].includes(rewardType)) {
      return NextResponse.json({ ok: false, error: 'Invalid reward type.' }, { status: 400 });
    }
    if (!Number.isFinite(totalEntries) || totalEntries < 0) {
      return NextResponse.json({ ok: false, error: 'Total entries must be zero or greater.' }, { status: 400 });
    }
    if (rewardType === 'token' && !rewardTokenId) {
      return NextResponse.json({ ok: false, error: 'Reward token is required when reward type is token.' }, { status: 400 });
    }
    const tokenIdsToValidate = [entryTokenId, rewardType === 'token' ? rewardTokenId : ''].filter(Boolean);
    const tokens = await Token.find({ _id: { $in: tokenIdsToValidate }, isActive: true })
      .select('_id slug')
      .lean();
    const tokenSet = new Set(tokens.map((t) => String(t._id)));
    if (!tokenSet.has(entryTokenId)) {
      return NextResponse.json({ ok: false, error: 'Invalid entry token selected.' }, { status: 400 });
    }
    if (rewardType === 'token' && !tokenSet.has(rewardTokenId)) {
      return NextResponse.json({ ok: false, error: 'Invalid reward token selected.' }, { status: 400 });
    }
    const hasUsd = tokens.some((t) => String(t.slug).toLowerCase() === 'usd');
    if (hasUsd) {
      return NextResponse.json({ ok: false, error: 'USD token is not allowed for drawing reward/entry.' }, { status: 400 });
    }

    const nextSlug = slugify(title);
    if (!nextSlug) {
      return NextResponse.json({ ok: false, error: 'Invalid title.' }, { status: 400 });
    }
    const slugTaken = await Drawing.exists({ slug: nextSlug, _id: { $ne: drawing._id } });
    if (slugTaken) {
      return NextResponse.json({ ok: false, error: 'A drawing with this title already exists.' }, { status: 409 });
    }

    drawing.title = title;
    drawing.slug = nextSlug;
    drawing.description = description || null;
    drawing.prize_title = prizeTitle;
    drawing.prize_description = prizeDescription || null;
    drawing.reward_type = rewardType;
    drawing.reward_token_id = rewardType === 'token' ? rewardTokenId : null;
    drawing.reward_token_amount = rewardTokenAmount;
    drawing.entry_token_id = entryTokenId;
    drawing.entry_cost = entryCost;
    drawing.total_entries = totalEntries;
    if (drawDateRaw) {
      const drawDate = new Date(drawDateRaw);
      if (Number.isNaN(drawDate.getTime()) || drawDate.getTime() <= Date.now()) {
        return NextResponse.json({ ok: false, error: 'Draw date must be in the future.' }, { status: 400 });
      }
      drawing.draw_date = drawDate;
    } else {
      drawing.draw_date = null;
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'drawings');

    const prizeImageFile = formData.get('prize_image');
    if (prizeImageFile && typeof prizeImageFile !== 'string' && 'arrayBuffer' in prizeImageFile && prizeImageFile.size > 0) {
      const ext = MIME_TO_EXT[prizeImageFile.type];
      if (!ext) {
        return NextResponse.json(
          { ok: false, error: 'Use JPEG, PNG, WEBP or GIF image.' },
          { status: 400 }
        );
      }
      if (prizeImageFile.size > MAX_BYTES) {
        return NextResponse.json(
          { ok: false, error: 'Image must be 3MB or smaller.' },
          { status: 400 }
        );
      }
      const filename = `${nextSlug}-prize-${Date.now()}.${ext}`;
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await prizeImageFile.arrayBuffer());
      await writeFile(filepath, buffer);
      drawing.prize_image = `/uploads/drawings/${filename}`;
    }

    const drawingImageFile = formData.get('drawing_image');
    if (drawingImageFile && typeof drawingImageFile !== 'string' && 'arrayBuffer' in drawingImageFile && drawingImageFile.size > 0) {
      const ext = MIME_TO_EXT[drawingImageFile.type];
      if (!ext) {
        return NextResponse.json(
          { ok: false, error: 'Use JPEG, PNG, WEBP or GIF image.' },
          { status: 400 }
        );
      }
      if (drawingImageFile.size > MAX_BYTES) {
        return NextResponse.json(
          { ok: false, error: 'Image must be 3MB or smaller.' },
          { status: 400 }
        );
      }
      const filename = `${nextSlug}-drawing-${Date.now()}.${ext}`;
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await drawingImageFile.arrayBuffer());
      await writeFile(filepath, buffer);
      drawing.drawing_image = `/uploads/drawings/${filename}`;
    }
    if (!drawing.drawing_image) {
      return NextResponse.json({ ok: false, error: 'Drawing image is required.' }, { status: 400 });
    }
    if (!drawing.prize_image) {
      return NextResponse.json({ ok: false, error: 'Prize image is required.' }, { status: 400 });
    }

    await drawing.save();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('superadmin/drawings/[id] PATCH', e);
    return NextResponse.json({ ok: false, error: 'Failed to update drawing.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;
    await connectDB();

    const p = await params;
    const id = String(p?.id || '');
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid drawing id.' }, { status: 400 });
    }

    const deleted = await Drawing.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Drawing not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('superadmin/drawings/[id] DELETE', e);
    return NextResponse.json({ ok: false, error: 'Failed to delete drawing.' }, { status: 500 });
  }
}

