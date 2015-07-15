var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('lib/commands/search', function () {
  var search
  var adverts

  beforeEach(function () {
    adverts = []

    search = proxyquire('../../../lib/commands/search', {
      '../adverts': adverts
    })
  })

  it('should reject invalid messages', function () {
    var ssdp = {
      emit: sinon.stub()
    }
    var message = {
      headers: {

      }
    }

    search({}, message)

    expect(ssdp.emit.called).to.be.false
  })

  it('should respond to a global search', function () {
    var ssdp = {
      udn: 'udn',
      emit: sinon.stub(),
      options: {
        signature: 'signature'
      }
    }
    var message = {
      MAN: 'man',
      MX: 'usn',
      ST: 'ssdp:all'
    }
    var remote = {
      address: 'remote-address',
      port: 'remote-port'
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

    search(ssdp, message, remote)

    expect(ssdp.emit.calledOnce).to.be.true
    expect(ssdp.emit.getCall(0).args[0]).to.equal('ssdp:send-message')
    expect(ssdp.emit.getCall(0).args[1]).to.equal('HTTP/1.1 200 OK')
    expect(ssdp.emit.getCall(0).args[2].ST).to.equal(advert.service.usn)
    expect(ssdp.emit.getCall(0).args[2].USN).to.equal(ssdp.udn + '::' + advert.service.usn)
    expect(ssdp.emit.getCall(0).args[2].LOCATION).to.equal(advert.service.location)
    expect(ssdp.emit.getCall(0).args[3]).to.deep.equal(remote)
  })

  it('should respond to a search', function () {
    var ssdp = {
      udn: 'udn',
      sockets: [{
        type: 'udp4'
      }],
      emit: sinon.stub(),
      options: {
        signature: 'signature'
      }
    }
    var message = {
      MAN: 'man',
      MX: 'usn',
      ST: 'usn'
    }
    var remote = {
      address: 'remote-address',
      port: 'remote-port'
    }
    adverts.push({
      service: {
        usn: 'usn',
        location: {
          udp4: 'usn-udp4-location'
        }
      }
    }, {
      service: {
        usn: 'not-usn'
      }
    })

    search(ssdp, message, remote)

    expect(ssdp.emit.calledOnce).to.be.true
  })
})
