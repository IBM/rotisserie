#!/bin/bash

function dep_check() {
  if ! type "$1" > /dev/null; then
    echo "ERROR Dependency not satisfied: $1"
    exit 1
  fi
}

function npm_check() {
  local package="$1"
  local result=$(npm list | grep "$package" | cut -d' ' -f2 | sed 's/\@..*//')

  if [[ -z "$result" ]]; then
    echo "ERROR npm dependency not satisfied: $1"
    exit 1
  fi
}

function var_check() {
  local var_name="$1"
  if [[ -z "${!1}" ]]; then
    echo "ERROR Need to set environment variable: $var_name"
    exit 1
  fi
}

function ensure_deps() {
  var_check client_id
  var_check client_secret
  dep_check convert
  dep_check ffmpeg
  dep_check identify
  dep_check jq
  dep_check node
  dep_check timeout
  npm_check express
}

function main() {
  ensure_deps

  # start javascript app
  node app.js
}

main "$@"
