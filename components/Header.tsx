
import React from 'react';
import { AuthMode, User, ViewState } from '../types';

interface HeaderProps {
  user: User | null;
  onAuthClick: (mode: AuthMode) => void;
  onLogout: () => void;
  onGoHome: () => void;
  onViewChange: (view: ViewState) => void;
  currentView: ViewState;
}

const Header: React.FC<HeaderProps> = ({ user, onAuthClick, onLogout, onGoHome, onViewChange, currentView }) => {
  const scrollToSection = (id: string) => {
    onGoHome(); 
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <header className="glass-card sticky top-0 z-50 w-full shadow-sm border-b border-white/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={onGoHome}
        >
          <div className="gradient-btn p-2.5 rounded-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">تلاخيص</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={onGoHome} className={`text-sm font-bold transition-all ${currentView === 'landing' || currentView === 'app' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>الرئيسية</button>
          
          {user && (
            <button 
              onClick={() => onViewChange('library')} 
              className={`text-sm font-bold transition-all ${currentView === 'library' ? 'text-blue-600 font-black' : 'text-slate-500 hover:text-blue-600'}`}
            >
              مكتبتي
            </button>
          )}

          <button onClick={() => scrollToSection('feedback')} className="text-sm font-bold text-slate-500 hover:text-blue-600">صندوق الأفكار</button>
          
          {user?.role === 'admin' && (
            <button onClick={() => onViewChange('dashboard')} className={`text-sm font-black flex items-center gap-2 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`}>
              <span className={`w-2 h-2 rounded-full ${currentView === 'dashboard' ? 'bg-blue-600 animate-ping' : 'bg-slate-300'}`}></span>
              الإدارة
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">مرحباً بك</p>
                <p className="text-sm font-black text-slate-800">{user.name}</p>
              </div>
              <button 
                onClick={onLogout}
                className="bg-slate-100 hover:bg-red-50 hover:text-red-600 p-2.5 rounded-xl transition-all text-slate-500"
                title="تسجيل الخروج"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => onAuthClick('login')} className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">دخول</button>
              <button onClick={() => onAuthClick('signup')} className="gradient-btn hover:scale-105 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-xl shadow-blue-200">ابدأ مجاناً</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
