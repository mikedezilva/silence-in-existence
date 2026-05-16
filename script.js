document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('total-duration');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const albumArt = document.getElementById('album-art');
    const albumArtContainer = document.querySelector('.album-art-container');
    const bgBlur = document.querySelector('.background-blur');
    const menuBtn = document.getElementById('menu-btn');
    const closeDrawer = document.getElementById('close-drawer');
    const drawer = document.getElementById('playlist-drawer');
    const trackList = document.getElementById('track-list');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');

    let currentTrackIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one

    // -- Taprobane Trance Features --
    const storyBtn = document.getElementById('story-btn');
    const closeStory = document.getElementById('close-story');
    const conceptOverlay = document.getElementById('concept-overlay');

    // Initialize tracks
    function init() {
        console.log('Player initialized with', tracks.length, 'tracks');
        loadTrack(currentTrackIndex);
        renderTrackList();
        setupMediaSession();
    }

    function loadTrack(index) {
        const track = tracks[index];
        console.log('Loading track:', track.title);
        audio.src = track.url;
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
        albumArt.src = track.cover;
        bgBlur.style.backgroundImage = `url('${track.cover}')`;
        
        // Reset progress
        progressBar.value = 0;
        progressFill.style.width = '0%';
        currentTimeEl.textContent = '0:00';
        
        // Update active class in list
        const items = document.querySelectorAll('.track-item');
        items.forEach((item, i) => {
            if (i === index) item.classList.add('active');
            else item.classList.remove('active');
        });

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist,
                artwork: [
                    { src: track.cover, sizes: '512x512', type: 'image/jpeg' }
                ]
            });
        }
    }

    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            albumArtContainer.classList.remove('playing');
        } else {
            audio.play().catch(err => console.error("Playback failed:", err));
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            albumArtContainer.classList.add('playing');
        }
        isPlaying = !isPlaying;
    }

    function nextTrack() {
        if (isShuffle) {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * tracks.length);
            } while (nextIndex === currentTrackIndex && tracks.length > 1);
            currentTrackIndex = nextIndex;
        } else {
            currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        }
        loadTrack(currentTrackIndex);
        if (isPlaying) audio.play();
    }

    function prevTrack() {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) audio.play();
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    function updateProgress() {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.value = percent;
            progressFill.style.width = `${percent}%`;
            currentTimeEl.textContent = formatTime(audio.currentTime);
            durationEl.textContent = formatTime(audio.duration);
        }
    }

    function renderTrackList() {
        trackList.innerHTML = '';
        tracks.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'track-item' + (index === currentTrackIndex ? ' active' : '');
            li.innerHTML = `
                <i class="fas fa-volume-up"></i>
                <div class="track-item-info">
                    <h4>${track.title}</h4>
                    <p>${track.artist}</p>
                </div>
            `;
            li.addEventListener('click', () => {
                currentTrackIndex = index;
                loadTrack(currentTrackIndex);
                if (!isPlaying) togglePlay();
                else audio.play();
                drawer.classList.remove('open');
            });
            trackList.appendChild(li);
        });
    }

    function setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
            navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        }
    }

    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => {
        if (repeatMode === 2) { // repeat one
            audio.currentTime = 0;
            audio.play();
        } else if (repeatMode === 1) { // repeat all
            nextTrack();
        } else if (currentTrackIndex < tracks.length - 1) { // no repeat, next if available
            nextTrack();
        } else {
            isPlaying = false;
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            albumArtContainer.classList.remove('playing');
        }
    });

    progressBar.addEventListener('input', () => {
        if (audio.duration) {
            const time = (progressBar.value / 100) * audio.duration;
            audio.currentTime = time;
        }
    });

    menuBtn.addEventListener('click', () => drawer.classList.add('open'));
    closeDrawer.addEventListener('click', () => drawer.classList.remove('open'));
    
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        console.log('Shuffle:', isShuffle);
    });

    repeatBtn.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        console.log('Repeat Mode:', repeatMode);
        
        // Clear active states
        repeatBtn.classList.remove('active');
        
        if (repeatMode === 0) {
            repeatBtn.innerHTML = '<i class="fas fa-repeat"></i>';
        } else if (repeatMode === 1) {
            repeatBtn.classList.add('active');
            repeatBtn.innerHTML = '<i class="fas fa-repeat"></i>';
        } else {
            repeatBtn.classList.add('active');
            // Using a simple CSS trick or text for "1"
            repeatBtn.innerHTML = '<i class="fas fa-repeat"></i><span style="font-size: 10px; position: absolute; margin-left: -5px; margin-top: 5px; font-weight: bold;">1</span>';
        }
    });

    // Handle Metadata load for duration
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    if (storyBtn) {
        storyBtn.addEventListener('click', () => {
            conceptOverlay.classList.add('open');
        });
    }

    if (closeStory) {
        closeStory.addEventListener('click', () => {
            conceptOverlay.classList.remove('open');
        });
    }

    init();
});
