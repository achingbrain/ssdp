var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var createHeaders = require('../../../lib/advertise/create-headers')

describe('lib/advertise/create-headers', function () {

  it('should create headers', function (done) {
    var udn = 'udn'
    var socket = {
      opts: {
        broadcast: {
          address: 'broadcastAddress',
          port: 'broadcastPort'
        }
      }
    }
    var advert = {
      usn: 'usn',
      ttl: 'ttl',
      signature: 'signature'
    }
    var notifcationSubType = 'notifcationSubType'

    createHeaders(udn, socket, advert, notifcationSubType, function (error, headers) {
      expect(error).to.not.exist
      expect(headers.HOST).to.contain(socket.opts.broadcast.address)
      expect(headers.HOST).to.contain(socket.opts.broadcast.port)
      expect(headers.NT).to.equal(advert.usn)
      expect(headers.NTS).to.equal(notifcationSubType)
      expect(headers['CACHE-CONTROL']).to.equal('max-age=' + advert.ttl)
      expect(headers.SERVER).to.equal(advert.signature)

      done()
    })
  })
})
