
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, botId } = body || {};
  if (!id || !botId) return NextResponse.json({ error: 'id, botId required' }, { status: 400 });
  const { error } = await supabaseAdmin.from('qa_items').delete().eq('id', id).eq('bot_id', botId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
