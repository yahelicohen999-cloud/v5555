'use client';
import { useEffect, useRef, useState } from 'react';

type Msg = { role:'user'|'assistant', text:string };

function qs(name:string){ return new URLSearchParams(window.location.search).get(name) }

export default function Widget() {
  const [botId, setBotId] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const userRef = useRef<string>('');

  // Theming / Branding / RTL via query or env
  const [rtl, setRtl] = useState<boolean>(true);
  const [brand, setBrand] = useState<string>(process.env.NEXT_PUBLIC_WIDGET_BRAND_NAME || process.env.WIDGET_BRAND_NAME || 'mini-fastbots');
  const [badgeOn, setBadgeOn] = useState<boolean>(true);
  const [brandUrl, setBrandUrl] = useState<string>('https://ycbots.com');

  useEffect(() => {
    // Load server settings
    async function loadSettings(bid:string){
      try{
        const r = await fetch('/api/settings/get?botId=' + bid);
        const js = await r.json();
        const settings = js?.settings || {};
        if (settings.brand) setBrand(settings.brand);
        if (settings.brand_url) setBrandUrl(settings.brand_url);
        if (settings.rtl !== undefined) setRtl(!!settings.rtl);
        if (settings.badge !== undefined) setBadgeOn(!!settings.badge);
        if (settings.welcome_text) {
          // show welcome once
          setMessages(m => (m.length===0 ? [{ role:'assistant', text: settings.welcome_text }] : m));
        }
      } catch {}
    }

    const sp = new URLSearchParams(window.location.search);
    const bid = sp.get('bot') || ''; setBotId(bid); if (bid) loadSettings(bid);
    setTenantId(sp.get('tenant') || '');

    const qRtl = sp.get('rtl');
    if (qRtl) setRtl(qRtl === '1' || qRtl.toLowerCase() === 'true');

    const qBrand = sp.get('brand'); if (qBrand) setBrand(qBrand);
    const qBrandUrl = sp.get('brandUrl'); if (qBrandUrl) setBrandUrl(qBrandUrl);
    const qBadge = sp.get('badge'); if (qBadge) setBadgeOn(qBadge === '1' || qBadge.toLowerCase() === 'true');

    // ensure stable uid
    try {
      let uid = localStorage.getItem('mfb_uid');
      if (!uid) { uid = (crypto && 'randomUUID' in crypto) ? crypto.randomUUID() : (Date.now()+'-'+Math.random()); localStorage.setItem('mfb_uid', uid); }
      userRef.current = userRef.current || uid;
    } catch {}

    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'identify' && ev.data?.payload?.email) {
        userRef.current = ev.data.payload.email;
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  async function send() {
    if (!input.trim() || !botId) return;
    const userText = input.trim();
    setMessages(m => [...m, { role:'user', text:userText }]);
    setInput('');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        botId, userText,
        conversationId: conversationId || undefined,
        externalUserId: userRef.current || undefined,
        channel: 'web'
      })
    }).then(r=>r.json());

    if (res.conversationId && !conversationId) setConversationId(res.conversationId);
    setMessages(m => [...m, { role:'assistant', text: res.text || '—' }]);
  }

  const dir = rtl ? 'rtl' : 'ltr';
  const align = (role:'user'|'assistant') => (rtl ? (role==='user'?'right':'left') : (role==='user'?'left':'right'));

  return (
    <div dir={dir} style={{fontFamily:'system-ui,Segoe UI,Arial', width:'100%', height:'100%', display:'flex', flexDirection:'column', background:'#fff', borderRadius:12, overflow:'hidden'}}>
      <div style={{padding:'10px 14px', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <b>{brand}</b>
        {badgeOn && <a href={brandUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:12, textDecoration:'none', color:'#1a73e8'}}>נבנה על ידי YC BOTS</a>}
      </div>

      <div style={{flex:1, overflowY:'auto', padding:'12px', background:'#fafafa'}}>
        {messages.map((m, i)=>(
          <div key={i} style={{marginBottom:10, textAlign: align(m.role)}}>
            <div style={{display:'inline-block', maxWidth:'85%', padding:'8px 10px', borderRadius:10, background: m.role==='user'?'#d0e8ff':'#fff', border:'1px solid #e3e3e3', whiteSpace:'pre-wrap'}}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'flex', gap:8, padding:10, borderTop:'1px solid #eee'}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') send() }}
          placeholder={rtl ? "כתוב הודעה…" : "Type a message…"}
          style={{flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:8, textAlign: rtl?'right':'left'}}
        />
        <button onClick={send} style={{padding:'10px 14px', border:'1px solid #1a73e8', background:'#1a73e8', color:'#fff', borderRadius:8}}>{rtl ? 'שלח' : 'Send'}</button>
      </div>
    </div>
  );
}
