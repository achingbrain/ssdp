# @achingbrain/ssdp

[![codecov](https://img.shields.io/codecov/c/github/achingbrain/ssdp.svg?style=flat-square)](https://codecov.io/gh/achingbrain/ssdp)
[![CI](https://img.shields.io/github/actions/workflow/status/achingbrain/ssdp/js-test-and-release.yml?branch=main\&style=flat-square)](https://github.com/achingbrain/ssdp/actions/workflows/js-test-and-release.yml?query=branch%3Amain)

> Yet another SSDP implementation for node.js

# About

<!--

!IMPORTANT!

Everything in this README between "# About" and "# Install" is automatically
generated and will be overwritten the next time the doc generator is run.

To make changes to this section, please update the @packageDocumentation section
of src/index.js or src/index.ts

To experiment with formatting, please run "npm run docs" from the root of this
repo and examine the changes made.

-->

First, import the module, call the function and set up an error handler:

```javascript
import ssdp from '@achingbrain/ssdp'

const bus = await ssdp()

// print error messages to the console
bus.on('error', console.error)
```

## Example - Find a service

Pass a `serviceType` to the `discover` method - when services are found events will be emitted:

```javascript
// this is the unique service name we are interested in:
const serviceType = 'urn:schemas-upnp-org:service:ContentDirectory:1'

for await (const service of bus.discover({ serviceType })) {
  // search for instances of a specific service
}

bus.on('service:discover', service => {
  // receive a notification about discovery of a service
})

bus.on('service:update', service => {
  // receive a notification when that service is updated - nb. this will only happen
  // after the service max-age is reached and if the service's device description
  // document has changed
})
```

## Example - Find all services

Don't pass any options to the `discover` method (n.b. you will also receive protocol related events):

```javascript
for await (const service of bus.discover()) {
  // receive a notification about all service types
}
```

## Example - Advertise a service

```javascript
// advertise a service

const advert = await bus.advertise({
  usn: 'urn:schemas-upnp-org:service:ContentDirectory:1',
  details: {
    URLBase: 'https://192.168.0.1:8001'
  }
})

// stop advertising a service
await advert.stop()
```

For full options, see [lib/advertise/parse-options.js](lib/advertise/parse-options.js)

## Integrate with existing HTTP servers

By default when you create an advertisement an HTTP server is created to serve the `details.xml` document that describes your service.  To use an existing server instead, do something like:

## Example - Hapi

```javascript
const advert = await bus.advertise({
  usn: 'urn:schemas-upnp-org:service:ContentDirectory:1',
  location: {
    udp4: 'http://192.168.0.1:8000/ssdp/details.xml'
  },
  details: {
    URLBase: 'https://192.168.0.1:8001'
  }
})

server.route({
  method: 'GET',
  path: '/ssdp/details.xml',
  handler: (request, reply) => {
    reply(advert.service.details())
      .type('text/xml')
  }
})
```

## Example - Express

```javascript
const advert = await bus.advertise({
  usn: 'urn:schemas-upnp-org:service:ContentDirectory:1',
  location: {
    udp4: 'http://192.168.0.1:8000/ssdp/details.xml'
  },
  details: {
    URLBase: 'https://192.168.0.1:8001'
  }
})

app.get('/ssdp/details.xml', async (request, response) => {
  response.set('Content-Type', 'text/xml')

  try {
    const details = await advert.service.details()
    response.send(details)
  } catch (err) {
    response.set('Content-Type', 'text/xml')
    response.send(err)
  }
})
```

## Example - Shutting down gracefully

`ssdp` opens several ports to communicate with other devices on your network, to shut them down, do something like:

```javascript
process.on('SIGINT',() => {
  // stop the server(s) from running - this will also send ssdp:byebye messages for all
  // advertised services however they'll only have been sent once the callback is
  // invoked so it won't work with process.on('exit') as you can only perform synchronous
  // operations there
  bus.stop(error => {
    process.exit(error ? 1 : 0)
  })
})
```

## Full API and options

```javascript
import ssdp from '@achingbrain/ssdp'

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
var serviceType = 'urn:schemas-upnp-org:service:ContentDirectory:1'

// search for one type of service
for await (const service of bus.discover({ serviceType })) {

}

bus.on('service:discover', service => {
  // receive a notification when a service of the passed type is discovered
})

bus.on('service:update', service => {
  // receive a notification when that service is updated
})

// search for all types of service
for await (const service of bus.discover()) {

}

// advertise a service
const advert = await bus.advertise({
  usn: 'a-usn', // unique service name
  interval: 10000, // how often to broadcast service adverts in ms
  ttl: 1800000, // how long the advert is valid for in ms
  ipv4: true, // whether or not to broadcast the advert over IPv4
  ipv6: true, // whether or not to broadcast the advert over IPv6
  location: { // where the description document(s) are available - omit to have an http server automatically created
    udp4: 'http://192.168.0.1/details.xml', // where the description document is available over ipv4
    udp6: 'http://FE80::0202:B3FF:FE1E:8329/details.xml' // where the description document is available over ipv6
  },
  details: { // the contents of the description document
    specVersion: {
      major: 1,
      minor: 1
    },
    URLBase: 'http://example.com',
    device: {
      deviceType: 'a-usn',
      friendlyName: 'A friendly device name',
      manufacturer: 'Manufactuer name',
      manufacturerURL: 'http://example.com',
      modelDescription: 'A description of the device',
      modelName: 'A model name',
      modelNumber: 'A vendor specific model number',
      modelURL: 'http://example.com',
      serialNumber: 'A device specific serial number',
      UDN: 'unique-identifier' // should be the same as the bus USN
      presentationURL: 'index.html'
    }
  }
})

// stop advertising a service
advert.stop()
```

## Device description document

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

Alternatively provide an descriptor object and let this module do the heavy lifting (n.b.
your object will be run through the [xml2js Builder](https://libraries.io/npm/xml2js#user-content-xml-builder-usage)):

```javascript
bus.advertise({
  usn: 'urn:schemas-upnp-org:device:Basic:1',
  details: {
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
  }
})
```

A random high port will be chosen, a http server will listen on that port and serve the descriptor and the `LOCATION`
header will be set appropriately in all `ssdp` messages.

The server will be shut down when you call `advert.stop`.

## I want to see all protocol messages

No problem, try this:

```javascript
bus.on('transport:outgoing-message', (socket, message, remote) => {
  console.info('-> Outgoing to %s:%s via %s', remote.address, remote.port, socket.type)
  console.info(message.toString('utf8'))
})
bus.on('transport:incoming-message', (message, remote) => {
  console.info('<- Incoming from %s:%s', remote.address, remote.port)
  console.info(message.toString('utf8'))
})
```

Alternatively see [test/fixtures/all.js](test/fixtures/all.js)

## References

- [LG SSDP discovery documentation](http://developer.lgappstv.com/TV_HELP/topic/lge.tvsdk.references.book/html/UDAP/UDAP/Discovery.htm)
- [UPnP overview](http://jan.newmarch.name/internetdevices/upnp/upnp.html)
- [UPnP device description](http://jan.newmarch.name/internetdevices/upnp/upnp-devices.html)
- [UPnP Device Architecture v1.1](http://upnp.org/specs/arch/UPnP-arch-DeviceArchitecture-v1.1.pdf)
- [diversario/node-ssdp](https://github.com/diversario/node-ssdp)
- [Xedecimal/node-ssdp](https://www.npmjs.com/package/ssdp) (no longer maintained)

# Install

```console
$ npm i @achingbrain/ssdp
```

# API Docs

- <https://achingbrain.github.io/ssdp>

# License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](https://github.com/achingbrain/ssdp/LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](https://github.com/achingbrain/ssdp/LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

# Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
