module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    // Coverage thresholds (target: minimum 40% for CI to pass)
    // TODO: Increase to 50% as test coverage improves
    coverageThreshold: {
        global: {
            branches: 40,
            functions: 40,
            lines: 40,
            statements: 40
        }
    },

    // Test patterns
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

    // Coverage exclusions
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/__tests__/',
        '/coverage/',
        'server.js' // Legacy file
    ],

    // Verbose output
    verbose: true,

    // Timeout for tests (default is 5000ms)
    testTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
