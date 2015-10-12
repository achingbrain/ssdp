var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var parseOptions = require('../../../lib/advertise/parse-options')

describe('lib/advertise/parse-options', function () {
  it('should populate defaults', function () {
    var options = parseOptions({})

    expect(options.usn).to.equal('a-usn')
    expect(options.interval).to.equal(10000)
  })

  it('should survive empty object', function (done) {
    var options = parseOptions()

    expect(options.usn).to.equal('a-usn')
    expect(options.interval).to.equal(10000)
    expect(options.details).to.be.a('function')

    options.details(function (error, detail) {
      expect(error).to.not.exist
      expect(detail).to.be.an('object')
      done()
    })
  })
})
