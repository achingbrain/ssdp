'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const expect = require('chai').expect
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('lib/advertise/create-location', () => {
  let createLocation
  let http
  let findAllInterfaces
  let freeport

  beforeEach(() => {
    http = {}
    findAllInterfaces = sinon.stub()
    freeport = sinon.stub()

    createLocation = proxyquire('../../../lib/advertise/create-location', {
      'http': http,
      './find-all-interfaces': findAllInterfaces,
      'freeport-promise': freeport
    })
  })

  it('should create location', () => {
    const ssdp = {
      sockets: [{
        type: 'udp4'
      }]
    }
    const advert = {
      ipv4: true,
      ipv6: true
    }
    const ifaces = [{
      address: 'address'
    }]
    const server = {
      listen: sinon.stub().callsArgWithAsync(2),
      close: sinon.stub()
    }

    findAllInterfaces.withArgs(true, false).returns(ifaces)
    freeport.returns(Promise.resolve('port'))
    http.createServer = sinon.stub().withArgs(sinon.match.func).returns(server)

    return createLocation(ssdp, advert)
    .then(() => {
      expect(advert.location).to.be.ok
      expect(advert.location[ssdp.sockets[0].type]).to.contain(ifaces[0].address)
      expect(advert.shutDownServers).to.be.a('function')
      expect(server.close.called).to.be.false

      return Promise.all(advert.shutDownServers())
      .then(() => {
        expect(server.close.called).to.be.true
      })
    })
  })

  it('should create ipv6 location', () => {
    const ssdp = {
      sockets: [{
        type: 'udp6'
      }]
    }
    const advert = {
      ipv4: true,
      ipv6: true
    }
    const ifaces = [{
      address: 'address'
    }]
    const server = {
      listen: sinon.stub().callsArgWithAsync(2),
      close: sinon.stub()
    }

    findAllInterfaces.withArgs(false, true).returns(ifaces)
    freeport.returns(Promise.resolve('port'))
    http.createServer = sinon.stub().withArgs(sinon.match.func).returns(server)

    return createLocation(ssdp, advert)
    .then(() => {
      expect(advert.location).to.be.ok
      expect(advert.location[ssdp.sockets[0].type]).to.contain(ifaces[0].address)
      expect(advert.shutDownServers).to.be.a('function')
      expect(server.close.called).to.be.false

      return Promise.all(advert.shutDownServers())
      .then(() => {
        expect(server.close.called).to.be.true
      })
    })
  })

  it('should use existing location', () => {
    const advert = {
      location: 'location'
    }

    return createLocation(null, advert)
    .then(() => {
      expect(findAllInterfaces.called).to.be.false
    })
  })

  it('should not create ipv4 location when advertising over ipv4 is disabled', () => {
    const ssdp = {
      sockets: [{
        type: 'udp4'
      }]
    }
    const advert = {
      ipv4: false
    }

    findAllInterfaces.withArgs(false, false).returns([])
    findAllInterfaces.withArgs(true, false).returns(['foo'])

    return createLocation(ssdp, advert)
    .then(() => {
      expect(freeport.called).to.be.false
    })
  })

  it('should return error when finding port', () => {
    const ssdp = {
      sockets: [{
        type: 'udp4'
      }]
    }
    const advert = {
      ipv4: true,
      ipv6: true
    }
    const ifaces = [{
      address: 'address'
    }]
    const error = new Error('Urk!')

    findAllInterfaces.withArgs(true, false).returns(ifaces)
    freeport.returns(Promise.reject(error))

    return createLocation(ssdp, advert)
    .catch(err => expect(err).to.equal(error))
  })

  it('should emit an error when opening a server fails', () => {
    const error = new Error('Urk!')
    const ssdp = {
      sockets: [{
        type: 'udp4'
      }]
    }
    const advert = {
      ipv4: true,
      ipv6: true
    }
    const ifaces = [{
      address: 'address'
    }]
    const server = {
      listen: sinon.stub().callsArgWithAsync(2, error)
    }

    findAllInterfaces.withArgs(true, false).returns(ifaces)
    freeport.returns(Promise.resolve('port'))
    http.createServer = sinon.stub().withArgs(sinon.match.func).returns(server)

    return createLocation(ssdp, advert)
    .catch(err => {
      expect(err).to.equal(error)
    })
  })
})
