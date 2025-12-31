
import React, { useState, useEffect, useCallback } from 'react';
import { User, FeedbackEntry, AppMessage } from '../types';

const DashboardView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'feedback' | 'messages'>('stats');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Message Form State
  const [msgTarget, setMsgTarget] = useState<'all' | string>('all');
  const [msgContent, setMsgContent] = useState('');

  const OWNER_EMAIL = 'abdooubi@gmail.com'.toLowerCase().trim();
  const STORAGE_KEY = 'smart_summarizer_users';
  const MSG_KEY = 'talakhisi_app_messages';

  const getFreshUsers = (): User[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const loadAllData = useCallback(() => {
    setUsers(getFreshUsers());
    setFeedback(JSON.parse(localStorage.getItem('talakhisi_feedback') || '[]'));
    setMessages(JSON.parse(localStorage.getItem(MSG_KEY) || '[]'));
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const deleteUser = (email: string) => {
    const target = email.toLowerCase().trim();
    if (target === OWNER_EMAIL) {
      showNotification('لا يمكن حذف المالك!', 'error');
      return;
    }
    if (!window.confirm(`تأكيد: هل تريد حذف الحساب (${email}) نهائياً؟`)) return;
    const currentUsers = getFreshUsers();
    const updated = currentUsers.filter(u => u.email.toLowerCase().trim() !== target);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.removeItem(`lib_${target}`);
    setUsers(updated);
    showNotification('تم مسح الحساب بنجاح');
  };

  const toggleRole = (email: string) => {
    const target = email.toLowerCase().trim();
    if (target === OWNER_EMAIL) return;
    const currentUsers = getFreshUsers();
    const updated = currentUsers.map(u => {
      if (u.email.toLowerCase().trim() === target) {
        return { ...u, role: (u.role === 'admin' ? 'user' : 'admin') as 'admin' | 'user' };
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUsers(updated);
    showNotification('تم تحديث الرتبة');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim()) return;

    const newMessage: AppMessage = {
      id: Math.random().toString(36).substr(2, 9),
      from: 'الإدارة',
      to: msgTarget,
      content: msgContent,
      date: new Date().toLocaleString('ar-EG'),
      type: msgTarget === 'all' ? 'broadcast' : 'private'
    };

    const updatedMessages = [newMessage, ...messages];
    localStorage.setItem(MSG_KEY, JSON.stringify(updatedMessages));
    setMessages(updatedMessages);
    setMsgContent('');
    showNotification('تم إرسال الرسالة بنجاح');
  };

  const deleteMessage = (id: string) => {
    const updated = messages.filter(m => m.id !== id);
    localStorage.setItem(MSG_KEY, JSON.stringify(updated));
    setMessages(updated);
    showNotification('تم حذف الرسالة من السجل');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in duration-1000">
      {notification && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl font-black text-sm animate-in slide-in-from-top-10 flex items-center gap-3 border ${notification.type === 'success' ? 'bg-slate-900 text-green-400 border-green-400/30' : 'bg-red-600 text-white border-red-400/30'}`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-green-400 animate-pulse' : 'bg-white'}`}></div>
          {notification.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div>
          <h2 className="text-4xl font-black text-slate-900 mb-3 flex items-center gap-3">
             <span className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200">🛡️</span>
             إدارة المنصة
          </h2>
          <p className="text-slate-500 font-bold text-lg">التحكم في المستخدمين، المقترحات والمراسلات.</p>
        </div>
        
        <div className="flex flex-wrap p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-inner">
          {[
            { id: 'stats', label: 'الإحصائيات', icon: <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/> },
            { id: 'users', label: 'المستخدمين', icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/> },
            { id: 'feedback', label: 'المقترحات', icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
            { id: 'messages', label: 'المراسلات', icon: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">{tab.icon}</svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <span className="text-xs font-black text-blue-400 uppercase">المجتمع</span>
              <h4 className="text-5xl font-black text-slate-800 mt-2">{users.length}</h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <span className="text-xs font-black text-purple-400 uppercase">المدراء</span>
              <h4 className="text-5xl font-black text-slate-800 mt-2">{users.filter(u => u.role === 'admin').length}</h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <span className="text-xs font-black text-orange-400 uppercase">المقترحات</span>
              <h4 className="text-5xl font-black text-slate-800 mt-2">{feedback.length}</h4>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <span className="text-xs font-black text-green-400 uppercase">الرسائل</span>
              <h4 className="text-5xl font-black text-slate-800 mt-2">{messages.length}</h4>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-400">
                <tr>
                  <th className="px-10 py-5 text-xs font-black uppercase tracking-widest">العضو</th>
                  <th className="px-10 py-5 text-xs font-black uppercase tracking-widest">الرتبة</th>
                  <th className="px-10 py-5 text-xs font-black uppercase tracking-widest text-left">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.email} className="group hover:bg-slate-50/50">
                    <td className="px-10 py-6">
                      <div className="font-black text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role === 'admin' ? 'مسؤول' : 'طالب'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-left">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => toggleRole(u.email)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black disabled:hidden" disabled={u.email === OWNER_EMAIL}>ترقية/تنزيل</button>
                        <button onClick={() => deleteUser(u.email)} className="p-2 text-red-400 hover:text-red-600 disabled:hidden" disabled={u.email === OWNER_EMAIL}><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Form Section */}
            <div className="lg:col-span-5">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-24">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">✉️</span>
                  إرسال رسالة جديدة
                </h3>
                <form onSubmit={handleSendMessage} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 mr-2 uppercase">إلى من؟</label>
                    <select 
                      value={msgTarget}
                      onChange={(e) => setMsgTarget(e.target.value)}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700"
                    >
                      <option value="all">الجميع (تنبيه عام) 📢</option>
                      {users.filter(u => u.email !== OWNER_EMAIL).map(u => (
                        <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 mr-2 uppercase">محتوى الرسالة</label>
                    <textarea 
                      required
                      value={msgContent}
                      onChange={(e) => setMsgContent(e.target.value)}
                      placeholder="اكتب رسالتك للطلاب هنا..."
                      className="w-full h-40 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 resize-none"
                    />
                  </div>

                  <button type="submit" className="w-full gradient-btn text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3">
                    إرسال التنبيه الآن
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                  </button>
                </form>
              </div>
            </div>

            {/* History Section */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                سجل المراسلات
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs">{messages.length}</span>
              </h3>
              {messages.map((m) => (
                <div key={m.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${m.type === 'broadcast' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {m.type === 'broadcast' ? 'عام' : 'خاص'}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">إلى: {m.to === 'all' ? 'جميع الطلاب' : m.to}</span>
                    </div>
                    <button onClick={() => deleteMessage(m.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <p className="text-slate-700 font-bold bg-slate-50 p-4 rounded-2xl border border-slate-100">{m.content}</p>
                  <div className="mt-3 text-[10px] text-slate-300 font-black text-left">{m.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            {feedback.map((f) => (
              <div key={f.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-slate-800">{f.userName} ({f.userEmail})</h4>
                  <span className="text-xs text-slate-400 font-bold">{f.date}</span>
                </div>
                <p className="text-slate-700 font-bold italic bg-slate-50 p-6 rounded-2xl border border-slate-100">"{f.content}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
