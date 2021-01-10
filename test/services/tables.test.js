const app = require('../../src/app')

describe('\'tables\' service', () => {
  beforeAll(() => {
    app.set('mongodb', 'http://127.0.0.1:27017/tables')
  })

  it('registered the service', () => {
    const service = app.service('tables')
    expect(service).toBeTruthy()
  })
})
