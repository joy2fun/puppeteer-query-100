const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();

let browser = null;
let page = null;

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
        url.includes('.gif') ||
        url.includes('.do?')
      )
        ir.abort();
      else ir.continue();
    });
  }
}

async function query(url) {
  const queryPromise = new Promise (resolve => {
    page.on('response', async response => {
      if (response.url().includes('query?type=')) {
        page.removeAllListeners('response');
        resolve(await response.json());
      }
    });
  });
  page.goto(url);
  return queryPromise;
}

app.get('/query', async (req, res) => {
  try {
    await init();
    return res.json(await query('https://www.kuaidi100.com/all/' + req.query.com + '.shtml?nu=' + req.query.nu));
  } catch (e) {
    console.error(e);
    return res.end('error');
  }
});

if (process.env.LISTEN_PORT) app.listen(process.env.LISTEN_PORT);