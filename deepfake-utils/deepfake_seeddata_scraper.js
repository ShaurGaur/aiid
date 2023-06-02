const puppeteer = require('puppeteer');

// const { convertArrayToCSV } = require('convert-array-to-csv');
const fs = require('fs');

const url = require('url');

const csv = require('csv-parser');

const { ObjectId } = require('mongodb');

// var header = ["_id","incident_id","authors"	,"date_downloaded",
// 'date_modified',	'date_published'	,'date_submitted'	,'description'	,'epoch_date_downloaded',
// 'epoch_date_modified'	,'epoch_date_published',	'epoch_date_submitted',	'media_url',	'language',	'ref_number'
// ,'report_number',	'source_domain',	'submitters',	'text'	,'title',	'url',	'tags'];

var report_number = 0;

var data_box = [];

const date = '4/9/2023';

function extractDomain(urlString) {
  const parsedUrl = url.parse(urlString);

  const domain = parsedUrl.hostname;

  return domain;
}

async function scrapeWebpage(url, data_arrays) {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.goto(url);

  // Wait for the first batch of content to load
  await page.waitForSelector('div[role="listitem"].collection-item.w-dyn-item');

  let deepfake_cards = await page.$$('div[role="listitem"].collection-item.w-dyn-item');

  // Scroll down the page and wait for more content to load

  let shouldScroll = true;

  while (shouldScroll) {
    var oldLength = deepfake_cards.length;

    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(2000); // Wait for new content to load
    deepfake_cards = await page.$$('div[role="listitem"].collection-item.w-dyn-item');
    if (deepfake_cards.length === oldLength) {
      break; // Stop scrolling when no more content is loaded
    }
  }

  // iterate through each card.
  for (const card of deepfake_cards) {
    report_number = report_number + 1;

    // grap the tile of each card

    var card_title = '';

    const titleElements = await card.$$('.heading-large');

    if (titleElements.length > 0) {
      const title = titleElements[0];

      const title_text = await title.getProperty('textContent');

      card_title = await title_text.jsonValue();
    }

    // grab the article  from each card.
    var url_link = '';

    const articleElements = await card.$$('div.modal-content a');

    if (articleElements.length > 0) {
      // get the link that is at the bottome of each model
      const link = articleElements[articleElements.length - 2];

      const href = await link.getProperty('href');

      url_link = await href.jsonValue();
    }

    var url_domain = extractDomain(url_link);

    var text_incident = '';

    // grab the descrption from each card.
    const paraElements = await card.$$('div.article-richtext.w-richtext p');

    if (paraElements.length > 0) {
      // get the link that is at the bottome of each model
      const elementText = paraElements[0];

      const card_text = await elementText.getProperty('textContent');

      text_incident = await card_text.jsonValue();
    }

    var media_link = '';

    const newRow = {
      _id: '',
      incident_id: '',
      authors: ['Anonymous'],
      date_downloaded: date,
      date_modified: date,
      date_published: '',
      date_submitted: date,
      description: text_incident,
      epoch_date_downloaded: 1681110000,
      epoch_date_modified: 1681110000,
      epoch_date_published: '',
      epoch_date_submitted: 1681110000,
      media_url: media_link,
      language: 'en',
      ref_number: '',
      report_number: report_number,
      source_domain: url_domain,
      submitters: ['Anonymous'],
      text: text_incident,
      title: card_title,
      url: url_link,
      tags: [],
    };

    data_arrays.push(newRow);
  }

  // convert data to json formmated string

  var jsonData = JSON.stringify(data_arrays, null, 2);

  console.log(jsonData);

  fs.writeFile('test.json', jsonData, (err) => {
    if (err) throw err;
    console.log('Data written to file');
  });

  browser.close();
}

scrapeWebpage('https://www.deepfaked.video/?category=Disinformation', data_box);

// convert csv to json

function readCsvFileSync(name) {
  const results = [];

  try {
    const data = fs.readFileSync(name);

    csv({ headers: false })
      .on('data', (data) => results.push(data))
      .write(data);
  } catch (err) {
    console.error(err);
  }

  return results;
}

console.log('Csv file conversion');
const results = readCsvFileSync('offical_deepfakeReports.csv');

const reportsJson = JSON.parse(fs.readFileSync('test.json').toString());

for (let i = 1; i < results.length; i++) {
  // transfer object id.
  let idObject = { $oid: new ObjectId() };

  reportsJson[i - 1]['_id'] = idObject;

  reportsJson[i - 1]['authors'] = [results[i]['2']];
  reportsJson[i - 1]['media_url'] = results[i]['12'];
  reportsJson[i - 1]['epoch_date_published'] = parseInt(results[i]['10']);
  reportsJson[i - 1]['date_published'] = results[i]['5'];

  if (results[i]['12'] != '') {
    reportsJson[i - 1]['cloudinary_id'] = 'reports/' + results[i]['12'].replace(/^https?:\/\//, '');
  } else {
    reportsJson[i - 1]['cloudinary_id'] = '';
  }
  reportsJson[i - 1]['is_incident_report'] = true;
  reportsJson[i - 1]['flag'] = true;
}
// console.log(reportsJson)
var convertedData = JSON.stringify(reportsJson, null, 2);

fs.writeFile('Deepreports.json', convertedData, (err) => {
  if (err) throw err;
  console.log('Data written to file');
});

// convert incidents

function readCsvFile() {
  return new Promise((resolve, reject) => {
    const results = [];

    try {
      fs.createReadStream('DeepfakeIncidents.csv')
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        });
    } catch (err) {
      reject(err);
    }
  });
}

async function conversion() {
  console.log('Csv file conversion');
  const results = await readCsvFile();

  console.log(results.length);

  for (let i = 0; i < results.length; i++) {
    let idObject = { $oid: new ObjectId() };

    results[i]['_id'] = idObject;
    results[i]['incident_id'] = parseInt(results[i]['incident_id']);
    results[i]['reports'] = [parseInt(results[i]['reports'])];
    results[i]['Alleged deployer of AI system'] = ['Anonymous'];
    results[i]['Alleged developer of AI system'] = ['Anonymous'];
    results[i]['Alleged harmed or nearly harmed parties'] = ['Anonymous'];
    results[i]['editors'] = ['Anonymous'];

    // addition fields
    results[i]['nlp_similar_incidents'] = [];
    results[i]['editor_similar_incidents'] = [];
    results[i]['editor_dissimilar_incidents'] = [];

    results[i]['flagged_dissimilar_incidents'] = [];
  }
  console.log(results);

  var incidentData = JSON.stringify(results, null, 2);

  fs.writeFile('DeepIncidents.json', incidentData, (err) => {
    if (err) throw err;
    console.log('Data written to file');
  });
}

conversion();
