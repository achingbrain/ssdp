var describe = require('mocha').describe
var it = require('mocha').it
var afterEach = require('mocha').afterEach
var expect = require('chai').expect
var cache = require('../../lib/cache')

describe('lib/cache', function () {

  afterEach(function (done) {
    cache.empty(done)
  })

  it('should store a thing', function (done) {
    cache.set('foo', 'bar', 1, function () {
      cache.get('foo', function (error, result) {
        expect(error).to.not.exist
        expect(result).to.equal('bar')
        done()
      })
    })
  })

  it('should survive accessing a non-existant thing', function (done) {
    cache.get('foo', function (error, result) {
      expect(error).to.not.exist
      expect(result).to.not.exist
      done()
    })
  })

  it('should update a thing', function (done) {
    cache.set('foo', 'bar', 1, function () {
      cache.set('foo', 'baz', 1, function () {
        cache.get('foo', function (error, result) {
          expect(error).to.not.exist
          expect(result).to.equal('baz')
          done()
        })
      })
    })
  })

  it('should store all the things', function (done) {
    cache.set('foo', 'bar', 1, function () {
      cache.all(function (error, results) {
        expect(error).to.not.exist
        expect(results.length).to.equal(1)
        expect(results[0]).to.equal('bar')
        done()
      })
    })
  })

  it('should empty the things', function (done) {
    cache.set('foo', 'bar', 1, function () {
      cache.empty(function (error, results) {
        expect(error).to.not.exist

        cache.all(function (err, results) {
          expect(err).to.not.exist
          expect(results.length).to.be.empty
          done()
        })
      })
    })
  })

  it('should drop a thing from the store', function (done) {
    cache.set('foo', 'bar', 100, function () {
      cache.get('foo', function (error, result) {
        expect(error).to.not.exist
        expect(result).to.equal('bar')
        cache.drop('foo', function (error) {
          expect(error).to.not.exist

          cache.get('foo', function (error, result) {
            expect(error).to.not.exist
            expect(result).to.not.exist
            done()
          })
        })
      })
    })
  })
})
