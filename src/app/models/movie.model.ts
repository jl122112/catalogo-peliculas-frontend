export interface Movie {
  id: number;
  title: string;
  synopsis: string;
  year: number;
  cover: string;

  // Campos del reel
  trailer_key: string | null;
  backdrop_url: string | null;
  is_featured: boolean;
  featured_order: number | null;
  tmdb_id: number | null;

  // Accesores que envía Laravel
  trailer_url?: string | null;
  trailer_embed?: string | null;
  backdrop_fallback?: string | null;
  has_backdrop?: boolean;

  created_at: string;
  updated_at: string;
}