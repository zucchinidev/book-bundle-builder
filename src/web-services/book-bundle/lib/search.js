'use strict'

const request = require('request')

const elasticsearchConfiguration = {}

function getElasticsearchReqBody (req) {
  return {
    size: 10,
    query: {
      match: {
        [req.params.field]: req.params.query
      }
    }
  }
}

module.exports = (app, { host, port, books_index } = elasticsearchConfiguration) => {
  const url = `http://${host}:${port}/${books_index}/book/_search`
  app.get('/api/search/books/:field/:query', (req, res) => {
    const body = getElasticsearchReqBody(req)
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
}