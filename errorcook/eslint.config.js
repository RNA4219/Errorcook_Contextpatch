import js from '@eslint/js';
import ts from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Add any global variables if needed
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error', // Enforce no 'any' types
      // Add other rules as needed
    },
    files: ['**/*.ts', '**/*.tsx'],
  },
];