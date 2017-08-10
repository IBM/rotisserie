
// dependencies
const express = require("express");
const tesseract = require("node-tesseract");
const multer = require("multer");
var path = require('path');
var uuid = require('uuid');
var upload = multer(); // for parsing multipart/form-data
var tmpdir = require('os').tmpdir(); // let the os take care of removing zombie tmp files
var fs = require('fs');


// construct express app
const app = express();

/**
 * Uses Tesseract OCR software to interpret the number in each cropped
 * screenshot created in cropScreenshots.
 * @callback {object} - object containing the name of the stream and its
 * associated number of players alive.
 * @param {string} cropsDir - Relative path to directory containing cropped
 * versions of all screenshots taken in takeScreenshot.
 * @param {string} file - filename of cropped screenshot to interpret. Gained
 * from readdirSync call in runner.
 * @param {requestCallback} callback - The callback that handles the response.
 */
function interpretCrop(cropsDir, file, callback) {
  const options = {
    psm: 8,
  };

  console.log("interpreting: " + __dirname + cropsDir.replace(".", "") + file);
  tesseract.process(__dirname + cropsDir.replace(".", "") + file, options,
    function(err, text) {
      let object = {};
      object.name = file.replace(".png", "");
      object.alive = text.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, "");
      if (object.alive && !isNaN(object.alive) && parseInt(object.alive, 10)) {
        return callback(object);
      }
    });
}

app.post('/process', upload.single('image'), function (req, res, next) {
  console.log(req.file);
  var output = path.resolve(tmpdir, 'ocr-svc-' + uuid.v4());
  fs.writeFile(output, req.file.buffer, function(err) {
    if(err) {
      return console.log(err);
    }
    console.log("The file was saved as " + output);
  });
  res.send("Neat!");
});


// start http server and log success
app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
