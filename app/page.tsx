// app/page.tsx
"use client";
import { useState } from "react";

export default function FashionGenerator() {
  // 核心状态
  const [activeTab, setActiveTab] = useState("generate"); // 'generate' 或 'history'
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 生成大片专属状态
  const [file, setFile] = useState<File | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [gender, setGender] = useState(""); 
  const [age, setAge] = useState("");
  const [resultImage, setResultImage] = useState("");

  // 历史记录专属状态
  const [historyList, setHistoryList] = useState<any[]>([]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = (error) => reject(error);
    });
  };

  // 🚀 发起生成请求
  const handleGenerate = async () => {
    if (!token) return setMessage("请输入你的 Token");
    if (!file) return setMessage("请上传衣服图片");

    setLoading(true);
    setMessage("正在生成，请耐心等待...");
    setResultImage("");

    try {
      const base64Image = await convertToBase64(file); 
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 加上我们新增的 gender 和 age
        body: JSON.stringify({ tokenKey: token, imageBase64: base64Image, userPrompt, gender, age }),
      });

      const data = await response.json();
      if (response.ok) {
        setResultImage(data.imageUrl);
        setMessage(`✨ 生成成功！该 Token 剩余次数: ${data.remainingQuota}`);
      } else {
        setMessage(`错误: ${data.error}`);
      }
    } catch (err) {
      setMessage("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 📖 查询历史记录
  const handleFetchHistory = async () => {
    if (!token) return setMessage("请先输入 Token 再查询历史");
    
    setLoading(true);
    setMessage("正在查询...");
    
    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenKey: token }),
      });

      const data = await response.json();
      if (response.ok) {
        setHistoryList(data.history);
        setMessage(`查询成功！该 Token 剩余次数: ${data.remainingQuota}`);
      } else {
        setMessage(`错误: ${data.error}`);
      }
    } catch (err) {
      setMessage("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8 text-amber-500">AI Fashion Studio</h1>
      
      <div className="w-full max-w-2xl bg-neutral-800 p-6 rounded-xl shadow-lg">
        
        {/* 全局 Token 输入框 (无论是生成还是查历史都需要它) */}
        <div className="mb-6 border-b border-neutral-700 pb-6">
          <label className="block text-sm font-medium mb-1">使用凭证 (Token) <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder="例如: HORSE-2026-ABCD" 
            className="w-full p-3 rounded bg-neutral-900 border border-neutral-600 focus:border-amber-500 outline-none text-lg tracking-widest uppercase font-mono"
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
          />
        </div>

        {/* 导航选项卡 */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab("generate")}
            className={`flex-1 py-2 rounded font-bold transition ${activeTab === "generate" ? "bg-amber-500 text-black" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
          >
            📸 生图V3
          </button>
          <button 
            onClick={() => { setActiveTab("history"); handleFetchHistory(); }}
            className={`flex-1 py-2 rounded font-bold transition ${activeTab === "history" ? "bg-amber-500 text-black" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"}`}
          >
            🗂️ 生成历史
          </button>
        </div>

        {/* 状态提示信息 */}
        {message && <p className="text-center font-medium text-amber-300 mb-6 bg-amber-900/30 py-2 rounded">{message}</p>}

        {/* =========================================
            视图 1：生成大片
        ========================================= */}
        {activeTab === "generate" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 模特性别 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-400">模特性别 (可选)</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 outline-none"
                >
                  <option value="">-- 随机/默认 --</option>
                  <option value="male">男性 (Male)</option>
                  <option value="female">女性 (Female)</option>
                  <option value="androgynous">中性 (Androgynous)</option>
                </select>
              </div>

              {/* 模特年龄 */}
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-400">模特年龄 (可选)</label>
                <select 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 outline-none"
                >
                  <option value="">-- 随机/默认 --</option>
                  <option value="child">儿童 (Child)</option>
                  <option value="teenager">青少年 (Teenager)</option>
                  <option value="young adult">青年 (Young Adult)</option>
                  <option value="middle-aged">中年 (Middle-aged)</option>
                  <option value="elderly">老年 (Elderly)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-400">场景附加要求 (可选，英文更佳)</label>
              <input 
                type="text" 
                placeholder="e.g. standing on a sunny beach, wearing sunglasses" 
                className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 outline-none"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-400">上传衣物图片 <span className="text-red-500">*</span></label>
              <input 
                type="file" accept="image/*"
                className="w-full p-2 text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-600 file:text-white hover:file:bg-neutral-500 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <button 
              onClick={handleGenerate} disabled={loading}
              className="w-full bg-amber-500 text-black font-bold py-4 rounded text-lg hover:bg-amber-400 transition disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              {loading ? "" : "一键穿衣生成"}
            </button>

            {resultImage && (
              <div className="mt-8 flex flex-col items-center animate-fade-in">
                <p className="mb-4 font-bold text-green-400">✨ 最终成片：</p>
                <img src={resultImage} alt="Generated" className="max-w-full h-auto rounded-lg shadow-2xl border border-neutral-700" />
              </div>
            )}
          </div>
        )}

        {/* =========================================
            视图 2：历史记录画廊
        ========================================= */}
        {activeTab === "history" && (
          <div className="mt-4">
            {historyList.length === 0 && !loading ? (
              <div className="text-center text-neutral-500 py-10">
                这里空空如也，快去创作你的第一张大片吧！
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {historyList.map((item, index) => (
                  <div key={item.id} className="relative group overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900">
                    {/* 直接显示 URL 对应的图片 */}
                    <img src={item.url} alt={`History ${index}`} className="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />
                    {/* 悬浮显示生成时间 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs text-white p-2 translate-y-full group-hover:translate-y-0 transition">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}