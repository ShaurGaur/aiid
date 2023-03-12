async function checkYouTubeVideoStatus(videoId) {
    const apiKey = 'AIzaSyBFjOpbgr5iVK5M7yz-OruCzpPqbOiaWcc';
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=status`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const status = data.items[0].status.privacyStatus;

        if (status === 'private') {
            console.log(`Video ${videoId} is private`);
        } else if (status === 'deleted') {
            console.log(`Video ${videoId} has been deleted`);
        } else {
            console.log(`Video ${videoId} is public`);
        }
    } catch (error) {
        console.log(`Unable to check status of video ${videoId}: ${error}`);
    }
}

checkYouTubeVideoStatus('mHnqORr4%27')