var store = {}

module.exports = {
  get: function (key, callback) {
    var value = null

    if (store[key]) {
      value = store[key].value
    }

    process.nextTick(callback.bind(null, null, value))
  },
  set: function (key, value, ttl, callback) {
    if (store[key]) {
      clearTimeout(store[key].timeout)
    }

    store[key] = {
      value: value,
      timeout: setTimeout(function () {
        delete store[key]
      }, ttl)
    }

    process.nextTick(callback)
  },
  drop: function (key, callback) {
    delete store[key]

    process.nextTick(callback)
  },
  all: function (callback) {
    var list = Object.keys(store).map(function (key) {
      return store[key].value
    })

    process.nextTick(callback.bind(null, null, list))
  },
  empty: function (callback) {
    Object.keys(store).forEach(function (key) {
      clearTimeout(store[key].timeout)
    })

    store = {}

    process.nextTick(callback)
  }
}
