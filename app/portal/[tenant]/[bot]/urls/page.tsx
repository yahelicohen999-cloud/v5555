
'use client';
import { useState } from 'react';

export default function UrlsPage({ params }: { params: { tenant: string; bot: string } }) {
  const botId = params.bot;
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function ingest() {
    if (!url.trim()) return;
    setBusy(true); setMsg('');
    const res = await fetch('/api/ingest/url', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ botId, url, title: title || undefined })
    }).then(r=>r.json());
    setBusy(false);
    if (res.ok) setMsg(`נבלעו ${res.chunks} קטעים מהכתובת`);
    else setMsg(res.error || 'שגיאה');
  }

  return (
    <div>
      <h2 style={{marginBottom:12}}>ייבוא תוכן מכתובת URL</h2>
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr auto', gap:8, alignItems:'start', marginBottom:12}}>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com/article" style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:8}}/>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="כותרת (לא חובה)" style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:8}}/>
        <button onClick={ingest} disabled={busy} style={{padding:'10px 14px', border:'1px solid #0a8f3a', background:'#0a8f3a', color:'#fff', borderRadius:8}}>
          {busy?'מייבא…':'ייבא'}
        </button>
      </div>
      {msg && <div style={{color:'#0a8f3a'}}>{msg}</div>}
      <p style={{marginTop:16, color:'#666'}}>המערכת תשלוף את תוכן הדף (טקסט), תחלק לקטעים ותכניס ל‑RAG.</p>
    </div>
  );
}
