
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  tagline: string;
  website_url: string;
  popularity: number;
  quality: number;
  icon: string;
  color: string;
  url: string;
  vote_count: number;
  weekly_votes: number;
};

const productColors = [
  "#C4B5FD",
  "#93C5FD",
  "#F9A8D4",
  "#6EE7B7",
  "#FDBA74",
  "#A5B4FC",
];

const categories = [
  "All",
  "AI",
  "Productivity",
  "Developer Tools",
  "Design",
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("popularity");
  const [votes, setVotes] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [voteLoading, setVoteLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, category, description, tagline, website_url"
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        setDbError(error.message);
        setLoading(false);
        return;
      }

      
const { data: voteCounts, error: voteError } = await supabase
  .from("product_vote_counts")
  .select("product_id, vote_count");

if (voteError) {
  console.error("Ошибка загрузки рейтингов:", voteError.message);
}

const countsMap = new Map(
  (voteCounts ?? []).map((vote) => [
    vote.product_id,
    vote.vote_count,
  ])
);
const { data: trendingCounts, error: trendingError } = await supabase
  .from("product_trending")
  .select("product_id, weekly_votes");

if (trendingError) {
  console.error("Ошибка загрузки Trending:", trendingError.message);
}

const trendingMap = new Map(
  (trendingCounts ?? []).map((vote) => [
    vote.product_id,
    vote.weekly_votes,
  ])
);
setProducts(
  (data ?? []).map((p, index) => ({
    ...p,
    popularity: countsMap.get(p.id) ?? 0,
    quality: 0,
    vote_count: countsMap.get(p.id) ?? 0,
    weekly_votes: trendingMap.get(p.id) ?? 0,
    icon: p.name.slice(0, 2).toUpperCase(),
    color: productColors[index % productColors.length],
    url: p.website_url,
  }))
);


      setLoading(false);
    }

    loadProducts();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (active) {
        setUserId(data.user?.id ?? null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadVotes() {
      if (!userId) {
        setVotes([]);
        return;
      }

      const { data, error } = await supabase
        .from("votes")
        .select("product_id")
        .eq("user_id", userId);

      if (error) {
        console.error("Не удалось загрузить голоса:", error.message);
        return;
      }

      setVotes((data ?? []).map((vote) => vote.product_id));
    }

    loadVotes();
  }, [userId]);


 
