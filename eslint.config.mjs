import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import a11y from 'eslint-plugin-jsx-a11y';
import importX from 'eslint-plugin-import-x';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import comments from '@eslint-community/eslint-plugin-eslint-comments';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

const source = ['src/**/*.{ts,tsx}'];
export default defineConfig(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '.husky/**',
      'playwright-report/**',
      'test-results/**',
      'src/shared/api/generated.ts',
    ],
  },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 20,
        },
      ],
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreVoidReturningFunctions: true },
      ],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
      'no-param-reassign': ['error', { props: false }],
      'object-shorthand': 'error',
    },
  },
  {
    files: source,
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': hooks,
      'react-refresh': refresh,
      'jsx-a11y': a11y,
      'import-x': importX,
    },
    settings: {
      'import-x/resolver': { typescript: { project: './tsconfig.app.json' } },
      'jsx-a11y': { components: { Link: 'a' } },
    },
    rules: {
      ...hooks.configs.recommended.rules,
      ...a11y.configs.strict.rules,
      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['to'],
          aspects: ['noHref', 'invalidHref', 'preferButton'],
        },
      ],
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'import-x/no-cycle': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            { target: './src/shared', from: ['./src/features', './src/entities', './src/pages'] },
            { target: './src/entities', from: ['./src/features', './src/pages'] },
            { target: './src/features', from: './src/pages' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
    },
  },
  { ...playwright.configs['flat/recommended'], files: ['e2e/**/*.spec.ts'] },
  { files: ['**/*.mjs', '*config.ts', 'e2e/**/*.ts'], languageOptions: { globals: globals.node } },
  {
    plugins: { '@eslint-community/eslint-comments': comments },
    rules: {
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
      '@eslint-community/eslint-comments/require-description': 'error',
      '@eslint-community/eslint-comments/no-duplicate-disable': 'error',
    },
  },
  prettier,
);
