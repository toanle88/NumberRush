import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'array-bracket-spacing': ['error', 'never'],
      'arrow-spacing': 'error',
      'block-spacing': 'error',
      'brace-style': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'comma-spacing': 'error',
      'computed-property-spacing': ['error', 'never'],
      'eol-last': ['error', 'always'],
      'func-call-spacing': ['error', 'never'],
      'key-spacing': 'error',
      'keyword-spacing': 'error',
      'linebreak-style': ['error', 'unix'],
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      'no-trailing-spaces': 'error',
      'object-curly-spacing': ['error', 'always'],
      'operator-linebreak': ['error', 'before'],
      'padded-blocks': ['error', 'never'],
      quotes: ['error', 'single', { allowTemplateLiterals: true, avoidEscape: true }],
      semi: ['error', 'never'],
      'space-before-blocks': 'error',
      'space-before-function-paren': [
        'error',
        { anonymous: 'never', asyncArrow: 'always', named: 'never' },
      ],
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      'space-unary-ops': 'error',
      'template-curly-spacing': ['error', 'never'],
    },
  },
])
