import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ReelSelection {
  trailer_key: string | null;
  backdrop_url: string | null;
  is_featured: boolean;
  featured_order: number | null;
  valid: boolean;
}

@Component({
  selector: 'app-reel-fields',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reel-fields.html',
  styleUrl: './reel-fields.css'
})
export class ReelFieldsComponent implements OnChanges {
  @Input() initialTrailerKey: string | null = null;
  @Input() initialBackdropUrl: string | null = null;
  @Input() initialFeatured = false;
  @Input() initialOrder: number | null = null;

  @Output() selectionChange = new EventEmitter<ReelSelection>();

  trailerInput = '';
  trailerKey: string | null = null;
  backdropUrl = '';
  featured = false;
  order: number | null = null;

  trailerError = '';
  backdropError = '';
  backdropBroken = false;

  readonly positions = [1, 2, 3, 4, 5];

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['initialTrailerKey'] ||
      changes['initialBackdropUrl'] ||
      changes['initialFeatured'] ||
      changes['initialOrder']
    ) {
      this.reset();
    }
  }

  reset(): void {
    this.trailerKey = this.initialTrailerKey ?? null;
    this.trailerInput = this.trailerKey ? `https://www.youtube.com/watch?v=${this.trailerKey}` : '';
    this.backdropUrl = this.initialBackdropUrl ?? '';
    this.featured = this.initialFeatured;
    this.order = this.initialOrder;
    this.trailerError = '';
    this.backdropError = '';
    this.backdropBroken = false;
    this.emit();
  }

  onTrailerChange(value: string): void {
    this.trailerInput = value;
    const trimmed = value.trim();

    if (!trimmed) {
      this.trailerKey = null;
      this.trailerError = '';
      this.emit();
      return;
    }

    const key = this.extractYoutubeKey(trimmed);

    if (!key || !/^[A-Za-z0-9_-]{11}$/.test(key)) {
      this.trailerKey = null;
      this.trailerError = 'Enlace o ID de YouTube no válido.';
    } else {
      this.trailerKey = key;
      this.trailerError = '';
    }

    this.emit();
  }

  clearTrailer(): void {
    this.trailerInput = '';
    this.trailerKey = null;
    this.trailerError = '';
    this.emit();
  }

  onBackdropChange(value: string): void {
    this.backdropUrl = value;
    this.backdropBroken = false;
    const trimmed = value.trim();

    if (!trimmed) {
      this.backdropError = '';
      this.emit();
      return;
    }

    this.backdropError = this.isValidHttpUrl(trimmed)
      ? ''
      : 'Debe ser una URL válida que empiece con http:// o https://';

    this.emit();
  }

  clearBackdrop(): void {
    this.backdropUrl = '';
    this.backdropError = '';
    this.backdropBroken = false;
    this.emit();
  }

  onFeaturedChange(value: boolean): void {
    this.featured = value;
    if (!value) {
      this.order = null;
    }
    this.emit();
  }

  onOrderChange(value: number | null): void {
    this.order = value == null ? null : Number(value);
    this.emit();
  }

  get featuredError(): string {
    if (!this.featured) return '';
    if (!this.trailerKey) return 'Para destacar una película, primero agrega un tráiler válido.';
    if (!this.order) return 'Selecciona una posición del 1 al 5.';
    return '';
  }

  get backdropPreview(): string | null {
    const trimmed = this.backdropUrl.trim();
    return trimmed && !this.backdropError ? trimmed : null;
  }

  private extractYoutubeKey(value: string): string | null {
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) {
      return value;
    }

    try {
      const url = new URL(value);
      const host = url.hostname.replace('www.', '');

      if (host === 'youtu.be') {
        return url.pathname.split('/').filter(Boolean)[0] ?? null;
      }

      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        const v = url.searchParams.get('v');
        if (v) return v;

        const parts = url.pathname.split('/').filter(Boolean);
        const index = parts.findIndex(p => p === 'embed' || p === 'shorts' || p === 'live');
        if (index >= 0 && parts[index + 1]) {
          return parts[index + 1];
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private emit(): void {
    this.selectionChange.emit({
      trailer_key: this.trailerKey,
      backdrop_url: this.backdropUrl.trim() || null,
      is_featured: this.featured,
      featured_order: this.order,
      valid: !this.trailerError && !this.backdropError && !this.featuredError
    });
  }
}
