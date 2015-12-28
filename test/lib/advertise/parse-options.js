var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var parseOptions = require('../../../lib/advertise/parse-options')

describe('lib/advertise/parse-options', function () {
  it('should populate defaults', function () {
    var options = parseOptions({}, {
      usn: 'a-usn'
    })

    expect(options.usn).to.equal('a-usn')
    expect(options.interval).to.equal(10000)
  })

  it('should require an options object', function (done) {
    parseOptions({
      emit: function (event, error) {
        expect(event).to.equal('error')
        expect(error.message).to.contain('Empty advert passed')
        done()
      }
    })
  })

  it('should require a usn as part of the options object', function (done) {
    parseOptions({
      emit: function (event, error) {
        expect(event).to.equal('error')
        expect(error.message).to.contain('Advert should have a usn property')
        done()
      }
    }, {})
  })

  it('should make the details key a function that serialises details to xml', function (done) {
    var options = parseOptions({
      udn: 'a-udn'
    }, {
      usn: 'a-usn'
    })

    expect(options.details).to.be.a('function')
    options.details(function (error, details) {
      expect(error).to.not.exist
      expect(details).to.contain('<root xmlns="urn:schemas-upnp-org:device-1-0">')
      done()
    })
  })
})
