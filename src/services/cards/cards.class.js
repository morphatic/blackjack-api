const { GeneralError } = require('@feathersjs/errors')
const { Service } = require('feathers-mongoose')

exports.Cards = class Cards extends Service {
  
  /**
   * Setup will seed the database with 8 packs of cards
   */
  async setup () {
    // extract the functions we'll need
    const { create, find } = this

    // figure out how many more cards need to be created (if any)
    const missing = (8 * 52) - (await find({ query: { $limit: 0 } })).total

    // if missing number is not a multiple of 52, there's a BIG problem; abort
    if (missing % 52 !== 0) {
      throw new GeneralError('The number of cards in the DB was NOT a multiple of 52!!!')
    }

    // if there any cards missing
    if (missing) {
      // determine how many packs need to be created
      const packs = 8 - (missing % 52)

      // create arrays for all the suits and ranks
      const suits = ['c', 'd', 'h', 's']
      const ranks = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k']

      // generate the cards
      const cards = [...Array(packs)].map(() => suits.map(suit => ranks.map(rank => ({ suit, rank })))).flat(2)

      // create card objects in the database
      await create(cards)
    }
  }
}
