import { NextResponse } from 'next/server';
import { translateTexts } from '@/lib/i18n/translateDynamic';
import { isWebsiteLocale } from '@/lib/i18n/website-locales';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const texts = Array.isArray(body.texts) ? body.texts : [];
    const target = isWebsiteLocale(body.target) ? body.target : 'es';

    if (texts.length > 80) {
      return NextResponse.json(
        { ok: false, error: 'Too many texts in one request.' },
        { status: 400 }
      );
    }

    const translations = await translateTexts(texts, target);
    return NextResponse.json({ ok: true, translations });
  } catch (e) {
    console.error('website/translate POST', e);
    return NextResponse.json({ ok: false, error: 'Translation failed.' }, { status: 500 });
  }
}
