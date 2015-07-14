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

    search({}, message)

    expect(sendSsdpMessage.called).to.be.false
  })

  it('should respond to global search', function (done) {
    var ssdp = {
      udn: 'udn',
      sockets: [{
        type: 'udp4'
      }]
    }
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
        location: {
          udp4: 'location'
        }
      }
    }

    adverts.push(advert)

    sendSsdpMessage.callsArgWith(2, ssdp.sockets[0], function (error, message) {
      expect(error).to.not.exist

      message = message.toString('utf8')

      expect(message).to.contain(advert.service.usn)
      expect(message).to.contain(advert.service.usn + '::' + ssdp.udn)
      expect(message).to.contain(advert.service.location.udp4)

      done()
    })

    search(ssdp, message)

    expect(sendSsdpMessage.called).to.be.true
  })

  it('should respond to global search', function () {
    var ssdp = {
      udn: 'udn',
      sockets: 'sockets'
    }
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

    search(ssdp, message)

    expect(sendSsdpMessage.calledOnce).to.be.true
  })
})
