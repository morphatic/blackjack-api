// games-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'games'
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const schema = new Schema({
    hands: [{
      type: Schema.Types.ObjectId,
      ref: 'hands',
      autopopulate: true,
    }],
    dealerCards: [{
      type: Schema.Types.ObjectId,
      ref: 'cards',
    }],
    table: {
      type: Schema.Types.ObjectId,
      ref: 'tables',
    },
    deck: {
      type: Schema.Types.ObjectId,
      ref: 'decks',
    },
    currentHand: {
      type: Number,
      default: 0,
    },
    currentSeat: {
      type: Number,
      default: 0,
    },
    rules: {
      seats: {
        type: Number,
        default: 1,
      },
      decks: {
        type: Number,
        default: 6,
      },
      minBet: {
        type: Number,
        default: 5,
      },
      maxBet: {
        type: Number,
        default: 2000,
      },
      betIncrement: {
        type: Number,
        default: 5,
      },
      allowEarlySurrender: {
        type: Boolean,
        default: false,
      },
      allowLateSurrender: {
        type: Boolean,
        default: false,
      },
      allowableDoubleDownTotals: {
        type: [Number],
        default: [9, 10, 11],
      },
      numberOfSplitsAllowed: {
        type: Number,
        default: 3,
      },
      allowSplitsForAll10Cards: {
        type: Boolean,
        default: true,
      },
      allowDoublingAfterSplit: {
        type: Boolean,
        default: true,
      },
      payoutForBlackjack: {
        type: Number,
        default: 1.5, // 3:2 == 1.5; 6:5 == 1.2
      },
      dealPlayersCardsFaceDown: {
        type: Boolean,
        default: false,
      },
      dealerStandsOnSoft17: {
        type: Boolean,
        default: true,
      },
      fiveCardCharlieWins: {
        type: Boolean,
        default: false,
      },
      insuranceAvailable: {
        type: Boolean,
        default: true,
      },
      secondsAllowedPerAction: {
        type: Number,
        default: 30,
      },
      canOnlyHitOnceAfterAceSplit: {
        type: Boolean,
        default: true,
      },
    },
    seats: {
      type: Number,
      default: 0,
    },
    state: {
      type: String,
      default: 'notStarted',
    },
  }, {
    timestamps: true,
  })

  // always populate games
  schema.plugin(require('mongoose-autopopulate'))

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName)
  }
  return mongooseClient.model(modelName, schema)
  
}
