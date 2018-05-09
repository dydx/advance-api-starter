import config from '../../config'
import Client from '../../models/client'

const middleware = (req, res, next) => {
  if (config.acceptedHosts.indexOf(req.headers.host) > -1) {
    next()
  }
  if (!req.query.secret) {
    next(new Error('You need to include your client secret to access the API.'))
  }

  Client.findOne({ secret: req.query.secret }, (err, client) => {
    if (err || !client) {
      next(new Error('You need to include a valid client secret token'))
    } else {
      next()
    }
  })
}

module.exports = {
  middleware
}
