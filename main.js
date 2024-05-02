// main.js
import { loadData, setupYearSelect, initializeSlider, playControl } from './dataManager.js';
import { initializeChart, updateChart } from './barChart.js';

async function init() {
    const data = await loadData('watch_history.csv'); // Provide the correct path to your CSV file
    setupYearSelect(data, '#yearSelect'); // Setup the dropdown for year selection
    const slider = initializeSlider('#slider', 0, 0, 100); // Initialize your slider with dummy values
    playControl('playButton', 'slider', 100); // Setup play controls
    initializeChart('#vis1'); // Initialize the chart in the specified container
    updateChart(data); // Pass the loaded data to the chart
}

document.addEventListener('DOMContentLoaded', init);

document.getElementById('slider').addEventListener('input', function() {
    updateChart(data.filter(d => new Date(d.fullDate).getTime() <= parseInt(this.value, 10)));
});

document.getElementById('yearSelect').addEventListener('change', function() {
    const selectedYear = this.value;
    const filteredData = selectedYear === "All Years" ? data : data.filter(d => d.year === selectedYear);
    updateChart(filteredData);
});