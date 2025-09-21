
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { botId, q, a } = body || {};
  if (!botId || !q || !a) return NextResponse.json({ error: 'botId, q, a required' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('qa_items').insert({ bot_id: botId, q, a }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
