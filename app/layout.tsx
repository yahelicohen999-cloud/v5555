
export const metadata = { title: 'mini-fastbots', description: 'RAG multi-tenant demo' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl"><body style={{margin:0}}>{children}</body></html>
  );
}
