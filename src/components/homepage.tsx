"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { fallbackMetrics, fallbackStories, fallbackTestimonials, navLinks } from "@/lib/constants";
import type { ImpactMetric, Story, Testimonial } from "@/lib/types";

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

const serviceCards = [
  {
    title: "Veteran & First Responder Relief",
    description:
      "Emergency grants, resource referrals, housing stabilization, and family support for those who served our communities.",
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80"
  },
  {
    title: "Animal Rescue & Advocacy",
    description:
      "Rescue response, medical aid, foster partnerships, and responsible rehoming for animals with no voice of their own.",
    image:
      "https://images.pexels.com/photos/4587996/pexels-photo-4587996.jpeg?auto=compress&cs=tinysrgb&w=1200"
  },
  {
    title: "Community Mobilization",
    description:
      "Volunteer activations, donation drives, and local partnerships that deliver measurable impact where it is needed most.",
    image:
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80"
  }
];

const involvedCards = [
  {
    title: "Donate",
    text: "Fund rapid-response aid for service families and rescue missions."
  },
  {
    title: "Volunteer",
    text: "Join community outreach, transport teams, and event support."
  },
  {
    title: "Partner",
    text: "Collaborate as a business or organization to scale impact."
  }
];

const formatMetricValue = (value: number) => value.toLocaleString();

