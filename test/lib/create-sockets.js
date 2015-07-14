var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('lib/create-sockets', function () {
  var createSockets
  var dgram

  beforeEach(function () {
    dgram = {
      createSocket: sinon.stub()
    }

    createSockets = proxyquire('../../lib/create-sockets', {
      'dgram': dgram
    })
  })

  it('should create sockets', function (done) {
    var ssdp = {
      emit: sinon.stub(),
      options: {
        sockets: [{
          type: 'udp4',
          broadcast: {

          },
          bind: {

          }
        }, {
          type: 'udp6',
          broadcast: {

          },
          bind: {

          }
        }],
        retry: {
          times: 5,
          interval: 5000
        }
      }
    }
    var socket4 = {
      bind: sinon.stub(),
      on: sinon.stub(),
      addMembership: sinon.stub(),
      setMulticastTTL: sinon.stub(),
      address: sinon.stub().returns({}),
      setBroadcast: sinon.stub()
    }
    var socket6 = {
      bind: sinon.stub(),
      on: sinon.stub(),
      addMembership: sinon.stub(),
      setMulticastTTL: sinon.stub(),
      address: sinon.stub().returns({}),
      setBroadcast: sinon.stub()
    }

    dgram.createSocket.withArgs('udp4').returns(socket4)
    dgram.createSocket.withArgs('udp6').returns(socket6)

    createSockets(ssdp, function (error, sockets) {
      expect(error).to.not.exist
      expect(sockets.length).to.equal(2)
      expect(sockets[0]).to.equal(socket4)
      expect(sockets[1]).to.equal(socket6)
      done()
    })

    expect(socket4.on.called).to.be.true
    expect(socket4.on.getCall(1).args[0]).to.equal('listening')
    socket4.on.getCall(1).args[1]()

    expect(socket6.on.called).to.be.true
    expect(socket6.on.getCall(1).args[0]).to.equal('listening')
    socket6.on.getCall(1).args[1]()
  })

  it('should create only udp4 sockets', function (done) {
    var ssdp = {
      emit: sinon.stub(),
      options: {
        sockets: [{
          type: 'udp4',
          broadcast: {

          },
          bind: {

          }
        }],
        retry: {
          times: 5,
          interval: 5000
        }
      }
    }

    var socket4 = {
      bind: sinon.stub(),
      on: sinon.stub(),
      addMembership: sinon.stub(),
      setMulticastTTL: sinon.stub(),
      address: sinon.stub().returns({}),
      setBroadcast: sinon.stub()
    }

    dgram.createSocket.withArgs('udp4').returns(socket4)

    createSockets(ssdp, function (error, sockets) {
      expect(error).to.not.exist
      expect(sockets.length).to.equal(1)
      expect(sockets[0]).to.equal(socket4)
      done()
    })

    expect(socket4.on.called).to.be.true
    expect(socket4.on.getCall(1).args[0]).to.equal('listening')
    socket4.on.getCall(1).args[1]()
  })

  it('should pass back error creating membership', function (done) {
    var error = new Error('Urk!')
    var ssdp = {
      emit: sinon.stub(),
      options: {
        sockets: [{
          type: 'udp4',
          broadcast: {

          },
          bind: {

          }
        }],
        retry: {
          times: 5,
          interval: 10
        }
      }
    }

    var socket4 = {
      bind: sinon.stub(),
      on: sinon.stub(),
      addMembership: sinon.stub().throws(error),
      setMulticastTTL: sinon.stub(),
      address: sinon.stub().returns({})
    }

    dgram.createSocket.withArgs('udp4').returns(socket4)

    createSockets(ssdp, function (err, sockets) {
      expect(err).to.equal(error)
      done()
    })

    expect(socket4.on.called).to.be.true
    expect(socket4.on.getCall(1).args[0]).to.equal('listening')
    socket4.on.getCall(1).args[1]()
  })
})
