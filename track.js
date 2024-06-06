const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();

let browser = null;
let page = null;

if (process.env.ENABLE_LOGIN) {
  login(process.env.TRACK_USERNAME || 'php@html.js.cn', process.env.TRACK_PASSWORD || '');
}

async function init() {
  if (!browser || !browser.connected) {
    console.log("connecting to :" + process.env.CHROME_ENDPOINT);
    if (process.env.CHROME_ENDPOINT.includes('ws://')) {
      browser = await puppeteer.connect({
        browserWSEndpoint: process.env.CHROME_ENDPOINT
      });
    } else {
      browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.CHROME_ENDPOINT
      });
    }
  }
  await initPage();
}

async function initPage() {
  await browser.pages().then(r => {
    if (r.length) page = r[0];
  })
  if (!page || page.isClosed() || page.mainFrame().isDetached()) {
    console.log("init page");
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', ir => {
      if (ir.isInterceptResolutionHandled()) return;
      let url = ir.url();
      if (
        url.includes('.png') ||
        url.includes('.jpg') ||
        url.includes('.gif')
      )
        ir.abort();
      else ir.continue();
    });
  }
}

async function query(url) {
  const queryPromise = new Promise (resolve => {
    page.on('response', async response => {
      if (response.url().includes('track/restapi')) {
        page.removeAllListeners('response');
        resolve(await response.json());
      }
    });

    setTimeout(async () => {
      const hasVerCode = await page.$('#ver-code-input') !== null;
      resolve(hasVerCode ? {varCode: true} : {timeout: true});
    }, 20000);
  });

  page.goto(url+'&t='+Math.random());
  return queryPromise;
}

async function login(email, pass) {
  await init();
  await page.goto('https://user.17track.net/zh-cn');
  await page.type('input[name="yq_login_name"]', email);
  await page.type('input[name="yq_login_pwd"]', pass);
  await page.click('#yq-login-submit');
}

app.get('/screenshot', async (req, res) => {
  try {
    const hasVerCode = await page.$('#ver-code-input') !== null;

    if (!hasVerCode) {
      // return res.status(411).end('ok');
    } else {
      await page.click('button[data-yq-events="requestCode"]');
    }

    const screenshot = await page.screenshot();
    res.set('Content-Type', 'image/png');
    return res.send(screenshot);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error capturing screenshot');
  }
});

app.get('/ver', async (req, res) => {
  try {
    await page.type('#ver-code-input', req.query.code);
    await page.click('button[data-yq-events="submitCode"]');
  } catch (err) {
    console.error(err);
    return res.status(500).send('var error');
  }
});

app.get('/query', async (req, res) => {
  try {
    await init();
    return res.json(await query('https://t.17track.net/zh-cn#nums=' + req.query.nu + '&fc=' + req.query.com));
  } catch (e) {
    console.error(e);
    return res.end('error');
  }
});

if (process.env.LISTEN_PORT) app.listen(process.env.LISTEN_PORT);