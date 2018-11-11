const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname, '../'),
  moduleFileExtensions: [
    'js',
    'json'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/data'
    // add here external dependencies
  ],
  setupFiles: ['<rootDir>/test/setup'],
  coverageDirectory: '<rootDir>/test/coverage',
  collectCoverageFrom: [
    'src/**/*.{js}',
    '!**/node_modules/**',
    '!**/data/**'
  ]
}
