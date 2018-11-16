'use strict'

const express = require('express')
const morgan = require('morgan')
const nconf = require('nconf')
const pkg = require('./package')

nconf.argv().env('__')
nconf.defaults({ conf: `${__dirname}/config.json` })
nconf.file(nconf.get('conf'))
const port = nconf.get('port')
const conf = nconf.get('elasticsearch')

const app = express()
app.use(morgan('dev'))
require('./lib/search')(app, conf)
require('./lib/bundle')(app, conf)
app.get('/api/version', (req, res) => res.status(200).send(pkg.version))
app.listen(port, () => console.log(`Server listening on port ${port}`))