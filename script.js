console.log('Lets write Javascript..');
let songs;
let currFolder;
let currentSong = new Audio();
let allSongs = [];



// function to fetch songs 
async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let i = 0; i < as.length; i++) {
        const element = as[i];
        if (element.href.endsWith("mp3")) {
            let fullName = element.href.split(`/${folder}/`)[1];

            let cleanName = decodeURIComponent(fullName)

                .replace(/_/g, ' ')                          // underscores to space
                .replace(/(\.mp3|\.MP3)/, '')                // remove .mp3
                .replace(/[-\s]*\d+\s*(kbps|kb|bps)?/gi, '') // remove bitrate stuff
                .replace(/\s+/g, ' ')                        // extra spaces
                .trim();

            songs.push({ fullName, cleanName });  // ⬅ object instead of string
            allSongs.push({ fullName, cleanName, folder });  // Track source folder

        }
    }

    // show all the songs in the playlist
    let songUl = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUl.innerHTML = "";
    for (const song of songs) {
        songUl.innerHTML = songUl.innerHTML + `<li>   <img class="themeIcon" src="img/music.svg" alt="music">
                            <div class="info">
                                <div><div>${song.cleanName}</div></div>
                            </div>
                            
                      </li>`;
    }

    // attach an event listener to each song 
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            const nameDiv = e.querySelector(".info > div > div");
            const clickedName = nameDiv.innerText.trim(); // ✅ get clean name text
            // console.log("Clicked song:", clickedName);

            const found = songs.find(s => s.cleanName === clickedName);
            if (found) {
                playMusic(found.fullName);
            } else {
                console.warn("Song not found for:", clickedName);
            }
        });
    });

    return songs;
}

//  function for time calculate 
function formatTime(seconds) {
    if (isNaN(seconds) || seconds === undefined) {
        return "00:00";
    }

    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }

    let cleanName = decodeURI(track)
        .replace(/_/g, ' ')
        .replace(/(\.mp3|\.MP3)/, '')
        .replace(/[-\s]*\d+\s*(kbps|kb|bps)?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    document.querySelector(".songInfo").innerHTML = cleanName.length > 50 ? cleanName.slice(0, 47) + "..." : cleanName;;
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);
    for (let i = 0; i < array.length; i++) {
        const e = array[i];

        if (e.href.includes("/songs")) {
            let folder = (e.href.split("/").slice(-2)[0]);

            // get the meta data of each folder 
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let response = await a.json();
            console.log(response)
            cardContainer.innerHTML = cardContainer.innerHTML + ` <div data-folder="${folder}" class="card ">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%"
                                fill="bg-black">
                                <path
                                    d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                                    stroke="#000000" stroke-width="1.5" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpeg" alt="cover image">
                        <h3>${response.title}</h3>
                        <p>${response.description}</p>
                    </div> `
        }

    }
    // load the playlist when the card is clicked 

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0].fullName);
        })
    })

    // attach an event listener to play next and previous 
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        }
        else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    })
    // add an event listener to previous and next
    previous.addEventListener("click", () => {
        let current = currentSong.src.split("/").slice(-1)[0];
        let index = songs.findIndex(s => s.fullName === current);

        let prevIndex = (index - 1 + songs.length) % songs.length;
        playMusic(songs[prevIndex].fullName);
    })
    next.addEventListener("click", () => {
        let current = currentSong.src.split("/").slice(-1)[0];
        let index = songs.findIndex(s => s.fullName === current);

        let nextIndex = (index + 1) % songs.length;
        playMusic(songs[nextIndex].fullName);
    })

    // this is dragable seekBar 

    const seekBar = document.querySelector(".seekBar");
    const circle = document.querySelector(".circle");

    let isDragging = false;

    const updateSeek = (e) => {
        const rect = seekBar.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        offsetX = Math.max(0, Math.min(offsetX, rect.width)); // Clamp within bounds
        let percent = (offsetX / rect.width) * 100;

        circle.style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    };

    // On click
    seekBar.addEventListener("click", (e) => {
        updateSeek(e);
    });

    // On drag start
    circle.addEventListener("mousedown", () => {
        isDragging = true;
        document.body.style.userSelect = "none"; // Disable text selection
    });

    // On drag move
    document.addEventListener("mousemove", (e) => {
        if (isDragging) updateSeek(e);
    });

    // On drag end
    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "auto"; // Re-enable text selection
    });

    // add an event to volume 
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("input", (e) => {
        console.log('Setting volume to', e.target.value);

        currentSong.volume = parseInt(e.target.value) / 100;
    })

    // add eevent listener for voluume mute 
    document.querySelector(".vol> img").addEventListener("click", (e) => {
        if (e.target.src.includes("vol.svg")) {
            e.target.src = e.target.src.replace("vol.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "vol.svg");
            currentSong.volume = 0.10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 25;
        }
    })
}


