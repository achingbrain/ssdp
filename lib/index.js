'use strict'

const EventEmitter = require('wildemitter')
const parseOptions = require('./default-ssdp-options')
const createSockets = require('./create-sockets')
const advertise = require('./advertise')
const discover = require('./discover')
const notify = require('./commands/notify')
const search = require('./commands/search')
const searchResponse = require('./discover/search-response')
const adverts = require('./adverts')
const parseIncomingRequest = require('./parse-ssdp-message')
const sendSsdpMessage = require('./send-ssdp-message')

class SSDP extends EventEmitter {
  constructor (options) {
    super()

    options = parseOptions(options)

    Object.defineProperties(this, {
      udn: {
        enumerable: true,
        value: options.udn
      },
      options: {
        enumerable: false,
        value: options
      }
    })

    var self = this

    // set up proxy methods that will be invoked once we are ready
    var methods = ['advertise', 'discover', 'stop']
    methods.forEach(function (method) {
      self[method] = function () {
        var args = Array.prototype.slice.call(arguments)

        return new Promise((resolve, reject) => {
          self.once('ready', function () {
            self[method].apply(self, args)
            .then(result => resolve(result))
            .catch(error => reject(error))
          })
        })
      }
    })

    // set up UDP sockets listening for SSDP broadcasts
    createSockets(this)
    .then(sockets => {
      Object.defineProperty(this, 'sockets', {
        enumerable: true,
        value: sockets
      })

      // set up our actual methods now that we are ready
      this.advertise = advertise.bind(null, this)
      this.discover = discover.bind(null, this)
      this.stop = () => {
        return Promise.all(
          adverts.map(advert => advert.stop())
        )
        .then(() => {
          return Promise.all(
            sockets.map(socket => {
              return new Promise((resolve, reject) => {
                socket.on('close', () => resolve())
                socket.close()
                socket.closed = true
              })
            })
          )
        })
      }

      // set up protocol listeners
      this.on('transport:incoming-message', parseIncomingRequest.bind(null, this))
      this.on('ssdp:send-message', sendSsdpMessage.bind(null, this))
      this.on('ssdp:m-search', search.bind(null, this))
      this.on('ssdp:notify', notify.bind(null, this))
      this.on('ssdp:search-response', searchResponse.bind(null, this))

      // all done
      this.emit('ready')
    })
    .catch(error => {
      this.emit('error', error)
    })
  }
}

module.exports = (options) => {
  return new SSDP(options)
}
