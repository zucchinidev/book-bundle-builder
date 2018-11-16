'use strict'

const request = require('request-promise')
const { requiredParam } = require('./RequiredParamException')

function getUrl ({
                   host = requiredParam('port'),
                   port = requiredParam('port'),
                   books_index = requiredParam('books_index')
                 }) {
  return `http://${host}:${port}/${books_index}/book/_search`
}

function getHitsByField (esConf) {
  return function (req, res) {
    const body = {
      size: 10,
      query: {
        match: {
          [req.params.field]: req.params.query
        }
      }
    }
    request.get({ url: getUrl(esConf), json: true, body })
      .then(esResBody => res.status(200).json(esResBody.hits.hits.map(({ _source }) => _source)))
      .catch(({ error }) => res.status(error.status || 502))
  }
}

function getSuggestionsByField (esConf) {
  return function (req, res) {
    const { query: text, field } = req.params
    const suggestMode = 'always'
    const body = {
      size: 0, //  Setting the size parameter to zero informs Elasticsearch that we don’t want any matching documents returned, just the suggestions
      suggest: {
        suggestions: { text, term: { field, suggest_mode: suggestMode } }
      }
    }
    request.get({ url: getUrl(esConf), json: true, body })
      .then(esResBody => res.status(200).json(esResBody.suggest.suggestions))
      .catch(({ error }) => res.status(error.status || 502).json(error))
  }
}

module.exports = (app, esConf) => {
  app.get('/api/search/books/:field/:query', getHitsByField(esConf))
  app.get('/api/suggest/:field/:query', getSuggestionsByField(esConf))
}