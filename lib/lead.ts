
export type Lead = { name?: string; phone?: string; email?: string; [k: string]: any };

// מחלץ בלוק JSON של lead מהודעת המודל אם קיים
export function extractLead(text: string): Lead | null {
  // חפש בלוק JSON בין תגיות מיוחדות
  const m = text.match(/<lead>([\s\S]*?)<\/lead>/i);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    return obj;
  } catch {
    return null;
  }
}

export const SYSTEM_RULES = `
ענה תמציתי, מדויק, ואמיתי. אם אין מידע בקונטקסט – אמור שלא ידוע.
שמור על עברית טבעית ללא סלנג.
כאשר המשתמש מביע כוונת התחלה ("יאללה מתחילים", "אני רוצה להזמין", "בוא נדבר"),
בקש שם מלא + טלפון בלבד. אם המשתמש נתן אותם, הוסף בסוף התשובה בלוק lead בפורמט:
<lead>{"name":"...","phone":"+972..","email":""}</lead>
אל תייצר lead אם אין כוונת התחלה ברורה.
`;
