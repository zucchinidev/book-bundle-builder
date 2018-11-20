'use strict'
const request = require('request-promise')
const express = require('express')

const getBookUrl = require('./search').getBookUrl
const { required } = require('./RequiredParamException')

function getUrl ({ host = required('host'), port = required('port'), bundles_index = required('bundles_index') }) {
  return `http://${host}:${port}/${bundles_index}/bundle`
}

function createBundle (esConf) {
  return async function (req, res) {
    try {
      const name = req.query.name || ''
      const bundle = { name, books: [], userKey: getUserKey(req) }
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
      const id = req.params.id
      const url = `${getUrl(esConf)}/${id}`
      const { _source: bundle } = await request.get({ url, json: true })
      if (bundle.userKey !== getUserKey(req)) {
        throw {
          statusCode: 403,
          error: 'You are not authorized to view this bundle'
        }
      }
      res.status(201).json({ id, bundle })
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error || err)
    }
  }
}

function setBundleName (esConf) {
  return async function (req, res) {
    try {
      const url = `${getUrl(esConf)}/${req.params.id}`
      const options = { url, json: true }
      const bundle = (await request(options))._source
      if (bundle.userKey !== getUserKey(req)) {
        throw {
          statusCode: 403,
          error: 'Yoy are not authorized to modify this bundle.'
        }
      }
      bundle.name = req.params.name
      const esRes = await request.put({ ...options, body: bundle })
      res.status(200).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error || err)
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

      if (bundle.userKey !== getUserKey(req)) {
        throw {
          statusCode: 403,
          error: 'Yoy are not authorized to modify this bundle.'
        }
      }

      const bookNotPresentInBundle = bundle.books.findIndex(book => book.id === bookId) === -1

      if (bookNotPresentInBundle) {
        bundle.books.push({ id: bookId, title: book.title })
      }

      const esRes = await request.put({ ...options, body: bundle, url, qs: { version } })
      res.status(200).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error || err)
    }
  }
}

function deleteBundle (esConf) {
  return async function (req, res) {
    try {
      const url = `${getUrl(esConf)}/${req.params.id}`
      const { _source: bundle, _version: version } = await request({ ...options, url })
      if (bundle.userKey !== getUserKey(req)) {
        throw {
          statusCode: 403,
          error: 'Yoy are not authorized to modify this bundle.'
        }
      }
      const esRes = await request.delete({ json: true, url, qs: { version } })
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
      if (bundle.userKey !== getUserKey(req)) {
        throw { statusCode: 403, error: 'You are not authorized to modify this bundle.' }
      }
      const idx = bundle.books.findIndex(book => book.id === bookId)
      const bookNotPresentInBundle = idx === -1

      if (bookNotPresentInBundle) {
        throw { statusCode: 409, error: { reason: 'Conflict - Bundle does not contains that book.' } }
      }

      bundle.books.splice(idx, 1)

      const esRes = await request.put({ ...options, body: bundle, url, qs: { version } })
      res.status(200).json(esRes)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error || err)
    }
  }
}

const getUserKey = ({ user: { provider, id } }) => `${provider}-${id}`

function getListBundles (esConf) {
  return async function (req, res) {
    try {
      const url = `${getUrl(esConf)}/_search`
      const body = {
        size: 1000,
        query: { match: { userKey: getUserKey(req) } }
      }
      const options = { json: true, url, body }
      const response = await request(options)
      const bundles = response.hits.hits.map(({ _id: id, _source: { name } }) => ({ id, name }))
      res.status(200).json(bundles)
    } catch (err) {
      console.log(err)
      res.status(err.statusCode || 502).json(err.error || err)
    }
  }
}

module.exports = esConf => {
  const router = express.Router()
  router.use((req, res, next) => {
    if (!req.isAuthenticated()) {
      res.status(403).json({
        error: 'You must sign in to use this service'
      })
      return
    }
    next()
  })

  /**
   * List bundles for the currently authenticated user.
   */
  router.get('/list-bundles', getListBundles(esConf))

  /**
   * Create a new bundle with the specified name.
   * curl -X POST http://<host>:<port>/bundle?name=<name>
   */
  router.post('/bundle', createBundle(esConf))
  /**
   * Retrieve a given bundle.
   * curl http://<host>:<port>/bundle/<id>
   */
  router.get('/bundle/:id', getBundleById(esConf))
  /**
   * Set the specified bundle's name with the specified name.
   * curl -X PUT http://<host>:<port>/bundle/<id>/name/<name>
   */
  router.put('/bundle/:id/name/:name', setBundleName(esConf))
  /**
   * Put a book into a bundle by its id.
   * curl -X PUT http://<host>:<port>/bundle/<id>/book/<pgid>
   */
  router.put('/bundle/:id/book/:pgid', insertBookInBundle(esConf))
  /**
   * Remove a book from a bundle.
   * curl -X DELETE http://<host>:<port>/bundle/<id>/book/<pgid>
   */
  router.delete('/bundle/:id/book/:pgid', deleteBookInBundle(esConf))
  /**
   * Delete a bundle entirely.
   * curl -X DELETE http://<host>:<port>/bundle/<id>
   */
  router.delete('/bundle/:id', deleteBundle(esConf))
  return router
}
