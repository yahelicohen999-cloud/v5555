
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tenantName = (body?.tenantName || 'New Tenant').toString();
  const botName = (body?.botName || 'New Bot').toString();

  const { data: tenant, error: tErr } = await supabaseAdmin
    .from('tenants').insert({ name: tenantName }).select().single();

  if (tErr || !tenant) {
    return NextResponse.json({ error: tErr?.message || 'tenant error' }, { status: 400 });
  }

  const { data: bot, error: bErr } = await supabaseAdmin
    .from('bots').insert({ tenant_id: tenant.id, name: botName }).select().single();

  if (bErr || !bot) {
    return NextResponse.json({ error: bErr?.message || 'bot error' }, { status: 400 });
  }

  return NextResponse.json({ tenantId: tenant.id, botId: bot.id });
}
