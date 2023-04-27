import http from 'http'
import { expect } from 'aegir/chai'
import { freeport } from 'freeport-promise'
import first from 'it-first'
import defer from 'p-defer'
import sinon from 'sinon'
import xml2js from 'xml2js'
import { adverts } from '../src/adverts.js'
import { cache } from '../src/cache.js'
import ssdp, { type NetworkAddress, type Service, type SSDP, type SSDPSocket } from '../src/index.js'

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

  it('should discover a service once', async () => {
    const deferred = defer<Service<Record<string, any>>>()

    bus.on('service:discover', service => {
      deferred.resolve(service)
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

    const service = await deferred.promise
    expect(service).to.have.property('serviceType', 'urn:schemas-upnp-org:device:Basic:1')
    expect(service.details.foo).to.equal('bar')
  })

  it('should update a service', async () => {
    const deferred = defer<{
      discoveredService: Service<Record<string, any>>
      updatedService: Service<Record<string, any>>
    }>()

    bus.on('service:discover', discoveredService => {
      bus.on('service:update', updatedService => {
        deferred.resolve({
          discoveredService,
          updatedService
        })
      })

      // expire the detail cache
      clock.tick(1900000)

      // change the details
      details.bar = 'baz'

      bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
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

    const { discoveredService, updatedService } = await deferred.promise
    expect(updatedService).to.have.property('uniqueServiceName', discoveredService.uniqueServiceName)
    expect(updatedService).to.have.nested.property('details.bar', 'baz')
  })

  it('should advertise a service', async () => {
    const usn = 'my-service-type'
    let didByeBye = false
    const deferredBeforeByeBye = defer<string>()
    const deferredAfterByeBye = defer<string>()

    const listener = (socket: SSDPSocket, buffer: Buffer): void => {
      const message = buffer.toString('utf8')

      if (!didByeBye) {
        deferredBeforeByeBye.resolve(message)
        didByeBye = true
      } else {
        deferredAfterByeBye.resolve(message)
        bus.off('transport:outgoing-message', listener)
      }
    }

    bus.on('transport:outgoing-message', listener)

    await bus.advertise({
      usn,
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

    const firstMessage = await deferredBeforeByeBye.promise
    expect(firstMessage).to.contain('NT: ' + usn)
    expect(firstMessage).to.contain('NTS: ssdp:byebye')

    const secondMessage = await deferredAfterByeBye.promise
    expect(secondMessage).to.contain('NT: ' + usn)
    expect(secondMessage).to.contain('NTS: ssdp:alive')
  })

  it('should respond to searches for an advertised service', async () => {
    const usn = 'my-service-type'
    const searcher = {
      port: 39823,
      address: '0.0.0.0'
    }
    const deferred = defer<{
      message: string
      remote: NetworkAddress
    }>()

    bus.on('transport:outgoing-message', (socket, buffer, remote) => {
      const message = buffer.toString('utf8')

      if (message.startsWith('HTTP/1.1 200 OK')) {
        deferred.resolve({ message, remote })
      }
    })

    await bus.advertise({
      usn,
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

    const searchMessage = 'M-SEARCH * HTTP/1.1\r\n' +
      'HOST: 239.255.255.250:1900\r\n' +
      'ST: ' + usn + '\r\n' +
      'MAN: ssdp:discover\r\n' +
      'MX: 0'

    bus.emit('transport:incoming-message', Buffer.from(searchMessage), searcher)

    const { message, remote } = await deferred.promise
    expect(message).to.contain('USN: ' + bus.udn + '::my-service-type')
    expect(message).to.contain('ST: my-service-type')
    expect(message).to.contain('LOCATION: http://')
    expect(remote).to.deep.equal(searcher)
  })

  it('should respond to global searches', async () => {
    const usn = 'my-service-type'
    const searcher = {
      port: 39823,
      address: '0.0.0.0'
    }
    const deferred = defer<{
      message: string
      remote: NetworkAddress
    }>()

    bus.on('transport:outgoing-message', (socket, buffer, remote) => {
      const message = buffer.toString('utf8')

      if (message.startsWith('HTTP/1.1 200 OK')) {
        deferred.resolve({ message, remote })
      }
    })

    await bus.advertise({
      usn,
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

    const searchMessage = 'M-SEARCH * HTTP/1.1\r\n' +
    'HOST: 239.255.255.250:1900\r\n' +
    'ST: ssdp:all\r\n' +
    'MAN: ssdp:discover\r\n' +
    'MX: 0'

    bus.emit('transport:incoming-message', Buffer.from(searchMessage), searcher)

    const { message, remote } = await deferred.promise
    expect(message).to.contain('USN: ' + bus.udn + '::my-service-type')
    expect(message).to.contain('ST: my-service-type')
    expect(message).to.contain('LOCATION: http://')
    expect(remote).to.deep.equal(searcher)
  })

  it('should search for services', async () => {
    const usn = 'my-service-type'
    const deferred = defer<string>()

    bus.on('transport:outgoing-message', (socket, buffer, remote) => {
      const message = buffer.toString('utf8')

      if (message.startsWith('M-SEARCH * HTTP/1.1')) {
        deferred.resolve(message)
      }
    })

    void first(bus.discover(usn))

    const message = await deferred.promise
    expect(message).to.contain('ST: ' + usn)
    expect(message).to.contain('MAN: ssdp:discover')
  })

  it('should search for all services', async () => {
    const deferred = defer<string>()

    bus.on('transport:outgoing-message', function (socket, buffer, remote) {
      const message = buffer.toString('utf8')

      if (message.startsWith('M-SEARCH * HTTP/1.1')) {
        deferred.resolve(message)
      }
    })

    void first(bus.discover())

    const message = await deferred.promise
    expect(message).to.contain('ST: ssdp:all')
    expect(message).to.contain('MAN: ssdp:discover')
  })

  it('should handle search responses', async () => {
    const deferred = defer<Service<Record<string, any>>>()

    bus.on('service:discover', service => {
      deferred.resolve(service)
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

    const service = await deferred.promise
    expect(service).to.have.property('serviceType', 'urn:schemas-upnp-org:device:Basic:1')
    expect(service).to.have.nested.property('details.foo', 'bar')
  })

  it('should handle search responses updating cached services', async () => {
    const deferred = defer<{
      discoveredService: Service<Record<string, any>>
      updatedService: Service<Record<string, any>>
    }>()

    const message = 'HTTP/1.1 200 OK\r\n' +
      'CACHE-CONTROL: max-age=100\r\n' +
      'EXT:\r\n' +
      'ST: urn:schemas-upnp-org:device:Basic:1\r\n' +
      'USN: uuid:2f402f80-da50-11e1-9b23-00178809ea66\r\n' +
      'SERVER: node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/0.0.1\r\n' +
      'LOCATION: ' + detailsLocation

    bus.on('service:discover', discoveredService => {
      bus.on('service:update', updatedService => {
        deferred.resolve({ discoveredService, updatedService })
      })

      // expire the detail cache
      clock.tick(1900000)

      // change the details
      details.bar = 'baz'

      bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
    })

    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })
    bus.emit('transport:incoming-message', Buffer.from(message), { address: 'test', port: 0 })

    const { discoveredService, updatedService } = await deferred.promise
    expect(discoveredService).to.have.property('serviceType', 'urn:schemas-upnp-org:device:Basic:1')
    expect(discoveredService).to.have.property('uniqueServiceName', 'uuid:2f402f80-da50-11e1-9b23-00178809ea66')
    expect(updatedService).to.have.property('serviceType', 'urn:schemas-upnp-org:device:Basic:1')
    expect(updatedService).to.have.property('uniqueServiceName', 'uuid:2f402f80-da50-11e1-9b23-00178809ea66')
    expect(updatedService).to.have.nested.property('details.foo', 'bar')
  })
})
