// dependencies
const express = require("express");
const tesseract = require("node-tesseract");
const multer = require("multer");
const path = require("path");
const uuid = require("uuid");
const upload = multer(); // for parsing multipart/form-data

// let the os take care of removing zombie tmp files
const tmpdir = require("os").tmpdir();
const fs = require("fs");
const app = express();

const options = {
  psm: 8,
};

app.get("/info", function(req, res) {
  result = {
    "app": "ocr",
    "version": "0.1",
    "health": "good",
  };
  res.json(result);
});

app.post("/process", upload.single("image"), function(req, res, next) {
  console.log(req.file);
  let output = path.resolve(tmpdir, "ocr-svc-" + uuid.v4());
  fs.writeFile(output, req.file.buffer, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved as " + output);
  });

  tesseract.process(output, options, function(err, text) {
    result = "Detected Text: " + text.trim() + "\n";
    console.log(result);
    res.send(result);
  });
});

app.post("/process_pubg", upload.single("image"), function(req, res, next) {
  console.log(req.file);
  let output = path.resolve(tmpdir, "ocr-svc-" + uuid.v4());
  fs.writeFile(output, req.file.buffer, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved as " + output);
  });

  tesseract.process(output, options, function(err, text) {
    if (err) {
      res.json({"number": 100});
      console.log(
        "Tesseract failed to process file: %s with error: %s", output, err
      );
    } else {
      let number = parseFloat(text.trim());
      // Return any garbage as 100 (dead, out of game, etc)
      if (isNaN(number)) {
        number = 100;
      }
      // Return <0 as 100. 0 isn't possible and it is usually a 100
      if (number <= 0) {
        number = 100;
      }
      let result = {
        "number": number,
      };
      // console.log(result);
      res.json(result);
      fs.unlink(output);
    }
  });
});


// start http server and log success
app.listen(3001, function() {
  console.log("OCR service listening on port 3001!");
});
