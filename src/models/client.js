import mongoose, { Schema } from 'mongoose'
import timestamps from 'mongoose-timestamp'

export const ClientSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  secret: {
    type: String,
    required: true
  },
  redirectUri: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
}, { collection: 'clients' })

ClientSchema.plugin(timestamps)
ClientSchema.index({ secret: 1, id: 1 })

module.exports = exports = mongoose.model('Client', ClientSchema)
