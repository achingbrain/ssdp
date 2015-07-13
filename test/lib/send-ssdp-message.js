var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var sinon = require('sinon')
var sendSsdpMessage = require('../../lib/send-ssdp-message')

describe('lib/send-ssdp-message', function () {

  it('should send a message', function (done) {
    var ssdp = {}
    var sockets = [{
      type: 'udp4',
      send: sinon.stub().callsArg(5)
    }]
    var remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    var createMessage = sinon.stub().callsArgWith(1, null, 'message')

    sendSsdpMessage(ssdp, sockets, remote, createMessage, function (error) {
      expect(error).to.not.exist
      expect(sockets[0].send.called).to.be.true

      done()
    })
  })

  it('should broadcast a message', function (done) {
    var ssdp = {}
    var sockets = [{
      type: 'udp4',
      send: sinon.stub().callsArg(5),
      opts: {
        broadcast: {
          address: 'broadcastAddress',
          port: 'broadcastPort'
        }
      }
    }]
    var message = 'message'
    var createMessage = sinon.stub().callsArgWith(1, null, message)

    sendSsdpMessage(ssdp, sockets, null, createMessage, function (error) {
      expect(error).to.not.exist
      expect(sockets[0].send.calledWith(message, 0, 7, sockets[0].opts.broadcast.port, sockets[0].opts.broadcast.address)).to.be.true

      done()
    })
  })

  it('should not send messages to IPv6 hosts over IPv4 sockets', function (done) {
    var ssdp = {}
    var sockets = [{
      type: 'udp4',
      send: sinon.stub().callsArg(5)
    }, {
      type: 'udp6',
      send: sinon.stub().callsArg(5)
    }]
    var remote = {
      family: 'IPv6',
      address: '192.168.1.1',
      port: 1900
    }
    var createMessage = sinon.stub().callsArgWith(1, null, 'message')

    sendSsdpMessage(ssdp, sockets, remote, createMessage, function (error) {
      expect(error).to.not.exist
      expect(sockets[0].send.called).to.be.false
      expect(sockets[1].send.called).to.be.true

      done()
    })
  })

  it('should pass back error when creating message fails', function (done) {
    var error = new Error('Urk!')
    var ssdp = {}
    var sockets = [{
      type: 'udp4',
      send: sinon.stub().callsArg(5)
    }]
    var remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    var createMessage = sinon.stub().callsArgWith(1, error)

    sendSsdpMessage(ssdp, sockets, remote, createMessage, function (err) {
      expect(err).to.equal(error)
      expect(sockets[0].send.called).to.be.false

      done()
    })
  })

  it('should emit error on ssdp when creating message fails and no callback passed', function () {
    var error = new Error('Urk!')
    var ssdp = {
      emit: sinon.stub()
    }
    var sockets = [{
      type: 'udp4',
      send: sinon.stub().callsArg(5)
    }]
    var remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    var createMessage = sinon.stub().callsArgWith(1, error)

    sendSsdpMessage(ssdp, sockets, remote, createMessage)

    expect(ssdp.emit.calledWith('error', error)).to.be.true
  })

  it('should broadcast a message without a callback', function () {
    var ssdp = {}
    var sockets = [{
      type: 'udp4',
      send: sinon.stub().callsArg(5),
      opts: {
        broadcast: {
          address: 'broadcastAddress',
          port: 'broadcastPort'
        }
      }
    }]
    var message = 'message'
    var createMessage = sinon.stub().callsArgWith(1, null, message)

    sendSsdpMessage(ssdp, sockets, null, createMessage)
  })

  it('should not send a message over a closed socket', function () {
    var ssdp = {}
    var sockets = [{
      closed: true,
      send: sinon.stub()
    }]
    var message = 'message'
    var createMessage = sinon.stub().callsArgWith(1, null, message)

    sendSsdpMessage(ssdp, sockets, null, createMessage)

    expect(sockets[0].send.called).to.be.false
  })
})
