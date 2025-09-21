
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { embed, MODEL, openai } from '@/lib/openai';
import { SYSTEM_RULES, extractLead } from '@/lib/lead';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { botId, userText, externalUserId, channel = 'web' } = body || {};
  if (!botId || !userText) {
    return NextResponse.json({ error: 'botId and userText are required' }, { status: 400 });
  }

  // ודא שיש שיחה
  let conversationId = body?.conversationId;
  if (!conversationId) {
    const { data: conv, error: cErr } = await supabaseAdmin
      .from('conversations')
      .insert({ bot_id: botId, external_user_id: externalUserId || null, channel })
      .select().single();
    if (cErr || !conv) {
      return NextResponse.json({ error: cErr?.message || 'conversation error' }, { status: 400 });
    }
    conversationId = conv.id;
  }

  // שמור הודעת משתמש
  await supabaseAdmin.from('messages').insert({ conversation_id: conversationId, role: 'user', content: userText });

  // הגדרות בוט ומגבלת שימוש
  // שלוף tenant_id + top_k מהגדרות
  const { data: botRow } = await supabaseAdmin.from('bots').select('tenant_id').eq('id', botId).single();
  const { data: sRow } = await supabaseAdmin.from('bot_settings').select('top_k').eq('bot_id', botId).maybeSingle();
  const topK = Math.max(1, Math.min(12, (sRow?.top_k ?? 6)));

  // מזהה משתמש יציב
  const periodStart = new Date(); periodStart.setDate(1);
  const ps = periodStart.toISOString().slice(0,10);
  const uid = (externalUserId && String(externalUserId)) || 'anon';

  // הגדל מונה והחזר אם מחוץ למכסה
  try {
    const { data: ures, error: uerr } = await supabaseAdmin.rpc('inc_usage', {
      p_tenant_id: botRow?.tenant_id,
      p_bot_id: botId,
      p_external_user_id: uid,
      p_period_start: ps,
      p_limit: 10000
    });
    const row = Array.isArray(ures) ? ures[0] : ures;
    if (uerr) console.error('usage err', uerr?.message);
    if (row && row.allowed === false) {
      return NextResponse.json({ conversationId, text: 'הגעת למכסת 10,000 הודעות החודש. דבר/י איתנו לשדרוג.' });
    }
  } catch (e) {
    console.warn('usage check failed (ignoring for now)', e);
  }

  // קונטקסט: שלוף קטעים דומים
  const qVec = await embed(userText);
  const { data: matches, error: mErr } = await supabaseAdmin
    .rpc('match_chunks', { p_bot_id: botId, p_query_embedding: qVec, p_match_count: topK, p_min_similarity: 0.2 });
  if (mErr) {
    console.error('match error', mErr.message);
  }
  const context = (matches || []).map((m: any) => m.content).join('\n---\n');

  // פרומפט
  const system = SYSTEM_RULES;
  const user = `שאלה: ${userText}\n\nקונטקסט:\n${context || '(אין)'}\n\nענה תשובה שימושית אחת.`;

  // תשובה מה‑LLM
  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  });

  const text = res.choices[0]?.message?.content || 'מצטער, לא הצלחתי לענות כעת.';

  // שמור תשובת הבוט
  await supabaseAdmin.from('messages').insert({ conversation_id: conversationId, role: 'assistant', content: text });

  // נסה לחלץ lead
  const lead = extractLead(text);
  if (lead) {
    await supabaseAdmin.from('leads').insert({ bot_id: botId, name: lead.name, phone: lead.phone, email: lead.email, meta: lead as any });
  }

  return NextResponse.json({ conversationId, text, lead: lead || null });
}
