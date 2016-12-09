'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const afterEach = require('mocha').afterEach
const sinon = require('sinon')
const expect = require('chai').expect
const ssdp = require('../')
const freeport = require('freeport-promise')
const http = require('http')
const xml2js = require('xml2js')
const cache = require('../lib/cache')
const adverts = require('../lib/adverts')
const _ = require('lodash')

describe('ssdp', () => {
  let bus
  let detailsServer
  let details
  let detailsLocation
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers()
    details = {
      foo: 'bar'
    }

    return Promise.all([
      freeport()
      .then((port) => {
        return new Promise((resolve, reject) => {
          bus = ssdp({
            sockets: [{
              broadcast: {
                port: port
              },
              bind: {
                port: port
              }
            }]
          })
          bus.on('ready', () => resolve())
          bus.on('error', () => reject())
        })
      }),
      freeport()
      .then((port) => {
        return new Promise((resolve, reject) => {
          detailsLocation = 'http://localhost:' + port

          detailsServer = http.createServer(function (request, response) {
            var builder = new xml2js.Builder()
            var xml = builder.buildObject(details)

            response.writeHead(200, {'Content-Type': 'text/xml'})
            response.end(xml)
          })
          detailsServer.listen(port, (error) => {
            if (error) {
              return reject(error)
            }

            resolve()
          })
        })
      })
    ])
  })

  afterEach(() => {
    clock.restore()

    return Promise.all([
      bus.stop(),
      detailsServer.close()
    ])
    .then(() => {
      adverts.splice(0, adverts.length)
      for (var key in cache) {
        delete cache[key]
      }
    })
  })

  it('should discover a service once', done => {
    bus.on('discover:urn:schemas-upnp-org:device:Basic:1', service => {
      expect(service.details.foo).to.equal('bar')
      done()
    })

    var message = 'NOTIFY * HTTP/1.1\r\n' +
      'HOST: 239.255.255.250:1900\r\n' +
      'NT: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'NTS: ssdp:alive\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'CACHE-CONTROL: max-age=1800\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
    bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
  })

  it('should update a service', done => {
    bus.on('discover:urn:schemas-upnp-org:device:Basic:1', service => {
      bus.on('update:uuid:2f402f80-da50-11e1-9b23-00178809ea66', service => {
        expect(service.details.foo).to.equal('bar')
        done()
      })

      // expire the detail cache
      clock.tick(1900000)

      // change the details
      details.bar = 'baz'

      bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
    })

    var message = 'NOTIFY * HTTP/1.1\r\n' +
      'HOST: 239.255.255.250:1900\r\n' +
      'NT: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'NTS: ssdp:alive\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'CACHE-CONTROL: max-age=1800\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
  })

  it('should advertise a service', done => {
    var usn = 'my-service-type'

    var didByeBye

    bus.on('transport:outgoing-message', (socket, message, recpient) => {
      message = message.toString('utf8')

      if (!didByeBye) {
        expect(message).to.contain('NT: ' + usn)
        expect(message).to.contain('NTS: ssdp:byebye')
        didByeBye = true
        return
      } else {
        expect(message).to.contain('NT: ' + usn)
        expect(message).to.contain('NTS: ssdp:alive')
        bus.off('transport:outgoing-message', this)

        done()
      }
    })

    bus.advertise({
      usn: usn,
      details: {
        root: {
          specVersion: {
            major: 1,
            minor: 0
          },
          URLBase: 'http://example.com'
        }
      }
    })
    .catch(error => done(error))
  })

  it('should respond to searches for an advertised service', done => {
    var usn = 'my-service-type'
    var searcher = {
      port: 39823,
      address: '0.0.0.0'
    }

    bus.on('transport:outgoing-message', (socket, message, remote) => {
      message = message.toString('utf8')

      if (_.startsWith(message, 'HTTP/1.1 200 OK')) {
        expect(message).to.contain('USN: ' + bus.udn + '::my-service-type')
        expect(message).to.contain('ST: my-service-type')
        expect(message).to.contain('LOCATION: http://')
        expect(remote).to.deep.equal(searcher)

        done()
      }
    })

    bus.advertise({
      usn: usn,
      details: function (callback) {
        callback(null, {
          root: {
            specVersion: {
              major: 1,
              minor: 0
            },
            URLBase: 'http://example.com'
          }
        })
      }
    })
    .then(advert => {
      var message = 'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'ST: ' + usn + '\r\n' +
        'MAN: ssdp:discover\r\n' +
        'MX: 0'

      bus.emit('transport:incoming-message', new Buffer(message), searcher)
    })
    .catch(error => done(error))
  })

  it('should respond to global searches', done => {
    var usn = 'my-service-type'
    var searcher = {
      port: 39823,
      address: '0.0.0.0'
    }

    bus.on('transport:outgoing-message', (socket, message, remote) => {
      message = message.toString('utf8')

      if (_.startsWith(message, 'HTTP/1.1 200 OK')) {
        expect(message).to.contain('USN: ' + bus.udn + '::my-service-type')
        expect(message).to.contain('ST: my-service-type')
        expect(message).to.contain('LOCATION: http://')
        expect(remote).to.deep.equal(searcher)

        done()
      }
    })

    bus.advertise({
      usn: usn,
      details: Promise.resolve({
        root: {
          specVersion: {
            major: 1,
            minor: 0
          },
          URLBase: 'http://example.com'
        }
      })
    })
    .then(advert => {
      var message = 'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'ST: ssdp:all\r\n' +
        'MAN: ssdp:discover\r\n' +
        'MX: 0'

      bus.emit('transport:incoming-message', new Buffer(message), searcher)
    })
    .catch(error => done(error))
  })

  it('should search for services', done => {
    var usn = 'my-service-type'

    bus.on('transport:outgoing-message', (socket, message, remote) => {
      message = message.toString('utf8')

      if (_.startsWith(message, 'M-SEARCH * HTTP/1.1')) {
        expect(message).to.contain('ST: ' + usn)
        expect(message).to.contain('MAN: ssdp:discover')

        done()
      }
    })

    bus.discover(usn)
  })

  it('should search for all services', done => {
    bus.on('transport:outgoing-message', function (socket, message, remote) {
      message = message.toString('utf8')

      if (_.startsWith(message, 'M-SEARCH * HTTP/1.1')) {
        expect(message).to.contain('ST: ssdp:all')
        expect(message).to.contain('MAN: ssdp:discover')

        done()
      }
    })

    bus.discover()
  })

  it('should handle search responses', done => {
    bus.on('discover:urn:schemas-upnp-org:device:Basic:1', service => {
      expect(service.details.foo).to.equal('bar')
      done()
    })

    var message = 'HTTP/1.1 200 OK\r\n' +
      'CACHE-CONTROL: max-age=100\r\n' +
      'EXT:\r\n' +
      'ST: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
    bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
  })

  it('should handle search responses updating cached services', done => {
    var message = 'HTTP/1.1 200 OK\r\n' +
      'CACHE-CONTROL: max-age=100\r\n' +
      'EXT:\r\n' +
      'ST: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.on('discover:urn:schemas-upnp-org:device:Basic:1', service => {
      bus.on('update:uuid:2f402f80-da50-11e1-9b23-00178809ea66', service => {
        expect(service.details.foo).to.equal('bar')
        done()
      })

      // expire the detail cache
      clock.tick(1900000)

      // change the details
      details.bar = 'baz'

      bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
    })

    bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
    bus.emit('transport:incoming-message', new Buffer(message), {address: 'test', port: 'test'})
  })
})
