import { defineConfig } from 'eslint/config';
import tsConfig from 'eslint-config-lavy/ts';

export default defineConfig([
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/lib/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/*.min.js',
      '**/public/**',
      '**/vendor/**',
      '**/test/**',
      '**/example/**',
      '**/*.spec.ts',
      '**/*.test.ts',
    ],
  },

  // Base configs
  ...tsConfig,

  // Project-specific overrides
  {
    files: ['**/*.ts'],
    rules: {
      // 允许必要的 any 类型（如工具函数中的泛型处理）
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Test files - relaxed rules
  {
    files: ['**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}', '**/tests/**', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
]);
