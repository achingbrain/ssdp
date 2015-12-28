var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('lib/advertise/create-location', function () {
  var createLocation
  var http
  var findAllInterfaces
  var freeport

  beforeEach(function () {
    http = {}
    findAllInterfaces = sinon.stub()
    freeport = sinon.stub()

    createLocation = proxyquire('../../../lib/advertise/create-location', {
      'http': http,
      './find-all-interfaces': findAllInterfaces,
      'freeport': freeport
    })
  })

  it('should create location', function (done) {
    var ssdp = {
      sockets: [{
        type: 'udp4'
      }]
    }
    var advert = {
      ipv4: true,
      ipv6: true
    }
    var ifaces = [{
      address: 'address'
    }]
    var server = {
      listen: sinon.stub().callsArgWithAsync(2),
      close: sinon.stub()
    }

    findAllInterfaces.withArgs(true, false).returns(ifaces)
    freeport.callsArgWithAsync(0, null, 'port')
    http.createServer = sinon.stub().withArgs(sinon.match.func).returns(server)

    createLocation(ssdp, advert, function (error) {
      expect(error).to.not.exist
      expect(advert.location).to.be.ok
      expect(advert.location[ssdp.sockets[0].type]).to.contain(ifaces[0].address)
      expect(advert.shutDownServers.length).to.equal(1)
      expect(advert.shutDownServers[0]).to.be.a('function')
      expect(server.close.called).to.be.false
      advert.shutDownServers[0]()
      expect(server.close.called).to.be.true

      done()
    })
  })

  it('should create ipv6 location', function (done) {
    var ssdp = {
      sockets: [{
        type: 'udp6'
      }]
    }
    var advert = {
      ipv4: true,
      ipv6: true
    }
    var ifaces = [{
      address: 'address'
    }]
    var server = {
      listen: sinon.stub().callsArgWithAsync(2),
      close: sinon.stub()
    }

    findAllInterfaces.withArgs(false, true).returns(ifaces)
    freeport.callsArgWithAsync(0, null, 'port')
    http.createServer = sinon.stub().withArgs(sinon.match.func).returns(server)

    createLocation(ssdp, advert, function (error) {
      expect(error).to.not.exist
      expect(advert.location).to.be.ok
      expect(advert.location[ssdp.sockets[0].type]).to.contain(ifaces[0].address)
      expect(advert.shutDownServers.length).to.equal(1)
      expect(advert.shutDownServers[0]).to.be.a('function')
      expect(server.close.called).to.be.false
      advert.shutDownServers[0]()
      expect(server.close.called).to.be.true

      done()
    })
  })

  it('should use existing location', function (done) {
    var advert = {
      location: 'location'
    }

    createLocation(null, advert, function (error) {
      expect(error).to.not.exist
      expect(findAllInterfaces.called).to.be.false

      done()
    })
  })

  it('should not create ipv4 location when advertising over ipv4 is disabled', function (done) {
    var ssdp = {
      sockets: [{
        type: 'udp4'
      }]
    }
    var advert = {
      ipv4: false
    }

    findAllInterfaces.withArgs(false, false).returns([])
    findAllInterfaces.withArgs(true, false).returns(['foo'])

    createLocation(ssdp, advert, function (error) {
      expect(error).to.not.exist
      expect(freeport.called).to.be.false

      done()
    })
  })

  it('should return error when finding port', function (done) {
    var ssdp = {
      sockets: [{
        type: 'udp4'
      }]
    }
    var advert = {
      ipv4: true,
      ipv6: true
    }
    var ifaces = [{
      address: 'address'
    }]
    var error = new Error('Urk!')

    findAllInterfaces.withArgs(true, false).returns(ifaces)
    freeport.callsArgWithAsync(0, error)

    createLocation(ssdp, advert, function (err) {
      expect(err).to.equal(error)

      done()
    })
  })
})
