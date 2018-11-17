'use strict'

const express = require('express')
const morgan = require('morgan')
const nconf = require('nconf')
const pkg = require('./package')
const expressSession = require('express-session')
const passport = require('passport')

const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackConfig = require('./webpack.config')

nconf
  .argv()
  .env('__')
  .defaults({ 'NODE_ENV': 'development' })

const NODE_ENV = nconf.get('NODE_ENV')
const isDev = NODE_ENV === 'development'

nconf
  .defaults({ conf: `${__dirname}/${NODE_ENV}.config.json` })
  .file(nconf.get('conf'))

const conf = nconf.get('elasticsearch')
const serviceUrl = new URL(nconf.get('serviceUrl'))
const port = serviceUrl.port || (serviceUrl.protocol === 'https' ? 443 : 80)

const app = express()
app.use(morgan('dev'))

if (isDev) {
  const FileStore = require('session-file-store')(expressSession)
  app.use(expressSession({
    resave: false,
    saveUninitialized: true,
    secret: 'unguessable',
    store: new FileStore()
  }))
} else {

}

passport.serializeUser((profile, done) => done(null, {
  id: profile.id,
  provide: profile.provide
}))

passport.deserializeUser((user, done) => done(null, user))
app.use(passport.initialize())
app.use(passport.session())

app.get('/api/version', (req, res) => res.status(200).send(pkg.version))
require('./lib/search')(app, conf)
require('./lib/bundle')(app, conf)

app.get('/api/session', (req, res) => {
  const session = { auth: req.isAuthenticated() }
  res.status(200).json(session)
})

app.get('/auth/signout', (req, res) => {
  req.logout()
  res.redirect('/')
})

if (isDev) {

  app.use(webpackDevMiddleware(webpack(webpackConfig), {
    publicPath: '/',
    stats: { colors: true }
  }))

} else {
  app.use(express.static('dist'))
}

app.listen(port, () => console.log(`Server listening on port ${port}`))