'use strict'

const adverts = require('../adverts')

const search = (ssdp, message, remote) => {
  if (!message.ST) {
    return
  }

  adverts.forEach(advert => {
    if (message.ST === 'ssdp:all' || advert.service.usn.toLowerCase() === message.ST.toLowerCase()) {
      ssdp.emit('ssdp:send-message', 'HTTP/1.1 200 OK', {
        'ST': message.ST === 'ssdp:all' ? advert.service.usn : message.ST,
        'USN': ssdp.udn + '::' + advert.service.usn,
        'LOCATION': advert.service.location,
        'CACHE-CONTROL': 'max-age=' + parseInt(advert.service.ttl / 1000, 10),
        'DATE': new Date().toUTCString(),
        'SERVER': ssdp.options.signature,
        'EXT': ''
      }, remote)
    }
  })
}

module.exports = search
