import type { Advert } from './advertise/index.js'

export interface CachedAdvert {
  service: Advert
  stop(): Promise<void>
}

class Adverts {
  private adverts: CachedAdvert[]

  constructor () {
    this.adverts = []
  }

  add (advert: CachedAdvert): void {
    this.adverts.push(advert)
  }

  remove (advert: CachedAdvert): void {
    this.adverts = this.adverts.filter(ad => ad !== advert)
  }

  clear (): void {
    this.adverts = []
  }

  forEach (fn: (advert: Advert) => void): void {
    this.adverts.forEach(ad => { fn(ad.service) })
  }

  async stopAll (): Promise<void> {
    await Promise.all(
      this.adverts.map(async ad => ad.stop())
    )
  }
}

export const adverts = new Adverts()
