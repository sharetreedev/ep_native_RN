import { logger } from '../lib/logger';

describe('logger', () => {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  });

  it('forwards log/info/debug/warn to console when __DEV__ is true', () => {
    // jest-expo sets __DEV__ = true by default
    logger.log('hello');
    logger.warn('warn');
    expect(console.log).toHaveBeenCalledWith('hello');
    expect(console.warn).toHaveBeenCalledWith('warn');
  });

  it('always forwards errors to console.error, regardless of __DEV__', () => {
    logger.error('boom');
    expect(console.error).toHaveBeenCalledWith('boom');
  });
});
