// @ts-expect-error https://github.com/schnittstabil/merge-options/pull/28
import mergeOptions from 'merge-options'
import xml2js from 'xml2js'
import type { Advert } from './index.js'
import type { Advertisement, SSDP } from '../index.js'

export function parseAdvertOptions (ssdp: SSDP, options: Advertisement): Advert {
  if (options == null) {
    throw new Error('Empty advert passed')
  }

  if (options.usn == null) {
    throw new Error('Advert should have a usn property')
  }

  const opts: Advert = mergeOptions({
    usn: options.usn,
    interval: 10000,
    ttl: 1800000,
    ipv4: true,
    ipv6: true,
    location: null,
    details: {
      $: {
        xmlns: 'urn:schemas-upnp-org:device-1-0'
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
  }, options)

  const details = opts.details

  opts.details = async () => {
    return new Promise((resolve, reject) => {
      try {
        const builder = new xml2js.Builder()
        resolve(builder.buildObject(details))
      } catch (error: any) {
        reject(error)
      }
    })
  }

  return opts
}
