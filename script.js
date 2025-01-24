const API_KEY = "dWL7n8jTc69tmrPmxxoNMfeaCUGJzKCR";

document.getElementById("suchen").addEventListener("click", async () => {
    const stadt = document.getElementById("stadt-eingabe").value.trim();
    const plz = document.getElementById("plz-eingabe").value.trim();
    const land = document.getElementById("land-eingabe").value.trim();
    const status = document.getElementById("status");

    if (!stadt) {
        status.textContent = "Bitte geben Sie mindestens eine Stadt ein.";
        return;
    }

    status.textContent = "Daten werden geladen...";
    try {
        const koords = await holeKoordinaten(stadt, plz, land);
        if (!koords) throw new Error("Ort nicht gefunden.");

        const wetterDaten = await ladeWetterDaten(koords.lat, koords.lon);

        zeigeGrundlegendeInfo(wetterDaten);
        zeigeAktuelleDaten(wetterDaten);

        // Abschnitte sichtbar machen
        document.getElementById("aktuelle-daten").style.display = "block";
        document.querySelector(".wrapper").style.display = "flex";
        document.getElementById("grundlegende-info").style.display = "block";

        // Map-Container sichtbar machen
        const mapContainer = document.getElementById("map-container");
        mapContainer.style.display = "block";

        // Karte aktualisieren
        initMap(koords.lat, koords.lon);

        status.textContent = "";
    } catch (error) {
        status.textContent = `Fehler: ${error.message}`;
    }
});


/*
function zeigeTageDaten(daten) {
    const container = document.getElementById("tage-container");
    container.innerHTML = ""; // Vorherige Inhalte löschen

    daten.daily.data.forEach(tag => {
        const datum = new Date(tag.time * 1000); // Zeitstempel umwandeln
        container.innerHTML += `
            <div>
                <p><strong>${datum.toLocaleDateString()}</strong></p>
                <p>Zusammenfassung: ${tag.summary}</p>
                <p>Max. Temperatur: ${((tag.temperatureMax - 32) * 5 / 9).toFixed(2)} °C</p>
                <p>Min. Temperatur: ${((tag.temperatureMin - 32) * 5 / 9).toFixed(2)} °C</p>
                <p>UV-Index: ${tag.uvIndex}</p>
                <p>Niederschlagswahrscheinlichkeit: ${(tag.precipProbability * 100).toFixed(2)}%</p>
            </div>
        `;
    });
}*/

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

async function ladeWetterDaten(lat, lon) {
    const apiUrl = `https://api.pirateweather.net/forecast/${API_KEY}/${lat},${lon}?extend=hourly`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Fehler beim Abrufen der Wetterdaten.");
    return await response.json();
}

function zeigeGrundlegendeInfo(daten) {
    document.getElementById("koordinaten").textContent = `Koordinaten: ${daten.latitude}, ${daten.longitude}`;
    document.getElementById("zeitzone").textContent = `Zeitzone: ${daten.timezone}`;
    document.getElementById("hoehe").textContent = `Höhe: ${daten.elevation} Meter`;
}

/*
function zeigeStundenDaten(daten) {
    const container = document.getElementById("stunden-container");
    container.innerHTML = "";

    daten.hourly.data.slice(0, 24).forEach(stunde => {
        const zeit = new Date(stunde.time * 1000);
        container.innerHTML += `
            <div>
                <p><strong>${zeit.toLocaleString()}</strong></p>
                <p>Zusammenfassung: ${stunde.summary}</p>
                <p>Temperatur: ${((stunde.temperature - 32) * 5 / 9).toFixed(2)} °C</p>
                <p>Windgeschwindigkeit: ${stunde.windSpeed} m/s</p>
            </div>
        `;
    });
}*/
function zeigeAktuelleDaten(daten) {
    const aktuell = daten.currently;
    if (!aktuell) return;

    // Temperatur mit 2 Grad Abzug und auf ganze Zahl gerundet
    const temperaturCelsius = Math.round((aktuell.temperature - 32) * 5 / 9 - 3.5);

    // Gefühlte Temperatur mit 2 Grad Abzug und auf ganze Zahl gerundet
    const gefuehlteTemperaturCelsius = Math.round((aktuell.apparentTemperature - 32) * 5 / 9 );

    // Temperatur und Icon einfügen
    document.getElementById("temperatur").textContent = `${temperaturCelsius} °C`;
    document.getElementById("zusammenfassung").innerHTML = zeigeWetterIcon(aktuell.icon);

    // Zusätzliche Wetterdetails für den Wrapper
    document.getElementById("karte-gefuehlte-temperatur").innerHTML = `Gefühlte Temperatur:<br>${Math.round((aktuell.apparentTemperature - 32) * 5 / 9 - 3.5)} °C`;
    document.getElementById("karte-luftfeuchtigkeit").innerHTML = `Luftfeuchtigkeit:<br>${Math.round(aktuell.humidity * 100)}%`;
    document.getElementById("karte-luftdruck").innerHTML = `Luftdruck:<br>${Math.round(aktuell.pressure)} hPa`;
    document.getElementById("karte-windgeschwindigkeit").innerHTML = `Windgeschwindigkeit:<br>${Math.round(aktuell.windSpeed)} m/s`;
    document.getElementById("karte-uv-index").innerHTML = `UV-Index:<br>${Math.round(aktuell.uvIndex)}`;
    document.getElementById("karte-wolkendecke").innerHTML = `Wolkendecke:<br>${Math.round(aktuell.cloudCover * 100)}%`;
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

// Funktion zur Anzeige der Karte
let map; // Globale Variable für die Karte

function initMap(lat, lon) {
    const mapElement = document.getElementById("map");
    const placeholder = document.getElementById("map-placeholder");

    // Platzhalter ausblenden und Karte einblenden
    if (placeholder) placeholder.style.display = "none";
    mapElement.style.display = "block";

    // Karte erstellen oder aktualisieren
    if (!map) {
        map = L.map('map').setView([lat, lon], 10);

        // OpenStreetMap-Tiles hinzufügen
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    } else {
        map.setView([lat, lon], 10);
    }

    // Marker setzen
    L.marker([lat, lon]).addTo(map)
        .bindPopup('Gewählter Ort')
        .openPopup();
}  