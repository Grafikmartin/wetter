const API_KEY = "dWL7n8jTc69tmrPmxxoNMfeaCUGJzKCR";

let globalWetterDaten = null; // Globale Variable für spätere Nutzung


const fullscreenBtn = document.getElementById('fullscreen-btn');
const exitFullscreenBtn = document.getElementById('exit-fullscreen-btn');

fullscreenBtn.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
    fullscreenBtn.classList.add('hidden');
    exitFullscreenBtn.classList.remove('hidden');
});

exitFullscreenBtn.addEventListener('click', () => {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    exitFullscreenBtn.classList.add('hidden');
    fullscreenBtn.classList.remove('hidden');
});
document.getElementById('refresh-btn').addEventListener('click', function () {

    location.reload();
});
    // Enter funktioniert jetzt nach Ortsangabe

    const stadtEingabe = document.getElementById("stadt-eingabe");
    stadtEingabe.addEventListener('keypress', function (event) {
    
        if (event.keyCode === 13) {
            document.getElementById("suchen").click();
        }
    });

async function holeKoordinaten(stadt, plz, land) {
    const params = new URLSearchParams({ city: stadt, format: "json", limit: 1 });
    if (plz) params.append("postalcode", plz);
    if (land) params.append("country", land);

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
    if (!response.ok) throw new Error("Fehler beim Abrufen der Ortskoordinaten.");
    const daten = await response.json();

    if (daten.length === 0) return null;
    return { lat: daten[0].lat, lon: daten[0].lon };
}

// Funktion zur Anzeige der Karte
let map; // Globale Variable für die Karte

function initMap(lat, lon) {
    const mapContainer = document.getElementById("map-container");
    const mapElement = document.getElementById("map");

    // Zeige den Map-Container an
    if (mapContainer) mapContainer.style.display = "block";
    if (mapElement) mapElement.style.display = "block";

    // Falls eine alte Karte existiert, entferne sie
    if (map) {
        map.remove();
    }

    // Erstelle eine neue Leaflet-Karte
    map = L.map('map').setView([lat, lon], 10);

    // OpenStreetMap-Tiles hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Marker setzen
    L.marker([lat, lon]).addTo(map)
        .bindPopup('Gewählter Ort')
        .openPopup();
}


document.getElementById("suchen").addEventListener("click", async () => {
    const stadt = document.getElementById("stadt-eingabe").value.trim();
    const plz = document.getElementById("plz-eingabe").value.trim();
    const land = document.getElementById("land-eingabe").value.trim();
    const status = document.getElementById("status");
    const extrahintergrund = document.querySelector(".extrahintergrund");
    const diagrammContainer = document.getElementById("diagramm-container");
    const dailyExtrahintergrund = document.getElementById("daily-extrahintergrund"); 
    const dailyDiagrammContainer = document.getElementById("daily-diagramm-container");

    if (!stadt) {
        status.textContent = "Bitte eine Stadt eingeben!";
        return;
    }

    status.textContent = "Lade Wetterdaten...";

    try {
        const koords = await holeKoordinaten(stadt);
        if (!koords) throw new Error("Ort nicht gefunden.");
        
        initMap(koords.lat, koords.lon);

        const wetterDaten = await ladeWetterDaten(koords.lat, koords.lon);
        globalWetterDaten = wetterDaten; // Wetterdaten global speichern

        status.textContent = "";
        zeigeAktuelleDaten(globalWetterDaten);
        zeigeGrundlegendeInfo(globalWetterDaten);  

        // 🎯 Beide Bereiche sichtbar machen!
        document.getElementById("aktuelle-daten").style.display = "block";
        document.querySelector(".wrapper").style.display = "flex";
        document.getElementById("grundlegende-info").style.display = "block";
        extrahintergrund.style.display = "block";
        diagrammContainer.style.display = "block";
        dailyExtrahintergrund.style.display = "block";
        dailyDiagrammContainer.style.display = "block";

        // 🎨 Langsam einblenden für bessere Optik
        setTimeout(() => {
            extrahintergrund.style.opacity = "1";
            diagrammContainer.style.opacity = "1";
            dailyExtrahintergrund.style.opacity = "1";
            dailyDiagrammContainer.style.opacity = "1";
        }, 50);

        // 🔥 Diagramme aktualisieren
        zeigeStundenDiagramme(globalWetterDaten); // 24h-Vorhersage
        zeigeDailyStundenDiagramme(globalWetterDaten); // 7-Tage-Vorhersage
        erstelleDailyButtons(); // Buttons für einzelne Tage

    } catch (error) {
        status.textContent = `Fehler: ${error.message}`;
    }
});

