var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var sinon = require('sinon')
var discover = require('../../../lib/discover')

describe('lib/discover', function () {

  it('should send a search message', function (done) {
    var ssdp = {
      sockets: [{
        options: {
          broadcast: {

          },
          bind: {

          }
        },
        send: sinon.stub().callsArg(5)
      }]
    }
    var serviceType = 'serviceType'

    discover(ssdp, serviceType, function (error) {
      expect(error).to.not.exist

      var message = ssdp.sockets[0].send.getCall(0).args[0]
      message = message.toString('utf8')

      expect(message).to.contain('M-SEARCH')
      expect(message).to.contain('ST: ' + serviceType)

      done()
    })
  })

  it('should default to global search', function (done) {
    var ssdp = {
      sockets: [{
        options: {
          broadcast: {

          },
          bind: {

          }
        },
        send: sinon.stub().callsArg(5)
      }]
    }

    discover(ssdp, null, function (error) {
      expect(error).to.not.exist

      var message = ssdp.sockets[0].send.getCall(0).args[0]
      message = message.toString('utf8')

      expect(message).to.contain('M-SEARCH')
      expect(message).to.contain('ST: ssdp:all')

      done()
    })
  })
})
