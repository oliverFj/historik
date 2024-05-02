// dataManager.js
import * as d3 from 'https://cdn.skypack.dev/d3@7';

export async function loadData(csvFile) {
    try {
        const data = await d3.csv(csvFile);
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

        return data.filter(d => d.fullDate);
    } catch (error) {
        console.error("Failed to load or parse the CSV file:", error);
        return [];  // Return an empty array or handle the error as appropriate
    }
}


export function setupYearSelect(data, selectId) {
    const years = Array.from(new Set(data.map(d => d.year))).sort();
    years.unshift("All Years");
    const select = d3.select(selectId);
    select.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .text(d => d);

    return years;
}

export function initializeSlider(sliderId, initialValue, minValue, maxValue) {
    const slider = d3.select(sliderId)
        .attr("type", "range")
        .attr("min", minValue)
        .attr("max", maxValue)
        .attr("value", initialValue)
        .attr("step", "1");
    return slider;
}

export function playControl(playButtonId, sliderId, maxValue) {
    const playButton = document.getElementById(playButtonId);
    let isPlaying = false;
    let playInterval;

    playButton.addEventListener('click', () => {
        if (!isPlaying) {
            isPlaying = true;
            playButton.textContent = 'Pause';
            playInterval = setInterval(() => {
                const slider = document.getElementById(sliderId);
                const currentValue = +slider.value;
                if (currentValue < maxValue) {
                    slider.value = currentValue + 86400000; // increment by one day
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
}
