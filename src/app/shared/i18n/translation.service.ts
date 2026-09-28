import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Lang, TranslationKey, ar, en } from './translations';

const STORAGE_KEY = 'kob:lang';
const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { en, ar };

/**
 * Minimal signal-based i18n service: current language is a signal, `dir` is derived
 * from it, and both are kept in sync with the `<html>` element via an effect so RTL
 * layout (Arabic) applies globally without every component knowing about it.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);

  readonly lang = signal<Lang>(this.readInitialLang());
  readonly dir = computed<'ltr' | 'rtl'>(() => (this.lang() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      const lang = this.lang();
      this.document.documentElement.lang = lang;
      this.document.documentElement.dir = this.dir();
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* storage unavailable (private browsing) — language just won't persist */
      }
    });
  }

  toggle(): void {
    this.lang.set(this.lang() === 'en' ? 'ar' : 'en');
  }

  /**
   * Translates `key`, interpolating `{{token}}` placeholders from `params`.
   * Accepts a plain `string` too (widened from `TranslationKey`) so call sites that
   * build a key dynamically (e.g. `'status.' + order.status`) still type-check —
   * an unknown key simply falls back to rendering the key itself.
   */
  t(key: TranslationKey | (string & {}), params?: Record<string, string | number>): string {
    const dictionary: Record<string, string> = DICTIONARIES[this.lang()];
    const template = dictionary[key] ?? key;
    if (!params) {
      return template;
    }
    return Object.entries(params).reduce(
      (text, [token, value]) => text.replaceAll(`{{${token}}}`, String(value)),
      template,
    );
  }

  /** Picks the singular/plural key variant based on `count`, then translates it. */
  plural(baseKey: TranslationKey, count: number, params?: Record<string, string | number>): string {
    const pluralKey = `${baseKey}_plural` as TranslationKey;
    const key = count === 1 || !(pluralKey in DICTIONARIES[this.lang()]) ? baseKey : pluralKey;
    return this.t(key, { count, ...params });
  }

  private readInitialLang(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ar') {
        return stored;
      }
    } catch {
      /* storage unavailable — fall back to default */
    }
    return 'en';
  }
}
