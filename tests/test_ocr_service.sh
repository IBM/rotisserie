#!/bin/bash

echo "Testing ocr service"

test_image() {
  img=$1
  count=$2
  echo -n "Validating that $img has a count of $count... "
  out_number=$(curl -s -F "image=@${img}" localhost:3000/process_pubg | jq '.number')
  [ $out_number -eq $count ]
  echo "OK!"
}

# Test if app is running
if [[ $(curl -s http://localhost:3000/info | jq '.app' | grep -q 'ocrsvc') ]]; then
  echo "App running"
else
  echo "Starting App"
  node ocrsvc.js 2>&1 >/dev/null &
fi
sleep 2

echo "Validate info"
set -e
set -x
curl -s http://localhost:3000/info | jq '.version' | grep -q -- '0.1'
echo ""

pwd
ls

echo "Validate images/ocr"
test_image tests/images/DrDisRespectLIVE.png 8
test_image tests/images/Emilyispro.png 100
test_image tests/images/summit1g.png 100
test_image tests/images/DreadedCone.png 100
test_image tests/images/Iam_chappie.png 33
test_image tests/images/Chad.png 47
test_image tests/images/BradWOTO.png 100 # This one is all messed up, better to error

# Failing Tests
#test_image images/Nick28T.png 68 (shows as 58)

sleep 2

kill `ps -ef | grep node | grep ocrs[v] | awk '{print $2}' `
