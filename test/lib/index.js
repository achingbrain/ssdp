'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const expect = require('chai').expect
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('lib', () => {
  let ssdp
  let createSockets
  let discover
  let adverts

  beforeEach(() => {
    createSockets = sinon.stub()
    discover = sinon.stub()
    adverts = []

    ssdp = proxyquire('../../lib/index', {
      './create-sockets': createSockets,
      './discover': discover,
      './adverts': adverts
    })
  })

  it('should set up methods to be invoked once ready is emitted', done => {
    createSockets.returns(new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([])
      }, 500)
    }))
    discover.returns(Promise.resolve())

    const bus = ssdp()
    bus.discover()
    .then(() => {
      expect(discover.called).to.be.true

      done()
    })

    expect(discover.called).to.be.false
  })

  it('should set up methods to be invoked once ready is emitted even if they error', done => {
    const error = new Error('Urk!')
    createSockets.returns(new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([])
      }, 500)
    }))
    discover.returns(Promise.reject(error))

    const bus = ssdp()
    bus.discover()
    .catch(err => {
      expect(err).to.equal(error)

      done()
    })

    expect(discover.called).to.be.false
  })

  it('should pass back an error when creating sockets fails', done => {
    const error = new Error('Urk!')

    createSockets.returns(Promise.reject(error))

    const bus = ssdp()
    bus.on('error', err => {
      expect(err).to.equal(error)
      done()
    })
  })

  it('should close all sockets and stop adverts when stopping', done => {
    const sockets = [{
      close: sinon.stub(),
      on: sinon.stub().callsArgAsync(1)
    }]
    adverts.push({
      stop: sinon.stub().returns(Promise.resolve())
    })
    createSockets.returns(Promise.resolve(sockets))
    discover.returns(Promise.resolve())

    const bus = ssdp({})
    bus.discover()

    expect(discover.called).to.be.false

    bus.once('ready', () => {
      bus.stop()
      .then(() => {
        expect(sockets[0].close.called).to.be.true
        expect(adverts[0].stop.called).to.be.true

        done()
      })
      .catch(error => done(error))
    })
  })
})
