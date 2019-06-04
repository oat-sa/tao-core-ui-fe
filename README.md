# tao-core-ui-fe
TAO Frontend UI Components

UI libraries of TAO.

Available scripts in the project:

- `HOST=<host> PORT=<port> npm run test <testname>`: run test suite
  - `HOST` (optional environment variable, default: 127.0.0.1): Test server listen host
  - `PORT` (optional environment variable, default: 8082): Test server listen port
  - `testname` (optional): Specific test to run. If it is not provided, all will be ran.
- `HOST=<host> PORT=<port> npm run test:keepAlive`: start test server
  - `HOST` (optional environment variable, default: 127.0.0.1): Test server listen host
  - `PORT` (optional environment variable, default: 8082): Test server listen port
- `npm run build`: build for production into `dist` directory
- `npm run buildScss`: build `scss` files to `css` files
- `npm run lint`: check syntax of code