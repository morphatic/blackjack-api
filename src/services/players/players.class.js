const { Service } = require('feathers-mongoose')

exports.Players = class Players extends Service {
  setup (app) {
    this.app = app
  }

  async patch (id, data, params) {
    // check to see if it's a payout
    if (data.payout) {
      // get the user's record from the database
      const player = super.get(id)
      // update their amount of chips
      data.chips = player.chips + data.payout
      // remove the payout field from the data
      delete data.payout
    }
    return super.patch(id, data, params)
  }
}
