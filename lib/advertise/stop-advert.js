'use strict'

var adverts = require('../adverts')
var broadcastAdvert = require('./broadcast-advert')
var notify = require('../commands/notify')

const stopAdvert = (ssdp, plumbing, advert) => {
    clearTimeout(plumbing.timeout)

    // remove advert from list
    var index = adverts.indexOf(advert)
    adverts.splice(index, 1)


    var shutdown;

    if (plumbing.shutDownServers) {
        shutdown = Promise.all(
            plumbing.shutDownServers()
        )
    }
    else {
        shutdown = Promise.resolve();       // when we are being hosted by express, etc, don't shut the server down here.
    }

    // stop location servers
    return shutdown.then(() => {
        broadcastAdvert(ssdp, advert, notify.BYEBYE)
    })
}

module.exports = stopAdvert
