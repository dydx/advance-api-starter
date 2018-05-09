import Client from '../controllers/client'

module.exports = api => {
	api.route('/api/v1/clients').post(Client.create)
  api.route('/api/v1/clients').get(Client.collect)
}
