var sendSsdpMessage = require('../send-ssdp-message')
var createSsdpMessage = require('../create-ssdp-message')

module.exports = function search (ssdp, sockets, serviceType) {
  sendSsdpMessage(ssdp, sockets, null, function (socket, callback) {
    callback(null, createSsdpMessage('M-SEARCH * HTTP/1.1', {
      'HOST': socket.opts.broadcast.address + ':' + socket.opts.broadcast.port,
      'ST': serviceType || 'ssdp:all',
      'MAN': 'ssdp:discover',
      'MX': 3
    }))
  })
}
