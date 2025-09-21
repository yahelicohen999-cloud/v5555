
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { chunkText } from '@/lib/chunk';
import { embed } from '@/lib/openai';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { botId, type, title } = body;
  if (!botId || !type) {
    return NextResponse.json({ error: 'botId and type are required' }, { status: 400 });
  }

  // צור מקור
  const { data: source, error: sErr } = await supabaseAdmin
    .from('sources')
    .insert({ bot_id: botId, type, title: title || null })
    .select().single();

  if (sErr || !source) {
    return NextResponse.json({ error: sErr?.message || 'source error' }, { status: 400 });
  }

  let texts: string[] = [];

  if (type === 'text') {
    const content = (body?.content || '').toString();
    if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 });
    texts = chunkText(content, 1200);
  } else if (type === 'qa') {
    const items = Array.isArray(body?.items) ? body.items : [];
    const joined = items.map((it: any) => `שאלה: ${it.q}\nתשובה: ${it.a}`).join('\n---\n');
    texts = chunkText(joined, 1000);
  } else {
    return NextResponse.json({ error: 'unsupported type for demo (use text/qa)' }, { status: 400 });
  }

  // צור אמבדינג לכל קטע ושמור
  for (const t of texts) {
    const vec = await embed(t);
    const { error: cErr } = await supabaseAdmin
      .from('chunks')
      .insert({ bot_id: botId, source_id: source.id, content: t, embedding: vec as any });
    if (cErr) {
      console.error('chunk insert error', cErr.message);
    }
  }

  await supabaseAdmin.from('sources').update({ last_ingested_at: new Date().toISOString() }).eq('id', source.id);
  return NextResponse.json({ ok: true, chunks: texts.length, sourceId: source.id });
}
