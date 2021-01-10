// Initializes the `decks` service on path `/decks`
const { Decks } = require('./decks.class')
const createModel = require('../../models/decks.model')
const hooks = require('./decks.hooks')

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true,
  }

  // Initialize our service with any options it requires
  app.use('/decks', new Decks(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('decks')

  service.hooks(hooks)
}
