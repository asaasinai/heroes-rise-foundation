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
