var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var ssdp = require('../')

describe('/', function () {
  it('should export something useful', function () {
    expect(ssdp).to.be.a('function')
  })
})