function zeigeAktuelleDaten(daten) {
    const aktuell = daten.currently;
    if (!aktuell) return;

    // Temperatur mit 2 Grad Abzug und auf ganze Zahl gerundet
    const temperaturCelsius = Math.round((aktuell.temperature - 32) * 5 / 9 - 3.5);

    // Gefühlte Temperatur mit 2 Grad Abzug und auf ganze Zahl gerundet
    const gefuehlteTemperaturCelsius = Math.round((aktuell.apparentTemperature - 32) * 5 / 9);

    // Temperatur und Icon einfügen
    document.getElementById("temperatur").textContent = `${temperaturCelsius} °C`;
    document.getElementById("zusammenfassung").innerHTML = zeigeWetterIcon(aktuell.icon);

    // Zusätzliche Wetterdetails für den Wrapper
    document.getElementById("karte-gefuehlte-temperatur").innerHTML = `Gefühlte<br>Temperatur:${Math.round((aktuell.apparentTemperature - 32) * 5 / 9 - 3.5)} °C`;
    document.getElementById("karte-luftfeuchtigkeit").innerHTML = `Luftfeuchtigkeit:<br>${Math.round(aktuell.humidity * 100)}%`;
    document.getElementById("karte-luftdruck").innerHTML = `Luftdruck:<br>${Math.round(aktuell.pressure)} hPa`;
    document.getElementById("karte-windgeschwindigkeit").innerHTML = `Windgeschwind-<br>igkeit:${Math.round(aktuell.windSpeed)} m/s`;
    document.getElementById("karte-uv-index").innerHTML = `UV-Index:<br>${Math.round(aktuell.uvIndex)}`;
    document.getElementById("karte-wolkendecke").innerHTML = `Wolkendecke:<br>${Math.round(aktuell.cloudCover * 100)}%`;
    document.getElementById("karte-boeen").innerHTML = `Böen bis zu:<br>${Math.round(aktuell.windGust)} m/s`;
    document.getElementById("karte-sichtweite").innerHTML = `Sichtweite:<br>${Math.round(aktuell.visibility)} m/s`;
}

function zeigeWetterIcon(zustand) {
    const iconMap = {
        "clear-day": "mdi-white-balance-sunny",
        "clear-night": "mdi-weather-night",
        "rain": "mdi-weather-rainy",
        "snow": "mdi-weather-snowy",
        "sleet": "mdi-weather-snowy-rainy",
        "wind": "mdi-weather-windy",
        "fog": "mdi-weather-fog",
        "cloudy": "mdi-weather-cloudy",
        "partly-cloudy-day": "mdi-weather-partly-cloudy",
        "partly-cloudy-night": "mdi-weather-night-partly-cloudy"
    };

    const iconClass = iconMap[zustand] || "mdi-help"; // Fallback-Icon
    return `<span class="mdi ${iconClass}"></span>`;
}

async function holeKoordinaten(stadt) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${stadt}&format=json&limit=1`);
    if (!response.ok) throw new Error("Fehler beim Abrufen der Ortskoordinaten.");
    const daten = await response.json();
    return daten.length > 0 ? { lat: daten[0].lat, lon: daten[0].lon } : null;
}

async function ladeWetterDaten(lat, lon) {
    const response = await fetch(`https://api.pirateweather.net/forecast/${API_KEY}/${lat},${lon}?extend=hourly`);
    if (!response.ok) throw new Error("Fehler beim Abrufen der Wetterdaten.");
    return await response.json();
}

