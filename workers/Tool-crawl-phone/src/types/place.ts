import { SocialLinks } from "./social";

export interface Place {
  name: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  totalReviews: number | null;
  openingHours: string | null;
  lat: number | null;
  lng: number | null;
  url: string | null;
  crawledAt: string;

  // deep_scan
  description?: string;

  // deep_scan_website
  socials?: SocialLinks;
}