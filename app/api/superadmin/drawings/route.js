import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
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

function serializeDrawing(doc) {
  const d = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(d._id),
    title: d.title || '',
    slug: d.slug || '',
    description: d.description || '',
    prize_title: d.prize_title || '',
    prize_description: d.prize_description || '',
    prize_image: d.prize_image || '',
    reward_type: d.reward_type || 'physical',
    reward_token_id: d.reward_token_id ? String(d.reward_token_id) : '',
    reward_token_amount:
      d.reward_token_amount && typeof d.reward_token_amount.toString === 'function'
        ? d.reward_token_amount.toString()
        : String(d.reward_token_amount || '0'),
    entry_token_id: d.entry_token_id ? String(d.entry_token_id) : '',
    entry_cost:
      d.entry_cost && typeof d.entry_cost.toString === 'function'
        ? d.entry_cost.toString()
        : String(d.entry_cost || '0'),
    max_entries_per_user: d.max_entries_per_user ?? null,
    total_entries: Number(d.total_entries || 0),
    draw_date: d.draw_date ? new Date(d.draw_date).toISOString() : '',
    status: d.status || 'active',
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : '',
  };
}

export async function GET(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'superadmin') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const drawings = await Drawing.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      ok: true,
      drawings: drawings.map((d) => serializeDrawing(d)),
    });
  } catch (e) {
    console.error('superadmin/drawings GET', e);
    return NextResponse.json({ ok: false, error: 'Failed to fetch drawings.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await loadRequestActor(request);
    if ('error' in auth) return auth.error;
    if (auth.user?.role !== 'superadmin') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const prizeTitle = String(formData.get('prize_title') || '').trim();
    const prizeDescription = String(formData.get('prize_description') || '').trim();
    const rewardType = String(formData.get('reward_type') || 'physical').trim();
    const rewardTokenId = String(formData.get('reward_token_id') || '').trim();
    const rewardTokenAmount = String(formData.get('reward_token_amount') || '0').trim() || '0';
    const entryTokenId = String(formData.get('entry_token_id') || '').trim();
    const entryCost = String(formData.get('entry_cost') || '').trim();
    const totalEntriesRaw = String(formData.get('total_entries') || '0').trim();
    const drawDateRaw = String(formData.get('draw_date') || '').trim();
    const totalEntries = Number.parseInt(totalEntriesRaw || '0', 10);

    if (!title || !prizeTitle || !entryTokenId || !entryCost) {
      return NextResponse.json(
        { ok: false, error: 'Title, prize title, entry token and entry cost are required.' },
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

    const slug = slugify(title);
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Invalid slug/title.' }, { status: 400 });
    }

    const exists = await Drawing.exists({ slug });
    if (exists) {
      return NextResponse.json({ ok: false, error: 'Slug already exists.' }, { status: 409 });
    }

    let prizeImage = '';
    const file = formData.get('prize_image');
    if (file && typeof file !== 'string' && 'arrayBuffer' in file && file.size > 0) {
      const ext = MIME_TO_EXT[file.type];
      if (!ext) {
        return NextResponse.json(
          { ok: false, error: 'Use JPEG, PNG, WEBP or GIF image.' },
          { status: 400 }
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { ok: false, error: 'Image must be 3MB or smaller.' },
          { status: 400 }
        );
      }

      const filename = `${slug}-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'drawings');
      await mkdir(uploadDir, { recursive: true });
      const filepath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);
      prizeImage = `/uploads/drawings/${filename}`;
    }

    if (drawDateRaw) {
      const drawDate = new Date(drawDateRaw);
      if (Number.isNaN(drawDate.getTime()) || drawDate.getTime() <= Date.now()) {
        return NextResponse.json({ ok: false, error: 'Draw date must be in the future.' }, { status: 400 });
      }
    }

    const drawing = await Drawing.create({
      title,
      slug,
      description: description || null,
      prize_title: prizeTitle,
      prize_description: prizeDescription || null,
      prize_image: prizeImage || null,
      reward_type: rewardType,
      reward_token_id: rewardType === 'token' ? rewardTokenId : null,
      reward_token_amount: rewardTokenAmount,
      entry_token_id: entryTokenId,
      entry_cost: entryCost,
      max_entries_per_user: null,
      total_entries: totalEntries,
      draw_date: drawDateRaw ? new Date(drawDateRaw) : null,
      status: 'active',
      created_by: auth.userId,
    });

    return NextResponse.json({
      ok: true,
      drawing: serializeDrawing(drawing),
    });
  } catch (e) {
    console.error('superadmin/drawings POST', e);
    return NextResponse.json({ ok: false, error: 'Failed to create drawing.' }, { status: 500 });
  }
}

