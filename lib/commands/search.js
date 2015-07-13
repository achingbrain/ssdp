var adverts = require('../adverts')
var sendSsdpMessage = require('../send-ssdp-message')
var createSsdpMessage = require('../create-ssdp-message')

module.exports = function search (ssdp, sockets, udn, message) {
  if (!message.headers.MAN || !message.headers.MX || !message.headers.ST) {
    return
  }

  adverts.forEach(function (advert) {
    if (message.headers.ST === 'ssdp:all' || advert.service.usn === message.headers.ST) {
      sendSsdpMessage(ssdp, sockets, message.remote, function (socket, callback) {
        callback(null, createSsdpMessage('HTTP/1.1 200 OK', {
          'ST': advert.service.usn,
          'USN': advert.service.usn + '::' + udn,
          'LOCATION': advert.service.location,
          'CACHE-CONTROL': 'max-age=' + advert.service.ttl,
          'DATE': new Date().toUTCString(),
          'SERVER': advert.service.signature,
          'EXT': ''
        }))
      })
    }
  })
}
