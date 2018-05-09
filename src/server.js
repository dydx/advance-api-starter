import fs from 'fs'
import path from 'path'
import express from 'express'
import session from 'express-session'
import bodyParser from 'body-parser'
import cors from 'cors'
import compression from 'compression'
import jwt from 'express-jwt'
import unless from 'express-unless'
import responseTime from 'response-time'
import morgan from 'morgan'
import hostValidation from 'host-validation'

import config from './config'
import logger from './utils/logger'
import { middleware } from './utils/jwt'
import { middleware as clientMiddleware } from './utils/oauth'
import NotFoundError from './utils/errors/notFound'

// Setup app
const api = express()
api.use(cors())
api.use(compression())
api.use(responseTime())
api.use(bodyParser.urlencoded({ extended: true }))
api.use(bodyParser.json())
api.use(morgan('dev'))
api.set('view engine', 'ejs')
api.use(session({
  secret: config.session.secret,
  saveUninitialized: true,
  resave: true
}))

// Setup JWT tokens
const jwtConfig = jwt({ secret: config.jwt.secret })
jwtConfig.unless = unless

// Validate permissions for app
const requiresAdmin = [
	'/api/v1/auth/signup',
	'/api/v1/auth/login',
	'/oauth/authorize',
	'/oauth/authorize/decision',
	'/api/v1/clients',
	'/api/v1/users/confirm'
]

requiresAdmin.map(route => {
	api.use(route, hostValidation({ hosts: config.acceptedHosts }))
})

api.use('/api/*', clientMiddleware)

// Setup non-authenticated routes
const nonAuthedRoutes = [
	'/api/v1/auth/signup',
	'/api/v1/auth/login',
	'/oauth/authorize',
	'/api/v1/users/confirm'
]

api.use(jwtConfig.unless({ path: nonAuthedRoutes }))
api.use(middleware().unless({ path: nonAuthedRoutes }))

// Automatically require routes files
fs.readdirSync(path.join(__dirname, 'routes')).map(file => {
	require('./routes/' + file)(api)
})

// Redirect all other routes to 404
api.all('/api/*', (req, res, next) => {
	next(new NotFoundError('404'))
})

// Error handler
api.use('/api/*', (err, req, res, next) => {
	var errorType = typeof err,
			code = err.status || 500,
			msg = { message: err.message || 'Internal Server Error' }

	switch (err.name) {
			case "UnauthorizedError":
					code = err.status
					msg = undefined
					break
			case "BadRequestError":
			case "UnauthorizedAccessError":
			case "NotFoundError":
					code = err.status
					msg = err.inner
					break
			default:
					break
	}
	return res.status(code).json(msg)
})

// Start listening
api.listen(config.server.port, err => {
	if (err) {
		logger.error(err)
		process.exit(1)
	}
	require('./utils/db')
	logger.info(`API is now running on port ${config.server.port} in ${config.env} mode`)
})

module.exports = api
