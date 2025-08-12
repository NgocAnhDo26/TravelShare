// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore certain files and directories
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      '*.js',
      '*.mjs',
      'coverage/**/*',
    ],
  },

  // Base recommended configs
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Custom rule overrides
  {
    rules: {
      // This rule will align the colons in objects, interfaces, and types
      'key-spacing': [
        'error',
        {
          beforeColon: false,
          afterColon: true,
          align: {
            on: 'colon',
            mode: 'strict',
          },
        },
      ],
      'no-unused-vars': ['off'],
      '@typescript-eslint/no-unused-vars': [
        // Configure the TypeScript-specific rule
        'off',
      ],
      // Add any other custom ESLint rules here
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // The Prettier config to disable conflicting rules
  prettierConfig,
);
