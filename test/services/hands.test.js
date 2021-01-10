const app = require('../../src/app')

describe('\'hands\' service', () => {
  beforeAll(() => {
    app.set('mongodb', 'http://127.0.0.1:27017/hands')
  })

  it('registered the service', () => {
    const service = app.service('hands')
    expect(service).toBeTruthy()
  })
})
