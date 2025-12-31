
import React, { useState, useEffect } from 'react';
import { SummarizationResult, AppMessage } from '../types';

interface LibraryViewProps {
  userEmail: string;
  onSelectLesson: (lesson: SummarizationResult) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ userEmail, onSelectLesson }) => {
  const [library, setLibrary] = useState<SummarizationResult[]>([]);
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'lessons' | 'messages'>('lessons');
  const [selectedSubject, setSelectedSubject] = useState<string>('الكل');

  useEffect(() => {
    const storedLessons = JSON.parse(localStorage.getItem(`lib_${userEmail}`) || '[]');
    setLibrary(storedLessons);

    const allMessages: AppMessage[] = JSON.parse(localStorage.getItem('talakhisi_app_messages') || '[]');
    const userMessages = allMessages.filter(m => 
      m.to === 'all' || m.to.toLowerCase().trim() === userEmail.toLowerCase().trim()
    );
    setMessages(userMessages);
  }, [userEmail]);

  const subjects = ['الكل', ...new Set(library.map(l => l.subject))];
  const filteredLibrary = selectedSubject === 'الكل' ? library : library.filter(l => l.subject === selectedSubject);

  const deleteFromLibrary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('هل أنت متأكد من حذف هذا الدرس من مكتبتك؟')) return;
    const updated = library.filter(item => item.id !== id);
    setLibrary(updated);
    localStorage.setItem(`lib_${userEmail}`, JSON.stringify(updated));
  };

  return (
    <div className="max-w-6xl mx-auto py-12 animate-in fade-in duration-700 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">مكتبتك الذكية 🧠</h2>
          <p className="text-slate-500 font-bold">إدارة دروسك المنظمة حسب المادة.</p>
        </div>
        
        <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner shrink-0">
          <button onClick={() => setActiveTab('lessons')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-3 ${activeTab === 'lessons' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>📚 ملخصاتي</button>
          <button onClick={() => setActiveTab('messages')} className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-3 ${activeTab === 'messages' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>📨 رسائلي</button>
        </div>
      </div>

      {activeTab === 'lessons' ? (
        <div className="space-y-10">
          {/* Subjects Filter */}
          <div className="flex flex-wrap gap-2 items-center">
             <span className="text-xs font-black text-slate-400 ml-4 uppercase tracking-widest">تصفية حسب المادة:</span>
             {subjects.map(s => (
               <button 
                key={s} 
                onClick={() => setSelectedSubject(s)}
                className={`px-5 py-2 rounded-full text-xs font-black transition-all border ${selectedSubject === s ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}
               >
                 {s}
               </button>
             ))}
          </div>

          {filteredLibrary.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLibrary.map((lesson) => (
                <div 
                  key={lesson.id} 
                  onClick={() => onSelectLesson(lesson)}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">
                       {lesson.subject[0]}
                    </div>
                    <button onClick={(e) => deleteFromLibrary(lesson.id, e)} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-blue-500 mb-2 block tracking-widest uppercase">{lesson.subject}</span>
                  <h4 className="text-xl font-black text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">{lesson.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold mt-6 pt-6 border-t border-slate-50">
                    <span>{lesson.quiz.length} أسئلة اختبار</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-40 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="text-8xl mb-8 opacity-40">📚</div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">لا يوجد دروس مطابقة</h3>
              <p className="text-slate-400 font-bold">ابدأ بتلخيص دروسك وستظهر هنا فوراً.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.length > 0 ? messages.map((m) => (
            <div key={m.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-2 h-full ${m.type === 'broadcast' ? 'bg-orange-500' : 'bg-blue-600'}`}></div>
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${m.type === 'broadcast' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{m.type === 'broadcast' ? '📢' : '👤'}</div>
                  <div>
                    <h4 className="font-black text-slate-800 text-xl">{m.from}</h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${m.type === 'broadcast' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{m.type === 'broadcast' ? 'إعلان عام' : 'رسالة خاصة'}</span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-black">{m.date}</span>
              </div>
              <div className="text-slate-700 font-bold leading-relaxed bg-slate-50 p-8 rounded-[2rem] border border-slate-100 italic">"{m.content}"</div>
            </div>
          )) : (
            <div className="text-center py-40 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <div className="text-8xl mb-8 opacity-40">📭</div>
               <h3 className="text-2xl font-black text-slate-800 mb-2">الصندوق فارغ</h3>
               <p className="text-slate-400 font-bold">لا توجد رسائل جديدة من الإدارة.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryView;
