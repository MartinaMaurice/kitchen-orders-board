import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="loading-state" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <p>{{ message }}</p>
    </div>
  `,
  styleUrl: './loading-state.component.scss',
})
export class LoadingStateComponent {
  @Input() message = 'Loading…';
}
