// 🪙 Fetch live crypto price data from Binance API
async function fetchLiveData() {
  try {
    const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=20');
    const data = await response.json();

    const candleData = data.map(d => ({
      x: new Date(d[0]),
      y: [parseFloat(d[1]), parseFloat(d[2]), parseFloat(d[3]), parseFloat(d[4])]
    }));

    return candleData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

// 🧠 Initialize chart
async function initChart() {
  const candleData = await fetchLiveData();

  const options = {
    chart: {
      type: 'candlestick',
      height: 600,
      background: '#181b20',
      toolbar: { show: true }
    },
    title: {
      text: 'BTC/USDT – Live Market Chart',
      align: 'left',
      style: { color: '#ffe066' }
    },
    series: [{ data: candleData }],
    xaxis: {
      type: 'datetime',
      labels: { style: { colors: '#fff' } }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { style: { colors: '#fff' } }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#2ecb71',
          downward: '#e74c3c'
        }
      }
    }
  };

  const chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();

  // 🔄 Auto-update every 10 seconds
  setInterval(async () => {
    const newData = await fetchLiveData();
    chart.updateSeries([{ data: newData }]);
  }, 10000);
}

initChart();