function zeigeGrundlegendeInfo(daten) {
    const timezone = daten.timezone; // Zeitzone des Orts
    const unixTimestamp = daten.currently.time; // Aktuelle Zeit als Unix-Zeitstempel

    // Ortszeit berechnen
    const ortszeit = new Date(unixTimestamp * 1000).toLocaleString("de-DE", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    document.getElementById("koordinaten").textContent = `Koordinaten: ${daten.latitude}, ${daten.longitude}`;
    document.getElementById("zeitzone").textContent = `Zeitzone: ${timezone}`;
    document.getElementById("hoehe").textContent = `Höhe: ${(daten.elevation / 3.28084).toFixed(2)} Meter`;
    document.getElementById("ortszeit").textContent = `Ortszeit: ${ortszeit}`;
}

function zeigeDiagramm(chartId) {
    // Alle Diagramme verstecken
    const charts = [
        "temperaturChart", "appTempChart", "niederschlagChart", "precipProbabilityChart",
        "windChart", "boeenChart", "humidityChart", "uvIndexChart", "pressureChart",
        "cloudCoverChart", "visibilityChart"
    ];

    charts.forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement) {
            chartElement.style.display = "none";
        }
    });

    // Gewünschtes Diagramm anzeigen
    const activeChart = document.getElementById(chartId);
    if (activeChart) {
        activeChart.style.display = "block";
    }

    // Alle Buttons zurücksetzen
    const buttons = [
        "tempButton", "appTempButton", "regenButton", "precipProbability",
        "windButton", "boeenButton", "humidity", "uvIndexButton", "pressure",
        "cloudCover", "visibilityButton"
    ];

    buttons.forEach(btnId => {
        const btnElement = document.getElementById(btnId);
        if (btnElement) {
            btnElement.classList.remove("active-button");
        }
    });

    // Passenden Button aktivieren
    const activeButtonMap = {
        "temperaturChart": "tempButton",
        "appTempChart": "appTempButton",
        "niederschlagChart": "regenButton",
        "precipProbabilityChart": "precipProbability",
        "windChart": "windButton",
        "boeenChart": "boeenButton",
        "humidityChart": "humidity",
        "uvIndexChart": "uvIndexButton",
        "pressureChart": "pressure",
        "cloudCoverChart": "cloudCover",
        "visibilityChart": "visibilityButton"
    };

    if (activeButtonMap[chartId]) {
        document.getElementById(activeButtonMap[chartId]).classList.add("active-button");
    }
}

function erstelleDiagramm(canvasId, label, labels, daten, farbe) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (window[canvasId] instanceof Chart) {
        window[canvasId].destroy();
    }

    window[canvasId] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: daten,
                backgroundColor: farbe,
                borderColor: farbe,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: "#00bcd4", // 🌟 Legenden-Textfarbe
                        font: { size: 14 }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: false, text: "Uhrzeit", color: "#00bcd4", font: { size: 14 } },
                    ticks: { color: "#00bcd4" },
                    grid: { color: "rgba(0, 188, 212, 0.25)" } // 🌟 Gitternetzlinien auf 50% #00bcd4 setzen
                },
                y: {
                    title: { display: true, text: label, color: "#00bcd4", font: { size: 14 } },
                    ticks: { color: "#00bcd4" },
                    grid: { color: "rgba(0, 188, 212, 0.25)" } // 🌟 Auch Y-Achse mit 50% Transparenz
                }
            }
        }
    });
}

