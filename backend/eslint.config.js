import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['resources/js/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        localStorage: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        window: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        FormData: 'readonly',
        navigator: 'readonly',
        URL: 'readonly'
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  }
];
