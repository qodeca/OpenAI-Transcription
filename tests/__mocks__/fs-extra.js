// Mock for fs-extra
const fsMock = {
  ensureDir: jest.fn(() => Promise.resolve()),
  stat: jest.fn(() => Promise.resolve({
    size: 1024 * 1024 * 10, // 10MB default
    isDirectory: () => false
  })),
  statSync: jest.fn(() => ({
    size: 1024 * 1024 * 10, // 10MB default
  })),
  exists: jest.fn(() => Promise.resolve(true)),
  remove: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
  createReadStream: jest.fn(() => 'mock-file-stream'),
};

module.exports = fsMock;