#!/bin/sh
set -e
npm run build
yarn migration:run
npm run start
