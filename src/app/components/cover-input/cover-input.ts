import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CoverSelection {
  mode: 'url' | 'file';
  url: string;
  file: File | null;
}

@Component({
  selector: 'app-cover-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cover-input.html',
  styleUrl: './cover-input.css'
})
export class CoverInputComponent implements OnChanges, OnDestroy {
  @Input() initialUrl = '';
  @Input() inputId = 'cover';
  @Output() selectionChange = new EventEmitter<CoverSelection>();

  mode: 'url' | 'file' = 'url';
  url = '';
  file: File | null = null;
  preview: string | null = null;
  error = '';
  dragOver = false;
  previewBroken = false;

  readonly accept = 'image/jpeg,image/png,image/webp,image/gif';
  readonly maxBytes = 2 * 1024 * 1024; // 2 MB
  private objectUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialUrl']) {
      this.reset(this.initialUrl);
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  reset(initialUrl = ''): void {
    this.revokeObjectUrl();
    this.mode = 'url';
    this.url = initialUrl ?? '';
    this.file = null;
    this.preview = this.url || null;
    this.error = '';
    this.previewBroken = false;
    this.emit();
  }

  setMode(mode: 'url' | 'file'): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.error = '';
    this.previewBroken = false;
    this.preview = mode === 'url' ? (this.url || null) : this.objectUrl;
    this.emit();
  }

  onUrlChange(value: string): void {
    this.url = value;
    this.previewBroken = false;
    const trimmed = value.trim();
    this.preview = trimmed || null;
    this.error = trimmed && !this.isValidUrl(trimmed) ? 'La URL debe empezar con http:// o https://' : '';
    this.emit();
  }

  clearUrl(): void {
    this.url = '';
    this.preview = null;
    this.error = '';
    this.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];
    if (selected) this.selectFile(selected);
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const dropped = event.dataTransfer?.files?.[0];
    if (dropped) this.selectFile(dropped);
  }

  selectFile(file: File): void {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      this.error = 'Formato no permitido. Usa JPG, PNG, WebP o GIF.';
      return;
    }
    if (file.size > this.maxBytes) {
      this.error = `La imagen supera el límite de 2 MB (pesa ${this.formatSize(file.size)}).`;
      return;
    }

    this.revokeObjectUrl();
    this.file = file;
    this.error = '';
    this.previewBroken = false;
    this.objectUrl = URL.createObjectURL(file);
    this.preview = this.objectUrl;
    this.emit();
  }

  removeFile(): void {
    this.revokeObjectUrl();
    this.file = null;
    this.preview = null;
    this.error = '';
    this.emit();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private isValidUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  private emit(): void {
    this.selectionChange.emit({
      mode: this.mode,
      url: this.url.trim(),
      file: this.mode === 'file' ? this.file : null
    });
  }
}