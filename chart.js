document.addEventListener("DOMContentLoaded", function() {
    const svg = d3.select("#vis2"),
          margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom,
          g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleTime().range([0, width]),
          y = d3.scaleLinear().range([height, 0]),
          line = d3.line()
                   .x(d => x(d.date))
                   .y(d => y(d.count));

    d3.csv("watch_history.csv").then(function(data) {
        // Convert date strings to date objects and count occurrences
        const parseDate = d3.timeParse("%d. %b. %Y");
        let summary = d3.rollup(data, v => v.length, d => parseDate(d.date_watched));

        // Format the data for the line chart
        let dataset = Array.from(summary, ([date, count]) => ({ date, count }));

        x.domain(d3.extent(dataset, d => d.date));
        y.domain([0, d3.max(dataset, d => d.count)]);

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .select(".domain")
            .remove();

        g.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Videos per Day");

        g.append("path")
            .datum(dataset)
            .attr("class", "line")
            .attr("d", line);
    });
});
