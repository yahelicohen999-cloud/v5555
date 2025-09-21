
'use client';
import { useEffect, useState } from 'react';

type Item = { id:number; q:string; a:string };

export default function PortalPage({ params }: { params: { tenant: string; bot: string } }) {
  const botId = params.bot;
  const tenantId = params.tenant;
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/qa/list?botId=${botId}`).then(r=>r.json());
    setItems(res.items || []);
    setLoading(false);
  }

  useEffect(()=>{ load(); }, [botId]);

  async function add() {
    if (!q.trim() || !a.trim()) return;
    await fetch('/api/qa/add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ botId, q, a }) });
    setQ(''); setA('');
    await load();
  }

  async function del(id:number) {
    await fetch('/api/qa/delete', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, botId }) });
    await load();
  }

  async function publish() {
    setPublishing(true); setMsg('');
    const res = await fetch('/api/qa/publish', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ botId, title: 'Q&A Publish' }) }).then(r=>r.json());
    setPublishing(false);
    if (res.ok) setMsg(`פורסם: ${res.items} פריטים → ${res.chunks} קטעים`);
    else setMsg(res.error || 'שגיאה בפרסום');
  }

  return (
    <div style={{fontFamily:'system-ui,Segoe UI,Arial', padding:20, maxWidth:900, margin:'0 auto'}}>
      <h1 style={{marginBottom:10}}>דשבורד לקוח · Q&A</h1>
      <div style={{marginBottom:20, color:'#666'}}>Tenant: <b>{tenantId}</b> · Bot: <b>{botId}</b></div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, alignItems:'start', marginBottom:12}}>
        <textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="שאלה…" rows={3} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8}}/>
        <textarea value={a} onChange={e=>setA(e.target.value)} placeholder="תשובה…" rows={3} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8}}/>
        <button onClick={add} style={{padding:'12px 14px', border:'1px solid #1a73e8', background:'#1a73e8', color:'#fff', borderRadius:8, height:48, marginTop:6}}>הוסף</button>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'16px 0'}}>
        <div>סה״כ: <b>{items.length}</b> פריטים</div>
        <button onClick={publish} disabled={publishing} style={{padding:'10px 14px', border:'1px solid #0a8f3a', background:'#0a8f3a', color:'#fff', borderRadius:8}}>
          {publishing ? 'מפרסם…' : 'פרסם לבוט (עדכן אמבדינגס)'}
        </button>
      </div>
      {msg && <div style={{marginBottom:12, color:'#0a8f3a'}}>{msg}</div>}

      <div style={{border:'1px solid #eee', borderRadius:10, overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead style={{background:'#fafafa'}}>
            <tr>
              <th style={{textAlign:'right', padding:10, borderBottom:'1px solid #eee'}}>#</th>
              <th style={{textAlign:'right', padding:10, borderBottom:'1px solid #eee'}}>שאלה</th>
              <th style={{textAlign:'right', padding:10, borderBottom:'1px solid #eee'}}>תשובה</th>
              <th style={{textAlign:'right', padding:10, borderBottom:'1px solid #eee'}}>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{padding:12}}>טוען…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} style={{padding:12}}>אין פריטים עדיין. הוסף למעלה ואז לחץ "פרסם".</td></tr>
            ) : items.map((it, idx) => (
              <tr key={it.id}>
                <td style={{padding:10, borderBottom:'1px solid #f1f1f1'}}>{it.id}</td>
                <td style={{padding:10, borderBottom:'1px solid #f1f1f1', whiteSpace:'pre-wrap'}}>{it.q}</td>
                <td style={{padding:10, borderBottom:'1px solid #f1f1f1', whiteSpace:'pre-wrap'}}>{it.a}</td>
                <td style={{padding:10, borderBottom:'1px solid #f1f1f1'}}>
                  <button onClick={()=>del(it.id)} style={{padding:'6px 10px', border:'1px solid #d9534f', background:'#d9534f', color:'#fff', borderRadius:8}}>מחק</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{marginTop:24, color:'#666'}}>
        <p><b>חשוב:</b> זהו דשבורד דמו ללא הזדהות. לשימוש פרודקשן יש להוסיף Auth והרשאות לפי Tenant.</p>
      </div>
    </div>
  );
}
