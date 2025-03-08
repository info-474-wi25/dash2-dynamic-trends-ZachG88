// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 50, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#lineChart1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("aircraft_incidents.csv").then(data => {
    // Parse date and convert total fatal injuries to numbers
    data.forEach(d => {
        d.Event_Date = d3.timeParse("%m/%d/%y")(d.Event_Date);
        d.Total_Fatal_Injuries = +d.Total_Fatal_Injuries || 0; // Ensure numbers
    });

    // Extract unique aircraft manufacturers (Make) for dropdown
    const aircraftMakes = [...new Set(data.map(d => d.Make))].filter(d => d);

    // Create dropdown options
    const dropdown = d3.select("#accidentFilter")
        .append("select")
        .on("change", () => updateChart(dropdown.node().value));
    
    dropdown.append("option").text("All").attr("value", "all");
    aircraftMakes.forEach(make => {
        dropdown.append("option").text(make).attr("value", make);
    });

    // Define scales
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().nice().range([height, 0]);

    // Define line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.total))
        .curve(d3.curveMonotoneX);

    // Append axes groups with class names
    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
    svg.append("g").attr("class", "y-axis");

    // Append axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Total Fatal Injuries");

    function updateChart(selectedMake) {
        let filteredData = data;

        if (selectedMake !== "all") {
            filteredData = data.filter(d => d.Make === selectedMake);
        }

        // Aggregate data by year
        const yearlyData = d3.rollup(filteredData, 
            v => d3.sum(v, d => +d.Total_Fatal_Injuries || 0), 
            d => d3.timeFormat("%Y")(d.Event_Date)
        );

        const processedData = Array.from(yearlyData, ([year, total]) => ({ 
            year: new Date(year, 0, 1), total 
        })).sort((a, b) => a.year - b.year);

        // Update scales
        xScale.domain(d3.extent(processedData, d => d.year));
        yScale.domain([0, d3.max(processedData, d => d.total)]).nice();

        // Bind data and update line
        const linePath = svg.selectAll(".line-path").data([processedData]);

        linePath.enter()
            .append("path")
            .attr("class", "line-path")
            .merge(linePath)
            .transition()
            .duration(750)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Update axes
        svg.select(".x-axis").transition().duration(750).call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat("%Y")));
        svg.select(".y-axis").transition().duration(750).call(d3.axisLeft(yScale));
    }

    updateChart("all"); // Initial render with all data
});
