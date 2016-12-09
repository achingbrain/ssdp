'use strict'

const freeport = require('freeport-promise')
const http = require('http')
const findAllInterfaces = require('./find-all-interfaces')
const detailsHandler = require('./details-handler')

const createLocation = (ssdp, advert) => {
  if (advert.location) {
    return Promise.resolve()
  }

  const servers = []

  advert.location = {}
  advert.shutDownServers = () => servers.map(server => new Promise((resolve, reject) => {
    server.close()
    resolve()
  }))

  return Promise.all(
    ssdp.sockets.map(socket => Promise.all(
      findAllInterfaces(socket.type === 'udp4' && advert.ipv4, socket.type === 'udp6' && advert.ipv6)
      .map(iface => {
        return freeport()
        .then(port => {
          return new Promise((resolve, reject) => {
            var location = 'http://'

            if (socket.type === 'udp6') {
              location += '[' + iface.address + ']'
            } else {
              location += iface.address
            }

            location += ':' + port

            advert.location[socket.type] = location

            var server = http.createServer(detailsHandler.bind(null, advert.details))
            server.listen(port, socket.address, error => {
              if (error) {
                return reject(error)
              }

              resolve()
            })

            servers.push(server)
          })
        })
      }))
    )
  )
}

module.exports = createLocation
