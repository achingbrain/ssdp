var async = require('async')
var createHeaders = require('./create-headers')
var createLocation = require('./create-location')
var createSsdpMessage = require('../create-ssdp-message')
var sendSsdpMessage = require('../send-ssdp-message')
var adverts = require('../adverts')
var parseOptions = require('./parse-options')

var NOTIFY_ALIVE = 'ssdp:alive'
var NOTIFY_BYE = 'ssdp:byebye'

module.exports = function advertise (ssdp, sockets, udn, options, callback) {
  options = parseOptions(options)

  var shutDownServers = []
  var timeout

  var broadcastAdvert = function broadcastAdvert (message) {
    sendSsdpMessage(ssdp, sockets, null, function (socket, callback) {
      async.waterfall([
        createHeaders.bind(null, udn, socket, options, message),
        createLocation.bind(null, shutDownServers, options, socket)
      ], function (error, results) {
        var message

        if (!error) {
          message = createSsdpMessage('NOTIFY * HTTP/1.1', results)
        }

        callback(error, message)
      })
    }, function (error) {
      if (callback) {
        // only call callback once otherwise we'll trigger it each
        // time we broadcast the service status
        callback(error)
        callback = null
      } else if (error) {
        ssdp.emit('error', error)
      }
    })

    timeout = setTimeout(broadcastAdvert.bind(null, NOTIFY_ALIVE), options.interval)
  }

  broadcastAdvert(NOTIFY_ALIVE)

  var advert = {
    service: options,
    stop: function (callback) {
      clearTimeout(timeout)

      // remove advert from list
      var index = adverts.indexOf(advert)
      adverts.splice(index, 1)

      // stop location servers
      async.parallel(shutDownServers, function (error) {
        broadcastAdvert(NOTIFY_BYE)

        if (callback) {
          callback(error)
        } else if (error) {
          ssdp.emit('error', error)
        }
      })
    }
  }

  adverts.push(advert)

  return advert
}
