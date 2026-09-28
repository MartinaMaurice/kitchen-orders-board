import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ORDER_TYPES, OrderType } from '../../../../core/models/order.model';
import { TranslationService } from '../../../../shared/i18n/translation.service';

export type TypeFilter = OrderType | 'all';

const SEARCH_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-board-filters',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board-filters.component.html',
  styleUrl: './board-filters.component.scss',
})
export class BoardFiltersComponent {
  protected readonly i18n = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly search = input('');
  readonly type = input<TypeFilter>('all');

  readonly searchChange = output<string>();
  readonly typeChange = output<TypeFilter>();

  protected readonly types = ORDER_TYPES;
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  constructor() {
    // Keep the control in sync with the URL-driven `search` input (e.g. back/forward
    // navigation or the "clear filters" action) without re-triggering our own debounce loop.
    effect(() => {
      const value = this.search();
      if (value !== this.searchControl.value) {
        this.searchControl.setValue(value, { emitEvent: false });
      }
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.searchChange.emit(value.trim()));
  }

  onTypeChange(value: string): void {
    this.typeChange.emit(value as TypeFilter);
  }
}
