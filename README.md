
# mini-fastbots (MVP)

מיני-פלטפורמה לבניית צ'אטבוטים מרובי-דיירים (Multi‑Tenant) עם RAG, ווידג'ט להטמעה באתר, ודוגמת Webhook ל‑WhatsApp.

## טכנולוגיות
- Next.js (App Router) – API + דשבורד + ווידג'ט
- Supabase (Postgres + pgvector + Storage + Auth אופציונלי)
- OpenAI (Embeddings + Completion)
- WhatsApp Cloud API (אופציונלי)

---

## התקנה מהירה (10 צעדים)
1) פתח פרויקט ב‑Supabase והפעל הרחבה `vector`.
2) הפעל את הסכמה: `schema.sql` (ב‑SQL Editor של Supabase).
3) שכפל קובץ `.env.example` אל `.env.local` ומלא משתנים (ראה למטה).
4) התקן חבילות: `npm i`
5) הרץ לוקאלית: `npm run dev`
6) צור Tenant ובוט התחלתיים: `POST /api/bootstrapTenant` (דוגמה ב‑README בהמשך).
7) הוסף מקור ידע (טקסט/QA) דרך `POST /api/ingest`
8) בדוק שיחה ב‑`http://localhost:3000/widget?bot=<BOT_ID>&tenant=<TENANT_ID>`
9) להטמעה באתר לקוח, השתמשו ב‑`public/embed-snippet.html` (או העתקו את הסקריפט ל‑Wix HTML Embed).
10) (אופציונלי) חברו וואטסאפ: הגדירו Webhook ל‑`/api/whatsapp`, הזינו VERIFY TOKEN, והדביקו את ה‑URL ב‑Meta.

### משתני סביבה
ראה `.env.example`. חובה למלא:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (משמש ב‑API בלבד! לא בצד לקוח)
- (וואטסאפ) `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`

---

## API חשובים (דוגמה ב‑curl)

### 1) Bootstrap Tenant + Bot
```bash
curl -X POST http://localhost:3000/api/bootstrapTenant   -H "Content-Type: application/json"   -d '{
    "tenantName": "YC Solutions",
    "botName": "YC Support Bot"
  }'
# תשובה לדוגמה:
# { "tenantId":"...", "botId":"..." }
```

### 2) Ingest (טקסט חופשי)
```bash
curl -X POST http://localhost:3000/api/ingest   -H "Content-Type: application/json"   -d '{
    "botId": "<BOT_ID>",
    "type": "text",
    "title": "מדיניות שירות",
    "content": "כאן הטקסט הארוך..."
  }'
```

### 3) Ingest (Q&A)
```bash
curl -X POST http://localhost:3000/api/ingest   -H "Content-Type: application/json"   -d '{
    "botId": "<BOT_ID>",
    "type": "qa",
    "title": "שאלות נפוצות",
    "items": [
      { "q":"מה המחיר?", "a":"600 ₪ לחודש." },
      { "q":"איך מתחילים?", "a":"ממלאים פרטים ונחזור אליך." }
    ]
  }'
```

### 4) Chat
```bash
curl -X POST http://localhost:3000/api/chat   -H "Content-Type: application/json"   -d '{
    "botId":"<BOT_ID>",
    "externalUserId":"demo-user-1",
    "userText":"כמה עולה?",
    "channel":"web"
  }'
```

---

## הטמעה באתר (Wix / כל אתר)
פתחו את `public/embed-snippet.html`, העתיקו את הסקריפט והדביקו באלמנט HTML Embed.
שנו את ה‑`TENANT_ID` וה‑`BOT_ID` שתקבלו בשלב ה‑Bootstrap.

---

## קבצים חשובים
- `schema.sql` – טבלאות + פונקציית דמיון pgvector
- `app/api/ingest/route.ts` – אינג'סט טקסט/Q&A + יצירת אמבדינגס
- `app/api/chat/route.ts` – RAG + תשובה מה‑LLM + שמירת שיחה
- `app/widget/page.tsx` – UI בסיסי לצ'אט בתוך iframe
- `public/embed-snippet.html` – קוד הטמעה לאתר לקוח
- `app/api/whatsapp/route.ts` – דוגמת Webhook (אימות + מענה)

---

