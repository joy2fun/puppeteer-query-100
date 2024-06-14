const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();

let browser = null;

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
}

async function initPage() {
  const page = await browser.newPage();
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
  return page;
}

function closePage(page)
{
  try {
    if (page && !page.isClosed()) page.close();
  } catch (e) {
  }
}

async function query(url) {
  await init();
  let timer = 0;
  const page = await initPage();
  const queryPromise = new Promise (resolve => {
    page.on('response', async response => {
      if (response.url().includes('query?type=')) {
        page.removeAllListeners('response');
        resolve(await response.json());
        setTimeout(() => {
          closePage(page);
        }, 5000);
        clearTimeout(timer);
      }
    });
    timer = setTimeout(async () => {
      resolve({timeout: true});
      closePage(page);
    }, 20000);
  });
  page.goto(url);
  return queryPromise;
}

app.get('/query', async (req, res) => {
  try {
    return res.json(await query('https://www.kuaidi100.com/all/' + req.query.com + '.shtml?nu=' + req.query.nu));
  } catch (e) {
    console.error(e);
    return res.end('error');
  }
});

if (process.env.LISTEN_PORT) app.listen(process.env.LISTEN_PORT);