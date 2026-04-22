import { createDefaultPreset } from 'ts-jest';

const presetConfig = createDefaultPreset({
  tsconfig: 'tsconfig.app.json',
});

export default {
  ...presetConfig,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/test/fileMock.ts',
  },
  testPathIgnorePatterns: ['<rootDir>/cypress/'],
};
