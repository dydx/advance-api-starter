import mongoose, { Schema } from 'mongoose'
import timestamps from 'mongoose-timestamp'

export const TokenSchema = new Schema({
  value: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  clientId: {
    type: String,
    required: true
  }
}, { collection: 'tokens' })

TokenSchema.plugin(timestamps)

module.exports = exports = mongoose.model('Token', TokenSchema)
