var describe = require('mocha').describe
var it = require('mocha').it
var fail = require('mocha').fail
var expect = require('chai').expect
var callbackOrEmit = require('../../lib/callback-or-emit')

describe('lib/callback-or-emit', function () {
  it('should honor passed callback', function (done) {
    var callback = callbackOrEmit(null, done)

    callback()
  })

  it('should invoke error on emitter when no callback passed', function () {
    var error = new Error('Urk!')
    var callback = callbackOrEmit({
      emit: function (event, err) {
        expect(event).to.equal('error')
        expect(err).to.equal(error)
      }
    })

    callback(error)
  })

  it('should noop when no callback or error passed', function () {
    var callback = callbackOrEmit({
      emit: fail
    })

    callback()
  })
})
