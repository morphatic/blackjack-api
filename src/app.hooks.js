const { isProvider, unless } = require('feathers-hooks-common')
const authenticate = require('./hooks/authenticate')
// Application hooks that run for every service

module.exports = {
  before: {
    all: [
      /**
       * Authenticate ALL API requests unless they are internal,
       * i.e. service-to-service
       */
      unless(isProvider('server'), authenticate()),
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
}
