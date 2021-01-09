const users = require('./users/users.service.js');
const players = require('./players/players.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(users);
  app.configure(players);
}
