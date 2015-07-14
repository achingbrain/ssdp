var async = require('async')
var adverts = require('../adverts')
var broadcastAdvert = require('./broadcast-advert')
var callbackOrEmit = require('../callback-or-emit')
var notify = require('../commands/notify')

module.exports = function (ssdp, plumbing, advert, callback) {
  clearTimeout(plumbing.timeout)

  callback = callbackOrEmit(ssdp, callback)

  // remove advert from list
  var index = adverts.indexOf(advert)
  adverts.splice(index, 1)

  // stop location servers
  async.parallel(plumbing.shutDownServers, function (error) {
    if (error) {
      return callback(error)
    }

    broadcastAdvert(ssdp, advert, notify.BYEBYE, callback)
  })
}
