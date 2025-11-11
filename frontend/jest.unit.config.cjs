module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src/services'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json'],
  resetMocks: true,
};
