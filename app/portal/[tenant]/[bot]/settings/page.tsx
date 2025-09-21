
'use client';
import { useEffect, useState } from 'react';

type Settings = {
  welcome_text?: string|null;
  cta_text?: string|null;
  cta_url?: string|null;
  rtl?: boolean;
  badge?: boolean;
  brand?: string|null;
  brand_url?: string|null;
  language?: string|null;
  top_k?: number|null;
};

export default function SettingsPage({ params }: { params: { tenant: string; bot: string } }) {
  const botId = params.bot;
  const [s, setS] = useState<Settings>({ rtl: true, badge: true, brand:'mini-fastbots', brand_url:'https://ycbots.com', language:'he', top_k:6 });
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch(`/api/settings/get?botId=${botId}`).then(r=>r.json());
    if (res?.settings) setS({ ...s, ...res.settings });
  }
  useEffect(()=>{ load(); }, [botId]);

  async function save() {
    setMsg('');
    const res = await fetch('/api/settings/save', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ botId, ...s })
    }).then(r=>r.json());
    if (res?.settings) setMsg('נשמר ✓');
    else setMsg(res.error || 'שגיאה');
  }

  return (
    <div>
      <h2 style={{marginBottom:12}}>הגדרות בוט</h2>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div>
          <label>טקסט פתיח (ברכת שלום):</label>
          <textarea value={s.welcome_text || ''} onChange={e=>setS({ ...s, welcome_text:e.target.value })} rows={3} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8}}/>
        </div>
        <div>
          <label>CTA טקסט:</label>
          <input value={s.cta_text || ''} onChange={e=>setS({ ...s, cta_text:e.target.value })} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8}}/>
          <label style={{display:'block', marginTop:8}}>CTA קישור:</label>
          <input value={s.cta_url || ''} onChange={e=>setS({ ...s, cta_url:e.target.value })} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8}}/>
        </div>

        <div>
          <label>מותג (כותרת):</label>
          <input value={s.brand || ''} onChange={e=>setS({ ...s, brand:e.target.value })} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8}}/>
          <label style={{display:'block', marginTop:8}}>קישור מותג/Badge:</label>
          <input value={s.brand_url || ''} onChange={e=>setS({ ...s, brand_url:e.target.value })} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8}}/>
        </div>

        <div>
          <label>Top‑K (כמות קטעים לקונטקסט):</label>
          <input type="number" value={s.top_k || 6} onChange={e=>setS({ ...s, top_k: parseInt(e.target.value || '6', 10) })} style={{width:'100%', padding:10, border:'1px solid #ddd', borderRadius:8}}/>
          <div style={{marginTop:10, display:'flex', gap:14, alignItems:'center'}}>
            <label><input type="checkbox" checked={!!s.rtl} onChange={e=>setS({ ...s, rtl: e.target.checked })}/> RTL</label>
            <label><input type="checkbox" checked={!!s.badge} onChange={e=>setS({ ...s, badge: e.target.checked })}/> הצג "נבנה על ידי"</label>
          </div>
        </div>
      </div>

      <div style={{marginTop:16}}>
        <button onClick={save} style={{padding:'10px 14px', border:'1px solid #1a73e8', background:'#1a73e8', color:'#fff', borderRadius:8}}>שמור</button>
        {msg && <span style={{marginInlineStart:12, color:'#0a8f3a'}}>{msg}</span>}
      </div>

      <p style={{marginTop:18, color:'#666'}}>הגדרות אלו משפיעות על הווידג׳ט ועל אופן הבאת הקונטקסט (top‑k).</p>
    </div>
  );
}
