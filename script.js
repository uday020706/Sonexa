document.addEventListener("DOMContentLoaded", () => {
  console.log("Sonexa loaded");

  let songs = [];
  let currFolder = "";
  let currentSong = new Audio();
  let allSongs = [];

  // Elements
  const playBtn = document.getElementById("play");
  const prevBtn = document.getElementById("previous");
  const nextBtn = document.getElementById("next");
  const songInfo = document.querySelector(".songInfo");
  const songTime = document.querySelector(".songTime");
  const circle = document.querySelector(".circle");
  const seekBar = document.querySelector(".seekBar");
  const volumeInput = document.querySelector(".range input");
  const volIcon = document.querySelector(".vol img");
  const themeToggleBtn = document.getElementById("themeToggle");

  // Format time
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === undefined) return "00:00";
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Play song
  function playMusic(track, pause = false) {
    currentSong.src = `${currFolder}/${track}`;
    if (!pause) {
      currentSong.play();
      playBtn.src = "img/pause.svg";
    }
    let cleanName = decodeURI(track).replace(/_/g, " ").replace(/\.mp3$/i, "").trim();
    songInfo.textContent = cleanName;
    songTime.textContent = "00:00 / 00:00";
  }

  // Load songs into sidebar list
  function loadSongList() {
    let songUl = document.querySelector(".songList ul");
    songUl.innerHTML = "";
    for (const song of songs) {
      songUl.innerHTML += `
        <li>
          <img class="themeIcon" src="img/music.svg" alt="music">
          <div class="info"><div><div>${song.cleanName}</div></div></div>
        </li>`;
    }
    Array.from(songUl.getElementsByTagName("li")).forEach((li, i) => {
      li.addEventListener("click", () => playMusic(songs[i].fullName));
    });
  }

  // Display albums
  async function displayAlbums() {
    let folders = ["ncs", "lofi", "90s"]; // add your folders here
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (let folder of folders) {
      try {
        let res = await fetch(`songs/${folder}/info.json`);
        let data = await res.json();

        cardContainer.innerHTML += `
          <div data-folder="songs/${folder}" class="card">
            <div class="play">▶</div>
            <img src="songs/${folder}/cover.jpeg" alt="cover image">
            <h3>${data.title}</h3>
            <p>${data.description}</p>
          </div>
        `;

        document
          .querySelector(`.card[data-folder="songs/${folder}"]`)
          .addEventListener("click", () => {
            songs = data.songs.map((name) => ({
              fullName: name,
              cleanName: name.replace(/_/g, " ").replace(/\.mp3$/i, ""),
            }));
            currFolder = `songs/${folder}`;
            loadSongList();
            playMusic(songs[0].fullName);
          });

        data.songs.forEach((name) =>
          allSongs.push({
            fullName: name,
            cleanName: name.replace(/_/g, " ").replace(/\.mp3$/i, ""),
            folder: `songs/${folder}`,
          })
        );
      } catch (err) {
        console.error(`Error loading album ${folder}:`, err);
      }
    }
  }

  // Init
  async function main() {
    await displayAlbums();

    // Default load NCS
    currFolder = "songs/ncs";
    try {
      let res = await fetch(`${currFolder}/info.json`);
      let data = await res.json();
      songs = data.songs.map((n) => ({
        fullName: n,
        cleanName: n.replace(/_/g, " ").replace(/\.mp3$/i, ""),
      }));
      loadSongList();
      playMusic(songs[0].fullName, true);
    } catch (e) {
      console.warn("No default album loaded:", e);
    }
  }

  main();

  // Events
  currentSong.addEventListener("timeupdate", () => {
    songTime.textContent = `${formatTime(currentSong.currentTime)} / ${formatTime(
      currentSong.duration
    )}`;
    circle.style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  playBtn.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playBtn.src = "img/pause.svg";
    } else {
      currentSong.pause();
      playBtn.src = "img/play.svg";
    }
  });

  prevBtn.addEventListener("click", () => {
    let index = songs.findIndex((s) => currentSong.src.endsWith(s.fullName));
    let prevIndex = (index - 1 + songs.length) % songs.length;
    playMusic(songs[prevIndex].fullName);
  });

  nextBtn.addEventListener("click", () => {
    let index = songs.findIndex((s) => currentSong.src.endsWith(s.fullName));
    let nextIndex = (index + 1) % songs.length;
    playMusic(songs[nextIndex].fullName);
  });

  currentSong.addEventListener("ended", () => {
    let index = songs.findIndex((s) => currentSong.src.endsWith(s.fullName));
    let nextIndex = (index + 1) % songs.length;
    playMusic(songs[nextIndex].fullName);
  });

  volumeInput.addEventListener("input", (e) => {
    currentSong.volume = e.target.value / 100;
  });

  volIcon.addEventListener("click", (e) => {
    if (e.target.src.includes("vol.svg")) {
      e.target.src = e.target.src.replace("vol.svg", "mute.svg");
      currentSong.volume = 0;
      volumeInput.value = 0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "vol.svg");
      currentSong.volume = 0.25;
      volumeInput.value = 25;
    }
  });

  // Theme toggle
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
  });

  // Load stored theme
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
  }
});
