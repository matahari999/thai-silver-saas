import { getTranslations } from '@/i18n';
import type { Locale } from '@/types';
import Navbar from '@/components/Navbar';

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = (params.locale === 'en' ? 'en' : 'th') as Locale;
  const t = getTranslations(locale);

  return (
    <div lang={locale}>
      <Navbar locale={locale} t={t} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {children}
      </main>
    </div>
  );
}
