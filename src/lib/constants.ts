import { ImpactMetric, Story, Testimonial } from "@/lib/types";

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "How We Help", href: "#services" },
  { label: "Our Heroes", href: "#heroes" },
  { label: "Get Involved", href: "#involved" },
  { label: "Contact", href: "#contact" }
];

export const fallbackMetrics: ImpactMetric[] = [
  {
    id: 1,
    metric_name: "Families Supported",
    value: 1280,
    description: "Military and first responder families served through emergency aid.",
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    metric_name: "Animals Rescued",
    value: 420,
    description: "Vulnerable animals rescued and matched with safe homes.",
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    metric_name: "Volunteer Hours",
    value: 18500,
    description: "Hours donated by local communities to direct service programs.",
    updated_at: new Date().toISOString()
  }
];

export const fallbackStories: Story[] = [
  {
    id: 1,
    title: "A Veteran Family Restored",
    content:
      "After a medical discharge disrupted their income, one family faced housing insecurity. Heroes Rise Foundation provided emergency support, legal referrals, and case management that stabilized their home and helped them rebuild with dignity.",
    image_url:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
    published_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "From Street Rescue to Safe Haven",
    content:
      "Our rescue partners brought in an injured dog from a storm drain. Through coordinated veterinary care and foster support, the dog made a full recovery and was adopted by a military family looking for a companion.",
    image_url:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1200&q=80",
    published_at: new Date().toISOString()
  }
];

export const fallbackTestimonials: Testimonial[] = [
  {
    id: 1,
    name: "Mia Thompson",
    role: "Army Spouse",
    story:
      "When we needed support most, Heroes Rise showed up with empathy and practical help. They treated us like family.",
    image_url:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "David Ramirez",
    role: "Volunteer Coordinator",
    story:
      "This foundation bridges people who want to help with people and animals who truly need it. The impact is immediate.",
    image_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    created_at: new Date().toISOString()
  }
];
