import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 環境変数を確実に読み込む
dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// [Read] すべてのタスクを取得する API
// GET /api/tasks
// ==========================================
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }, // 新しい順に並び替え
    });
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'タスクの取得に失敗しました' });
  }
});

// ==========================================
// [Create] 新しいタスクを作成する API
// POST /api/tasks
// ==========================================
router.post('/', async (req: Request, res: Response) => {
  try {
    // フロントエンドから送られてくるデータを受け取る
    const { title, description, priority, deadline, isAiGenerated, userId, userEmail } = req.body;

    // Prisma側のUserテーブルにユーザーが存在するか確認
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // 存在しない場合（Supabase Authで登録されたばかりの場合）、Prisma側にもユーザーを作成
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: userEmail || 'unknown@example.com',
          password: 'supabase-auth-user', // 認証はSupabaseで行うためダミー
        }
      });
    }

    // タスクの作成処理
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        deadline: deadline ? new Date(deadline) : null,
        isAiGenerated: isAiGenerated || false,
        userId: user.id, // 確実に存在するユーザーIDを指定
      },
    });
    
    // 作成したタスクのデータをフロントエンドに返す
    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'タスクの作成に失敗しました' });
  }
});

// ==========================================
// [Update] 既存のタスクを更新する API
// PUT /api/tasks/:id
// ==========================================
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority, deadline, isAiGenerated } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        isAiGenerated,
      },
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'タスクの更新に失敗しました' });
  }
});

// ==========================================
// [Delete] 既存のタスクを削除する API
// DELETE /api/tasks/:id
// ==========================================
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({ message: 'タスクが正常に削除されました' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'タスクの削除に失敗しました' });
  }
});

export default router;