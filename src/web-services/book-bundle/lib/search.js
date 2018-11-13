'use strict'

const request = require('request')

const elasticsearchConfiguration = {}

module.exports = (app, { host, port, books_index } = elasticsearchConfiguration) => {
  const url = `http://${host}:${port}/${books_index}/book/_search`
  app.get('/api/search/books/:field/:query', (req, res) => {
    const body = {
      size: 10,
      query: {
        match: {
          [req.params.field]: req.params.query
        }
      }
    }
    const options = { url, json: true, body }
    request.get(options, (err, esRes, esResBody) => {
      if (err) {
        return res.status(502).json({
          error: 'BAD_GATEWAY',
          reason: err.code
        })
      }
      if (esRes.statusCode !== 200) {
        return res.status(esRes.statusCode).json(esResBody)
      }

      res.status(200).json(esResBody.hits.hits.map(({ _source }) => _source))
    })
  })

  app.get('/api/suggest/:field/:query', (req, res) => {
    const body = {
      size: 0, //  Setting the size parameter to zero informs Elasticsearch that we don’t want any matching documents returned, just the suggestions
      suggest: {
        suggestions: {
          text: req.params.query,
          term: {
            field: req.params.field,
            suggest_mode: 'always',
          },
        }
      }
    }
    const options = { url, json: true, body }
    new Promise((resolve, reject) => {
      request.get(options, (err, esRes, esResBody) => {
        if (err) {
          reject({ error: err })
          return
        }
        if (esRes.statusCode !== 200) {
          reject({ error: esResBody })
          return
        }
        resolve(esResBody)
      })
    })
      .then(esResBody => res.status(200).json(esResBody.suggest.suggestions))
      .catch(({ error }) => res.status(error.status || 502).json(error))
  })

}