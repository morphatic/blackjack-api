const app = require('../../src/app')

describe('\'decks\' service', () => {
  let service
  let deck

  beforeAll(async () => {
    service = app.service('decks')
    deck = await app.service('decks').create({})
  })

  it('registered the service', () => {
    expect(service).toBeTruthy()
  })

  it('should create a shuffled deck of 312 cards', () => {
    // by default the "deck" should have 6 packs of cards in it
    expect(deck.cards.length).toBe(312)
  })

  afterAll(async () => {
    // remove deck and all cards from the db
    try {
      await service.remove(null)
      await app.service('cards').remove(null)
    } catch (err) {
      console.log(err.message)
    }
  })
})
