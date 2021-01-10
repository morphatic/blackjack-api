const { Magic } = require('@magic-sdk/admin')

const setupMagic = app => {
  const key = app.get('magicKey')
  const magic = new Magic(key)
  app.set('magic', magic)
}

module.exports = {
  setupMagic,
}
