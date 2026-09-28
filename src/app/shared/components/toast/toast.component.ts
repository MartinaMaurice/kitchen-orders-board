import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-tray',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-tray" role="region" aria-live="assertive">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.kind">
          <span>{{ toast.message }}</span>
          <button type="button" class="toast__close" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
