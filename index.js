const puppeteer = require('puppeteer');
const new_items = require('./items');
const fs = require('fs');
const path = require('path');
var json2csv = require('json2csv').parse;

//url

const url = 'https://www.germanfinecars.com/inventory/';

async function run() {
  //custom path for storing the cookies
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './data',
  });
  const page = await browser.newPage();
  console.log('working');
  await page.goto(url);
  await page.waitForTimeout(3000);
  let urls = await page.evaluate(() => {
    let results = [];
    //it'll give all the links for cars
    let items = document.querySelectorAll('.title_price > a');
    //to get the href from a tags
    items.forEach((item) => {
      results.push({
        url: item.getAttribute('href'),
        text: item.innerText,
      });
    });

    return results;
  });
  console.log(urls);

  //Now Loop through all the links and open one by one
  for (let i = 0; i < urls.length; i++) {
    let items = [];
    //conacating the urls
    let uri = 'https://www.germanfinecars.com' + urls[i].url;

    await page.goto(uri, { waitUntil: 'networkidle2' });
    // await page.waitForTimeout(3000)
    let item = new_items;
    //saving url into object
    item.url = uri;
    //Click on Spec to get all the specifications
    const spec = await page.$x(`//h3[contains(text(),'Specs')]`);
    await spec[0].click();

    //get price from xpath
    try {
      let [price] = await page.$x(`//h2[@class='price']`);
      item.Price = await page.evaluate((el) => el.innerText, price);
      item.Price = sanitizeInt(item.Price);
    } catch (error) {}

    //get year from xpath
    try {
      let [year] = await page.$x(
        `//td[contains(text(),'Year')]/../td[@class='info-value']`
      );
      item.Year = await page.evaluate((el) => el.textContent, year);
      item.Year = sanitizeInt(item.Year);
    } catch (error) {}

    //get make from xpath
    try {
      let [make] = await page.$x(
        `//td[contains(text(),'Make')]/../td[@class='info-value']`
      );
      item.MakeModel1 = await page.evaluate((el) => el.textContent, make);
      item.MakeModel1 = sanitizeString(item.MakeModel1);
      item.vMake = item.MakeModel1;
    } catch (error) {}

    //get model from xpath
    try {
      let [model] = await page.$x(
        `//td[contains(text(),'Model')]/../td[@class='info-value']`
      );
      item.MakeModel2 = await page.evaluate((el) => el.textContent, model);
      item.MakeModel2 = sanitizeString(item.MakeModel2);
      item.vModel = item.MakeModel2;
    } catch (error) {}

    //get kilemeters from xpath
    try {
      let [kilemeters] = await page.$x(
        `//td[contains(text(),'Kilometers')]/../td[@class='info-value']`
      );
      item.Kilometers = await page.evaluate((el) => el.textContent, kilemeters);
      item.Kilometers = sanitizeInt(item.Kilometers);
    } catch (error) {}

    //get Transmission from xpath
    try {
      let [Transmission] = await page.$x(
        `//td[contains(text(),'Transmission')]/../td[@class='info-value']`
      );
      item.Transmission = await page.evaluate(
        (el) => el.textContent,
        Transmission
      );
      item.Transmission = sanitizeString(item.Transmission);
    } catch (error) {}

    //get Engine from xpath
    try {
      let [Engine] = await page.$x(
        `//td[contains(text(),'Engine')]/../td[@class='info-value']`
      );
      item.Engine = await page.evaluate((el) => el.textContent, Engine);
      item.Engine = sanitizeString(item.Engine);
    } catch (error) {}

    //get Drivetrain from xpath
    try {
      let availbleTypes = {
        'All Wheel Drive': 'AWD',
        'Front Wheel Drive': 'FWD',
        'Rear Wheel Drive': 'RWD',
        '4 Wheel Drive': '4WD',
      };
      let [DriveType] = await page.$x(
        `//td[contains(text(),'Drivetrain')]/../td[@class='info-value']`
      );
      item.DriveType = await page.evaluate((el) => el.textContent, DriveType);
      item.DriveType = sanitizeString(
        availbleTypes[item.DriveType] || item.DriveType
      );
    } catch (error) {}

    //get Exterior color from xpath
    try {
      let [ExteriorColor] = await page.$x(
        `//td[contains(text(),'Exterior color')]/../td[@class='info-value']`
      );
      item.ExteriorColor = await page.evaluate(
        (el) => el.textContent,
        ExteriorColor
      );
      item.ExteriorColor = sanitizeString(item.ExteriorColor);
    } catch (error) {}

    //get Interior color from xpath
    try {
      let [InteriorColor] = await page.$x(
        `//td[contains(text(),'Interior color')]/../td[@class='info-value']`
      );
      item.InteriorColor = await page.evaluate(
        (el) => el.textContent,
        InteriorColor
      );
      item.InteriorColor = sanitizeString(item.InteriorColor);
    } catch (error) {}

    //get Doors from xpath
    try {
      let [Doors] = await page.$x(
        `//td[contains(text(),'Doors')]/../td[@class='info-value']`
      );
      item.Doors = await page.evaluate((el) => el.textContent, Doors);
      item.Doors = sanitizeString(item.Doors);
    } catch (error) {}

    //get stock number from xpath
    try {
      let [stock] = await page.$x(
        `//td[contains(text(),'Stock')]/../td[@class='info-value']`
      );
      item.StockNumber = await page.evaluate((el) => el.textContent, stock);
      item.StockNumber = sanitizeString(item.StockNumber);
    } catch (error) {}

    //get Fuel Type from xpath
    try {
      let [FuelType] = await page.$x(
        `//td[contains(text(),'Fuel Type')]/../td[@class='info-value']`
      );
      item.FuelType = await page.evaluate((el) => el.textContent, FuelType);
      item.FuelType = sanitizeString(item.FuelType);
    } catch (error) {}

    //get VIN from xpath
    try {
      let [vin] = await page.$x(
        `//td[contains(text(),'VIN')]/../td[@class='info-value']`
      );
      item.Vin = await page.evaluate((el) => el.textContent, vin);
      item.Vin = sanitizeString(item.Vin);
    } catch (error) {}

    //fetch all images src
    try {
      let imgs = await page.$x(`//div[contains(@class,"slick-active" )]//img`);
      let imgSrcs = await Promise.all(
        imgs.map(async (img) => {
          return await page.evaluate((el) => el.src, img);
        })
      );
      if (imgSrcs.length > 0) {
        //move first image to last in index
        imgSrcs.push(imgSrcs.shift());
      }
      imgSrcs = [...new Set(imgSrcs)];
      console.log(imgSrcs);
      let imgSrcsString = imgSrcs.join([(separator = ';')]);
      item.pictures = imgSrcsString.startsWith('data') ? '' : imgSrcsString;
    } catch (error) {}

    items.push(item);
    if (items.length > 0) {
      //add items to csv
      await write(Object.keys(items), items, `cars.csv`);
    }
    console.log(`${i + 1} Product Done`);
  }

  console.log('Site Done');
  function sanitizeString(str) {
    //remove \t and \n
    str = str.replace(/(\r\n|\n|\r|\t)/gm, '');
    //remove multiple spaces
    str = str.replace(/\s+/g, ' ');
    //remove leading and trailing spaces
    str = str.trim();
    return str;
  }

  function sanitizeInt(num) {
    num = num.replace(/[^0-9]/g, '');
    return num;
  }

  async function write(headersArray, dataJsonArray, fname) {
    const filename = path.join(__dirname, `${fname}`);
    let rows;
    // If file doesn't exist, we will create new file and add rows with headers.
    if (!fs.existsSync(filename)) {
      rows = json2csv(dataJsonArray, { header: true });
    } else {
      // Rows without headers.
      rows = json2csv(dataJsonArray, { header: false });
    }

    // Append file function can create new file too.
    fs.appendFileSync(filename, rows);
    // Always add new line if file already exists.
    fs.appendFileSync(filename, '\r\n');
  }

  browser.close();
}
run();
