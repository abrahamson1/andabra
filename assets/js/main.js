document.addEventListener("DOMContentLoaded", function () {
    // Load and parse the CSV data
    d3.csv("GlobalWeatherRepository.csv").then(function (data) {
        console.log(data); // Check if data is loaded correctly
        // Clean and parse the data
        const cleanedData = data.filter(row => {
            for (const key in row) {
                // Check if the value is a number
                if (!isNaN(row[key]) && isFinite(row[key])) {
                    // Parse the number as an integer
                    row[key] = parseInt(row[key]);
                } else {
                    // Handle missing or invalid numeric values
                    row[key] = 0;
                }
            }
            // Check if any value in the row is NaN after conversion
            const allValuesAreNaN = Object.values(row).every(value => isNaN(value));
            return !allValuesAreNaN;
        });

        // Visualization 1: Average Air Quality Index by Country (Bar Chart)
        // set the dimensions and margins of the graph
        const margin1 = { top: 10, right: 30, bottom: 90, left: 40 };
        const width1 = 800 - margin1.left - margin1.right;
        const height1 = 450 - margin1.top - margin1.bottom;

        // append the svg object to the body of the page
        const svg = d3.select("#visualization1")
            .append("svg")
            .attr("width", width1 + margin1.left + margin1.right)
            .attr("height", height1 + margin1.top + margin1.bottom)
            .append("g")
            .attr("transform", `translate(${margin1.left},${margin1.top})`);

        const groupedData = d3.group(cleanedData, d => d.country);

        const averages = Array.from(groupedData, ([key, values]) => {
            const avgAirQuality = d3.mean(values, d => +d.air_quality_us_epa_index);
            return {
                country: key,
                avgAirQuality: isNaN(avgAirQuality) ? 0 : avgAirQuality,
            };
        });

        // X axis
        const x1 = d3.scaleBand()
            .range([0, width1])
            .domain(averages.map(d => d.country))
            .padding(0.2);

        svg.append("g")
            .attr("transform", `translate(0,${height1})`)
            .call(d3.axisBottom(x1))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        const y1 = d3.scaleLinear()
            .domain([0, d3.max(averages, d => d.avgAirQuality)])
            .range([height1, 0]);

        svg.append("g")
            .call(d3.axisLeft(y1));

        // Bars
        svg.selectAll("mybar")
        .data(averages)
        .join("rect")
        .attr("x", d => x1(d.country))
        .attr("width", x1.bandwidth())
        .attr("fill", "#69b3a2")
        .attr("y", d => y1(d.avgAirQuality))
        .attr("height", d => height1 - y1(d.avgAirQuality));

        // Animation
        svg.selectAll("rect")
            .transition()
            .duration(800)
            .attr("y", d => y1(d.avgAirQuality))
            .attr("height", d => height1 - y1(d.avgAirQuality))
            .delay((d, i) => i * 100);


        // Visualization 2: Correlation between Temperature and Air Quality (Scatter Plot)
        const margin2 = { top: 10, right: 30, bottom: 30, left: 60 };
        const width2 = 600 - margin2.left - margin2.right;
        const height2 = 400 - margin2.top - margin2.bottom;
        
        // append the svg object to the body of the page
        const svg2 = d3.select("#visualization2")
            .append("svg")
            .attr("width", width2 + margin2.left + margin2.right)
            .attr("height", height2 + margin2.top + margin2.bottom)
            .append("g")
            .attr("transform", `translate(${margin2.left}, ${margin2.top})`);
        
        // Add X axis
        const x2 = d3.scaleLinear()
            .domain([-40, 150])
            .range([0, width2]);
        
        svg2.append("g")
            .attr("transform", `translate(0, ${height2})`)
            .call(d3.axisBottom(x2).ticks(10));
        
        // Add Y axis
        const y2 = d3.scaleLinear()
            .domain([-40, 150])
            .range([height2, 0]);
        
        svg2.append("g")
            .call(d3.axisLeft(y2).ticks(10));
        
        // Add a tooltip div
        const tooltip2 = d3.select("#visualization2")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px");
        
        // A function that changes the tooltip when the user hovers over a point.
        const mouseover = function (event, d) {
            tooltip2.style("opacity", 1);
        };
        
        const mousemove = function (event, d) {
            tooltip2
                .html(`Temperature: ${+d.temperature_fahrenheit}<br>Air Quality: ${+d.air_quality_us_epa_index}`)
                .style("left", (event.x) / 2 + "px")
                .style("top", (event.y) / 2 + "px");
        };
        
        // A function that changes the tooltip when the user leaves a point
        const mouseleave = function (event, d) {
            tooltip2
                .transition()
                .duration(200)
                .style("opacity", 0);
        };
        
        // Add dots
        svg2.append('g')
            .selectAll("dot")
            .data(cleanedData.filter((d, i) => !isNaN(+d.temperature_fahrenheit) && !isNaN(+d.air_quality_us_epa_index) && i < 50))
            .enter()
            .append("circle")
            .attr("cx", d => x2(+d.air_quality_us_epa_index))
            .attr("cy", d => y2(+d.temperature_fahrenheit))
            .attr("r", 7)
            .style("fill", "#69b3a2")
            .style("opacity", 0.3)
            .style("stroke", "white")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);



        // Visualization 3: Highest and Lowest Levels of Air Pollution
        const pollutants = ["Carbon_Monoxide", "PM2.5", "Ozone", "Nitrogen_dioxide", "Sulphur_dioxide", 'PM10'];
        const maxMinData = pollutants.map(pollutant => {
            const values = cleanedData.map(d => +d[`air_quality_${pollutant}`]).filter(value => !isNaN(value));
            return {
                pollutant,
                max: d3.max(values),
                min: d3.min(values),
            };
        });

        // Set the dimensions and margins of the graph
        const margin3 = { top: 10, right: 30, bottom: 90, left: 40 };
        const width3 = 600 - margin3.left - margin3.right;
        const height3 = 400 - margin3.top - margin3.bottom;

        const barWidth = 40;
        const barPadding = 10;

        // Define a color scale
        const colorScale1 = d3.scaleOrdinal()
            .domain(["max", "min"])
            .range(["#FF5733", "#33B5E5"]); // Add your preferred colors

        // Append the SVG object to the body of the page
        const svg3 = d3.select("#visualization3")
            .append("svg")
            .attr("width", width3 + margin3.left + margin3.right)
            .attr("height", height3 + margin3.top + margin3.bottom)
            .append("g")
            .attr("transform", `translate(${margin3.left},${margin3.top})`);

        // X axis
        const x3 = d3.scaleBand()
            .range([0, width3])
            .domain(pollutants)
            .padding(0.2);

        svg3.append("g")
            .attr("transform", `translate(0,${height3})`)
            .call(d3.axisBottom(x3))
            .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

        // Y axis
        const y3 = d3.scaleLinear()
            .domain([0, d3.max(maxMinData, d => Math.max(d.max, d.min))])
            .range([height3, 0]);

        svg3.append("g")
            .call(d3.axisLeft(y3));

        // Bars
        svg3.selectAll("mybar")
            .data(maxMinData)
            .enter()
            .append("g")
            .attr("class", "barGroup")
            .attr("transform", (d, i) => `translate(${x3(d.pollutant) + i * (barWidth + barPadding)}, 0)`)
            .selectAll("rect")
            .data(d => [d.max, d.min])
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", d => y3(d))
            .attr("width", barWidth)
            .attr("height", d => height3 - y3(d))
            .attr("fill", (d, i) => colorScale1(i === 0 ? "max" : "min"));

        // Animation
        svg3.selectAll("rect")
            .transition()
            .duration(800)
            .attr("height", d => height3 - y3(d))
            .delay((d, i) => i * 100);


        // Visualization 4: Air Quality Trend Over Time (Line Chart)
        // set the dimensions and margins of the graph
        const margin4 = { top: 10, right: 100, bottom: 30, left: 30 };
        const width4 = 460 - margin4.left - margin4.right;
        const height4 = 400 - margin4.top - margin4.bottom;

        // append the svg object to the body of the page
        const svg4 = d3.select("#visualization4")
            .append("svg")
            .attr("width", width4 + margin4.left + margin4.right)
            .attr("height", height4 + margin4.top + margin4.bottom)
            .append("g")
            .attr("transform", `translate(${margin4.left},${margin4.top})`);

        // Add the pollutants as options to the button
        d3.select("#selectButton")
            .selectAll('myOptions')
            .data(pollutants)
            .enter()
            .append('option')
            .text(d => d) // Text showed in the menu
            .attr("value", d => d); // Corresponding value returned by the button

        // Parse the date strings into JavaScript Date objects
        cleanedData.forEach(d => {
            d.last_updated = new Date(d.last_updated);
        });

        // Sort the data by time
        cleanedData.sort((a, b) => d3.ascending(a.last_updated, b.last_updated));

        const allValues = pollutants.flatMap(pollutant =>
            cleanedData.map(d => +d[`air_quality_${pollutant}`]).filter(value => !isNaN(value))
        );

        // Create a time scale for x
        const x4 = d3.scaleTime()
            .domain(d3.extent(cleanedData, d => d.last_updated))
            .range([0, width4]);

        // Create a linear scale for y
        const y4 = d3.scaleLinear()
        .domain([d3.min(allValues), d3.max(allValues)])
        .range([400, 0]);

        // Initialize line with the air quality index data for the default pollutant
        const defaultPollutant = pollutants[0];
        const defaultData = cleanedData.map(d => ({ last_updated: d.last_updated, value: +d[defaultPollutant] }));

        const line = svg4
            .append("path")
            .datum(defaultData)
            .attr("d", d3.line()
                .x(d => x4(d.last_updated))
                .y(d => y4(+d.value))
            )
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);

        // A function that updates the chart
        function update(selectedGroup) {
            // Create new data with the selection
            const dataFilter = cleanedData.map(d => ({ last_updated: d.last_updated, value: +d[selectedGroup] }));

            // Update the line
            line
                .datum(dataFilter)
                .transition()
                .duration(1000)
                .attr("d", d3.line()
                    .x(d => x4(d.last_updated))
                    .y(d => y4(+d.value))
                );
        }
        // When the button is changed, run the updateChart function
        d3.select("#selectButton").on("change", function () {
            // Recover the option that has been chosen
            const selectedOption = d3.select(this).property("value");
            // Run the updateChart function with this selected option
            update(selectedOption);
        });


        // Visualization 5:  Air Quality Patterns Based on Wind Direction or Speed (Heatmap)
        // set the dimensions and margins of the graph
        const margin = { top: 80, right: 25, bottom: 30, left: 40 },
        width = 450 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg5 = d3.select("#visualization5")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
        const directionBins = [...new Set(data.map(d => d.wind_direction))];
        const speedBins = [...new Set(data.map(d => +d.wind_mph))];

        // Build X scales and axis:
        const x = d3.scaleBand()
            .range([0, width])
            .domain(directionBins.map(bin => `${bin}-${bin + 45}`))
            .padding(0.05);

        svg5.append("g")
            .style("font-size", 15)
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickSize(0))
            .select(".domain").remove();

        // Build Y scales and axis:
        const y = d3.scaleBand()
            .range([height, 0])
            .domain(speedBins.map(bin => `${bin}-${bin + 5}`))
            .padding(0.05);

        svg5.append("g")
            .style("font-size", 15)
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove();

        // Build color scale
        const colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([d3.min(data, d => +d.air_quality_us_epa_index), d3.max(data, d => +d.air_quality_us_epa_index)]);

        // create a tooltip
        const tooltip5 = d3.select("#visualization5")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");

        var mouseover5 = function(d) {
            tooltip5
                .style("opacity", 1)
            d3.select(this)
                .style("stroke", "black")
                .style("opacity", 1)   
        }
        var mousemove5 = function(d) {                       
            tooltip5
            .html(`Wind Direction: ${d.wind_direction}<br>Wind Speed: ${+d.wind_mph}<br>Air Quality: ${+d.air_quality_us_epa_index}`)
                .style("left", (d3.mouse(this)[0]+70) + "px")
                .style("top", (d3.mouse(this)[1]) + "px")
        }
        var mouseleave5 = function(d) {
            tooltip5
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.8)
        }

        // Add the squares
        svg5.selectAll()
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.wind_direction))
            .attr("y", d => y(+d.wind_mph))
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", d => colorScale(+d.air_quality_us_epa_index))
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover5)
            .on("mousemove", mousemove5)
            .on("mouseleave", mouseleave5);
        });
    }).catch(function (error) {
        console.error("Error loading the file:", error);
    });
