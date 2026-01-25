import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginAstro from 'eslint-plugin-astro';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // 0. 무시할 파일 설정
  {
    ignores: ['.astro/**', 'dist/**', 'node_modules/**', 'public/**', '**/*.astro/*.ts'],
  },

  // 1. 공통 언어 옵션 (TypeScript 파서 및 프로젝트 설정)
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 2. Import 정렬 규칙 (모든 파일에 적용)
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  // 3. 기본 JS/TS 설정
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // 4. Astro 권장 설정
  ...eslintPluginAstro.configs.recommended,

  // 5. React 설정
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat['jsx-runtime'],
    plugins: {
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
  },

  // 6. Astro 파일 설정
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: eslintPluginAstro.parser,
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      // Astro 파일 내부 스크립트에서 타입 규칙 일부 완화
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
    },
  },

  // 7. Astro 파일에서 Type-checked 규칙 비활성화 (파싱 오류 해결)
  {
    files: ['**/*.astro'],
    ...tseslint.configs.disableTypeChecked,
  },

  // 8. 설정 파일 등에서는 타입 체크 끄기 (기존 7번 -> 8번으로 변경)
  {
    files: ['**/*.config.*', '**/*.d.ts'],
    ...tseslint.configs.disableTypeChecked,
  },

  // 9. Prettier 설정 (마지막) (기존 8번 -> 9번으로 변경)
  eslintConfigPrettier,
];
