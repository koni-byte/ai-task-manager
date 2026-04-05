import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェアの設定
app.use(cors()); // フロントエンドからのアクセスを許可
app.use(express.json()); // JSON形式のリクエストボディをパース

// テスト用ルート
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'サーバーは正常に稼働しています！' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});