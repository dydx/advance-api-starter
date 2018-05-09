import mongoose, { Schema } from 'mongoose'
import timestamps from 'mongoose-timestamp'

export const CodeSchema = new Schema({
  value: {
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
  },
  clientId: {
    type: String,
    required: true
  }
}, { collection: 'codes' })

CodeSchema.plugin(timestamps)
module.exports = exports = mongoose.model('Code', CodeSchema)
