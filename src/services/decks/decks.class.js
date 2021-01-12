const { Service } = require('feathers-mongoose')

exports.Decks = class Decks extends Service {

  setup (app) {
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

    // retrieve the required number of cards from the cards service
    // the cards were saved consecutively, so this will get the first n packs
    const cards = await this.app.service('cards').find({ query: { $limit: deck.packs * 52 } })

    // shuffle the cards and add them to the deck
    deck.cards = this.shuffle(cards)
    
    // pass the updated deck to the parent class
    return super.create(deck, params)
  }
}
