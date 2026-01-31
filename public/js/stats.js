document.addEventListener('DOMContentLoaded', () => {
    // Retrieve and parse data from hidden inputs
    const chartDataInput = document.getElementById('chartDataInput');
    const progressDataInput = document.getElementById('progressDataInput');

    let chartData = { labels: [], data: [] };
    let progressData = { today: 0, week: 0, month: 0 };

    try {
        if (chartDataInput && chartDataInput.value) {
            chartData = JSON.parse(decodeURIComponent(chartDataInput.value));
        }
        if (progressDataInput && progressDataInput.value) {
            progressData = JSON.parse(decodeURIComponent(progressDataInput.value));
        }
    } catch (e) {
        console.error("Error parsing stats data", e);
    }

    // Set Progress Bars
    const setWidth = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.style.width = val + '%';
    };
    setWidth('prog-today', progressData.today);
    setWidth('prog-week', progressData.week);
    setWidth('prog-month', progressData.month);


    // Render Chart
    const canvas = document.getElementById('weeklyChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Minuti Focus',
                    data: chartData.data,
                    backgroundColor: 'rgba(42, 157, 143, 0.2)',
                    borderColor: '#2a9d8f',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4, // Smooth curve
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
