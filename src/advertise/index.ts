import type { Advertisment, SSDP } from '../index.js'
import { adverts, CachedAdvert } from '../adverts.js'
import { parseAdvertOptions } from './parse-options.js'
import { broadcastAdvert } from './broadcast-advert.js'
import { createLocation } from './create-location.js'
import { BYEBYE, ALIVE } from '../commands/notify.js'

export interface Advert {
  usn: string
  interval: number
  ttl: number
  ipv4: boolean
  ipv6: boolean
  location: Record<string, string>
  details: () => Promise<any>
}

export async function advertise (ssdp: SSDP, options: Advertisment): Promise<CachedAdvert> {
  const advert = parseAdvertOptions(ssdp, options)
  const shutDownServers = await createLocation(ssdp, advert)
  let timeout: NodeJS.Timeout

  const broadcast = () => {
    broadcastAdvert(ssdp, advert, ALIVE)

    timeout = setTimeout(broadcast, advert.interval)
  }

  // send ssdp:byebye then ssdp:alive
  // see: https://msdn.microsoft.com/en-us/library/cc247331.aspx
  broadcastAdvert(ssdp, advert, BYEBYE)
  broadcast()

  const ad = {
    service: advert,
    stop: async () => {
      clearTimeout(timeout)

      // tell the network we are going away
      broadcastAdvert(ssdp, advert, BYEBYE)

      await shutDownServers()

      // remove advert from list
      adverts.remove(ad)
    }
  }

  adverts.add(ad)

  return ad
}
