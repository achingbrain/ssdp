var freeport = require('freeport')
var http = require('http')
var findAllInterfaces = require('../find-all-interfaces')
var detailsHandler = require('./details-handler')
var async = require('async')

module.exports = function createLocation (ssdp, advert, callback) {
  if (advert.location) {
    return callback()
  }

  advert.location = {}
  advert.shutDownServers = []

  async.parallel(ssdp.sockets.map(function (socket) {
    return function (next) {
      async.parallel(findAllInterfaces(socket.type === 'udp4' && advert.ipv4, socket.type === 'udp6' && advert.ipv6).map(function (iface) {
        return function (next) {
          freeport(function (error, port) {
            if (error) {
              return next(error)
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
              next(error)
            })

            advert.shutDownServers.push(function (callback) {
              server.close(callback)
            })
          })
        }
      }), next)
    }
  }), callback)
}
