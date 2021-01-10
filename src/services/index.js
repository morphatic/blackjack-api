const users = require('./users/users.service.js');
const players = require('./players/players.service.js');
const hands = require('./hands/hands.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(users);
  app.configure(players);
  app.configure(hands);
}
