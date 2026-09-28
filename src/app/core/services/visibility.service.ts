import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Wraps the Page Visibility API so polling can pause while the kitchen display's
 * browser tab is in the background, and resume (with an immediate refresh) when it
 * comes back to the foreground.
 */
@Injectable({ providedIn: 'root' })
export class VisibilityService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);

  readonly hidden = signal(this.document.hidden);

  /** Emits exactly when the tab transitions from hidden back to visible. */
  readonly becameVisible$ = new Subject<void>();

  private readonly listener = () => {
    this.zone.run(() => {
      const isHidden = this.document.hidden;
      const wasHidden = this.hidden();
      this.hidden.set(isHidden);
      if (wasHidden && !isHidden) {
        this.becameVisible$.next();
      }
    });
  };

  constructor() {
    this.document.addEventListener('visibilitychange', this.listener);
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('visibilitychange', this.listener);
    this.becameVisible$.complete();
  }
}
