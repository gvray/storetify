import { defineConfig } from 'lavy';

export default defineConfig({
  project: {
    language: 'ts',
    framework: 'none',
    style: 'none',
    linter: 'eslint',
    platform: 'browser',
  },
  lint: {
    eslint: {
      enabled: true,
      config: 'eslint.config.js',
    },
    stylelint: {
      enabled: false,
      config: 'stylelint.config.mjs',
    },
    prettier: {
      enabled: true,
      config: 'prettier.config.mjs',
    },
    biome: {
      enabled: false,
      config: 'biome.json',
    },
  },
});
