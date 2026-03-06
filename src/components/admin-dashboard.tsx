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
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <form onSubmit={handleLogin} className="mt-6 space-y-3 rounded-2xl border bg-white p-6">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="Admin email"
            className="w-full rounded-lg border px-3 py-2"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Password"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white">
            Sign In
          </button>
          <p className="text-sm text-slate-600">{status}</p>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Heroes Rise Admin Dashboard</h1>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("heroes-rise-admin-token");
            setToken("");
          }}
          className="rounded-lg border px-4 py-2"
        >
          Sign out
        </button>
      </header>
      <p className="text-sm text-slate-600">{status}</p>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Impact Metrics</h2>
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
                className="rounded border px-3 py-2"
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
                className="rounded border px-3 py-2"
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
                className="rounded border px-3 py-2"
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
          className="mt-4 rounded border px-3 py-2"
        >
          Add Metric Row
        </button>
        <button type="button" onClick={saveMetrics} className="mt-4 ml-3 rounded bg-blue-700 px-4 py-2 text-white">
          Save Metrics
        </button>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Create Story</h2>
          <form className="mt-3 space-y-2" onSubmit={createStory}>
            <input name="title" required placeholder="Title" className="w-full rounded border px-3 py-2" />
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Story content"
              className="w-full rounded border px-3 py-2"
            />
            <input
              name="image_url"
              required
              placeholder="Image URL"
              className="w-full rounded border px-3 py-2"
            />
            <button type="submit" className="rounded bg-teal-700 px-4 py-2 text-white">
              Publish Story
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {stories.map((story) => (
              <li key={story.id} className="rounded border px-3 py-2">
                {story.title}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Create Testimonial</h2>
          <form className="mt-3 space-y-2" onSubmit={createTestimonial}>
            <input name="name" required placeholder="Name" className="w-full rounded border px-3 py-2" />
            <input name="role" required placeholder="Role" className="w-full rounded border px-3 py-2" />
            <textarea
              name="story"
              required
              rows={4}
              placeholder="Testimonial"
              className="w-full rounded border px-3 py-2"
            />
            <input
              name="image_url"
              required
              placeholder="Image URL"
              className="w-full rounded border px-3 py-2"
            />
            <button type="submit" className="rounded bg-teal-700 px-4 py-2 text-white">
              Publish Testimonial
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {testimonials.map((testimonial) => (
              <li key={testimonial.id} className="rounded border px-3 py-2">
                {testimonial.name} — {testimonial.role}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Simple CMS (Homepage Mission Text)</h2>
        <textarea
          rows={5}
          value={missionText}
          onChange={(event) => setMissionText(event.target.value)}
          className="mt-3 w-full rounded border px-3 py-2"
        />
        <button type="button" onClick={saveCms} className="mt-3 rounded bg-blue-700 px-4 py-2 text-white">
          Save Content
        </button>
      </section>
    </main>
  );
}
