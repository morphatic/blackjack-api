const { GeneralError } = require('@feathersjs/errors')
const { Service } = require('feathers-mongoose')

exports.Cards = class Cards extends Service {
  /**
   * Seed the database with 8 packs of cards
   */
  async setup (app) {
    // initialize variable for the number of missing cards
    let missing = 0

    try {
      // figure out how many more cards need to be created (if any)
      missing = (8 * 52) - (await app.service('cards').find({ query: { $limit: 0 } })).total
    } catch (error) {
      throw new GeneralError('Could not retrieve the number of cards in the database!', error)
    }

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

      try {
        // create card objects in the database
        await app.service('cards').create(cards)
      } catch (error) {
        throw new GeneralError('Could NOT create cards in the database!', error)
      }
      // done!
    }
  }
}
