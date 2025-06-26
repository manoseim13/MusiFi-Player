const songs = [
  { title: "Demolire", artist: "Grwbryan", audioSrc: "music/song1.mp3", videoSrc: "music/loop1.mp4" },
  { title: "Under Neon Skies", artist: "Mac Djammer", audioSrc: "music/song2.mp3", videoSrc: "music/loop2.mp4" },
  { title: "On Fire", artist: "Top Flow", audioSrc: "music/song3.mp3", videoSrc: "music/loop4.mp4" },
  { title: "Mountain in the Clouds", artist: "Rockot", audioSrc: "music/song4.mp3", videoSrc: "music/loop6.mp4" },
  { title: "Song 5", artist: "Artist 5", audioSrc: "music/song5.mp3", videoSrc: "music/loop3.mp4" }
];

let currentIndex = 0;
let isPaused = false;
let shuffleOn = false;
let showingFavorites = false;
let currentPlaylist = null;

let favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
let playlists = JSON.parse(localStorage.getItem("playlists") || "{}");

const audio = document.getElementById("audio-player");
const video = document.getElementById("background-video");
const songTitle = document.getElementById("song-title");
const songArtist = document.getElementById("song-artist");
const pauseBtn = document.getElementById("pause-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const volumeSlider = document.getElementById("volume-slider");
const progressBar = document.getElementById("progress-bar");
const upcomingList = document.getElementById("upcoming-list");
const listTitle = document.getElementById("list-title");
const playlistList = document.getElementById("playlist-list");
const createBtn = document.getElementById("create-playlist-btn");
const newPlaylistInput = document.getElementById("new-playlist-name");
const playerDropdownMenu = document.getElementById("player-dropdown-menu");

const playlistModal = new bootstrap.Modal(document.getElementById("playlistModal"));
const playlistSelect = document.getElementById("playlist-select");
const newPlaylistModalInput = document.getElementById("new-playlist-input");
const savePlaylistBtn = document.getElementById("save-playlist-btn");
let selectedSongIdxForModal = null;

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(Array.from(favorites)));
}

function savePlaylists() {
  localStorage.setItem("playlists", JSON.stringify(playlists));
  renderPlaylists();
  renderPlayerDropdown();
}

function updatePlayer() {
  const s = songs[currentIndex];
  audio.src = s.audioSrc;
  video.src = s.videoSrc;
  video.load();
  video.play();
  audio.play();
  songTitle.textContent = s.title;
  songArtist.textContent = s.artist;
  isPaused = false;
  pauseBtn.querySelector("i").className = "fa-solid fa-pause";
  renderList();
  renderPlaylists();
  renderPlayerDropdown();
}

function renderList() {
  upcomingList.innerHTML = "";
  let listArr;

  if (showingFavorites) {
    listArr = songs.filter(song => favorites.has(song.title));
    listTitle.textContent = "Favorites";
  } else if (currentPlaylist) {
    listArr = playlists[currentPlaylist].map(i => songs[i]);
    listTitle.textContent = `Playlist: ${currentPlaylist}`;
  } else {
    listArr = songs;
    listTitle.textContent = "Up Next";
  }

  listArr.forEach((song, i) => {
    const actualIndex = songs.findIndex(s => s.title === song.title);
    const li = document.createElement("li");
    li.className = "list-group-item";

    const span = document.createElement("span");
    span.textContent = `${song.title} - ${song.artist}`;
    span.addEventListener("click", () => {
      currentIndex = actualIndex;
      showingFavorites = false;
      currentPlaylist = null;
      updatePlayer();
    });

    const heart = document.createElement("i");
    heart.className = "fas fa-heart heart-icon" + (favorites.has(song.title) ? " favorited" : "");
    heart.addEventListener("click", e => {
      e.stopPropagation();
      favorites.has(song.title) ? favorites.delete(song.title) : favorites.add(song.title);
      saveFavorites();
      renderList();
    });

    const download = document.createElement("a");
    download.href = song.audioSrc;
    download.download = `${song.title} - ${song.artist}.mp3`;
    download.title = "Download song";
    download.innerHTML = '<i class="fas fa-download download-icon"></i>';

    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-sm btn-outline-light ms-2";
    addBtn.textContent = "⋯";
    addBtn.title = "Add to playlist";
    addBtn.addEventListener("click", e => {
      e.stopPropagation();
      selectedSongIdxForModal = actualIndex;
      playlistSelect.innerHTML = "";
      Object.keys(playlists).forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        playlistSelect.append(option);
      });
      newPlaylistModalInput.value = "";
      playlistModal.show();
    });

    li.append(span, heart, download, addBtn);
    upcomingList.append(li);
  });
}

