import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. 新しく作成したタスク用ルーターをインポート
import taskRoutes from './routes/tasks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ヘルスチェック用ルート
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'サーバーは正常に稼働しています！' });
});

// 2. タスク関連のAPIルートを設定 (/api/tasks 以下のリクエストは taskRoutes に任せる)
app.use('/api/tasks', taskRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});