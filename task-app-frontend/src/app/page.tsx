'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase'; // 相対パスに変更

// タスクの型定義
type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  deadline: string | null;
  isAiGenerated: boolean;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 認証状態の確認とタスク取得
    const checkAuthAndFetchTasks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // 未ログインならログイン画面へリダイレクト
        window.location.href = '/login';
        return;
      }

      // ログイン済みならタスクを取得
      await fetchTasks();
    };

    checkAuthAndFetchTasks();
  }, []);

  // バックエンドAPIからタスクを取得する関数
  const fetchTasks = async () => {
    try {
      // バックエンドのURL (ポート5000) にリクエストを送信
      const response = await fetch('http://localhost:5000/api/tasks');
      if (!response.ok) throw new Error('タスクの取得に失敗しました');
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      // 開発中によくある、バックエンドサーバーが起動していない場合のエラーハンドリング
      alert('タスクの読み込みエラーが発生しました。バックエンドサーバー(ポート5000)は起動していますか？');
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">タスクダッシュボード</h1>
          <button 
            onClick={handleLogout}
            className="text-sm bg-white border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* タスク作成エリア (今回はプレースホルダーのみ、次回実装します) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">新しいタスクを追加</h2>
          <div className="p-4 border-2 border-dashed border-gray-200 rounded-md text-center text-gray-400">
            ここにタスク追加フォーム（CRUDのCreate）を実装します
          </div>
        </div>

        {/* タスク一覧エリア */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">タスク一覧</h2>
          
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">タスクがありません。最初のタスクを作成しましょう！</p>
          ) : (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li key={task.id} className="border border-gray-200 p-4 rounded-md hover:bg-gray-50 transition-colors flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg text-gray-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                    )}
                    
                    {/* タスクのメタ情報（優先度・AI生成フラグなど） */}
                    <div className="flex gap-2 mt-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      </span>
                      {task.isAiGenerated && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                          ✨ AIアシスト
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* アクションボタン */}
                  <button className="text-gray-400 hover:text-red-600 text-sm font-medium transition-colors p-2">
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}