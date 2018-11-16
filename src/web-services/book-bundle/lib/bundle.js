'use strict'
const request = require('request-promise')
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

module.exports = (app, esConf) => {
  app.post('/api/bundle', createBundle(esConf))
  app.get('/api/bundle/:id', getBundleById(esConf))
}
