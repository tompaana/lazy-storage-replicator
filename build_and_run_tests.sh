#!/bin/bash
npm install # --save-dev @types/azure
LOG_LEVEL=info NODE_ENV=local-dev ./node_modules/.bin/nodeunit ./test/multi-storage-client-test.js
