const app = require('../../src/app')

describe('\'games\' service', () => {
  it('registered the service', () => {
    const service = app.service('games')
    expect(service).toBeTruthy()
  })
})
