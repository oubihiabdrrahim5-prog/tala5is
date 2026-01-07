import React, { useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import ProcessingState from "./components/ProcessingState";
import ResultView from "./components/ResultView";
import AuthView from "./components/AuthView";
import FeedbackSection from "./components/FeedbackSection";
import DashboardView from "./components/DashboardView";
import LibraryView from "./components/LibraryView";
import { summarizeLesson } from "./geminiService";
import {
  AppState,
  InputMode,
  AuthMode,
  User,
  ViewState,
  SummarizationResult,
} from "./types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const App: React.FC = () => {
  const [mode, setMode] = useState<InputMode>("text");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    result: null,
    error: null,
    user: null,
    view: "landing",
    authMode: "login",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("talakhisi_session");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setState((prev) => ({ ...prev, user, view: "app" }));
      } catch (e) {
        localStorage.removeItem("talakhisi_session");
      }
    }
  }, []);

  const handleGoHome = useCallback(() => {
    setState((prev) => ({
      ...prev,
      view: prev.user ? "app" : "landing",
      result: null,
      error: null,
      isProcessing: false,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.user]);

  const handleAuthSuccess = (
    name: string,
    email: string,
    role: "admin" | "user"
  ) => {
    const userData: User = { name, email, role };
    localStorage.setItem("talakhisi_session", JSON.stringify(userData));
    setState((prev) => ({ ...prev, user: userData, view: "app", error: null }));
  };

  const openAuth = (authMode: AuthMode) => {
    setState((prev) => ({ ...prev, view: "auth", authMode }));
  };

  const handleLogout = () => {
    localStorage.removeItem("talakhisi_session");
    setState((prev) => ({
      ...prev,
      user: null,
      view: "landing",
      result: null,
    }));
    setTextInput("");
    setFile(null);
    setPreview(null);
  };

  const setView = (view: ViewState) => {
    setState((prev) => ({ ...prev, view }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setState((prev) => ({ ...prev, error: null }));
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE) {
        setState((prev) => ({
          ...prev,
          error: "حجم الملف كبير جداً (الأقصى 10MB).",
        }));
        return;
      }
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProcess = async () => {
    if (state.isProcessing) return;
    if (!state.user) {
      openAuth("login");
      return;
    }

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      result: null,
      error: null,
    }));

    try {
      let res: SummarizationResult;
      if (mode === "text") {
        if (textInput.trim().length < 10)
          throw new Error("نص الدرس قصير جداً للتحليل.");
        res = await summarizeLesson(textInput);
      } else {
        if (!file) throw new Error("يرجى اختيار ملف أولاً.");
        const base64 = await fileToBase64(file!);
        res = await summarizeLesson(
          { data: base64, mimeType: file!.type },
          true
        );
      }

      const resultWithMeta: SummarizationResult = {
        ...res,
        id: Math.random().toString(36).substr(2, 9),
        title:
          mode === "text"
            ? textInput.trim().substring(0, 30) + "..."
            : file!.name,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        result: resultWithMeta,
      }));
    } catch (err: any) {
      console.error("Processing Error:", err);
      let errorMsg = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      if (err.message === "API_KEY_MISSING") {
        errorMsg =
          "⚠️ لم يتم العثور على مفتاح API. يرجى ضبطه في إعدادات البيئة.";
      } else if (
        err.message === "API_KEY_INVALID" ||
        err.message.includes("400")
      ) {
        errorMsg = "⚠️ مفتاح الـ API غير صالح. يرجى التأكد من صلاحية المفتاح.";
      } else {
        errorMsg = err.message;
      }
      setState((prev) => ({ ...prev, isProcessing: false, error: errorMsg }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-cairo selection:bg-blue-600 selection:text-white">
      <Header
        user={state.user}
        onAuthClick={openAuth}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        onViewChange={setView}
        currentView={state.view}
      />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-16 relative">
        {/* Simple Static Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-100/20 blur-[120px] -z-10 rounded-full"></div>

        {state.view === "dashboard" ? (
          <DashboardView />
        ) : state.view === "library" && state.user ? (
          <LibraryView
            userEmail={state.user.email}
            onSelectLesson={(lesson) =>
              setState((prev) => ({ ...prev, result: lesson, view: "app" }))
            }
          />
        ) : state.view === "auth" ? (
          <AuthView
            onSuccess={handleAuthSuccess}
            onCancel={() => setState((prev) => ({ ...prev, view: "landing" }))}
            initialMode={state.authMode}
          />
        ) : !state.result && !state.isProcessing ? (
          <div className="space-y-24 md:space-y-40">
            <section className="relative text-center space-y-10 animate-in fade-in zoom-in duration-1000">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full text-xs font-black text-blue-700 border border-slate-100 shadow-sm mx-auto">
                <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                أكثر من 50,000 درس تم تلخيصه بنجاح
              </div>

              <h2 className="text-5xl md:text-[6.5rem] font-black text-slate-900 leading-[1.05] tracking-tight">
                وداعاً للدراسة التقليدية..
                <br />
                <span className="relative inline-block mt-4">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                    أهلاً بمستقبل التلخيص.
                  </span>
                </span>
              </h2>

              <p className="text-xl md:text-3xl text-slate-500 max-w-3xl mx-auto font-medium leading-normal">
                حوّل ساعات المذاكرة المرهقة إلى
                <span className="relative inline-block mx-3 text-slate-800 font-black">
                  <span className="relative z-10">دقائق من الإبداع</span>
                  <div className="absolute bottom-1.5 left-0 w-full h-3.5 bg-blue-400/20 -z-10 -rotate-1 rounded-sm"></div>
                </span>
                والتركيز العالي باستخدام أقوى تقنيات الذكاء الاصطناعي.
              </p>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() =>
                    document
                      .getElementById("start")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="gradient-btn shine-effect text-white px-10 py-5 rounded-[2rem]
               font-black text-xl flex items-center gap-4
               hover:scale-105 active:scale-95 transition-all
               shadow-xl shadow-blue-100"
                >
                  <span>ابدأ تلخيص درسك الآن</span>

                  {/* أيقونة البدء */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-7 h-7"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </section>

            <div className="max-w-4xl mx-auto px-2" id="start">
              <div className="bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden relative">
                <div className="flex p-4 bg-slate-50/50 border-b border-slate-100 gap-4">
                  {[
                    {
                      id: "text",
                      label: "كتابة (قلم)",
                      icon: (
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      ),
                    },
                    {
                      id: "image",
                      label: "تصوير (صورة)",
                      icon: (
                        <>
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3-3a2 2 0 0 0-2 0L6 21" />
                        </>
                      ),
                    },
                    {
                      id: "pdf",
                      label: "ملف (PDF)",
                      icon: (
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      ),
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMode(tab.id as InputMode);
                        setFile(null);
                        setPreview(null);
                        setState((prev) => ({ ...prev, error: null }));
                      }}
                      className={`flex-1 py-5 px-4 rounded-[2rem] text-sm font-black flex flex-col md:flex-row items-center justify-center gap-3 transition-all duration-300 ${
                        mode === tab.id
                          ? "bg-white text-blue-600 shadow-xl ring-2 ring-blue-50"
                          : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                      }`}
                    >
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        {tab.icon}
                      </svg>
                      <span className="text-sm md:text-base">{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="p-10 md:p-16">
                  {mode === "text" && (
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="الصق نص الدرس الطويل هنا..."
                      className="w-full h-80 p-6 text-2xl border-none focus:ring-0 outline-none transition-all resize-none font-medium text-slate-700 placeholder-slate-300 bg-transparent leading-relaxed"
                    />
                  )}

                  {(mode === "image" || mode === "pdf") && (
                    <label className="flex flex-col items-center justify-center w-full min-h-[24rem] border-2 border-dashed rounded-[3rem] cursor-pointer transition-all border-slate-200 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-400 group">
                      {!file ? (
                        <div className="text-center p-10">
                          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-blue-600 mb-8 mx-auto shadow-sm group-hover:scale-110 transition-transform">
                            <svg
                              className="w-12 h-12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 15V6m0 0L8 8m2-2 2 2M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                            </svg>
                          </div>
                          <p className="text-2xl font-black text-slate-700">
                            اضغط لرفع {mode === "image" ? "الصورة" : "الملف"}
                          </p>
                          <p className="text-sm text-slate-400 mt-3 font-bold">
                            ارفع صورة لصفحة كتابك وسنقرأها بالذكاء الاصطناعي
                          </p>
                        </div>
                      ) : (
                        <div className="p-10 flex flex-col items-center gap-8 w-full text-center">
                          {mode === "image" && preview ? (
                            <img
                              src={preview}
                              className="w-64 h-64 object-cover rounded-[2.5rem] shadow-2xl border-4 border-white"
                              alt="Preview"
                            />
                          ) : (
                            <div className="w-32 h-44 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 font-black text-4xl shadow-lg">
                              PDF
                            </div>
                          )}
                          <div className="bg-white/90 backdrop-blur p-6 rounded-[2rem] border border-slate-100 shadow-sm max-w-sm">
                            <span className="font-black text-slate-800 text-lg block truncate">
                              {file.name}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setFile(null);
                                setPreview(null);
                              }}
                              className="text-red-500 font-black mt-4 text-sm hover:bg-red-50 px-6 py-2 rounded-xl transition-all"
                            >
                              تغيير الاختيار
                            </button>
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept={mode === "image" ? "image/*" : ".pdf"}
                        onChange={handleFileChange}
                      />
                    </label>
                  )}

                  {state.error && (
                    <div className="mt-8 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem]">
                      <div className="flex items-center gap-3 text-red-600 mb-2">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4m0 4h.01" />
                        </svg>
                        <span className="font-black">تنبيه دراسي:</span>
                      </div>
                      <p className="text-sm font-bold text-red-700 leading-relaxed">
                        {state.error}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleProcess}
                    disabled={state.isProcessing}
                    className="w-full mt-12 gradient-btn text-white py-8 rounded-[2.5rem] font-black text-2xl hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-6 group"
                  >
                    <span className="relative z-10">
                      {state.isProcessing
                        ? "جاري التحليل الذكي..."
                        : "ابدأ التلخيص الآن"}
                    </span>
                    {!state.isProcessing && (
                      <svg
                        className="w-8 h-8 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    )}
                    {state.isProcessing && (
                      <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <section className="space-y-32">
              <div className="text-center space-y-4">
                <h3 className="text-4xl md:text-5xl font-black text-slate-900">
                  لماذا يختارنا الطلاب؟
                </h3>
                <p className="text-slate-500 font-bold max-w-2xl mx-auto text-lg">
                  نحن لا نلخص فقط، نحن نبني لك طريقاً سهلاً للفهم العميق.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  {
                    title: "دقة استثنائية",
                    desc: "تلخيص ذكي يحافظ على جوهر الدرس دون تشويش أو نقص.",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-20 h-20">
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                        />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                      </svg>
                    ),
                    color: "text-indigo-600 bg-indigo-50",
                  },
                  {
                    title: "تحويل فوري",
                    desc: "من صورة أو PDF إلى محتوى رقمي مفهوم في ثوانٍ.",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-20 h-20">
                        <path d="M7 7h7V4l5 5-5 5V9H7z" fill="currentColor" />
                        <path
                          d="M17 17H10v3l-5-5 5-5v3h7z"
                          fill="currentColor"
                        />
                      </svg>
                    ),
                    color: "text-amber-500 bg-amber-50",
                  },
                  {
                    title: "ذاكرة ممتدة",
                    desc: "كل دروسك محفوظة ومنظمة وجاهزة عند الحاجة.",
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-20 h-20">
                        <path
                          d="M4 6c0-1.1.9-2 2-2h9l5 5v9c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M8 13h8M8 17h5"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    ),
                    color: "text-emerald-600 bg-emerald-50",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="bg-white p-14 rounded-[4rem] border border-slate-100
                   shadow-sm hover:shadow-xl transition-all group hover:-translate-y-2"
                  >
                    <div
                      className={`mb-10 w-28 h-28 rounded-3xl flex items-center justify-center
                      ${feature.color} group-hover:scale-110 transition-transform`}
                    >
                      {feature.icon}
                    </div>

                    <h4 className="text-3xl font-black text-slate-900 mb-6">
                      {feature.title}
                    </h4>

                    <p className="text-slate-500 font-bold leading-relaxed text-xl">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <FeedbackSection
              user={state.user}
              onAuthRequired={() => openAuth("login")}
            />
          </div>
        ) : null}

        {state.isProcessing && <ProcessingState />}
        {state.result && (
          <ResultView
            result={state.result}
            onReset={() => setState((prev) => ({ ...prev, result: null }))}
            userEmail={state.user?.email}
          />
        )}
      </main>

      <footer className="py-24 border-t border-slate-200 mt-20 text-center bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-4 mb-8">
            <div className="bg-blue-600 p-4 rounded-3xl text-white shadow-xl">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            تلاخيص
          </div>
          <p className="text-slate-500 font-bold mb-12 text-xl max-w-md mx-auto">
            الذكاء الاصطناعي في خدمة مستقبلك الدراسي وتفوقك.
          </p>
          <div className="h-px w-40 bg-slate-200 mx-auto mb-12"></div>
          <p className="text-slate-400 text-sm font-black uppercase tracking-[0.5em]">
            © 2025 Talakhisi AI - Built by Abdrrahim Oubihi
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
