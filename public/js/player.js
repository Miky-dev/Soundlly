// public/js/player.js

document.addEventListener('DOMContentLoaded', () => {
    // Ensure namespace exists
    window.Soundlly = window.Soundlly || {};

    class MusicPlayer {
        constructor() {
            this.audio = new Audio();
            this.playerBar = document.getElementById('music-player-bar');

            // UI Elements
            this.coverImg = document.getElementById('player-cover-img');
            this.titleEl = document.getElementById('player-title');
            this.artistEl = document.getElementById('player-artist');
            this.playBtn = document.getElementById('player-play-btn');
            this.playIcon = this.playBtn ? this.playBtn.querySelector('i') : null;

            this.progressFill = document.getElementById('player-progress-fill');
            this.currentTimeEl = document.getElementById('player-current-time');
            this.totalTimeEl = document.getElementById('player-total-time');
            this.progressBar = document.getElementById('player-progress-bar');

            this.isPlaying = false;

            // Bind Events
            this.closeBtn = document.getElementById('player-close-btn');
            this.volumeSlider = document.getElementById('player-volume-slider');
            this.volumeIcon = document.getElementById('volume-icon');

            // Bind Events if elements exist
            if (this.playBtn) this.initEvents();
        }

        initEvents() {
            // Close Button
            if (this.closeBtn) {
                this.closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.closePlayer();
                };
            }

            // Volume Slider
            if (this.volumeSlider) {
                this.volumeSlider.addEventListener('input', (e) => {
                    this.audio.volume = e.target.value;
                    this.updateVolumeIcon();
                });
            }

            // Play/Pause Click
            if (this.playBtn) {
                this.playBtn.addEventListener('click', () => this.togglePlay());
            }

            // Audio Events
            this.audio.addEventListener('timeupdate', () => this.updateProgress());
            this.audio.addEventListener('loadedmetadata', () => {
                if (this.totalTimeEl) this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
            });
            this.audio.addEventListener('ended', () => {
                this.isPlaying = false;
                this.updatePlayBtnState();
            });

            // Seek
            if (this.progressBar) {
                this.progressBar.addEventListener('click', (e) => {
                    const rect = this.progressBar.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    this.audio.currentTime = percent * this.audio.duration;
                });
            }
        }

        playTrack(item) {
            // Show Player if hidden
            if (this.playerBar) this.playerBar.classList.add('active');

            // Update Info
            if (this.titleEl) this.titleEl.textContent = item.title;
            if (this.artistEl) this.artistEl.textContent = item.author || 'Sconosciuto';

            // Determine Cover URL
            const bgUrl = (item.icon && item.icon.includes('/')) ? item.icon : '/immagini/usericon.png';
            if (this.coverImg) this.coverImg.src = bgUrl;

            // Determine Audio Source
            let src = item.filename;
            if (!src.startsWith('http') && !src.startsWith('/')) {
                if (item.category === 'ambient') {
                    src = '/audio/ambient/' + src;
                } else {
                    // Default to musiche for 'music' or generic
                    src = '/audio/musiche/' + src;
                }
            }

            if (this.audio.src.includes(src)) {
                if (this.audio.paused) {
                    this.audio.play();
                    this.isPlaying = true;
                }
            } else {
                this.audio.src = src;
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    this.updatePlayBtnState();
                }).catch(e => {
                    console.error("Audio Play Error:", e);
                    alert("Impossibile riprodurre questo brano.");
                });
            }

            this.updatePlayBtnState();
        }

        togglePlay() {
            if (this.audio.paused) {
                this.audio.play();
                this.isPlaying = true;
            } else {
                this.audio.pause();
                this.isPlaying = false;
            }
            this.updatePlayBtnState();
        }

        closePlayer() {
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayBtnState();
            if (this.playerBar) this.playerBar.classList.remove('active');
        }

        updatePlayBtnState() {
            if (!this.playIcon) return;
            if (this.isPlaying) {
                this.playIcon.classList.remove('fa-play');
                this.playIcon.classList.add('fa-pause');
            } else {
                this.playIcon.classList.remove('fa-pause');
                this.playIcon.classList.add('fa-play');
            }
        }

        updateProgress() {
            if (!this.audio.duration) return;

            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            if (this.progressFill) this.progressFill.style.width = `${percent}%`;

            if (this.currentTimeEl) this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }

        formatTime(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? '0' + sec : sec}`;
        }
        updateVolumeIcon() {
            if (!this.volumeIcon) return;
            const vol = this.audio.volume;
            this.volumeIcon.className = ''; // Reset

            if (vol === 0) {
                this.volumeIcon.className = 'fa-solid fa-volume-xmark';
            } else if (vol < 0.5) {
                this.volumeIcon.className = 'fa-solid fa-volume-low';
            } else {
                this.volumeIcon.className = 'fa-solid fa-volume-high';
            }
        }
    }

    // Instantiate and expose via namespace
    window.Soundlly.player = new MusicPlayer();
});
