var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var sinon = require('sinon')
var stopAdvert = require('../../../lib/advertise/stop-advert')

describe('lib/advertise/stop-advert', function () {

  it('should stop an advert', function (done) {
    var ssdp = {
      emit: sinon.stub(),
      sockets: [{
        options: {
          broadcast: {

          }
        }
      }],
      options: {
        signature: 'foo'
      }
    }
    var shutDownServers = [
      sinon.stub().callsArgAsync(0)
    ]
    var advert = {
      location: {
        udp4: 'udp4-location'
      }
    }

    stopAdvert(ssdp, {
      shutDownServers: shutDownServers
    }, advert, function (error) {
      expect(error).to.not.exist
      done()
    })
  })

  it('should pass back error when stopping advert', function (done) {
    var error = new Error('Urk!')
    var ssdp = {}
    var shutDownServers = [
      sinon.stub().callsArgWithAsync(0, error)
    ]
    var advert = {}

    stopAdvert(ssdp, {
      shutDownServers: shutDownServers
    }, advert, function (err) {
      expect(err).to.equal(error)
      done()
    })
  })
})
