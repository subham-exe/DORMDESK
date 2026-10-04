module.exports = {
  describe: global.describe,
  it: global.it,
  test: global.test,
  expect: global.expect,
  beforeEach: global.beforeEach,
  afterEach: global.afterEach,
  beforeAll: global.beforeAll,
  afterAll: global.afterAll,
  vi: {
    fn: jest.fn,
    mock: jest.mock,
    spyOn: jest.spyOn,
    clearAllMocks: jest.clearAllMocks,
    resetAllMocks: jest.resetAllMocks,
    restoreAllMocks: jest.restoreAllMocks,
    advanceTimersByTime: jest.advanceTimersByTime,
    useFakeTimers: jest.useFakeTimers,
    useRealTimers: jest.useRealTimers,
    setSystemTime: jest.setSystemTime,
  }
};
