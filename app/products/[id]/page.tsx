
"use client";

import { Suspense, useEffect, useState } from "react";
import type React from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  tagline: string;
  website_url: string;
  logo_url: string | null;
  submitted_by: string | null;
};

type Comment = {
  id: string;
  product_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
  avatar_url?: string | null;
};

function ProductPageContent() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [author, setAuthor] = useState<{
  id: string;
  display_name: string | null;
  avatar_url: string | null;
} | null>(null);
  const [votes, setVotes] = useState(0);
  const [weeklyVotes, setWeeklyVotes] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
const [commentText, setCommentText] = useState("");
const [commentsLoading, setCommentsLoading] = useState(true);
const [commentSending, setCommentSending] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const { data, error } = await supabase
        .from("products")
        .select(
  "id, name, category, description, tagline, website_url, logo_url, submitted_by"
)
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (error) {
        console.error("Product loading error:", error.message);
        setLoading(false);
        return;
      }

      setProduct(data);
      if (data.submitted_by) {
  const { data: authorData, error: authorError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", data.submitted_by)
    .maybeSingle();

  if (authorError) {
    console.error("Author loading error:", authorError.message);
  }

  setAuthor(authorData ?? null);
}

      const { data: voteData } = await supabase
        .from("product_vote_counts")
        .select("vote_count")
        .eq("product_id", id)
        .maybeSingle();

      setVotes(voteData?.vote_count ?? 0);

      const { data: trendingData } = await supabase
        .from("product_trending")
        .select("weekly_votes")
        .eq("product_id", id)
        .maybeSingle();

      setWeeklyVotes(trendingData?.weekly_votes ?? 0);

      setLoading(false);
    }

    if (id) loadProduct();
  }, [id]);
  useEffect(() => {
  async function loadComments() {
    setCommentsLoading(true);

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (error) {
  console.error("Comments loading error:", error.message);
} else {
  const commentList = data ?? [];

  const userIds = [
    ...new Set(commentList.map((comment) => comment.user_id)),
  ];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    console.error("Profiles loading error:", profilesError.message);
  }

  const profilesMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  setComments(
    commentList.map((comment) => ({
      ...comment,
      display_name:
        profilesMap.get(comment.user_id)?.display_name || "User",
      avatar_url: profilesMap.get(comment.user_id)?.avatar_url ?? null,
    }))
  );
}

    setCommentsLoading(false);
  }

  if (id) {
    loadComments();
  }
}, [id]);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);

      if (data.user) {
        const { data: voteData } = await supabase
          .from("votes")
          .select("id")
          .eq("product_id", id)
          .eq("user_id", data.user.id)
          .maybeSingle();

        setVoted(!!voteData);
      }
    }

    if (id) loadUser();
  }, [id]);

  async function handleVote() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    if (voteLoading || !product) return;

    setVoteLoading(true);

    try {
      if (voted) {
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("product_id", id)
          .eq("user_id", userId);

        if (error) throw error;
        setVoted(false);
        setVotes((old) => Math.max(0, old - 1));
      } else {
        const { error } = await supabase.rpc("cast_vote", {
          target_product_id: id,
        });

        if (error) throw error;
        setVoted(true);
        setVotes((old) => old + 1);
      }

      const { data } = await supabase
        .from("product_trending")
        .select("weekly_votes")
        .eq("product_id", id)
        .maybeSingle();

      setWeeklyVotes(data?.weekly_votes ?? 0);
    } catch (error) {
      console.error("Voting error:", error);
      alert("Could not save your vote. Please try again.");

      const { data } = await supabase
        .from("product_vote_counts")
        .select("vote_count")
        .eq("product_id", id)
        .maybeSingle();

      setVotes(data?.vote_count ?? 0);
    } finally {
      setVoteLoading(false);
    }
  }
  async function handleCommentSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (!userId) {
    window.location.href = "/login";
    return;
  }

  const content = commentText.trim();

  if (!content || commentSending) return;

  setCommentSending(true);

  const { data, error } = await supabase
    .from("comments")
    .insert({
      product_id: id,
      user_id: userId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Comment error:", error.message);
    alert("Could not publish your comment. Please try again.");
  } else {
    setComments((old) => [data, ...old]);
    setCommentText("");
  }

  setCommentSending(false);
}

