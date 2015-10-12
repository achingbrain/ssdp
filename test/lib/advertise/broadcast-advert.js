var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var sinon = require('sinon')
var broadcastAdvert = require('../../../lib/advertise/broadcast-advert')

describe('lib/advertise/broadcast-advert', function () {
  it('should broadcast advert', function () {
    var ssdp = {
      emit: sinon.stub(),
      options: {
        signature: 'signature'
      }
    }
    var advert = {
      usn: 'usn',
      location: {
        'udp4': 'udp4-location'
      },
      ttl: 1000
    }
    var notifcationSubType = 'notifcationSubType'

    broadcastAdvert(ssdp, advert, notifcationSubType)

    expect(ssdp.emit.calledOnce).to.be.true
    expect(ssdp.emit.getCall(0).args[0]).to.equal('ssdp:send-message')
    expect(ssdp.emit.getCall(0).args[1]).to.equal('NOTIFY * HTTP/1.1')
    expect(ssdp.emit.getCall(0).args[2].NT).to.equal(advert.usn)
    expect(ssdp.emit.getCall(0).args[2].NTS).to.equal(notifcationSubType)
    expect(ssdp.emit.getCall(0).args[2]['CACHE-CONTROL']).to.equal('max-age=1')
  })
})
