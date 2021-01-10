const assert = require('assert')
const app = require('../../src/app')

describe('\'decks\' service', () => {
  
  it('registered the service', () => {
    const service = app.service('decks')

    assert.ok(service, 'Registered the service')
  })

  it('should create a deck with 312 shuffled cards', async () => {
    const deck = await app.service('decks').create({})
    assert.strictEqual(deck.cards.length, 312)
  }).timeout(5000)
})
