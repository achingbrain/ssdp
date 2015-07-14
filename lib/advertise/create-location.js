var freeport = require('freeport')
var http = require('http')
var findAllInterfaces = require('../find-all-interfaces')
var detailsHandler = require('./details-handler')

module.exports = function createLocation (ssdp, advert, callback) {
  if (advert.location) {
    return callback()
  }

  advert.location = {}
  advert.shutDownServers = []

  ssdp.sockets.forEach(function (socket) {
    findAllInterfaces(socket.type === 'udp4', socket.type === 'udp6').forEach(function (iface) {
      freeport(function (error, port) {
        if (error) {
          return callback(error)
        }

        var location = 'http://'

        if (socket.type === 'udp6') {
          location += '[' + iface.address + ']'
        } else {
          location += iface.address
        }

        location += ':' + port

        advert.location[socket.type] = location

        var server = http.createServer(detailsHandler.bind(null, advert.details))
        server.listen(port, socket.address, function (error) {
          callback(error)
        })

        advert.shutDownServers.push(function (callback) {
          server.close(callback)
        })
      })
    })
  })
}
