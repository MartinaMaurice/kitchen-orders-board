import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, output, viewChild } from '@angular/core';

/**
 * Presents routed content (the new-order form, order details) as a modal over the
 * board rather than a full page navigation: the board keeps polling underneath,
 * Escape/backdrop-click close it, and body scroll is locked while it's open.
 */
@Component({
  selector: 'app-modal-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div
        class="modal-overlay__panel"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-label]="label()"
        #panel
      >
        <div class="modal-overlay__toolbar">
          <button type="button" class="modal-overlay__close" (click)="close.emit()" aria-label="Close">&times;</button>
        </div>
        <div class="modal-overlay__content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styleUrl: './modal-overlay.component.scss',
})
export class ModalOverlayComponent {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly label = input('Dialog');
  readonly close = output<void>();

  private readonly keydownListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  };

  constructor() {
    const body = this.document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    this.document.addEventListener('keydown', this.keydownListener);

    this.destroyRef.onDestroy(() => {
      body.style.overflow = previousOverflow;
      this.document.removeEventListener('keydown', this.keydownListener);
    });

    queueMicrotask(() => this.panel()?.nativeElement.focus());
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
