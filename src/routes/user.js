import User from '../controllers/user';

module.exports = api => {
	api.route('/api/v1/users').get(User.list);
	api.route('/api/v1/users/:userId').get(User.get);
	api.route('/api/v1/users/:userId').put(User.put);
	api.route('/api/v1/users/').post(User.post);
	api.route('/api/v1/users/:userId').delete(User.delete);
}
