import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  HostListener,
  ViewChildren,
  QueryList,
  ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl,Title, Meta } from '@angular/platform-browser';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { MovieService } from '../../services/movie';
import { Movie } from '../../models/movie.model';
import { UpcomingMovie, UpcomingTrailer } from '../../models/upcoming.model';

@Component({
  selector: 'app-trailers',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './trailers.html',
  styleUrl: './trailers.css'
})
export class TrailersComponent implements OnInit, OnDestroy {
  private movieService = inject(MovieService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  @ViewChildren('thumbBtn') thumbButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  // ---------- Destacados ----------
  movies: Movie[] = [];
  activeIndex = 0;
  loading = true;
  errorMessage = '';

  playing = false;
  embedUrl: SafeResourceUrl | null = null;

  backdropBroken = false;
  posterBroken = false;
  brokenThumbs = new Set<number>();

  // ---------- Próximamente ----------
  upcomingMovies: UpcomingMovie[] = [];
  upcomingLoading = true;
  upcomingError = '';
  upcomingAttribution = '';

  resolvingTmdbId: number | null = null;
  brokenUpcomingImages = new Set<number>();

  upcomingModalOpen = false;
  modalMovie: UpcomingMovie | null = null;
  modalTrailer: UpcomingTrailer | null = null;
  modalEmbedUrl: SafeResourceUrl | null = null;
  modalLoading = false;
  modalError = '';

  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.titleService.setTitle('Tráilers | Catálogo de Películas');
    this.metaService.updateTag({
      name: 'description',
      content: 'Descubre los tráilers destacados de nuestro catálogo y los próximos estrenos de cine.'
    });

    this.loadReel();
    this.loadUpcoming();
  }

  ngOnDestroy(): void {
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
  }

  // ============================================
  // DESTACADOS
  // ============================================

  loadReel(): void {
    this.loading = true;
    this.errorMessage = '';
    this.stop();

    this.movieService.getFeaturedTrailers().subscribe({
      next: (data: Movie[]) => {
        this.movies = data;
        this.activeIndex = 0;
        this.backdropBroken = false;
        this.posterBroken = false;
        this.brokenThumbs.clear();
        this.loading = false;
        this.cdr.detectChanges();
        this.scrollActiveIntoView();
      },
      error: (err: unknown) => {
        this.errorMessage = 'No pudimos cargar el reel de destacados.';
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error al cargar destacados:', err);
      }
    });
  }

  get activeMovie(): Movie | null {
    return this.movies[this.activeIndex] ?? null;
  }

  get hasReel(): boolean {
    return !this.loading && !this.errorMessage && this.movies.length > 0;
  }

  get isEmpty(): boolean {
    return !this.loading && !this.errorMessage && this.movies.length === 0;
  }

  get counterCurrent(): string {
    return String(this.activeIndex + 1).padStart(2, '0');
  }

  get counterTotal(): string {
    return String(this.movies.length).padStart(2, '0');
  }

  get stageImage(): string {
    const movie = this.activeMovie;
    if (!movie) return '';
    if (!this.backdropBroken && movie.backdrop_fallback) return movie.backdrop_fallback;
    return movie.cover;
  }

  get stageIsAmbient(): boolean {
    const movie = this.activeMovie;
    if (!movie) return true;
    return this.backdropBroken || !movie.has_backdrop;
  }

  get showPosterCard(): boolean {
    return this.stageIsAmbient && !this.posterBroken;
  }

  get noImage(): boolean {
    return this.posterBroken && (this.backdropBroken || !this.activeMovie?.has_backdrop);
  }

  select(index: number): void {
    if (index === this.activeIndex || index < 0 || index >= this.movies.length) return;
    this.stop();
    this.activeIndex = index;
    this.backdropBroken = false;
    this.posterBroken = false;
    this.cdr.detectChanges();
    this.scrollActiveIntoView();
  }

  next(): void {
    if (!this.movies.length) return;
    this.select((this.activeIndex + 1) % this.movies.length);
  }

  prev(): void {
    if (!this.movies.length) return;
    this.select((this.activeIndex - 1 + this.movies.length) % this.movies.length);
  }

  play(): void {
    const movie = this.activeMovie;
    if (!movie?.trailer_embed) return;

    const separator = movie.trailer_embed.includes('?') ? '&' : '?';
    const url = `${movie.trailer_embed}${separator}autoplay=1&rel=0&modestbranding=1&playsinline=1`;

    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.playing = true;
    this.cdr.detectChanges();
  }

  stop(): void {
    this.playing = false;
    this.embedUrl = null;
  }

  thumbSrc(movie: Movie): string {
    if (!movie.trailer_key || this.brokenThumbs.has(movie.id)) return movie.cover;
    return `https://img.youtube.com/vi/${movie.trailer_key}/hqdefault.jpg`;
  }

  onThumbError(movie: Movie): void {
    this.brokenThumbs.add(movie.id);
    this.cdr.detectChanges();
  }

  onBackdropError(): void {
    this.backdropBroken = true;
    this.cdr.detectChanges();
  }

  onPosterError(): void {
    this.posterBroken = true;
    this.cdr.detectChanges();
  }

  segmentState(index: number): 'past' | 'active' | 'future' {
    if (index === this.activeIndex) return 'active';
    return index < this.activeIndex ? 'past' : 'future';
  }

  trackById(_index: number, movie: Movie): number {
    return movie.id;
  }

  trackByTmdbId(_index: number, movie: UpcomingMovie): number {
    return movie.tmdb_id;
  }

  // ---------- Navegación interna ----------
  activeSection = 'destacados';

  sectionNav = [
    { id: 'destacados', label: 'Destacados', icon: 'bi-star-fill' },
    { id: 'proximamente', label: 'Próximamente', icon: 'bi-hourglass-split' }
  ];

