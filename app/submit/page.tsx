
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SubmitPage() {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState("AI");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      setMessage("Сначала войди в аккаунт на странице /login.");
      return;
    }

    let validUrl = "";

    try {
      const parsedUrl = new URL(websiteUrl);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
        throw new Error("Invalid URL");
      }
      validUrl = parsedUrl.toString();
    } catch {
      setMessage("Введи корректную ссылку, например https://example.com");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("products").insert({
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      website_url: validUrl,
      category,
      submitted_by: user.id,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      setMessage("Не удалось отправить продукт: " + error.message);
      return;
    }

    setMessage("Готово! Продукт отправлен на модерацию.");
    setName("");
    setTagline("");
    setDescription("");
    setWebsiteUrl("");
    setCategory("AI");
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-5 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <a href="/" className="text-sm text-violet-400 hover:text-violet-300">
          ← Назад в LaunchArena
        </a>

        <h1 className="mt-8 text-3xl font-bold">
          Добавить продукт
        </h1>

        <p className="mt-3 text-zinc-400">
          Расскажи о своём продукте сообществу LaunchArena.
          После отправки он пройдёт модерацию.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm">
              Название продукта
            </label>
            <input
              id="name"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, My AI Tool"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="tagline" className="block text-sm">
              Краткое описание
            </label>
            <input
              id="tagline"
              required
              maxLength={200}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Что делает твой продукт?"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm">
              Подробное описание
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажи о возможностях продукта"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="websiteUrl" className="block text-sm">
              Ссылка на сайт
            </label>
            <input
              id="websiteUrl"
              type="url"
              required
              maxLength={2048}
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm">
              Категория
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#151519] px-4 py-3 outline-none focus:border-violet-500"
            >
              <option value="AI">AI</option>
              <option value="Productivity">Productivity</option>
              <option value="Developer Tools">Developer Tools</option>
              <option value="Design">Design</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "Отправляем..." : "Отправить на модерацию"}
          </button>

          {message && (
            <p role="status" className="break-words text-sm text-zinc-300">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
