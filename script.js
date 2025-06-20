class SpotifyClone {
    constructor() {
        this.currentTrack = null;
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.isRepeat = false;
        this.volume = 0.7;
        this.isMuted = false;
        this.playlist = [...musicData];
        this.originalPlaylist = [...musicData];
        this.filteredPlaylist = [...musicData];
        this.progressDragging = false;
        this.volumeDragging = false;
        this.likedSongs = new Set();
        this.playNextQueue = [];

        this.initializeElements();
        this.initializeAudio();
        this.bindEvents();
        this.renderSongs();
        this.setupProgressBar();
        this.setupVolumeControl();
        this.setVolume(this.volume);
    }

    initializeElements() {
        // Audio element
        this.audio = document.getElementById('audio-player');
        
        // Player controls
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.shuffleBtn = document.getElementById('shuffle-btn');
        this.repeatBtn = document.getElementById('repeat-btn');
        
        // Progress elements
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.getElementById('progress');
        this.progressHandle = document.getElementById('progress-handle');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        
        // Volume elements
        this.volumeBar = document.querySelector('.volume-bar');
        this.volumeProgress = document.getElementById('volume-progress');
        this.volumeHandle = document.getElementById('volume-handle');
        this.muteBtn = document.getElementById('mute-btn');
        
        // Song info elements
        this.currentSongName = document.getElementById('current-song-name');
        this.currentSongArtist = document.getElementById('current-song-artist');
        this.songsContainer = document.getElementById('songs-container');
        
        // Search elements
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Like button
        this.likeBtn = document.querySelector('.like-btn');
    }

    initializeAudio() {
        this.audio.volume = this.volume;
        
        // Audio event listeners
        this.audio.addEventListener('loadstart', () => this.showLoading());
        this.audio.addEventListener('canplay', () => this.hideLoading());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
    }

    bindEvents() {
        // Player controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        // Volume control
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        
        // Like button
        this.likeBtn.addEventListener('click', () => this.toggleLike());
        
        // Search functionality
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        
        // Quick pick items
        document.querySelectorAll('.quick-pick-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const trackIndex = parseInt(e.currentTarget.dataset.track);
                if (trackIndex >= 0 && trackIndex < this.playlist.length) {
                    this.playTrack(trackIndex);
                }
            });
        });

        // Search navigation button
        const searchNavBtn = document.getElementById('search-nav-btn');
        if (searchNavBtn) {
            searchNavBtn.addEventListener('click', () => {
                this.searchInput.focus();
                this.searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupProgressBar() {
        this.progressBar.addEventListener('mousedown', (e) => {
            this.progressDragging = true;
            this.updateProgressFromMouse(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.progressDragging) {
                this.updateProgressFromMouse(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.progressDragging = false;
        });

        this.progressBar.addEventListener('click', (e) => {
            if (!this.progressDragging) {
                this.updateProgressFromMouse(e);
            }
        });
    }

    setupVolumeControl() {
        this.volumeBar.addEventListener('mousedown', (e) => {
            this.volumeDragging = true;
            this.updateVolumeFromMouse(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.volumeDragging) {
                this.updateVolumeFromMouse(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.volumeDragging = false;
        });

        this.volumeBar.addEventListener('click', (e) => {
            if (!this.volumeDragging) {
                this.updateVolumeFromMouse(e);
            }
        });
    }

    renderSongs() {
        this.songsContainer.innerHTML = '';
        
        if (this.filteredPlaylist.length === 0) {
            this.renderNoResults();
            return;
        }

        this.filteredPlaylist.forEach((song, index) => {
            const songCard = this.createSongCard(song, index);
            this.songsContainer.appendChild(songCard);
            
            // Add fade-in animation
            setTimeout(() => {
                songCard.classList.add('fade-in');
            }, index * 50);
        });
    }

    createSongCard(song, index) {
        const songCard = document.createElement('div');
        songCard.className = 'song-card';
        songCard.dataset.index = index;
        
        if (this.currentTrack && this.currentTrack.id === song.id) {
            songCard.classList.add('playing');
        }

        songCard.innerHTML = `
            <div class="song-cover">
                <i class="fas fa-music"></i>
            </div>
            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist} • ${song.genre}</p>
            </div>
            <div class="song-actions">
                <button class="play-next-btn" title="Play Next">
                    <i class="fas fa-list-ol"></i>
                </button>
                <button class="play-btn">
                    <i class="fas ${this.currentTrack && this.currentTrack.id === song.id && this.isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                </button>
            </div>
        `;

        songCard.addEventListener('click', (e) => {
            if (!e.target.closest('.play-btn') && !e.target.closest('.play-next-btn')) {
                this.playTrack(index);
            }
        });

        const playBtn = songCard.querySelector('.play-btn');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (this.currentTrack && this.currentTrack.id === song.id) {
                this.togglePlayPause();
            } else {
                this.playTrack(index);
            }
        });

        const playNextBtn = songCard.querySelector('.play-next-btn');
        playNextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addToPlayNext(song);
        });

        return songCard;
    }

    renderNoResults() {
        this.songsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No songs found</h3>
                <p>Try searching for something else</p>
            </div>
        `;
    }

    playTrack(index) {
        const song = this.filteredPlaylist[index];
        if (!song) return;

        this.currentTrackIndex = index;
        this.currentTrack = song;
        this.audio.src = song.url;
        
        this.updateCurrentSongInfo();
        this.updatePlayButton();
        this.updateSongCards();
        
        this.audio.play().catch(error => {
            console.error('Error playing audio:', error);
            this.handleAudioError(error);
        });
    }

    togglePlayPause() {
        if (!this.currentTrack) {
            if (this.filteredPlaylist.length > 0) {
                this.playTrack(0);
            }
            return;
        }

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(error => {
                console.error('Error playing audio:', error);
                this.handleAudioError(error);
            });
        }
    }

    previousTrack() {
        if (this.filteredPlaylist.length === 0) return;

        // If no current track, start with last track
        if (!this.currentTrack) {
            this.playTrack(this.filteredPlaylist.length - 1);
            return;
        }

        if (this.isShuffle) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * this.filteredPlaylist.length);
            } while (newIndex === this.currentTrackIndex && this.filteredPlaylist.length > 1);
            this.currentTrackIndex = newIndex;
        } else {
            this.currentTrackIndex = this.currentTrackIndex > 0 ? this.currentTrackIndex - 1 : this.filteredPlaylist.length - 1;
        }
        
        this.playTrack(this.currentTrackIndex);
    }

    nextTrack() {
        if (this.filteredPlaylist.length === 0) return;

        // Check if there's a song in the play next queue
        if (this.playNextQueue.length > 0) {
            const nextSong = this.playNextQueue.shift();
            const songIndex = this.filteredPlaylist.findIndex(song => song.id === nextSong.id);
            if (songIndex !== -1) {
                this.playTrack(songIndex);
                return;
            }
        }

        // If no current track, start with first track
        if (!this.currentTrack) {
            this.playTrack(0);
            return;
        }

        if (this.isShuffle) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * this.filteredPlaylist.length);
            } while (newIndex === this.currentTrackIndex && this.filteredPlaylist.length > 1);
            this.currentTrackIndex = newIndex;
        } else {
            this.currentTrackIndex = this.currentTrackIndex < this.filteredPlaylist.length - 1 ? this.currentTrackIndex + 1 : 0;
        }
        
        this.playTrack(this.currentTrackIndex);
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('shuffle-active', this.isShuffle);
    }

    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        this.repeatBtn.classList.toggle('repeat-active', this.isRepeat);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.audio.volume = 0;
            this.muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            this.audio.volume = this.volume;
            this.muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
        
        this.updateVolumeDisplay();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (!this.isMuted) {
            this.audio.volume = this.volume;
        }
        
        this.updateVolumeDisplay();
        this.updateVolumeIcon();
    }

    updateVolumeDisplay() {
        const displayVolume = this.isMuted ? 0 : this.volume;
        this.volumeProgress.style.width = `${displayVolume * 100}%`;
        this.volumeHandle.style.right = `${100 - (displayVolume * 100)}%`;
    }

    updateVolumeIcon() {
        const iconElement = this.muteBtn.querySelector('i');
        
        if (this.isMuted || this.volume === 0) {
            iconElement.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            iconElement.className = 'fas fa-volume-down';
        } else {
            iconElement.className = 'fas fa-volume-up';
        }
    }

    updateVolumeFromMouse(e) {
        const rect = this.volumeBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const volume = Math.max(0, Math.min(1, x / rect.width));
        
        this.setVolume(volume);
        
        if (this.isMuted && volume > 0) {
            this.isMuted = false;
            this.updateVolumeIcon();
        }
    }

    updateProgressFromMouse(e) {
        if (!this.audio.duration) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const time = percentage * this.audio.duration;
        
        this.audio.currentTime = time;
        this.updateProgress();
    }

    updateProgress() {
        if (!this.audio.duration || this.progressDragging) return;
        
        const percentage = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.style.width = `${percentage}%`;
        this.progressHandle.style.left = `${percentage}%`;
        
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        if (this.audio.duration) {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    updateCurrentSongInfo() {
        if (this.currentTrack) {
            this.currentSongName.textContent = this.currentTrack.title;
            this.currentSongArtist.textContent = this.currentTrack.artist;
        }
    }

    updatePlayButton() {
        const icon = this.playPauseBtn.querySelector('i');
        icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    updateSongCards() {
        const songCards = document.querySelectorAll('.song-card');
        songCards.forEach((card, index) => {
            const playBtn = card.querySelector('.play-btn i');
            const isCurrentTrack = this.currentTrack && this.filteredPlaylist[index] && this.filteredPlaylist[index].id === this.currentTrack.id;
            
            card.classList.toggle('playing', isCurrentTrack);
            
            if (isCurrentTrack) {
                playBtn.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
            } else {
                playBtn.className = 'fas fa-play';
            }
        });
    }

    handleTrackEnd() {
        if (this.isRepeat) {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            this.nextTrack();
        }
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayButton();
        this.updateSongCards();
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayButton();
        this.updateSongCards();
    }

    handleAudioError(error) {
        console.error('Audio error:', error);
        this.hideLoading();
        
        // Try to play the next track if current one fails
        if (this.filteredPlaylist.length > 1) {
            setTimeout(() => {
                this.nextTrack();
            }, 1000);
        }
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.clearSearch();
            return;
        }
        
        this.filteredPlaylist = this.originalPlaylist.filter(song => 
            song.title.toLowerCase().includes(searchTerm) ||
            song.artist.toLowerCase().includes(searchTerm) ||
            song.genre.toLowerCase().includes(searchTerm)
        );
        
        this.renderSongs();
        this.clearSearchBtn.style.display = 'block';
        
        // Highlight search results
        setTimeout(() => {
            document.querySelectorAll('.song-card').forEach(card => {
                card.classList.add('highlight');
                setTimeout(() => card.classList.remove('highlight'), 2000);
            });
        }, 100);
    }

    clearSearch() {
        this.searchInput.value = '';
        this.filteredPlaylist = [...this.originalPlaylist];
        this.renderSongs();
        this.clearSearchBtn.style.display = 'none';
    }

    handleKeyboard(e) {
        // Prevent shortcuts when typing in search
        if (e.target === this.searchInput) return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousTrack();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextTrack();
                break;
            case 'KeyM':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'KeyS':
                e.preventDefault();
                this.toggleShuffle();
                break;
            case 'KeyR':
                e.preventDefault();
                this.toggleRepeat();
                break;
        }
    }

    showLoading() {
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    toggleLike() {
        if (!this.currentTrack) return;
        
        const songId = this.currentTrack.id;
        if (this.likedSongs.has(songId)) {
            this.likedSongs.delete(songId);
            this.likeBtn.innerHTML = '<i class="far fa-heart"></i>';
            this.likeBtn.classList.remove('liked');
        } else {
            this.likedSongs.add(songId);
            this.likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
            this.likeBtn.classList.add('liked');
        }
    }

    addToPlayNext(song) {
        this.playNextQueue.push(song);
        
        // Visual feedback
        const playNextBtns = document.querySelectorAll('.play-next-btn');
        playNextBtns.forEach(btn => {
            const songCard = btn.closest('.song-card');
            const songIndex = parseInt(songCard.dataset.index);
            const currentSong = this.filteredPlaylist[songIndex];
            
            if (currentSong && currentSong.id === song.id) {
                btn.style.color = '#87CEEB';
                setTimeout(() => {
                    btn.style.color = '';
                }, 1000);
            }
        });
    }

    updateCurrentSongInfo() {
        if (this.currentTrack) {
            this.currentSongName.textContent = this.currentTrack.title;
            this.currentSongArtist.textContent = this.currentTrack.artist;
            
            // Update like button state
            if (this.likedSongs.has(this.currentTrack.id)) {
                this.likeBtn.innerHTML = '<i class="fas fa-heart"></i>';
                this.likeBtn.classList.add('liked');
            } else {
                this.likeBtn.innerHTML = '<i class="far fa-heart"></i>';
                this.likeBtn.classList.remove('liked');
            }
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spotifyClone = new SpotifyClone();
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
