import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';

/** A real on/off switch for EN/AR, not a button — flips state and shows both labels. */
@Component({
  selector: 'app-lang-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="lang-toggle"
      role="switch"
      [attr.aria-checked]="i18n.lang() === 'ar'"
      aria-label="Language"
      (click)="i18n.toggle()"
    >
      <span class="lang-toggle__option" [class.is-active]="i18n.lang() === 'en'">EN</span>
      <span class="lang-toggle__track">
        <span class="lang-toggle__thumb" [class.lang-toggle__thumb--ar]="i18n.lang() === 'ar'"></span>
      </span>
      <span class="lang-toggle__option" [class.is-active]="i18n.lang() === 'ar'">AR</span>
    </button>
  `,
  styleUrl: './lang-toggle.component.scss',
})
export class LangToggleComponent {
  protected readonly i18n = inject(TranslationService);
}
