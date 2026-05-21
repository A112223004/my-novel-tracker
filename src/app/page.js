'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  // --- 表單與書單狀態 ---
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', author: '', protagonist: '', category: '', status: '已完結', review: ''
  });
  const [message, setMessage] = useState('');
  const [novelList, setNovelList] = useState([]); // 儲存從資料庫撈出來的書單

  // --- 讀取書單功能 ---
  const fetchNovels = async () => {
    const { data, error } = await supabase
      .from('Liangyu')
      .select('*')
      .order('created_at', { ascending: false }); // 最新存入的排在最前面

    if (!error && data) {
      setNovelList(data);
    }
  };

  // 網頁一打開，就自動去撈書單
  useEffect(() => {
    fetchNovels();
  }, []);

  // --- 1. 觸發自動爬蟲功能 ---
  const handleScrape = async () => {
    if (!inputUrl) return alert('請先輸入半夏小說的網址！');
    setLoading(true);
    setMessage('正在為您去半夏小說抓取資料...');

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(inputUrl)}`);
      const data = await res.json();

      if (data.error) {
        setMessage('抓取失敗，請手動填寫。');
      } else {
        setFormData((prev) => ({
          ...prev,
          title: data.title,
          author: data.author,
          category: data.category,
          protagonist: data.protagonist
        }));
        setMessage('✨ 成功自動填入小說資料！');
      }
    } catch (err) {
      setMessage('連線出錯，請手動輸入。');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. 儲存到 Supabase 資料庫 ---
  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('正在存入資料庫...');

    const { data, error } = await supabase
      .from('Liangyu') 
      .insert([
        {
          title: formData.title,
          author: formData.author,
          protagonist: formData.protagonist,
          category: formData.category,
          status: formData.status,
          novel_url: inputUrl
        }
      ]);

    if (error) {
      console.error(error);
      setMessage(`❌ 儲存失敗: ${error.message}`);
    } else {
      setMessage('🎉 成功存入你的小說私房書單！');
      // 清空表單
      setFormData({ title: '', author: '', protagonist: '', category: '', status: '已完結', review: '' });
      setInputUrl('');
      // 重新讀取書單，讓新儲存的小說立刻出現在下方
      fetchNovels();
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 md:px-20">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* 表單區塊 */}
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">📚 我的私房小說紀錄館</h1>
          
          {message && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm text-center font-medium">
              {message}
            </div>
          )}

          {/* 區塊一：輸入網址 */}
          <div className="mb-8 p-4 bg-slate-100 rounded-lg">
            <label className="block text-sm font-semibold text-slate-700 mb-2">步驟 1：輸入半夏小說網址自動抓取</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="貼上網址，例如 https://www.xbanxia.cc/books/xxxx.html"
                className="flex-1 px-3 py-2 border rounded-lg text-slate-700 focus:outline-none"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
              />
              <button
                onClick={handleScrape}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition disabled:bg-blue-300"
              >
                {loading ? '讀取中...' : '自動抓取'}
              </button>
            </div>
          </div>

          {/* 區塊二：確認與填寫 */}
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-lg font-bold text-slate-700 border-b pb-2">步驟 2：確認資料並儲存</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">書名</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg text-slate-700" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">作者</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-lg text-slate-700" value={formData.author} onChange={(e) => setFormData({...formData, author: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">主角</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg text-slate-700" value={formData.protagonist} onChange={(e) => setFormData({...formData, protagonist: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">分類</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg text-slate-700" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">閱讀狀態</label>
              <select className="w-full px-3 py-2 border rounded-lg text-slate-700 bg-white" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="已完結">已完結 (全本看完)</option>
                <option value="追更中">追更中 (正在連載)</option>
                <option value="已棄書">已棄書 (看不下去)</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition shadow-md">
              💾 儲存此部小說到我的書單
            </button>
          </form>
        </div>

        {/* ✨ 新增區塊三：我的歷史私房書單展示 ✨ */}
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">📖 我的歷史私房書單 ({novelList.length} 本)</h2>
          
          {novelList.length === 0 ? (
            <p className="text-center text-slate-400 py-10">目前書單空空如也，快去上方抓取第一本小說吧！</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {novelList.map((novel) => (
                <div key={novel.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
                  <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-semibold ${
                    novel.status === '已完結' ? 'bg-green-100 text-green-700' : novel.status === '追更中' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {novel.status}
                  </span>
                  <h4 className="font-bold text-lg text-slate-800 pr-16 mb-1">{novel.title}</h4>
                  <p className="text-sm text-slate-500 mb-3">作者：{novel.author}</p>
                  <div className="flex flex-wrap gap-2 text-xs mb-4">
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">🏷️ {novel.category || '未分類'}</span>
                    <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded">👤 主角: {novel.protagonist || '未填寫'}</span>
                  </div>
                  {novel.novel_url && (
                    <a href={novel.novel_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1">
                      🔗 前往半夏小說原著 ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}