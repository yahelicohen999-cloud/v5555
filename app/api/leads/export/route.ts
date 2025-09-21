
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');
  if (!botId) return new Response('botId required', { status: 400 });
  const { data, error } = await supabaseAdmin.from('leads').select('name, phone, email, created_at').eq('bot_id', botId).order('created_at', { ascending: false });
  if (error) return new Response(error.message, { status: 400 });
  const header = 'name,phone,email,created_at\n';
  const rows = (data || []).map((r:any)=>[r.name||'', r.phone||'', r.email||'', r.created_at||''].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const csv = header + rows + '\n';
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads.csv"'
    }
  });
}
