const app = require('../../src/app')

describe('\'users\' service', () => {
  beforeAll(() => {
    app.set('mongodb', 'http://127.0.0.1:27017/users')
  })

  it('registered the service', () => {
    const service = app.service('users')
    expect(service).toBeTruthy()
  })
})
