import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

// .envファイルを確実に読み込む
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});