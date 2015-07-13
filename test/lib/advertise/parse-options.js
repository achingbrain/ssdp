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

  it('should survive empty object', function () {
    var options = parseOptions()

    expect(options.usn).to.equal('a-usn')
    expect(options.interval).to.equal(10000)
  })
})
