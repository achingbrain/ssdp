var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('lib/commands/notify', function () {
  var notify
  var resolveLocation
  var cache

  beforeEach(function () {
    resolveLocation = sinon.stub()
    cache = {
      get: sinon.stub(),
      set: sinon.stub()
    }

    notify = proxyquire('../../../lib/commands/notify', {
      './resolve-location': resolveLocation,
      '../cache': cache
    })
  })

  it('should reject invalid messages', function () {
    var message = {
      headers: {

      }
    }

    notify({}, message)

    expect(resolveLocation.called).to.be.false

    message.headers.LOCATION = 'location'

    notify({}, message)

    expect(resolveLocation.called).to.be.false

    message.headers.USN = 'usn'

    notify({}, message)

    expect(resolveLocation.called).to.be.false

    message.headers.NT = 'ns'

    notify({}, message)

    expect(resolveLocation.called).to.be.false
  })

  it('should cache service', function () {
    var ssdp = {
      emit: sinon.stub()
    }
    var message = {
      headers: {
        LOCATION: 'location',
        USN: 'usn',
        NT: 'nt',
        NTS: 'nts'
      }
    }
    var location = 'location'

    resolveLocation.callsArgWith(1, null, location)
    cache.set.callsArg(3)

    notify(ssdp, message)

    expect(ssdp.emit.calledWith(message.headers.NT)).to.be.true
  })

  it('should emit error when resolving location', function () {
    var ssdp = {
      emit: sinon.stub()
    }
    var message = {
      headers: {
        LOCATION: 'location',
        USN: 'usn',
        NT: 'nt',
        NTS: 'nts'
      }
    }
    var error = new Error('Urk!')

    resolveLocation.callsArgWith(1, error)

    notify(ssdp, message)

    expect(ssdp.emit.calledWith('error', error)).to.be.true
  })

  it('should emit error when caching service', function () {
    var ssdp = {
      emit: sinon.stub()
    }
    var message = {
      headers: {
        LOCATION: 'location',
        USN: 'usn',
        NT: 'nt',
        NTS: 'nts'
      }
    }
    var location = 'location'
    var error = new Error('Urk!')

    resolveLocation.callsArgWith(1, null, location)
    cache.set.callsArgWith(3, error)

    notify(ssdp, message)

    expect(ssdp.emit.calledWith('error', error)).to.be.true
  })

  it('should not resolve location for service that is going away', function () {
    var ssdp = {
      emit: sinon.stub()
    }
    var message = {
      headers: {
        LOCATION: 'location',
        USN: 'usn',
        NT: 'nt',
        NTS: 'ssdp:byebye'
      }
    }
    var location = 'location'

    resolveLocation.callsArgWith(1, null, location)
    cache.set.callsArg(3)

    notify(ssdp, message)

    expect(ssdp.emit.calledWith(message.headers.NTS)).to.be.true
    expect(resolveLocation.called).to.be.false
  })
})
