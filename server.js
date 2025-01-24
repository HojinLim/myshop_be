const http = require('http');

const PORT = 5000;
const server = http.createServer();

server.listen(5000, function () {
  console.log(`Server is running... on port${PORT}`);
});
