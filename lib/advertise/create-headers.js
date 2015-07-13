
module.exports = function createHeaders (udn, socket, advert, notifcationSubType, callback) {
  callback(null, {
    'HOST': socket.opts.broadcast.address + ':' + socket.opts.broadcast.port,
    'NT': advert.usn,
    'NTS': notifcationSubType,
    'USN': advert.usn + '::' + udn,
    'CACHE-CONTROL': 'max-age=' + advert.ttl,
    'SERVER': advert.signature
  })
}
