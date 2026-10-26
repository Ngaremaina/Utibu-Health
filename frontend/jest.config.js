module.exports = {
  preset: 'jest-expo',
  testTimeout: 20_000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/test/**', '!src/**/types.ts'],
  coverageThreshold: {
    global: { lines: 70, statements: 70, functions: 60, branches: 55 },
  },
};
