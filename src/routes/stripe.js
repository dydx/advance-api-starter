import Stripe from '../controllers/stripe'

module.exports = api => {
  api.route('/stripe/webhooks').get(Stripe.webhooks)
}
