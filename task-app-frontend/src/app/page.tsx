'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

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
  // タスク一覧と画面の状態
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const router = useRouter();

  // 新規タスク作成フォームの状態
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // 認証状態の確認とタスク取得
    const checkAuthAndFetchTasks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email);
      await fetchTasks();
    };

    checkAuthAndFetchTasks();
  }, [router]);

  // 【Read】バックエンドAPIからタスクを取得する関数
  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      if (!response.ok) throw new Error('タスクの取得に失敗しました');
      
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      alert('タスクの読み込みエラーが発生しました。バックエンドサーバー(ポート5000)は起動していますか？');
    } finally {
      setIsLoading(false);
    }
  };

  // 【Create】タスクを作成する関数
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !userId) return;

    setIsCreating(true);

    try {
      const response = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
          userId: userId,
          userEmail: userEmail,
          isAiGenerated: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `サーバーエラー (ステータスコード: ${response.status})`);
      }

      const createdTask = await response.json();
      setTasks([createdTask, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
    } catch (error: any) {
      console.error(error);
      alert(`タスクの作成中にエラーが発生しました。\n詳細: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // 【Delete】タスクを削除する関数
  const handleDeleteTask = async (id: string) => {
    // 間違えて消さないように確認ダイアログを出す
    if (!window.confirm('本当にこのタスクを削除しますか？')) return;

    try {
      // バックエンドのDELETE APIを呼び出す
      const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('タスクの削除に失敗しました');
      }

      // 成功したら、画面のタスク一覧（State）からも該当のタスクを取り除く
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error: any) {
      console.error(error);
      alert(`削除中にエラーが発生しました。\n詳細: ${error.message}`);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">タスクダッシュボード</h1>
          <button 
            onClick={handleLogout}
            className="text-sm bg-white border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* タスク作成エリア */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">新しいタスクを追加</h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">タイトル <span className="text-red-500">*</span></label>
              <input
                id="title"
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="例: 企画書を完成させる"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">詳細説明</label>
              <textarea
                id="description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="例: 明日の15時までに提出するため、データ分析を含めてまとめる。"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
              <select
                id="priority"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              >
                <option value="high">高 (High)</option>
                <option value="medium">中 (Medium)</option>
                <option value="low">低 (Low)</option>
              </select>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isCreating}
                className={`bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isCreating ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isCreating ? '作成中...' : 'タスクを作成'}
              </button>
            </div>
          </form>
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
                    <div className="flex gap-2 mt-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                  </div>
                  
                  {/* 削除ボタン */}
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-gray-400 hover:text-red-600 text-sm font-medium transition-colors p-2"
                  >
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