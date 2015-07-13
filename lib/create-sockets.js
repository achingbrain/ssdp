var dgram = require('dgram')
var async = require('async')
var parseMessage = require('./parse')

var TYPES = ['udp4', 'udp6']

function addMembership (socket, opts, type, callback) {
  try {
    socket.addMembership(opts.broadcast.address, socket.address().address)
    socket.setBroadcast(true)
    socket.setMulticastTTL(opts.maxHops)
  } catch (error) {
    error.message = 'Adding membership ' + opts.broadcast.address + ' failed - ' + error.message
    return callback(error)
  }

  callback()
}

module.exports = function createSockets (ssdp, options, callback) {
  async.parallel(TYPES.filter(function (type) {
    return options[type]
  }).map(function (type) {
    return function eachType (callback) {
      var opts = options[type]
      var socket = dgram.createSocket(type, parseMessage.bind(null, ssdp))
      socket.bind(opts.bind.port, opts.bind.address)
      socket.opts = opts
      socket.on('error', ssdp.emit.bind(ssdp, 'error'))
      socket.on('listening', function onSocketListening () {
        async.retry(options.retry, addMembership.bind(null, socket, opts, type), function (error) {
          callback(error, socket)
        })
      })
    }
  }), callback)
}
