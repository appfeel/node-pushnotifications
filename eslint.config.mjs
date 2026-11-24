import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: ['node_modules/', 'lib/', 'coverage/'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    plugins: {
      'import-x': importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-use-before-define': ['error', { functions: false }],
      'import-x/no-extraneous-dependencies': 'error',
      'import-x/no-unresolved': 'error',
    },
  },
  {
    files: ['test/**/*.js'],
    plugins: {
      'import-x': importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'global-require': 'off',
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/no-dynamic-require': 'off',
    },
  },
  prettier,
];
