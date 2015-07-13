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
      '../find-all-interfaces': findAllInterfaces,
      'freeport': freeport
    })
  })

  it('should create location', function (done) {
    var shutDownServers = []
    var options = {}
    var socket = {
      type: 'udp4'
    }
    var headers = {}
    var iface = {
      address: 'address'
    }
    var server = {
      listen: sinon.stub().callsArgWithAsync(2),
      close: sinon.stub()
    }

    findAllInterfaces.withArgs(true, false).returns([iface])
    freeport.callsArgWithAsync(0, null, 'port')
    http.createServer = sinon.stub().withArgs(sinon.match.func).returns(server)

    createLocation(shutDownServers, options, socket, headers, function (error) {
      expect(error).to.not.exist
      expect(options.location).to.be.ok
      expect(options.location).to.contain(iface.address)
      expect(shutDownServers.length).to.equal(1)
      expect(shutDownServers[0]).to.be.a('function')
      expect(server.close.called).to.be.false
      shutDownServers[0]()
      expect(server.close.called).to.be.true

      done()
    })
  })

  it('should create ipv6 location', function (done) {
    var shutDownServers = []
    var options = {}
    var socket = {
      type: 'udp6'
    }
    var headers = {}
    var iface = {
      address: 'address'
    }
    var server = {
      listen: sinon.stub().callsArgWithAsync(2)
    }

    findAllInterfaces.withArgs(false, true).returns([iface])
    freeport.callsArgWithAsync(0, null, 'port')
    http.createServer = sinon.stub().withArgs(sinon.match.func).returns(server)

    createLocation(shutDownServers, options, socket, headers, function (error) {
      expect(error).to.not.exist
      expect(options.location).to.be.ok
      expect(options.location).to.contain('[' + iface.address + ']')
      expect(shutDownServers.length).to.equal(1)
      expect(shutDownServers[0]).to.be.a('function')

      done()
    })
  })

  it('should use existing location', function (done) {
    var options = {
      location: 'location'
    }
    var headers = {

    }

    createLocation(null, options, null, headers, function (error) {
      expect(error).to.not.exist
      expect(headers.LOCATION).to.equal(options.location)
      expect(findAllInterfaces.called).to.be.false

      done()
    })
  })

  it('should return error when finding port', function (done) {
    var shutDownServers = []
    var options = {}
    var socket = {
      type: 'udp4'
    }
    var headers = {}
    var iface = {
      address: 'address'
    }
    var error = new Error('Urk!')

    findAllInterfaces.withArgs(true, false).returns([iface])
    freeport.callsArgWithAsync(0, error)

    createLocation(shutDownServers, options, socket, headers, function (err) {
      expect(err).to.equal(error)

      done()
    })
  })
})
