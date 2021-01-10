const app = require('../../src/app')

describe('\'games\' service', () => {
  beforeAll(() => {
    app.set('mongodb', 'http://127.0.0.1:27017/games')
  })

  it('registered the service', () => {
    const service = app.service('games')
    expect(service).toBeTruthy()
  })
})
