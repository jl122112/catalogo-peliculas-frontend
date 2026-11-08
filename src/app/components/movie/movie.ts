import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { MovieService } from '../../services/movie';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-movie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './movie.html',
  styleUrl: './movie.css'
})
export class MovieComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);
  private cdr = inject(ChangeDetectorRef);

  movie: Movie | null = null;
  loading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  // Propiedades para el modal de edición
  showEditModal: boolean = false;
  editMovieData = {
    title: '',
    synopsis: '',
    cover: '',
    year: 0
  };
  saving: boolean = false;
  formErrors: { [key: string]: string } = {};

  // Propiedades para el modal de eliminación
  showDeleteModal: boolean = false;
  deleting: boolean = false;

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

    const id = Number(idParam);

    this.movieService.getMovieById(id).subscribe({
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

  // Abrir modal de edición
  openEditModal(): void {
    if (!this.movie) return;

    this.editMovieData = {
      title: this.movie.title,
      synopsis: this.movie.synopsis,
      cover: this.movie.cover,
      year: this.movie.year
    };
    this.formErrors = {};
    this.showEditModal = true;
    document.body.classList.add('modal-open');
  }

  // Cerrar modal de edición
  closeEditModal(): void {
    this.showEditModal = false;
    document.body.classList.remove('modal-open');
    this.formErrors = {};
    this.saving = false;
  }

  // Validar formulario de edición
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

    if (!this.editMovieData.cover.trim()) {
      this.formErrors['cover'] = 'La URL de la portada es obligatoria';
    } else {
      try {
        new URL(this.editMovieData.cover);
      } catch {
        this.formErrors['cover'] = 'Debe ser una URL válida (ej: https://...)';
      }
    }

    const currentYear = new Date().getFullYear();
    if (!this.editMovieData.year || this.editMovieData.year < 1900 || this.editMovieData.year > currentYear + 5) {
      this.formErrors['year'] = `El año debe estar entre 1900 y ${currentYear + 5}`;
    }

    return Object.keys(this.formErrors).length === 0;
  }

  // Guardar cambios
  saveChanges(): void {
    if (!this.validateForm() || !this.movie) return;

    this.saving = true;
    this.movieService.updateMovie(this.movie.id, this.editMovieData).subscribe({
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
        this.errorMessage = 'Error al actualizar la película. Intenta nuevamente.';
        this.cdr.detectChanges();
        console.error('Error:', err);
      }
    });
  }

  // Abrir modal de eliminación
  openDeleteModal(): void {
    this.showDeleteModal = true;
    document.body.classList.add('modal-open');
  }

  // Cerrar modal de eliminación
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    document.body.classList.remove('modal-open');
    this.deleting = false;
  }

  // Eliminar película
  confirmDelete(): void {
    if (!this.movie) return;

    this.deleting = true;
    this.movieService.deleteMovie(this.movie.id).subscribe({
      next: () => {
        this.deleting = false;
        this.successMessage = '¡Película eliminada correctamente!';
        this.closeDeleteModal();
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/movies']);
        }, 1500);
      },
      error: (err: any) => {
        this.deleting = false;
        this.errorMessage = 'Error al eliminar la película. Intenta nuevamente.';
        this.cdr.detectChanges();
        console.error('Error:', err);
      }
    });
  }

  // Regresar al catálogo
  goBack(): void {
    this.router.navigate(['/movies']);
  }
}