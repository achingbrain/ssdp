var createSsdpMessage = require('../create-ssdp-message')
var broadcastSsdpMessage = require('../broadcast-ssdp-message')
var async = require('async')

module.exports = function broadcastAdvert (ssdp, advert, notifcationSubType, callback) {
  async.parallel(ssdp.sockets.map(function (socket) {
    return function (callback) {
      var message = createSsdpMessage('NOTIFY * HTTP/1.1', {
        'HOST': socket.options.broadcast.address + ':' + socket.options.broadcast.port,
        'NT': advert.usn,
        'NTS': notifcationSubType,
        'USN': advert.usn + '::' + ssdp.udn,
        'CACHE-CONTROL': 'max-age=' + parseInt(advert.ttl / 1000, 10),
        'SERVER': ssdp.options.signature,
        'LOCATION': advert.location[socket.type]
      })

      broadcastSsdpMessage(ssdp, socket, message, callback)
    }
  }), callback)
}
