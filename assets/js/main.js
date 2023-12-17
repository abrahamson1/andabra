document.addEventListener("DOMContentLoaded", function () {
    // Load and parse the CSV data
    d3.csv("GlobalWeatherRepository.csv").then(function (data) {
        // Log the loaded data to the console to verify
        console.log(data);

        // Clean and parse the data
        data.forEach(function (d) {

        });

            const cleanedData = data.filter(row => {
                // Check if any value in the row is NaN
                for (const key in row) {
                    if (isNaN(row[key])) {
                        return false; // Exclude the row if NaN is found
                    }
                }
                return true; // Include the row if no NaN is found
            });
            
            console.log(cleanedData);

        // Visualization 1: Average Air Quality Index by Country (Bar Chart)
        const groupedData = d3.group(cleanedData, d => d.country);
        const averages = Array.from(groupedData, ([key, values]) => ({
            country: key,
            avgAirQuality: d3.mean(values, d => +d.air_quality_us_epa_index),
        }));

        const svg1 = d3.select("body").append("svg").attr("width", 600).attr("height", 400);

        svg1.selectAll("rect")
            .data(averages)
            .enter()
            .append("rect")
            .attr("x", (d, i) => i * 80)
            .attr("y", d => 400 - d.avgAirQuality * 10)
            .attr("width", 50)
            .attr("height", d => d.avgAirQuality * 10)
            .attr("fill", "blue");

        // Visualization 2: Correlation between Temperature and Air Quality (Scatter Plot)
        const svg2 = d3.select("body").append("svg").attr("width", 600).attr("height", 400);

        svg2.selectAll("circle")
            .data(cleanedData)
            .enter()
            .append("circle")
            .filter(d => !isNaN(+d.temperature_celsius) && !isNaN(+d.air_quality_us_epa_index))
            .attr("cx", d => +d.temperature_celsius * 10)
            .attr("cy", d => +d.air_quality_us_epa_index * 5)
            .attr("r", 5)
            .attr("fill", "red");

        // Visualization 3: Highest and Lowest Levels of Air Pollution
        const pollutants = ["Carbon_Monoxide","PM2.5", "Ozone", "Nitrogen_dioxide", "Sulphur_dioxide", 'PM10'];
        const maxMinData = pollutants.map(pollutant => {
            const values = cleanedData.map(d => +d[`air_quality_${pollutant}`]).filter(value => !isNaN(value));
            return {
                pollutant,
                max: d3.max(values),
                min: d3.min(values),
            };
        });
        const svg3 = d3.select("body").append("svg").attr("width", 600).attr("height", 400);

        const barWidth = 40; // Adjust as needed
        const barPadding = 10; // Adjust as needed
        const groupWidth = barWidth * pollutants.length + barPadding * (pollutants.length - 1);

        const xScale = d3.scaleBand()
            .domain(pollutants)
            .range([0, groupWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(maxMinData, d => d.max)])
            .range([400, 0]);

        const colorScale = d3.scaleOrdinal()
            .domain(["max", "min"])
            .range(["#FF5733", "#33B5FF"]);

        svg3.selectAll(".barGroup")
            .data(maxMinData)
            .enter()
            .append("g")
            .attr("class", "barGroup")
            .attr("transform", (d, i) => `translate(${i * (barWidth + barPadding)}, 0)`)
            .selectAll("rect")
            .data(d => [d.max, d.min])
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", d => yScale(d))
            .attr("width", barWidth)
            .attr("height", d => 400 - yScale(d))
            .attr("fill", (d, i) => colorScale(i === 0 ? "max" : "min"));

        // Visualization 4: Air Quality Trend Over Time (Line Chart)
        // Sort data by time
        data.sort((a, b) => d3.ascending(a.time, b.time));

        // Create a line chart
        const svg4 = d3.select("body").append("svg").attr("width", 600).attr("height", 400);

        const line = d3.line()
            .x(d => new Date(d.time)) // Use the appropriate x-axis scale
            .y(d => +d.air_quality_us_epa_index);

        svg4.append("path")
            .datum(cleanedData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Visualization 5: Air Quality Patterns Based on Wind Direction or Speed (Heatmap)
        const directionBins = d3.range(0, 360, 45);
        const speedBins = [0, 5, 10, 15, 20];

        const processedData = d3.rollup(cleanedData, v => d3.mean(v, d => +d.air_quality_us_epa_index), d => {
            const directionBin = directionBins.find(bin => d.wind_direction < bin);
            const speedBin = speedBins.find(bin => d.wind_mph < bin);
            return `${directionBin}-${speedBin}`;
        });

        // Set up dimensions for the heatmap
        const cellSize = 50;
        const width = directionBins.length * cellSize;
        const height = speedBins.length * cellSize;

        // Create the heatmap
        const heatmap = d3.select("body")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .selectAll("rect")
            .data(processedData)
            .enter().append("rect")
            .attr("x", d => directionBins.indexOf(+d[0].split("-")[0]) * cellSize)
            .attr("y", d => speedBins.indexOf(+d[0].split("-")[1]) * cellSize)
            .attr("width", cellSize)
            .attr("height", cellSize)
            .style("fill", d => colorScale(d[1]));

        // Add axes if needed
        const xAxis = d3.axisBottom().scale(d3.scaleBand().domain(directionBins).range([0, width]));
        const yAxis = d3.axisLeft().scale(d3.scaleBand().domain(speedBins).range([0, height]));

        d3.select("body").append("g").attr("transform", `translate(0, ${height})`).call(xAxis);
        d3.select("body").append("g").call(yAxis);

    }).catch(function (error) {
        console.error("Error loading the CSV file:", error);
    });
});