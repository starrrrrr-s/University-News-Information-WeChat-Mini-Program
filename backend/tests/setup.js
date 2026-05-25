// 全局测试设置
process.env.NODE_ENV = 'test';

// Mock console.error 以减少测试输出噪音
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('警告')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// 在所有测试后清理
afterAll(() => {
  console.error = originalError;
});