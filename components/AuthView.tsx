import React, { useState, useEffect, useCallback } from "react";
import { AuthMode } from "../types";

interface AuthProps {
  initialMode: AuthMode;
  onSuccess: (name: string, email: string, role: "admin" | "user") => void;
  onCancel: () => void;
}

const AuthView: React.FC<AuthProps> = ({
  initialMode,
  onSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const ADMIN_EMAIL = "abdooubi@gmail.com";
  const ADMIN_PASS = "abdo999";

  // تنظيف الخطأ عند تغيير الوضع (تسجيل/دخول)
  useEffect(() => {
    setError(null);
  }, [mode]);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const email = formData.email.trim().toLowerCase();
      const password = formData.password;

      // التحقق من البريد الإلكتروني
      if (!email.includes("@") || !email.includes(".")) {
        setError("يرجى إدخال بريد إلكتروني صحيح.");
        return;
      }

      const users = JSON.parse(
        localStorage.getItem("smart_summarizer_users") || "[]"
      );
      const isAdmin = email === ADMIN_EMAIL && password === ADMIN_PASS;

      if (mode === "signup") {
        if (password.length < 6) {
          setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل.");
          return;
        }

        const userExists = users.find(
          (u: any) => u.email.toLowerCase() === email
        );
        if (userExists) {
          setError("هذا الحساب مسجل مسبقاً، يرجى تسجيل الدخول.");
          return;
        }

        const role = isAdmin ? "admin" : "user";
        const newUser = {
          name: formData.name,
          email,
          password,
          role,
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem("smart_summarizer_users", JSON.stringify(users));
        onSuccess(newUser.name, newUser.email, role);
      } else {
        // تسجيل الدخول
        if (isAdmin) {
          const existingAdmin = users.find(
            (u: any) => u.email.toLowerCase() === email
          );
          if (!existingAdmin) {
            users.push({ name: "Admin", email, password, role: "admin" });
            localStorage.setItem(
              "smart_summarizer_users",
              JSON.stringify(users)
            );
          }
          onSuccess(existingAdmin?.name || "Admin", email, "admin");
          return;
        }

        const user = users.find(
          (u: any) => u.email.toLowerCase() === email && u.password === password
        );
        if (user) {
          onSuccess(user.name, user.email, user.role || "user");
        } else {
          setError("البريد أو كلمة المرور غير صحيحة.");
        }
      }
    },
    [formData, mode, onSuccess]
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="glass-card w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl shadow-blue-500/10 border border-white/50 relative overflow-hidden">
        {/* خلفيات ضبابية */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl"></div>

        <div className="relative">
          {/* زر إغلاق */}
          <button
            onClick={onCancel}
            className="absolute -top-4 -right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* رأس الصفحة */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {mode === "login" ? "دخول آمن" : "حساب طالب جديد"}
            </h2>
            <p className="text-slate-500 font-medium">
              {mode === "login"
                ? "تواصل مع ذكاء المنصة بأمان"
                : "انضم لبيئة تعليمية مشفرة بخصوصية 100%"}
            </p>
          </div>

          {/* رسائل الخطأ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3 animate-shake">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {error}
            </div>
          )}

          {/* النموذج */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest">
                  الاسم الحقيقي
                </label>
                <input
                  required
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-widest">
                البريد الإلكتروني
              </label>
              <input
                required
                type="email"
                placeholder="name@example.com"
                className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 uppercase tracking-widest">
                كلمة السر
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                onChange={(e) => handleChange("password", e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full gradient-btn hover:scale-[1.02] active:scale-95 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-500/20 mt-4"
            >
              {mode === "login"
                ? "تأكيد الهوية والدخول"
                : "إنشاء الحساب المشفر"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 font-bold text-sm">
              {mode === "login" ? "لا تملك حساباً؟" : "تملك حساباً بالفعل؟"}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-blue-600 mr-2 hover:underline font-black"
              >
                {mode === "login" ? "اشترك مجاناً" : "سجل دخولك الآن"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
