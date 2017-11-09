# spawn-run [![Build Status](https://secure.travis-ci.org/anuoua/spawn-command-npm.png)](http://travis-ci.org/anuoua/spawn-command-npm)

You can execute commands in `node_modules/.bin/` like npm run, return child_process.

## Installation

    npm install spawn-run --dev-save

## Usage
```js
var spawnRun = require('spawn-run'),
    child = spawnRun('echo "Hello spawn" | base64');

child.stdout.on('data', function (data) {
  console.log('data', data);
});

child.on('exit', function (exitCode) {
  console.log('exit', exitCode);
});
```
