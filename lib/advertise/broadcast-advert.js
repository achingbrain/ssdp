'use strict'

const broadcastAdvert = (ssdp, advert, notifcationSubType) => {
  ssdp.emit('ssdp:send-message', 'NOTIFY * HTTP/1.1', {
    'NT': advert.usn,
    'NTS': notifcationSubType,
    'USN': advert.usn + '::' + ssdp.udn,
    'CACHE-CONTROL': 'max-age=' + parseInt(advert.ttl / 1000, 10),
    'SERVER': ssdp.options.signature,
    'LOCATION': advert.location
  })
}

module.exports = broadcastAdvert
