import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import { flatConfigs as importX } from 'eslint-plugin-import-x';
import mocha from 'eslint-plugin-mocha';
import n from 'eslint-plugin-n';
import promise from 'eslint-plugin-promise';
import prettierConfig from 'eslint-config-prettier/flat';

export default defineConfig([
  globalIgnores(['lib/', 'coverage/', '.nyc_output/']),

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
  },

  js.configs.recommended,
  importX.recommended,

  {
    rules: {
      'no-use-before-define': ['error', { functions: false }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'import-x/no-unresolved': ['error', { commonjs: true }],
      'import-x/no-extraneous-dependencies': 'error',
    },
  },

  // Library code (CommonJS, compiled to lib/ by Babel)
  {
    files: ['src/**/*.js', 'index.js'],
    extends: [n.configs['flat/recommended-script'], promise.configs['flat/recommended']],
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        { devDependencies: false, optionalDependencies: false },
      ],
      // The public API supports both callbacks and promises on purpose
      'promise/no-callback-in-promise': 'off',
    },
  },
  {
    // Points at the Babel output in lib/, which may not be built yet
    files: ['index.js'],
    rules: {
      'import-x/no-unresolved': 'off',
      'n/no-missing-require': 'off',
    },
  },

  // Tests (ES modules transpiled by @babel/register, run with mocha)
  {
    files: ['test/**/*.js'],
    extends: [mocha.configs.recommended],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node, ...globals.mocha },
    },
    rules: {
      // mocha's `this` context and arrow-free style aren't used in this suite
      'mocha/no-mocha-arrows': 'off',
    },
  },

  // Tooling config files
  {
    files: ['*.mjs'],
    languageOptions: { globals: globals.node },
  },

  // Must stay last: turns off rules that conflict with Prettier
  prettierConfig,
]);
