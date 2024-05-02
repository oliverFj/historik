// Load and process the CSV file
document.addEventListener("DOMContentLoaded", function () {
    d3.csv("watch_history.csv").then(data => {
        const monthNames = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };

        data.forEach(d => {
            const parts = d.date_watched ? d.date_watched.split('. ') : [];
            if (parts.length === 3) {
                const monthIndex = monthNames[parts[1].toLowerCase()];
                if (monthIndex !== undefined) {
                    d.fullDate = new Date(parts[2], monthIndex, parts[0]);
                    d.year = d.fullDate.getFullYear().toString();
                } else {
                    d.fullDate = undefined;
                }
            } else {
                d.fullDate = undefined;
            }
        });

       data = data.filter(d => d.fullDate);

        const years = Array.from(new Set(data.map(d => d.year))).sort();
        years.unshift("All Years");  // Add "All Years" option at the beginning of the array

        const select = d3.select("#yearSelect");
        select.selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .text(d => d);

        // Initialize the slider and play controls
        const sliderContainer = d3.select("#slider");
        const slider = sliderContainer.append("input")
            .attr("type", "range")
            .attr("id", "dateSlider")
            .style("width", "800px")
            .attr("min", 0)
            .attr("max", 100)
            .attr("value", 0)
            .attr("step", "1");


        const playButton = document.getElementById('playButton');
        let isPlaying = false;
        let playInterval;

        playButton.addEventListener('click', () => {
            if (!isPlaying) {
                isPlaying = true;
                playButton.textContent = 'Pause';
                playInterval = setInterval(() => {
                    const slider = document.getElementById('dateSlider');
                    const currentValue = +slider.value;
                    const maxValue = +slider.max;
                    const oneDay = 86400000; // milliseconds in one day
                    if (currentValue < maxValue) {
                        slider.value = currentValue + oneDay; // increment by one day
                        slider.dispatchEvent(new Event('input'));
                    } else {
                        clearInterval(playInterval);
                        playButton.textContent = 'Play';
                        isPlaying = false;
                    }
                }, 1000);
            } else {
                clearInterval(playInterval);
                playButton.textContent = 'Play';
                isPlaying = false;
            }
        });

        // Color scale initialization
        let channelColorMap = new Map();
        function assignColorsToChannels(data) {
            const channels = Array.from(new Set(data.map(d => d.channel_name)));

            // Custom color palette
            const customColors = [
                "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896",
                "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7",
                "#bcbd22", "#dbdb8d", "#17becf", "#9edae5", "#393b79", "#5254a3", "#6b6ecf", "#9c9ede",
                "#637939", "#8ca252", "#b5cf6b", "#cedb9c", "#8c6d31", "#bd9e39", "#e7ba52", "#e7cb94",
                "#843c39", "#ad494a", "#d6616b", "#e7969c", "#7b4173", "#a55194", "#ce6dbd", "#de9ed6"
            ];

            // If more channels than colors, repeat colors (cycle through)
            const colorScale = d3.scaleOrdinal(customColors);

            channels.forEach(channel => {
                if (!channelColorMap.has(channel)) {
                    channelColorMap.set(channel, colorScale(channel));
                }
            });
        }

        function update(selectedYear) {
            let yearData = data;
            if (selectedYear !== "All Years") {
                yearData = data.filter(d => d.year === selectedYear);
            }
            const minDate = new Date(Math.min(...yearData.map(d => d.fullDate.getTime())));
            const maxDate = new Date(Math.max(...yearData.map(d => d.fullDate.getTime())));

            slider.attr("min", minDate.getTime())
                .attr("max", maxDate.getTime())
                .attr("value", minDate.getTime())
                .on("input", function () {
                    const selectedDate = new Date(+this.value);
                    updateChart(selectedDate, yearData);
                    d3.select("#dateDisplay").text(selectedDate.toDateString());
                });

            updateChart(minDate, yearData); // Initial chart update
            d3.select("#dateDisplay").text(minDate.toDateString()); // Initial date display
        }

        function updateChart(selectedDate, yearData) {
            const filteredData = yearData.filter(d => d.fullDate <= selectedDate);
            const countByChannel = d3.rollup(filteredData, v => v.length, d => d.channel_name);
            const sortedChannels = Array.from(countByChannel, ([key, value]) => ({ key, value }))
                .sort((a, b) => d3.descending(a.value, b.value))
                .slice(0, 20);
        
            assignColorsToChannels(filteredData);
        
            const svg = d3.select("#vis1");
            const margin = { top: 30, right: 30, bottom: 70, left: 60 },
                width = 800 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;
        
            const x = d3.scaleBand()
                .range([0, width])
                .domain(sortedChannels.map(d => d.key))
                .padding(0.2);
        
            const y = d3.scaleLinear()
                .domain([0, d3.max(sortedChannels, d => d.value)])
                .range([height, 0]);
        
            svg.attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("transform", `translate(${margin.left},${margin.top})`);
        
            // Create or update the X axis
            let xAxis = svg.select(".x-axis");
            if (xAxis.empty()) {
                xAxis = svg.append("g")
                    .attr("class", "x-axis")
                    .attr("transform", `translate(0,${height})`);
            }
            xAxis.transition().duration(750).call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");
        
            // Create or update the Y axis
            let yAxis = svg.select(".y-axis");
            if (yAxis.empty()) {
                yAxis = svg.append("g")
                    .attr("class", "y-axis");
            }
            yAxis.transition().duration(750).call(d3.axisLeft(y));
        
            // Data join for bars
            const bars = svg.selectAll(".bar")
                .data(sortedChannels, d => d.key);
        
            // Exit old bars
            bars.exit().transition().duration(750).attr("y", height).attr("height", 0).remove();
        
            // Enter new bars
            bars.enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.key))
                .attr("y", height)
                .attr("height", 0)
                .attr("fill", d => channelColorMap.get(d.key))
                .merge(bars)
                .transition()
                .duration(750)
                .attr("x", d => x(d.key))
                .attr("y", d => y(d.value))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d.value));
        }
        
        

        if (years.length > 0) {
            update("All Years"); // Initialize with "All Years" selected
        }

        select.on("change", function (event) {
            update(this.value);
        });
    });
});
