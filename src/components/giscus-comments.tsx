// src/components/giscus-comments.tsx
import type { AvailableLanguage, Mapping, Repo } from '@giscus/react';
import Giscus from '@giscus/react';
import { useEffect, useState } from 'react';

import { getGiscusTheme } from '@/lib/theme';

interface Props {
  repo: Repo;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: Mapping;
  lang?: AvailableLanguage;
}

export default function GiscusComments({
  repo,
  repoId,
  category,
  categoryId,
  mapping = 'pathname',
  lang = 'ko',
}: Props) {
  const [giscusTheme, setGiscusTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'light';
    return getGiscusTheme(
      localStorage.getItem('duchi-theme') ??
        document.documentElement.getAttribute('data-theme') ??
        'light'
    );
  });

  useEffect(() => {
    const html = document.documentElement;

    const updateGiscusTheme = () => {
      const storedTheme =
        localStorage.getItem('duchi-theme') ?? html.getAttribute('data-theme') ?? 'light';
      setGiscusTheme(getGiscusTheme(storedTheme));
    };

    // Set initial theme
    updateGiscusTheme();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-theme' || mutation.attributeName === 'style') {
          updateGiscusTheme();
          break;
        }
      }
    });

    observer.observe(html, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    return () => observer.disconnect();
  }, []);

  return (
    <section className="border-base-300 mt-12 border-t pt-8">
      <h2 className="mb-6 text-2xl font-bold">Comments</h2>
      <Giscus
        repo={repo}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping={mapping}
        lang={lang}
        theme={giscusTheme}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        strict="0"
        loading="lazy"
      />
    </section>
  );
}
