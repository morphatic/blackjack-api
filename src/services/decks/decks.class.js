const { Service } = require('feathers-mongoose')

exports.Decks = class Decks extends Service {

  constructor (options, app) {
    super(options, app)
    this.app = app
  }

  /**
   * Shuffle a deck of cards
   * 
   * A JavaScript implementation of the Durstenfeld shuffle,
   * an optimized version of Fisher-Yates:
   * see: https://stackoverflow.com/a/12646864/296725
   * 
   * @param {array} cards A deck of cards
   */
  shuffle (cards) {
    // clone the array of cards (i.e. don't mutate the original array)
    const shuffled = JSON.parse(JSON.stringify(cards))
    // shuffle it
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    // return the shuffled array
    return shuffled
  }

  /**
   * Override the `create()` method for decks
   * 
   * Calls to the `create()` method only specify the number of packs of 52 cards
   * to put into the deck
   * 
   * @param {object} data   Data sent with the create POST request
   * @param {object} params Additional params sent with standard feathers API calls
   */
  async create (data, params) {
    // create a new, empty deck
    const deck = {
      cards: [],
      packs: data.packs || 6,
    }

    // create an empty array of cards
    let cards = []

    // depending on the number of packs (each pack is 52 cards)
    for (let i = 0; i < deck.packs; i += 1) {
      // for each suit
      for (const suit of ['c', 'd', 'h', 's']) {
        // for each rank
        for (const rank of ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k']) {
          // create a new card object and add it to the array
          cards.push({ suit, rank })
        }
      }
    }

    // shuffle the deck
    cards = this.shuffle(cards)
    
    // create card objects in the database
    cards = await this.app.service('cards').create(cards)

    // update the empty deck with the created cards
    deck.cards = cards

    // pass the updated deck to the parent class
    return super.create(deck, params)
  }
}
