## Rotisserie OCR Microservice

## Overview

The Rotisserie application makes use of a separate Object Character Recognition
microservice, which runs in its own standalone container (or just on a separate
port if running the entire application on a single machine) and responds to
HTTP POST requests containing a picture of a number. The value of this number
is returned back to the sender as plaintext.

## ocr.js

**node.js libraries used**:
  * express
  * node-tesseract
  * multer
  * path
  * uuid
  * fs
  * tmpdir

**external dependencies used**:
  * tesseract

There are three available endpoints to hit in the OCR microservice. They are
available over HTTP with the help of express.js.

### info

Making a request to the `/info` endpoint is just a simple health check to make
sure the service is alive:

```
app.get("/info", function(req, res) {
  result = {
    "app": "ocr",
    "version": "0.1",
    "health": "good",
  };
  res.json(result);
});
```

### process

Process is an endpoint which can be used to detect text outside the context of
PlayerUnknown's BattleGrounds. It was used in the development of the `process_pubg`
endpoint and is not currently used by `app.js`:

```
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
```

### process_pubg

This is the endpoint which `app.js` makes use of to determine the number of players
alive in a given game. It receives an image via an HTTP POST request, and uses
the node.js tesseract wrapper `node-tesseract` to interpret the number present
in the image. If a NaN is detected, or if the number is not an integer between
0 and 100, the number is interpreted to be 100 to ensure its associated stream
will be sent to the bottom of the list. This is usually a result of the streamer
not being in game or otherwise obscuring their number of players alive.

```
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
```
