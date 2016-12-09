'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const sinon = require('sinon')
const expect = require('chai').expect
const proxyquire = require('proxyquire')

describe('lib/commands/resolve-service', () => {
  let resolveService
  let resolveLocation
  let cache

  beforeEach(() => {
    resolveLocation = sinon.stub()
    cache = {}

    resolveService = proxyquire('../../../lib/commands/resolve-service', {
      './resolve-location': resolveLocation,
      '../cache': cache
    })
  })

  it('should ignore invalid arguments', () => {
    resolveService(null)

    expect(Object.keys(cache)).to.be.empty
  })

  it('should ignore non-expired advert', () => {
    const service = {
      expires: Date.now() + 10
    }

    cache['st'] = {
      usn: service
    }

    resolveService({}, 'usn', 'st', 'location', 'ttl')

    expect(cache['st']['usn']).to.equal(service)
  })

  it('should emit error when resolving location fails', done => {
    const error = new Error('Urk!')
    resolveLocation.returns(Promise.reject(error))

    const ssdp = {
      emit: (event, arg) => {
        expect(event).to.equal('error')
        expect(arg).to.equal(error)

        done()
      }
    }

    resolveService(ssdp, 'usn', 'st', 'location', 'ttl')
  })

  it('should should not emit update when device details have not changed', done => {
    resolveLocation.withArgs('location').onFirstCall().returns(Promise.resolve('details'))
    resolveLocation.withArgs('location').onSecondCall().returns(Promise.resolve('details'))

    const ssdp = {
      emit: sinon.stub()
    }

    resolveService(ssdp, 'usn', 'st', 'location', -1)

    setTimeout(() => {
      resolveService(ssdp, 'usn', 'st', 'location', -1)
    }, 100)

    setTimeout(() => {
      expect(resolveLocation.callCount).to.equal(2)
      expect(ssdp.emit.callCount).to.equal(1)
      expect(ssdp.emit.getCall(0).args[0]).to.equal('discover:st')

      done()
    }, 500)
  })

  it('should should emit update when device details have changed', done => {
    resolveLocation.withArgs('location').onFirstCall().returns(Promise.resolve('details'))
    resolveLocation.withArgs('location').onSecondCall().returns(Promise.resolve('details2'))

    const ssdp = {
      emit: sinon.stub()
    }

    resolveService(ssdp, 'usn', 'st', 'location', -1)

    setTimeout(() => {
      resolveService(ssdp, 'usn', 'st', 'location', -1)
    }, 100)

    setTimeout(() => {
      expect(resolveLocation.callCount).to.equal(2)
      expect(ssdp.emit.callCount).to.equal(2)
      expect(ssdp.emit.getCall(0).args[0]).to.equal('discover:st')
      expect(ssdp.emit.getCall(1).args[0]).to.equal('update:usn')

      done()
    }, 500)
  })
})
