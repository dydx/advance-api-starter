import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import timestamps from 'mongoose-timestamp'
import logger from '../utils/logger'
import email from '../utils/email'

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
		email({
			type: 'welcome',
			email: this.email
		}).then(() => {
			next()
		}).catch(err => {
			logger.error(err)
			next()
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
