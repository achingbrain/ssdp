var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var sinon = require('sinon')
var expect = require('chai').expect
var ssdp = require('../')
var freeport = require('freeport')
var http = require('http')
var async = require('async')
var xml2js = require('xml2js')
var cache = require('../lib/cache')
var adverts = require('../lib/adverts')
var _ = require('lodash')

describe('ssdp', function () {
  var bus
  var detailsServer
  var details
  var detailsLocation
  var clock

  beforeEach(function (done) {
    clock = sinon.useFakeTimers()
    details = {
      foo: 'bar'
    }

    async.parallel([
      function (callback) {
        freeport(function (error, port) {
          if (error) {
            return callback(error)
          }

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
          bus.on('ready', function () {
            callback()
          })
        })
      },
      function (callback) {
        freeport(function (error, port) {
          if (error) {
            return done(error)
          }

          detailsLocation = 'http://localhost:' + port

          detailsServer = http.createServer(function (request, response) {
            var builder = new xml2js.Builder()
            var xml = builder.buildObject(details)

            response.writeHead(200, {'Content-Type': 'text/xml'})
            response.end(xml)
          })
          detailsServer.listen(port, callback)
        })
      }
    ], done)
  })

  afterEach(function (done) {
    clock.restore()

    async.parallel([
      bus.stop.bind(bus),
      detailsServer.close.bind(detailsServer),
      function (next) {
        adverts.splice(0, adverts.length)
        for (var key in cache) {
          delete cache[key]
        }
        next()
      }
    ], done)
  })

  it('should discover a service once', function (done) {
    bus.on('discover:urn:schemas-upnp-org:device:Basic:1', function (service) {
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

  it('should update a service', function (done) {
    bus.on('discover:urn:schemas-upnp-org:device:Basic:1', function (service) {
      bus.on('update:uuid:2f402f80-da50-11e1-9b23-00178809ea66', function (service) {
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

  it('should advertise a service', function (done) {
    var usn = 'my-service-type'

    var didByeBye

    bus.on('transport:outgoing-message', function (socket, message, recpient) {
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
    }, function (error, advert) {
      expect(error).to.not.exist
    })
  })

  it('should respond to searches for an advertised service', function (done) {
    var usn = 'my-service-type'
    var searcher = {
      port: 39823,
      address: '0.0.0.0'
    }

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
    }, function (error, advert) {
      expect(error).to.not.exist

      var message = 'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'ST: ' + usn + '\r\n' +
        'MAN: ssdp:discover\r\n' +
        'MX: 0'

      bus.on('transport:outgoing-message', function (socket, message, remote) {
        message = message.toString('utf8')

        if (_.startsWith(message, 'HTTP/1.1 200 OK')) {
          expect(message).to.contain('USN: ' + bus.udn + '::my-service-type')
          expect(message).to.contain('ST: my-service-type')
          expect(message).to.contain('LOCATION: http://')
          expect(remote).to.deep.equal(searcher)

          done()
        }
      })

      bus.emit('transport:incoming-message', new Buffer(message), searcher)
    })
  })

  it('should respond to global searches', function (done) {
    var usn = 'my-service-type'
    var searcher = {
      port: 39823,
      address: '0.0.0.0'
    }

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
    }, function (error, advert) {
      expect(error).to.not.exist

      var message = 'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'ST: ssdp:all\r\n' +
        'MAN: ssdp:discover\r\n' +
        'MX: 0'

      bus.on('transport:outgoing-message', function (socket, message, remote) {
        message = message.toString('utf8')

        if (_.startsWith(message, 'HTTP/1.1 200 OK')) {
          expect(message).to.contain('USN: ' + bus.udn + '::my-service-type')
          expect(message).to.contain('ST: my-service-type')
          expect(message).to.contain('LOCATION: http://')
          expect(remote).to.deep.equal(searcher)

          done()
        }
      })

      bus.emit('transport:incoming-message', new Buffer(message), searcher)
    })
  })

  it('should search for services', function (done) {
    var usn = 'my-service-type'

    bus.on('transport:outgoing-message', function (socket, message, remote) {
      message = message.toString('utf8')

      if (_.startsWith(message, 'M-SEARCH * HTTP/1.1')) {
        expect(message).to.contain('ST: ' + usn)
        expect(message).to.contain('MAN: ssdp:discover')

        done()
      }
    })

    bus.discover(usn)
  })

  it('should search for all services', function (done) {
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

  it('should handle search responses', function (done) {
    bus.on('discover:urn:schemas-upnp-org:device:Basic:1', function (service) {
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

  it('should handle search responses updating cached services', function (done) {
    var message = 'HTTP/1.1 200 OK\r\n' +
      'CACHE-CONTROL: max-age=100\r\n' +
      'EXT:\r\n' +
      'ST: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.on('discover:urn:schemas-upnp-org:device:Basic:1', function (service) {
      bus.on('update:uuid:2f402f80-da50-11e1-9b23-00178809ea66', function (service) {
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
