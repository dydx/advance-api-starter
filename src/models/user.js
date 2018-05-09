import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import timestamps from 'mongoose-timestamp'
import logger from '../utils/logger'
import email from '../utils/email'
import { uid } from '../utils/helpers'

export const UserSchema = new Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    index: true,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true,
    bcrypt: true
  },
  name: {
    type: String,
    trim: true,
    required: true
  },
  stripeCustomerId: {
    type: String,
    required: false
  },
  confirmed: {
    type: Boolean,
    default: false
  },
  confirmationToken: {
    type: String,
    required: false
  },
  admin: {
    type: Boolean,
    default: false
  },
  developer: {
    type: Boolean,
    default: false
  }
}, { collection: 'users' })

UserSchema.pre('save', function (next) {
  if (this.isNew) {
    this.confirmationToken = uid(16)
    this.save((err) => {
      if (err) {
        logger.error(err)
        next(new Error('Unable to save confirmation token.'))
      } else {
        email({
          type: 'welcome',
          email: this.email,
          confirmationToken: this.confirmationToken
        }).then(() => {
          next()
        }).catch(err => {
          logger.error(err)
          next()
        })
      }
    })
  }
  next()
})

UserSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) {
      return cb(err)
    }

    return cb(null, isMatch)
  })
}

UserSchema.plugin(timestamps)
UserSchema.index({ email: 1 })

module.exports = exports = mongoose.model('User', UserSchema)
