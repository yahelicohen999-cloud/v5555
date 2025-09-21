
export default function PortalLayout({ children, params }: any) {
  const tenant = params.tenant;
  const bot = params.bot;
  return (
    <div style={{fontFamily:'system-ui,Segoe UI,Arial', padding:20, maxWidth:1000, margin:'0 auto'}}>
      <h1 style={{marginBottom:6}}>דשבורד לקוח</h1>
      <div style={{marginBottom:16, color:'#666'}}>Tenant: <b>{tenant}</b> · Bot: <b>{bot}</b></div>
      <nav style={{display:'flex', gap:10, marginBottom:20}}>
        <a href={`/portal/${tenant}/${bot}`} style={{padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, textDecoration:'none'}}>Q&A</a>
        <a href={`/portal/${tenant}/${bot}/urls`} style={{padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, textDecoration:'none'}}>URLs</a>
        <a href={`/portal/${tenant}/${bot}/settings`} style={{padding:'8px 12px', border:'1px solid #1a73e8', background:'#1a73e8', color:'#fff', borderRadius:8, textDecoration:'none'}}>Settings</a>
      <a href={`/portal/${tenant}/${bot}/leads`} style={{padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, textDecoration:'none'}}>Leads</a>
      </nav>
      {children}
    </div>
  );
}