function renderPlaylists() {
  playlistList.innerHTML = "";
  Object.keys(playlists).forEach(name => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    const span = document.createElement("span");
    span.textContent = name;
    span.style.cursor = "pointer";
    span.addEventListener("click", () => {
      showingFavorites = false;
      currentPlaylist = name;
      renderList();
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.title = "Download entire playlist";
    downloadBtn.innerHTML = '<i class="fas fa-file-archive"></i>';
    downloadBtn.className = "btn btn-sm btn-outline-success ms-2";
    downloadBtn.addEventListener("click", async e => {
      e.stopPropagation();
      const playlistSongs = playlists[name].map(i => songs[i]);
      if (!playlistSongs.length) return;
      const zip = new JSZip();
      const folder = zip.folder(name);

      await Promise.all(playlistSongs.map((song, idx) =>
        fetch(song.audioSrc)
          .then(res => res.blob())
          .then(blob => folder.file(`${idx + 1} - ${song.title} - ${song.artist}.mp3`, blob))
      ));

      const content = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `${name}.zip`;
      a.click();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-sm btn-danger";
    delBtn.innerHTML = "×";
    delBtn.title = "Delete playlist";
    delBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (confirm(`Delete playlist "${name}"?`)) {
        delete playlists[name];
        savePlaylists();
        if (currentPlaylist === name) {
          currentPlaylist = null;
          renderList();
        }
      }
    });

    li.append(span, downloadBtn, delBtn);
    playlistList.append(li);
  });
}

function renderPlayerDropdown() {
  playerDropdownMenu.innerHTML = "";
  Object.entries(playlists).forEach(([name, arr]) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "dropdown-item";
    a.href = "#";
    a.textContent = name;
    a.addEventListener("click", () => {
      if (!arr.includes(currentIndex)) {
        arr.push(currentIndex);
        savePlaylists();
      }
    });
    li.append(a);
    playerDropdownMenu.append(li);
  });

  const divider = document.createElement("li");
  divider.innerHTML = "<hr class='dropdown-divider'>";
  playerDropdownMenu.append(divider);

  const newLi = document.createElement("li");
  const newA = document.createElement("a");
  newA.className = "dropdown-item text-info";
  newA.href = "#";
  newA.textContent = "Create New Playlist";
  newA.addEventListener("click", () => {
    selectedSongIdxForModal = currentIndex;
    playlistSelect.innerHTML = "";
    Object.keys(playlists).forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      playlistSelect.append(option);
    });
    newPlaylistModalInput.value = "";
    playlistModal.show();
  });
  newLi.append(newA);
  playerDropdownMenu.append(newLi);
}

createBtn.addEventListener("click", () => {
  const name = newPlaylistInput.value.trim();
  if (name && !playlists[name]) {
    playlists[name] = [];
    savePlaylists();
    newPlaylistInput.value = "";
    renderPlaylists();
  }
});

document.getElementById("favorites-link").addEventListener("click", e => {
  e.preventDefault();
  showingFavorites = true;
  currentPlaylist = null;
  renderList();
});

shuffleBtn.addEventListener("click", () => {
  shuffleOn = !shuffleOn;
  shuffleBtn.classList.toggle("btn-primary", shuffleOn);
});

pauseBtn.addEventListener("click", () => {
  if (isPaused) {
    audio.play();
    video.play();
    pauseBtn.querySelector("i").className = "fa-solid fa-pause";
  } else {
    audio.pause();
    video.pause();
    pauseBtn.querySelector("i").className = "fa-solid fa-play";
  }
  isPaused = !isPaused;
});

document.getElementById("next-btn").addEventListener("click", () => {
  currentIndex = shuffleOn ? Math.floor(Math.random() * songs.length) : (currentIndex + 1) % songs.length;
  showingFavorites = false;
  currentPlaylist = null;
  updatePlayer();
});

document.getElementById("prev-btn").addEventListener("click", () => {
  currentIndex = shuffleOn ? Math.floor(Math.random() * songs.length) : (currentIndex - 1 + songs.length) % songs.length;
  showingFavorites = false;
  currentPlaylist = null;
  updatePlayer();
});

audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
  }
});

progressBar.addEventListener("input", () => {
  if (audio.duration) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
});

audio.addEventListener("ended", () => {
  document.getElementById("next-btn").click();
});

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

savePlaylistBtn.addEventListener("click", () => {
  const targetName = newPlaylistModalInput.value.trim() || playlistSelect.value;
  if (!targetName) return;
  if (!playlists[targetName]) playlists[targetName] = [];
  if (!playlists[targetName].includes(selectedSongIdxForModal)) {
    playlists[targetName].push(selectedSongIdxForModal);
    savePlaylists();
    renderPlaylists();
  }
  playlistModal.hide();
});

window.onload = () => {
  audio.volume = volumeSlider.value;
  updatePlayer();
};
document.getElementById("upload-input").addEventListener("change", function (e) {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, "");
    const newSong = {
      title: title,
      artist: "Uploaded", // or prompt the user if you prefer
      audioSrc: url,
      videoSrc: "music/loop1.mp4" // or a default fallback gif/video
    };
    songs.push(newSong);
  });
  renderList();
});
