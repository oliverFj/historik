// barChart.js
import * as d3 from 'https://cdn.skypack.dev/d3@7';

const margin = { top: 30, right: 30, bottom: 70, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
let svg;

export function initializeChart(containerId) {
    if (!width || !height) {
        console.error("Invalid dimensions for the SVG:", width, height);
        return; // Abort the initialization if dimensions are invalid
    }
    svg = d3.select(containerId)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Initialize the axes
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`);

    svg.append('g')
        .attr('class', 'y-axis');
}


export function updateChart(data) {
    const channelColorMap = assignColorsToChannels(data);

    const countByChannel = d3.rollup(data, v => v.length, d => d.channel_name);
    const sortedChannels = Array.from(countByChannel, ([key, value]) => ({ key, value }))
        .sort((a, b) => d3.descending(a.value, b.value))
        .slice(0, 20);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(sortedChannels.map(d => d.key))
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(sortedChannels, d => d.value)])
        .range([height, 0]);

    // Update the axes
    svg.select('.x-axis').transition().duration(750).call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');

    svg.select('.y-axis').transition().duration(750).call(d3.axisLeft(y));

    // Update bars
    const bars = svg.selectAll('.bar')
        .data(sortedChannels, d => d.key);

    bars.exit().transition().duration(750).attr('y', height).attr('height', 0).remove();

    bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .merge(bars)
        .transition()
        .duration(750)
        .attr('x', d => x(d.key))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.value))
        .attr('fill', d => channelColorMap.get(d.key));
}

function assignColorsToChannels(data) {
    const channels = Array.from(new Set(data.map(d => d.channel_name)));
    const customColors = [
        "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896",
        "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7",
        "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"
    ];
    const colorScale = d3.scaleOrdinal(customColors).domain(channels);

    let channelColorMap = new Map();
    channels.forEach(channel => {
        channelColorMap.set(channel, colorScale(channel));
    });

    return channelColorMap;
}
