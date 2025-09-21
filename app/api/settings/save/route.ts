
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const botId = body?.botId;
  if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 });

  const patch: any = {};
  const fields = ['welcome_text','cta_text','cta_url','rtl','badge','brand','brand_url','language','top_k'];
  for (const k of fields) if (k in body) patch[k] = body[k];
  patch.updated_at = new Date().toISOString();

  // upsert
  const { data, error } = await supabaseAdmin.from('bot_settings').upsert({ bot_id: botId, ...patch }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
