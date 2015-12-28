var adverts = require('../adverts')
var parseOptions = require('./parse-options')
var broadcastAdvert = require('./broadcast-advert')
var stopAdvert = require('./stop-advert')
var createLocation = require('./create-location')
var notify = require('../commands/notify')
var callbackOrEmit = require('../callback-or-emit')

module.exports = function advertise (ssdp, advert, callback) {
  callback = callbackOrEmit(ssdp, callback)
  advert = parseOptions(ssdp, advert)

  createLocation(ssdp, advert, function (error) {
    if (error) {
      return callback(error)
    }

    // send ssdp:byebye then ssdp:alive
    // see: https://msdn.microsoft.com/en-us/library/cc247331.aspx
    broadcastAdvert(ssdp, advert, notify.BYEBYE)
    broadcastAdvert(ssdp, advert, notify.ALIVE)

    var plumbing = {}

    var broadcast = function () {
      plumbing.timeout = setTimeout(function () {
        broadcastAdvert(ssdp, advert, notify.ALIVE)
        broadcast()
      }, advert.interval)
    }
    broadcast()

    plumbing.shutDownServers = advert.shutDownServers
    delete advert.shutDownServers

    var ad = {
      service: advert,
      stop: stopAdvert.bind(null, ssdp, plumbing, advert)
    }

    adverts.push(ad)

    callback(null, ad)
  })
}
