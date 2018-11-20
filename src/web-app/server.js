'use strict'

const express = require('express')
const morgan = require('morgan')
const nconf = require('nconf')
const pkg = require('./package')
const expressSession = require('express-session')
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const TwitterStrategy = require('passport-twitter').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy

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
/**
 * Since we’re not storing per-user data, the profile really is all we need,
 * so we call done() immediately with it. In the future, we may need to do
 * something fancier here, like reach out to a database to retrieve user information
 * Note that the profile object here is exactly the input to the serializeUser() callback function
 * that you gave to Passport. We may end up doing something more complex to resolve the user
 * after Facebook sign-in. If we do, make sure you also update your Passport serialization
 * code since these profile objects must match.
 */
const verifyUserCallback = (accessToken, refreshToken, profile, done) => done(null, profile)
passport.use(new FacebookStrategy({
  clientID: nconf.get('auth:facebook:appID'),
  clientSecret: nconf.get('auth:facebook:appSecret'),
  callbackURL: new URL('/auth/facebook/callback', serviceUrl).href
}, verifyUserCallback))

passport.use(new TwitterStrategy({
  consumerKey: nconf.get('auth:twitter:consumerKey'),
  consumerSecret: nconf.get('auth:twitter:consumerSecret'),
  callbackURL: new URL('/auth/twitter/callback', serviceUrl).href
}, verifyUserCallback))

passport.use(new GoogleStrategy({
  clientID: nconf.get('auth:google:clientID'),
  clientSecret: nconf.get('auth:google:clientSecret'),
  callbackURL: new URL('/auth/google/callback', serviceUrl).href,
  scope: 'https://www.googleapis.com/auth/plus.login'
}, verifyUserCallback))


app.use(passport.initialize())
app.use(passport.session())

app.get('/api/version', (req, res) => res.status(200).send(pkg.version))
app.use('/api', require('./lib/bundle')(conf))
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

app.get('/auth/facebook', passport.authenticate('facebook'))
app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/',
  failureRedirect: '/'
}))

app.get('/auth/twitter', passport.authenticate('twitter'))
app.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successRedirect: '/',
  failureRedirect: '/'
}))

app.get('/auth/google', passport.authenticate('google', {scope: ['email', 'profile']}))
app.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/'
}))

if (isDev) {

  app.use(webpackDevMiddleware(webpack(webpackConfig), {
    publicPath: '/',
    stats: { colors: true }
  }))

} else {
  app.use(express.static('dist'))
}

app.listen(port, () => console.log(`Server listening on port ${port}`))