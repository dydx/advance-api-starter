import path from 'path'
import bcrypt from 'bcryptjs'
import jwt from 'express-jwt'
import { isEmpty } from 'lodash'

import jwtUtils from '../utils/jwt'
import logger from '../utils/logger'
import stripe from '../utils/stripe'
import User from '../models/user'
import UnauthorizedAccessError from '../utils/errors/unauthorized'

const login = (req, res, next) => {
  logger.info('Processing authenticate middleware')
  const email = req.body.email
  const password = req.body.password

  if (isEmpty(email) || isEmpty(password)) {
    return next(new UnauthorizedAccessError('401', {
      message: 'Invalid email or password'
    }))
  }
  process.nextTick(() => {
    User.findOne({ email }, (err, user) => {
      if (err || !user) {
        logger.error(err)
        return next(new UnauthorizedAccessError('401', {
          message: 'Invalid username or password'
        }))
      }

      user.comparePassword(password, (err, isMatch) => {
        if (isMatch && !err) {
          logger.info('User authenticated, generating token');
          jwtUtils.create(user, (err, data) => {
            req.user = data
            res.status(200).json({
              message: 'Successfully logged in',
              data
            })
          })
        } else {
          return next(new UnauthorizedAccessError('401', {
            message: 'Invalid username or password'
          }))
        }
      })
    })
  })
}

const signup = (req, res, next) => {
  logger.info('Processing authenticate middleware')
  const email = req.body.email
  const name = req.body.name
  const password = req.body.password

  process.nextTick(() => {
    const user = new User()
    user.email = email
    user.password = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
    user.name = name

    user.save(((err) => {
      if (err) {
        logger.error(err)
        return next(new Error('Unexpected error'))
      }

      stripe.createCustomer(user)
      jwtUtils.create(user, (err, data) => {
        req.user = data
        res.status(200).json({
          message: 'Successfully logged in',
          data
        })
      })
    }))
  })
}

const verify = (req, res, next) => {
  return res.status(200).json(req.user)
}

const logout = (req, res, next) => {
  if (jwtUtils.expire(req.headers)) {
    delete req.user
    res.clearCookie('user_sid')
    return res.status(200).json({
      message: 'User has been successfully logged out'
    })
  }

  return next(new UnauthorizedAccessError('401'))
}

module.exports = {
  login,
  signup,
  verify,
  logout
}
