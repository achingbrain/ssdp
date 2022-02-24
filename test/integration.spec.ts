import sinon from 'sinon'
import { expect } from 'aegir/utils/chai.js'
import ssdp, { SSDP, SSDPSocket } from '../src/index.js'
import { freeport } from 'freeport-promise'
import http from 'http'
import xml2js from 'xml2js'
import { cache } from '../src/cache.js'
import { adverts } from '../src/adverts.js'
import defer from 'p-defer'
import first from 'it-first'

describe('ssdp', () => {
  let bus: SSDP
  let detailsServer: http.Server
  let details: Record<string, any>
  let detailsLocation: string
  let clock: sinon.SinonFakeTimers

  beforeEach(async () => {
    clock = sinon.useFakeTimers(new Date())
    details = {
      foo: 'bar'
    }

    const busPort = await freeport()
    bus = await ssdp({
      sockets: [{
        type: 'udp4',
        maxHops: 4,
        broadcast: {
          address: '0.0.0.0',
          port: busPort
        },
        bind: {
          address: '0.0.0.0',
          port: busPort
        }
      }]
    })

    const detailsPort = await freeport()
    detailsLocation = `http://localhost:${detailsPort}`
    detailsServer = http.createServer(function (request, response) {
      const builder = new xml2js.Builder()
      const xml = builder.buildObject(details)

      response.writeHead(200, { 'Content-Type': 'text/xml' })
      response.end(xml)
    })

    const deferred = defer()

    detailsServer.listen(detailsPort, () => {
      deferred.resolve()
    })

    await deferred.promise
  })

  afterEach(async () => {
    clock.restore()

    await Promise.all([
      bus.stop(),
      detailsServer.close()
    ])

    adverts.clear()
    cache.clear()
  })

  it('should discover a service once', done => {
    bus.on('service:discover', service => {
      expect(service).to.have.property('ST', 'urn:schemas-upnp-org:device:Basic:1')
      expect(service.details.foo).to.equal('bar')
      done()
    })

    const message = 'NOTIFY * HTTP/1.1\r\n' +
      'HOST: 239.255.255.250:1900\r\n' +
      'NT: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'NTS: ssdp:alive\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'CACHE-CONTROL: max-age=1800\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
  })

  it('should update a service', done => {
    bus.on('service:discover', discoveredService => {
      bus.on('service:update', updatedService => {
        expect(updatedService).to.have.property('UDN', discoveredService.UDN)
        expect(updatedService).to.have.nested.property('details.bar', 'baz')
        done()
      })

      // expire the detail cache
      clock.tick(1900000)

      // change the details
      details.bar = 'baz'

      bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
    })

    var message = 'NOTIFY * HTTP/1.1\r\n' +
      'HOST: 239.255.255.250:1900\r\n' +
      'NT: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'NTS: ssdp:alive\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'CACHE-CONTROL: max-age=1800\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
  })

  it('should advertise a service', done => {
    const usn = 'my-service-type'
    let didByeBye = false

    const listener = (socket: SSDPSocket, buffer: Buffer) => {
      const message = buffer.toString('utf8')

      if (!didByeBye) {
        expect(message).to.contain('NT: ' + usn)
        expect(message).to.contain('NTS: ssdp:byebye')
        didByeBye = true
      } else {
        expect(message).to.contain('NT: ' + usn)
        expect(message).to.contain('NTS: ssdp:alive')
        bus.off('transport:outgoing-message', listener)

        done()
      }
    }

    bus.on('transport:outgoing-message', listener)

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
    const usn = 'my-service-type'
    const searcher = {
      port: 39823,
      address: '0.0.0.0'
    }

    bus.on('transport:outgoing-message', (socket, buffer, remote) => {
      const message = buffer.toString('utf8')

      if (message.startsWith('HTTP/1.1 200 OK')) {
        expect(message).to.contain('USN: ' + bus.udn + '::my-service-type')
        expect(message).to.contain('ST: my-service-type')
        expect(message).to.contain('LOCATION: http://')
        expect(remote).to.deep.equal(searcher)

        done()
      }
    })

    bus.advertise({
      usn: usn,
      details: function () {
        return {
          root: {
            specVersion: {
              major: 1,
              minor: 0
            },
            URLBase: 'http://example.com'
          }
        }
      }
    })
      .then(() => {
        const message = 'M-SEARCH * HTTP/1.1\r\n' +
          'HOST: 239.255.255.250:1900\r\n' +
          'ST: ' + usn + '\r\n' +
          'MAN: ssdp:discover\r\n' +
          'MX: 0'

        bus.emit('transport:incoming-message', Buffer.from(message), searcher)
      })
      .catch(error => done(error))
  })

  it('should respond to global searches', done => {
    const usn = 'my-service-type'
    const searcher = {
      port: 39823,
      address: '0.0.0.0'
    }

    bus.on('transport:outgoing-message', (socket, buffer, remote) => {
      const message = buffer.toString('utf8')

      if (message.startsWith('HTTP/1.1 200 OK')) {
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
        const message = 'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'ST: ssdp:all\r\n' +
        'MAN: ssdp:discover\r\n' +
        'MX: 0'

        bus.emit('transport:incoming-message', Buffer.from(message), searcher)
      })
      .catch(error => done(error))
  })

  it('should search for services', done => {
    const usn = 'my-service-type'

    bus.on('transport:outgoing-message', (socket, buffer, remote) => {
      const message = buffer.toString('utf8')

      if (message.startsWith('M-SEARCH * HTTP/1.1')) {
        expect(message).to.contain('ST: ' + usn)
        expect(message).to.contain('MAN: ssdp:discover')

        done()
      }
    })

    void first(bus.discover(usn))
  })

  it('should search for all services', done => {
    bus.on('transport:outgoing-message', function (socket, buffer, remote) {
      const message = buffer.toString('utf8')

      if (message.startsWith('M-SEARCH * HTTP/1.1')) {
        expect(message).to.contain('ST: ssdp:all')
        expect(message).to.contain('MAN: ssdp:discover')

        done()
      }
    })

    void first(bus.discover())
  })

  it('should handle search responses', done => {
    bus.on('service:discover', service => {
      expect(service).to.have.property('ST', 'urn:schemas-upnp-org:device:Basic:1')
      expect(service).to.have.nested.property('details.foo', 'bar')
      done()
    })

    const message = 'HTTP/1.1 200 OK\r\n' +
      'CACHE-CONTROL: max-age=100\r\n' +
      'EXT:\r\n' +
      'ST: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
  })

  it('should handle search responses updating cached services', done => {
    const message = 'HTTP/1.1 200 OK\r\n' +
      'CACHE-CONTROL: max-age=100\r\n' +
      'EXT:\r\n' +
      'ST: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.on('service:discover', service => {
      expect(service).to.have.property('ST', 'urn:schemas-upnp-org:device:Basic:1')
      expect(service).to.have.property('UDN', 'uuid:2f402f80-da50-11e1-9b23-00178809ea66')

      bus.on('service:update', service => {
        expect(service).to.have.property('UDN', 'uuid:2f402f80-da50-11e1-9b23-00178809ea66')
        expect(service).to.have.property('ST', 'urn:schemas-upnp-org:device:Basic:1')
        expect(service).to.have.nested.property('details.foo', 'bar')

        done()
      })

      // expire the detail cache
      clock.tick(1900000)

      // change the details
      details.bar = 'baz'

      bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
    })

    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
  })
})
