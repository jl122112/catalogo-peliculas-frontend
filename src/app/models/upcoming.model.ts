export interface UpcomingMovie {
  tmdb_id: number;
  title: string;
  original_title: string | null;
  overview: string;
  release_date: string;
  year: number;
  days_until_release: number;
  poster_url: string | null;
  backdrop_url: string | null;
  vote_average: number;
  vote_count: number;
  genres: string[];
}

export interface UpcomingTrailer {
  tmdb_id: number;
  trailer_key: string;
  trailer_name: string;
  trailer_type: string;
  trailer_language: string | null;
  trailer_official: boolean;
  trailer_published_at: string | null;
  trailer_url: string;
  trailer_embed: string;
  thumbnail_url: string;
}

export interface UpcomingMeta {
  source: string;
  region: string;
  language: string;
  count: number;
  attribution: string;
}

export interface UpcomingResponse {
  data: UpcomingMovie[];
  meta: UpcomingMeta;
}