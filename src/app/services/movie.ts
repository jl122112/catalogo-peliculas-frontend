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
  private apiUrl = environment.apiUrl;

  constructor() { }

    getAllMovies(): Observable<Movie[]> {
    console.log('🎯 URL que Angular va a llamar:', this.apiUrl); 
    return this.http.get<{ success: boolean; data: Movie[] }>(this.apiUrl)
      .pipe(map(response => {
        console.log('✅ Respuesta cruda que llegó:', response); 
        return response.data;
      }));
  }

  getMovieById(id: number): Observable<Movie> {
    return this.http.get<{ success: boolean; data: Movie }>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

// METODO CREAR PELICULA
  createMovie(movieData: Omit<Movie, 'id' | 'created_at' | 'updated_at'>): Observable<Movie> {
    return this.http.post<{ success: boolean; data: Movie }>(this.apiUrl, movieData)
      .pipe(map(response => response.data));
  }

  //  Metodo para actualizar película
  updateMovie(id: number, movieData: Partial<Movie>): Observable<Movie> {
    return this.http.put<{ success: boolean; data: Movie }>(`${this.apiUrl}/${id}`, movieData)
      .pipe(map(response => response.data));
  }

  //  Metodo para eliminar película
  deleteMovie(id: number): Observable<void> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`)
      .pipe(map(() => {}));
  }

}