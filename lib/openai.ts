
import OpenAI from 'openai';

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const MODEL = process.env.MODEL_NAME || 'gpt-4o-mini';

export async function embed(text: string) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text
  });
  return res.data[0].embedding;
}
