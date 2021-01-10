const axios = require('axios')
const app = require('../src/app')

const host = app.get('host') || 'localhost'
const port = app.get('port') || 8998
const getUrl = pathname => `http://${host}:${port}/${pathname || ''}`

describe('Feathers application tests (with jest)', () => {
  let server

  beforeAll(done => {
    app.set('mongodb', 'http://127.0.0.1:27017/app')
    server = app.listen(port)
    server.once('listening', () => done())
  })

  afterAll(async () => {
    await server.close()
  })

  it('starts and shows the index page', async () => {
    expect.assertions(1)

    const { data } = await axios.get(getUrl())

    expect(data.indexOf('<html lang="en">')).not.toBe(-1)
  })

  describe('404', () => {
    it('shows a 404 HTML page', async () => {
      try {
        await axios.get(getUrl('path/to/nowhere'), {
          headers: {
            'Accept': 'text/html',
          },
        })
      } catch (error) {
        const { response } = error

        expect(response.status).toBe(404)
        expect(response.data.indexOf('<html>')).not.toBe(-1)
      }
    })

    it('shows a 404 JSON error without stack trace', async () => {
      try {
        await axios.get(getUrl('path/to/nowhere'))
      } catch (error) {
        const { response } = error

        expect(response.status).toBe(404)
        expect(response.data.code).toBe(404)
        expect(response.data.message).toBe('Page not found')
        expect(response.data.name).toBe('NotFound')
      }
    })
  })
})
