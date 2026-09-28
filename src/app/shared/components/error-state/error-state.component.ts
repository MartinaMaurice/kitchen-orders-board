import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-state" role="alert">
      <p class="error-state__title">{{ title }}</p>
      @if (body) {
        <p class="error-state__body">{{ body }}</p>
      }
      @if (retryLabel) {
        <button type="button" class="btn btn--secondary" (click)="retry.emit()">{{ retryLabel }}</button>
      }
    </div>
  `,
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  @Input() title = '';
  @Input() body = '';
  @Input() retryLabel = '';
  @Output() readonly retry = new EventEmitter<void>();
}
