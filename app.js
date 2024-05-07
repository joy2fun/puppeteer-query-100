const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();

console.log(process.env.CHROME_ENDPOINT);

app.get('/query', async (req, res) => {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: process.env.CHROME_ENDPOINT
    });
    const page = await browser.newPage();
    const query = new Promise(resolve => {
      page.on('response', async response => {
        if (response.url().indexOf('query?type=') > 0) {
          resolve(await response.json());
        }
      });
    });
    await page.goto('https://www.kuaidi100.com/all/' + req.query.com + '.shtml?nu=' + req.query.nu);
    const json = await query;
    browser.close();
    return res.json(json);
  } catch(e) {
    console.error(e);
    return res.end('error');
  }
});

app.listen(8080);
