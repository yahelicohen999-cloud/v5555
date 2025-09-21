
export default function Home() {
  return (
    <div style={{fontFamily:'system-ui,Segoe UI,Arial', padding:24}}>
      <h1>mini-fastbots</h1>
      <p>ברוך הבא. זהו דמו: API ל‑Ingest/Chat + ווידג'ט להטמעה + Webhook וואטסאפ.</p>
      <ol>
        <li>צרו Tenant + Bot דרך <code>POST /api/bootstrapTenant</code></li>
        <li>הזינו ידע דרך <code>POST /api/ingest</code></li>
        <li>פתחו את הווידג'ט ב-<code>/widget?tenant=...&bot=...</code></li>
      </ol>
    </div>
  );
}
