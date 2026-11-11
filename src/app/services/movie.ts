import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Movie } from '../models/movie.model';
import { environment } from '../../environments/environment';

export interface MoviePayload {
  title: string;
  synopsis: string;
  year: number;
  cover?: string;
  coverFile?: File | null;
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

  /**
   * Si hay archivo, envía multipart/form-data (cover_file).
   * Si no, envía JSON con la URL (cover).
   */
  private buildBody(payload: MoviePayload): FormData | object {
    if (payload.coverFile) {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('synopsis', payload.synopsis);
      formData.append('year', String(payload.year));
      formData.append('cover_file', payload.coverFile, payload.coverFile.name);
      return formData;
    }

    return {
      title: payload.title,
      synopsis: payload.synopsis,
      year: payload.year,
      cover: payload.cover ?? ''
    };
  }
}