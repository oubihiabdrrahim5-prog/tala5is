import React, { useState, useEffect, useCallback } from "react";
import { User, FeedbackEntry, AppMessage } from "../types";

const DashboardView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [activeTab, setActiveTab] = useState<
    "stats" | "users" | "feedback" | "messages"
  >("stats");

  // Delete Users
  const deleteUser = (email: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;

    const updatedUsers = users.filter((u) => u.email !== email);
    setUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  };

  // Message Form State
  const [msgTarget, setMsgTarget] = useState<"all" | string>("all");
  const [msgContent, setMsgContent] = useState("");

  const OWNER_EMAIL = "abdooubi@gmail.com".toLowerCase().trim();
  const USERS_KEY = "smart_summarizer_users";
  const FEEDBACK_KEY = "talakhisi_feedback";
  const MSG_KEY = "talakhisi_app_messages";

  /* ================= DATA ================= */

  const getFreshUsers = (): User[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const loadAllData = useCallback(() => {
    setUsers(getFreshUsers());
    setFeedback(JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]"));
    setMessages(JSON.parse(localStorage.getItem(MSG_KEY) || "[]"));
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  /* ================= ACTIONS ================= */

  const deleteFeedback = (id: string) => {
    const updated = feedback.filter((f) => f.id !== id);
    setFeedback(updated);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!msgContent.trim()) return;

    const newMessage: AppMessage = {
      id: crypto.randomUUID(),
      to: msgTarget,
      content: msgContent,
      type: msgTarget === "all" ? "broadcast" : "private",
      date: new Date().toLocaleString("ar-MA"),
    };

    const updatedMessages = [newMessage, ...messages];
    setMessages(updatedMessages);
    localStorage.setItem(MSG_KEY, JSON.stringify(updatedMessages));

    setMsgContent("");
    setMsgTarget("all");
  };

  const deleteMessage = (id: string) => {
    const updated = messages.filter((m) => m.id !== id);
    setMessages(updated);
    localStorage.setItem(MSG_KEY, JSON.stringify(updated));
  };

  // Scrool
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-14">
        <div>
          <h2 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <span className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
              🛡️
            </span>
            إدارة المنصة
          </h2>
          <p className="text-slate-500 font-bold text-lg">
            التحكم في المستخدمين، المقترحات والمراسلات
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          {[
            {
              id: "stats",
              label: "الإحصائيات",
              icon: (
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
              ),
            },
            {
              id: "users",
              label: "المستخدمين",
              icon: (
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              ),
            },
            {
              id: "feedback",
              label: "المقترحات",
              icon: (
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              ),
            },
            {
              id: "messages",
              label: "المراسلات",
              icon: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-3
                ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow ring-1 ring-slate-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                {tab.icon}
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="space-y-12">
        {/* ================= STATS ================= */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="المجتمع"
              value={users.filter((u) => u.role === "admin").length}
              color="blue"
              icon="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM6 14a6 6 0 0 0 12 0v-2H6v2Z"
            />
            <StatCard
              title="الأعضاء"
              value={users.filter((u) => u.role === "admin").length}
              color="purple"
              icon="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5Z"
            />
            <StatCard
              title="المقترحات"
              value={feedback.length}
              color="orange"
              icon="M21 11.5a8.5 8.5 0 1 1-4.5-7.5L22 2l-2 5.5a8.4 8.4 0 0 1 1 4z"
            />
            <StatCard
              title="الرسائل"
              value={messages.length}
              color="green"
              icon="M20 4H4a2 2 0 0 0-2 2v12l4-4h14Z"
            />
          </div>
        )}

        {/* ================= USERS ================= */}
        {activeTab === "users" && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-10 py-5 text-xs font-black text-slate-400">
                    العضو
                  </th>
                  <th className="px-10 py-5 text-xs font-black text-slate-400">
                    الرتبة
                  </th>
                  <th className="px-10 py-5 text-xs font-black text-slate-400 text-left">
                    التحكم
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.email} className="hover:bg-slate-50">
                    <td className="px-10 py-6">
                      <div className="font-black">{u.name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-10 py-6">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black
                        ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {u.role === "admin" ? "مسؤول" : "طالب"}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-left relative z-10">
                      <button
                        onClick={() => deleteUser(u.email)}
                        className="text-red-500 font-black
               cursor-pointer select-none
               pointer-events-auto
               hover:underline"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= FEEDBACK ================= */}
        {activeTab === "feedback" && (
          <div className="space-y-6">
            {feedback.length === 0 ? (
              /* ===== في حالة لا توجد مقترحات ===== */
              <div
                className="bg-yellow-50 border border-yellow-200 text-yellow-700 
                    p-6 rounded-2xl text-center font-bold"
              >
                ⚠️ لا توجد مقترحات حالياً
              </div>
            ) : (
              /* ===== في حالة وجود مقترحات ===== */
              feedback.map((f) => (
                <div
                  key={f.id}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-full"
                >
                  {/* ===== Header ===== */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-lg">{f.userName}</h4>
                      <span className="text-xs text-slate-400 font-bold">
                        {f.date}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteFeedback(f.id)}
                      className="text-red-500 font-black text-sm hover:underline"
                    >
                      حذف
                    </button>
                  </div>

                  {/* ===== المحتوى ===== */}
                  <div
                    className="bg-slate-50 p-6 rounded-2xl font-bold leading-relaxed
                     break-words whitespace-pre-wrap
                     max-h-64 overflow-y-auto"
                  >
                    {f.content}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= MESSAGES ================= */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* FORM */}
            <div className="lg:col-span-5">
              <div className="bg-white p-8 rounded-3xl border shadow-sm">
                <h3 className="text-2xl font-black mb-6">✉️ إرسال رسالة</h3>

                <form onSubmit={handleSendMessage} className="space-y-6">
                  <select
                    value={msgTarget}
                    onChange={(e) => setMsgTarget(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-50 border font-bold"
                  >
                    <option value="all">📢 الجميع</option>
                    {users
                      .filter((u) => u.email !== OWNER_EMAIL)
                      .map((u) => (
                        <option key={u.email} value={u.email}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>

                  <textarea
                    required
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    placeholder="اكتب الرسالة..."
                    className="w-full h-40 p-4 rounded-xl bg-slate-50 border font-bold resize-none"
                  />

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-black"
                  >
                    إرسال
                  </button>
                </form>
              </div>
            </div>

            {/* HISTORY */}
            <div className="lg:col-span-7 space-y-6 max-h-[600px] overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 font-bold">
                  لا توجد مراسلات
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className="bg-white p-6 rounded-3xl border shadow-sm"
                >
                  <div className="flex justify-between mb-3">
                    <span className="text-xs font-black text-slate-400">
                      {m.type === "broadcast" ? "📢 عام" : "🔒 خاص"} — {m.to}
                    </span>
                    <button
                      onClick={() => deleteMessage(m.id)}
                      className="text-red-400 font-black"
                    >
                      حذف
                    </button>
                  </div>

                  {/* نص الرسالة مع حد الطول */}
                  <div
                    className="bg-slate-50 p-4 rounded-2xl font-bold break-words whitespace-pre-wrap overflow-x-auto"
                    style={{ maxHeight: "150px" }} // ← الحد الأعلى للرسالة
                  >
                    {m.content}
                  </div>

                  <div className="text-[10px] text-slate-300 mt-2 text-left">
                    {m.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;

/* ================= STAT CARD ================= */

const StatCard = ({ title, value, color, icon }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-400",
    purple: "bg-purple-50 text-purple-400",
    orange: "bg-orange-50 text-orange-400",
    green: "bg-green-50 text-green-400",
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex">
      <div className={`w-28 flex items-center justify-center ${colors[color]}`}>
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-20 h-20 opacity-80"
        >
          <path d={icon} />
        </svg>
      </div>
      <div className="flex-1 p-8 text-right">
        <span className="text-xs font-black uppercase">{title}</span>
        <h4 className="text-5xl font-black mt-3">{value}</h4>
      </div>
    </div>
  );
};
