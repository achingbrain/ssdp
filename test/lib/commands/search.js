var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('lib/commands/search', function () {
  var search
  var sendSsdpMessage
  var adverts

  beforeEach(function () {
    sendSsdpMessage = sinon.stub()
    adverts = []

    search = proxyquire('../../../lib/commands/search', {
      '../send-ssdp-message': sendSsdpMessage,
      '../adverts': adverts
    })
  })

  it('should reject invalid messages', function () {
    var message = {
      headers: {

      }
    }

    search({}, null, null, message)

    expect(sendSsdpMessage.called).to.be.false

    message.headers.MAN = 'man'

    search({}, null, null, message)

    expect(sendSsdpMessage.called).to.be.false

    message.headers.MX = 'mx'

    search({}, null, null, message)

    expect(sendSsdpMessage.called).to.be.false
  })

  it('should respond to global search', function (done) {
    var sockets = 'sockets'
    var udn = 'udn'
    var message = {
      headers: {
        MAN: 'man',
        MX: 'usn',
        ST: 'ssdp:all'
      }
    }
    var advert = {
      service: {
        usn: 'usn',
        ttl: 1800,
        location: 'location'
      }
    }

    adverts.push(advert)

    sendSsdpMessage.callsArgWith(3, 'socket', function (error, message) {
      expect(error).to.not.exist

      message = message.toString('utf8')

      expect(message).to.contain(advert.service.usn)
      expect(message).to.contain(advert.service.usn + '::' + udn)
      expect(message).to.contain(advert.service.location)

      done()
    })

    search({}, sockets, udn, message)

    expect(sendSsdpMessage.called).to.be.true
  })

  it('should respond to global search', function () {
    var sockets = 'sockets'
    var udn = 'udn'
    var message = {
      headers: {
        MAN: 'man',
        MX: 'usn',
        ST: 'usn'
      }
    }

    adverts.push({
      service: {
        usn: 'usn'
      }
    }, {
      service: {
        usn: 'not-usn'
      }
    })

    search({}, sockets, udn, message)

    expect(sendSsdpMessage.calledOnce).to.be.true
  })
})