const filtered = useMemo(() => {
  return products
    .filter(
      (p) => category === "All" || p.category === category
    )
    .filter((p) =>
      `${p.name} ${p.description} ${p.tagline} ${p.category}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
  if (sort === "quality") {
    return b.quality - a.quality;
  }

  if (sort === "trending") {
    return b.weekly_votes - a.weekly_votes;
  }

  return b.vote_count - a.vote_count;
});
}, [products, search, category, sort]);
const leaderboard = useMemo(() => {
  return [...products]
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 10);
}, [products]);


  const panel =
    "rounded-2xl border border-white/[0.10] bg-[#1B192B] shadow-lg shadow-black/20";

  const muted = "text-[#A7A4BB]";

  const purpleButton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-500";

  return (
    <main className="min-h-screen overflow-hidden bg-[#100E1B] text-white selection:bg-violet-500/30">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#100E1B]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <a
            href="#"
            className="flex shrink-0 items-center gap-2.5 text-xl font-bold tracking-tight"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-600/30">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M4 17 10 5l4 8 2-4 4 8H4Z"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            launch<span className="text-violet-400">arena</span>
            <span className="text-violet-400">.</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-[#B0ADC1] md:flex">
            <a href="#explore" className="transition hover:text-white">
              Explore
            </a>
            <a href="#rankings" className="transition hover:text-white">
              Rankings
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
  {userId ? (
    <a
      href={`/users/${userId}`}
      className={`${purpleButton} px-4 py-3`}
    >
      Profile
    </a>
  ) : (
    <a
      href="/login"
      className={`${purpleButton} px-4 py-3`}
    >
      Login
    </a>
  )}

  <a href="/submit" className={`${purpleButton} px-4 py-3`}>
    <span>+</span> Submit product
  </a>
</div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-180px] h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[150px]" />
          <div className="absolute left-[8%] top-[260px] h-64 w-64 rounded-full bg-indigo-600/[0.08] blur-[110px]" />
          <div className="absolute right-[5%] top-[220px] h-64 w-64 rounded-full bg-fuchsia-600/[0.08] blur-[110px]" />
        </div>

        <div className="mx-auto max-w-5xl px-5 pb-20 pt-20 text-center sm:pb-24 sm:pt-28 lg:px-8 lg:pb-28 lg:pt-32">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/[0.09] px-4 py-2 text-xs font-semibold tracking-wide text-violet-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            YOUR NEXT FAVORITE TOOL STARTS HERE
          </div>

          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-bold leading-[1.08] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
            Discover tools.
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              Find your edge.
            </span>
          </h1>

          <p className={`mx-auto mt-7 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 ${muted}`}>
            Explore the best AI tools, productivity apps, and
            emerging startups. Compare products and discover
            your next favorite.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#explore" className={purpleButton}>
              Explore products <span>↗</span>
            </a>
            <a
              href="/submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.13] bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-violet-400/40 hover:bg-white/[0.08]"
            >
              Launch your product <span>→</span>
            </a>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x divide-white/[0.10] rounded-2xl border border-white/[0.09] bg-white/[0.025] py-5">
            <div className="px-2">
              <div className="text-2xl font-bold sm:text-3xl">
                {loading ? "—" : products.length}
              </div>
              <div className={`mt-1 text-xs sm:text-sm ${muted}`}>
                Products
              </div>
            </div>
            <div className="px-2">
              <div className="text-2xl font-bold sm:text-3xl">05</div>
              <div className={`mt-1 text-xs sm:text-sm ${muted}`}>
                Categories
              </div>
            </div>
            <div className="px-2">
              <div className="text-2xl font-bold sm:text-3xl">01</div>
              <div className={`mt-1 text-xs sm:text-sm ${muted}`}>
                Community
              </div>
            </div>
          </div>

          <div className="mt-5 text-xs text-[#716D85]">
            A growing directory of products worth discovering.
          </div>
        </div>
      </section>

      {/* Explore */}
      <section id="explore" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
                  THE DISCOVERY FEED
                </div>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Explore products
                  <span className="text-violet-400">.</span>
                </h2>
                <p className={`mt-3 text-sm sm:text-base ${muted}`}>
                  Find the right tools for your next big idea.
                </p>
              </div>

              <a
                href="/submit"
                className="hidden text-sm font-semibold text-violet-300 transition hover:text-violet-200 sm:inline-flex"
              >
                Submit a product ↗
              </a>
            </div>

            {/* Search */}
            <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-r from-violet-500/[0.08] via-[#151322] to-fuchsia-500/[0.05] p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-white/[0.09] bg-[#171523] px-4 transition focus-within:border-violet-400/60">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5 shrink-0 text-violet-300"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m16 16 4 4" />
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search AI tools, apps, startups..."
                    aria-label="Search products"
                    className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#77738C]"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-xs text-[#A7A4BB] hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </label>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort products"
                  className="min-h-12 rounded-xl border border-white/[0.09] bg-[#171523] px-4 text-sm text-white outline-none transition focus:border-violet-400/50"
                >
                  <option value="popularity">Most popular</option>
                  <option value="quality">Highest quality</option>
                  <option value="trending">Trending (7 days)</option>
                </select>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition duration-200 ${
                    category === c
                      ? "border-violet-400/50 bg-violet-600 text-white shadow-lg shadow-violet-950/30"
                      : "border-white/[0.09] bg-[#12101D] text-[#B0ADC1] hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
              <div className="ml-auto hidden items-center text-xs text-[#77738C] sm:flex">
                {filtered.length} products
              </div>
            </div>

            {/* States */}
            {loading && (
              <div className={`${panel} py-16 text-center`}>
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400" />
                <p className={`mt-4 text-sm ${muted}`}>
                  Loading products...
                </p>
              </div>
            )}

            {!loading && dbError && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-6 text-sm text-red-200">
                Could not load products. Please refresh the page.
              </div>
            )}

            {/* Product cards */}
            {!loading && !dbError && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => {
                  const voted = votes.includes(p.id);

                  return (
                    <article
                      key={p.id}
                      className={`${panel} group relative flex flex-col overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/35 hover:bg-[#211D35] hover:shadow-2xl hover:shadow-violet-950/20 sm:p-6`}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent opacity-0 transition group-hover:opacity-100" />

                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.10] bg-gradient-to-br from-white/[0.08] to-white/[0.02] text-lg font-bold shadow-inner"
                          style={{ color: p.color }}
                        >
                          {p.icon}
                        </div>
                        <span className="rounded-full border border-violet-400/15 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-medium text-violet-200">
                          {p.category}
                        </span>
                      </div>

                      <div className="mt-5">
                        <h3 className="text-xl font-bold tracking-tight">
  <a
    href={`/products/${p.id}`}
    className="transition hover:text-violet-300"
  >
    {p.name}
  </a>
</h3>
                        <p className={`mt-2 min-h-[48px] text-sm leading-6 ${muted}`}>
                          {p.tagline || p.description || "Discover this product and explore what it offers."}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-[#A7A4BB]">
  <span className="text-violet-400">▲</span>
  <span className="font-semibold text-white">
    {p.vote_count}
  </span>
  <span>votes</span>
</div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/[0.06] bg-[#171523] p-3.5">
                          <div className={`text-xs ${muted}`}>
                            Popularity
                          </div>
                          <div className="mt-1.5 text-2xl font-bold">
                            {p.popularity}
                            <span className={`ml-1 text-xs font-normal ${muted}`}>
                              /100
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-[#171523] p-3.5">
                          <div className={`text-xs ${muted}`}>
                            Quality
                          </div>
                          <div className="mt-1.5 text-2xl font-bold">
                            {p.quality}
                            <span className={`ml-1 text-xs font-normal ${muted}`}>
                              /100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2 border-t border-white/[0.07] pt-4">
                        <button
                          
onClick={async () => {
  if (!userId) {
    window.location.href = "/login";
    return;
  }

  if (voteLoading === p.id) return;

  setVoteLoading(p.id);

  try {
    const alreadyVoted = votes.includes(p.id);

    if (alreadyVoted) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("product_id", p.id)
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      const { error } = await supabase.rpc("cast_vote", {
        target_product_id: p.id,
      });

      if (error) throw error;
    }

    const { data, error } = await supabase
      .from("votes")
      .select("product_id")
      .eq("user_id", userId);

    if (error) throw error;

    setVotes((data ?? []).map((vote) => vote.product_id));

  } catch (error) {
    console.error("Ошибка голосования:", error);
    alert("Не удалось сохранить голос. Попробуй ещё раз.");
  } finally {
    setVoteLoading(null);
  }
}}

                          className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                            voted
                              ? "border border-violet-400/30 bg-violet-500/15 text-violet-200"
                              : "bg-violet-600 text-white hover:bg-violet-500"
                          }`}
                        >
                          {voted ? "✓ Voted" : "↑ Vote"}
                        </button>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-white/[0.10] px-4 py-3 text-sm font-semibold transition hover:border-violet-400/30 hover:bg-white/[0.05]"
                        >
                          Visit ↗
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!loading && !dbError && filtered.length === 0 && (
              <div className={`${panel} px-5 py-16 text-center`}>
                <div className="text-3xl">⌕</div>
                <h3 className="mt-4 text-lg font-semibold">
                  No products found
                </h3>
                <p className={`mt-2 text-sm ${muted}`}>
                  Try another search or select a different category.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                  className={`mt-5 ${purpleButton}`}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section
        id="rankings"
        className="scroll-mt-24 border-t border-white/[0.06] bg-[#141120]"
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#19132C] via-[#12101E] to-[#100D19] p-7 sm:p-10 lg:p-14">
            <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-fuchsia-600/[0.08] blur-[100px]" />

            <div className="relative max-w-2xl">
              <div className="inline-flex rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300">
                Beyond the hype
              </div>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
                Popular doesn&apos;t always mean{" "}
                <span className="text-violet-300">better.</span>
              </h2>
              <p className={`mt-5 max-w-xl text-sm leading-7 sm:text-base ${muted}`}>
                Discover what people talk about — and what actually
                delivers value. Popularity and product quality are
                different things.
              </p>
            </div>
<div className="relative mt-10 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#1B192B]">
  <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
    <div>
      <h3 className="text-xl font-bold">Top products</h3>
      <p className={`mt-1 text-sm ${muted}`}>
        The most popular products on LaunchArena
      </p>
    </div>
    <span className="rounded-full bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300">
      TOP 10
    </span>
  </div>

  <div className="divide-y divide-white/[0.06]">
    {leaderboard.map((p, index) => (
      <div
        key={p.id}
        className="flex items-center gap-4 p-4 transition hover:bg-white/[0.03] sm:px-5"
      >
        <div className="w-8 shrink-0 text-center text-lg font-bold text-violet-300">
          #{index + 1}
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] font-bold"
          style={{ color: p.color }}
        >
          {p.icon}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold">
  <a
    href={`/products/${p.id}`}
    className="transition hover:text-violet-300"
  >
    {p.name}
  </a>
</h4>
          <p className={`mt-1 truncate text-xs ${muted}`}>
            {p.category}
          </p>
        </div>

        <div className="text-right">
          <div className="font-bold text-white">
            {p.vote_count}
          </div>
          <div className={`text-xs ${muted}`}>votes</div>
        </div>

        <div className="hidden text-right sm:block">
          <div className="font-semibold text-emerald-300">
            +{p.weekly_votes}
          </div>
          <div className={`text-xs ${muted}`}>7 days</div>
        </div>
      </div>
    ))}
  </div>
</div>
            <div className="relative mt-9 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.09] bg-black/20 p-6 transition hover:border-violet-400/25">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/15 text-2xl text-violet-300">
                  ↗
                </div>
                <h3 className="mt-5 text-xl font-bold">
                  Popularity ranking
                </h3>
                <p className={`mt-2 text-sm leading-6 ${muted}`}>
                  Find products attracting the most community attention.
                </p>
              </div>
              <div className="rounded-2xl border border-white/[0.09] bg-black/20 p-6 transition hover:border-violet-400/25">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 text-2xl text-fuchsia-300">
                  ✳
                </div>
                <h3 className="mt-5 text-xl font-bold">
                  Quality ranking
                </h3>
                <p className={`mt-2 text-sm leading-6 ${muted}`}>
                  Compare usefulness, usability, and value for money.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit CTA */}
      <section className="relative overflow-hidden border-y border-white/[0.07]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 rounded-full bg-violet-700/[0.14] blur-[110px]" />
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:py-24">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
            BUILD IN PUBLIC
          </div>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
            Built something{" "}
            <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              great?
            </span>
          </h2>
          <p className={`mx-auto mt-5 max-w-xl text-sm leading-7 sm:text-base ${muted}`}>
            Put your product in front of people who love discovering
            useful tools and emerging startups.
          </p>
          <a href="/submit" className={`mt-8 ${purpleButton}`}>
            Submit your product <span>↗</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="bg-[#0D0B16]">
        <div className={`mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center lg:px-8 ${muted}`}>
          <a href="#" className="text-base font-bold tracking-tight text-white">
            launch<span className="text-violet-400">arena.</span>
          </a>
          <div>Discover. Compare. Find your next favorite.</div>
          <div className="text-xs">An independent product discovery platform.</div>
        </div>
      </footer>
    </main>
  );
}
