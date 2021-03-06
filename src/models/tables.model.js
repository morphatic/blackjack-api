// tables-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const modelName = 'tables'
  const mongooseClient = app.get('mongooseClient')
  const { Schema } = mongooseClient
  const schema = new Schema({
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'players',
    },
    deck: {
      type: Schema.Types.ObjectId,
      ref: 'decks',
    },
    games: [{
      type: Schema.Types.ObjectId,
      ref: 'games',
      autopopulate: true,
    }],
    seats: {
      type: Number,
      default: 1,
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
