var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var sinon = require('sinon')
var sendSsdpMessage = require('../../lib/send-ssdp-message')

describe('lib/send-ssdp-message', function () {

  it('should send a message', function (done) {
    var ssdp = {}
    var socket = {
      type: 'udp4',
      send: sinon.stub().callsArg(5)
    }
    var remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    var message = 'message'

    sendSsdpMessage(ssdp, socket, remote, message, function (error) {
      expect(error).to.not.exist
      expect(socket.send.called).to.be.true

      done()
    })
  })

  it('should not send messages to IPv6 hosts over IPv4 sockets', function (done) {
    var ssdp = {}
    var socket = {
      type: 'udp4',
      send: sinon.stub().callsArg(5)
    }
    var remote = {
      family: 'IPv6',
      address: '192.168.1.1',
      port: 1900
    }
    var message = 'message'

    sendSsdpMessage(ssdp, socket, remote, message, function (error) {
      expect(error).to.not.exist
      expect(socket.send.called).to.be.false

      done()
    })
  })

  it('should not send messages over closed sockets', function (done) {
    var ssdp = {}
    var socket = {
      type: 'udp4',
      send: sinon.stub().callsArg(5),
      closed: true
    }
    var remote = {
      family: 'IPv4',
      address: '192.168.1.1',
      port: 1900
    }
    var message = 'message'

    sendSsdpMessage(ssdp, socket, remote, message, function (error) {
      expect(error).to.not.exist
      expect(socket.send.called).to.be.false

      done()
    })
  })
})
