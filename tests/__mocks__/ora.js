// Mock for ora spinner
const oraMock = {
  start: jest.fn(() => oraMock),
  succeed: jest.fn(() => oraMock),
  fail: jest.fn(() => oraMock),
  text: '',
};

const ora = jest.fn(() => oraMock);
ora.default = ora;

module.exports = ora;
module.exports.default = ora;