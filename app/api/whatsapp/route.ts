
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { embed, openai, MODEL } from '@/lib/openai';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

async function sendWhatsApp(to: string, text: string) {
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  };
  await fetch('https://graph.facebook.com/v20.0/me/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  try {
    const entry = data?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg = value?.messages?.[0];
    if (!msg) return NextResponse.json({ ok: true });

    const from = msg.from;
    const text = msg.text?.body || '';

    // כאן אפשר לשייך botId לפי מספר הוואטסאפ/tenant כלשהו. בדמו – נחזיר תשובת Echo קצרה.
    const reply = `🚀 קיבלתי: ${text.slice(0, 200)}`;
    await sendWhatsApp(from, reply);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('whatsapp webhook error', e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
