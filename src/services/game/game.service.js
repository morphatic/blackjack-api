// Initializes the `game` service on path `/game`
const Game = require('./game.class')

module.exports = function (app) {
  // Initialize our service with any options it requires
  app.use('/game', Game)
}
