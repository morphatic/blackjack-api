// players.model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'players'
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const schema = new Schema({
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    chips: { // dollar value of chips held
      type: Number,
      default: 100,
    },
    preferences: {
      rules: {
        seats: {
          type: Number,
          default: 5,
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
      },
      deckColor: {
        type: String,
        default: 'red',
        enum: ['red', 'blue'],
      },
      playWithRobots: {
        type: Boolean,
        default: false,
      },
    },
    // TODO: Figure out format for history
    // Not sure how to capture history. Initial thought is just to
    // store an array of raw JSON strings that have some sort of
    // summary of all of the hands played.
    history: [String],
  }, {
    timestamps: true,
  })

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    mongooseClient.deleteModel(modelName)
  }
  return mongooseClient.model(modelName, schema)
  
}
