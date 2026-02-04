/**
 * Si occupa di visualizzare le statistiche dell'utente.
 * Recupera i dati calcolati dal server (che sono nascosti dentro degli input nel DOM)
 * e li usa per riempire le barre di progresso e disegnare il grafico settimanale.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Recupero i dati grezzi che il server ha messo negli input nascosti
    const chartDataInput = document.getElementById('chartDataInput');
    const progressDataInput = document.getElementById('progressDataInput');

    // Valori di default se non trovo nulla
    let chartData = { labels: [], data: [] };
    let progressData = { today: 0, week: 0, month: 0 };

    try {
        // Se ci sono dati, provo a leggerli (sono stringhe JSON URL-encoded)
        if (chartDataInput && chartDataInput.value) {
            chartData = JSON.parse(decodeURIComponent(chartDataInput.value));
        }
        if (progressDataInput && progressDataInput.value) {
            progressData = JSON.parse(decodeURIComponent(progressDataInput.value));
        }
    } catch (e) {
        console.error("Non sono riuscito a leggere i dati delle statistiche", e);
    }

    // --- BARRE DI PROGRESSO ---

    // Funzione veloce per impostare la larghezza in percentuale
    const setWidth = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.style.width = val + '%';
    };

    // Aggiorno le tre barre: Oggi, Questa Settimana, Questo Mese
    setWidth('prog-today', progressData.today);
    setWidth('prog-week', progressData.week);
    setWidth('prog-month', progressData.month);


    // --- GRAFICO SETTIMANALE (Chart.js) ---

    const canvas = document.getElementById('weeklyChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');

        // Creo il grafico a linea
        const myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels, // Es. ['Lun', 'Mar', ...]
                datasets: [{
                    label: 'Minuti Focus',
                    data: chartData.data, // I minuti effettivi
                    backgroundColor: 'rgba(42, 157, 143, 0.2)', // Verde acqua trasparente
                    borderColor: '#2a9d8f',       // Verde acqua solido
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4, // Fa la linea un po' curva e morbida
                    pointBackgroundColor: '#2a9d8f'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Si adatta al contenitore
                plugins: {
                    legend: {
                        display: false // Nascondo la legenda perché c'è un solo dataset
                    },
                    tooltip: {
                        callbacks: {
                            // Formatto il tooltip per dire "X min"
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
                            color: 'rgba(255, 255, 255, 0.1)' // Linee griglia molto leggere
                        },
                        ticks: {
                            color: '#ccc' // Colore testo asse Y
                        }
                    },
                    x: {
                        grid: {
                            display: false // Niente griglia verticale per pulizia
                        },
                        ticks: {
                            color: '#ccc' // Colore testo asse X
                        }
                    }
                }
            }
        });
    }
});
