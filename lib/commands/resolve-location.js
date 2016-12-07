const parseString = require('xml2js').parseString
const axios = require('axios')

const resolveLocation = location => {
  if (location.substring(0, 4) !== 'http') {
    location = 'http://' + location
  }

  return axios({
    url: location,
    responseType: 'text',
    headers: {
      accept: 'application/xml'
    }
  })
  .then(result => {
    if (result.headers['content-type'] && result.headers['content-type'].indexOf('/xml') === -1) {
      throw new Error('Bad content type ' + result.headers['content-type'])
    }

    return new Promise((resolve, reject) => {
      parseString(result.data, {
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
}

module.exports = resolveLocation
