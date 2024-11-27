/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/src/tests/**/*.+(spec|test).+(ts|tsx|js)', // Include tests in src/tests folder
    '**/src/**/*.(spec|test).+(ts|tsx|js)'         // Include tests alongside source files
  ]
}; 