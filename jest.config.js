export default {
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/server.js',
    '!src/worker.js',
  ],
  // Use experimental VM modules for ESM support
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {},
  transform: {},
};
