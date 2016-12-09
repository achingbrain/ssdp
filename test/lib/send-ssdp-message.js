'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const sinon = require('sinon')
const sendSsdpMessage = require('../../lib/send-ssdp-message')

describe('lib/send-ssdp-message', () => {
  it('should send a message', () => {
    const ssdp = {
      emit: sinon.stub(),
      sockets: [{
        type: 'udp4',
        send: sinon.stub().callsArg(5),
        options: {
          broadcast: {
            address: 'broadcast-address',
            port: 'broadcast-port'
          }
        }
      }]
    }
    const remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    const status = 'status'
    const headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.sockets[0].send.called).to.be.true
  })

  it('should not send messages to IPv6 hosts over IPv4 sockets', () => {
    const ssdp = {
      emit: sinon.stub(),
      sockets: [{
        type: 'udp4',
        send: sinon.stub().callsArg(5),
        options: {
          broadcast: {
            address: 'broadcast-address',
            port: 'broadcast-port'
          }
        }
      }]
    }
    const remote = {
      address: '00:00:00:00:00:00:00',
      port: 1900
    }
    const status = 'status'
    const headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.sockets[0].send.called).to.be.false
  })

  it('should not send messages over closed sockets', () => {
    const ssdp = {
      emit: sinon.stub(),
      sockets: [{
        type: 'udp4',
        send: sinon.stub().callsArg(5),
        closed: true,
        options: {
          broadcast: {
            address: 'broadcast-address',
            port: 'broadcast-port'
          }
        }
      }]
    }
    const remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    const status = 'status'
    const headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.sockets[0].send.called).to.be.false
  })

  it('should not send messages to invalid addresses', () => {
    const ssdp = {
      emit: sinon.stub(),
      sockets: [{
        type: 'udp4',
        send: sinon.stub().callsArg(5),
        options: {
          broadcast: {
            address: 'broadcast-address',
            port: 'broadcast-port'
          }
        }
      }]
    }
    const remote = {
      family: 'IPv4',
      address: '192.168.1.2398',
      port: 1900
    }
    const status = 'status'
    const headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.sockets[0].send.called).to.be.false
  })

  it('should emit errors when sending a message fails', done => {
    const error = new Error('Urk!')
    const ssdp = {
      emit: sinon.stub(),
      sockets: [{
        type: 'udp4',
        send: sinon.stub().callsArgWith(5, error),
        options: {
          broadcast: {
            address: 'broadcast-address',
            port: 'broadcast-port'
          }
        }
      }]
    }
    const remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    const status = 'status'
    const headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)
    .then(() => {
      expect(ssdp.emit.calledTwice).to.be.true
      expect(ssdp.emit.getCall(1).args[0]).to.equal('error')
      expect(ssdp.emit.getCall(1).args[1]).to.equal(error)

      done()
    })
  })
})
