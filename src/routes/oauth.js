import OAuth from '../controllers/oauth'
import { login } from '../controllers/auth'

module.exports = api => {
	api.route('/oauth/authorize').get(OAuth.authorization)
  api.route('/oauth/authorize/decision').post(OAuth.decision)
  api.route('/oauth/token').post(OAuth.token)
}
