const sayHello = (name = '') => {
  return `Hello ${name ? name : 'world'}!`;
};

export { sayHello };
