'use strict'

const os = require('os')

const findAllInterfaces = (includeIPv4, includeIPv6) => {
  var output = []

  var networkInterfaces = os.networkInterfaces()

  for (var ifName in networkInterfaces) {
    networkInterfaces[ifName].forEach(function (iface) {
      if (iface.internal) {
        return
      }

      if (iface.family === 'IPv4' && includeIPv4) {
        output.push(iface)
      }

      if (iface.family === 'IPv6' && includeIPv6) {
        output.push(iface)
      }
    })
  }

  return output
}

module.exports = findAllInterfaces
