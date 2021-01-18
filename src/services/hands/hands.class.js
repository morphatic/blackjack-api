const { Service } = require('feathers-mongoose')

exports.Hands = class Hands extends Service {
  setup (app) {
    this.app = app
  }

  async patch (id, data, params) {
    // update the associated user's balance when a hand is insured or doubled down on
    if (data.isDoubled || data.isInsured) {
      // get the hand and associated player
      const hand = await super.get(id)
      const player = await this.app.service('players').get(hand.player)

      // if it was a double down
      if (data.isDoubled) {
        player.chips -= hand.bet
      }

      // if buying insurance
      if (data.isInsured) {
        player.chips -= hand.bet / 2
      }

      // update the player
      await this.app.service('players').patch(player._id, { chips: player.chips })
    }

    return super.patch(id, data, params)
  }
}
