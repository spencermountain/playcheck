export default [{
  files: ['**/*.js'],
  ignores: ['node_modules/**'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    curly: ['error', 'all'],
    'no-var': 'error',
    'prefer-const': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error'
  }
}]
