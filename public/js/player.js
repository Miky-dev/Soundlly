// public/js/player.js

/**
 * Gestione Player Musicale
 * Questo script controlla la barra di riproduzione fissa in basso nella pagina.
 * 
 * Funzionalità:
 * 1. Gestione riproduzione audio (Play, Pausa, Volume, Seek).
 * 2. Aggiornamento interfaccia (Titolo, Autore, Cover, Barra progressi).
 * 3. Supporto per diverse sorgenti audio (Musica vs Ambient).
 */

document.addEventListener('DOMContentLoaded', () => {
    // Assicura che esista il namespace globale Soundlly
    window.Soundlly = window.Soundlly || {};

    class MusicPlayer {
        constructor() {
            // Elemento audio HTML5 nativo (invisibile)
            this.audio = new Audio();

            // Elementi UI del Player
            this.playerBar = document.getElementById('music-player-bar');
            this.coverImg = document.getElementById('player-cover-img');
            this.titleEl = document.getElementById('player-title');
            this.artistEl = document.getElementById('player-artist');

            // Controlli
            this.playBtn = document.getElementById('player-play-btn');
            this.playIcon = this.playBtn ? this.playBtn.querySelector('i') : null;
            this.closeBtn = document.getElementById('player-close-btn');
            this.volumeSlider = document.getElementById('player-volume-slider');
            this.volumeIcon = document.getElementById('volume-icon');

            // Barra di Progresso
            this.progressFill = document.getElementById('player-progress-fill');
            this.currentTimeEl = document.getElementById('player-current-time');
            this.totalTimeEl = document.getElementById('player-total-time');
            this.progressBar = document.getElementById('player-progress-bar');

            this.isPlaying = false;

            // Inizializza gli eventi se il player esiste nella pagina
            if (this.playBtn) this.initEvents();
        }

        initEvents() {
            // Pulsante Chiudi Player
            if (this.closeBtn) {
                this.closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.closePlayer();
                };
            }

            // Slider Volume
            if (this.volumeSlider) {
                this.volumeSlider.addEventListener('input', (e) => {
                    this.audio.volume = e.target.value;
                    this.updateVolumeIcon();
                });
            }

            // Toggle Play/Pausa
            if (this.playBtn) {
                this.playBtn.addEventListener('click', () => this.togglePlay());
            }

            // Eventi nativi dell'oggetto Audio
            this.audio.addEventListener('timeupdate', () => this.updateProgress()); // Aggiorna barra mentre suona
            this.audio.addEventListener('loadedmetadata', () => {
                // Appena caricato il brano, mostra la durata totale
                if (this.totalTimeEl) this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
            });
            this.audio.addEventListener('ended', () => {
                // A fine brano, resetta lo stato a pausa
                this.isPlaying = false;
                this.updatePlayBtnState();
            });

            // Click sulla barra di avanzamento (Seek)
            if (this.progressBar) {
                this.progressBar.addEventListener('click', (e) => {
                    const rect = this.progressBar.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    this.audio.currentTime = percent * this.audio.duration; // Salta al punto cliccato
                });
            }
        }

        /**
         * Riproduce una traccia specifica
         * @param {Object} item - Oggetto contenente i metadati del brano (title, author, icon, filename, category)
         */
        playTrack(item) {
            // Mostra il player se era nascosto
            if (this.playerBar) this.playerBar.classList.add('active');

            // Aggiorna testi
            if (this.titleEl) this.titleEl.textContent = item.title;
            if (this.artistEl) this.artistEl.textContent = item.author || 'Sconosciuto';

            // Imposta Immagine di Copertina (o default)
            const bgUrl = (item.icon && item.icon.includes('/')) ? item.icon : '/immagini/usericon.png';
            if (this.coverImg) this.coverImg.src = bgUrl;

            // Risolve il percorso del file audio
            let src = item.filename;
            if (!src.startsWith('http') && !src.startsWith('/')) {
                // Se non è un path assoluto, costruiscilo in base alla categoria
                if (item.category === 'ambient') {
                    // Se l'owner è admin, usa 'ambient', altrimenti 'suoni'
                    // Se owner_role non è definito, assume 'suoni' se stiamo suonando da creators list
                    const folder = (item.owner_role === 'admin') ? 'ambient' : 'suoni';
                    src = '/audio/' + folder + '/' + src;
                } else {
                    // Default per musica
                    src = '/audio/musiche/' + src;
                }
            }

            // Gestione Play
            if (this.audio.src.includes(src)) {
                // Se è lo stesso brano, riprendi se in pausa
                if (this.audio.paused) {
                    this.audio.play();
                    this.isPlaying = true;
                }
            } else {
                // Nuovo brano: carica e riproduci
                this.audio.src = src;
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    this.updatePlayBtnState();
                }).catch(e => {
                    console.error("Errore riproduzione audio:", e);
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
            if (this.playerBar) this.playerBar.classList.remove('active'); // Nascondi UI
        }

        // Cambia l'icona Play/Pause
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

        // Aggiorna la barra di progresso e il tempo corrente
        updateProgress() {
            if (!this.audio.duration) return;

            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            if (this.progressFill) this.progressFill.style.width = `${percent}%`;

            if (this.currentTimeEl) this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }

        // Utility: millisecondi -> MM:SS
        formatTime(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? '0' + sec : sec}`;
        }

        // Aggiorna l'icona del volume (mute, basso, alto)
        updateVolumeIcon() {
            if (!this.volumeIcon) return;
            const vol = this.audio.volume;
            this.volumeIcon.className = ''; // Reset classi

            if (vol === 0) {
                this.volumeIcon.className = 'fa-solid fa-volume-xmark';
            } else if (vol < 0.5) {
                this.volumeIcon.className = 'fa-solid fa-volume-low';
            } else {
                this.volumeIcon.className = 'fa-solid fa-volume-high';
            }
        }
    }

    // Istanzia il player e lo rende globale per essere chiamato da altri script (es. playTrack)
    window.Soundlly.player = new MusicPlayer();
});
