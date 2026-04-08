import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==========================================
// [AI] 親タスクからサブタスクを自動生成する API
// POST /api/ai/generate-subtasks
// ==========================================
router.post('/generate-subtasks', async (req: Request, res: Response) => {
  try {
    const { taskTitle } = req.body;

    if (!taskTitle) {
      return res.status(400).json({ error: 'タスクのタイトルが必要です' });
    }

    // AIに指示するプロンプトを作成
    const prompt = `
以下のタスクを達成するための、具体的なサブタスク（小さなタスク）を3〜5個程度でリストアップしてください。
結果はプレーンなテキストで、各行に1つのサブタスクのみを書いてください。
箇条書きの記号（- や 1. など）は絶対に含めないでください。

親タスク: ${taskTitle}
`;

    // OpenAI APIを呼び出し
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo", // 汎用的で安価なモデルを使用
    });

    const resultText = completion.choices[0].message.content || "";
    
    // AIの返答（改行区切りのテキスト）を配列に変換し、不要な空白や空行を除去
    const subtasks = resultText
      .split('\n')
      .map(task => task.trim().replace(/^[-*・\d. ]+/, '')) // 行頭の不要な記号を念のため削除
      .filter(task => task.length > 0);

    // 生成したサブタスクの配列を返す
    res.status(200).json({ subtasks });
  } catch (error: any) {
    console.error('AI API Error:', error);
    res.status(500).json({ error: 'AIによるタスク生成に失敗しました' });
  }
});

export default router;