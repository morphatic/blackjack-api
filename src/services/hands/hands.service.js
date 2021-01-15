// Initializes the `hands` service on path `/hands`
const { Hands } = require('./hands.class')
const createModel = require('../../models/hands.model')
const hooks = require('./hands.hooks')

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true,
  }

  // Initialize our service with any options it requires
  app.use('/hands', new Hands(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('hands')

  service.hooks(hooks)
}
