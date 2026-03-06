import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const storySchema = z.object({
  title: z.string().min(5).max(150),
  content: z.string().min(20).max(5000),
  image_url: z.url().max(1000)
});

export const testimonialSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().min(2).max(120),
  story: z.string().min(10).max(2000),
  image_url: z.url().max(1000)
});

export const metricSchema = z.object({
  metric_name: z.string().min(2).max(80),
  value: z.number().int().nonnegative(),
  description: z.string().min(3).max(300)
});

export const metricBatchSchema = z.object({
  metrics: z.array(metricSchema).min(1).max(20)
});

export const subscriberSchema = z.object({
  email: z.string().email()
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000)
});

export const cmsSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(2)
    .max(100),
  content: z.record(z.string(), z.unknown())
});

export const donationCheckoutSchema = z.object({
  amount: z.number().int().min(500).max(500000).optional(),
  interval: z.enum(["one_time", "monthly"]).optional()
});
