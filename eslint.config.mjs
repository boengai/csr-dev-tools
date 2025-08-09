import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import perfectionistPlugin from 'eslint-plugin-perfectionist'
import prettierPlugin from 'eslint-plugin-prettier'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      perfectionistPlugin.configs['recommended-natural'],
    ],
    files: ['**/*.{mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    rules: {
      // TypeScript rules (non-redundant with plugin configs)
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

      // TypeScript rules
      '@typescript-eslint/typedef': [
        'error',
        {
          arrayDestructuring: true,
          arrowParameter: true,
          memberVariableDeclaration: true,
          objectDestructuring: true,
          parameter: true,
          propertyDeclaration: true,
          variableDeclaration: true,
          variableDeclarationIgnoreFunction: true,
        },
      ],
      // Import rules
      'import/first': 'error',
      'import/newline-after-import': 'error',

      'import/no-duplicates': 'error',
      // General JavaScript/TypeScript rules (keep essential ones)
      'no-console': 'warn',
      'no-debugger': 'error',

      // Prettier rules
      'prettier/prettier': [
        'error',
        {
          plugins: ['prettier-plugin-tailwindcss'],
          printWidth: 120,
          semi: false,
          singleQuote: true,
          tabWidth: 2,
          tailwindFunctions: ['tv'],
          tailwindStylesheet: './src/index.css',
          trailingComma: 'all',
        },
      ],
      'react-hooks/exhaustive-deps': 'warn',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',

      // React Refresh rules
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/jsx-curly-brace-presence': ['error', { children: 'never', props: 'never' }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
)
