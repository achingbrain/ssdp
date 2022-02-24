import type { Advert } from './advertise/index.js'

export interface CachedAdvert {
  service: Advert
  stop: () => Promise<void>
}

class Adverts {
  private adverts: CachedAdvert[]

  constructor () {
    this.adverts = []
  }

  add (advert: CachedAdvert) {
    this.adverts.push(advert)
  }

  remove (advert: CachedAdvert) {
    this.adverts = this.adverts.filter(ad => ad !== advert)
  }

  clear () {
    this.adverts = []
  }

  forEach (fn: (advert: Advert) => void) {
    this.adverts.forEach(ad => fn(ad.service))
  }

  async stopAll () {
    await Promise.all(
      this.adverts.map(async ad => await ad.stop())
    )
  }
}

export const adverts = new Adverts()
