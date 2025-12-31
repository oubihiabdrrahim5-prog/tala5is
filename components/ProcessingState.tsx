
import React from 'react';

const ProcessingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-4 text-center animate-in fade-in duration-500">
      <div className="relative mb-12">
        <div className="w-24 h-24 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl rotate-45 animate-pulse shadow-xl shadow-blue-500/50"></div>
        </div>
      </div>
      <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">ننسق الأفكار من أجلك...</h3>
      <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-bold opacity-80">
        نقوم الآن باستخلاص الجوهر التعليمي وتوليد الاختبارات المناسبة لمستواك.
      </p>
      <div className="mt-8 flex gap-1.5 justify-center">
        {[0, 150, 300].map((delay) => (
          <div 
            key={delay}
            className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" 
            style={{ animationDelay: `${delay}ms` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingState;
