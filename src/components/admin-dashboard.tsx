"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ImpactMetric, Story, Testimonial } from "@/lib/types";

type LoginResponse = {
  data?: {
    token: string;
  };
  error?: string;
};

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
});

const inputClass =
  "w-full rounded-md border border-[var(--card-border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] outline-none placeholder:text-neutral-600 focus:border-[var(--accent)]";
const btnPrimary =
  "rounded-md bg-[var(--accent)] px-4 py-2 font-bold uppercase tracking-wide text-[#0a0a0a] transition hover:bg-[var(--accent-light)]";
const btnSecondary =
  "rounded-md bg-[var(--brand-light)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--brand)]";

export default function AdminDashboard() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("heroes-rise-admin-token") ?? "";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [missionText, setMissionText] = useState("");

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const [metricsRes, storiesRes, testimonialsRes, contentRes] = await Promise.all([
          fetch("/api/impact-metrics"),
          fetch("/api/stories"),
          fetch("/api/testimonials"),
          fetch("/api/admin/content?slug=homepage", { headers: authHeaders(token) })
        ]);

        if (metricsRes.ok) {
          const body = (await metricsRes.json()) as { data: ImpactMetric[] };
          setMetrics(body.data);
        }

        if (storiesRes.ok) {
          const body = (await storiesRes.json()) as { data: Story[] };
          setStories(body.data);
        }

        if (testimonialsRes.ok) {
          const body = (await testimonialsRes.json()) as { data: Testimonial[] };
          setTestimonials(body.data);
        }

        if (contentRes.ok) {
          const body = (await contentRes.json()) as { data?: { content?: { missionText?: string } } };
          setMissionText(body.data?.content?.missionText ?? "");
        }
      } catch {
        setStatus("Unable to load dashboard data.");
      }
    };

    void load();
  }, [token]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Signing in...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const body = (await response.json()) as LoginResponse;
      if (!response.ok || !body.data?.token) {
        setStatus(body.error ?? "Login failed");
        return;
      }

      localStorage.setItem("heroes-rise-admin-token", body.data.token);
      setToken(body.data.token);
      setStatus("Signed in.");
    } catch {
      setStatus("Network error.");
    }
  };

  const saveMetrics = async () => {
    setStatus("Saving metrics...");
    const response = await fetch("/api/impact-metrics", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({
        metrics: metrics.map((metric) => ({
          metric_name: metric.metric_name,
          value: Number(metric.value),
          description: metric.description
        }))
      })
    });

    setStatus(response.ok ? "Metrics updated." : "Unable to update metrics.");
  };

  const createStory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") ?? ""),
      content: String(data.get("content") ?? ""),
      image_url: String(data.get("image_url") ?? "")
    };

    const response = await fetch("/api/stories", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Unable to create story.");
      return;
    }

    const body = (await response.json()) as { data: Story };
    setStories((prev) => [body.data, ...prev]);
    event.currentTarget.reset();
    setStatus("Story created.");
  };

  const createTestimonial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      role: String(data.get("role") ?? ""),
      story: String(data.get("story") ?? ""),
      image_url: String(data.get("image_url") ?? "")
    };

    const response = await fetch("/api/testimonials", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setStatus("Unable to create testimonial.");
      return;
    }

    const body = (await response.json()) as { data: Testimonial };
    setTestimonials((prev) => [body.data, ...prev]);
    event.currentTarget.reset();
    setStatus("Testimonial created.");
  };

  const saveCms = async () => {
    setStatus("Saving homepage content...");
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({
        slug: "homepage",
        content: { missionText }
      })
    });
    setStatus(response.ok ? "Homepage content saved." : "Unable to save homepage content.");
  };

  if (!token) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-16">
        <h1 className="text-3xl font-bold text-white">Admin Login</h1>
        <form onSubmit={handleLogin} className="mt-6 card space-y-3 p-6">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="Admin email"
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Password"
            className={inputClass}
          />
          <button type="submit" className={btnPrimary}>
            Sign In
          </button>
          <p className="text-sm text-[var(--muted)]">{status}</p>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Heroes Rise Admin Dashboard</h1>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("heroes-rise-admin-token");
            setToken("");
          }}
          className="rounded-md border border-[var(--card-border)] px-4 py-2 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Sign out
        </button>
      </header>
      <p className="text-sm text-[var(--accent)]">{status}</p>

      <section className="card p-6">
        <h2 className="text-xl font-bold text-white">Impact Metrics</h2>
        <div className="mt-4 space-y-3">
          {metrics.map((metric, index) => (
            <div key={metric.id} className="grid gap-2 md:grid-cols-[1fr_160px_2fr]">
              <input
                value={metric.metric_name}
                onChange={(event) =>
                  setMetrics((prev) =>
                    prev.map((item, idx) =>
                      idx === index ? { ...item, metric_name: event.target.value } : item
                    )
                  )
                }
                className={inputClass}
              />
              <input
                type="number"
                value={metric.value}
                onChange={(event) =>
                  setMetrics((prev) =>
                    prev.map((item, idx) =>
                      idx === index ? { ...item, value: Number(event.target.value) } : item
                    )
                  )
                }
                className={inputClass}
              />
              <input
                value={metric.description}
                onChange={(event) =>
                  setMetrics((prev) =>
                    prev.map((item, idx) =>
                      idx === index ? { ...item, description: event.target.value } : item
                    )
                  )
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setMetrics((prev) => [
              ...prev,
              {
                id: Date.now(),
                metric_name: "New Metric",
                value: 0,
                description: "Description",
                updated_at: new Date().toISOString()
              }
            ])
          }
          className="mt-4 rounded-md border border-[var(--card-border)] px-3 py-2 text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Add Metric Row
        </button>
        <button type="button" onClick={saveMetrics} className={`mt-4 ml-3 ${btnPrimary}`}>
          Save Metrics
        </button>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="card p-6">
          <h2 className="text-xl font-bold text-white">Create Story</h2>
          <form className="mt-3 space-y-2" onSubmit={createStory}>
            <input name="title" required placeholder="Title" className={inputClass} />
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Story content"
              className={inputClass}
            />
            <input
              name="image_url"
              required
              placeholder="Image URL"
              className={inputClass}
            />
            <button type="submit" className={btnSecondary}>
              Publish Story
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {stories.map((story) => (
              <li key={story.id} className="rounded-md border border-[var(--card-border)] px-3 py-2 text-[var(--muted)]">
                {story.title}
              </li>
            ))}
          </ul>
        </article>

        <article className="card p-6">
          <h2 className="text-xl font-bold text-white">Create Testimonial</h2>
          <form className="mt-3 space-y-2" onSubmit={createTestimonial}>
            <input name="name" required placeholder="Name" className={inputClass} />
            <input name="role" required placeholder="Role" className={inputClass} />
            <textarea
              name="story"
              required
              rows={4}
              placeholder="Testimonial"
              className={inputClass}
            />
            <input
              name="image_url"
              required
              placeholder="Image URL"
              className={inputClass}
            />
            <button type="submit" className={btnSecondary}>
              Publish Testimonial
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {testimonials.map((testimonial) => (
              <li key={testimonial.id} className="rounded-md border border-[var(--card-border)] px-3 py-2 text-[var(--muted)]">
                {testimonial.name} — {testimonial.role}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-bold text-white">Simple CMS (Homepage Mission Text)</h2>
        <textarea
          rows={5}
          value={missionText}
          onChange={(event) => setMissionText(event.target.value)}
          className={`mt-3 ${inputClass}`}
        />
        <button type="button" onClick={saveCms} className={`mt-3 ${btnPrimary}`}>
          Save Content
        </button>
      </section>
    </main>
  );
}
