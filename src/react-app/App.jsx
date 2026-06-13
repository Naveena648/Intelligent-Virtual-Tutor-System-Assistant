import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { PanelsTopLeft, ShieldCheck } from "lucide-react";
import HomePage from "./pages/HomePage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import ExplainPage from "./pages/ExplainPage.jsx";
import TicketsPage from "./pages/TicketsPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { getAuthToken, request, setAuthToken } from "./lib/api.js";

function AppShell({ user, onLogout, theme, onToggleTheme, children }) {
  const navLinkClass = ({ isActive }) =>
    [
      "rounded-full px-4 py-2 text-sm font-medium transition",
      isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    ].join(" ");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#e8edf7_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)] dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10 dark:bg-white dark:text-slate-950">
              <PanelsTopLeft className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Lumina</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Intelligent Virtual Tutor System Assistant</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/" className={navLinkClass} end>
              Home
            </NavLink>
            <NavLink to="/chat" className={navLinkClass}>
              Tutor Chat
            </NavLink>
            <NavLink to="/history" className={navLinkClass}>
              History
            </NavLink>
            <NavLink to="/explain" className={navLinkClass}>
              Explain-It-Back
            </NavLink>
            <NavLink to="/tickets" className={navLinkClass}>
              Tickets
            </NavLink>
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            {user ? (
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-slate-900">
                <div className="hidden sm:block">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Signed in</p>
                  <p className="text-sm font-medium">{user.name}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-full bg-slate-950 px-3 py-2 text-xs font-medium text-white"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-slate-950/10 transition hover:bg-slate-800"
              >
                <ShieldCheck className="h-4 w-4" />
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("lumina-theme") || "light");
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("lumina-theme", theme);
  }, [theme]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    request("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setAuthToken(null));
  }, []);

  const shellProps = useMemo(
    () => ({
      user,
      onLogout: () => {
        setAuthToken(null);
        setUser(null);
      },
      theme,
      onToggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme, user],
  );

  return (
    <BrowserRouter>
      <AppShell {...shellProps}>
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/chat" element={<ChatPage user={user} setUser={setUser} />} />
          <Route path="/history" element={<HistoryPage user={user} />} />
          <Route path="/explain" element={<ExplainPage user={user} />} />
          <Route path="/tickets" element={<TicketsPage user={user} />} />
          <Route path="/admin" element={<AdminPage user={user} />} />
          <Route path="/auth" element={<AuthPage setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}