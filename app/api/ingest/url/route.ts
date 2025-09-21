
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { chunkText } from '@/lib/chunk';
import { embed } from '@/lib/openai';

function stripHtml(html: string) {
  // Remove scripts/styles
  html = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Convert breaks/paras to newlines
  html = html.replace(/<(br|p|div|li|h\d)[^>]*>/gi, '\n');
  // Strip tags
  const text = html.replace(/<[^>]+>/g, ' ');
  // Collapse spaces
  return text.replace(/\s+/g, ' ').trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { botId, url, title } = body || {};
  if (!botId || !url) return NextResponse.json({ error: 'botId and url required' }, { status: 400 });

  // fetch the URL
  let html = '';
  try {
    const r = await fetch(url, { method:'GET' });
    if (!r.ok) throw new Error(`Fetch ${r.status}`);
    html = await r.text();
  } catch (e:any) {
    return NextResponse.json({ error: 'failed to fetch url: ' + (e?.message || '') }, { status: 400 });
  }

  const text = stripHtml(html);
  if (!text || text.length < 50) {
    return NextResponse.json({ error: 'url content too short or unreadable' }, { status: 400 });
  }

  const parts = chunkText(text, 1200);

  // create source
  const { data: source, error: sErr } = await supabaseAdmin
    .from('sources')
    .insert({ bot_id: botId, type:'url', title: title || url, uri: url })
    .select().single();
  if (sErr || !source) return NextResponse.json({ error: sErr?.message || 'source error' }, { status: 400 });

  let count = 0;
  for (const p of parts) {
    const vec = await embed(p);
    const { error: cErr } = await supabaseAdmin.from('chunks').insert({ bot_id: botId, source_id: source.id, content: p, embedding: vec as any });
    if (!cErr) count++;
  }
  await supabaseAdmin.from('sources').update({ last_ingested_at: new Date().toISOString() }).eq('id', source.id);

  return NextResponse.json({ ok: true, chunks: count, sourceId: source.id });
}
