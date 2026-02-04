/**
 * Gestisce la visualizzazione delle statistiche dell'utente.
 * Recupera i dati calcolati dal server (inseriti nel DOM) e popola
 * grafici e barre di progresso.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Recupero i dati grezzi dagli input nascosti popolati dal server
    const chartDataInput = document.getElementById('chartDataInput');
    const progressDataInput = document.getElementById('progressDataInput');

    // Inizializzazione dati di default
    let chartData = { labels: [], data: [] };
    let progressData = { today: 0, week: 0, month: 0 };

    try {
        // Parsing dei dati JSON se presenti
        if (chartDataInput && chartDataInput.value) {
            chartData = JSON.parse(decodeURIComponent(chartDataInput.value));
        }
        if (progressDataInput && progressDataInput.value) {
            progressData = JSON.parse(decodeURIComponent(progressDataInput.value));
        }
    } catch (e) {
        console.error("Errore nel parsing dei dati statistiche", e);
    }

    // --- BARRE DI PROGRESSO ---

    // Imposta la larghezza della barra di progresso in percentuale
    const setWidth = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.style.width = val + '%';
    };

    // Aggiornamento barre: Oggi, Settimana, Mese
    setWidth('prog-today', progressData.today);
    setWidth('prog-week', progressData.week);
    setWidth('prog-month', progressData.month);


    // --- GRAFICO SETTIMANALE (Chart.js) ---

    const canvas = document.getElementById('weeklyChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        // Configurazione e creazione grafico a linea
        const myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels, // Es. ['Lun', 'Mar', ...]
                datasets: [{
                    label: 'Minuti Focus',
                    data: chartData.data,
                    backgroundColor: 'rgba(42, 157, 143, 0.2)', // Verde acqua trasparente
                    borderColor: '#2a9d8f',       // Verde acqua solido
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4, // Curva morbida (spline)
                    pointBackgroundColor: '#2a9d8f'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            // Format label tooltip
                            label: function (context) {
                                return context.parsed.y + ' min';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ccc'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#ccc'
                        }
                    }
                }
            }
        });
    }
});
