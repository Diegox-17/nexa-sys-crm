/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

// Set environment to test mode
process.env.NODE_ENV = 'test';

// Disable console.log during tests to keep output clean
// Uncomment the following lines if you want to suppress logs during tests
// global.console = {
//     ...console,
//     log: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
// };

// Set test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(() => {
    // Close any open connections, clean up resources, etc.
});
