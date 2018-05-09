import { isEmpty, isUndefined } from 'lodash'
import User from '../models/user'
import Client from '../models/client'
import Token from '../models/token'
import Code from '../models/code'
import { uid } from '../utils/helpers'
import logger from '../utils/logger'
import config from '../config'
import { create } from '../utils/jwt'

const grant = (client, redirectUri, user, callback) => {
  const code = new Code({
    value: uid(16),
    clientId: client._id,
    redirectUri: redirectUri,
    userId: user._id
  })

  code.save(function(err) {
    if (err) { return callback(err) }
    callback(null, code.value)
  })
}

const exchange = (client, code, callback) => {
  Code.findOne({ value: code.value }, function (err, authCode) {
    if (err) { return callback(err) }
    if (authCode === undefined) { return callback(null, false) }
    if (client._id.toString() !== authCode.clientId) { return callback(null, false) }
    if (client.redirectUri !== authCode.redirectUri) { return callback(null, false) }

    authCode.remove((err) => {
      if (err) return callback(err, false)

      User.findOne({
        _id: code.userId
      }, (err, user) => {
        if (user === undefined) { return callback(null, false) }
        const userData = {
          _id: user._id,
          name: user.name,
          email: user.email,
          client: client.id,
          secret: client.secret
        }

        create(userData, (err, data) => {
          Token.findOne({ clientId: client._id, userId: user._id }, (err, token) => {
            if (err) callback(err, false)
            let tokenData = token
            if (!token) {
              tokenData = new Token()
              tokenData.userId = user._id
              tokenData.clientId = client._id
            }

            tokenData.value = data.token
            tokenData.save((err) => {
              if (err) callback(err, false)
              callback(null, data.token)
            })
          })
        })
      })
    })
  })
}

const authorization = (req, res, next) => {
  const clientId = req.query.clientId
  if (isEmpty(clientId)) {
    return res.status(422).json({
      message: 'You need to supply a client ID.'
    })
  }

  Client.findOne({ id: clientId }, function (err, client) {
    if (err || !client) return new Error(err || 'Could not find client')
    res.status(200).json({
      message: 'Sucessfully collected client information',
      client: {
        name: client.name,
        id: client.id
      }
    })
  })
}

const decision = (req, res, next) => {
  const clientId = req.body.clientId
  if (isEmpty(req.user) || isEmpty(clientId)) {
    return res.status(422).json({
      message: 'You are not authorized to give permission on this account'
    })
  }

  Client.findOne({ id: clientId }, function (err, client) {
    if (err) {
      return res.status(422).json({
        message: err.message || 'There was an unexpected error'
      })
    }
    grant(client, client.redirectUri, req.user, (err, code) => {
      if (err) {
        return res.status(422).json({
          message: err.message || 'There was an unexpected error'
        })
      }
      return res.status(200).json({
        message: 'Successfully authorized app',
        data: {
          redirectUri: client.redirectUri + '?code=' + code
        }
      })
    })
  })
}

const token = (req, res, next) => {
  const code = req.body.code
  if (isEmpty(code)) {
    return res.status(422).json({
      message: 'You need to supply a valid code'
    })
  }

  Code.findOne({ value: code }, (err, code) => {
    if (err || !code) {
      return res.status(422).json({
        message: err ? err.message : 'There was an unexpected error.'
      })
    }
    Client.findOne({ _id: code.clientId.toString() }, (err, client) => {
      if (err || !client) {
        return res.status(422).json({
          message: err ? err.message : 'There was an unexpected error.'
        })
      }
      exchange(client, code, (err, token) => {
        if (err) {
          return res.status(422).json({
            message: err ? err.message : 'There was an unexpected error.'
          })
        }

        if (!token) {
          return res.status(401).json({
            message: 'We could not generate a access token for you.'
          })
        }

        return res.status(200).json({
          message: 'Successfully authorized user',
          data: {
            accessToken: token
          }
        })
      })
    })
  })
}

module.exports = {
  authorization,
  decision,
  token
}
