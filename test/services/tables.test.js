const assert = require('assert')
const app = require('../../src/app')

describe('\'tables\' service', () => {
  it('registered the service', () => {
    const service = app.service('tables')

    assert.ok(service, 'Registered the service')
  })
})
