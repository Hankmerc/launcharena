
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      setMessage("Ошибка: " + error.message);
    } else {
      setMessage("Проверь почту — мы отправили ссылку для входа.");
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white flex items-center justify-center px-5">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8"
      >
        <a href="/" className="text-sm text-violet-400 hover:text-violet-300">
          ← Назад в LaunchArena
        </a>

        <h1 className="mt-6 text-3xl font-bold">Вход в LaunchArena</h1>

        <p className="mt-3 text-sm text-zinc-400">
          Введи email, чтобы получить безопасную ссылку для входа.
        </p>

        <label htmlFor="email" className="mt-7 block text-sm">
          Email
        </label>

        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-violet-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? "Отправляем..." : "Получить ссылку для входа"}
        </button>

        {message && (
          <p className="mt-4 text-sm text-zinc-300">{message}</p>
        )}
      </form>
    </main>
  );
}
