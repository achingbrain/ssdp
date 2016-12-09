'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const sinon = require('sinon')
const broadcastAdvert = require('../../../lib/advertise/broadcast-advert')

describe('lib/advertise/broadcast-advert', () => {
  it('should broadcast advert', () => {
    const ssdp = {
      emit: sinon.stub(),
      options: {
        signature: 'signature'
      }
    }
    const advert = {
      usn: 'usn',
      location: {
        'udp4': 'udp4-location'
      },
      ttl: 1000
    }
    const notifcationSubType = 'notifcationSubType'

    broadcastAdvert(ssdp, advert, notifcationSubType)

    expect(ssdp.emit.calledOnce).to.be.true
    expect(ssdp.emit.getCall(0).args[0]).to.equal('ssdp:send-message')
    expect(ssdp.emit.getCall(0).args[1]).to.equal('NOTIFY * HTTP/1.1')
    expect(ssdp.emit.getCall(0).args[2].NT).to.equal(advert.usn)
    expect(ssdp.emit.getCall(0).args[2].NTS).to.equal(notifcationSubType)
    expect(ssdp.emit.getCall(0).args[2]['CACHE-CONTROL']).to.equal('max-age=1')
  })
})
