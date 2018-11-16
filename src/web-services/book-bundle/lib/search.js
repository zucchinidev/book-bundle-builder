'use strict'

const request = require('request-promise')
const { required } = require('./RequiredParamException')

function getUrl ({ host = required('host'), port = required('port'), books_index = required('books_index') }) {
  return `http://${host}:${port}/${books_index}/book/_search`
}

function getHitsByField (esConf) {
  return async function (req, res) {
    try {
      const body = {
        size: 10,
        query: { match: { [req.params.field]: req.params.query } }
      }
      const esRes = await request.get({ url: getUrl(esConf), json: true, body })
      res.status(200).json(esRes.hits.hits.map(({ _source }) => _source))
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error)
    }
  }
}

function getSuggestionsByField (esConf) {
  return async function (req, res) {
    try {
      const { query: text, field } = req.params
      const suggestMode = 'always'
      const body = {
        size: 0, //  Setting the size parameter to zero informs Elasticsearch that we don’t want any matching documents returned, just the suggestions
        suggest: {
          suggestions: { text, term: { field, suggest_mode: suggestMode } }
        }
      }
      const esResBody = await request.get({ url: getUrl(esConf), json: true, body })
      res.status(200).json(esResBody.suggest.suggestions)
    } catch (err) {
      res.status(err.statusCode || 502).json(err.error)
    }
  }
}

module.exports = (app, esConf) => {
  app.get('/api/search/books/:field/:query', getHitsByField(esConf))
  app.get('/api/suggest/:field/:query', getSuggestionsByField(esConf))
}