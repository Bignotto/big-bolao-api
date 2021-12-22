import { sayHello } from './sayHello';

describe('Say Hello Tests', () => {
  it('should say Hello World!', () => {
    const hello = sayHello();
    expect(hello).toBe('Hello world!');
  });

  it('should say Hello Big!', () => {
    const hello = sayHello('Big');
    expect(hello).toBe('Hello Big!');
  });
});
