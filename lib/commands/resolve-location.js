var Wreck = require('wreck')
var async = require('async')
var parseString = require('xml2js').parseString

module.exports = function resolveLocation (location, callback) {
  async.waterfall([
    Wreck.get.bind(Wreck, location, {
      timeout: 5000
    }),
    function (result, payload, callback) {
      if (result.headers['content-type'] && result.headers['content-type'].indexOf('/xml') !== -1) {
        return parseString(payload, {
          normalize: true,
          explicitArray: false
        }, callback)
      }

      callback(new Error('Bad content type ' + result.headers['content-type']))
    }
  ], function (error, result) {
    if (error) {
      return callback(error)
    }

    return callback(error, result.root || result)
  })
}
