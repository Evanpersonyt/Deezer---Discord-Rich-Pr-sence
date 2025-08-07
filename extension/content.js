function detectTrack() {
  try {
    const titleEl = document.querySelector('[data-testid="item_title"] a');
    const artistEls = document.querySelectorAll('[data-testid="item_subtitle"] a');
    const imageEl = document.querySelector('[data-testid="item_cover"] img');
    const durationEl = document.querySelector('[data-testid="remaining_time"]');

    const title = titleEl?.textContent?.trim();
    const artists = Array.from(artistEls).map(el => el.textContent.trim()).join(', ');
    const cover = imageEl?.src;
    const durationText = durationEl?.textContent?.trim();

    if (title && artists && cover && durationText) {
      chrome.runtime.sendMessage({
        type: 'UPDATE_TRACK',
        artist: artists,
        title: title,
        cover,
        durationText
      });

      console.log('🎵 Artist detected :', artists);
      console.log('🎵 Title detected :', title);
      console.log('🖼️ Cover found :', cover);
      console.log('⏱️ Time :', durationText);
    }
  } catch (err) {
    if (!String(err).includes('context invalidated')) {
      console.warn('Error in detectTrack:', err);
    }
  }
}

setInterval(detectTrack, 500);

