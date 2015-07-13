var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('lib', function () {
  var SSDP
  var createSockets
  var discover
  var adverts

  beforeEach(function () {
    createSockets = sinon.stub()
    discover = sinon.stub()
    adverts = []

    SSDP = proxyquire('../../lib', {
      './create-sockets': createSockets,
      './discover': discover,
      './adverts': adverts
    })
  })

  it('should create an SSDP instance', function () {
    var ssdp = new SSDP()

    expect(ssdp).to.be.an.instanceof(SSDP)
  })

  it('should create an SSDP instance when invoked as function', function () {
    var ssdp = SSDP()

    expect(ssdp).to.be.an.instanceof(SSDP)
  })

  it('should set up methods to be invoked once ready is emitted', function (done) {
    var ssdp = new SSDP()
    ssdp.discover()

    expect(discover.called).to.be.false

    process.nextTick(function () {
      expect(createSockets.called).to.be.true
      createSockets.getCall(0).args[2]()

      ssdp.emit('ready')

      expect(discover.called).to.be.true

      done()
    })
  })

  it('should pass back an error when creating sockets fails', function (done) {
    var error = new Error('Urk!')
    var ssdp = new SSDP({})
    ssdp.on('error', function (err) {
      expect(err).to.equal(error)
      done()
    })
    process.nextTick(function () {
      expect(createSockets.called).to.be.true
      createSockets.getCall(0).args[2](error)
    })
  })

  it('should emit an error when creating sockets fails and no callback passed', function (done) {
    var error = new Error('Urk!')
    var ssdp = new SSDP({})
    ssdp.on('error', function (err) {
      expect(err).to.equal(error)
      done()
    })

    process.nextTick(function () {
      expect(createSockets.called).to.be.true
      createSockets.getCall(0).args[2](error)
    })
  })

  it('should set up a listener for the ready event', function (done) {
    var ssdp = new SSDP({}, done)

    process.nextTick(function () {
      ssdp.emit('ready')
    })
  })

  it('should close all sockets and stop adverts when stopping', function (done) {
    var sockets = [{
      close: sinon.stub(),
      on: sinon.stub().callsArgAsync(1)
    }]
    adverts.push({
      stop: sinon.stub().callsArgAsync(0)
    })

    var ssdp = new SSDP()
    ssdp.discover()

    expect(discover.called).to.be.false

    process.nextTick(function () {
      expect(createSockets.called).to.be.true
      createSockets.getCall(0).args[2](null, sockets)

      ssdp.stop(function (error) {
        expect(error).to.not.exist

        expect(sockets[0].close.called).to.be.true
        expect(adverts[0].stop.called).to.be.true

        done()
      })
    })
  })
})
