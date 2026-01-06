module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Coverage configuration
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    // Coverage thresholds (target: 50%+)
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
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
