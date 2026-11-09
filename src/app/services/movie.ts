import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Movie } from '../models/movie.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);
  
  // Esto tomará el valor de environment.prod.ts (que termina en /api)
  private apiUrl = environment.apiUrl;

  constructor() { }

  getAllMovies(): Observable<Movie[]> {
    // Aquí agregamos '/movies', resultando en: .../api/movies
    return this.http.get<{ success: boolean; data: Movie[] }>(`${this.apiUrl}/movies`)
      .pipe(map(response => response.data));
  }

  getMovieById(id: number): Observable<Movie> {
    return this.http.get<{ success: boolean; data: Movie }>(`${this.apiUrl}/movies/${id}`)
      .pipe(map(response => response.data));
  }

  createMovie(movieData: Omit<Movie, 'id' | 'created_at' | 'updated_at'>): Observable<Movie> {
    return this.http.post<{ success: boolean; data: Movie }>(`${this.apiUrl}/movies`, movieData)
      .pipe(map(response => response.data));
  }

  updateMovie(id: number, movieData: Partial<Movie>): Observable<Movie> {
    return this.http.put<{ success: boolean; data: Movie }>(`${this.apiUrl}/movies/${id}`, movieData)
      .pipe(map(response => response.data));
  }

  deleteMovie(id: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/movies/${id}`)
      .pipe(map(() => {}));
  }
}