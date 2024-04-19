var http = require('http')
var port = process.env.PORT || 8080;

http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<h1>HTML Template</h1>");
    res.write("<p>Hello World!</p>");
    res.end()
}).listen(port)

