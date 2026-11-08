import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { MovieService } from '../../services/movie';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './movies.html',
  styleUrl: './movies.css'
})
export class MoviesComponent implements OnInit {
  private movieService = inject(MovieService);
  private cdr = inject(ChangeDetectorRef);

  movies: Movie[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';

  // Propiedades para  de nueva película
  showAddModal: boolean = false;
  newMovie = {
    title: '',
    synopsis: '',
    cover: '',
    year: new Date().getFullYear()
  };
  saving: boolean = false;
  formErrors: { [key: string]: string } = {};

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading = true;
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

  // Abrir ventana emergente
  openAddModal(): void {
    this.resetForm();
    this.showAddModal = true;
    document.body.classList.add('modal-open');
  }

  // Cerrar ventana emergente
  closeAddModal(): void {
    this.showAddModal = false;
    document.body.classList.remove('modal-open');
    this.resetForm();
  }

  // Resetear formulario
  resetForm(): void {
    this.newMovie = {
      title: '',
      synopsis: '',
      cover: '',
      year: new Date().getFullYear()
    };
    this.formErrors = {};
    this.saving = false;
  }

  // Validar formulario
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

    if (!this.newMovie.cover.trim()) {
      this.formErrors['cover'] = 'La URL de la portada es obligatoria';
    } else {
      try {
        new URL(this.newMovie.cover);
      } catch {
        this.formErrors['cover'] = 'Debe ser una URL válida (ej: https://...)';
      }
    }

    const currentYear = new Date().getFullYear();
    if (!this.newMovie.year || this.newMovie.year < 1900 || this.newMovie.year > currentYear + 5) {
      this.formErrors['year'] = `El año debe estar entre 1900 y ${currentYear + 5}`;
    }

    return Object.keys(this.formErrors).length === 0;
  }

  // Guardar nueva película
  saveMovie(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.movieService.createMovie(this.newMovie).subscribe({
      next: (movie: Movie) => {
        this.saving = false;
        this.successMessage = '¡Película guardada correctamente!';
        this.closeAddModal();
        this.loadMovies(); // Recargar lista
        
        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        this.saving = false;
        this.errorMessage = 'Error al guardar la película. Intenta nuevamente.';
        console.error('Error:', err);
        this.cdr.detectChanges();
      }
    });
  }
}