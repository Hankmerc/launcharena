
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string | null;
  website_url: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      setIsAdmin(false);
      setMessage("Сначала войди в свой аккаунт через /login.");
      setLoading(false);
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .rpc("is_admin");

    if (adminError || admin !== true) {
      setIsAdmin(false);
      setMessage("Доступ запрещён. Эта страница только для администратора.");
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data, error } = await supabase
      .from("products")
      .select("id, name, tagline, description, website_url, category, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Не удалось загрузить заявки: " + error.message);
    } else {
      setProducts((data ?? []) as Product[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function changeStatus(
    productId: string,
    status: "approved" | "rejected"
  ) {
    const confirmed = window.confirm(
      status === "approved"
        ? "Опубликовать этот продукт?"
        : "Отклонить эту заявку?"
    );

    if (!confirmed) return;

    setBusyId(productId);
    setMessage("");

    const { data, error } = await supabase
      .from("products")
      .update({ status })
      .eq("id", productId)
      .eq("status", "pending")
      .select("id");

    if (error) {
      setMessage("Не удалось изменить статус: " + error.message);
    } else if (!data || data.length === 0) {
      setMessage("Заявка не изменена. Проверь права администратора.");
    } else {
      setProducts((current) =>
        current.filter((product) => product.id !== productId)
      );
      setMessage(
        status === "approved"
          ? "Продукт одобрен и опубликован."
          : "Заявка отклонена."
      );
    }

    setBusyId(null);
  }

  return (
    <main className="min-h-screen bg-[#09090b] px-5 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm text-violet-400 hover:text-violet-300">
          ← Назад в LaunchArena
        </a>

        <h1 className="mt-8 text-3xl font-bold">Админ-панель</h1>
        <p className="mt-3 text-zinc-400">
          Проверяй заявки перед публикацией в каталоге.
        </p>

        {message && (
          <p role="status" className="mt-6 break-words rounded-xl border border-white/10 p-4 text-sm">
            {message}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-zinc-400">Загружаем заявки...</p>
        ) : isAdmin ? (
          <section className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Заявки на проверку</h2>
              <button
                onClick={() => void loadProducts()}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
              >
                Обновить
              </button>
            </div>

            {products.length === 0 ? (
              <p className="rounded-xl border border-white/10 p-6 text-zinc-400">
                Новых заявок нет.
              </p>
            ) : (
              products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="mt-1 text-sm text-zinc-300">
                        {product.tagline}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
                      На проверке
                    </span>
                  </div>

                  {product.description && (
                    <p className="mt-4 text-sm text-zinc-400">
                      {product.description}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-zinc-400">
                    Категория: {product.category}
                  </p>

                  <a
                    href={product.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block break-all text-sm text-violet-400 hover:underline"
                  >
                    {product.website_url}
                  </a>

                  <p className="mt-3 text-xs text-zinc-500">
                    Отправлено: {new Date(product.created_at).toLocaleString()}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      disabled={busyId === product.id}
                      onClick={() => void changeStatus(product.id, "approved")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {busyId === product.id ? "Обработка..." : "Approve"}
                    </button>

                    <button
                      disabled={busyId === product.id}
                      onClick={() => void changeStatus(product.id, "rejected")}
                      className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
