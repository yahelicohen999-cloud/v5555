
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');
  if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('qa_items').select('*').eq('bot_id', botId).order('id', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data || [] });
}
