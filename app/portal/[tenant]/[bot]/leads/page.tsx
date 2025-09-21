
'use client';
import { useEffect, useState } from 'react';

type Lead = { id:string; name?:string; phone?:string; email?:string; created_at?:string };

export default function LeadsPage({ params }: { params: { tenant: string; bot: string } }) {
  const botId = params.bot;
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(){
    setLoading(true);
    const res = await fetch('/api/leads/list?botId=' + botId).then(r=>r.json());
    setItems(res.items || []);
    setLoading(false);
  }
  useEffect(()=>{ load(); }, [botId]);

  return (
    <div>
      <h2 style={{marginBottom:12}}>לידים</h2>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <div>סה״כ: <b>{items.length}</b></div>
        <a href={`/api/leads/export?botId=${botId}`} style={{padding:'8px 12px', border:'1px solid #1a73e8', background:'#1a73e8', color:'#fff', textDecoration:'none', borderRadius:8}}>ייצוא CSV</a>
      </div>

      <div style={{border:'1px solid #eee', borderRadius:10, overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead style={{background:'#fafafa'}}>
            <tr>
              <th style={{textAlign:'right', padding:10, borderBottom:'1px solid #eee'}}>שם</th>
              <th style={{textAlign:'right', padding:10, borderBottom:'1px solid #eee'}}>טלפון</th>
              <th style={{textAlign:'right', padding:10, borderBottom:'1px solid #eee'}}>אימייל</th>
              <th style={{textAlign:'right', padding:10, borderBottom:'1px solid #eee'}}>תאריך</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{padding:12}}>טוען…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} style={{padding:12}}>אין לידים עדיין.</td></tr>
            ) : items.map((it) => (
              <tr key={it.id}>
                <td style={{padding:10, borderBottom:'1px solid #f1f1f1'}}>{it.name || '-'}</td>
                <td style={{padding:10, borderBottom:'1px solid #f1f1f1'}}>{it.phone || '-'}</td>
                <td style={{padding:10, borderBottom:'1px solid #f1f1f1'}}>{it.email || '-'}</td>
                <td style={{padding:10, borderBottom:'1px solid #f1f1f1'}}>{it.created_at ? new Date(it.created_at).toLocaleString('he-IL') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
