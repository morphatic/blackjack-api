const { GeneralError } = require('@feathersjs/errors')
const isEmpty = require('lodash/fp/isEmpty')

const Game = {
  setup (app) {
    this.app = app
  },

  /**
   * Starts a new game.
   *
   * @param {Player}   data.player The player who started the game
   * @param {number[]} data.bets   The bet(s) they'd like to play on their hand(s)
   * @param {object}   data.rules  (Optional) A set of rules to use other than the player's rules
   * @returns {Game}               The Game object that was created
   */
  async create (data) {
    try {
      // get the player who started the game and their bet(s)
      const { playerId, bets, rules } = data
  
      // get the player and the player's table
      const player = await this.app.service('players').get(playerId)
      const table = (await this.app.service('tables').find({ query: { owner: player._id } })).data[0]

      // update the player's account with the amount of the bet(s)
      player.chips -= bets.reduce((t, b) => t + b, 0)
      await this.app.service('players').patch(player._id, { chips: player.chips })

      // get the deck for this table
      const deck = await this.app.service('decks').get(table.deck)

      // make sure there are cards in the cards table
      const cardNum = (await this.app.service('cards').find({ query: { $limit: 0 } })).total
      if (cardNum < 52 * 8) {
        // we need to create cards
        await this.app.service('cards').create({ init: true })
      }

      // figure out if the deck needs to be shuffled
      const deckSize = deck.packs * 52
      if (deckSize - deck.markerPosition > deck.cards.length) {
        // we're past the marker and need to shuffle
        deck.cards = this.shuffle([...deck.cards.splice(0), ...deck.inPlay.splice(0), ...deck.discards.splice(0)])
        // set a new marker position (i.e. cut the deck)
        // selects a marker position between 20 and 10% + 20 cards from the bottom of the deck
        deck.markerPosition = deckSize - (Math.floor(Math.random() * (Math.floor(deckSize/10))) + 20)
      }

      // deal 2 cards for each bet and 2 for the dealer
      const cards = deck.cards.splice(0, (bets.length + 1) * 2)
      deck.inPlay = [...deck.inPlay, ...cards]
      const deal = [...Array(bets.length + 1)].map((_, i) => [...cards.splice(0, 1), ...cards.splice(bets.length - i, 1)])
      
      // create a hand for each bet
      let hands = await Promise.all(bets.map(async (bet, i) => await this.app.service('hands').create({ player, bet, cards: deal[i], seat: i })))

      // create a new game
      const game = await this.app.service('games').create({
        table: table._id,
        deck: deck._id,
        hands: hands.map(h => h._id),
        rules: isEmpty(rules) ? player.preferences.rules : rules,
        dealerCards: deal[bets.length],
        seats: bets.length,
        state: 'started',
      })

      // update the hands with the correct _id for the game
      hands = await Promise.all(hands.map(async h => await this.app.service('hands').patch(h._id, { game: game._id })))

      // update the deck in the database
      await this.app.service('decks').update(deck._id, deck)

      // hydrate the hands and the dealer's first card
      const query = {
        $populate: [
          { path: 'cards' },
          { path: 'player', select: ['name', 'chips'] },
        ],
      }
      for (let i = 0; i < game.hands.length; i += 1) {
        game.hands[i] = await this.app.service('hands').get(game.hands[i]._id, { query })
        game.hands[i].cards = game.hands[i].cards.map(c => ({ ...c, isFaceUp: true }))
      }
      game.dealerCards[0] = await this.app.service('cards').get(game.dealerCards[0])
      game.dealerCards[0].isFaceUp = true

      // add the game to the list of games played at this table
      table.games.push(game._id)
      await this.app.service('tables').patch(table._id, { games: table.games })

      // return the new, initialized game
      return game
    } catch (error) {
      console.log(error)
      throw new GeneralError('Game could not be started', error)
    }
  },

  /**
   * Dispatches all of the other actions necessary to run a game.
   *
   * @param {ObjectId} id The id of the game to be updated
   * @param {object} data The parameters necessary to dispatch the appropriate action
   * @param {object} params Not used, but part of the required params according to the FeathersJS spec
   */
  async update (gameId, data, params) { // eslint-disable-line no-unused-vars
    // decide what to do based on the action sent in the query
    if (!data.action) {
      throw new GeneralError('Game updates require an action')
    }
    if (data.action === 'deal') {
      const { handId } = data
      return this.deal(gameId, handId)
    }
    if (data.action === 'split') {
      const { handId } = data
      return this.split(gameId, handId)
    }
    if (data.action === 'advance') {
      return this.advance(gameId)
    }
    if (data.action === 'completeDealersHand') {
      return this.completeDealersHand(gameId)
    }
    if (data.action === 'settleGame') {
      return this.settleGame(gameId)
    }
  },

  /**
   * Primary game actions
   */

  /**
   * Deals one card to a player in a game
   *
   * @param   {ObjectId} gameId   The id of the game
   * @param   {ObjectId} playerId The player to receive the card
   * @returns {Game}              The Game object that was updated
   */
  async deal (gameId, handId) {
    try {
      // get the deck, game, and hands
      const game = await this.app.service('games').get(gameId, { query: { $populate: { path: 'hands', populate: 'cards' } } } )
      const deck = await this.app.service('decks').get(game.deck)

      // get the card and add it to the list of cards in play then update the deck
      const inPlay = deck.cards.pop()
      deck.inPlay = [...deck.inPlay, inPlay]
      await this.app.service('decks').update(game.deck, deck)

      // add it to the appropriate hand and update the hand
      const query = {
        $populate: [
          { path: 'cards' },
          { path: 'player', select: ['name', 'chips'] },
        ],
      }
      const hand = await this.app.service('hands').get(handId, { query })
      const handIndex = game.hands.findIndex(h => h._id.equals(hand._id)) // THIS MIGHT NOT WORK!!!! String(h._id) === String(hand._id)
      const cardIds = [...hand.cards.map(c => c._id), inPlay]
      await this.app.service('hands').patch(hand._id, { cards: cardIds })

      // populate the card
      const card = await this.app.service('cards').get(inPlay)
      card.isFaceUp = true

      // populate the cards in the hand from the database
      game.hands[handIndex].cards = [...hand.cards, card]

      // update the game state
      game.state = 'hit'
      await this.app.service('games').patch(game._id, { state: 'hit' })

      // return the game with the populated hand
      return game
    } catch (error) {
      console.log(error)
      throw new GeneralError('There was a problem dealing a card!', error)
    }
  },

  /**
   * Updates the currentGame by one, until it reaches one
   * greater than the number of hands
   *
   * @param   {ObjectId} gameId The game to be advanced
   * @returns {Game}            The Game object that was updated
   */
  async advance (gameId) {
    try {
      // get the game
      const game = await this.app.service('games').get(gameId)

      // get the index of the next hand (even though it might not exist)
      const current = game.currentHand
      const next = current + 1

      // if there is a next hand, and the next hand is at a different seat than the current one
      if (game.hands[next] && game.hands[next].seat !== game.hands[current].seat) {
        // then increment the seat
        game.currentSeat += 1
      }

      // if "next" would push us past the number of hands
      if (next >= game.hands.length) {
        return this.completeDealersHand(gameId)
      } else {
        game.currentHand += 1
        game.state = 'stood'
      }

      await this.app.service('games').patch(gameId, { currentHand: game.currentHand, currentSeat: game.currentSeat })
      return game
    } catch (error) {
      console.log(error)
      throw new GeneralError('There was a problem advancing to the next hand', error)
    }
  },

  /**
   * When it's the dealer's turn to play, this draws cards
   * on behalf of the dealer following the rules for this game.
   *
   * @param   {ObjectId} gameId The id of the game
   * @returns {Game}        The Game object that was updated
   */
  async completeDealersHand (gameId) {
    try {
      // get the game and deck
      const game = await this.app.service('games').get(gameId, { query: { $populate: 'hands' } } )
      const deck = await this.app.service('decks').get(game.deck)

      // first, fully populate the dealer's hand
      let hand = (await Promise.all(game.dealerCards.map(async c => await this.app.service('cards').get(c)))).map(c => ({ ...c, isFaceUp: true }))

      // get the soft17 rule
      const dealerStandsOnSoft17 = game.rules.dealerStandsOnSoft17

      // while the dealer must still draw cards...
      while (!this.isDone(hand, dealerStandsOnSoft17)) {
        // get a card and add it to the list of cards in play then update the deck
        const inPlay = deck.cards.pop()
        deck.inPlay = [...deck.inPlay, inPlay]
        // populate the card and turn it face up
        const card = await this.app.service('cards').get(inPlay)
        card.isFaceUp = true
        
        // add it to the dealer's hand
        hand = [...hand, card]
      }
      
      // update the modified deck in the database
      await this.app.service('decks').update(deck._id, deck)

      // now that we're done, update dealer's hand in the game and the game in the database
      game.dealerCards = hand.map(c => c._id)
      game.state = 'finished'
      await this.app.service('games').update(gameId, game)

      // replace the dealer's cards with the populated hand
      game.dealerCards = hand

      // return the game with the complete populated dealer's hand back to the client
      return game
    } catch (error) {
      console.log(error)
      throw new GeneralError('There was a problem completing the dealer\'s hand', error)
    }
  },

  /**
   * Splits a hand
   *
   * @param   {ObjectId} gameId The id of the game with a hand to be split
   * @param   {ObjectId} handId The id of the hand to be split
   * @returns {Game}            The Game object that was updated
   */
  async split (gameId, handId) {
    try {
      // get the game, deck, player, and hand
      const game = await this.app.service('games').get(gameId, { query: { $populate: { path: 'hands', populate: 'cards' } } } )
      const deck = await this.app.service('decks').get(game.deck)
      const hand = await this.app.service('hands').get(handId, { query: { $populate: 'cards' } })
      const player = await this.app.service('players').get(hand.player)

      // deal 2 cards to add to the new hands
      const cards = deck.cards.splice(0, 2)
      deck.inPlay = [...deck.inPlay, ...cards]
      await this.app.service('decks').update(deck._id, deck)
      
      // delete the _id from the first hand and update its props
      delete hand._id
      hand.isSplit = true
      hand.splitFromAceOrTen = ['10', 'j', 'q', 'k', 'a'].includes(hand.cards[0].rank)

      // update the original hand
      const query = {
        $populate: [
          { path: 'cards' },
          { path: 'player', select: ['name', 'chips'] },
        ],
      }
      const hand1 = await this.app.service('hands').patch(handId, { cards: [hand.cards[0], cards[0]] }, { query })

      // create a new hand into which this one will be split
      hand.cards[0] = hand.cards[1]
      hand.cards[1] = cards[1]
      const hand2 = await this.app.service('hands').create(hand, { query })

      // turn all the cards face up
      hand1.cards = hand1.cards.map(c => ({ ...c, isFaceUp: true }))
      hand2.cards = hand2.cards.map(c => ({ ...c, isFaceUp: true }))

      // update the player's balance to cover the new bet
      player.chips -= hand2.bet
      await this.app.service('players').patch(player._id, { chips: player.chips })

      // update the hands in the database and in the game
      const index = game.hands.findIndex(h => h._id.equals(handId))
      game.hands[index] = hand1._id
      game.hands.splice(index + 1, 0, hand2._id)
      await this.app.service('games').patch(game._id, { hands: game.hands })
      game.hands[index] = hand1
      game.hands[index + 1] = hand2

      // set the game state
      game.state = 'split'

      // return the game and the player
      return { game, player }
    } catch (error) {
      console.log(error)
      throw new GeneralError('There was a problem splitting the hand', error)
    }
  },

  /**
   * Goes through all the hands and determines the result (won, lost, etc.),
   * and updates the player's balance of chips in the database
   *
   * @param   {ObjectId} gameId The id of the game to be settled
   * @returns {Game}            The game object that was settled
   */
  async settleGame (gameId) {
    try {
      // get the deck and game
      const game = await this.app.service('games').get(gameId, { query: { $populate: { path: 'hands', populate: 'cards' } } } )
      const deck = await this.app.service('decks').get(game.deck)

      // move all of the cards in play to the discard pile and update the deck in the database
      deck.discards = [...deck.discards, ...deck.inPlay.splice(0)]
      await this.app.service('decks').update(deck._id, deck)

      // fully populate the cards in the dealer's hand and calculate the dealer's total
      const dealerHand = (await this.app.service('cards').find({ query: { _id: { $in: game.dealerCards } } })).data
      const dealerTotal = this.total(dealerHand)
      const dealerBlackjack = this.isBlackjack(dealerHand, dealerTotal)
      const dealerIsBust = dealerTotal > 21

      // settle each hand
      for (const handId of game.hands) {
        // get the hand from the database
        const hand = await this.app.service('hands').get(handId, { query: { $populate: 'cards' } } )

        // initialize payout multiplier
        let multiplier = 0
        // populate all the cards
        const cards = hand.cards
        // determine the result: push, win, lose, blackjack, surrender, insurance
        const total = this.total(cards)
        const hasFive = total <= 21 && game.rules.fiveCardCharlieWins
        const hasBlackjack = this.isBlackjack(cards, total, hand)
        const isBust = total > 21
        // did they surrender?
        if (hand.surrendered) {
          hand.result = 's'
          multiplier = 0.5
        }
        // did they bust or lose to the dealer?
        else if (isBust || (!hasFive && total < dealerTotal && !dealerIsBust)) {
          hand.result = hand.isInsured ? 'i' : 'l'
          multiplier = hand.result === 'i' ? 1 : 0
        } 
        // did they get a normal win?
        else if (!hasBlackjack && ((total > dealerTotal) || hasFive || dealerIsBust)) {
          hand.result = 'w'
          // payout is 1:1, i.e. double the bet, or 4x if they doubled down
          multiplier = hand.isDoubled ? 4 : 2
        }
        // did they get blackjack? Usually 3:2 for multi-deck games and 6:5 for single deck games
        else if (hasBlackjack && !dealerBlackjack) {
          hand.result = 'b'
          multiplier = 1 + game.rules.payoutForBlackjack
        }
        // it was a push
        else {
          hand.result = 'p'
          multiplier = 1
        }
        // determine the payout
        const payout = hand.bet * multiplier
        // update the player's account in the database
        if (payout !== 0) {
          await this.app.service('players').patch(hand.player, { payout })
        }
        // update the hand in the database
        await this.app.service('hands').patch(handId, { result: hand.result, payout })
      }

      // get an updated version of the game populated with hands and cards, which shows the final results
      const updatedGame = await this.app.service('games').get(gameId, { query: { $populate: { path: 'hands', populate: 'cards' } } } )

      // set the state
      game.state = 'settled'

      // return the game with the settled hands back to the client
      return updatedGame
    } catch (error) {
      console.log(error)
      throw new GeneralError('There was a problem completing the dealer\'s hand', error)
    }
  },

  /**
   * Utility functions 
   */

  /**
   * Shuffle a deck of cards
   * 
   * A JavaScript implementation of the Durstenfeld shuffle,
   * an optimized version of Fisher-Yates:
   * see: https://stackoverflow.com/a/12646864/296725
   * 
   * @param   {array} cards A deck of cards
   * @returns {array}       The shuffled cards
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
  },

  /**
   * Returns a sorted clone of the original array of cards.
   * When calculating the total of a hand, since an ace can
   * be either 1 or 11, it is important to make sure that
   * aces come last in the reduce order so that an accurate
   * decision can be made.
   *
   * In one case, the cards were [3, A, 10] and the dealer
   * stood because, if not sorted, 3 + 11 < 21, therefore
   * A was counted as 11 and the "total" indicated 24. In
   * truth, the dealer had a 14 and should have drawn another
   * card.
   *
   * @param {Card[]} cards Array of cards to be sorted
   */
  sort (cards) {
    const val = c => c.rank === 'a' ? 11 : ['j', 'q', 'k'].includes(c.rank) ? 10 : parseInt(c.rank)
    return [...cards].sort((a, b) => {
      if (val(a) > val(b)) {
        return 1
      } else if (val(b) > val(a)) {
        return -1
      } else {
        return 0
      }
    })
  },

  /**
   * Returns the total value of cards in a hand. Ace is counted
   * as 11 if it won't cause the hand to go bust. Cards must be
   * sorted before total is calculated (see note on sort function).
   *
   * If there are multiple aces in the hand, there's the risk
   * that the first ace could be counted as 11 and the second
   * as 1, when in fact, it's more appropriate to count them both
   * as 1.
   *
   * In any case there could never be a hand with 2 aces that both
   * were counted as 11. So in this algorithm, we calculate all
   * but the last ace as 1, and the last one can be 1 or 11 depending
   * on whether or not it would push the total over 21.
   *
   * But wait, the rabbit hole gets deeper! Suppose you had a hand
   * with [2, A, A]. The first counts as 1 + 2 = 3. If the 2nd counted
   * as 11, the total (14) would still be less than the decision
   * point to hold. Ok, draw again. But if the hand is [5, A, A],
   * counting the 2nd as 11 would put them at 17, the stay point.
   * It might be more advantageous for the dealer to consider that
   * hand a 7 and draw again. If it's a [9, A, A], it's easy, since
   * the total would be 21.
   *
   * I think the goal is to remove any judgment calls from the
   * process, but I couldn't find anything more specific than
   * the dealer stands a 17.
   *
   * This is the point of the soft 17 rule. If A === 11 results
   * in 17, the rule kicks in and the dealer must stand if the
   * total, with A === 11, is 17. If it's 16
   *
   * @param   {Card[]} cards A hand of cards
   * @returns {number}       The numeric total of the cards
   */
  total (cards, isDealer = false, dealerStandsOnSoft17 = false) {
    // count the aces
    let aces = cards.reduce((a, c) => c.rank === 'a' ? a + 1 : a, 0)
    // calculate the total
    let a = 0
    return this.sort(cards).reduce((t, c) => {
      if (['10', 'j', 'q', 'k'].includes(c.rank)) {
        return t + 10
      } else if (c.rank === 'a') {
        a += 1
        if (isDealer) {
          if (dealerStandsOnSoft17) {
            // if last ace and A==11=>17-21, A = 11 : A = 1
            return a === aces && t + 11 <= 21 && t + 11 >= 17 ? t + 11 : t + 1
          } else {
            // if last ace and A==11=>18-21, A = 11 : A = 1
            return a === aces && t + 11 <= 21 && t + 11 >= 18 ? t + 11 : t + 1
          }
        } else {
          // rule for players, only last ace considered
          // possibly 11
          return a === aces && t + 11 <= 21 ? t + 11 : t + 1
        }
      } else {
        return +c.rank + t
      }
    }, 0)
  },

  /**
   * Returns true or false depending on whether the hand
   * represents a soft 17
   *
   * @param   {Card[]}  cards A hand of cards
   * @returns {boolean}       True if the hand is a soft 17
   */
  isSoft17 (cards) {
    // if the total's NOT 17
    if (this.total(cards) !== 17) return false
    // if there's no ace
    if (!cards.map(c => c.rank).includes('a')) return false
    // if the total with the ace(s) removed is > 6 (that means no ace was counted as 11)
    if (this.total(cards.filter(c => c.rank !== 'a')) > 6) return false
    // otherwise, yes, it's soft 17
    return true
  },

  /**
   * Returns true if the dealer is done drawing cards
   * for this hand
   *
   * @param   {Card[]}  cards                A hand of cards from the dealer
   * @param   {boolean} dealerStandsOnSoft17 The value of the rule for soft 17s in this game
   * @returns {boolean}                      True if it's not necessary for the dealer to draw any more cards
   */
  isDone (cards, dealerStandsOnSoft17) {
    // get the total
    const total = this.total(cards, true, dealerStandsOnSoft17)

    // find out if it's a soft17
    const isSoft17 = this.isSoft17(cards)

    // if the total is greater than 17, or it's a soft 17 and the dealer stands on soft 17s 
    return (total > 17) || (isSoft17 && dealerStandsOnSoft17)
  },

  /**
   * Returns true if the hand represents blackjack
   *
   * @param   {Card[]}  cards A hand of cards
   * @param   {number}  total The total value of the hand
   * @param   {Hand}    hand  A Hand object, populated if this is a player hand (not the dealer)
   * @returns {boolean}       True if the hand represents blackjack
   */
  isBlackjack (cards, total, hand = null) {
    // if it's not 21 or only a 2-card hand, then it's definitely not blackjack, no matter who it is
    if (total !== 21 || cards.length !== 2) return false
    // if it's the dealer
    if (hand === null) return true
    // if the 2-card 21 is the result of a hand split from tens or aces...sorry
    if (hand.splitFromAceOrTen) return false
    // otherwise, congrats!
    return true
  },
}

module.exports = Game