  scrollToSection(id: string): void {
    this.activeSection = id;
    const element = document.getElementById(id);

    if (!element) return;

    element.scrollIntoView({
      behavior: this.reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  }



  // ============================================
  // PRÓXIMAMENTE
  // ============================================

  loadUpcoming(): void {
    this.upcomingLoading = true;
    this.upcomingError = '';

    this.movieService.getUpcoming().subscribe({
      next: (result) => {
        this.upcomingMovies = result.movies;
        this.upcomingAttribution = result.attribution;
        this.upcomingLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.upcomingError = 'No pudimos cargar los próximos estrenos.';
        this.upcomingLoading = false;
        this.cdr.detectChanges();
        console.error('Error al cargar próximos estrenos:', err);
      }
    });
  }

  get hasUpcoming(): boolean {
    return !this.upcomingLoading && !this.upcomingError && this.upcomingMovies.length > 0;
  }

  get upcomingEmpty(): boolean {
    return !this.upcomingLoading && !this.upcomingError && this.upcomingMovies.length === 0;
  }

  upcomingImageSrc(movie: UpcomingMovie): string | null {
    if (!this.brokenUpcomingImages.has(movie.tmdb_id) && movie.backdrop_url) {
      return movie.backdrop_url;
    }
    return movie.poster_url;
  }

  onUpcomingImageError(movie: UpcomingMovie): void {
    if (!this.brokenUpcomingImages.has(movie.tmdb_id)) {
      this.brokenUpcomingImages.add(movie.tmdb_id);
      this.cdr.detectChanges();
    }
  }

  hasUpcomingImage(movie: UpcomingMovie): boolean {
    return this.upcomingImageSrc(movie) !== null;
  }

  releaseLabel(movie: UpcomingMovie): string {
    const days = movie.days_until_release;

    if (days <= 0) return 'Estrena hoy';
    if (days === 1) return 'Estrena mañana';
    if (days < 30) return `En ${days} días`;
    if (days < 365) return `En ${Math.max(1, Math.round(days / 30))} meses`;
    return `En ${Math.max(1, Math.round(days / 365))} años`;
  }

  releaseLabelClass(movie: UpcomingMovie): string {
    const days = movie.days_until_release;
    if (days <= 0) return 'today';
    if (days <= 7) return 'soon';
    return 'later';
  }

  releaseDateLong(dateStr: string): string {
    try {
      const date = new Date(`${dateStr}T00:00:00`);
      return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  showRating(movie: UpcomingMovie): boolean {
    return movie.vote_count > 0 && movie.vote_average > 0;
  }

  /**
   * Regla de un solo iframe: se desmonta el escenario de Destacados
   * antes de abrir el modal de Próximamente.
   */
  openUpcomingModal(movie: UpcomingMovie): void {
    if (this.resolvingTmdbId !== null) return;

    this.stop();

    this.modalMovie = movie;
    this.upcomingModalOpen = true;
    this.modalLoading = true;
    this.modalError = '';
    this.modalTrailer = null;
    this.modalEmbedUrl = null;
    this.resolvingTmdbId = movie.tmdb_id;

    document.body.classList.add('modal-open');

    this.resolveTrailer(movie);
  }

  private resolveTrailer(movie: UpcomingMovie): void {
    this.movieService.resolveUpcomingTrailer(movie.tmdb_id).subscribe({
      next: (trailer) => {
        this.modalLoading = false;
        this.resolvingTmdbId = null;

        if (trailer) {
          this.modalTrailer = trailer;
          const separator = trailer.trailer_embed.includes('?') ? '&' : '?';
          const url = `${trailer.trailer_embed}${separator}autoplay=1&rel=0&modestbranding=1&playsinline=1`;
          this.modalEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        } else {
          this.modalTrailer = null;
        }

        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.modalLoading = false;
        this.resolvingTmdbId = null;
        this.modalError = 'No pudimos cargar el tráiler en este momento.';
        this.cdr.detectChanges();
        console.error('Error al resolver tráiler:', err);
      }
    });
  }

  retryModalTrailer(): void {
    if (!this.modalMovie || this.modalLoading) return;
    this.modalError = '';
    this.modalLoading = true;
    this.resolvingTmdbId = this.modalMovie.tmdb_id;
    this.resolveTrailer(this.modalMovie);
  }

  closeUpcomingModal(): void {
    this.upcomingModalOpen = false;
    this.modalEmbedUrl = null;
    this.modalTrailer = null;
    this.modalMovie = null;
    this.modalLoading = false;
    this.modalError = '';
    document.body.classList.remove('modal-open');
  }

  languageLabel(code: string | null): string {
    switch (code) {
      case 'es': return 'Español';
      case 'en': return 'Inglés';
      case 'fr': return 'Francés';
      case 'pt': return 'Portugués';
      case 'it': return 'Italiano';
      case 'de': return 'Alemán';
      case 'ja': return 'Japonés';
      case 'ko': return 'Coreano';
      default: return code ? code.toUpperCase() : 'Original';
    }
  }

  // ============================================
  // TECLADO
  // ============================================

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    if (event.key === 'Escape') {
      if (this.upcomingModalOpen) {
        event.preventDefault();
        this.closeUpcomingModal();
        this.cdr.detectChanges();
      } else if (this.playing) {
        event.preventDefault();
        this.stop();
        this.cdr.detectChanges();
      }
      return;
    }

    if (this.upcomingModalOpen || !this.hasReel) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prev();
    }
  }

  private scrollActiveIntoView(): void {
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const button = this.thumbButtons?.get(this.activeIndex)?.nativeElement;
      button?.scrollIntoView({
        behavior: this.reducedMotion ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }, 0);
  }

  private get reducedMotion(): boolean {
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}