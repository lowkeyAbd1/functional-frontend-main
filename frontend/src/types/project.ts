export type PaymentMilestone = {
  label: string;
  percent: number;
  note?: string;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  developer: string;
  location: string;
  status: 'Under Construction' | 'Ready';
  handover: string; // e.g., "Q4 2029"
  launchPrice: string; // e.g., "$120K"
  paymentPlanLabel: string; // e.g., "80/20"
  paymentPlan: PaymentMilestone[];
  images: string[];
  description: string;
  tags: ('Off-Plan' | 'Ready')[];
  category?: 'residential' | 'commercial';
  beds?: number;
  baths?: number;
  completionPercent?: number;
};

