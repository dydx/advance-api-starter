import config from '../../config'
import logger from '../logger'

const stripe = require('stripe')(config.stripe.secret)

const createCustomer = (user) => {
  logger.info('Creating a stripe customer')
  stripe.customers.create({
    email: user.email,
    description: `User subscription for ${user.name}`
  }, (err, customer) => {
    if (err) {
      logger.error(err)
      return new Error(err)
    }

    logger.info('Stripe customer was created')
    user.stripeCustomerId = customer.id
    user.save()
    return customer
  })
}

const retieveCustomer = (customerId) => {
  logger.info('Collecting stripe customer')
  stripe.customers.retrieve(customerId, (err, customer) => {
    if (err) {
      logger.error(err)
      return new Error(err)
    }

    logger.info('Customer collected')
    return customer
  })
}

const updateCustomer = (customerId, data) => {
  logger.info('Updating stripe customer')
  stripe.customers.update(customerId, data, (err, customer) => {
    if (err) {
      logger.error(err)
      return new Error(err)
    }

    logger.info('Stripe customer was updated')
    return customer
  })
}

module.exports = {
  createCustomer,
  retieveCustomer,
  updateCustomer
}
