
export function chunkText(text: string, maxLen = 1200): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  const parts: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + maxLen, clean.length);
    // נסה לחתוך על פי נקודה/פסיק/שורה
    const slice = clean.slice(i, end);
    const lastBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('\n'));
    if (lastBreak > maxLen * 0.6) {
      end = i + lastBreak + 1;
    }
    parts.push(clean.slice(i, end));
    i = end;
  }
  return parts.filter(Boolean);
}
