var freeport = require('freeport')
var http = require('http')
var findAllInterfaces = require('../find-all-interfaces')
var detailsHandler = require('./details-handler')

module.exports = function createLocation (shutDownServers, options, socket, headers, callback) {
  if (options.location) {
    headers['LOCATION'] = options.location

    return callback(null, headers)
  }

  findAllInterfaces(socket.type === 'udp4', socket.type === 'udp6').forEach(function (iface) {
    freeport(function (error, port) {
      if (error) {
        return callback(error)
      }

      options.location = 'http://'

      if (socket.type === 'udp6') {
        options.location += '[' + iface.address + ']'
      } else {
        options.location += iface.address
      }

      options.location += ':' + port

      var server = http.createServer(detailsHandler.bind(null, options.detailsHandler))
      server.listen(port, socket.address, function (error) {
        callback(error, headers)
      })

      shutDownServers.push(function (callback) {
        server.close(callback)
      })
    })
  })
}
