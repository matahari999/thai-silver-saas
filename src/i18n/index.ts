import en from './en';
import th from './th';
import type { Locale } from '@/types';

const translations: Record<Locale, typeof en> = { en, th };

export function getTranslations(locale: Locale) {
  return translations[locale] || translations['th'];
}

export function t(locale: Locale, path: string): string {
  const keys = path.split('.') as (keyof typeof en)[];
  let value: unknown = translations[locale] || translations['th'];
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      value = translations['th'];
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        }
      }
      break;
    }
  }
  return typeof value === 'string' ? value : path;
}

export { en, th };
