export interface Story {
  id: number;
  title: string;
  content: string;
  image_url: string;
  published_at: string;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  story: string;
  image_url: string;
  created_at: string;
}

export interface ImpactMetric {
  id: number;
  metric_name: string;
  value: number;
  description: string;
  updated_at: string;
}

export interface ServiceCard {
  title: string;
  description: string;
  image: string;
}

export interface InvolvedCard {
  title: string;
  text: string;
}

export interface SiteContent {
  hero: {
    badge: string;
    tagline: string;
    subtitle: string;
    cta_primary: string;
    cta_secondary: string;
    background_image: string;
  };
  about: {
    heading: string;
    description: string;
  };
  services: {
    heading: string;
    subtitle: string;
    cards: ServiceCard[];
  };
  involved: {
    heading: string;
    subtitle: string;
    cards: InvolvedCard[];
    cta_primary: string;
    cta_secondary: string;
  };
  newsletter: {
    heading: string;
    description: string;
  };
  contact: {
    heading: string;
    description: string;
  };
  footer: {
    org_name: string;
    tagline: string;
  };
}
