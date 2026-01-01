
import React, { useRef, useState, useEffect } from 'react';
import { SummarizationResult, ChatMessage } from '../types';
import { generateSpeech, chatWithLesson } from '../geminiService';

interface Props {
  result: SummarizationResult;
  onReset: () => void;
  userEmail?: string;
}

const ResultView: React.FC<Props> = ({ result, onReset, userEmail }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'quiz' | 'tutor'>('summary');
  const [isReading, setIsReading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [userAnswers, setUserAnswers] = useState<number[]>(new Array(result.quiz.length).fill(-1));
  const [showQuizResults, setShowQuizResults] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    if (userEmail) {
      const library = JSON.parse(localStorage.getItem(`lib_${userEmail}`) || '[]');
      setIsSaved(library.some((item: any) => item.id === result.id));
    }
  }, [result.id, userEmail]);

  const handleToggleSpeech = async () => {
    if (isReading) {
      audioSourceRef.current?.stop();
      setIsReading(false);
      return;
    }
    try {
      const buffer = await generateSpeech(result.summary);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsReading(false);
      audioSourceRef.current = source;
      source.start(0);
      setIsReading(true);
    } catch (e) { 
      console.error(e); 
      setIsReading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    const aiResponse = await chatWithLesson(result.summary, chatInput, chatHistory);
    setChatHistory(prev => [...prev, { role: 'model', text: aiResponse }]);
    setIsChatLoading(false);
  };

  const exportAsImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      // @ts-ignore
      const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: '#fafbff' });
      const link = document.createElement('a');
      link.download = `تلاخيص_${result.title}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) { console.error(error); } finally { setIsExporting(false); }
  };

  const exportAsPDF = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      // @ts-ignore
      const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: '#fafbff' });
      const imgData = canvas.toDataURL('image/png');
      // @ts-ignore
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`تلاخيص_${result.title}.pdf`);
    } catch (error) { console.error(error); } finally { setIsExporting(false); }
  };

  const saveToLibrary = () => {
    if (!userEmail) return;
    const library = JSON.parse(localStorage.getItem(`lib_${userEmail}`) || '[]');
    if (!isSaved) {
      library.unshift(result);
      setIsSaved(true);
    } else {
      const filtered = library.filter((item: any) => item.id !== result.id);
      setIsSaved(false);
      localStorage.setItem(`lib_${userEmail}`, JSON.stringify(filtered));
      return;
    }
    localStorage.setItem(`lib_${userEmail}`, JSON.stringify(library));
  };

  const score = userAnswers.reduce((acc, curr, idx) => curr === result.quiz[idx].correctAnswer ? acc + 1 : acc, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 px-2 pb-20">
      {/* Header Info */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl shadow-blue-300 ring-8 ring-blue-50">🎓</div>
          <div className="text-right space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white text-[11px] font-black uppercase px-3 py-1 rounded-lg">{result.subject}</span>
              <span className="text-slate-400 text-sm font-black">مستوى الصعوبة: {result.overallLevel}</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{result.title}</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-[1.5rem] border border-slate-100 shadow-inner">
            <button onClick={exportAsPDF} disabled={isExporting} className="p-3.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2 group">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              <span className="text-[11px] font-black uppercase">PDF</span>
            </button>
            <button onClick={exportAsImage} disabled={isExporting} className="p-3.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2 group">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3-3a2 2 0 0 0-2 0L6 21"/></svg>
              <span className="text-[11px] font-black uppercase">PNG</span>
            </button>
          </div>
          <button onClick={saveToLibrary} className={`p-5 rounded-[1.5rem] border-2 transition-all ${isSaved ? 'bg-yellow-50 border-yellow-300 text-yellow-600 shadow-lg shadow-yellow-100' : 'bg-white border-slate-100 text-slate-300 hover:text-blue-600 hover:border-blue-200 shadow-sm'}`}>
            <svg width="24" height="24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button onClick={onReset} className="bg-slate-950 text-white px-10 py-5 rounded-[1.5rem] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl">تحليل جديد ✨</button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex p-2 bg-slate-100/50 backdrop-blur-sm rounded-[1.5rem] border border-slate-200 shadow-inner w-full md:w-fit mx-auto overflow-x-auto no-scrollbar">
        {[
          { id: 'summary', label: 'الملخص الذكي', icon: '📝' },
          { id: 'quiz', label: 'اختبار الفهم', icon: '🎯' },
          { id: 'tutor', label: 'المعلم الخصوصي', icon: '👨‍🏫' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-3.5 rounded-xl text-sm font-black transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[600px] animate-in fade-in duration-500">
        {activeTab === 'summary' && (
          <div ref={exportRef} className="grid grid-cols-1 lg:grid-cols-12 gap-10 p-2">
            <div className="lg:col-span-8 space-y-10">
              <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-24 bg-blue-600 rounded-full mt-12 group-hover:h-32 transition-all"></div>
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                  <h3 className="text-3xl font-black text-slate-900 pr-4">الملخص التنفيذي</h3>
                  <button onClick={handleToggleSpeech} className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all font-black text-sm shadow-xl ${isReading ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1'}`}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      {isReading ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M11 5L6 9H2v6h4l5 4V5zm4.54 3.46a5 5 0 0 1 0 7.07" />}
                    </svg>
                    {isReading ? 'إيقاف الاستماع' : 'استمع للملخص'}
                  </button>
                </div>
                <div className="text-2xl font-bold text-slate-800 leading-[1.8] text-right bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">{result.summary}</div>
              </section>

              <div className="space-y-8">
                {result.paragraphs.map((p, i) => (
                   <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="flex items-center gap-4 mb-6">
                        <span className={`text-[11px] font-black px-4 py-1.5 rounded-full shadow-sm ${p.importance === 'High' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{p.importanceLabel}</span>
                        <div className="h-[2px] flex-1 bg-slate-50"></div>
                        <span className="text-[10px] text-slate-300 font-black tracking-widest uppercase">الفقرة {i + 1}</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 leading-[1.7] mb-8">{p.content}</p>
                      <div className="flex items-start gap-4 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 group">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg shadow-blue-100 group-hover:rotate-12 transition-transform">AI</div>
                        <div>
                          <p className="text-blue-600 text-xs font-black mb-1">لماذا هذا الجزء مهم؟</p>
                          <p className="text-sm font-bold text-slate-600 italic leading-relaxed">{p.reason}</p>
                        </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm sticky top-24">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-4">
                  <span className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">📌</span>
                  المفاهيم الذهبية
                </h3>
                <div className="space-y-5">
                  {result.keyTerms.map((t, i) => (
                    <div key={i} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-blue-300 hover:bg-white transition-all group">
                      <h4 className="font-black text-blue-800 text-lg mb-2 group-hover:translate-x-1 transition-transform">{t.term}</h4>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed">{t.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 p-2">
            <div className="bg-white p-12 md:p-20 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <h3 className="text-4xl font-black text-slate-900 mb-12 text-center">تحدي الذكاء 🎯</h3>
              <div className="space-y-16">
                {result.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-8">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-slate-950 text-white rounded-[1.2rem] flex items-center justify-center text-xl font-black shrink-0 shadow-2xl rotate-3">{qIdx + 1}</div>
                      <h4 className="text-2xl font-black text-slate-900 mt-2 leading-snug">{q.question}</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-4 mr-20">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = userAnswers[qIdx] === oIdx;
                        const isCorrect = q.correctAnswer === oIdx;
                        let optionStyle = "border-slate-100 bg-slate-50/50 text-slate-700";
                        if (showQuizResults) {
                          if (isCorrect) optionStyle = "border-green-500 bg-green-50 text-green-900 font-black shadow-lg shadow-green-100 scale-[1.02]";
                          else if (isSelected) optionStyle = "border-red-500 bg-red-50 text-red-900 font-black shadow-lg shadow-red-100";
                          else optionStyle = "border-slate-50 bg-white text-slate-300 opacity-50";
                        } else if (isSelected) {
                          optionStyle = "border-blue-600 bg-blue-50 text-blue-900 font-black ring-4 ring-blue-50 shadow-xl shadow-blue-100 scale-[1.02]";
                        }
                        return (
                          <button key={oIdx} disabled={showQuizResults} onClick={() => { const newAns = [...userAnswers]; newAns[qIdx] = oIdx; setUserAnswers(newAns); }} className={`p-7 rounded-[2rem] border-2 text-right font-bold transition-all flex items-center justify-between group ${optionStyle} ${!showQuizResults && 'hover:border-blue-300 hover:bg-white'}`}>
                            <span className="text-xl">{opt}</span>
                            {showQuizResults && isCorrect && <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">✓</span>}
                            {showQuizResults && isSelected && !isCorrect && <span className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">✗</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {!showQuizResults ? (
                <button disabled={userAnswers.includes(-1)} onClick={() => setShowQuizResults(true)} className="w-full mt-20 gradient-btn text-white py-8 rounded-[2.5rem] font-black text-2xl hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] disabled:opacity-50 transition-all active:scale-95">عرض النتيجة النهائية 🏆</button>
              ) : (
                <div className="mt-20 p-12 bg-slate-950 rounded-[3.5rem] text-center shadow-3xl animate-in zoom-in">
                  <div className="text-8xl mb-6">🏁</div>
                  <h4 className="text-5xl font-black text-white mb-4">حصادك: {score} من {result.quiz.length}</h4>
                  <p className="text-slate-400 font-bold text-xl mb-10">{score === result.quiz.length ? 'أنت عبقري! استيعاب كامل بنسبة 100%' : 'رائع! الممارسة تجعل منك خبيراً.'}</p>
                  <button onClick={() => { setShowQuizResults(false); setUserAnswers(new Array(result.quiz.length).fill(-1)); }} className="bg-white text-slate-950 px-14 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-all">إعادة المحاولة</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="max-w-4xl mx-auto flex flex-col h-[750px] bg-white rounded-[4rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in duration-500 relative">
            <div className="p-8 border-b border-slate-50 bg-slate-50/80 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-100 rotate-6">👨‍🏫</div>
                <div className="text-right">
                  <h4 className="text-2xl font-black text-slate-900">المعلم الخصوصي</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                    <p className="text-[11px] text-green-700 font-black uppercase tracking-[0.2em]">متصل وجاهز للشرح</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setChatHistory([])} className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">مسح المحادثة</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/20 no-scrollbar">
              {chatHistory.length === 0 && (
                <div className="text-center py-24 space-y-8">
                  <div className="text-9xl mb-6 opacity-10 animate-pulse">💡</div>
                  <h3 className="text-3xl font-black text-slate-900">كيف يمكنني مساعدتك؟</h3>
                  <p className="text-slate-500 font-bold max-w-sm mx-auto text-xl leading-relaxed">أنا معلمك الخاص، لقد قرأت الدرس جيداً وأنا مستعد لتوضيح أي فكرة أو تقديم أمثلة إضافية.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-${msg.role === 'user' ? 'right' : 'left'}-5 duration-300`}>
                  <div className={`max-w-[85%] p-8 rounded-[2.5rem] font-bold text-xl leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-white border-2 border-slate-100 text-slate-900 rounded-br-none' : 'bg-slate-950 text-white rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-end">
                   <div className="bg-slate-100 text-slate-400 p-8 rounded-[2.5rem] rounded-bl-none flex gap-2 border border-slate-200">
                     <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                     <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                     <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce delay-300"></div>
                   </div>
                </div>
              )}
            </div>
            <form onSubmit={handleChat} className="p-8 bg-white border-t border-slate-50 flex gap-4">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="اسألني عن أي تفصيل في الدرس..." className="flex-1 px-10 py-6 rounded-[2rem] bg-slate-50 border-2 border-transparent outline-none focus:border-blue-600 focus:bg-white font-bold text-xl transition-all text-slate-900 shadow-inner" />
              <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="bg-slate-950 text-white p-6 rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 disabled:opacity-50">
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultView;
