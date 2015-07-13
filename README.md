# SSDP

[![Build Status](https://travis-ci.org/achingbrain/ssdp.svg?branch=master)](https://travis-ci.org/achingbrain/ssdp)
[![Coverage Status](https://img.shields.io/coveralls/achingbrain/node-ssdp.svg)](https://coveralls.io/r/achingbrain/ssdp?branch=master)
[![Dependency Status](https://david-dm.org/achingbrain/node-ssdp.png)](https://david-dm.org/achingbrain/ssdp)

An implementation of SSDP for node, largely inspired by [diversario/node-ssdp](https://github.com/diversario/node-ssdp) but without the wrinkles and extra logging library.

## Installation

```sh
npm install @achingbrain/ssdp
```

## Usage

```javascript
var ssdp = require('@achingbrain/ssdp')

// all arguments are optional
var server = ssdp({
  udn: 'unique-identifier', // defaults to a random UUID
  retry {
    times: 5, // how many times to attempt joining the UDP multicast group
    interval: 5000 // how long to wait between attempts
  },
  udp4: {
    broadcastAddress: '239.255.255.250', // SSDP broadcast address
    broadcastPort: 1900, // SSDP broadcast port
    bindAddress: '0.0.0.0', // bind on all interfaces
    maxHops: 1 // how many network segments packets are allow to travel through (UDP TTL)
  },
  udp6: {
    broadcastAddress: 'FF02::C', // SSDP broadcast address
    broadcastPort: 1900, // SSDP broadcast port
    bindAddress: '0:0:0:0:0:0:0:0', // bind on all interfaces
    maxHops: 1 // how many network segments packets are allow to travel through (UDP TTL)
  }
})
server.on('error', console.error)
server.on('ready', function () {
  // search for one type of service
  server.search('urn:schemas-upnp-org:service:ContentDirectory:1')

  // search for all types of service
  server.search()

  // advertise a service
  var advert = server.advertise({

  })

  // stop advertising a service
  advert.stop()
})
server.on('urn:schemas-upnp-org:service:ContentDirectory:1', function (service) {
  // receive a notification about a service type
})

process.on('exit', function() {
  // stop the server from running
  server.stop()
})
```

### IPv6 support

`ssdp` supports ipv6, in theory at least.  Not all networks support this though so to disable it, pass `false` in as an option:

```javascript
var server = ssdp({
  // ...
  udp6: false,
  // ...
})
```
