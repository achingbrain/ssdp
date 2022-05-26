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
  start: boolean
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

  'service:discover': (service: Service) => void
  'service:update': (service: Service) => void
  'service:remove': (usn: string) => void

  'error': (err: Error) => void
}

export interface Service<DeviceDescription = Record<string, any>> {
  location: URL
  details: DeviceDescription
  expires: number
  serviceType: string
  uniqueServiceName: string
}

export interface Advertisment {
  usn: string
  details: Record<string, any> | (() => Promise<Record<string, any>>)
}

export interface SSDP {
  /**
   * Unique device name - identifies the device and must the same over time for a specific device instance
   */
  udn: string

  /**
   * A user-agent style string to identify the implementation
   */
  signature: string

  /**
   * Currently open sockets
   */
  sockets: SSDPSocket[]

  /**
   * Options passed to the constructor
   */
  options: SSDPOptions

  start: () => Promise<void>
  stop: () => Promise<void>

  advertise: (advert: Advertisment) => Promise<CachedAdvert>
  discover: <Details = Record<string, any>> (serviceType?: string) => AsyncIterable<Service<Details>>

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
  private readonly abortController: AbortController

  constructor (options?: Partial<SSDPOptions>) {
    super()

    this.options = defaultSsdpOptions(options)
    this.udn = this.options.udn
    this.signature = this.options.signature
    this.sockets = []
    this.abortController = new AbortController()
  }

  async start () {
    // set up UDP sockets listening for SSDP broadcasts
    this.sockets = await createSockets(this, this.abortController.signal)

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

    this.abortController.abort()
  }

  async advertise (advert: Advertisment): Promise<CachedAdvert> {
    return await advertise(this, advert)
  }

  async * discover <Details = Record<string, any>> (serviceType?: string) {
    const iterator = new EventIterator<Service<Details>>(
      ({ push }) => {
        const listener = (service: Service<Details>) => {
          if (serviceType != null && service.serviceType !== serviceType) {
            return
          }

          push(service)
        }

        this.addListener('service:discover', listener)

        return () => {
          this.removeListener('service:discover', listener)
        }
      }
    )

    discover(this, serviceType)

    yield * iterator
  }
}

export default async function (options: Partial<SSDPOptions> = {}): Promise<SSDP> {
  const ssdp = new SSDPImpl(options)

  if (options.start !== false) {
    await ssdp.start()
  }

  return ssdp
}
