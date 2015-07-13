var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('lib/discover', function () {
  var discover
  var sendSsdpMessage

  beforeEach(function () {
    sendSsdpMessage = sinon.stub()

    discover = proxyquire('../../../lib/discover', {
      '../send-ssdp-message': sendSsdpMessage
    })
  })

  it('should send a search message', function (done) {
    var ssdp = {}
    var sockets = []
    var serviceType = 'serviceType'
    var socket = {
      opts: {
        broadcast: {

        },
        bind: {

        }
      }
    }

    discover(ssdp, sockets, serviceType)

    expect(sendSsdpMessage.called).to.be.true
    expect(sendSsdpMessage.getCall(0).args[3]).to.be.a('function')

    sendSsdpMessage.getCall(0).args[3](socket, function (error, message) {
      expect(error).to.not.exist

      message = message.toString('utf8')

      expect(message).to.contain('M-SEARCH')
      expect(message).to.contain('ST: ' + serviceType)

      done()
    })
  })

  it('should default to global search', function (done) {
    var ssdp = {}
    var sockets = []
    var socket = {
      opts: {
        broadcast: {

        },
        bind: {

        }
      }
    }

    discover(ssdp, sockets)

    expect(sendSsdpMessage.called).to.be.true
    expect(sendSsdpMessage.getCall(0).args[3]).to.be.a('function')

    sendSsdpMessage.getCall(0).args[3](socket, function (error, message) {
      expect(error).to.not.exist

      message = message.toString('utf8')

      expect(message).to.contain('M-SEARCH')
      expect(message).to.contain('ST: ssdp:all')

      done()
    })
  })
})
