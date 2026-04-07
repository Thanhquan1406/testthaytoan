module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Bắt buộc dùng const khi không reassign
    'prefer-const': 'error',
    // Cấm var
    'no-var': 'error',
    // Cảnh báo khi có biến không dùng (trừ args bắt đầu bằng _)
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Cấm console.log trong production (warn để dev thoải mái)
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // Require return ở cuối async callbacks
    'consistent-return': 'warn',
    // Không dùng == thay cho ===
    eqeqeq: ['error', 'always'],
    // Không để code không đạt được
    'no-unreachable': 'error',
  },
};
