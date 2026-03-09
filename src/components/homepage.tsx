"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  defaultSiteContent,
  fallbackMetrics,
  fallbackStories,
  fallbackTestimonials,
  navLinks
} from "@/lib/constants";
import type { ImpactMetric, SiteContent, Story, Testimonial } from "@/lib/types";

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

const formatMetricValue = (value: number) => value.toLocaleString();

export default function Homepage() {
  const [site, setSite] = useState<SiteContent>(defaultSiteContent);
  const [metrics, setMetrics] = useState<ImpactMetric[]>(fallbackMetrics);
  const [stories, setStories] = useState<Story[]>(fallbackStories);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [contactStatus, setContactStatus] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [donationLoading, setDonationLoading] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "https://heroes-rise-foundation.vercel.app";
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsRes, storiesRes, testimonialsRes, contentRes] = await Promise.all([
          fetch("/api/impact-metrics"),
          fetch("/api/stories"),
          fetch("/api/testimonials"),
          fetch("/api/content/site-content")
        ]);

        if (metricsRes.ok) {
          const d = (await metricsRes.json()) as { data: ImpactMetric[] };
          if (d.data.length > 0) setMetrics(d.data);
        }
        if (storiesRes.ok) {
          const d = (await storiesRes.json()) as { data: Story[] };
          if (d.data.length > 0) setStories(d.data);
        }
        if (testimonialsRes.ok) {
          const d = (await testimonialsRes.json()) as { data: Testimonial[] };
          if (d.data.length > 0) setTestimonials(d.data);
        }
        if (contentRes.ok) {
          const d = (await contentRes.json()) as { data?: { content?: Partial<SiteContent> } };
          if (d.data?.content) {
            setSite((prev) => mergeSiteContent(prev, d.data!.content!));
          }
        }
      } catch {
        // Render fallback content when API is unavailable.
      }
    };

    void loadData();
    void fetch("/api/impact-metrics/views", { method: "POST" });
  }, []);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterStatus("Submitting...");
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail })
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNewsletterStatus(body.error ?? "Unable to subscribe right now.");
        return;
      }
      setNewsletterStatus("Thank you for joining our mission.");
      setSubscriberEmail("");
    } catch {
      setNewsletterStatus("Network issue. Please try again.");
    }
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactLoading(true);
    setContactStatus("Sending your message...");
    const fd = new FormData(event.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      message: String(fd.get("message") ?? "")
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setContactStatus(body.error ?? "Unable to send. Please try again.");
        return;
      }
      setContactStatus("Message received. Our team will reach out soon.");
      event.currentTarget.reset();
    } catch {
      setContactStatus("Network issue. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const startDonationCheckout = async (interval: "one_time" | "monthly") => {
    setDonationLoading(true);
    try {
      const res = await fetch("/api/donations/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval, amount: 5000 })
      });
      const body = (await res.json()) as { data?: { checkoutUrl?: string }; error?: string };
      if (!res.ok || !body.data?.checkoutUrl) {
        alert(body.error ?? "Donation service is currently unavailable.");
        return;
      }
      window.location.href = body.data.checkoutUrl;
    } catch {
      alert("Unable to begin checkout at this time.");
    } finally {
      setDonationLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="section-shell flex h-16 items-center justify-between">
          <a href="#top" aria-label="Heroes Rise Foundation">
            <Image src="/heroes-rise-logo.png" alt="Heroes Rise Foundation" width={220} height={57} priority className="h-10 w-auto" />
          </a>
          <nav className="hidden gap-6 text-sm text-[var(--muted)] md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-[var(--accent)]">
                {link.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => void startDonationCheckout("one_time")}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-bold uppercase tracking-wide text-[#0a0a0a] transition hover:bg-[var(--accent-light)]"
          >
            Support the Mission
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="top" className="relative isolate overflow-hidden">
        <Image
          src={site.hero.background_image}
          alt="Veterans standing together in solidarity"
          fill
          priority
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/75 to-[#0a0a0a]/50" />
        <div className="section-shell grid min-h-[82vh] items-center py-16 md:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="mb-4 inline-flex rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
              {site.hero.badge}
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
              {site.hero.tagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
              {site.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => void startDonationCheckout("one_time")}
                disabled={donationLoading}
                className="rounded-md bg-[var(--accent)] px-6 py-3 font-bold uppercase tracking-wide text-[#0a0a0a] transition hover:bg-[var(--accent-light)] disabled:opacity-70"
              >
                {donationLoading ? "Preparing..." : site.hero.cta_primary}
              </button>
              <a
                href="#involved"
                className="rounded-md border border-white/30 px-6 py-3 font-semibold text-white transition hover:border-white/60 hover:bg-white/5"
              >
                {site.hero.cta_secondary}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── About ── */}
      <motion.section
        id="about"
        className="section-shell py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <div className="grid gap-8 lg:grid-cols-5 lg:items-start">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              {site.about.heading}
            </h2>
            <p className="mt-4 leading-7 text-[var(--muted)]">{site.about.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
            {metrics.map((metric) => (
              <article key={metric.id} className="card p-5">
                <p className="text-3xl font-black text-[var(--accent)]">
                  {formatMetricValue(metric.value)}+
                </p>
                <h3 className="mt-2 font-semibold text-white">{metric.metric_name}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{metric.description}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Services ── */}
      <motion.section
        id="services"
        className="bg-[var(--bg-alt)] py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <div className="section-shell">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {site.services.heading}
          </h2>
          <p className="mt-3 text-[var(--muted)]">{site.services.subtitle}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {site.services.cards.map((service) => (
              <article key={service.title} className="card overflow-hidden">
                <div className="relative h-44">
                  <Image src={service.image} alt={service.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {service.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Heroes / Testimonials ── */}
      <motion.section
        id="heroes"
        className="section-shell py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Our Heroes</h2>
        <p className="mt-4 max-w-3xl text-[var(--muted)]">
          Stories of resilience from veteran families, volunteers, and the teams on the front lines
          of this mission.
        </p>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="card overflow-hidden p-6">
            {testimonials.length > 0 && (
              <div>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-[var(--accent)]/50">
                    <Image
                      src={testimonials[activeTestimonial].image_url}
                      alt={testimonials[activeTestimonial].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {testimonials[activeTestimonial].name}
                    </p>
                    <p className="text-sm text-[var(--accent)]">
                      {testimonials[activeTestimonial].role}
                    </p>
                  </div>
                </div>
                <blockquote className="mt-6 text-lg leading-8 text-neutral-300">
                  &ldquo;{testimonials[activeTestimonial].story}&rdquo;
                </blockquote>
                <div className="mt-6 flex gap-2">
                  {testimonials.map((testimonial, idx) => (
                    <button
                      key={testimonial.id}
                      type="button"
                      onClick={() => setActiveTestimonial(idx)}
                      className={`h-2.5 rounded-full transition ${
                        idx === activeTestimonial
                          ? "w-7 bg-[var(--accent)]"
                          : "w-2.5 bg-neutral-600"
                      }`}
                      aria-label={`Show testimonial ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {stories.slice(0, 2).map((story) => (
              <article key={story.id} className="card p-5">
                <h3 className="text-xl font-bold text-white">{story.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{story.content}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Get Involved ── */}
      <motion.section
        id="involved"
        className="bg-gradient-to-br from-[#1a1510] via-[#1c1812] to-[#12100c] py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <div className="section-shell">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {site.involved.heading}
          </h2>
          <p className="mt-3 text-neutral-400">{site.involved.subtitle}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {site.involved.cards.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/10 p-5"
              >
                <h3 className="text-xl font-bold text-[var(--accent)]">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-300">{item.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void startDonationCheckout("one_time")}
              disabled={donationLoading}
              className="rounded-md bg-[var(--accent)] px-5 py-3 font-bold uppercase tracking-wide text-[#0a0a0a] transition hover:bg-[var(--accent-light)] disabled:opacity-70"
            >
              {site.involved.cta_primary}
            </button>
            <button
              type="button"
              onClick={() => void startDonationCheckout("monthly")}
              disabled={donationLoading}
              className="rounded-md border border-[var(--accent)]/50 px-5 py-3 font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/10 disabled:opacity-70"
            >
              {site.involved.cta_secondary}
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── Newsletter & Contact ── */}
      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="card p-6">
            <h2 className="text-2xl font-bold text-white">{site.newsletter.heading}</h2>
            <p className="mt-3 text-[var(--muted)]">{site.newsletter.description}</p>
            <form onSubmit={handleSubscribe} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none transition placeholder:text-neutral-600 focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                className="rounded-md bg-[var(--brand-light)] px-5 py-3 font-bold uppercase tracking-wide text-white transition hover:bg-[var(--brand)]"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-sm text-[var(--muted)]">{newsletterStatus}</p>
          </article>

          <article id="contact" className="card p-6">
            <h2 className="text-2xl font-bold text-white">{site.contact.heading}</h2>
            <p className="mt-3 text-[var(--muted)]">{site.contact.description}</p>
            <form className="mt-5 space-y-3" onSubmit={handleContactSubmit}>
              <input
                type="text"
                name="name"
                required
                placeholder="Your name"
                className="w-full rounded-md border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-neutral-600 focus:border-[var(--accent)]"
              />
              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                className="w-full rounded-md border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-neutral-600 focus:border-[var(--accent)]"
              />
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Your message"
                className="w-full rounded-md border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none placeholder:text-neutral-600 focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={contactLoading}
                className="rounded-md bg-[var(--brand-light)] px-5 py-3 font-bold uppercase tracking-wide text-white transition hover:bg-[var(--brand)] disabled:opacity-70"
              >
                {contactLoading ? "Sending..." : "Send Message"}
              </button>
            </form>
            <p className="mt-3 text-sm text-[var(--muted)]">{contactStatus}</p>
          </article>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--card-border)] bg-[var(--bg-alt)] py-10">
        <div className="section-shell flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold uppercase tracking-wider text-[var(--accent)]">
              {site.footer.org_name}
            </p>
            <p className="text-sm text-[var(--muted)]">{site.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              className="transition hover:text-[var(--accent)]"
            >
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
              className="transition hover:text-[var(--accent)]"
            >
              X / Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              className="transition hover:text-[var(--accent)]"
            >
              LinkedIn
            </a>
            <a href="mailto:hello@heroesrise.org" className="transition hover:text-[var(--accent)]">
              Email
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function mergeSiteContent(base: SiteContent, incoming: Partial<SiteContent>): SiteContent {
  const result = { ...base };
  for (const key of Object.keys(incoming) as (keyof SiteContent)[]) {
    const val = incoming[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      (result as Record<string, unknown>)[key] = {
        ...(base[key] as Record<string, unknown>),
        ...(val as Record<string, unknown>)
      };
    } else if (val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}
