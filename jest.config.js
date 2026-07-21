export default {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid)/)',
  ],
  testMatch: ['**/test/**/*.test.js'],
  testEnvironment: 'node',
};
