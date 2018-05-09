import Client from '../models/client'

const create = (req, res, next) => {
  const client = new Client()
  client.name = req.body.name
  client.id = 'client_' + Math.random().toString(36).substr(2, 11)
  client.secret = 'secret_' + Math.random().toString(36).substr(2, 11)
  client.redirectUri = req.body.redirectUri
  client.userId = req.user._id

  client.save((err) => {
    if (err) res.send(err)
    res.json({ message: 'Client was created.', data: client })
  })
}

const collect = (req, res, next) => {
  Client.find({ userId: req.user._id }, (err, clients) => {
    if (err) res.send(err)
    res.json({ message: 'Clients were collected.', data: clients })
  })
}

module.exports = {
  create,
  collect
}