## שאלות נפוצות
- **אבטחה והרשאות**: בדמו זה אין אימות משתמשים מלא. ל‑Production מומלץ לחבר Supabase Auth/Clerk ולכפות RBAC לפי tenant_id.
- **Lead Capture**: ה‑System Prompt מכיל כללים; אם המודל מזהה כוונת התחלה, הוא יכול להחזיר בלוק JSON של `lead` בתשובה. ראה `lead.ts`.
- **מחיר ריצה**: ניטור צריכת טוקנים אינו נכלל בדמו; הוסיפו לוגים/טבלת usage לפי הצורך.


## דשבורד לקוח (Portal Q&A)
פתחו: `/portal/<TENANT_ID>/<BOT_ID>`
- הלקוח מוסיף/מוחק שאלות–תשובות בטבלה
- לוחץ "פרסם" → נבנה מקור ידע חדש ומחושבים אמבדינגס (RAG)
- חשוב: אין Auth בדמו. לפרודקשן הוסיפו Supabase Auth/Clerk והגבילו לפי tenant_id.

### API לדשבורד
- `GET /api/qa/list?botId=...`
- `POST /api/qa/add`  body: `{ botId, q, a }`
- `POST /api/qa/delete` body: `{ id, botId }`
- `POST /api/qa/publish` body: `{ botId, title? }`


## RTL + Badge ("נבנה על ידי YC BOTS")
- הווידג'ט תומך ב-RTL ותגית מיתוג כברירת מחדל.
- ניתן לשלוט דרך פרמטרים ב-URL:
  - `rtl=1|0` – יישור ימין/שמאל
  - `badge=1|0` – הצגת "נבנה על ידי"
  - `brand=...` – שם המותג בכותרת
  - `brandUrl=...` – קישור הכותרת/תגית
- בדוגמת ההטמעה (`public/embed-snippet.html`) כבר מוגדרים: `rtl=1`, `badge=1`, `brand=YC BOTS`, `brandUrl=https://ycbots.com`.


## דשבורד · Settings + URL Ingest
- Settings: `/portal/<TENANT>/<BOT>/settings` – ברכת פתיח, CTA, RTL, Badge, Brand, Top‑K
- URLs: `/portal/<TENANT>/<BOT>/urls` – הדבק כתובת עמוד → המערכת תשלוף טקסט ותעדכן RAG

### API חדשים
- `GET /api/settings/get?botId=...`
- `POST /api/settings/save` body: `{ botId, welcome_text?, cta_text?, cta_url?, rtl?, badge?, brand?, brand_url?, language?, top_k? }`
- `POST /api/ingest/url` body: `{ botId, url, title? }`


# Production Plan (Checklist)

## Phase A — Infra & Security
- [ ] Supabase: הרץ `schema.sql` (כולל usage_limits, bot_settings channels, RPC `inc_usage`)
- [ ] Env Vars ב‑Vercel: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_WIDGET_BRAND_NAME`, (וואטסאפ/מסנג'ר).
- [ ] (אופציונלי) הפעל RLS + Auth (Supabase Auth) והוסף RBAC לפי `tenant_id`.

## Phase B — Client Portal
- [ ] Q&A + Publish (קיים)
- [ ] URLs (קיים)
- [ ] Settings (קיים) — כולל RTL/Brand/Badge/Top‑K/CTA
- [ ] Leads (חדש) — צפייה + Export CSV
- [ ] Quota 10K/msg/user/month (קיים) — דרך RPC `inc_usage` + UID יציב בווידג׳ט

## Phase C — Channels
- [ ] Widget/Web (ברירת מחדל) — הטמעה ב‑Wix באמצעות `public/embed-snippet.html`
- [ ] WhatsApp Cloud API — קבע VERIFY/ACCESS TOKENS + מיפוי ל‑bot/tenant והעבר לשימוש ב‑/api/chat
- [ ] Messenger — קבע VERIFY/ACCESS TOKEN + מיפוי ל‑bot/tenant

## Notes
- מזהה משתמש יציב: הווידג׳ט יוצר `localStorage.mfb_uid` אוטומטית ומוסר ל‑/api/chat.
- המודל מוגדר כ‑`gpt-4o-mini` כברירת מחדל; ניתן לשנות ב‑`.env` ל‑gpt‑4.1‑mini.

