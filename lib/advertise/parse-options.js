'use strict'

const _ = require('lodash')
const xml2js = require('xml2js')

const parseAdvertOptions = (ssdp, options) => {
  if (!options) {
    return ssdp.emit('error', new Error('Empty advert passed'))
  }

  if (!options.usn) {
    return ssdp.emit('error', new Error('Advert should have a usn property'))
  }

  options = _.defaultsDeep(options, {
    usn: options.usn,
    interval: 10000,
    ttl: 1800000,
    ipv4: true,
    ipv6: true,
    location: null,
    details: {
      '$': {
        'xmlns': 'urn:schemas-upnp-org:device-1-0'
      },
      specVersion: {
        major: 1,
        minor: 1
      },
      URLBase: 'http://example.com',
      device: {
        deviceType: options.usn,
        friendlyName: 'A friendly device name',
        manufacturer: 'Manufactuer name',
        manufacturerURL: 'http://example.com',
        modelDescription: 'A description of the device',
        modelName: 'A model name',
        modelNumber: 'A vendor specific model number',
        modelURL: 'http://example.com',
        serialNumber: 'A device specific serial number',
        UDN: ssdp.udn,
        presentationURL: 'index.html'
      }
    }
  })

  const details = options.details

  options.details = () => {
    return new Promise((resolve, reject) => {
      try {
        var builder = new xml2js.Builder()
        resolve(builder.buildObject(details))
      } catch (error) {
        reject(error)
      }
    })
  }

  return options
}

module.exports = parseAdvertOptions
