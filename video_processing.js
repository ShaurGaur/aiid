// Imports
const os = require('os');
const request = require('request');
const re = require('re');
const time = require('time');
const { randomInt } = require('crypto');
const { VideoFileClip } = require('moviepy-editor');
const { Builder, By, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

let randomized_vid = {};

let reference_table = {};

async function process_Entry(target_url, target_submissionID) {

    let url = target_url;
    let submissionID = target_submissionID;

    reference_table[submissionID] = "Placeholder";

    // Update Reference Table
    if (validate_url(url) === true) {
        reference_table[submissionID] = await convert_video(url);
    } else {
        reference_table[submissionID] = validate_url(url);
    }
}

function validate_url(url) {

    url = url.trim();

    try {
        request(url, (error, response, body) => {
            if (error) {
                return `${url}: is Not reachable \nErr: ${error}`;
            } else if (response.statusCode === 200) {
                return true;
            } else {
                return `${url}: is not Reachable with status_code: ${response.statusCode}`;
            }
        });
    } catch (e) {
        return `${url}: is Not reachable \nErr: ${e}`;
    }
}

async function convert_video(url) {

    // 4 Main types of links to handle: Streamable, Vimeo, Youtube, Twitter

    if (re.test(url, "twitter.com")) {
        let converter = 'https://ssstwitter.com/';
        let search_input = "form-control";
        let download_button = ".pure-button.pure-button-primary.is-center.u-bl.dl-button.download_link.without_watermark.vignette_active";
        let yt_flag = 0;
        let href_flag = 1;
        let close_sleep_time = 3;

        await process_video(url, converter, search_input, download_button, yt_flag, href_flag, close_sleep_time);
        return check_requirements();


    } else if (re.test(url, "vimeo.com")) {
        let converter = 'https://vimeo-downloader.com/';
        let search_input = "form-control";
        let download_button = ".btn.btn-danger.btn-lg.py-3.my-3.mx-1.d-inline-block.d-lg-block";
        let yt_flag = 0;
        let href_flag = 1;
        let close_sleep_time = 3;

        await process_video(url, converter, search_input, download_button, yt_flag, href_flag, close_sleep_time);
        return check_requirements();


    } else if (re.test(url, "streamable")) {
        let converter = 'https://streamabledl.com/';
        let search_input = "uk-input";
        let download_button = ".uk-button.uk-button-large";
        let yt_flag = 0;
        let href_flag = 0;
        let close_sleep_time = 15;

        await process_video(url, converter, search_input, download_button, yt_flag, href_flag, close_sleep_time);
        return check_requirements();


    } else if (re.test(url, "youtube")) {
        let converter = 'https://wave.video/convert/youtube-to-mp4';
        let search_input = '.sc-8b4b6g-0.beiuBq';
        let download_button = ".b0kwwh-0.dkrhAU.uxhyop-2.TPBMx"
        let yt_flag = 1;
        let href_flag = 0;
        let close_sleep_time = 15;

        await process_video(url, converter, search_input, download_button, yt_flag, href_flag, close_sleep_time);
        return check_requirements();

    } else {
      return "The following URL cannot be converted or may not have existing support to allow for conversion";
    }
}

async function process_video(url, converter, search_input, download_button, yt_flag, href_flag, close_sleep_time) {
  const chromeOptions = new webdriver.ChromeOptions();
  const prefs = { "download.default_directory": "C:\\pvid_stream_vids" };
  chromeOptions.addArguments("--no-sandbox");
  chromeOptions.addArguments("--disable-setuid-sandbox");
  chromeOptions.addArguments("--disable-dev-shm-usage");
  chromeOptions.addArguments("--disable-accelerated-2d-canvas");
  chromeOptions.addArguments("--disable-gpu");
  chromeOptions.addArguments("--headless");
  chromeOptions.addArguments("--disable-extensions");
  chromeOptions.addArguments("--disable-infobars");
  chromeOptions.addArguments("--disable-popup-blocking");
  chromeOptions.addArguments("--window-size=1920x1080");
  chromeOptions.addArguments("--lang=en-US");
  chromeOptions.setChromeBinaryPath("/usr/bin/google-chrome");

  const driver = await new webdriver.Builder().forBrowser("chrome").withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(chromeOptions).build();

  await driver.get(converter);
  await driver.manage().window().maximize();

  let search_input_elem = null;
  if (yt_flag == 1) {
    search_input_elem = await driver.findElement(By.css(search_input));
  } else {
    search_input_elem = await driver.findElement(By.className(search_input));
  }

  await search_input_elem.sendKeys(url);
  await driver.sleep(5000);
  await search_input_elem.sendKeys(Key.ENTER);
  await driver.sleep(5000);

  let download_url = null;
  if (href_flag == 1) {
    download_url = await driver.findElement(By.css(download_button)).getAttribute("href");
    await driver.sleep(close_sleep_time);
    await driver.quit();
    await append_and_convert(download_url);
  } else {
    const download_button_elem = await driver.findElement(By.css(download_button));
    await download_button_elem.click();
    await driver.sleep(close_sleep_time);
    await driver.quit();
  }
}

async function append_and_convert(download_url) {
  let file_to_save = "vid";
  file_to_save += randomize().toString() + ".mp4";

  const resp = await fetch(download_url);
  const buffer = await resp.buffer();

  await fs.promises.writeFile(`C:\\pvid_stream_vids\\${file_to_save}`, buffer);
}

function checkRequirements() {
  const base_path = "C:\\pvid_stream_vids";
  fs.readdirSync(base_path, (err, files) => {
    if (err) throw err;

    const latest_file = files.reduce((prev, current) => {
      const prev_ctime = fs.statSync(`${base_path}\\${prev}`).ctime.getTime();
      const curr_ctime = fs.statSync(`${base_path}\\${current}`).ctime.getTime();
      return prev_ctime > curr_ctime ? prev : current;
    }, '');

    // Video size is greater than 250MB (250000000 bytes)
    if (fs.statSync(`${base_path}\\${latest_file}`).size > 250000000) {
      fs.unlinkSync(`${base_path}\\${latest_file}`);
      return `The current file size (${fs.statSync(`${base_path}\\${latest_file}`).size / 1000000} mbs) is greater than 250MB and cannot be processed.`;
    }

    const duration = getVideoDuration(`${base_path}\\${latest_file}`);

    // Duration must be less than 2 mins and 30 seconds
    if (duration > 150) {
      fs.unlinkSync(`${base_path}\\${latest_file}`);
      return `The current video duration (${duration} s) is greater than 150 seconds and cannot be processed.`;
    }

    console.log(`Your video ${latest_file} has been successfully verified!`);
    return `${base_path}\\${latest_file}`;
  });
}

function getVideoDuration(file_path) {
  const video = ffmpeg(file_path);
  const duration = video.ffprobeSync().streams[0].duration;
  video.close();
  return duration;
}

function randomize() {
  while (true) {
    const range_start = 10 ** 0;
    const range_end = 10 ** 5 - 1;
    const temp = Math.floor(Math.random() * (range_end - range_start + 1)) + range_start;
    if (!randomized_vid.has(temp)) {
      randomized_vid.set(temp, 1);
      return temp;
    }
  }
}

function lookupResult(submissionID) {
  console.log(`Looking up table for submissionID: ${submissionID}`);
  return reference_table[submissionID];
}
