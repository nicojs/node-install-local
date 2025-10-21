// @ts-check
import pluginChaiFriendly from 'eslint-plugin-chai-friendly';
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    rules: { '@typescript-eslint/unbound-method': ['off'] },
  },
  {
    // @ts-ignore
    plugins: { 'chai-friendly': pluginChaiFriendly },
    files: ['test/**/*.@(ts|js|mts|cts)'],
    rules: {
      'no-unused-expressions': 'off', // disable original rule
      '@typescript-eslint/no-unused-expressions': 'off', // disable original rule
      'chai-friendly/no-unused-expressions': 'error',
    },
  },
  {
    ignores: ['dist', 'eslint.config.js'],
  },
);
