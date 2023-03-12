async function checkMediaLink(url) {
  const lowerCaseUrl = url.toLowerCase();
  
  if (lowerCaseUrl.includes('youtube') || lowerCaseUrl.includes('vimeo')) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`${url} is reachable (status code ${response.status})`);
      } else {
        console.log(`${url} is not reachable (status code ${response.status})`);
      }
    } catch (error) {
      console.log(`${url} is not reachable (error: ${error.message})`);
    }
  } else {
    console.log('fall_back');
  }
}


checkMediaLink('https://vimeo.com/123456789');
checkMediaLink('https://www.youtube.com/watch?v=mHnqORr4%27');