var _ = require('lodash')
var xml2js = require('xml2js')

module.exports = function parseAdvertOptions (ssdp, options) {
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

  var details = options.details

  options.details = function createDetails (callback) {
    var builder = new xml2js.Builder()
    var xml = builder.buildObject(details)

    callback(null, xml)
  }

  return options
}
