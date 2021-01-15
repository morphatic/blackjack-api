const { GeneralError } = require('@feathersjs/errors')
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

  total (cards) {
    return cards.reduce((t, c) => {
      if (['10', 'j', 'q', 'k'].includes(c.rank)) {
        return t + 10
      } else if (c.rank === 'a') {
        return t + 11 > 21 ? t + 1 : t + 11
      } else {
        return +c.rank + t
      }
    }, 0)
  }

  isSoft17 (cards) {
    // if the total's NOT 17
    if (this.total(cards) !== 17) return false
    // if there's no ace
    if (!cards.map(c => c.rank).includes('a')) return false
    // if the total with the ace(s) removed is > 6 (that means no ace was counted as 11)
    if (this.total(cards.filter(c => c.rank !== 'a')) > 6) return false
    // otherwise, yes, it's soft 17
    return true
  }

  isDone (cards, dealerStandsOnSoft17) {
    // get the total
    const total = this.total(cards)
    // find out if it's a soft17
    const isSoft17 = this.isSoft17(cards)

    // if the total is greater than 17, or it's a soft 17 and the dealer stands on soft 17s 
    if ((total > 17) || (isSoft17 && dealerStandsOnSoft17)) return true

    // otherwise, no, we're not done
    return false
  }

  isBlackjack (cards, total, hand = null) {
    // if it's not 21 or only a 2-card hand, then it's definitely not blackjack, no matter who it is
    if (total !== 21 || cards.length !== 2) return false
    // if it's the dealer
    if (hand === null) return true
    // if the 2-card 21 is the result of a hand split from tens or aces...sorry
    if (hand.splitFromAceOrTen) return false
    // otherwise, congrats!
    return true
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

  // TODO: Consider settling games in this function for situations
  // when either the dealer or ALL the players start with blackjack.
  // I originally put this logic on the app side, but only realized
  // now that this won't work for multi-player scenarios
  async deal (id, gameId) {
    try {
      // get the deck, game, and hands
      let deck = await super.get(id)
      const game = await this.app.service('games').get(gameId, { query: { $populate: 'hands' } } )

      // first, go back and provide a reciprocal association from the hands to the game
      // const updatedHands = await Promise.all(game.hands.map(async h => await this.app.service('hands').patch(h, { game: gameId })))
      // console.log('updated hands', updatedHands)
      // get the deck size
      const size = deck.packs * 52
      
      // figure out if we're past the deck marker and need to shuffle
      if (size - deck.markerPosition > deck.cards.length) {
        // we need to shuffle
        deck.cards = this.shuffle([...deck.cards.splice(0), ...deck.inPlay.splice(0), ...deck.discards.splice(0)])
        // set a new marker position (i.e. cut the deck)
        // selects a marker position between 20 and 10% + 20 cards from the bottom of the deck
        deck.markerPosition = size - (Math.floor(Math.random() * (Math.floor(size/10))) + 20)
      }
      // figure out how many cards we need
      const cardNum = (game.hands.length + 1) * 2

      // get that number of cards off the top of the deck and put them "in play"
      const inPlay = deck.cards.splice(0, cardNum)
      deck.inPlay = [...deck.inPlay, ...inPlay]
      deck = await super.update(id, deck)

      
      // distribute them to the appropriate hands (leaves 2 cards in inPlay for the dealer)
      for (let i = 0; i < game.hands.length; i += 1) {
        game.hands[i].cards = [...inPlay.splice(0, 1), ...inPlay.splice(game.hands.length - i, 1)]
      }
      game.dealerCards = inPlay.splice(0)
 
      // clone the hydrated hands
      const hands = JSON.parse(JSON.stringify(game.hands)) 
      
      // update the deck and hands in the database
      game.hands = (await Promise.all(game.hands.map(async h => await this.app.service('hands').patch(h._id, { ...h, game: gameId })))).map(h => h._id)
      await this.app.service('games').patch(gameId, game)
      
      // populate the cards in the hands
      const getCard = async c => await this.app.service('cards').get(c)
      const popHands = JSON.parse(JSON.stringify(hands)) 
      for (let i = 0; i < hands.length; i += 1) {
        popHands[i].cards = []
        for (let j = 0; j < hands[i].cards.length; j += 1) {
          popHands[i].cards.push(await getCard(hands[i].cards[j]))
        }
      } 
      game.hands = popHands

      // populate the face-up card for the dealer
      game.dealerCards[0] = await this.app.service('cards').get(game.dealerCards[0])

      // return the deck and the game with populated hands and populated cards
      return { deck, game }
    } catch (error) {
      throw new GeneralError('There was something wrong with the deal', error)
    }
  }

  /**
   * This will ALWAYS be a card to a player since, when it's the dealer's turn
   * we'll be able to draw as many cards as they need automatically to complete
   * their hand.
   *
   * @param {*} id 
   * @param {*} gameId 
   * @param {*} recipient 
   */
  async dealOneTo (id, gameId, recipient) {
    try {
      // get the deck, game, and hands
      let deck = await super.get(id)
      const game = await this.app.service('games').get(gameId, { query: { $populate: 'hands' } } )

      // get the card and add it to the list of cards in play then update the deck
      const inPlay = deck.cards.pop()
      deck.inPlay = [...deck.inPlay, inPlay]
      deck = await super.update(id, deck)

      // add it to the appropriate hand and update the hand
      const hand = (await this.app.service('hands').find({ query: { player: recipient, game: gameId  } })).data[0]
      const handIndex = game.hands.findIndex(h => String(h._id) === String(hand._id))
      hand.cards = [...hand.cards, inPlay]
      await this.app.service('hands').patch(hand._id, hand)

      // populate the cards in the hand from the database
      game.hands[handIndex].cards = (await this.app.service('cards').find({ query: { _id: { $in: hand.cards } }})).data

      // return the deck and the game with the populated hand
      return { deck, game }
    } catch (error) {
      throw new GeneralError('There was a problem dealing a card!', error)
    }
  }

  async completeDealersHand (id, gameId) {
    try {
      // get the deck and game
      let deck = await super.get(id)
      let game = await this.app.service('games').get(gameId)

      // first, fully populate the dealer's hand
      let hand = (await this.app.service('cards').find({ query: { $in: game.dealerCards } })).data

      // get the soft17 rule
      const dealerStandsOnSoft17 = game.rules.dealerStandsOnSoft17

      while (!this.isDone(hand, dealerStandsOnSoft17)) {
        // get a card and add it to the list of cards in play then update the deck
        const inPlay = deck.cards.pop()
        deck.inPlay = [...deck.inPlay, inPlay]
        deck = await this.update(id, deck)

        // populate the card and turn it face up
        const card = this.app.services('cards').get(inPlay)
        card.isFaceUp = true

        // add it to the hand
        hand = [...hand, card]
      }

      // now that we're done, update dealer's hand in the game and the game in the database
      game.dealerCards = hand.map(h => h._id)
      game = await this.app.service('games').update(gameId, game)

      // replace the dealer's cards with the populated hand
      game.dealerCards = hand

      // return the game with the complete populated dealer's hand back to the client
      return game
    } catch (error) {
      throw new GeneralError('There was a problem completing the dealer\'s hand', error)
    }
  }

  async settleGame (id, gameId) {
    try {
      // get the deck and game
      const deck = await super.get(id)
      const game = await this.app.service('games').get(gameId)

      // move all of the cards in play to the discard pile
      deck.discards = [...deck.discards, ...deck.inPlay.splice(0)]
      await super.update(id, deck)

      // fully populate the cards in the dealer's hand and calculate the dealer's total
      const dealerHand = (await this.app.service('cards').find({ query: { $in: game.dealerCards } })).data
      const dealerTotal = this.total(dealerHand)
      const dealerBlackjack = this.isBlackjack(dealerHand, dealerTotal)

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
        // did they bust or lose to the dealer?
        if ((total > 21) || (!hasFive && total < dealerTotal)) {
          hand.result = hand.isInsured ? 'i' : 'l'
          multiplier = hand.result === 'i' ? 1 : 0
        } 
        // did they get a normal win?
        else if ((total > dealerTotal) || hasFive) {
          hand.result = 'w'
          // payout is 1:1, i.e. double the bet, or 4x if they doubled down
          multiplier = hand.isDoubled ? 4 : 2
        }
        // did they get blackjack? Usually 3:2 for multi-deck games and 6:5 for single deck games
        else if (hasBlackjack && !dealerBlackjack) {
          hand.result = 'b'
          multiplier = 1 + game.rules.payoutForBlackjack
        }
        // did they surrender?
        else if (hand.surrendered) {
          hand.result = 's'
          multiplier = 0.5
        }
        // it was a push
        else {
          hand.result = 'p'
          multiplier = 1
        }
        // determine the payout
        const payout = hand.bet * multiplier - hand.bet
        // update the player's account in the database
        if (payout !== 0) {
          await this.app.service('players').patch(hand.player, { payout })
        }
      }

      // return the game with the complete populated dealer's hand back to the client
      return deck
    } catch (error) {
      throw new GeneralError('There was a problem completing the dealer\'s hand', error)
    }
  }

  async update (id, data, params) {
    // decide what to do based on the action sent in the query
    if (!data.action) {
      return super.update(id, data, params)
    }
    
    if (data.action === 'deal') {
      // extract key values
      const { gameId } = data
      return this.deal(id, gameId)
    }
    if (data.action === 'dealOne') {
      const { gameId, recipient } = data
      return this.dealOneTo(id, gameId, recipient)
    }
    if (data.action === 'completeDealersHand') {
      const { gameId } = data
      return this.completeDealersHand(id, gameId)
    }
    if (data.action === 'settleGame') {
      const { gameId } = data
      return this.settleGame(id, gameId)
    }
  }
}
