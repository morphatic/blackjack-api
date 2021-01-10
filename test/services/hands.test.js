const app = require('../../src/app');

describe('\'hands\' service', () => {
  it('registered the service', () => {
    const service = app.service('hands');
    expect(service).toBeTruthy();
  });
});
