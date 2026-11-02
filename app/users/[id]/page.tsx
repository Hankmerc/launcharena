
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};
type UserProduct = {
  id: string;
  name: string;
  tagline: string;
  category: string;
  logo_url: string | null;
};
type UserComment = {
  id: string;
  product_id: string;
  content: string;
  created_at: string;
  product_name: string;
};

function PublicProfileContent() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<UserProduct[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userComments, setUserComments] = useState<UserComment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
const [isFollowing, setIsFollowing] = useState(false);
const [followersCount, setFollowersCount] = useState(0);
const [followingCount, setFollowingCount] = useState(0);
const [followLoading, setFollowLoading] = useState(false);
async function loadFollowData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  setCurrentUserId(user?.id ?? null);

  const { count: followers } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", id);

  setFollowersCount(followers ?? 0);

  const { count: following } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", id);

  setFollowingCount(following ?? 0);

  if (user && user.id !== id) {
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", id)
      .maybeSingle();

    setIsFollowing(!!data);
  }
}

async function handleFollow() {
  if (!currentUserId || currentUserId === id || followLoading) return;

  setFollowLoading(true);

  if (isFollowing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", id);

    if (!error) {
      setIsFollowing(false);
      setFollowersCount((count) => Math.max(0, count - 1));
    } else {
      console.error("Unfollow error:", error.message);
    }
  } else {
    const { error } = await supabase.from("follows").insert({
      follower_id: currentUserId,
      following_id: id,
    });

    if (!error) {
      setIsFollowing(true);
      setFollowersCount((count) => count + 1);
    } else {
      console.error("Follow error:", error.message);
    }
  }

  setFollowLoading(false);
}
  useEffect(() => {
  async function loadProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Public profile error:", error.message);
    }

    setProfile(data ?? null);

    if (data) {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, name, tagline, category, logo_url")
        .eq("submitted_by", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (productError) {
        console.error("User products error:", productError.message);
      }

      setProducts(productData ?? []);
      if (productData && productData.length > 0) {
  const productIds = productData.map((product) => product.id);

  const { data: voteCounts, error: votesError } = await supabase
    .from("product_vote_counts")
    .select("product_id, vote_count")
    .in("product_id", productIds);

  if (votesError) {
    console.error("User votes loading error:", votesError.message);
  }

  const total = (voteCounts ?? []).reduce(
    (sum, item) => sum + Number(item.vote_count ?? 0),
    0
  );

  setTotalVotes(total);
} else {
  setTotalVotes(0);
}
    }
const { data: commentData, error: commentError } = await supabase
  .from("comments")
  .select("id, product_id, content, created_at")
  .eq("user_id", id)
  .order("created_at", { ascending: false })
  .limit(5);

if (commentError) {
  console.error("User comments loading error:", commentError.message);
}

if (commentData && commentData.length > 0) {
  const productIds = [
    ...new Set(commentData.map((comment) => comment.product_id)),
  ];

  const { data: commentProducts, error: commentProductsError } =
    await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds)
      .eq("status", "approved");

  if (commentProductsError) {
    console.error("Comment products error:", commentProductsError.message);
  }

  const productNames = new Map(
    (commentProducts ?? []).map((product) => [product.id, product.name])
  );

  const formattedComments: UserComment[] = commentData
    .filter((comment) => productNames.has(comment.product_id))
    .map((comment) => ({
      ...comment,
      product_name: productNames.get(comment.product_id) ?? "Product",
    }));

  setUserComments(formattedComments);
} else {
  setUserComments([]);
}
    setLoading(false);
  }

  if (id) {
  loadProfile();
  loadFollowData();
}
}, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100E1B] text-white">
        Loading profile...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#100E1B] text-white">
        <h1 className="text-3xl font-bold">User not found</h1>
        <a href="/" className="mt-5 text-violet-300">
          ← Back to LaunchArena
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#100E1B] px-5 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <a href="/" className="text-xl font-bold">
            launch<span className="text-violet-400">arena.</span>
          </a>

          <a
            href="/profile"
            className="text-sm text-[#A7A4BB] transition hover:text-white"
          >
            Edit my profile
          </a>
        </header>

        <section className="mt-12 rounded-2xl border border-white/10 bg-[#1B192B] p-8 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-violet-500/15 text-4xl font-bold text-violet-300">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                (profile.display_name || "U").slice(0, 1).toUpperCase()
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {profile.display_name || "User"}
              </h1>

              <p className="mt-3 text-sm text-[#A7A4BB]">
                Member since{" "}
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-5">
  <div>
    <span className="font-bold text-white">{followersCount}</span>
    <span className="ml-1 text-sm text-[#A7A4BB]">Followers</span>
  </div>

  <div>
    <span className="font-bold text-white">{followingCount}</span>
    <span className="ml-1 text-sm text-[#A7A4BB]">Following</span>
  </div>
