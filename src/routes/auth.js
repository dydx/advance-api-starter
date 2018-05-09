import Auth from '../controllers/auth'
import Jwt from '../utils/jwt'

module.exports = api => {
  api.route('/api/v1/auth/login').post(Auth.login)
  api.route('/api/v1/auth/signup').post(Auth.signup)
  api.route('/api/v1/auth').get(Jwt.verify, Auth.verify)
  api.route('/api/v1/auth/logout').get(Auth.logout)
}
