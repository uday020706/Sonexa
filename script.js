console.log("Sonexa JS loaded...");

let songs = [];
let currFolder = "";
let currentSong = new Audio();
let allSongs = [];

// ================== CONFIG ==================
const albumFolders = ["ncs", "01_Trending Songs", "lofi", "02_Categorized", "90s", "Classical hits", "Essentials", "mashup", "punjabii"]; 
// 👆 Add your album folder names here (they must exist in /songs/)

// ================== UTILITIES ==================
function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// ================== LOAD SONGS ==================
async function getSongs(folder) {
    currFolder = folder;
    songs = [];
    try {
        let res = await fetch(`/${folder}/info.json`);
        let data = await res.json();

        songs = (data.songs || []).map(name => ({
            fullName: name,
            cleanName: decodeURIComponent(name)
                .replace(/_/g, " ")
                .replace(/(\.mp3|\.MP3)/, "")
                .replace(/[-\s]*\d+\s*(kbps|kb|bps)?/gi, "")
                .replace(/\s+/g, " ")
                .trim(),
        }));

        // update library list
        let songUl = document.querySelector(".songList ul");
        songUl.innerHTML = "";
        for (let song of songs) {
            songUl.innerHTML += `
              <li>
                <img class="themeIcon" src="img/music.svg" alt="music">
                <div class="info"><div><div>${song.cleanName}</div></div></div>
              </li>`;
        }

        // add click listeners
        Array.from(document.querySelectorAll(".songList li")).forEach((li, i) => {
            li.addEventListener("click", () => playMusic(songs[i].fullName));
        });

        return songs;
    } catch (e) {
        console.error("Error loading songs for", folder, e);
        return [];
    }
}

// ================== PLAY MUSIC ==================
function playMusic(track, pause = false) {
    currentSong.src = `/${currFolder}/` + track;

    currentSong.addEventListener("loadedmetadata", () => {
        document.querySelector(".songTime").innerHTML =
            `00:00 / ${formatTime(currentSong.duration)}`;
    });

    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "img/pause.svg";
    }

    let cleanName = decodeURIComponent(track)
        .replace(/_/g, " ")
        .replace(/(\.mp3|\.MP3)/, "")
        .replace(/[-\s]*\d+\s*(kbps|kb|bps)?/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    document.querySelector(".songInfo").innerHTML =
        cleanName.length > 50 ? cleanName.slice(0, 47) + "..." : cleanName;
}

// ================== DISPLAY ALBUMS ==================
async function displayAlbums() {
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (let folder of albumFolders) {
        try {
            let res = await fetch(`/songs/${folder}/info.json`);
            if (!res.ok) continue;
            let data = await res.json();

            cardContainer.innerHTML += `
              <div data-folder="songs/${folder}" class="card">
                <div class="play">▶</div>
                <img src="/songs/${folder}/cover.jpeg" alt="cover image">
                <h3>${data.title}</h3>
                <p>${data.description}</p>
              </div>`;
        } catch (err) {
            console.warn("Skipping album:", folder, err);
        }
    }

    // album click → load songs
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async e => {
            let folder = e.currentTarget.dataset.folder;
            songs = await getSongs(folder);
            if (songs.length > 0) playMusic(songs[0].fullName);
        });
    });
}

// ================== CONTROLS ==================
function setupControls() {
    const playBtn = document.getElementById("play");
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");
    const seekBar = document.querySelector(".seekBar");
    const circle = document.querySelector(".circle");
    const volumeSlider = document.querySelector(".range input");
    const volumeIcon = document.querySelector(".vol img");

    // play/pause
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "img/pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "img/play.svg";
        }
    });

    // prev/next
    prevBtn.addEventListener("click", () => {
        if (!songs.length) return;
        let current = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.findIndex(s => s.fullName === current);
        if (index > -1) {
            let prevIndex = (index - 1 + songs.length) % songs.length;
            playMusic(songs[prevIndex].fullName);
        }
    });

    nextBtn.addEventListener("click", () => {
        if (!songs.length) return;
        let current = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.findIndex(s => s.fullName === current);
        if (index > -1) {
            let nextIndex = (index + 1) % songs.length;
            playMusic(songs[nextIndex].fullName);
        }
    });

    // seekbar
    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            document.querySelector(".songTime").innerHTML =
                `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
            circle.style.left =
                (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });
    seekBar.addEventListener("click", e => {
        const rect = seekBar.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        currentSong.currentTime = percent * currentSong.duration;
    });

    // volume
    volumeSlider.addEventListener("input", e => {
        let vol = e.target.value / 100;
        currentSong.volume = vol;
        volumeIcon.src = vol === 0 ? "img/mute.svg" : "img/vol.svg";
    });
    volumeIcon.addEventListener("click", () => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            volumeSlider.value = 0;
            volumeIcon.src = "img/mute.svg";
        } else {
            currentSong.volume = 0.3;
            volumeSlider.value = 30;
            volumeIcon.src = "img/vol.svg";
        }
    });
}

// ================== THEME ==================
function setupTheme() {
    const themeToggleBtn = document.getElementById("themeToggle");
    window.addEventListener("DOMContentLoaded", () => {
        let theme = localStorage.getItem("theme");
        if (theme === "light") document.body.classList.add("light");
    });
    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("light");
        localStorage.setItem(
            "theme",
            document.body.classList.contains("light") ? "light" : "dark"
        );
    });
}

// ================== MAIN ==================
async function main() {
    await getSongs("songs/ncs"); // load default album
    playMusic(songs[0].fullName, true);
    await displayAlbums();
    setupControls();
    setupTheme();
}
main();
