
module.exports = function detailsHandler (createDetails, request, response) {
  createDetails(function (error, details) {
    if (error) {
      response.writeHead(500)
      return response.end(error)
    }

    response.writeHead(200, {'Content-Type': 'text/xml'})
    response.end(details)
  })
}
