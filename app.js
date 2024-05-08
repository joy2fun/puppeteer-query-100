const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();

let browser = null;
let page = null;

async function connect() {
  if (browser && browser.connected) {
    console.log('connected. skip');
    await initPage();
    return ;
  }
  console.log("connecting to :" + process.env.CHROME_ENDPOINT);
  browser = await puppeteer.connect({
    browserWSEndpoint: process.env.CHROME_ENDPOINT
  });
  browser.once("disconnected", async () => {
    console.log('disconnected. close browser');
    try {
      await browser.close();
    } catch (e) {

    }
  })
  await initPage();
}

async function initPage() {
  if (!page || page.isClosed() || page.mainFrame().isDetached()) {
    console.log("init page");
    page = await browser.newPage();
    page.once("close", () => {
      console.log("page closed");
      page = null;
    })
  } else {
    console.log("skip init page");
  }
}

(async () => {await connect();})();

app.get('/query', async (req, res) => {
  try {
    await connect();
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
