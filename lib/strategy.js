// Load modules.
var OAuthStrategy = require('passport-oauth1')
  , util = require('util')
  , APIError = require('./errors/apierror');


/**
 * `Strategy` constructor.
 *
 * The MyJohnDeere authentication strategy authenticates requests by delegating to
 * MyJohnDeere using the OAuth protocol.
 *
 * Applications must supply a `verify` callback which accepts a `token`,
 * `tokenSecret` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `consumerKey`     MyJohnDeere client App ID
 *   - `consumerSecret`  MyJohnDeere client App Shared Secret
 *   - `platformURL`     Base URL to MyJohnDeere API platform. Default `'https://sandboxapi.deere.com/platform'`
 *   - `callbackURL`     URL to which MyJohnDeere will redirect the user after obtaining authorization
 *
 * Examples:
 *
 *     passport.use(new MyJohnDeereStrategy({
 *         consumerKey: '123-456-789',
 *         consumerSecret: 'shhh-its-a-secret'
 *         platformURL: 'https://api.deere.com/platform',
 *         callbackURL: 'https://www.example.net/oauth/callback',
 *       },
 *       function(token, tokenSecret, profile, done) {
 *         User.findOrCreate(..., function(err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {object} options
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
  options = options || {};
  options.platformURL = options.platformURL || 'https://sandboxapi.deere.com/platform'
  options.requestTokenURL = options.requestTokenURL || (options.platformURL + '/oauth/request_token');
  options.accessTokenURL = options.accessTokenURL || (options.platformURL + '/oauth/access_token');
  options.userAuthorizationURL = options.userAuthorizationURL || 'https://my.deere.com/consentToUseOfData';
  options.sessionKey = options.sessionKey || 'oauth:myjohndeere';
  options.customHeaders = { 'Accept': 'application/vnd.deere.axiom.v3+json' };

  OAuthStrategy.call(this, options, verify);
  this.name = 'myjohndeere';
  this._userProfileURL = options.userProfileURL || (options.platformURL + '/users/@currentUser');
}

// Inherit from `OAuthStrategy`.
util.inherits(Strategy, OAuthStrategy);


/**
 * Retrieve user profile from MyJohnDeere.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`    ('myjohndeere')
 *   - `id`          (same as `accountName`)
 *   - `accountName`
 *   - `givenName`
 *   - `familyName`
 *
 * Note that MyJohnDeere *does not* supply basic profile information with access token
 * so we must make addition additional HTTP request to MyJohnDeere for user profile.
 *
 * @param {string} token
 * @param {string} tokenSecret
 * @param {object} params
 * @param {function} done
 * @access protected
 */
Strategy.prototype.userProfile = function(token, tokenSecret, params, done) {
  this._oauth.get(this._userProfileURL, token, tokenSecret, function (err, body, res) {
    if (err) {
      if (err.data) {
        try {
          var json = JSON.parse(err.data);
          if (json && json.errors && json.errors.length) {
            var e = json.errors[0];
            return done(new APIError(e.message, e.code));
          }
        } catch (_) {}
      }

      return done(new OAuthStrategy.InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      var json = JSON.parse(body);
      var profile = {
        provider: 'myjohndeere',
        id: json.accountName,
        accountName: json.accountName,
        givenName: json.givenName,
        familyName: json.familyName,
        _raw: body,
        _json: json
      }

      done(null, profile);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }
  });
};


// Expose constructor.
module.exports = Strategy;
