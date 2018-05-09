import path from 'path'
import util from 'util'
import redis from 'redis'
import jsonwebtoken from 'jsonwebtoken'
import { isEmpty, isNull, isEqual, merge } from 'lodash'

import UnauthorizedAccessError from '../errors/unauthorized'
import logger from '../logger'
import Client from '../../models/client'
import Token from '../../models/token'
import config from '../../config'

const client = redis.createClient(config.redis.url)
const TOKEN_EXPIRATION = 60
const TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION * 60

client.on('error', function (err) {
  logger.error(err)
})

client.on('connect', function () {
  logger.info("Redis successfully connected")
})

const fetch = (headers) => {
  if (headers && headers.authorization) {
    const authorization = headers.authorization
    const part = authorization.split(' ')
    if (part.length === 2) {
      const token = part[1]
      return part[1]
    }
  }
  return null
}

const create = (user, callback) => {
  logger.info('Creating token')
  if (isEmpty(user)) {
    return callback(new Error('User data cannot be empty.'), false)
  }

  const data = {
    _id: user._id,
    name: user.name,
    email: user.email,
    client: user.client || false,
    token: jsonwebtoken.sign({ _id: user._id }, config.jwt.secret, {
      expiresIn: TOKEN_EXPIRATION_SEC
    })
  }

  const decoded = jsonwebtoken.decode(data.token)
  data.token_exp = decoded.exp;
  data.token_iat = decoded.iat;

  logger.info('Token generated for user: %s, token: %s', data.email, data.token)

  client.set(data.token, JSON.stringify(data), (err, reply) => {
    if (err) {
      logger.error(err)
      return callback(new Error(err), false)
    }

    if (reply) {
      client.expire(data.token, TOKEN_EXPIRATION_SEC, (err, reply) => {
        if (err) {
          logger.error(err)
          return callback(new Error('Can not set the expire value for the token key'), false)
        }

        if (reply) {
          return callback(null, data)
        } else {
          return callback(new Error('Expiration not set on redis'), false)
        }
      })
    } else {
      return callback(new Error('Token not set in redis'), false)
    }
  })

  return data
}

const retrieve = (id, done, clientSecret = false) => {
  logger.info('Calling retrieve for token: %s', id)
  if (isNull(id)) {
    return done(new Error('token_invalid', {
      message: 'Invalid token.'
    }))
  }

  client.get(id, (err, reply) => {
    if (err) {
      return done(err, {
        message: err
      })
    }

    if (isNull(reply)) {
      return done(new Error('token_invalid', {
        message: 'Token doesn\'t exists, are you sure it hasn\'t expired or been revoked?'
      }))
    }

    const data = JSON.parse(reply)
    logger.info('User data fetched from redis store for user: %s', data.email)
    if (data.client) {
      if (!clientSecret) {
        return done(new Error('You must add the application secret key', {
          message: 'Invalid secret key'
        }))
      }

      Client.findOne({ secret: clientSecret }, (err, client) => {
        if (err || !client) {
          return done(new Error('You must enter a valid application secret key.', {
            message: 'Invalid secret key'
          }))
        }

        Token.findOne({ userId: data._id, clientId: client._id, value: data.token }, (err, token) => {
          if (err || !token) {
            return done(new Error('invalid_token', {
              message: 'Token doesn\'t exists, login into the system so it can generate new token.'
            }))
          }

          return done(null, data)
        })
      })
    } else if (isEqual(data.token, id)) {
      return done(null, data)
    } else {
      return done(new Error('token_doesnt_exist', {
        message: 'Token doesn\'t exists, login into the system so it can generate new token.'
      }))
    }
  })
}

const verify = (req, res, next) => {
  logger.info('Verifying token')
  const token = fetch(req.headers)
  jsonwebtoken.verify(token, config.jwt.secret, (err, decode) => {
    if (err) {
      req.user = undefined
      return next(new UnauthorizedAccessError('invalid_token'))
    }

    retrieve(token, (err, data) => {
      if (err) {
        req.user = undefined
        return next(new UnauthorizedAccessError('invalid_token', {
          message: err.message || 'Invalid token'
        }))
      }
      req.user = data
      next()
    }, req.query.secret)
  })
}

const expire = (headers) => {
  const token = fetch(headers)
  logger.info('Expiring token: %s', token)
  if (token !== null) {
    client.expire(token, 0)
  }

  return token !== null
}

const middleware = () => {
  const func = (req, res, next) => {
    const token = fetch(req.headers)
    retrieve(token, (err, data) => {
      if (err) {
        req.user = undefined
        return next(new UnauthorizedAccessError('invalid_token', {
          message: err.message || 'Invalid token'
        }))
      } else {
        req.user = merge(req.user, data)
        next()
      }
    }, req.query.secret)
  }

  func.unless = require('express-unless')
  return func;
}

module.exports = {
  TOKEN_EXPIRATION,
  TOKEN_EXPIRATION_SEC,
  fetch,
  create,
  retrieve,
  expire,
  verify,
  middleware
}