// a fn to load all songs 
async function loadAllSongs() {
    let a = await fetch(`http://127.0.0.1:3000/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");

    for (let i = 0; i < anchors.length; i++) {
        const e = anchors[i];
        if (e.href.includes("/songs")) {
            let folder = (e.href.split("/").slice(-2)[0]);

            // Fetch each folder's HTML
            let res = await fetch(`http://127.0.0.1:3000/songs/${folder}/`);
            let html = await res.text();
            let d = document.createElement("div");
            d.innerHTML = html;
            let links = d.getElementsByTagName("a");

            for (let j = 0; j < links.length; j++) {
                const link = links[j];
                if (link.href.endsWith("mp3")) {
                    let fullName = link.href.split(`/${folder}/`)[1];
                    let cleanName = decodeURIComponent(fullName)
                        .replace(/_/g, ' ')
                        .replace(/(\.mp3|\.MP3)/, '')
                        .replace(/[-\s]*\d+\s*(kbps|kb|bps)?/gi, '')
                        .replace(/\s+/g, ' ')
                        .trim();

                    allSongs.push({ fullName, cleanName, folder: `songs/${folder}` });
                }
            }
        }
    }
}


//   main function 
async function main() {

    // loading all songs so that search properly works 
    await loadAllSongs();
    // get the list of all the songs
    await getSongs("songs/ncs");
    playMusic(songs[0].fullName, true); // ⬅ use fullName

    // display all the albums 

    displayAlbums();

    // adding search functionality 
    let searchInput = document.getElementById("search");
    let searchList = document.querySelector(".songSearchList ul");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            let value = searchInput.value.toLowerCase();
            searchList.innerHTML = "";
            if (value === "") return;

            for (const song of allSongs) {
                if (song.cleanName.toLowerCase().includes(value)) {
                    searchList.innerHTML = searchList.innerHTML + ` 
                    <li data-folder="${song.folder}" data-fullname="${song.fullName}">
                    <img class="themeIcon" src="img/music.svg" alt="music">
                    <div class="info">
                    <div><div>${song.cleanName.slice(0, 27) + "..."}</div></div>
                    </div>
                    </li>`;
                }
            }
            Array.from(searchList.getElementsByTagName("li")).forEach(e => {
                e.addEventListener("click", () => {
                    let fullName = e.getAttribute("data-fullname");
                    let folder = e.getAttribute("data-folder");

                    currFolder = folder;
                    songs = allSongs.filter(song => song.folder === folder);
                    // Set the current folder
                    playMusic(fullName);                // Play the correct song

                    searchInput.value = "";             // Clear search box
                    searchList.innerHTML = "";         // Hide search results
                });
            });

        })
    }

    // timeupdate event 
    currentSong.addEventListener("timeupdate", () => {
        // console.log(currentSong.currentTime, currentSong.duration);
        document.querySelector(".songTime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`
        // sekbar updating
        document.querySelector(".circle").style.left = (currentSong.currentTime) / (currentSong.duration) * 100 + "%";
    })

    // add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = 0;
    })
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".searchBar").style.display = "none";
    })

    // add event listener for close hamburger
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    })
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".searchBar").style.display = "block";
    })


    // toggle light/ dark mode 
    let themeToggleBtn = document.getElementById("themeToggle");

    // Load stored theme on page load
    window.addEventListener("DOMContentLoaded", () => {
        let theme = localStorage.getItem("theme");
        if (theme === "light") {
            document.body.classList.add("light");
        }
    });

    // Toggle theme on click
    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("light");
        const isLight = document.body.classList.contains("light");
        localStorage.setItem("theme", isLight ? "light" : "dark");
    });

    // for autoplay 
    currentSong.addEventListener("ended", () => {
        let current = currentSong.src.split("/").pop(); // Get current filename
        let index = songs.findIndex(s => s.fullName === current);
        let nextIndex = index + 1;

        if (nextIndex < songs.length) {
            playMusic(songs[nextIndex].fullName);
        } else {
            // Playlist ended — loop back to first song
            playMusic(songs[0].fullName);
        }
    });


}

main();