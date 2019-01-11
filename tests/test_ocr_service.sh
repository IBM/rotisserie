#!/bin/bash
set -Eux
set -o pipefail
trap "exit 1" ERR

echo "Testing OCR service"

test_image() {
  img=$1
  count=$2
  echo -n "Validating that $img has a count of $count... "
  out_number=$(curl -s -F "image=@${img}" localhost:3001/process_pubg | jq '.number')
  [ $out_number -eq $count ]
  echo "OK!"
}

# Test if app is running
sleep 10
if ! $(curl -s http://localhost:3001/info | jq '.app' | grep -q 'ocr'); then
    echo "OCR application is not running."
    exit 1
fi

echo "Validate version"
curl -s http://localhost:3001/info | jq '.version' | grep -q -- '0.3'
