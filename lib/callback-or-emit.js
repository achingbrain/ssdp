
module.exports = function (ssdp, callback) {
  return callback || function (error) {
    if (error) {
      ssdp.emit('error', error)
    }
  }
}
