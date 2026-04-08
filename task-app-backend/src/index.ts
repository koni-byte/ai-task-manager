import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// 新しく作成するタスク用ルーターをインポート
import taskRoutes from './routes/tasks';
// AI用ルーターをインポート
import aiRoutes from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ヘルスチェック用ルート
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'サーバーは正常に稼働しています！' });
});

// タスク関連のAPIルートを設定 (/api/tasks 以下のリクエストは taskRoutes が処理する)
app.use('/api/tasks', taskRoutes);

// AI関連のAPIルートを設定 (/api/ai 以下のリクエストは aiRoutes が処理する)
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});