export default function Homepage() {
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
        const [metricsRes, storiesRes, testimonialsRes] = await Promise.all([
          fetch("/api/impact-metrics"),
          fetch("/api/stories"),
          fetch("/api/testimonials")
        ]);

        if (metricsRes.ok) {
          const metricsData = (await metricsRes.json()) as { data: ImpactMetric[] };
          if (metricsData.data.length > 0) setMetrics(metricsData.data);
        }

        if (storiesRes.ok) {
          const storyData = (await storiesRes.json()) as { data: Story[] };
          if (storyData.data.length > 0) setStories(storyData.data);
        }

        if (testimonialsRes.ok) {
          const testimonialData = (await testimonialsRes.json()) as { data: Testimonial[] };
          if (testimonialData.data.length > 0) setTestimonials(testimonialData.data);
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
      const response = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscriberEmail })
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
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

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? "")
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setContactStatus(body.error ?? "Unable to send. Please try again.");
        return;
      }

      setContactStatus("Message sent successfully. Our team will reach out soon.");
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
      const response = await fetch("/api/donations/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval, amount: 5000 })
      });

      const body = (await response.json()) as { data?: { checkoutUrl?: string }; error?: string };
      if (!response.ok || !body.data?.checkoutUrl) {
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
    <main className="min-h-screen bg-[var(--bg)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="section-shell flex h-16 items-center justify-between">
          <a href="#top" className="font-semibold text-slate-900">
            Heroes Rise Foundation
          </a>
          <nav className="hidden gap-6 text-sm text-slate-700 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-blue-700">
                {link.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => void startDonationCheckout("one_time")}
            className="rounded-full bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Donate
          </button>
        </div>
      </header>

      <section id="top" className="relative isolate overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&w=1600&q=80"
          alt="Community and veterans standing together"
          fill
          priority
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-slate-950/55" />
        <div className="section-shell grid min-h-[78vh] items-center py-16 md:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.6 }}
            className="max-w-3xl text-white"
          >
            <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
              Heroes Rise Foundation
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Serving Those Who Serve. Saving Those Who Can&apos;t Speak.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-100">
              We provide critical support for veterans, first responders, and vulnerable animals
              through direct aid, rescue operations, and community-powered care.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => void startDonationCheckout("one_time")}
                disabled={donationLoading}
                className="rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-70"
              >
                {donationLoading ? "Preparing..." : "Give Today"}
              </button>
              <a
                href="#involved"
                className="rounded-full border border-white/70 px-6 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                Become a Volunteer
              </a>
            </div>
          </motion.div>
        </div>
      </section>

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
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">About Us</h2>
            <p className="mt-4 leading-7 text-slate-700">
              Heroes Rise Foundation is a mission-driven non-profit connecting service-minded
              communities with urgent needs. Our team works with local partners to provide
              practical resources, long-term pathways, and compassionate care.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-3">
            {metrics.map((metric) => (
              <article key={metric.id} className="card p-5">
                <p className="text-3xl font-bold text-blue-700">{formatMetricValue(metric.value)}+</p>
                <h3 className="mt-2 font-semibold">{metric.metric_name}</h3>
                <p className="mt-2 text-sm text-slate-600">{metric.description}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="services"
        className="bg-slate-50 py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <div className="section-shell">
          <h2 className="text-3xl font-bold md:text-4xl">How We Help</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {serviceCards.map((service) => (
              <article key={service.title} className="card overflow-hidden">
                <div className="relative h-44">
                  <Image src={service.image} alt={service.title} fill className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="heroes"
        className="section-shell py-16 md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold md:text-4xl">Our Heroes</h2>
        <p className="mt-4 max-w-3xl text-slate-700">
          Stories of resilience from families, volunteers, and rescue teams who power this mission.
        </p>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="card overflow-hidden p-6">
            {testimonials.length > 0 && (
              <div>
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-full">
                    <Image
                      src={testimonials[activeTestimonial].image_url}
                      alt={testimonials[activeTestimonial].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{testimonials[activeTestimonial].name}</p>
                    <p className="text-sm text-slate-600">{testimonials[activeTestimonial].role}</p>
                  </div>
                </div>
                <blockquote className="mt-6 text-lg leading-8 text-slate-700">
                  “{testimonials[activeTestimonial].story}”
                </blockquote>
                <div className="mt-6 flex gap-2">
                  {testimonials.map((testimonial, idx) => (
                    <button
                      key={testimonial.id}
                      type="button"
                      onClick={() => setActiveTestimonial(idx)}
                      className={`h-2.5 rounded-full transition ${
                        idx === activeTestimonial ? "w-7 bg-blue-700" : "w-2.5 bg-slate-300"
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
                <h3 className="text-xl font-semibold">{story.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{story.content}</p>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        id="involved"
        className="bg-gradient-to-br from-blue-900 to-cyan-800 py-16 text-white md:py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
        transition={{ duration: 0.5 }}
      >
        <div className="section-shell">
          <h2 className="text-3xl font-bold md:text-4xl">Get Involved</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {involvedCards.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/20 bg-white/10 p-5">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-blue-50">{item.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void startDonationCheckout("one_time")}
              disabled={donationLoading}
              className="rounded-full bg-amber-300 px-5 py-3 font-semibold text-slate-900 transition hover:bg-amber-200 disabled:opacity-70"
            >
              One-Time Donation
            </button>
            <button
              type="button"
              onClick={() => void startDonationCheckout("monthly")}
              disabled={donationLoading}
              className="rounded-full border border-white/70 px-5 py-3 font-semibold transition hover:bg-white/10 disabled:opacity-70"
            >
              Monthly Support
            </button>
          </div>
        </div>
      </motion.section>

      <section className="section-shell py-16 md:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="card p-6">
            <h2 className="text-2xl font-bold">Newsletter Signup</h2>
            <p className="mt-3 text-slate-700">
              Receive mission updates, volunteer opportunities, and impact stories.
            </p>
            <form onSubmit={handleSubscribe} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={subscriberEmail}
                onChange={(event) => setSubscriberEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-sm text-slate-600">{newsletterStatus}</p>
          </article>

          <article id="contact" className="card p-6">
            <h2 className="text-2xl font-bold">Contact Us</h2>
            <p className="mt-3 text-slate-700">
              Share how you want to help or ask about support resources.
            </p>
            <form className="mt-5 space-y-3" onSubmit={handleContactSubmit}>
              <input
                type="text"
                name="name"
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Your message"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={contactLoading}
                className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-70"
              >
                {contactLoading ? "Sending..." : "Send Message"}
              </button>
            </form>
            <p className="mt-3 text-sm text-slate-600">{contactStatus}</p>
          </article>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="section-shell flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Heroes Rise Foundation</p>
            <p className="text-sm text-slate-600">
              Serving Those Who Serve. Saving Those Who Can&apos;t Speak.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-700">
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}>
              Facebook
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}>
              X / Twitter
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}>
              LinkedIn
            </a>
            <a href="mailto:hello@heroesrise.org">Email</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
