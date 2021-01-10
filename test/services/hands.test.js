const assert = require('assert')
const app = require('../../src/app')

describe('\'hands\' service', () => {
  it('registered the service', () => {
    const service = app.service('hands')

    assert.ok(service, 'Registered the service')
  })
})
