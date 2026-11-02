
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile loading error:", error.message);
        setMessage("Could not load your profile.");
      } else if (data) {
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setBio(data.bio ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || saving) return;

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          display_name: displayName.trim() || "User",
          avatar_url: avatarUrl.trim() || null,
          bio: bio.trim() || null,
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Profile saving error:", error.message);
      setMessage("Could not save your profile. Please try again.");
    } else {
      setMessage("Profile saved successfully!");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100E1B] text-white">
        Loading profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#100E1B] px-5 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <a href="/" className="text-xl font-bold">
          launch<span className="text-violet-400">arena.</span>
        </a>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#1B192B] p-7 shadow-lg sm:p-10">
          <h1 className="text-3xl font-bold">Your profile</h1>
          <p className="mt-2 text-sm text-[#A7A4BB]">
            Customize how other people see you on LaunchArena.
          </p>

          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                value={email}
                disabled
                className="w-full rounded-xl border border-white/10 bg-[#171523] px-4 py-3 text-sm text-[#77738D]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Display name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                placeholder="Your name"
                required
                className="w-full rounded-xl border border-white/10 bg-[#171523] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                className="w-full rounded-xl border border-white/10 bg-[#171523] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
              />
              <p className="mt-2 text-xs text-[#A7A4BB]">
                Paste a direct link to your profile picture.
              </p>
            </div>

            {avatarUrl.trim() && (
              <div className="flex items-center gap-3">
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="h-16 w-16 rounded-full border border-white/10 object-cover"
                />
                <span className="text-sm text-[#A7A4BB]">
                  Avatar preview
                </span>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
                About you
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                placeholder="Tell the community a little about yourself..."
                className="w-full resize-y rounded-xl border border-white/10 bg-[#171523] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
              />
            </div>

            {message && (
              <p className="text-sm text-violet-300">{message}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-violet-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
