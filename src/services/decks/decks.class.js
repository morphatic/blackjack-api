const { GeneralError } = require('@feathersjs/errors')
const { Service } = require('feathers-mongoose')

exports.Decks = class Decks extends Service {

  setup (app) {
    this.app = app
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
      discards: [],
      inPlay: [],
      packs: data.packs || 6,
      markerPosition: data.markerPosition,
    }

    // retrieve the required number of cards from the cards service
    // the cards were saved consecutively, so this will get the first n packs
    const cards = (await this.app.service('cards').find({ query: { $limit: deck.packs * 52 } })).data.map(c => c._id)

    // shuffle the cards and add them to the deck
    deck.cards = this.shuffle(cards)

    // pass the updated deck to the parent class
    return super.create(deck, params)
  }

  async update (id, data, params) {
    // decide what to do based on the action sent in the query
    if (!data.action) {
      return super.update(id, data, params)
    }
    throw new GeneralError('You are using the wrong endpoint! Use /game')
  }
}
