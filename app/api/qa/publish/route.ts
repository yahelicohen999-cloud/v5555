
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { embed } from '@/lib/openai';
import { chunkText } from '@/lib/chunk';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { botId, title } = body || {};
  if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 });

  // fetch all QA items for bot
  const { data: items, error: iErr } = await supabaseAdmin.from('qa_items').select('q,a').eq('bot_id', botId).order('id', { ascending: true });
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });
  const list = items || [];
  const joined = list.map((it:any) => `שאלה: ${it.q}
תשובה: ${it.a}`).join('\n---\n');
  const texts = chunkText(joined, 1000);

  // create new source
  const { data: source, error: sErr } = await supabaseAdmin
    .from('sources')
    .insert({ bot_id: botId, type: 'qa', title: title || 'Q&A Publish' })
    .select().single();
  if (sErr || !source) return NextResponse.json({ error: sErr?.message || 'source error' }, { status: 400 });

  // embed & insert chunks
  let count = 0;
  for (const t of texts) {
    const vec = await embed(t);
    const { error: cErr } = await supabaseAdmin.from('chunks').insert({ bot_id: botId, source_id: source.id, content: t, embedding: vec as any });
    if (!cErr) count += 1;
  }
  await supabaseAdmin.from('sources').update({ last_ingested_at: new Date().toISOString() }).eq('id', source.id);

  return NextResponse.json({ ok: true, chunks: count, sourceId: source.id, items: list.length });
}
