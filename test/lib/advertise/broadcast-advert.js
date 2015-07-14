var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var sinon = require('sinon')
var broadcastAdvert = require('../../../lib/advertise/broadcast-advert')

describe('lib/advertise/broadcast-advert', function () {

  it('should broadcast advert', function (done) {
    var ssdp = {
      udn: 'udn',
      sockets: [{
        type: 'udp4',
        options: {
          broadcast: {
            address: 'address',
            port: 'port'
          }
        },
        send: sinon.stub()
      }],
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
    ssdp.sockets[0].send.callsArg(5)

    broadcastAdvert(ssdp, advert, notifcationSubType, function (error) {
      expect(error).to.not.exist
      expect(ssdp.sockets[0].send.calledOnce).to.be.true

      var message = ssdp.sockets[0].send.getCall(0).args[0].toString('utf8')
      expect(message).to.contain('HOST: address:port')
      expect(message).to.contain('NT: ' + advert.usn)
      expect(message).to.contain('NTS: ' + notifcationSubType)
      expect(message).to.contain('CACHE-CONTROL: max-age=1')
      done()
    })
  })
})
