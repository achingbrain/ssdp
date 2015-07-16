# SSDP

[![Build Status](https://travis-ci.org/achingbrain/ssdp.svg?branch=master)](https://travis-ci.org/achingbrain/ssdp)
[![Coverage Status](https://img.shields.io/coveralls/achingbrain/node-ssdp.svg)](https://coveralls.io/r/achingbrain/ssdp?branch=master)
[![Dependency Status](https://david-dm.org/achingbrain/node-ssdp.png)](https://david-dm.org/achingbrain/ssdp)

An implementation of the Simple Service Discovery protocol for node.

## Installation

```sh
npm install @achingbrain/ssdp
```

## Usage

First, import the module, call the function and set up an error handler:

```javascript
var ssdp = require('@achingbrain/ssdp')
var bus = ssdp()

// print error messages to the console
bus.on('error', console.error)
```

### Service discovery

Pass a `usn` to the `discover` method - when services are found events will be emitted:

```javascript
// this is the unique service name we are interested in:
var usn = 'urn:schemas-upnp-org:service:ContentDirectory:1'

bus.discover(usn)
bus.on('discover:' + usn, function (service) {
  // receive a notification about a service

  bus.on('update:' + service.device.UDN, function (service) {
    // receive a notification when that service is updated - nb. this will only happen after
    // the service max-age is reached - the recommended default in the spec is 30 minutes
  })
})
```

### Discover all services

Don't pass any options to the `discover` method (n.b. you will also receive protocol related events):

```javascript
bus.discover()
bus.on('discover:*', function (service) {
  // receive a notification about all service types
})
```

### Advertise a service

```javascript
// advertise a service
bus.advertise({
  usn: 'a-usn'
}, function (error, advert) {
  // stop advertising a service
  advert.stop()
})
```

### Shutting down gracefully

`ssdp` opens several ports to communicate with other devices on your network, to shut them down, do something like:

```javascript
process.on('SIGINT', function() {
  // stop the server(s) from running - this will also send ssdp:byebye messages for all
  // advertised services however they'll only have been sent once the callback is
  // invoked so it won't work with process.on('exit') as you can only perform synchronous
  // operations there
  bus.stop(function (error) {
    process.exit(error ? 1 : 0)
  })
})
```

### Full API and options

```javascript
var ssdp = require('@achingbrain/ssdp')

// all arguments are optional
var bus = ssdp({
  udn: 'unique-identifier', // defaults to a random UUID
  // a string to identify the server by
  signature: 'node.js/0.12.6 UPnP/1.1 @achingbrain/ssdp/1.0.0',
  retry {
    times: 5, // how many times to attempt joining the UDP multicast group
    interval: 5000 // how long to wait between attempts
  },
  // specify one or more sockets to listen on
  sockets: [{
    type: 'udp4', // or 'udp6'
    broadcast: {
      address: '239.255.255.250', // or 'FF02::C'
      port: 1900 // SSDP broadcast port
    },
    bind: {
      address: '0.0.0.0', // or '0:0:0:0:0:0:0:0'
      port: 1900
    },
    maxHops: 4 // how many network segments packets are allow to travel through (UDP TTL)
  }]
})
bus.on('error', console.error)

// this is the type of service we are interested in
var usn = 'urn:schemas-upnp-org:service:ContentDirectory:1'

// search for one type of service
bus.search(usn)

bus.on('discover:' + usn, function (service) {
  // receive a notification when a service of the passed type is discovered

  bus.on('update:' + service.device.UDN, function (service) {
    // receive a notification when that service is updated
  })
})

// search for all types of service
bus.discover()

bus.on('discover:*', function (service) {
  // receive a notification about all discovered services
})

// advertise a service
bus.advertise({
  usn: 'a-usn', // unqiue service name
  interval: 10000, // how often to broadcast service adverts in ms
  ttl: 1800000, // how long the advert is valid for in ms
  ipv4: true, // whether or not to broadcast the advert over IPv4
  ipv6: true, // whether or not to broadcast the advert over IPv6
  location: null, // a hash of type/url hash or omit to have it auto-generated
  // if location is null, specify a function that passes a description object to the callback
  details: function (callback) {
    callback(null, {
      // description key/value pairs (see below for more information)
    })
  }
}, function (error, advert) {
  // stop advertising a service
  advert.stop()
})
```

### Device description document

During UPnP device discovery, clients can request a [description of the various capabilities your service offers](http://jan.newmarch.name/internetdevices/upnp/upnp-devices.html).
To do this you can either store an xml document and set the `location` field of your advert to point at that document
or have it automatically generated.

E.g., create a document, `description.xml` and put it on a server at `http://server.com/path/to/description.xml`:

```xml
<root xmlns="urn:schemas-upnp-org:device-1-0">
  <specVersion>
    <major>1</major>
    <minor>0</minor>
  </specVersion>
  <URLBase>http://192.168.1.41:80</URLBase>
  <device>
    <deviceType>urn:schemas-upnp-org:device:Basic:1</deviceType>
    <friendlyName>I am a light controller</friendlyName>
    <manufacturer>Royal Philips Electronics</manufacturer>
    <manufacturerURL>http://www.philips.com</manufacturerURL>
    <modelDescription>Philips hue Personal Wireless Lighting</modelDescription>
    <modelName>Philips hue bridge 2012</modelName>
    <modelNumber>23409823049823</modelNumber>
    <modelURL>http://www.meethue.com</modelURL>
    <serialNumber>asd09f8s90832</serialNumber>
    <UDN>uuid:2f402f80-da50-12321-9b23-2131298129</UDN>
    <presentationURL>index.html</presentationURL>
  </device>
</root>
```

Then create your advert:

```javascript
bus.advertise({
  usn: 'urn:schemas-upnp-org:device:Basic:1',
  location: {
    udp4: 'http://192.168.1.40/path/to/description.xml'
  }
})
```

Alternatively provide a function that will pass an object to a callback and let this module do the heavy lifting (n.b.
your object will be run through the [xml2js Builder](https://libraries.io/npm/xml2js#user-content-xml-builder-usage)):

```javascript
bus.advertise({
  usn: 'urn:schemas-upnp-org:device:Basic:1',
  details: function (callback) {
    callback(null, {
      '$': {
        'xmlns': 'urn:schemas-upnp-org:device-1-0'
      },
      'specVersion': {
        'major': '1',
        'minor': '0'
      },
      'URLBase': 'http://192.168.1.41:80',
      'device': {
        'deviceType': 'urn:schemas-upnp-org:device:Basic:1',
        'friendlyName': 'I am a light controller',
        'manufacturer': 'Royal Philips Electronics',
        'manufacturerURL': 'http://www.philips.com',
        'modelDescription': 'Philips hue Personal Wireless Lighting',
        'modelName': 'Philips hue bridge 2012',
        'modelNumber': '23409823049823',
        'modelURL': 'http://www.meethue.com',
        'serialNumber': 'asd09f8s90832',
        'UDN': 'uuid:2f402f80-da50-12321-9b23-2131298129',
        'presentationURL': 'index.html'
      }
    })
  }
})
```

A random high port will be chosen, a http server will listen on that port and serve the descriptor and the `LOCATION`
header will be set appropriately in all `ssdp` messages.

The server will be shut down when you call `advert.stop`.

## References

 * [diversario/node-ssdp](https://github.com/diversario/node-ssdp)
 * [Xedecimal/node-ssdp](https://www.npmjs.com/package/ssdp) (no longer maintained)
 * [LG SSDP discovery documentation](http://developer.lgappstv.com/TV_HELP/topic/lge.tvsdk.references.book/html/UDAP/UDAP/Discovery.htm)
 * [UPnP overview](http://jan.newmarch.name/internetdevices/upnp/upnp.html)
 * [UPnP device description](http://jan.newmarch.name/internetdevices/upnp/upnp-devices.html)
