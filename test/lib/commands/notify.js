'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const sinon = require('sinon')
const expect = require('chai').expect
const proxyquire = require('proxyquire')

describe('lib/commands/notify', () => {
  let notify
  let resolveService
  let cache

  beforeEach(() => {
    cache = {}
    resolveService = sinon.stub()

    notify = proxyquire('../../../lib/commands/notify', {
      './resolve-service': resolveService,
      '../cache': cache
    })
  })

  it('should reject invalid messages', () => {
    const message = {
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

  it('should cache service', () => {
    const ssdp = {
      emit: sinon.stub()
    }
    const message = {
      LOCATION: 'location',
      USN: 'usn',
      NT: 'nt',
      NTS: 'nts',
      ttl: sinon.stub().returns(1000)
    }
    const remote = {}

    notify(ssdp, message, remote)

    expect(resolveService.calledOnce).to.be.true
  })

  it('should remove service from cache', () => {
    const ssdp = {
      emit: sinon.stub()
    }
    const message = {
      LOCATION: 'location',
      USN: 'usn',
      NT: 'nt',
      NTS: 'ssdp:byebye',
      ttl: sinon.stub().returns(1000)
    }
    const remote = {}

    cache['nt'] = {
      'usn': {}
    }

    notify(ssdp, message, remote)

    expect(cache['nt']['usn']).to.not.exist
    expect(ssdp.emit.calledWith('remove:usn')).to.be.true
  })

  it('should survice removing non-existent service from cache', () => {
    const ssdp = {
      emit: sinon.stub()
    }
    const message = {
      LOCATION: 'location',
      USN: 'usn',
      NT: 'nt',
      NTS: 'ssdp:byebye',
      ttl: sinon.stub().returns(1000)
    }
    const remote = {}

    notify(ssdp, message, remote)

    expect(ssdp.emit.calledWith('remove:usn')).to.be.true
  })
})
