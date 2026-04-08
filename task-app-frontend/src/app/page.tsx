"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Send, Bot, User, Loader2, Sparkles, Trash2, ListTodo } from 'lucide-react';

// ==========================================
// ⚠️ ローカル環境との通信設定
// あなたのバックエンドのURLに合わせて変更してください
// ==========================================
const API_BASE_URL = 'http://localhost:5000/api';

// 💡 TypeScriptのエラーを解消するための型定義を追加
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Message {
  role: 'ai' | 'user';
  content: string;
}

export default function Page() {
  // 💡 画面切り替え用のステート ('tasks' または 'chat')
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');

  // タスク用のステート (💡 ジェネリクス <Task[]> を追加して型を指定)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isFetchingTasks, setIsFetchingTasks] = useState(false);

  // AIチャット用のステート (💡 ジェネリクス <Message[]> を追加して型を指定)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'こんにちは！タスクの整理やアイデア出しなど、何でもサポートしますよ！' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null); // 💡 refにも型を追加

  // ------------------------------------------
  // 📝 タスク関連の処理
  // ------------------------------------------
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsFetchingTasks(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`);
      if (!res.ok) throw new Error('APIリクエストに失敗しました');
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("タスクの取得に失敗しました:", error);
    } finally {
      setIsFetchingTasks(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const tempId = Date.now().toString(); // PrismaのID(UUID等)に合わせるため一旦文字列化
    const newTask: Task = { id: tempId, title: newTaskTitle, completed: false };
    setTasks(prev => [newTask, ...prev]); // 新しいものを上に
    setNewTaskTitle('');

    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // userId等はご自身の環境に合わせて適宜追加してください
        body: JSON.stringify({ title: newTaskTitle, userId: 'dummy-user-id' }) 
      });
      if (!res.ok) throw new Error('追加に失敗しました');
      
      const addedTask = await res.json();
      setTasks(prev => prev.map(t => t.id === tempId ? addedTask : t));
    } catch (error) {
      console.error("タスクの追加に失敗しました:", error);
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const taskToToggle = tasks.find(t => t.id === taskId);
    if (!taskToToggle) return;

    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !taskToToggle.completed })
      });
      if (!res.ok) throw new Error('更新に失敗しました');
    } catch (error) {
      console.error("タスクの更新に失敗しました:", error);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: taskToToggle.completed } : t));
    }
  };

  const deleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('削除に失敗しました');
    } catch (error) {
      console.error("タスクの削除に失敗しました:", error);
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete]);
      }
    }
  };

  // ------------------------------------------
  // 🤖 AIチャット関連の処理
  // ------------------------------------------
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, currentTasks: tasks })
      });
      
      if (!res.ok) throw new Error('AIとの通信に失敗しました');
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      console.error("AI APIエラー:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'エラーが発生しました。バックエンドAPIが起動しているか確認してください。' 
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // ------------------------------------------
  // 🎨 UI レンダリング
  // ------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8 font-sans flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col h-[90vh]">
        
        {/* 💡 画面上部のタブナビゲーション */}
        <div className="flex bg-white rounded-2xl p-1.5 mb-4 shadow-sm border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'tasks' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ListTodo className="w-5 h-5" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'chat' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bot className="w-5 h-5" />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* コンテンツ表示エリア */}
        <div className="flex-1 relative overflow-hidden">
          
          {/* ============================== */}
          {/* タスク管理画面 */}
          {/* ============================== */}
          {activeTab === 'tasks' && (
            <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-5 border-b border-slate-100 bg-white shrink-0">
                <h1 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  My Tasks
                </h1>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50">
                {isFetchingTasks ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center text-slate-400 mt-10">
                    タスクはまだありません。
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {tasks.map((task) => (
                      <li 
                        key={task.id} 
                        className={`group flex items-center justify-between p-4 rounded-xl bg-white border transition-all duration-200 shadow-sm ${task.completed ? 'border-slate-200 opacity-60' : 'border-indigo-100 hover:border-indigo-300'}`}
                      >
                        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleTaskCompletion(task.id)}>
                          <button className="text-indigo-500 transition-transform active:scale-90 shrink-0">
                            {task.completed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Circle className="w-6 h-6 text-slate-300" />}
                          </button>
                          <span className={`text-base sm:text-lg transition-all break-all ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                            {task.title}
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteTask(task.id)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-opacity shrink-0"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="新しいタスクを入力..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!newTaskTitle.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 sm:px-5 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">追加</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ============================== */}
          {/* AIアシスタント画面 */}
          {/* ============================== */}
          {activeTab === 'chat' && (
            <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-5 border-b border-slate-100 bg-indigo-50/50 shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  AI Assistant
                </h2>
              </div>

              <div 
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50"
              >
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600 shadow-sm'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="flex items-start gap-3">
                     <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-indigo-600 shadow-sm flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex gap-1 items-center">
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="AIに相談する..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isAiTyping}
                  />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim() || isAiTyping}
                    className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white p-3 px-4 rounded-xl transition-colors flex items-center justify-center shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}