function zeigeStundenDiagramme(daten) {
    const stunden = daten.hourly.data.slice(0, 24);
    const labels = stunden.map(stunde => new Date(stunde.time * 1000).getHours() + " Uhr");

    const temperaturen = stunden.map(stunde => ((stunde.temperature - 32) * 5 / 9).toFixed(2));
    const gefuehlteTemperatur = stunden.map(stunde => ((stunde.apparentTemperature - 32) * 5 / 9).toFixed(2));
    const niederschlag = stunden.map(stunde => stunde.precipIntensity.toFixed(2));
    const regenwahrscheinlichkeit = stunden.map(stunde => (stunde.precipProbability * 100).toFixed(2));
    const windgeschwindigkeit = stunden.map(stunde => stunde.windSpeed.toFixed(2));
    const boeen = stunden.map(stunde => stunde.windGust.toFixed(2));
    const luftfeuchtigkeit = stunden.map(stunde => (stunde.humidity * 100).toFixed(2));
    const uvIndex = stunden.map(stunde => stunde.uvIndex);
    const luftdruck = stunden.map(stunde => stunde.pressure.toFixed(2));
    const wolkenbedeckung = stunden.map(stunde => (stunde.cloudCover * 100).toFixed(2));
    const sichtweite = stunden.map(stunde => stunde.visibility.toFixed(2));

    erstelleDiagramm("temperaturChart", "Temperatur (°C)", labels, temperaturen, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("appTempChart", "Gefühlte Temperatur (°C)", labels, gefuehlteTemperatur, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("niederschlagChart", "Niederschlag (mm/h)", labels, niederschlag, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("precipProbabilityChart", "Regenwahrscheinlichkeit (%)", labels, regenwahrscheinlichkeit, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("windChart", "Windgeschwindigkeit (m/s)", labels, windgeschwindigkeit, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("boeenChart", "Böen (m/s)", labels, boeen, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("humidityChart", "Luftfeuchtigkeit (%)", labels, luftfeuchtigkeit, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("uvIndexChart", "UV-Index", labels, uvIndex, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("pressureChart", "Luftdruck (hPa)", labels, luftdruck, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("cloudCoverChart", "Wolkenbedeckung (%)", labels, wolkenbedeckung, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("visibilityChart", "Sichtweite (km)", labels, sichtweite, "rgba(0, 188, 212, 0.9)");
}

const buttonChartMap = {
    "tempButton": "temperaturChart",
    "appTempButton": "appTempChart",
    "regenButton": "niederschlagChart",
    "precipProbability": "precipProbabilityChart",
    "windButton": "windChart",
    "boeenButton": "boeenChart",
    "humidity": "humidityChart",
    "uvIndexButton": "uvIndexChart",
    "pressure": "pressureChart",
    "cloudCover": "cloudCoverChart",
    "visibilityButton": "visibilityChart"
};

Object.keys(buttonChartMap).forEach(buttonId => {
    const buttonElement = document.getElementById(buttonId);
    if (buttonElement) {
        buttonElement.addEventListener("click", () => zeigeDiagramm(buttonChartMap[buttonId]));
    }
});



function zeigeDailyDiagramm(chartId) {
    // Alle täglichen Diagramme verstecken
    const dailyCharts = [
        "dailyTempChart", "dailyAppTempChart", "dailyNiederschlagChart", "dailyPrecipProbabilityChart",
        "dailyWindChart", "dailyBoeenChart", "dailyHumidityChart", "dailyUvIndexChart", "dailyPressureChart",
        "dailyCloudCoverChart", "dailyVisibilityChart"
    ];
    
    dailyCharts.forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement) {
            chartElement.style.display = "none";
        }
    });

    // Gewünschtes tägliches Diagramm anzeigen
    const activeChart = document.getElementById(chartId);
    if (activeChart) {
        activeChart.style.display = "block";
    }

    // Alle täglichen Buttons zurücksetzen
    const dailyButtons = [
        "dailyTempButton", "dailyAppTempButton", "dailyRegenButton", "dailyPrecipProbability", 
        "dailyWindButton", "dailyBoeenButton", "dailyHumidity", "dailyUvIndexButton", "dailyPressure", 
        "dailyCloudCover", "dailyVisibilityButton"
    ];

    dailyButtons.forEach(btnId => {
        const btnElement = document.getElementById(btnId);
        if (btnElement) {
            btnElement.classList.remove("active-button");
        }
    });

    // Passenden täglichen Button aktivieren
    const activeDailyButtonMap = {
        "dailyTempChart": "dailyTempButton",
        "dailyAppTempChart": "dailyAppTempButton",
        "dailyNiederschlagChart": "dailyRegenButton",
        "dailyPrecipProbabilityChart": "dailyPrecipProbability",
        "dailyWindChart": "dailyWindButton",
        "dailyBoeenChart": "dailyBoeenButton",
        "dailyHumidityChart": "dailyHumidity",
        "dailyUvIndexChart": "dailyUvIndexButton",
        "dailyPressureChart": "dailyPressure",
        "dailyCloudCoverChart": "dailyCloudCover",
        "dailyVisibilityChart": "dailyVisibilityButton"
    };

    if (activeDailyButtonMap[chartId]) {
        document.getElementById(activeDailyButtonMap[chartId]).classList.add("active-button");
    }
}

// Event-Listener für die täglichen Buttons
const dailyButtonChartMap = {
"dailyTempButton": "dailyTempChart",
    "dailyAppTempButton": "dailyAppTempChart",
    "dailyRegenButton": "dailyNiederschlagChart", 
    "dailyPrecipProbability": "dailyPrecipProbabilityChart",
    "dailyWindButton": "dailyWindChart",
    "dailyBoeenButton": "dailyBoeenChart",
    "dailyHumidity": "dailyHumidityChart",
    "dailyPressure": "dailyPressureChart",
    "dailyCloudCover": "dailyCloudCoverChart",
    "dailyVisibilityButton": "dailyVisibilityChart"
};

Object.keys(dailyButtonChartMap).forEach(buttonId => {
    const buttonElement = document.getElementById(buttonId);
    if (buttonElement) {
        buttonElement.addEventListener("click", () => zeigeDailyDiagramm(dailyButtonChartMap[buttonId]));
    }
});

function zeigeDailyStundenDiagramme(daten) {
    if (!daten || !daten.daily || !daten.daily.data) {
        console.error("Fehler: Wetterdaten für die täglichen Diagramme fehlen.");
        return;
    }

    const tage = daten.daily.data.slice(0, 7);
    const labels = tage.map(tag => new Date(tag.time * 1000).toLocaleDateString("de-DE", { weekday: "long" }));


    const maxTemp = tage.map(tag => ((tag.temperatureHigh - 32) * 5 / 9).toFixed(2));
    const minTemp = tage.map(tag => ((tag.temperatureLow - 32) * 5 / 9).toFixed(2));
    const regenwahrscheinlichkeit = tage.map(tag => (tag.precipProbability * 100).toFixed(2));
    const niederschlagsintensität = tage.map(tag => (tag.precipIntensity ? tag.precipIntensity.toFixed(2) : "0"));
    const windgeschwindigkeit = tage.map(tag => tag.windSpeed.toFixed(2));
    const boeen = tage.map(tag => (tag.windGust ? tag.windGust.toFixed(2) : "0"));
    const luftfeuchtigkeit = tage.map(tag => (tag.humidity ? (tag.humidity * 100).toFixed(2) : "0"));
    const luftdruck = tage.map(tag => (tag.pressure ? tag.pressure.toFixed(2) : "0"));
    const wolkenbedeckung = tage.map(tag => (tag.cloudCover ? (tag.cloudCover * 100).toFixed(2) : "0"));
    const sichtweite = tage.map(tag => (tag.visibility ? tag.visibility.toFixed(2) : "0"));

    erstelleDiagramm("dailyTempChart", "Max. Temperatur (°C)", labels, maxTemp, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("dailyAppTempChart", "Min. Temperatur (°C)", labels, minTemp, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("dailyPrecipProbabilityChart", "Regenwahrscheinlichkeit (%)", labels, regenwahrscheinlichkeit, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("dailyNiederschlagChart", "Niederschlagsintensität (mm/h)", labels, niederschlagsintensität, "rgba(0, 188, 212, 0.9)"); 
    erstelleDiagramm("dailyWindChart", "Windgeschwindigkeit (m/s)", labels, windgeschwindigkeit, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("dailyBoeenChart", "Böen (m/s)", labels, boeen, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("dailyHumidityChart", "Luftfeuchtigkeit (%)", labels, luftfeuchtigkeit, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("dailyPressureChart", "Luftdruck (hPa)", labels, luftdruck, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("dailyCloudCoverChart", "Wolkenbedeckung (%)", labels, wolkenbedeckung, "rgba(0, 188, 212, 0.9)");
    erstelleDiagramm("dailyVisibilityChart", "Sichtweite (km)", labels, sichtweite, "rgba(0, 188, 212, 0.9)");
}
Object.keys(dailyButtonChartMap).forEach(buttonId => {
    const buttonElement = document.getElementById(buttonId);
    if (buttonElement) {
        buttonElement.addEventListener("click", () => zeigeDailyDiagramm(dailyButtonChartMap[buttonId]));
    } else {
        console.warn(`Button mit ID '${buttonId}' nicht gefunden.`);
    }
});

document.getElementById("extrahintergrund").style.display = "block";
document.getElementById("daily-extrahintergrund").style.display = "block";

setTimeout(() => {
    document.getElementById("extrahintergrund").style.opacity = "1";
    document.getElementById("daily-extrahintergrund").style.opacity = "1";
}, 50);

function erstelleDailyButtons() {
    Object.keys(dailyButtonChartMap).forEach(buttonId => {
        const buttonElement = document.getElementById(buttonId);
        if (buttonElement) {
            buttonElement.addEventListener("click", () => zeigeDailyDiagramm(dailyButtonChartMap[buttonId]));
        } else {
            console.warn(`⚠️ Warnung: Button mit ID '${buttonId}' nicht gefunden.`);
        }
    });
}