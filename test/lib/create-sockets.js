'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const expect = require('chai').expect
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('lib/create-sockets', () => {
  let createSockets
  let dgram

  beforeEach(() => {
    dgram = {
      createSocket: sinon.stub()
    }

    createSockets = proxyquire('../../lib/create-sockets', {
      'dgram': dgram
    })
  })

  it('should create sockets', done => {
    const ssdp = {
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
    const socket4 = {
      bind: sinon.stub(),
      on: sinon.stub(),
      addMembership: sinon.stub(),
      setMulticastTTL: sinon.stub(),
      address: sinon.stub().returns({}),
      setBroadcast: sinon.stub()
    }
    const socket6 = {
      bind: sinon.stub(),
      on: sinon.stub(),
      addMembership: sinon.stub(),
      setMulticastTTL: sinon.stub(),
      address: sinon.stub().returns({}),
      setBroadcast: sinon.stub()
    }

    dgram.createSocket.withArgs({type: 'udp4', reuseAddr: true}).returns(socket4)
    dgram.createSocket.withArgs({type: 'udp6', reuseAddr: true}).returns(socket6)

    createSockets(ssdp)
    .then(sockets => {
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

  it('should create only udp4 sockets', done => {
    const ssdp = {
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

    const socket4 = {
      bind: sinon.stub(),
      on: sinon.stub(),
      addMembership: sinon.stub(),
      setMulticastTTL: sinon.stub(),
      address: sinon.stub().returns({}),
      setBroadcast: sinon.stub()
    }

    dgram.createSocket.withArgs({type: 'udp4', reuseAddr: true}).returns(socket4)

    createSockets(ssdp)
    .then(sockets => {
      expect(sockets.length).to.equal(1)
      expect(sockets[0]).to.equal(socket4)
      done()
    })

    expect(socket4.on.called).to.be.true
    expect(socket4.on.getCall(1).args[0]).to.equal('listening')
    socket4.on.getCall(1).args[1]()
  })

  it('should pass back error creating membership', done => {
    const error = new Error('Urk!')
    const ssdp = {
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

    const socket4 = {
      bind: sinon.stub(),
      on: sinon.stub(),
      addMembership: sinon.stub().throws(error),
      setMulticastTTL: sinon.stub(),
      address: sinon.stub().returns({})
    }

    dgram.createSocket.withArgs({type: 'udp4', reuseAddr: true}).returns(socket4)

    createSockets(ssdp)
    .catch(err => {
      expect(err).to.equal(error)
      done()
    })

    expect(socket4.on.called).to.be.true
    expect(socket4.on.getCall(1).args[0]).to.equal('listening')
    socket4.on.getCall(1).args[1]()
  })
})
