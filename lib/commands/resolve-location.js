'use strict'

const parseString = require('xml2js').parseString
const fetch = require('fetch-ponyfill')().fetch

const resolveLocation = location => {
  if (location.substring(0, 4) !== 'http') {
    location = 'http://' + location
  }

  return fetch(location, {
    headers: {
      accept: 'application/xml'
    }
  })
  .then(result => {
    if (result.headers['content-type'] && result.headers['content-type'].indexOf('/xml') === -1) {
      throw new Error('Bad content type ' + result.headers['content-type'])
    }

    return result.text()
  })
  .then(text => {
    return new Promise((resolve, reject) => {
      parseString(text, {
        normalize: true,
        explicitArray: false
      }, (error, result) => {
        if (error) {
          return reject(error)
        }

        resolve(result.root || result)
      })
    })
  })
  .catch(error => {
    throw new Error(`Could not resolve ${location} - ${error.message}`)
  })
}

module.exports = resolveLocation
