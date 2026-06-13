import { useState } from "react";
import { useNavigate } from "react-router";
import PageShell from "../components/PageShell.jsx";
import { request, setAuthToken } from "../lib/api.js";

export default function AuthPage({ setUser }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [status, setStatus] = useState("");

  async function submit() {
    try {
      setStatus("");
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const response = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setAuthToken(response.token);
      setUser(response.user);
      setStatus(`${mode === "login" ? "Signed in" : "Account created"} successfully.`);
      navigate("/chat");
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <PageShell
      eyebrow="Authentication"
      title="Sign in or create an account"
      description="JWT-based authentication keeps chat history, feedback, and tickets tied to the signed-in user."
    >
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
        <div className="grid grid-cols-2 rounded-full border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-900">
          {[
            ["login", "Login"],
            ["signup", "Sign up"],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-full px-4 py-2 text-sm font-medium ${mode === value ? "bg-slate-950 text-white" : "text-slate-600 dark:text-slate-400"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {mode === "signup" ? (
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900" />
          ) : null}
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900" />
          <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="Password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900" />
          <button type="button" onClick={submit} className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">Admin demo account: admin@lumina.local / Admin123!</p>
          {status ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{status}</p> : null}
        </div>
      </div>
    </PageShell>
  );
}