async function handleDeleteComment(commentId: string) {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    console.error("Delete comment error:", error.message);
    alert("Could not delete your comment.");
    return;
  }

  setComments((old) =>
    old.filter((comment) => comment.id !== commentId)
  );
}

  const panel =
    "rounded-2xl border border-white/[0.10] bg-[#1B192B] shadow-lg shadow-black/20";

  const muted = "text-[#A7A4BB]";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100E1B] text-white">
        Loading product...
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#100E1B] px-5 text-center text-white">
        <h1 className="text-3xl font-bold">Product not found</h1>
        <a href="/" className="mt-5 text-violet-300 hover:text-violet-200">
          ← Back to LaunchArena
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#100E1B] text-white">
      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <a href="/" className="text-xl font-bold">
            launch<span className="text-violet-400">arena.</span>
          </a>
          <a href="/" className="text-sm text-[#A7A4BB] hover:text-white">
            ← Explore products
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className={`${panel} overflow-hidden p-7 sm:p-10`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] text-2xl font-bold text-violet-300">
              {product.logo_url ? (
                <img
                  src={product.logo_url}
                  alt={`${product.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                product.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
                {product.category}
              </span>

              <h1 className="mt-5 text-3xl font-bold sm:text-5xl">
                {product.name}
              </h1>

              <p className={`mt-3 text-lg ${muted}`}>
                {product.tagline || product.description}
              </p>
              {author && (
  <div className="mt-7 flex items-center gap-3">
    <a
      href={`/users/${author.id}`}
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-violet-500/15 text-sm font-bold text-violet-300"
    >
      {author.avatar_url ? (
        <img
          src={author.avatar_url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        (author.display_name || "U").slice(0, 1).toUpperCase()
      )}
    </a>

    <div>
      <p className={`text-xs ${muted}`}>Submitted by</p>
      <a
        href={`/users/${author.id}`}
        className="text-sm font-semibold text-white transition hover:text-violet-300"
      >
        {author.display_name || "User"}
      </a>
    </div>
  </div>
)}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.07] bg-[#171523] p-5">
              <div className={`text-sm ${muted}`}>Total votes</div>
              <div className="mt-2 text-3xl font-bold">{votes}</div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-[#171523] p-5">
              <div className={`text-sm ${muted}`}>Last 7 days</div>
              <div className="mt-2 text-3xl font-bold text-emerald-300">
                {weeklyVotes}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/[0.08] pt-8">
            <h2 className="text-xl font-bold">About this product</h2>

            <p className={`mt-4 whitespace-pre-line text-sm leading-7 ${muted}`}>
              {product.description || "No description available yet."}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleVote}
              disabled={voteLoading}
              className={`flex-1 rounded-xl px-6 py-4 text-sm font-semibold transition ${
                voted
                  ? "border border-violet-400/30 bg-violet-500/15 text-violet-200"
                  : "bg-violet-600 text-white hover:bg-violet-500"
              } disabled:opacity-50`}
            >
              {voteLoading
                ? "Saving..."
                : voted
                  ? "✓ Voted"
                  : "↑ Vote for this product"}
            </button>

            <a
              href={product.website_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-xl border border-white/10 px-6 py-4 text-center text-sm font-semibold transition hover:bg-white/[0.05]"
            >
              Visit website ↗
            </a>
          </div>
                    <div className="mt-10 border-t border-white/[0.08] pt-8">
            <h2 className="text-xl font-bold">
              Community comments ({comments.length})
            </h2>

            <form onSubmit={handleCommentSubmit} className="mt-5">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  userId
                    ? "Share your thoughts about this product..."
                    : "Log in to leave a comment..."
                }
                maxLength={2000}
                rows={4}
                className="w-full resize-y rounded-xl border border-white/10 bg-[#171523] p-4 text-sm text-white outline-none placeholder:text-[#77738D] focus:border-violet-400/50"
              />

              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={commentSending || !commentText.trim()}
                  className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {commentSending ? "Publishing..." : "Post comment"}
                </button>
              </div>
            </form>

            <div className="mt-8 space-y-4">
              {commentsLoading ? (
                <p className={muted}>Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className={muted}>
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl border border-white/[0.07] bg-[#171523] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-violet-500/15 text-sm font-bold text-violet-300">
    {comment.avatar_url ? (
      <img
        src={comment.avatar_url}
        alt=""
        className="h-full w-full object-cover"
      />
    ) : (
      (comment.display_name || "U").slice(0, 1).toUpperCase()
    )}
  </div>

  <div>
    <div className="text-sm font-semibold text-violet-300">
      <a
  href={`/users/${comment.user_id}`}
  className="font-semibold text-white transition hover:text-violet-300"
>
  {comment.display_name || "User"}
</a>

{comment.user_id === userId && (
  <span className="ml-2 text-xs text-[#A7A4BB]">
    (You)
  </span>
)}
    </div>
  </div>
</div>

                      <span className={`text-xs ${muted}`}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/80">
                      {comment.content}
                    </p>

                    {comment.user_id === userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="mt-4 text-xs text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#100E1B] text-white">
          Loading product...
        </main>
      }
    >
      <ProductPageContent />
    </Suspense>
  );
}