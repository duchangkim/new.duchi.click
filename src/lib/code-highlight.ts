// src/lib/code-highlight.ts

import type { Element, Root, Text } from 'hast';
import rehypeParse from 'rehype-parse';
import rehypeStringify from 'rehype-stringify';
import { createHighlighter } from 'shiki';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  jsx: 'JSX',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  md: 'Markdown',
  markdown: 'Markdown',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  zsh: 'Shell',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  kotlin: 'Kotlin',
  swift: 'Swift',
  go: 'Go',
  rust: 'Rust',
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  ruby: 'Ruby',
  php: 'PHP',
  sql: 'SQL',
  graphql: 'GraphQL',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  toml: 'TOML',
  xml: 'XML',
  plaintext: 'Text',
  text: 'Text',
  txt: 'Text',
  astro: 'Astro',
  vue: 'Vue',
  svelte: 'Svelte',
};

/** Singleton — created once at module level, reused across all SSG pages. */
const highlighterPromise = createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: [
    'javascript',
    'typescript',
    'tsx',
    'jsx',
    'html',
    'css',
    'scss',
    'json',
    'yaml',
    'markdown',
    'bash',
    'shell',
    'python',
    'java',
    'kotlin',
    'swift',
    'go',
    'rust',
    'c',
    'cpp',
    'csharp',
    'ruby',
    'php',
    'sql',
    'graphql',
    'dockerfile',
    'toml',
    'xml',
    'astro',
    'vue',
    'svelte',
    'plaintext',
  ],
});

function extractLanguage(codeElement: Element): string | null {
  const className = codeElement.properties?.className;
  if (!Array.isArray(className)) return null;

  for (const cls of className) {
    if (typeof cls === 'string' && cls.startsWith('language-')) {
      return cls.replace('language-', '');
    }
  }
  return null;
}

/** rehype-parse decodes HTML entities during parsing — extracted text needs no manual unescaping. */
function extractText(node: Element | Text | Root): string {
  if (node.type === 'text') return node.value;
  if ('children' in node) {
    return node.children.map((child) => extractText(child as Element | Text)).join('');
  }
  return '';
}

function getLanguageDisplayName(lang: string): string {
  return LANGUAGE_DISPLAY_NAMES[lang.toLowerCase()] ?? lang.toUpperCase();
}

export async function processCodeBlocks(html: string): Promise<string> {
  const highlighter = await highlighterPromise;

  const tree = unified().use(rehypeParse, { fragment: true }).parse(html);

  const replacements: { parent: Element; oldIndex: number; newNodes: Element[] }[] = [];

  visit(tree, 'element', (node: Element, index, parent) => {
    if (node.tagName !== 'pre') return;
    if (index === undefined || !parent) return;

    const codeChild = node.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'code'
    );
    if (!codeChild) return;

    const lang = extractLanguage(codeChild);
    const rawCode = extractText(codeChild);

    const code = rawCode.replace(/\n$/, '');

    let shikiLang = lang ?? 'plaintext';
    const loadedLangs = highlighter.getLoadedLanguages();
    if (!loadedLangs.includes(shikiLang)) {
      shikiLang = 'plaintext';
    }

    const highlighted = highlighter.codeToHast(code, {
      lang: shikiLang,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: 'light',
    });

    const shikiPre = highlighted.children.find(
      (child): child is Element => child.type === 'element' && child.tagName === 'pre'
    );
    if (!shikiPre) return;

    const headerChildren: Element[] = [];
    if (lang) {
      headerChildren.push({
        type: 'element',
        tagName: 'span',
        properties: { className: ['code-language-badge'] },
        children: [{ type: 'text', value: getLanguageDisplayName(lang) }],
      });
    }

    const header: Element = {
      type: 'element',
      tagName: 'div',
      properties: { className: ['code-header'] },
      children: headerChildren,
    };

    const container: Element = {
      type: 'element',
      tagName: 'div',
      properties: {
        className: ['code-block-container'],
        'data-language': lang ?? 'text',
      },
      children: [header, shikiPre],
    };

    replacements.push({ parent: parent as Element, oldIndex: index, newNodes: [container] });
  });

  for (const { parent, oldIndex, newNodes } of replacements.reverse()) {
    parent.children.splice(oldIndex, 1, ...newNodes);
  }

  const result = unified().use(rehypeStringify, { allowDangerousHtml: true }).stringify(tree);

  return String(result);
}
