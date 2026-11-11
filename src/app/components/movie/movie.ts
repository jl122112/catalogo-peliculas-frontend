import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CoverInputComponent, CoverSelection } from '../cover-input/cover-input';
import { MovieService, MoviePayload } from '../../services/movie';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent, CoverInputComponent],
  templateUrl: './movie.html',
  styleUrl: './movie.css'
})
export class MovieComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);
  private cdr = inject(ChangeDetectorRef);

  movie: Movie | null = null;
  loading = true;
  errorMessage = '';
  successMessage = '';

  showEditModal = false;
  editMovieData = { title: '', synopsis: '', cover: '', year: 0 };
  coverSelection: CoverSelection = { mode: 'url', url: '', file: null };
  saving = false;
  saveError = '';
  formErrors: { [key: string]: string } = {};
  readonly maxYear = new Date().getFullYear() + 5;

  showDeleteModal = false;
  deleting = false;

  ngOnInit(): void {
    this.loadMovie();
  }

  loadMovie(): void {
    this.loading = true;
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.errorMessage = 'ID de película no proporcionado.';
      this.loading = false;
      return;
    }

    this.movieService.getMovieById(Number(idParam)).subscribe({
      next: (data: Movie) => {
        this.movie = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = 'Error al cargar los detalles de la película.';
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

  openEditModal(): void {
    if (!this.movie) return;
    this.editMovieData = {
      title: this.movie.title,
      synopsis: this.movie.synopsis,
      cover: this.movie.cover,
      year: this.movie.year
    };
    this.coverSelection = { mode: 'url', url: this.movie.cover, file: null };
    this.formErrors = {};
    this.saveError = '';
    this.showEditModal = true;
    document.body.classList.add('modal-open');
  }

  closeEditModal(): void {
    this.showEditModal = false;
    document.body.classList.remove('modal-open');
    this.formErrors = {};
    this.saveError = '';
    this.saving = false;
  }

  validateForm(): boolean {
    this.formErrors = {};

    if (!this.editMovieData.title.trim()) {
      this.formErrors['title'] = 'El título es obligatorio';
    } else if (this.editMovieData.title.trim().length > 255) {
      this.formErrors['title'] = 'El título no puede exceder 255 caracteres';
    }

    if (!this.editMovieData.synopsis.trim()) {
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

    const year = Number(this.editMovieData.year);
    if (!year || year < 1900 || year > this.maxYear) {
      this.formErrors['year'] = `El año debe estar entre 1900 y ${this.maxYear}`;
    }

    return Object.keys(this.formErrors).length === 0;
  }

  saveChanges(): void {
    if (!this.validateForm() || !this.movie) {
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.saveError = '';

    const payload: MoviePayload = {
      title: this.editMovieData.title.trim(),
      synopsis: this.editMovieData.synopsis.trim(),
      year: Number(this.editMovieData.year),
      cover: this.coverSelection.mode === 'url' ? this.coverSelection.url.trim() : undefined,
      coverFile: this.coverSelection.mode === 'file' ? this.coverSelection.file : null
    };

    this.movieService.updateMovie(this.movie.id, payload).subscribe({
      next: (updatedMovie: Movie) => {
        this.saving = false;
        this.movie = updatedMovie;
        this.successMessage = '¡Película actualizada correctamente!';
        this.closeEditModal();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        this.saving = false;
        this.saveError = err?.error?.message || 'Error al actualizar la película. Intenta nuevamente.';
        this.cdr.detectChanges();
        console.error('Error:', err);
      }
    });
  }

  openDeleteModal(): void {
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    document.body.classList.remove('modal-open');
    this.deleting = false;
  }

  confirmDelete(): void {
    if (!this.movie) return;
    this.deleting = true;
    this.movieService.deleteMovie(this.movie.id).subscribe({
      next: () => {
        this.deleting = false;
        this.successMessage = '¡Película eliminada correctamente!';
        this.closeDeleteModal();
        this.cdr.detectChanges();
        setTimeout(() => this.router.navigate(['/movies']), 1500);
      },
      error: (err: any) => {
        this.deleting = false;
        this.errorMessage = 'Error al eliminar la película. Intenta nuevamente.';
        this.cdr.detectChanges();
        console.error('Error:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/movies']);
  }
}