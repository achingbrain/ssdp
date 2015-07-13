var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('lib/discover/search-response', function () {
  var searchResponse
  var resolveLocation
  var cache

  beforeEach(function () {
    resolveLocation = sinon.stub()
    cache = {
      get: sinon.stub(),
      set: sinon.stub()
    }

    searchResponse = proxyquire('../../../lib/discover/search-response', {
      '../commands/resolve-location': resolveLocation,
      '../cache': cache
    })
  })

  it('should reject invalid messages', function () {
    var message = {
      headers: {

      }
    }

    searchResponse({}, message)

    expect(resolveLocation.called).to.be.false

    message.headers.LOCATION = 'location'

    searchResponse({}, message)

    expect(resolveLocation.called).to.be.false

    message.headers.USN = 'usn'

    searchResponse({}, message)

    expect(resolveLocation.called).to.be.false
  })

  it('should emit error when resolving location fails', function () {
    var error = new Error('Urk!')
    resolveLocation.callsArgWith(1, error)
    var message = {
      headers: {
        LOCATION: 'location',
        USN: 'usn',
        ST: 'st'
      }
    }
    var ssdp = {
      emit: sinon.stub()
    }

    searchResponse(ssdp, message)

    expect(ssdp.emit.calledWith('error', error)).to.be.true
  })

  it('should emit error when caching service fails', function () {
    var error = new Error('Urk!')
    resolveLocation.callsArgWith(1, null, 'location')
    cache.set.callsArgWith(3, error)
    var message = {
      headers: {
        LOCATION: 'location',
        USN: 'usn',
        ST: 'st'
      }
    }
    var ssdp = {
      emit: sinon.stub()
    }

    searchResponse(ssdp, message)

    expect(ssdp.emit.calledWith('error', error)).to.be.true
  })

  it('should resolve location and cache service', function () {
    resolveLocation.callsArgWith(1, null, 'location')
    cache.set.callsArg(3)
    var message = {
      headers: {
        LOCATION: 'location',
        USN: 'usn',
        ST: 'st'
      }
    }
    var ssdp = {
      emit: sinon.stub()
    }

    searchResponse(ssdp, message)

    expect(ssdp.emit.calledWith('st')).to.be.true
  })
})
