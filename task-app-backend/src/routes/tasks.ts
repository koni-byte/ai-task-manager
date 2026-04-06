import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 環境変数を確実に読み込む
dotenv.config();

const router = express.Router();

// Prisma 6 の仕様に合わせて、シンプルに初期化します（自動で .env と schema.prisma を読み込みます）
const prisma = new PrismaClient();

// ==========================================
// [Read] すべてのタスクを取得する API
// GET /api/tasks
// ==========================================
router.get('/', async (req: Request, res: Response) => {
  try {
    // 本当はここで認証情報（userId）を受け取って、そのユーザーのタスクだけを返す必要がありますが、
    // まずは動作確認のため「全タスク」を取得するシンプルな形にします。
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
    // フロントエンドから送られてくるデータ（req.body）を受け取る
    const { title, description, priority, deadline, isAiGenerated, userId } = req.body;

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium', // 指定がなければ medium
        deadline: deadline ? new Date(deadline) : null,
        isAiGenerated: isAiGenerated || false,
        userId, // フロントエンドから送られてきたユーザーIDを紐付け
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
    const { id } = req.params; // URLからタスクのIDを取得
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
    const { id } = req.params; // URLからタスクのIDを取得

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