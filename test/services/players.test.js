const app = require('../../src/app')

describe('\'players\' service', () => {
  beforeAll(() => {
    app.set('mongodb', 'http://127.0.0.1:27017/players')
  })

  it('registered the service', () => {
    const service = app.service('players')
    expect(service).toBeTruthy()
  })
})
