var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var sinon = require('sinon')
var sendSsdpMessage = require('../../lib/send-ssdp-message')

describe('lib/send-ssdp-message', function () {

  it('should send a message', function () {
    var ssdp = {
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
    var remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    var status = 'status'
    var headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.sockets[0].send.called).to.be.true
  })

  it('should not send messages to IPv6 hosts over IPv4 sockets', function () {
    var ssdp = {
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
    var remote = {
      address: '00:00:00:00:00:00:00',
      port: 1900
    }
    var status = 'status'
    var headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.sockets[0].send.called).to.be.false
  })

  it('should not send messages over closed sockets', function () {
    var ssdp = {
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
    var remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    var status = 'status'
    var headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.sockets[0].send.called).to.be.false
  })

  it('should not send messages to invalid addresses', function () {
    var ssdp = {
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
    var remote = {
      family: 'IPv4',
      address: '192.168.1.2398',
      port: 1900
    }
    var status = 'status'
    var headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.sockets[0].send.called).to.be.false
  })

  it('should emit errors when sending a message fails', function () {
    var error = new Error('Urk!')
    var ssdp = {
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
    var remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    var status = 'status'
    var headers = {}

    sendSsdpMessage(ssdp, status, headers, remote)

    expect(ssdp.emit.calledTwice).to.be.true
    expect(ssdp.emit.getCall(1).args[0]).to.equal('error')
    expect(ssdp.emit.getCall(1).args[1]).to.equal(error)
  })
})
