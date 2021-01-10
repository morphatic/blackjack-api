const users = require('./users/users.service.js');
const players = require('./players/players.service.js');
const hands = require('./hands/hands.service.js');
const cards = require('./cards/cards.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(users);
  app.configure(players);
  app.configure(hands);
  app.configure(cards);
}
