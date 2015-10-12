var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var sinon = require('sinon')
var detailsHandler = require('../../../lib/advertise/details-handler')

describe('lib/advertise/details-handler', function () {
  it('should return error when creating details fails', function (done) {
    var error = new Error('Urk!')

    detailsHandler(function (callback) {
      callback(error)
    }, {}, {
      writeHead: sinon.stub(),
      end: function (output) {
        expect(this.writeHead.calledWith(500)).to.be.true
        expect(output).to.equal(error)
        done()
      }
    })
  })

  it('should transform object to xml and return', function (done) {
    detailsHandler(function (callback) {
      callback(null, {
        foo: 'bar'
      })
    }, {}, {
      writeHead: sinon.stub(),
      end: function (output) {
        expect(this.writeHead.calledWith(200)).to.be.true
        expect(output).to.contain('<foo>bar</foo>')
        done()
      }
    })
  })
})
