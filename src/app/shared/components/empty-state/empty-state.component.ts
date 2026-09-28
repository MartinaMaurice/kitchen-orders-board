import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <p class="empty-state__title">{{ title }}</p>
      @if (body) {
        <p class="empty-state__body">{{ body }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() title = '';
  @Input() body = '';
}
