const passport = require('passport');
const FacebookTokenStrategy = require('passport-facebook-token');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt')
const User = require('./models/user');

const createToken = function(auth) {
  return jwt.sign({
    id: auth.id
  }, process.env.JWT_SECRET,
  {
    expiresIn: 60 * 120
  });
};

const generateToken = function (req, res, next) {
  req.token = createToken(req.auth);
  next();
};

const sendToken = function (req, res) {
  res.setHeader('x-auth-token', req.token);
  res.status(200).send({ user: req.auth, token: req.token});
};

const getCurrentUser = function(req, res, next) {
  if (req.auth && req.auth.id) {
    User.findById(req.auth.id, function(err, user) {
      if (err) {
        next(err);
      } else {
        req.user = user;
        next();
      }
    });
  } else {
    next();
  }
};

const authenticate = expressJwt({
  secret: process.env.JWT_SECRET,
  requestProperty: 'auth',
  credentialsRequired: true,
  getToken: function(req) {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  }
});

const getOne = function (req, res) {
  let user = req.user.toObject();

  delete user['facebookProvider'];
  delete user['__v'];

  res.json(user);
};

function setupAuthService(app) {

  passport.use(new FacebookTokenStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    fbGraphVersion: 'v2.9',
    profileFields: ['id', 'displayName', 'name', 'emails', 'gender', 'locale', 'birthday', 'location']
  },
  function (accessToken, refreshToken, profile, done) {
    // console.log('profile: ',profile);
    const profileJson = profile._json
    User.upsertFbUser(accessToken, refreshToken, profile, profileJson, function(err, user) {
      return done(err, user);
    });
  }));

  app.post('/auth/facebook', passport.authenticate('facebook-token', {session: false}), function(req, res, next) {
    if (!req.user) {
      return res.send(401, 'User Not Authenticated');
    }

    // prepare token for API
    req.auth = {
      id: req.user.id
    };

    next();
  }, generateToken, sendToken);

  app.get('/auth/me', authenticate, getCurrentUser, getOne)

  app.post('/auth/signup', function(req, res, next) {
    if (!req.body.email || !req.body.password) {
      res.json({success: false, msg: 'Please pass email and password.'});
    } else {
      User.findOne({ email: req.body.email}, function(err, existingUser) {
        if (err) {
          return res.json({success: false, msg: 'Error happened.'});
        }

        if (existingUser) {
          return res.json({success: false, msg: 'User already exists.'});
        }

        var user = new User();
        user.email = req.body.email;
        user.password = user.generateHash(req.body.password);
        user.save(function(err) {
          if (err) return res.json({success: false, msg: 'Error happened.'});

          req.auth = {
            id: user.id
          }
          next();
        });

      })
    }
  }, generateToken, sendToken)

  app.post('/auth/local', function(req, res, next) {
    if (!req.body.email || !req.body.password) {
      res.json({success: false, msg: 'Please pass email and password.'});
    } else {
      User.findOne({ email: req.body.email}, function(err, user) {
        if (err) {
          return res.json({success: false, msg: 'Error happened.'});
        }

        if (!user) {
          return res.send({success: false, msg: 'Authentication failed. User not found.'});
        } else {
          if (!user.validPassword(req.body.password)) {
            return res.send({success: false, msg: 'Authentication failed. Invalid password.'});
          }
          req.auth = {
            id: user.id
          }
          next();
        }
      })
    }
  }, generateToken, sendToken)

};

module.exports = {
  setupAuthService,
  authenticate,
  getCurrentUser,
  getOne
}
