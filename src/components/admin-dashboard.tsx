"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { defaultSiteContent } from "@/lib/constants";
import type { ImpactMetric, SiteContent, Story, Testimonial } from "@/lib/types";

type Tab = "page" | "stories" | "testimonials" | "metrics";

type LoginResponse = { data?: { token: string }; error?: string };

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

const inputClass =
  "w-full rounded-md border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] outline-none placeholder:text-neutral-600 focus:border-[var(--accent)] text-sm";
const textareaClass = `${inputClass} resize-y`;
const btnPrimary =
  "rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#0a0a0a] transition hover:bg-[var(--accent-light)]";
const btnSecondary =
  "rounded-md bg-[var(--brand-light)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand)]";
const btnDanger =
  "rounded-md bg-red-900/60 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-800/80";
const btnOutline =
  "rounded-md border border-[var(--card-border)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1";
const sectionCard = "card p-5 space-y-4";

function ImageField({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or upload a file"
          className={`${inputClass} flex-1`}
        />
        <label className={`${btnOutline} cursor-pointer whitespace-nowrap`}>
          Upload
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {value && (
        <div className="relative h-28 w-44 overflow-hidden rounded-md border border-[var(--card-border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("heroes-rise-admin-token") ?? "";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [tab, setTab] = useState<Tab>("page");

  const [site, setSite] = useState<SiteContent>(structuredClone(defaultSiteContent));
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const flash = useCallback((msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(""), 3000);
  }, []);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [metricsRes, storiesRes, testimonialsRes, contentRes] = await Promise.all([
          fetch("/api/impact-metrics"),
          fetch("/api/stories"),
          fetch("/api/testimonials"),
          fetch("/api/admin/content?slug=site-content", { headers: authHeaders(token) })
        ]);
        if (metricsRes.ok) {
          const b = (await metricsRes.json()) as { data: ImpactMetric[] };
          setMetrics(b.data);
        }
        if (storiesRes.ok) {
          const b = (await storiesRes.json()) as { data: Story[] };
          setStories(b.data);
        }
        if (testimonialsRes.ok) {
          const b = (await testimonialsRes.json()) as { data: Testimonial[] };
          setTestimonials(b.data);
        }
        if (contentRes.ok) {
          const b = (await contentRes.json()) as { data?: { content?: Partial<SiteContent> } };
          if (b.data?.content) {
            setSite((prev) => {
              const merged = deepMerge(
                prev as unknown as Record<string, unknown>,
                b.data!.content! as unknown as Record<string, unknown>
              );
              return merged as unknown as SiteContent;
            });
          }
        }
      } catch {
        flash("Unable to load dashboard data.");
      }
    };
    void load();
  }, [token, flash]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSigningIn) return;

    setIsSigningIn(true);
    setStatus("Signing in...");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      const body = (await res.json().catch(() => null)) as LoginResponse | null;
      const authToken = body?.data?.token;
      if (!res.ok || !authToken) {
        setStatus(body?.error ?? "Login failed.");
        return;
      }
      localStorage.setItem("heroes-rise-admin-token", authToken);
      setToken(authToken);
      flash("Signed in.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("Login request timed out. Please try again.");
      } else {
        setStatus("Network error. Please try again.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsSigningIn(false);
    }
  };

  const saveSiteContent = async () => {
    flash("Saving page content...");
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ slug: "site-content", content: site })
    });
    flash(res.ok ? "Page content saved." : "Unable to save.");
  };

  const saveMetrics = async () => {
    flash("Saving metrics...");
    const res = await fetch("/api/impact-metrics", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({
        metrics: metrics.map((m) => ({
          metric_name: m.metric_name,
          value: Number(m.value),
          description: m.description
        }))
      })
    });
    flash(res.ok ? "Metrics saved." : "Unable to save metrics.");
  };

  const createStory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? ""),
      content: String(fd.get("content") ?? ""),
      image_url: String(fd.get("image_url") ?? "")
    };
    const res = await fetch("/api/stories", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload)
    });
    if (!res.ok) return flash("Unable to create story.");
    const b = (await res.json()) as { data: Story };
    setStories((p) => [b.data, ...p]);
    event.currentTarget.reset();
    flash("Story created.");
  };

  const deleteStory = async (id: number) => {
    const res = await fetch(`/api/stories/${id}`, {
      method: "DELETE",
      headers: authHeaders(token)
    });
    if (res.ok) {
      setStories((p) => p.filter((s) => s.id !== id));
      flash("Story deleted.");
    }
  };

  const createTestimonial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      role: String(fd.get("role") ?? ""),
      story: String(fd.get("story") ?? ""),
      image_url: String(fd.get("image_url") ?? "")
    };
    const res = await fetch("/api/testimonials", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload)
    });
    if (!res.ok) return flash("Unable to create testimonial.");
    const b = (await res.json()) as { data: Testimonial };
    setTestimonials((p) => [b.data, ...p]);
    event.currentTarget.reset();
    flash("Testimonial created.");
  };

  const deleteTestimonial = async (id: number) => {
    const res = await fetch(`/api/testimonials/${id}`, {
      method: "DELETE",
      headers: authHeaders(token)
    });
    if (res.ok) {
      setTestimonials((p) => p.filter((t) => t.id !== id));
      flash("Testimonial deleted.");
    }
  };

  const updateSite = <K extends keyof SiteContent>(
    section: K,
    field: keyof SiteContent[K],
    value: string
  ) => {
    setSite((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  if (!token) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-16">
        <h1 className="text-3xl font-bold text-white">Admin Login</h1>
        <form onSubmit={handleLogin} className="mt-6 card space-y-3 p-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Admin email"
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isSigningIn}
            className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isSigningIn ? "Signing In..." : "Sign In"}
          </button>
          <p className="text-sm text-[var(--muted)]">{status}</p>
        </form>
      </main>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "page", label: "Page Content" },
    { key: "stories", label: "Stories" },
    { key: "testimonials", label: "Testimonials" },
    { key: "metrics", label: "Metrics" }
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("heroes-rise-admin-token");
            setToken("");
          }}
          className={btnOutline}
        >
          Sign out
        </button>
      </header>

      {status && (
        <p className="rounded-md bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)]">
          {status}
        </p>
      )}

      {/* Tabs */}
      <nav className="flex gap-1 rounded-lg bg-[var(--card)] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-[var(--accent)] text-[#0a0a0a]"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ─── Page Content Tab ─── */}
      {tab === "page" && (
        <div className="space-y-6">
          {/* Hero */}
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Hero Section</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Badge Text</label>
                <input
                  className={inputClass}
                  value={site.hero.badge}
                  onChange={(e) => updateSite("hero", "badge", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Primary CTA</label>
                <input
                  className={inputClass}
                  value={site.hero.cta_primary}
                  onChange={(e) => updateSite("hero", "cta_primary", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Tagline</label>
              <input
                className={inputClass}
                value={site.hero.tagline}
                onChange={(e) => updateSite("hero", "tagline", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Subtitle</label>
              <textarea
                className={textareaClass}
                rows={3}
                value={site.hero.subtitle}
                onChange={(e) => updateSite("hero", "subtitle", e.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Secondary CTA</label>
                <input
                  className={inputClass}
                  value={site.hero.cta_secondary}
                  onChange={(e) => updateSite("hero", "cta_secondary", e.target.value)}
                />
              </div>
            </div>
            <ImageField
              label="Background Image"
              value={site.hero.background_image}
              onChange={(url) => updateSite("hero", "background_image", url)}
            />
          </section>

          {/* About */}
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">About / Mission Section</h2>
            <div>
              <label className={labelClass}>Heading</label>
              <input
                className={inputClass}
                value={site.about.heading}
                onChange={(e) => updateSite("about", "heading", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={textareaClass}
                rows={4}
                value={site.about.description}
                onChange={(e) => updateSite("about", "description", e.target.value)}
              />
            </div>
          </section>

          {/* Services */}
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Services Section</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Heading</label>
                <input
                  className={inputClass}
                  value={site.services.heading}
                  onChange={(e) =>
                    setSite((p) => ({
                      ...p,
                      services: { ...p.services, heading: e.target.value }
                    }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input
                  className={inputClass}
                  value={site.services.subtitle}
                  onChange={(e) =>
                    setSite((p) => ({
                      ...p,
                      services: { ...p.services, subtitle: e.target.value }
                    }))
                  }
                />
              </div>
            </div>
            {site.services.cards.map((card, i) => (
              <div key={i} className="rounded-lg border border-[var(--card-border)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[var(--muted)]">Card {i + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSite((p) => ({
                        ...p,
                        services: {
                          ...p.services,
                          cards: p.services.cards.filter((_, idx) => idx !== i)
                        }
                      }))
                    }
                    className={btnDanger}
                  >
                    Remove
                  </button>
                </div>
                <input
                  className={inputClass}
                  placeholder="Title"
                  value={card.title}
                  onChange={(e) =>
                    setSite((p) => ({
                      ...p,
                      services: {
                        ...p.services,
                        cards: p.services.cards.map((c, idx) =>
                          idx === i ? { ...c, title: e.target.value } : c
                        )
                      }
                    }))
                  }
                />
                <textarea
                  className={textareaClass}
                  rows={2}
                  placeholder="Description"
                  value={card.description}
                  onChange={(e) =>
                    setSite((p) => ({
                      ...p,
                      services: {
                        ...p.services,
                        cards: p.services.cards.map((c, idx) =>
                          idx === i ? { ...c, description: e.target.value } : c
                        )
                      }
                    }))
                  }
                />
                <ImageField
                  label="Card Image"
                  value={card.image}
                  onChange={(url) =>
                    setSite((p) => ({
                      ...p,
                      services: {
                        ...p.services,
                        cards: p.services.cards.map((c, idx) =>
                          idx === i ? { ...c, image: url } : c
                        )
                      }
                    }))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setSite((p) => ({
                  ...p,
                  services: {
                    ...p.services,
                    cards: [...p.services.cards, { title: "", description: "", image: "" }]
                  }
                }))
              }
              className={btnOutline}
            >
              + Add Service Card
            </button>
          </section>

          {/* Get Involved */}
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Get Involved Section</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Heading</label>
                <input
                  className={inputClass}
                  value={site.involved.heading}
                  onChange={(e) => updateSite("involved", "heading", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input
                  className={inputClass}
                  value={site.involved.subtitle}
                  onChange={(e) => updateSite("involved", "subtitle", e.target.value)}
                />
              </div>
            </div>
            {site.involved.cards.map((card, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    className={inputClass}
                    placeholder="Title"
                    value={card.title}
                    onChange={(e) =>
                      setSite((p) => ({
                        ...p,
                        involved: {
                          ...p.involved,
                          cards: p.involved.cards.map((c, idx) =>
                            idx === i ? { ...c, title: e.target.value } : c
                          )
                        }
                      }))
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Description"
                    value={card.text}
                    onChange={(e) =>
                      setSite((p) => ({
                        ...p,
                        involved: {
                          ...p.involved,
                          cards: p.involved.cards.map((c, idx) =>
                            idx === i ? { ...c, text: e.target.value } : c
                          )
                        }
                      }))
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSite((p) => ({
                      ...p,
                      involved: {
                        ...p.involved,
                        cards: p.involved.cards.filter((_, idx) => idx !== i)
                      }
                    }))
                  }
                  className={btnDanger}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setSite((p) => ({
                  ...p,
                  involved: {
                    ...p.involved,
                    cards: [...p.involved.cards, { title: "", text: "" }]
                  }
                }))
              }
              className={btnOutline}
            >
              + Add Card
            </button>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Primary CTA Label</label>
                <input
                  className={inputClass}
                  value={site.involved.cta_primary}
                  onChange={(e) => updateSite("involved", "cta_primary", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Secondary CTA Label</label>
                <input
                  className={inputClass}
                  value={site.involved.cta_secondary}
                  onChange={(e) => updateSite("involved", "cta_secondary", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Newsletter & Contact */}
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Newsletter & Contact Headings</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Newsletter Heading</label>
                  <input
                    className={inputClass}
                    value={site.newsletter.heading}
                    onChange={(e) => updateSite("newsletter", "heading", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Newsletter Description</label>
                  <textarea
                    className={textareaClass}
                    rows={2}
                    value={site.newsletter.description}
                    onChange={(e) => updateSite("newsletter", "description", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Contact Heading</label>
                  <input
                    className={inputClass}
                    value={site.contact.heading}
                    onChange={(e) => updateSite("contact", "heading", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact Description</label>
                  <textarea
                    className={textareaClass}
                    rows={2}
                    value={site.contact.description}
                    onChange={(e) => updateSite("contact", "description", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Footer</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Organization Name</label>
                <input
                  className={inputClass}
                  value={site.footer.org_name}
                  onChange={(e) => updateSite("footer", "org_name", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Tagline</label>
                <input
                  className={inputClass}
                  value={site.footer.tagline}
                  onChange={(e) => updateSite("footer", "tagline", e.target.value)}
                />
              </div>
            </div>
          </section>

          <button type="button" onClick={saveSiteContent} className={`w-full py-3 ${btnPrimary}`}>
            Save All Page Content
          </button>
        </div>
      )}

      {/* ─── Stories Tab ─── */}
      {tab === "stories" && (
        <div className="space-y-6">
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Create Story</h2>
            <form className="space-y-3" onSubmit={createStory}>
              <div>
                <label className={labelClass}>Title</label>
                <input name="title" required placeholder="Story title" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Content</label>
                <textarea
                  name="content"
                  required
                  rows={4}
                  placeholder="Full story content"
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Image URL</label>
                <input
                  name="image_url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  className={inputClass}
                />
              </div>
              <button type="submit" className={btnSecondary}>
                Publish Story
              </button>
            </form>
          </section>

          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Published Stories</h2>
            {stories.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No stories yet.</p>
            )}
            {stories.map((story) => (
              <div
                key={story.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--card-border)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{story.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">{story.content}</p>
                </div>
                <button type="button" onClick={() => deleteStory(story.id)} className={btnDanger}>
                  Delete
                </button>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ─── Testimonials Tab ─── */}
      {tab === "testimonials" && (
        <div className="space-y-6">
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Create Testimonial</h2>
            <form className="space-y-3" onSubmit={createTestimonial}>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Name</label>
                  <input name="name" required placeholder="Full name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <input name="role" required placeholder="e.g. Army Spouse" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Quote</label>
                <textarea
                  name="story"
                  required
                  rows={3}
                  placeholder="Their testimonial"
                  className={textareaClass}
                />
              </div>
              <div>
                <label className={labelClass}>Photo URL</label>
                <input
                  name="image_url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  className={inputClass}
                />
              </div>
              <button type="submit" className={btnSecondary}>
                Publish Testimonial
              </button>
            </form>
          </section>

          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Published Testimonials</h2>
            {testimonials.length === 0 && (
              <p className="text-sm text-[var(--muted)]">No testimonials yet.</p>
            )}
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--card-border)] p-3"
              >
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[var(--accent)]">{t.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTestimonial(t.id)}
                  className={btnDanger}
                >
                  Delete
                </button>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* ─── Metrics Tab ─── */}
      {tab === "metrics" && (
        <div className="space-y-6">
          <section className={sectionCard}>
            <h2 className="text-lg font-bold text-white">Impact Metrics</h2>
            {metrics.map((metric, i) => (
              <div key={metric.id} className="grid gap-2 md:grid-cols-[1fr_120px_2fr]">
                <input
                  className={inputClass}
                  placeholder="Metric name"
                  value={metric.metric_name}
                  onChange={(e) =>
                    setMetrics((p) =>
                      p.map((m, idx) =>
                        idx === i ? { ...m, metric_name: e.target.value } : m
                      )
                    )
                  }
                />
                <input
                  type="number"
                  className={inputClass}
                  value={metric.value}
                  onChange={(e) =>
                    setMetrics((p) =>
                      p.map((m, idx) =>
                        idx === i ? { ...m, value: Number(e.target.value) } : m
                      )
                    )
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Description"
                  value={metric.description}
                  onChange={(e) =>
                    setMetrics((p) =>
                      p.map((m, idx) =>
                        idx === i ? { ...m, description: e.target.value } : m
                      )
                    )
                  }
                />
              </div>
            ))}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setMetrics((p) => [
                    ...p,
                    {
                      id: Date.now(),
                      metric_name: "",
                      value: 0,
                      description: "",
                      updated_at: new Date().toISOString()
                    }
                  ])
                }
                className={btnOutline}
              >
                + Add Metric
              </button>
              <button type="button" onClick={saveMetrics} className={btnPrimary}>
                Save Metrics
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
