
import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || '';
const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN || '';

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

async function sendMessage(psid: string, text: string) {
  const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: psid }, message: { text } })
  });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  try {
    const entry = data?.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging) return NextResponse.json({ ok: true });
    const senderId = messaging.sender?.id;
    const text = messaging.message?.text || '';
    // TODO: מפה יש לשייך ל-botId/tenant ולהשתמש ב-/api/chat
    await sendMessage(senderId, `קיבלתי: ${text.slice(0, 200)}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('messenger webhook error', e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
