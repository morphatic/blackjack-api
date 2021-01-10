module.exports = {
  host: 'api.blackjack.test',
  port: 3030,
  public: '../public/',
  paginate: {
    default: 10,
    max: 50,
  },
  magicKey: process.env.MAGIC_SK_TEST,
  mongodb: `mongodb+srv://${process.env.BLACKJACK_DEV_USER}:${process.env.BLACKJACK_DEV_PW}@cluster0.4yurq.mongodb.net/${process.env.BLACKJACK_DEV_DB}?retryWrites=true&w=majority`,
}
