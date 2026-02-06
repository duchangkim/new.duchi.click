// src/components/giscus-comments.tsx
import type { AvailableLanguage, Mapping, Repo } from '@giscus/react';
import Giscus from '@giscus/react';

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
        theme="preferred_color_scheme"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        strict="0"
        loading="lazy"
      />
    </section>
  );
}
