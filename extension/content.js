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

      console.log('🎵 Artiste détecté :', artists);
      console.log('🎵 Titre détecté :', title);
      console.log('🖼️ Pochette trouvée :', cover);
      console.log('⏱️ Durée :', durationText);
    }
  } catch (err) {
    if (!String(err).includes('context invalidated')) {
      console.warn('Erreur dans detectTrack:', err);
    }
  }
}

// Vérifie toutes les 0.5 secondes
setInterval(detectTrack, 500);
