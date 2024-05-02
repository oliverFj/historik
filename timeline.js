d3.csv("watch_history.csv").then(function(data) {
    // Define the date parser
    var parseDate = d3.timeParse("%d. %b. %Y");
  
    // Parse dates and add a month-year key
    data.forEach(function(d) {
      d.date_watched = parseDate(d.date_watched);
      d.monthYear = d3.timeFormat("%Y-%m")(d.date_watched);
    });
  
    // Filter out undefined dates due to parsing errors
    data = data.filter(d => d.date_watched != null);
  
    // Group by monthYear and then by channel, and count entries
    const groupedData = Array.from(d3.group(data, d => d.monthYear, d => d.channel_name), 
      ([month, channels]) => ({
        month,
        channels: Array.from(channels, ([channel, videos]) => ({
          channel,
          count: videos.length
        }))
      })
    );
  
    // Find the most viewed channel per month
    const mostViewedPerMonth = groupedData.map(({month, channels}) => {
      const mostViewed = channels.reduce((max, channel) => channel.count > max.count ? channel : max, {count: 0});
      return {
        month,
        channel: mostViewed.channel,
        views: mostViewed.count
      };
    });
  
    // Setup the SVG and scales for the bar chart
    var svg = d3.select("svg"),
        margin = {top: 20, right: 20, bottom: 70, left: 70},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.1)
      .domain(mostViewedPerMonth.map(function(d) { return d.month; }));

    var y = d3.scaleLinear()
      .rangeRound([height, 0])
      .domain([0, d3.max(mostViewedPerMonth, function(d) { return d.views; })]);

    // Tooltip setup
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "120px")
        .style("height", "28px")
        .style("padding", "2px")
        .style("font", "12px sans-serif")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
          .attr("y", 0)
          .attr("x", 9)
          .attr("dy", ".35em")
          .attr("transform", "rotate(45)")
          .style("text-anchor", "start");

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y).ticks(10, "d"))
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Number of Views");

    g.selectAll(".bar")
      .data(mostViewedPerMonth)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.month); })
        .attr("y", function(d) { return y(d.views); })
        .attr("width", x.bandwidth())
        .attr("height", function(d) { return height - y(d.views); })
        .style("fill", "steelblue")
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.channel)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

  });
