import { parseStringPromise } from 'xml2js'
import { fetch } from '../fetch.js'

export async function resolveLocation (location: string) {
  if (location.substring(0, 4) !== 'http') {
    location = `http://${location}`
  }

  const text = await fetch(location, {
    method: 'GET',
    headers: {
      accept: 'application/xml'
    }
  })
  const result = await parseStringPromise(text, {
    normalize: true,
    explicitArray: false,
    explicitRoot: true
  })

  if (result == null) {
    return {}
  }

  return result.root ?? result
}
