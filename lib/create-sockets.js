var dgram = require('dgram')
var async = require('async')

function addMembership (socket, callback) {
  try {
    socket.addMembership(socket.options.broadcast.address, socket.address().address)
    socket.setBroadcast(true)
    socket.setMulticastTTL(socket.options.maxHops)
  } catch (error) {
    error.message = 'Adding membership ' + socket.options.broadcast.address + ' failed - ' + error.message
    return callback(error)
  }

  callback()
}

module.exports = function createSockets (ssdp, callback) {
  async.parallel(ssdp.options.sockets.map(function (options) {
    return function eachType (callback) {
      var socket = dgram.createSocket(options.type, ssdp.emit.bind(ssdp, 'transport:incoming-message'))
      socket.bind(options.bind.port, options.bind.address)
      socket.options = options
      socket.on('error', ssdp.emit.bind(ssdp, 'error'))
      socket.on('listening', function onSocketListening () {
        async.retry(ssdp.options.retry, addMembership.bind(null, socket), function (error) {
          callback(error, socket)
        })
      })
    }
  }), callback)
}
