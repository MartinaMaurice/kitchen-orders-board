import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LangToggleComponent } from './shared/components/lang-toggle/lang-toggle.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { TranslationService } from './shared/i18n/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, ToastComponent, LangToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly i18n = inject(TranslationService);
}
