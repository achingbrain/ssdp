import type { Service } from './index.js'

class Cache {
  // service type => unique service name => service
  private services: Map<string, Map<string, Service>>

  constructor () {
    this.services = new Map()
  }

  hasService (serviceType: string, uniqueServiceName: string) {
    const instances = this.services.get(serviceType)

    if (instances == null) {
      return false
    }

    return instances.has(uniqueServiceName)
  }

  getService (serviceType: string, uniqueServiceName: string) {
    const instances = this.services.get(serviceType)

    if (instances == null) {
      return undefined
    }

    const service = instances.get(uniqueServiceName)

    if (service == null) {
      return
    }

    return service
  }

  deleteService (serviceType: string, uniqueServiceName: string) {
    const instances = this.services.get(serviceType)

    if (instances == null) {
      return
    }

    instances.delete(uniqueServiceName)

    if (instances.size === 0) {
      this.services.delete(serviceType)
    }
  }

  cacheService (service: Service) {
    const instances = this.services.get(service.serviceType) ?? new Map()
    instances.set(service.uniqueServiceName, service)

    this.services.set(service.serviceType, instances)
  }

  clear () {
    this.services = new Map()
  }
}

export const cache = new Cache()
