import { cache } from '../cache.js'
import { resolveLocation } from './resolve-location.js'
import type { SSDP, Service } from '../index.js'

export async function resolveService (ssdp: SSDP, usn: string, st: string, location: string, ttl: number): Promise<void> {
  // all arguments are required
  if (ssdp == null || usn == null || st == null || location == null || ttl == null) {
    return
  }

  let newService = false
  let service: Service<Record<string, any>> | undefined

  if (ssdp.options.cache) {
    service = cache.getService(st, usn)
  }

  if (service == null) {
    newService = true
    service = {
      location: new URL(location),
      details: {
        pending: true
      },
      expires: 0,
      serviceType: st,
      uniqueServiceName: usn
    }

    if (ssdp.options.cache) {
      cache.cacheService(service)
    }
  }

  if (!newService) {
    if (service.details.pending === true) {
      // not yet loaded the advert details
      return
    }
  }

  let oldDetails = null

  if (!newService) {
    oldDetails = JSON.stringify(service.details)
  }

  try {
    service.details = await resolveLocation(location)
    service.expires = Date.now() + ttl

    if (ssdp.options.cache) {
      cache.cacheService(service)
    }

    if (oldDetails === JSON.stringify(service.details)) {
      // details have not changed, ignore the notify
      return
    }

    if (newService) {
      ssdp.emit('service:discover', service)
    } else {
      ssdp.emit('service:update', service)
    }
  } catch (err: any) {
    if (ssdp.options.cache) {
      // remove it so we can try again later
      cache.deleteService(st, usn)
    }

    ssdp.emit('error', err)
  }
}
