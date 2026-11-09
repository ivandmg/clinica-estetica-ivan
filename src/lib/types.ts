/** Tipos de las tablas de la base de datos (ver supabase/migrations). */

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type BookingSource = "web" | "manual";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface Professional {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  photo_url: string | null;
  color: string;
  is_active: boolean;
  sort_order: number;
}

export interface Treatment {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  benefits: string[];
  recommended_sessions: string;
  aftercare: string;
  duration_minutes: number;
  price: number | null;
  image_url: string | null;
  is_featured: boolean;
  is_visible: boolean;
  sort_order: number;
}

/** Tratamiento con su categoría y los profesionales que lo realizan. */
export interface TreatmentWithRelations extends Treatment {
  category: Pick<Category, "id" | "name" | "slug">;
  professionals: Pick<Professional, "id" | "name" | "slug" | "title" | "photo_url">[];
}

export interface AvailabilityRule {
  id: string;
  professional_id: string;
  weekday: number;
  start_time: string; // "09:00:00"
  end_time: string;
}

export interface AvailabilityBlock {
  id: string;
  professional_id: string | null;
  starts_at: string;
  ends_at: string;
  reason: string;
}

export interface Booking {
  id: string;
  code: string;
  treatment_id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
  blocked_until: string;
  status: BookingStatus;
  treatment_name: string;
  duration_minutes: number;
  price: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_note: string | null;
  source: BookingSource;
  internal_note: string | null;
  cancelled_at: string | null;
  cancelled_by: "customer" | "manager" | null;
  cancellation_reason: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_detail: string;
  content: string;
  rating: number;
  is_visible: boolean;
  sort_order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  is_visible: boolean;
  sort_order: number;
}
