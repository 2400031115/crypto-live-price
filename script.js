// Real-time Crypto Candlestick Chart (Binance API + ApexCharts)

let candleData = [];
let chart;
let currentSymbol = "btcusdt";

// Elements
const chartElement = document.querySelector("#chart");
const priceDisplay = document.querySelector("#currentPrice");
const changeDisplay = document.querySelector("#priceChange");
const titleDisplay = document.querySelector("#pairTitle");
const symbolSelect = document.querySelector("#symbolSelect");

// Initialize chart
function initChart() {
  chart = new ApexCharts(chartElement, {
    chart: {
      type: "candlestick",
      height: 600,
      background: "#181b20",
      toolbar: { show: true },
    },
    series: [{ data: [] }],
    xaxis: {
      type: "datetime",
      labels: { style: { colors: "#fff" } },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { style: { colors: "#fff" } },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#2ecb71",
          downward: "#e74c3c",
        },
      },
    },
  });
  chart.render();
}

// Load candles from Binance REST API
async function loadInitialData(symbol) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1m&limit=100`;
  const res = await fetch(url);
  const data = await res.json();
  candleData = data.map((d) => ({
    x: new Date(d[0]),
    y: [parseFloat(d[1]), parseFloat(d[2]), parseFloat(d[3]), parseFloat(d[4])],
  }));
  chart.updateSeries([{ data: candleData }]);
  updatePrice(candleData[candleData.length - 1].y[3]);
}

// WebSocket live updates
let socket;

function connectWebSocket(symbol) {
  if (socket) socket.close();

  socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_1m`);

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const k = msg.k;

    const candle = {
      x: new Date(k.t),
      y: [parseFloat(k.o), parseFloat(k.h), parseFloat(k.l), parseFloat(k.c)],
    };

    const last = candleData[candleData.length - 1];
    if (last && last.x.getTime() === candle.x.getTime()) {
      candleData[candleData.length - 1] = candle;
    } else {
      candleData.push(candle);
      if (candleData.length > 100) candleData.shift();
    }

    chart.updateSeries([{ data: candleData }]);
    updatePrice(k.c);
  };

  socket.onclose = () => setTimeout(() => connectWebSocket(symbol), 3000);
}

function updatePrice(latestPrice) {
  priceDisplay.textContent = parseFloat(latestPrice).toFixed(2);

  const prevClose = candleData[candleData.length - 2]?.y[3];
  if (!prevClose) return;

  const change = ((latestPrice - prevClose) / prevClose) * 100;
  changeDisplay.textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
  changeDisplay.style.color = change >= 0 ? "#2ecb71" : "#e74c3c";
}

// Switch symbol when dropdown changes
symbolSelect.addEventListener("change", () => {
  currentSymbol = symbolSelect.value;
  titleDisplay.textContent = currentSymbol.toUpperCase();
  loadInitialData(currentSymbol).then(() => connectWebSocket(currentSymbol));
});

// Init
initChart();
loadInitialData(currentSymbol).then(() => connectWebSocket(currentSymbol));
