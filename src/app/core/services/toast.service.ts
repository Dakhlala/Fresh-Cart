import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<ToastMessage[]>([]);

  show(text: string, type: 'success' | 'error' | 'info' = 'info', durationMs: number = 3000): void {
    const id = this.nextId++;
    const message: ToastMessage = { id, text, type };
    this.toasts.update((current) => [...current, message]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  success(text: string, durationMs: number = 3000): void {
    this.show(text, 'success', durationMs);
  }

  error(text: string, durationMs: number = 3500): void {
    this.show(text, 'error', durationMs);
  }

  info(text: string, durationMs: number = 3000): void {
    this.show(text, 'info', durationMs);
  }

  remove(id: number): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
