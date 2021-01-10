const app = require('../../src/app')

describe('\'cards\' service', () => {
  beforeAll(() => {
    app.set('mongodb', 'http://127.0.0.1:27017/cards')
  })

  it('registered the service', () => {
    const service = app.service('cards')
    expect(service).toBeTruthy()
  })
})
