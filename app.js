const express = require('express')
const app = express()

function main() {
  app.get('*', function (req, res) {
    res.sendFile(__dirname + '/public/index.html')
  })

  app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
  })
}

main();
