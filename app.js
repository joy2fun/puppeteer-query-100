const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();

let browser = null;
let page = null;

async function connect() {
  if (browser && browser.connected) {
    console.log('connected. skip');
    return ;
  }
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
  browser.once("disconnected", async () => {
    console.log('disconnected.');
  })
}

async function initPage() {
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
  } else {
    console.log("skip init page");
  }
}

app.get('/query', async (req, res) => {
  try {
    await connect();
    await initPage();
    const query = new Promise(resolve => {
      page.on('response', async response => {
        if (response.url().indexOf('query?type=') > 0) {
          page.removeAllListeners('response');
          resolve(await response.json());
        }
      });
    });
    await page.goto('https://www.kuaidi100.com/all/' + req.query.com + '.shtml?nu=' + req.query.nu);
    const json = await query;
    return res.json(json);
  } catch(e) {
    console.error(e);
    return res.end('error');
  }
});

app.listen(8080);
