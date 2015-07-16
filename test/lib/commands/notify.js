var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('lib/commands/notify', function () {
  var notify
  var resolveService
  var cache

  beforeEach(function () {
    cache = {}
    resolveService = sinon.stub()

    notify = proxyquire('../../../lib/commands/notify', {
      './resolve-service': resolveService,
      '../cache': cache
    })
  })

  it('should reject invalid messages', function () {
    var message = {
      headers: {

      }
    }

    notify({}, message)

    expect(resolveService.called).to.be.false

    message.headers.LOCATION = 'location'

    notify({}, message)

    expect(resolveService.called).to.be.false

    message.headers.USN = 'usn'

    notify({}, message)

    expect(resolveService.called).to.be.false

    message.headers.NT = 'ns'

    notify({}, message)

    expect(resolveService.called).to.be.false
  })

  it('should cache service', function () {
    var ssdp = {
      emit: sinon.stub()
    }
    var message = {
      LOCATION: 'location',
      USN: 'usn',
      NT: 'nt',
      NTS: 'nts',
      ttl: sinon.stub().returns(1000)
    }
    var remote = {}

    notify(ssdp, message, remote)

    expect(resolveService.calledOnce).to.be.true
  })

  it('should remove service from cache', function () {
    var ssdp = {
      emit: sinon.stub()
    }
    var message = {
      LOCATION: 'location',
      USN: 'usn',
      NT: 'nt',
      NTS: 'ssdp:byebye',
      ttl: sinon.stub().returns(1000)
    }
    var remote = {}

    cache['nt'] = {
      'usn': {}
    }

    notify(ssdp, message, remote)

    expect(cache['nt']['usn']).to.not.exist
    expect(ssdp.emit.calledWith('remove:usn')).to.be.true
  })

  it('should survice removing non-existent service from cache', function () {
    var ssdp = {
      emit: sinon.stub()
    }
    var message = {
      LOCATION: 'location',
      USN: 'usn',
      NT: 'nt',
      NTS: 'ssdp:byebye',
      ttl: sinon.stub().returns(1000)
    }
    var remote = {}

    notify(ssdp, message, remote)

    expect(ssdp.emit.calledWith('remove:usn')).to.be.true
  })
})
