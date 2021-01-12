const { NotAuthenticated, GeneralError } = require('@feathersjs/errors')

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    // extract app and headers from the context
    const { app, params: { headers } } = context
    // retrieve the Magic SDK instance
    const magic = app.get('magic')
    // make sure an Authorization header was passed
    if (!headers.authorization) {
      throw new NotAuthenticated('No authorization header')
    }
    // get the DID
    const token = headers.authorization.split(' ').pop()
    // try to validate the token
    try {
      // return void if successful; throws error otherwise
      magic.token.validate(token)
    } catch (error) {
      throw new NotAuthenticated('Authentication token was invalid', error)
    }
    // extract the user's email from the decoded DID
    const { email } = await magic.users.getMetadataByToken(token)
    // get the player's profile from the database; returns array of players
    let player
    try {
      player = await app.service('players').find({ query: { email } })
      // if no players returned
      if (player.data.length === 0) {
        // first login; add them to the DB
        player = await app.service('players').create({ email })
      } else {
        // otherwise, extract from the array
        player = player.data[0]
      }
    } catch (error) {
      throw new GeneralError('Could not create player', error)
    }
    // add the player to the context
    context.player = player

    return context
  }
}
