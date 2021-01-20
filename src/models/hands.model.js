// hands-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'hands'
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const schema = new Schema({
    game: {
      type: Schema.Types.ObjectId,
      ref: 'games',
    },
    player: {
      type: Schema.Types.ObjectId,
      ref: 'players',
    },
    cards: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'cards',
      }],
    },
    bet: {
      type: Number,
      default: 5,
    },
    isDoubled: {
      type: Boolean,
      default: false,
    },
    result: {
      type: String,
      enum: ['p', 'w', 'l', 'b', 's', 'i'], // push, win, loss, blackjack, surrender, insurance
    },
    isInsured: {
      type: Boolean,
      default: false,
    },
    isSplit: { // was this hand the result of a split?
      type: Boolean,
      default: false,
    },
    splitFromAceOrTen: { // a "blackjack" resulting from splitting aces or 10-cards only counts as 21 towards the win/payout
      type: Boolean,
      default: false,
    },
    surrendered: {
      type: Boolean,
      default: false,
    },
    payout: {
      type: Number,
      default: 0,
    },
    seat: {
      type: Number,
      default: 0,
    },
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
