const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  email: {
    type: String, required: true,
    trim: true, unique: true,
    match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  },
  password: {
    type: String
  },
  gender: {
    type: String
  },
  locale: {
    type: String
  },
  createdAt: {
    type: Date,
    'default': Date.now
  },
  imageUrl: {
    type: String
  },
  birthday: {
    type: Date
  },
  facebookProvider: {
    type: {
      id: String,
      token: String
    },
    select: false
  },
  location: {
    id: String,
    name: String
  }
});

UserSchema.set('toJSON', {getters: true, virtuals: true});

UserSchema.statics.upsertFbUser = function(accessToken, refreshToken, profile, json, cb) {
  var that = this;
  return this.findOne({
    'facebookProvider.id': profile.id
  }, function(err, user) {
    // no user was found, lets create a new one
    if (!user) {
      var newUser = new that({
        firstname: json.first_name,
        lastname: json.last_name,
        email: json.email,
        gender: json.gender,
        locale: json.locale,
        imageUrl: profile.photos[0].value,
        birthday: new Date(json.birthday),
        facebookProvider: {
          id: profile.id,
          token: accessToken
        },
        location: {
          id: json.location.id,
          name: json.location.name
        }
      });

      newUser.save(function(error, savedUser) {
        if (error) {
          console.log(error);
        }
        return cb(error, savedUser);
      });
    } else {
      return cb(err, user);
    }
  });
};

// generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(12), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
