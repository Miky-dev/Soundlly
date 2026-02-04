/**
 * Gestisce tutto l'audio (play, pausa, volume, avanzamento) e aggiorna l'interfaccia
 * con il titolo del brano, l'autore e la copertina.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Mi assicuro che la "scatola" globale Soundlly esista, per poterci mettere dentro il player dopo
    window.Soundlly = window.Soundlly || {};

    class MusicPlayer {
        constructor() {
            // Creo l'elemento audio invisibile che farà tutto il lavoro sporco
            this.audio = new Audio();

            // Mi salvo tutti i riferimenti ai tasti e alle scritte del player
            this.playerBar = document.getElementById('music-player-bar');
            this.coverImg = document.getElementById('player-cover-img');
            this.titleEl = document.getElementById('player-title');
            this.artistEl = document.getElementById('player-artist');

            // I bottoni di controllo
            this.playBtn = document.getElementById('player-play-btn');
            this.playIcon = this.playBtn ? this.playBtn.querySelector('i') : null;
            this.prevBtn = document.getElementById('player-prev-btn');
            this.nextBtn = document.getElementById('player-next-btn');
            this.closeBtn = document.getElementById('player-close-btn');
            this.volumeSlider = document.getElementById('player-volume-slider');
            this.volumeIcon = document.getElementById('volume-icon');

            // La barra che mostra a che punto siamo del brano
            this.progressFill = document.getElementById('player-progress-fill');
            this.currentTimeEl = document.getElementById('player-current-time');
            this.totalTimeEl = document.getElementById('player-total-time');
            this.progressBar = document.getElementById('player-progress-bar');

            this.isPlaying = false;

            // Se il player c'è nella pagina (potrebbe non esserci in alcune viste), attivo tutto
            if (this.playBtn) this.initEvents();
        }

        initEvents() {
            // Tasto "X" per chiudere il player
            if (this.closeBtn) {
                this.closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.closePlayer();
                };
            }

            // Slider del Volume
            if (this.volumeSlider) {
                this.volumeSlider.addEventListener('input', (e) => {
                    this.audio.volume = e.target.value;
                    this.updateVolumeIcon(); // Cambio l'icona se metti mute o volume basso
                });
            }

            // Play / Pausa
            if (this.playBtn) {
                this.playBtn.addEventListener('click', () => this.togglePlay());
            }

            // Avanti / Indietro
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.playPrev());
            }
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.playNext());
            }

            // La coda di riproduzione: qui ci metto i brani che l'utente vuole ascoltare
            this.queue = [];
            this.currentIndex = -1;

            // Ascolto cosa fa l'elemento audio vero e proprio
            this.audio.addEventListener('timeupdate', () => this.updateProgress()); // Ogni secondo aggiorno la barra
            this.audio.addEventListener('loadedmetadata', () => {
                // Appena il brano è pronto, scrivo quanto dura
                if (this.totalTimeEl) this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
            });
            this.audio.addEventListener('ended', () => {
                // Finito un brano, passo al prossimo (se c'è), altrimenti mi fermo
                if (this.currentIndex < this.queue.length - 1) {
                    this.playQueue(this.queue, this.currentIndex + 1);
                } else {
                    this.isPlaying = false;
                    this.updatePlayBtnState();
                }
            });

            // Se clicco sulla barra di progresso, salto a quel punto del brano
            if (this.progressBar) {
                this.progressBar.addEventListener('click', (e) => {
                    const rect = this.progressBar.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    this.audio.currentTime = percent * this.audio.duration;
                });
            }
        }

        /**
         * Fa partire una lista di canzoni
         * @param {Array} list - L'elenco dei brani
         * @param {Number} startIndex - Da quale numero iniziare (default: il primo)
         */
        playQueue(list, startIndex = 0) {
            this.queue = list;
            this.currentIndex = startIndex;
            const item = this.queue[this.currentIndex];
            this.playTrack(item);
        }

        /**
         * Suona una traccia specifica
         * @param {Object} item - I dati del brano (titolo, autore, file, ecc.)
         */
        playTrack(item) {
            // Se mi arriva un brano singolo e diverso da quello attuale, resetto la coda
            if (this.queue.length === 0 || (this.queue[this.currentIndex] && this.queue[this.currentIndex].id !== item.id)) {
                this.queue = [item];
                this.currentIndex = 0;
            }

            // Tiro su il sipario: mostro il player
            if (this.playerBar) this.playerBar.classList.add('active');

            // Aggiorna le scritte
            if (this.titleEl) this.titleEl.textContent = item.title;
            if (this.artistEl) this.artistEl.textContent = item.author || 'Sconosciuto';

            // Metto la copertina giusta (o quella di default se manca)
            const bgUrl = (item.icon && item.icon.includes('/')) ? item.icon : '/immagini/copertinaDef.png';
            if (this.coverImg) this.coverImg.src = bgUrl;

            // Uso l'API di streaming per recuperare l'audio, così è più sicuro e veloce
            let src = `/api/stream/track/${item.id}`;

            // Se sto già suonando questo brano, faccio solo un resume
            if (this.audio.src.includes(src)) {
                if (this.audio.paused) {
                    this.audio.play();
                    this.isPlaying = true;
                }
            } else {
                // Altrimenti carico il nuovo file audio
                this.audio.src = src;
                this.audio.play().then(() => {
                    this.isPlaying = true;
                    this.updatePlayBtnState();

                }).catch(e => {
                    console.error("Non riesco a suonare:", e);
                    // Non mostro alert per non disturbare l'utente, magari è solo un glitch momentaneo
                });
            }

            this.updatePlayBtnState();
        }

        playNext() {
            if (this.queue.length > 0 && this.currentIndex < this.queue.length - 1) {
                this.playQueue(this.queue, this.currentIndex + 1);
            }
        }

        playPrev() {
            // Se sono passati più di 3 secondi, torno all'inizio della canzone invece che a quella prima
            if (this.audio.currentTime > 3) {
                this.audio.currentTime = 0;
                return;
            }

            if (this.queue.length > 0 && this.currentIndex > 0) {
                this.playQueue(this.queue, this.currentIndex - 1);
            }
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

            // Nascondo tutto
            if (this.playerBar) this.playerBar.classList.remove('active');
        }

        // Cambio l'icona da Play a Pausa e viceversa
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

        // Muovo la barra blu mentre la canzone va avanti
        updateProgress() {
            if (!this.audio.duration) return;

            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            if (this.progressFill) this.progressFill.style.width = `${percent}%`;

            if (this.currentTimeEl) this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }

        // Trasformo i secondi in "minuti:secondi" (es. 125s -> 02:05)
        formatTime(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? '0' + sec : sec}`;
        }

        // Aggiorno l'icona dell'altoparlante in base al volume
        updateVolumeIcon() {
            if (!this.volumeIcon) return;
            const vol = this.audio.volume;
            this.volumeIcon.className = ''; // Pulisco le classi vecchie

            if (vol === 0) {
                this.volumeIcon.className = 'fa-solid fa-volume-xmark';
            } else if (vol < 0.5) {
                this.volumeIcon.className = 'fa-solid fa-volume-low';
            } else {
                this.volumeIcon.className = 'fa-solid fa-volume-high';
            }
        }
    }

    // Rendo il player accessibile ovunque scrivendo "window.Soundlly.player"
    window.Soundlly.player = new MusicPlayer();
});
