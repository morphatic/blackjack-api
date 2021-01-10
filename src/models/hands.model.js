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
      enum: ['p', 'w', 'l', 'b', 's'],
    },
    isInsured: {
      type: Boolean,
      default: false,
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
