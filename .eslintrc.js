module.exports = {
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    'eslint:recommended',
  ],
  rules: {
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
      },
    ],
    'eol-last': [
      'error',
      'always',
    ],
    indent: [
      'error',
      2,
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-multiple-empty-lines': [
      'error',
      {
        max: 2,
      },
    ],
    quotes: [
      'error',
      'single',
    ],
    semi: [
      'error',
      'never',
    ],
    'space-before-function-paren': [
      'error',
      'always',
    ],
  },
}
