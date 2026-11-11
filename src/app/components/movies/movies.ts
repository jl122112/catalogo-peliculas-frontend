import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CoverInputComponent, CoverSelection } from '../cover-input/cover-input';
import { MovieService, MoviePayload } from '../../services/movie';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent, CoverInputComponent],
  templateUrl: './movies.html',
  styleUrl: './movies.css'
})
export class MoviesComponent implements OnInit {
  private movieService = inject(MovieService);
  private cdr = inject(ChangeDetectorRef);

  movies: Movie[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  showAddModal = false;
  newMovie = { title: '', synopsis: '', year: new Date().getFullYear() };
  coverSelection: CoverSelection = { mode: 'url', url: '', file: null };
  saving = false;
  saveError = '';
  formErrors: { [key: string]: string } = {};
  readonly maxYear = new Date().getFullYear() + 5;

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading = true;
    this.errorMessage = '';
    this.movieService.getAllMovies().subscribe({
      next: (data: Movie[]) => {
        this.movies = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = 'Error al cargar las películas.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error:', err);
      }
    });
  }

  onCoverChange(selection: CoverSelection): void {
    this.coverSelection = selection;
    delete this.formErrors['cover'];
  }

  openAddModal(): void {
    this.resetForm();
    this.showAddModal = true;
    document.body.classList.add('modal-open');
  }

  closeAddModal(): void {
    this.showAddModal = false;
    document.body.classList.remove('modal-open');
    this.resetForm();
  }

  resetForm(): void {
    this.newMovie = { title: '', synopsis: '', year: new Date().getFullYear() };
    this.coverSelection = { mode: 'url', url: '', file: null };
    this.formErrors = {};
    this.saveError = '';
    this.saving = false;
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.newMovie.title.trim()) {
      this.formErrors['title'] = 'El título es obligatorio';
    } else if (this.newMovie.title.trim().length > 255) {
      this.formErrors['title'] = 'El título no puede exceder 255 caracteres';
    }

    if (!this.newMovie.synopsis.trim()) {
      this.formErrors['synopsis'] = 'La sinopsis es obligatoria';
    }

    if (this.coverSelection.mode === 'file') {
      if (!this.coverSelection.file) {
        this.formErrors['cover'] = 'Selecciona una imagen o cambia a "Pegar enlace".';
      }
    } else {
      const url = this.coverSelection.url.trim();
      if (!url) {
        this.formErrors['cover'] = 'Pega la URL de la portada o sube un archivo.';
      } else {
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
        } catch {
          this.formErrors['cover'] = 'Debe ser una URL válida (https://...)';
        }
      }
    }

    const year = Number(this.newMovie.year);
    if (!year || year < 1900 || year > this.maxYear) {
      this.formErrors['year'] = `El año debe estar entre 1900 y ${this.maxYear}`;
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveMovie(): void {
    if (!this.validateForm()) {
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.saveError = '';

    const payload: MoviePayload = {
      title: this.newMovie.title.trim(),
      synopsis: this.newMovie.synopsis.trim(),
      year: Number(this.newMovie.year),
      cover: this.coverSelection.mode === 'url' ? this.coverSelection.url.trim() : undefined,
      coverFile: this.coverSelection.mode === 'file' ? this.coverSelection.file : null
    };

    this.movieService.createMovie(payload).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = '¡Película guardada correctamente!';
        this.closeAddModal();
        this.loadMovies();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.saving = false;
        this.saveError = err?.error?.message || 'Error al guardar la película. Intenta nuevamente.';
        this.cdr.detectChanges();
        console.error('Error:', err);
      }
    });
  }
}