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

// Load Data
d3.csv("aircraft_incidents.csv").then(data => {
    
    // Parse date and convert total fatal injuries to numbers
    data.forEach(d => {
        d.Event_Date = d3.timeParse("%m/%d/%y")(d.Event_Date);
        d.Total_Fatal_Injuries = +d.Total_Fatal_Injuries || 0; // Ensure numbers
    });

    // Aggregate total fatal injuries per year
    const yearlyData = d3.rollup(data, 
        v => d3.sum(v, d => d.Total_Fatal_Injuries), 
        d => d3.timeFormat("%Y")(d.Event_Date)
    );

    const processedData = Array.from(yearlyData, ([year, total]) => ({ 
        year: new Date(year, 0, 1), total 
    })).sort((a, b) => a.year - b.year);

    // Set scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(processedData, d => d.year))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.total)])
        .nice()
        .range([height, 0]);

    // Define line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.total))
        .curve(d3.curveMonotoneX); // Smooth line

    // Add line to SVG
    svg.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add trendline 
    // const xValues = processedData.map(d => d.year.getFullYear());
    // const yValues = processedData.map(d => d.total);
    // const regression = ss.linearRegression(ss.linearRegressionLine(ss.linearRegression(xValues.map((x, i) => [x, yValues[i]]))));

    // const trendlineData = [
    //     { year: processedData[0].year, total: regression(processedData[0].year.getFullYear()) },
    //     { year: processedData[processedData.length - 1].year, total: regression(processedData[processedData.length - 1].year.getFullYear()) }
    // ];

    // svg.append("path")
    //     .datum(trendlineData)
    //     .attr("fill", "none")
    //     .attr("stroke", "gray")
    //     .attr("stroke-dasharray", "5,5")
    //     .attr("stroke-width", 2)
    //     .attr("d", line);

    // Add Axes
    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d3.timeFormat("%Y"));
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    // Labels

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

});
