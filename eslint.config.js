const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    files: ['src/scripts.js'],
    languageOptions: { sourceType: 'script', globals: globals.browser },
    rules: { 'no-unused-vars': 'off' },
  },
];
