const config = require('../../src/config');

describe('config.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules and environment before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should export OPENAI_API_KEY from environment variable', () => {
    process.env.OPENAI_API_KEY = 'test-api-key-123';
    const testConfig = require('../../src/config');
    
    expect(testConfig.OPENAI_API_KEY).toBe('test-api-key-123');
  });

  test('should export undefined OPENAI_API_KEY when environment variable is not set', () => {
    delete process.env.OPENAI_API_KEY;
    const testConfig = require('../../src/config');
    
    expect(testConfig.OPENAI_API_KEY).toBeUndefined();
  });

  test('should export correct TRANSCRIBE_MODEL', () => {
    expect(config.TRANSCRIBE_MODEL).toBe('gpt-4o-transcribe');
  });

  test('should export correct API_ENDPOINT', () => {
    expect(config.API_ENDPOINT).toBe('https://api.openai.com/v1/audio/transcriptions');
  });

  test('should have all required properties', () => {
    const requiredProperties = ['OPENAI_API_KEY', 'TRANSCRIBE_MODEL', 'API_ENDPOINT'];
    
    requiredProperties.forEach(prop => {
      expect(config).toHaveProperty(prop);
    });
  });

  test('should not have any additional properties', () => {
    const expectedProperties = ['OPENAI_API_KEY', 'TRANSCRIBE_MODEL', 'API_ENDPOINT'];
    const actualProperties = Object.keys(config);
    
    expect(actualProperties).toEqual(expectedProperties);
  });
});