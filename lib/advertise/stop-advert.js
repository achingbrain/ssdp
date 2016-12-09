'use strict'

var adverts = require('../adverts')
var broadcastAdvert = require('./broadcast-advert')
var notify = require('../commands/notify')

const stopAdvert = (ssdp, plumbing, advert) => {
  clearTimeout(plumbing.timeout)

  // remove advert from list
  var index = adverts.indexOf(advert)
  adverts.splice(index, 1)

  // stop location servers
  return Promise.all(
    plumbing.shutDownServers()
  )
  .then(() => {
    broadcastAdvert(ssdp, advert, notify.BYEBYE)
  })
}

module.exports = stopAdvert
