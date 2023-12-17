document.addEventListener("DOMContentLoaded", function () {
    // Load and parse the CSV data
    d3.csv("GlobalWeatherRepository.csv").then(function (data) {
        // Log the loaded data to the console to verify
        console.log(data);

        // Clean and parse the data
        data.forEach(function (d) {
            // Convert string values to appropriate data types
            d.temperature_celsius = +d.temperature_celsius;
            // Add more conversions based on your dataset

            // Note: Adjust attribute names based on your dataset
        });

        // Display data in a table
        const tableBody = d3.select("body").append("table").append("tbody");

        data.forEach(function (d) {
            const row = tableBody.append("tr");
            row.append("td").text(d.country);
            row.append("td").text(d.location_name);
            row.append("td").text(d.temperature_celsius);
            row.append("td").text(d.condition_text);
            // Add more cells based on your dataset

            // Note: Adjust the cell names based on your dataset attributes
        });

    }).catch(function (error) {
        console.error("Error loading the CSV file:", error);
    });
});