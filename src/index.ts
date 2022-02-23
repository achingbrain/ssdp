import { EventEmitter } from 'events'
import { defaultSsdpOptions } from './default-ssdp-options.js'
import { createSockets } from './create-sockets.js'
import { advertise } from './advertise/index.js'
import { discover } from './discover/index.js'
import { notify } from './commands/notify.js'
import { search } from './commands/search.js'
import { searchResponse } from './discover/search-response.js'
import { adverts, CachedAdvert } from './adverts.js'
import { parseSsdpMessage } from './parse-ssdp-message.js'
import { sendSsdpMessage } from './send-ssdp-message.js'
import { EventIterator } from 'event-iterator'
import type { Socket } from 'dgram'

export interface NetworkAddress {
  address: string
  port: number
}

export interface SSDPSocketOptions {
  type: 'udp4' | 'udp6'
  broadcast: NetworkAddress
  bind: NetworkAddress
  maxHops: number
}

export interface SSDPOptions {
  udn: string
  signature: string
  sockets: SSDPSocketOptions[]
}

export interface SSDPSocket extends Socket {
  type: 'udp4' | 'udp6'
  closed: boolean
  options: SSDPSocketOptions
}

export interface NotfiyMessage {
  LOCATION: string
  USN: string
  NT: string
  NTS: 'ssdp:alive' | 'ssdp:byebye'
  ttl: () => number
}

export interface SearchMessage {
  LOCATION: string
  USN: string
  ST: string
  ttl: () => number
}

interface SSDPEvents {
  'transport:incoming-message': (buffer: Buffer, from: NetworkAddress) => void
  'transport:outgoing-message': (socket: SSDPSocket, buffer: Buffer, to: NetworkAddress) => void
  'ssdp:send-message': (status: string, headers: Record<string, any>, to?: NetworkAddress) => void
  'ssdp:m-search': (message: SearchMessage, from: NetworkAddress) => void
  'ssdp:notify': (message: NotfiyMessage, from: NetworkAddress) => void
  'ssdp:search-response': (message: SearchMessage, from: NetworkAddress) => void

  'service:discover': (service: DiscoveredService) => void
  'service:update': (service: DiscoveredService) => void
  'service:remove': (usn: string) => void

  'error': (err: Error) => void
}

export interface DiscoveredService {
  details: Record<string, any>
  expires: number
  ST: string
  UDN: string
}

export interface Advertisment {
  usn: string
  details: Record<string, any> | (() => Promise<Record<string, any>>)
}

export interface SSDP {
  udn: string
  signature: string
  sockets: SSDPSocket[]
  options: SSDPOptions

  start: () => Promise<void>
  stop: () => Promise<void>

  advertise: (advert: Advertisment) => Promise<CachedAdvert>
  discover: (serviceType?: string) => AsyncIterable<DiscoveredService>

  // events
  on: <U extends keyof SSDPEvents>(
    event: U, listener: SSDPEvents[U]
  ) => this
  off: <U extends keyof SSDPEvents>(
    event: U, listener: SSDPEvents[U]
  ) => this
  once: <U extends keyof SSDPEvents>(
    event: U, listener: SSDPEvents[U]
  ) => this
  emit: <U extends keyof SSDPEvents>(
    event: U, ...args: Parameters<SSDPEvents[U]>
  ) => boolean
}

class SSDPImpl extends EventEmitter implements SSDP {
  public udn: string
  public signature: string
  public sockets: SSDPSocket[]
  public readonly options: SSDPOptions

  constructor (options?: Partial<SSDPOptions>) {
    super()

    this.options = defaultSsdpOptions(options)
    this.udn = this.options.udn
    this.signature = this.options.signature
    this.sockets = []
  }

  async start () {
    // set up UDP sockets listening for SSDP broadcasts
    this.sockets = await createSockets(this)

    // set up protocol listeners
    this.on('transport:incoming-message', parseSsdpMessage.bind(null, this))
    this.on('ssdp:send-message', sendSsdpMessage.bind(null, this))
    this.on('ssdp:m-search', search.bind(null, this))
    this.on('ssdp:notify', notify.bind(null, this))
    this.on('ssdp:search-response', searchResponse.bind(null, this))
  }

  async stop () {
    await adverts.stopAll()

    await Promise.all(
      this.sockets.map(async socket => {
        return await new Promise<void>(resolve => {
          socket.on('close', () => resolve())
          socket.close()
          socket.closed = true
        })
      })
    )
  }

  async advertise (advert: Advertisment): Promise<CachedAdvert> {
    return await advertise(this, advert)
  }

  async * discover (serviceType?: string) {
    const iterator = new EventIterator<DiscoveredService>(
      ({ push, stop, fail }) => {
        this.addListener('service:discover', push)

        return () => {
          this.removeListener('service:discover', push)
        }
      }
    )

    discover(this, serviceType)

    yield * iterator
  }
}

export default async function (options?: Partial<SSDPOptions>): Promise<SSDP> {
  const ssdp = new SSDPImpl(options)

  await ssdp.start()

  return ssdp
}
