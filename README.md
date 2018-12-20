# passport-myjohndeere

[Passport](http://passportjs.org/) strategy for authenticating with [MyJohnDeere](https://myjohndeere.deere.com/)
using the OAuth 1.0a API.

This module lets you authenticate using MyJohnDeere in your Node.js applications.
By plugging into Passport, MyJohnDeere authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

This strategy is based on [passport-twitter](https://github.com/jaredhanson/passport-twitter) by
[Jared Hanson](http://jaredhanson.net/).

## Install

```bash
$ npm install passport-myjohndeere
```

## Usage

#### Create an Application

Before using `passport-myjohndeere`, you must register an application with MyJohnDeere.
If you have not already done so, follow the
[John Deere Deverloper guides](https://developer.deere.com/#!help&doc=.%2Fgetstarted%2FHELPguides.htm).
Your application will be issued a consumer key (App ID) and consumer secret (App Secret), which
need to be provided to the strategy.  You will also need to configure a callback
URL which matches the route in your application.

#### Configure Strategy

The MyJohnDeere authentication strategy authenticates users using a MyJohnDeere account
and OAuth tokens.  The consumer key and consumer secret obtained when creating
an application are supplied as options when creating the strategy.  The strategy
also requires a `verify` function, which receives the access token and corresponding secret,
as well as `profile` which contains the authenticated user's profile.
The `verify` function must call the `done` callback providing a user to complete authentication.

```javascript
// app.js

const express = require('express')
const cookieSession = require('cookie-session')
const passport = require('passport')
const MyJohnDeereStrategy = require('passport-myjohndeere')
const User = require('./models/User')
const router = require('./router')

const port = process.env.PORT || 3000
const publicURL = process.env.PUBLIC_URL || `http://localhost:${port}`

const authOptions = {
  consumerKey: process.env.MJD_APP_ID,
  consumerSecret: process.env.MJD_APP_SECRET,
  platformURL: process.env.MJD_PLATFORM_URL,
  callbackURL: `${publicURL}/oauth/myjohndeere/callback`,
}

function authVerify(token, tokenSecret, profile, done) {
  const { accountName, givenName, familyName } = profile

  User.findByAccountName(accountName)
    .then(user => user || User.create({ accountName }))
    .then(user => user.update({ givenName, familyName, token, tokenSecret }))
    .then(user => done(null, user))
    .catch(err => done(err))
}

passport.use(new MyJohnDeereStrategy(authOptions, authVerify))
passport.serializeUser((user, done) => { done(null, user.id) })
passport.deserializeUser((id, done) => { User.findById(id).exec(done) })

const app = express()
...
app.use(cookieSession({ secret: process.env.SESSION_SECRET || 'keyboard cat' }))
app.use(passport.initialize())
app.use(passport.session())
app.use(router)
...
app.listen(port, () => console.log(`Listening on port ${port}`))
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'myjohndeere'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```javascript
// router.js

const express = require('express')
const passport = require('passport')
const router = express.Router()

router.get('/', (req, res) => {
  if (!req.isAuthenticated())
    return res.redirect('/login')

  res.render('index')
})

router.get('/login',
  passport.authenticate('myjohndeere')
)

// handler for callbackURL above
router.get('/oauth/myjohndeere/callback',
  passport.authenticate('myjohndeere', {
    successRedirect: '/',
    failureRedirect: '/login'
  })
)

module.exports = router
```

## Examples

Developers using the popular [Express](http://expressjs.com/) web framework can
refer to an [example](https://github.com/passport/express-4.x-twitter-example)
as a starting point for their own web applications, replacing `'twitter'` for `'myjohndeere'`.

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2018 Brendan Brewster (bjbrewster@gmail.com)
