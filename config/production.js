module.exports = {
  host: 'blackjack-api.morphatic.com',
  port: process.env.PORT,
  magicKey: process.env.MAGIC_SK_LIVE,
  mongodb: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0.4yurq.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
}
