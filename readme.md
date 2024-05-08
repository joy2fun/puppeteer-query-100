
## env

```sh
# connect to remote browser
CHROME_ENDPOINT=ws://localhost:3000?token=YOUR_TOKEN
# express listen port
LISTEN_PORT=8080
```

## REPL
```sh
# launch local chrome, headful
export CHROME_ENDPOINT='/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
node -i -e "`cat app.js`"
```
