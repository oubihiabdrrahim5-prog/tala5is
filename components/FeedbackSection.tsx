
import React, { useState } from 'react';
import { User, FeedbackEntry } from '../types';

interface Props {
  user: User | null;
  onAuthRequired: () => void;
}

const FeedbackSection: React.FC<Props> = ({ user, onAuthRequired }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onAuthRequired();
      return;
    }
    if (!feedback.trim()) return;

    setIsSending(true);
    
    setTimeout(() => {
      const newEntry: FeedbackEntry = {
        id: Math.random().toString(36).substr(2, 9),
        userName: user.name,
        userEmail: user.email,
        content: feedback,
        date: new Date().toLocaleString('ar-EG'),
        status: 'new'
      };

      const existingFeedback = JSON.parse(localStorage.getItem('talakhisi_feedback') || '[]');
      localStorage.setItem('talakhisi_feedback', JSON.stringify([newEntry, ...existingFeedback]));

      setIsSending(false);
      setIsSubmitted(true);
      setFeedback('');
    }, 1200);
  };

  return (
    <section id="feedback" className="max-w-4xl mx-auto px-2 py-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="glass-card p-10 md:p-16 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-50/50 rounded-full blur-[100px] group-hover:bg-blue-100/50 transition-colors"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-yellow-50/50 rounded-full blur-[100px] group-hover:bg-yellow-100/50 transition-colors"></div>

        {!isSubmitted ? (
          <div className="relative z-10 text-center space-y-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-[2rem] text-yellow-500 shadow-xl border border-slate-50 mb-4 rotate-3 group-hover:rotate-0 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-slate-900 tracking-tight">صندوق أفكار المستقبل 💡</h3>
              <p className="text-slate-500 font-bold max-w-lg mx-auto leading-relaxed text-lg">
                رأيك يهمنا! شاركنا أفكارك لتطوير المنصة وجعلها مكاناً أفضل لكل الطلاب.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative">
              {!user && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-3xl border border-white/50 animate-in fade-in">
                  <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center space-y-5 transform hover:scale-105 transition-transform">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xl">تحتاج لتسجيل الدخول</h4>
                      <p className="text-slate-500 font-bold text-sm mt-1">يجب أن تكون عضواً لإرسال مقترحاتك.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={onAuthRequired}
                      className="gradient-btn text-white px-8 py-3 rounded-xl font-black text-sm shadow-xl shadow-blue-200 block w-full hover:scale-105 transition-all"
                    >
                      دخول / إنشاء حساب
                    </button>
                  </div>
                </div>
              )}

              <div className="relative group/field">
                <textarea
                  required
                  disabled={!user}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="ما الذي تود رؤيته في تلاخيص مستقبلاً؟"
                  className="w-full h-48 p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] focus:border-blue-500 outline-none transition-all font-bold text-slate-800 resize-none shadow-sm text-lg leading-relaxed placeholder:text-slate-300"
                />
                {user && (
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-2xl text-[11px] font-black border border-blue-100">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    مرسل بواسطة: {user.name}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSending || !feedback.trim() || !user}
                className="group relative inline-flex items-center justify-center px-12 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all shadow-2xl disabled:opacity-50 active:scale-95"
              >
                <span className={`relative z-10 flex items-center gap-3 ${isSending ? 'opacity-0' : 'opacity-100'}`}>
                  إرسال مقترحي الآن
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </span>
                {isSending && <div className="absolute inset-0 flex items-center justify-center"><div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div></div>}
              </button>
            </form>
          </div>
        ) : (
          <div className="relative z-10 text-center py-20 space-y-8 animate-in zoom-in duration-500">
            <div className="w-32 h-32 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-200 border border-green-100 rotate-12">
               <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="space-y-3">
              <h3 className="text-5xl font-black text-slate-900 tracking-tight">وصلت الفكرة! ✨</h3>
              <p className="text-slate-500 font-bold text-xl max-w-sm mx-auto leading-relaxed">شكراً {user?.name.split(' ')[0]}، سنقوم بدراسة مقترحك والعمل عليه قريباً.</p>
            </div>
            <button onClick={() => setIsSubmitted(false)} className="text-blue-600 font-black text-lg hover:underline decoration-2 underline-offset-8">إرسال فكرة أخرى</button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeedbackSection;
