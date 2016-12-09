'use strict'

const adverts = require('../adverts')
const parseOptions = require('./parse-options')
const broadcastAdvert = require('./broadcast-advert')
const stopAdvert = require('./stop-advert')
const createLocation = require('./create-location')
const notify = require('../commands/notify')

const advertise = (ssdp, advert) => {
  advert = parseOptions(ssdp, advert)

  return createLocation(ssdp, advert)
  .then(() => {
    // send ssdp:byebye then ssdp:alive
    // see: https://msdn.microsoft.com/en-us/library/cc247331.aspx
    broadcastAdvert(ssdp, advert, notify.BYEBYE)
    broadcastAdvert(ssdp, advert, notify.ALIVE)

    const plumbing = {}

    const broadcast = function () {
      plumbing.timeout = setTimeout(function () {
        broadcastAdvert(ssdp, advert, notify.ALIVE)
        broadcast()
      }, advert.interval)
    }
    broadcast()

    plumbing.shutDownServers = advert.shutDownServers
    delete advert.shutDownServers

    const ad = {
      service: advert,
      stop: stopAdvert.bind(null, ssdp, plumbing, advert)
    }

    adverts.push(ad)

    return ad
  })
}

module.exports = advertise
