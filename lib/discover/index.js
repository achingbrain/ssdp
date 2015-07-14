var async = require('async')
var broadcastSsdpMessage = require('../broadcast-ssdp-message')
var createSsdpMessage = require('../create-ssdp-message')
var callbackOrEmit = require('../callback-or-emit')

module.exports = function search (ssdp, serviceType, callback) {
  callback = callbackOrEmit(ssdp, callback)

  async.parallel(ssdp.sockets.map(function (socket) {
    return function (callback) {
      var message = createSsdpMessage('M-SEARCH * HTTP/1.1', {
        'HOST': socket.options.broadcast.address + ':' + socket.options.broadcast.port,
        'ST': serviceType || 'ssdp:all',
        'MAN': 'ssdp:discover',
        'MX': 0
      })

      broadcastSsdpMessage(ssdp, socket, message, callback)
    }
  }), callback)
}
