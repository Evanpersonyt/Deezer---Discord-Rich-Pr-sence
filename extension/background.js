chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_TRACK') {
    fetch('http://localhost:3000/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artist: message.artist,
        title: message.title,
        cover: message.cover,
        durationText: message.durationText
      })
    })
    .then(res => {
      if (res.ok) {
        console.log("🎧 Envoyé au serveur :", message.artist, message.title, "⏱️", message.durationText);
      } else {
        console.error("❌ Erreur serveur lors de l'envoi de la track");
      }
    })
    // .catch(err => console.error("❌ Erreur fetch:", err));
  }
});
