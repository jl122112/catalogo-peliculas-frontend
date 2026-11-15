import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Movie } from '../models/movie.model';
import { UpcomingMovie, UpcomingResponse, UpcomingTrailer } from '../models/upcoming.model';
import { environment } from '../../environments/environment';

export interface MoviePayload {
  title: string;
  synopsis: string;
  year: number;
  cover?: string;
  coverFile?: File | null;

  trailer_key?: string | null;
  backdrop_url?: string | null;
  is_featured?: boolean;
  featured_order?: number | null;
  tmdb_id?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  constructor() { }

  getAllMovies(): Observable<Movie[]> {
    return this.http.get<{ success: boolean; data: Movie[] }>(`${this.apiUrl}/movies`)
      .pipe(map(response => response.data));
  }

  getMovieById(id: number): Observable<Movie> {
    return this.http.get<{ success: boolean; data: Movie }>(`${this.apiUrl}/movies/${id}`)
      .pipe(map(response => response.data));
  }

  getFeaturedTrailers(): Observable<Movie[]> {
    return this.http.get<{ success: boolean; data: Movie[] }>(`${this.apiUrl}/trailers/featured`)
      .pipe(map(response => response.data));
  }

  /**
   * Próximos estrenos desde TMDB (sin tráiler).
   * Devuelve la lista y la atribución.
   */
  getUpcoming(): Observable<{ movies: UpcomingMovie[]; attribution: string }> {
    return this.http.get<UpcomingResponse>(`${this.apiUrl}/trailers/upcoming`)
      .pipe(map(response => ({
        movies: response.data ?? [],
        attribution: response.meta?.attribution ?? ''
      })));
  }

  /**
   * Resuelve el tráiler de un estreno bajo demanda.
   * Devuelve null si la película aún no tiene tráiler.
   */
  resolveUpcomingTrailer(tmdbId: number): Observable<UpcomingTrailer | null> {
    return this.http.get<{ success: boolean; data: UpcomingTrailer | null }>(
      `${this.apiUrl}/trailers/upcoming/${tmdbId}/video`
    ).pipe(map(response => response.data ?? null));
  }

  createMovie(payload: MoviePayload): Observable<Movie> {
    return this.http.post<{ success: boolean; data: Movie }>(`${this.apiUrl}/movies`, this.buildBody(payload))
      .pipe(map(response => response.data));
  }

  updateMovie(id: number, payload: MoviePayload): Observable<Movie> {
    return this.http.put<{ success: boolean; data: Movie }>(`${this.apiUrl}/movies/${id}`, this.buildBody(payload))
      .pipe(map(response => response.data));
  }

  deleteMovie(id: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/movies/${id}`)
      .pipe(map(() => {}));
  }

  private buildBody(payload: MoviePayload): FormData | object {
    if (payload.coverFile) {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('synopsis', payload.synopsis);
      formData.append('year', String(payload.year));
      formData.append('cover_file', payload.coverFile, payload.coverFile.name);

      formData.append('trailer_key', payload.trailer_key ?? '');
      formData.append('backdrop_url', payload.backdrop_url ?? '');
      formData.append('is_featured', payload.is_featured ? '1' : '0');
      formData.append('featured_order', payload.featured_order != null ? String(payload.featured_order) : '');

      if (payload.tmdb_id != null) {
        formData.append('tmdb_id', String(payload.tmdb_id));
      }

      return formData;
    }

    return {
      title: payload.title,
      synopsis: payload.synopsis,
      year: payload.year,
      cover: payload.cover ?? '',
      trailer_key: payload.trailer_key ?? null,
      backdrop_url: payload.backdrop_url ?? null,
      is_featured: payload.is_featured ?? false,
      featured_order: payload.featured_order ?? null,
      tmdb_id: payload.tmdb_id ?? null
    };
  }
}