
// dependencies
const express = require("express");
const tesseract = require("node-tesseract");
const multer = require("multer");
var path = require('path');
var uuid = require('uuid');
var upload = multer(); // for parsing multipart/form-data
var tmpdir = require('os').tmpdir(); // let the os take care of removing zombie tmp files
var fs = require('fs');
const app = express();


app.post('/process', upload.single('image'), function (req, res, next) {
  console.log(req.file);
  var output = path.resolve(tmpdir, 'ocr-svc-' + uuid.v4());
  fs.writeFile(output, req.file.buffer, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved as " + output);
  });
  const options = {
    psm: 8,
  };
  tesseract.process(output, options, function(err, text) {
    result = "Detected Text: " + text.trim() + "\n";
    console.log(result);
    res.send(result);
  });
});


// start http server and log success
app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
