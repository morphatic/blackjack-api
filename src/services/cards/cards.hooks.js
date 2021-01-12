

module.exports = {
  before: {
    all: [],
    find: [
      context => {
        // disable pagination to retrieve any number of cards
        if (context.params.query.$limit === '-1' ) {
          context.params.paginate = false
          delete context.params.query.$limit
        }
        return context
      },
    ],
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
