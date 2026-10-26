export default {
    roots: ['<rootDir>'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.tsx?$': '@swc/jest',
        // Marked is only distributed as an ES module, which Jest cannot load as is
        '/node_modules/marked/.+\\.js$': '@swc/jest',
    },
    transformIgnorePatterns: ['/node_modules/(?!marked/)'],
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testPathIgnorePatterns: ['/node_modules/'],
    restoreMocks: true,
    resetMocks: true,
};
