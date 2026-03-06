import type { ImpactMetric, SiteContent, Story, Testimonial } from "@/lib/types";

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "How We Help", href: "#services" },
  { label: "Our Heroes", href: "#heroes" },
  { label: "Get Involved", href: "#involved" },
  { label: "Contact", href: "#contact" }
];

export const defaultSiteContent: SiteContent = {
  hero: {
    badge: "Heroes Rise Foundation",
    tagline: "Standing With Those Who Stood For Us.",
    subtitle:
      "We deploy direct aid, transition resources, and community support for veterans and military families. No one who served should face their battles alone.",
    cta_primary: "Support Now",
    cta_secondary: "Join Our Ranks",
    background_image:
      "https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&w=1600&q=80"
  },
  about: {
    heading: "Our Mission",
    description:
      "Heroes Rise Foundation is a veteran-led organization connecting military families with critical resources. We work alongside VA partners, local communities, and fellow service organizations to deliver practical aid where it matters most."
  },
  services: {
    heading: "How We Serve",
    subtitle: "Three operational pillars driving real-world impact.",
    cards: [
      {
        title: "Veteran & Military Family Relief",
        description:
          "Emergency grants, housing stabilization, employment transition support, and mental health resource referrals for veterans and their families.",
        image:
          "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80"
      },
      {
        title: "Service Dog & Animal Rescue",
        description:
          "Rescue response, veterinary aid, and service-dog pairing programs that reconnect veterans with companionship and therapeutic support.",
        image:
          "https://images.pexels.com/photos/4587996/pexels-photo-4587996.jpeg?auto=compress&cs=tinysrgb&w=1200"
      },
      {
        title: "Community Operations",
        description:
          "Coordinated volunteer deployments, fundraising operations, and partnerships with veteran service organizations to maximize impact.",
        image:
          "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80"
      }
    ]
  },
  involved: {
    heading: "Get Involved",
    subtitle: "Every contribution strengthens the mission.",
    cards: [
      { title: "Donate", text: "Fund direct relief for veteran families and rescue operations." },
      {
        title: "Volunteer",
        text: "Join our ranks — outreach teams, event ops, and transport missions."
      },
      {
        title: "Partner",
        text: "Align your organization with a proven veteran support mission."
      }
    ],
    cta_primary: "One-Time Donation",
    cta_secondary: "Monthly Support"
  },
  newsletter: {
    heading: "Mission Updates",
    description: "Receive field reports, volunteer opportunities, and impact briefings."
  },
  contact: {
    heading: "Contact Us",
    description: "Reach out for support, partnership inquiries, or to join the team."
  },
  footer: {
    org_name: "Heroes Rise Foundation",
    tagline: "Standing With Those Who Stood For Us."
  }
};

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
