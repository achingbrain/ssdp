var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var sinon = require('sinon')
var expect = require('chai').expect
var proxyquire = require('proxyquire')

describe('lib/commands/notify', function () {
  var resolveLocation
  var Wreck

  beforeEach(function () {
    Wreck = {
      get: sinon.stub()
    }

    resolveLocation = proxyquire('../../../lib/commands/resolve-location', {
      'wreck': Wreck
    })
  })

  it('should parse location contents as xml', function (done) {
    var location = 'location'
    var result = {
      headers: {
        'content-type': 'application/xml'
      }
    }
    var payload = '<foo>bar</foo>'

    Wreck.get.withArgs(location).callsArgWith(2, null, result, payload)

    resolveLocation(location, function (error, location) {
      expect(error).to.not.exist
      expect(location).to.deep.equal({
        foo: 'bar'
      })
      done()
    })
  })

  it('should parse location contents as xml', function (done) {
    var location = 'location'
    var result = {
      headers: {
        'content-type': 'application/xml'
      }
    }
    var payload = '<foo baz="qux">bar</foo>'

    Wreck.get.withArgs(location).callsArgWith(2, null, result, payload)

    resolveLocation(location, function (error, location) {
      expect(error).to.not.exist
      expect(location).to.deep.equal({
        foo: {
          $: {
            baz: 'qux'
          },
          _: 'bar'
        }
      })
      done()
    })
  })

  it('should return error when fetching location fails', function (done) {
    var location = 'location'
    var result = {
      headers: {
        'content-type': 'text/html'
      }
    }
    var payload = '<foo>bar</foo>'

    Wreck.get.withArgs(location).callsArgWith(2, null, result, payload)

    resolveLocation(location, function (error, location) {
      console.info('error', error)
      expect(error.message).to.contain('Bad content type')
      done()
    })
  })
})
