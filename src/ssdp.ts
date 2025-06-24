import { EventEmitter, on } from 'node:events'
import { createRequire } from 'node:module'
import { advertise } from './advertise/index.js'
import { adverts } from './adverts.js'
import { notify } from './commands/notify.js'
import { search } from './commands/search.js'
import { createSockets } from './create-sockets.js'
import { defaultSsdpOptions } from './default-ssdp-options.js'
import { discover } from './discover/index.js'
import { searchResponse } from './discover/search-response.js'
import { parseSsdpMessage } from './parse-ssdp-message.js'
import { sendSsdpMessage } from './send-ssdp-message.js'
import type { CachedAdvert } from './adverts.js'
import type { Advertisement, DiscoverOptions, Service, SSDP as SSDPInterface, SSDPOptions, SSDPSocket } from './index.js'

const req = createRequire(import.meta.url)
const { name, version } = req('../../package.json')

const DEFAULT_SSDP_SIGNATURE = `node.js/${process.version.substring(1)} UPnP/1.1 ${name}/${version}`

export class SSDP extends EventEmitter implements SSDPInterface {
  public udn: string
  public signature: string
  public sockets: SSDPSocket[]
  public readonly options: SSDPOptions
  private readonly abortController: AbortController

  constructor (options?: SSDPOptions) {
    super()

    this.options = defaultSsdpOptions(options)
    this.udn = this.options.udn ?? `uuid:${crypto.randomUUID()}`
    this.signature = this.options.signature ?? DEFAULT_SSDP_SIGNATURE
    this.sockets = []
    this.abortController = new AbortController()
  }

  async start (): Promise<void> {
    // set up UDP sockets listening for SSDP broadcasts
    this.sockets = await createSockets(this, this.abortController.signal)

    // set up protocol listeners
    this.on('transport:incoming-message', parseSsdpMessage.bind(null, this))
    this.on('ssdp:send-message', sendSsdpMessage.bind(null, this))
    this.on('ssdp:m-search', search.bind(null, this))
    this.on('ssdp:notify', notify.bind(null, this))
    this.on('ssdp:search-response', searchResponse.bind(null, this))
  }

  async stop (): Promise<void> {
    await adverts.stopAll()

    await Promise.all(
      this.sockets.map(async socket => {
        await new Promise<void>(resolve => {
          socket.on('close', () => { resolve() })
          socket.close()
          socket.closed = true
        })
      })
    )

    this.abortController.abort()
  }

  async advertise (advert: Advertisement): Promise<CachedAdvert> {
    return advertise(this, advert)
  }

  async * discover <Details = Record<string, any>> (serviceType?: string | DiscoverOptions): AsyncGenerator<Service<Details>, void, any> {
    const opts: DiscoverOptions | undefined = typeof serviceType === 'string' ? { serviceType } : serviceType

    discover(this, opts?.serviceType)

    let interval: ReturnType<typeof globalThis.setInterval> | undefined

    if (opts?.searchInterval != null) {
      interval = setInterval(() => {
        discover(this, opts?.serviceType)
      }, opts.searchInterval)
    }

    try {
      for await (const [service] of on(this, 'service:discover', opts)) {
        yield service
      }
    } finally {
      clearInterval(interval)
    }
  }
}
