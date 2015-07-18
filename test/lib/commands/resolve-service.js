var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('lib/commands/resolve-service', function () {
  var resolveService
  var resolveLocation
  var cache

  beforeEach(function () {
    resolveLocation = sinon.stub()
    cache = {}

    resolveService = proxyquire('../../../lib/commands/resolve-service', {
      './resolve-location': resolveLocation,
      '../cache': cache
    })
  })

  it('should ignore invalid arguments', function () {
    resolveService(null)

    expect(Object.keys(cache)).to.be.empty
  })

  it('should ignore non-expired advert', function () {
    var service = {
      expires: Date.now() + 10
    }

    cache['st'] = {
      usn: service
    }

    resolveService({}, 'usn', 'st', 'location', 'ttl')

    expect(cache['st']['usn']).to.equal(service)
  })

  it('should emit error when resolving location fails', function () {
    var error = new Error('Urk!')
    resolveLocation.callsArgWith(1, error)

    var ssdp = {
      emit: sinon.stub()
    }

    resolveService(ssdp, 'usn', 'st', 'location', 'ttl')

    expect(ssdp.emit.calledWith('error', error)).to.be.true
  })

  it('should should not emit update when device details have not changed', function () {
    resolveLocation.withArgs('location').callsArgWith(1, null, 'details')

    var ssdp = {
      emit: sinon.stub()
    }

    resolveService(ssdp, 'usn', 'st', 'location', -1)

    expect(ssdp.emit.calledWith('discover:st')).to.be.true

    resolveService(ssdp, 'usn', 'st', 'location', -1)

    expect(ssdp.emit.calledWith('update:usn')).to.be.false
  })

  it('should should emit update when device details have changed', function () {
    resolveLocation.withArgs('location').onFirstCall().callsArgWith(1, null, 'details')
    resolveLocation.withArgs('location').onSecondCall().callsArgWith(1, null, 'details2')

    var ssdp = {
      emit: sinon.stub()
    }

    resolveService(ssdp, 'usn', 'st', 'location', -1)

    expect(ssdp.emit.calledWith('discover:st')).to.be.true

    resolveService(ssdp, 'usn', 'st', 'location', -1)

    expect(ssdp.emit.calledWith('update:usn')).to.be.true
  })
})
