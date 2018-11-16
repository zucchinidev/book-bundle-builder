'use strict'
const request = require('request-promise')
const getBookUrl = require('./search').getBookUrl
const { required } = require('./RequiredParamException')

function getUrl ({ host = required('host'), port = required('port'), bundles_index = required('bundles_index') }) {
  return `http://${host}:${port}/${bundles_index}/bundle`
}

function createBundle (esConf) {
  return async function (req, res) {
    try {
      const name = req.query.name || ''
      const bundle = { name, books: [] }
      const esRes = await request.post({ url: getUrl(esConf), body: bundle, json: true })
      res.status(201).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error)
    }
  }
}

function getBundleById (esConf) {
  return async function (req, res) {
    try {
      const url = `${getUrl(esConf)}/${req.params.id}`
      const esRes = await request.get({ url, json: true })
      res.status(201).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error)
    }
  }
}

function setBundleName (esConf) {
  return async function (req, res) {
    try {
      const url = `${getUrl(esConf)}/${req.params.id}`
      const options = { url, json: true }
      const bundle = (await request(options))._source
      bundle.name = req.params.name
      const esRes = await request.put({ ...options, body: bundle })
      res.status(200).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error)
    }
  }
}

function insertBookInBundle (esConf) {
  return async function (req, res) {
    try {
      const url = `${getUrl(esConf)}/${req.params.id}`
      const bookId = req.params.pgid
      const bookUrl = `${getBookUrl(esConf)}/${bookId}`
      const options = { json: true }
      const [{ _source: bundle, _version: version }, { _source: book }] = await Promise.all([
        request({ ...options, url }),
        request({ ...options, url: bookUrl })
      ])

      const bookNotPresentInBundle = bundle.books.findIndex(book => book.id === bookId) === -1

      if (bookNotPresentInBundle) {
        bundle.books.push({ id: bookId, title: book.title })
      }

      const esRes = await request.put({ ...options, body: bundle, url, qs: { version } })
      res.status(200).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error)
    }
  }
}

function deleteBundle (esConf) {
  return async function (req, res) {
    try {
      const url = `${getUrl(esConf)}/${req.params.id}`
      const esRes = await request.delete({ json: true, url })
      res.status(204).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error)
    }
  }
}

function deleteBookInBundle (esConf) {
  return async function (req, res) {
    try {
      const url = `${getUrl(esConf)}/${req.params.id}`
      const bookId = req.params.pgid
      const options = { json: true }
      const { _source: bundle, _version: version } = await request({ ...options, url })

      const idx = bundle.books.findIndex(book => book.id === bookId)
      const bookNotPresentInBundle = idx === -1

      if (bookNotPresentInBundle) {
        throw { statusCode: 409, error: { reason: 'Conflict - Bundle does not contains that book.' } }
      }

      bundle.books.splice(idx, 1)

      const esRes = await request.put({ ...options, body: bundle, url, qs: { version } })
      res.status(200).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error)
    }
  }
}

module.exports = (app, esConf) => {
  /**
   * Create a new bundle with the specified name.
   * curl -X POST http://<host>:<port>/api/bundle?name=<name>
   */
  app.post('/api/bundle', createBundle(esConf))
  /**
   * Retrieve a given bundle.
   * curl http://<host>:<port>/api/bundle/<id>
   */
  app.get('/api/bundle/:id', getBundleById(esConf))
  /**
   * Set the specified bundle's name with the specified name.
   * curl -X PUT http://<host>:<port>/api/bundle/<id>/name/<name>
   */
  app.put('/api/bundle/:id/name/:name', setBundleName(esConf))
  /**
   * Put a book into a bundle by its id.
   * curl -X PUT http://<host>:<port>/api/bundle/<id>/book/<pgid>
   */
  app.put('/api/bundle/:id/book/:pgid', insertBookInBundle(esConf))
  /**
   * Remove a book from a bundle.
   * curl -X DELETE http://<host>:<port>/api/bundle/<id>/book/<pgid>
   */
  app.delete('/api/bundle/:id/book/:pgid', deleteBookInBundle(esConf))
  /**
   * Delete a bundle entirely.
   * curl -X DELETE http://<host>:<port>/api/bundle/<id>
   */
  app.delete('/api/bundle/:id', deleteBundle(esConf))
}