</div>

{currentUserId && currentUserId !== profile.id && (
  <button
    onClick={handleFollow}
    disabled={followLoading}
    className={`mt-5 rounded-xl px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
      isFollowing
        ? "border border-white/15 bg-white/5 text-white hover:bg-white/10"
        : "bg-violet-600 text-white hover:bg-violet-500"
    }`}
  >
    {followLoading
      ? "Loading..."
      : isFollowing
      ? "Following"
      : "Follow"}
  </button>
)}
            </div>
          </div>

          <div className="mt-9 border-t border-white/[0.08] pt-8">
            <h2 className="text-lg font-bold">About</h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#A7A4BB]">
              {profile.bio || "This user hasn't added a description yet."}
            </p>
          </div>
        </section>
        <section className="mt-8 grid grid-cols-2 gap-4">
  <div className="rounded-2xl border border-white/10 bg-[#1B192B] p-5">
    <p className="text-sm text-[#A7A4BB]">
      Published Products
    </p>
    <p className="mt-2 text-3xl font-bold text-white">
      {products.length}
    </p>
  </div>

  <div className="rounded-2xl border border-white/10 bg-[#1B192B] p-5">
    <p className="text-sm text-[#A7A4BB]">
      Total Votes Received
    </p>
    <p className="mt-2 text-3xl font-bold text-violet-300">
      {totalVotes}
    </p>
  </div>
</section>
        <section className="mt-10">
  <div className="mb-6 flex items-center justify-between">
    <h2 className="text-2xl font-bold">My Products</h2>
    <span className="text-sm text-[#A7A4BB]">
      {products.length} products
    </span>
  </div>

  {products.length === 0 ? (
    <div className="rounded-2xl border border-white/10 bg-[#1B192B] p-8 text-center">
      <p className="text-[#A7A4BB]">
        This user hasn't published any products yet.
      </p>
    </div>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2">
      {products.map((product) => (
        <a
          key={product.id}
          href={`/products/${product.id}`}
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1B192B] p-5 transition hover:border-violet-400/40 hover:bg-[#242137]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06] text-lg font-bold text-violet-300">
            {product.logo_url ? (
              <img
                src={product.logo_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              product.name.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-white">
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-[#A7A4BB]">
              {product.tagline || product.category}
            </p>
          </div>

          <span className="text-violet-300">→</span>
        </a>
      ))}
    </div>
  )}
</section>
<section className="mt-12">
  <div className="mb-6 flex items-center justify-between">
    <h2 className="text-2xl font-bold">My Comments</h2>
    <span className="text-sm text-[#A7A4BB]">
      Latest 5
    </span>
  </div>

  {userComments.length === 0 ? (
    <div className="rounded-2xl border border-white/10 bg-[#1B192B] p-8 text-center">
      <p className="text-[#A7A4BB]">
        This user hasn't posted any comments yet.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {userComments.map((comment) => (
        <a
          key={comment.id}
          href={`/products/${comment.product_id}`}
          className="block rounded-2xl border border-white/10 bg-[#1B192B] p-5 transition hover:border-violet-400/40"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-violet-300">
              {comment.product_name}
            </h3>

            <span className="shrink-0 text-xs text-[#A7A4BB]">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#A7A4BB]">
            {comment.content}
          </p>

          <p className="mt-4 text-xs text-violet-300">
            View product →
          </p>
        </a>
      ))}
    </div>
  )}
</section>
      </div>
    </main>
  );
}

export default function PublicProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#100E1B] text-white">
          Loading profile...
        </main>
      }
    >
      <PublicProfileContent />
    </Suspense>
  );
}
