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
        zeigeStundenDaten(wetterDaten);
        zeigeTageDaten(wetterDaten);

        // Karte aktualisieren
        initMap(koords.lat, koords.lon);

        status.textContent = "";
    } catch (error) {
        status.textContent = `Fehler: ${error.message}`;
    }
});

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
}

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
}
function zeigeAktuelleDaten(daten) {
    const aktuell = daten.currently;
    if (!aktuell) return;

    // Wetter-Icon und Zusammenfassung
    document.getElementById("zusammenfassung").innerHTML = `
        Zusammenfassung: ${aktuell.summary} 
        ${zeigeWetterIcon(aktuell.icon)}
    `;

    // Weitere Wetterdetails
    document.getElementById("temperatur").textContent = `Temperatur: ${((aktuell.temperature - 32) * 5 / 9).toFixed(2)} °C`;
    document.getElementById("gefuehlte-temperatur").textContent = `Gefühlte Temperatur: ${((aktuell.apparentTemperature - 32) * 5 / 9).toFixed(2)} °C`;
    document.getElementById("luftfeuchtigkeit").textContent = `Luftfeuchtigkeit: ${(aktuell.humidity * 100).toFixed(2)}%`;
    document.getElementById("luftdruck").textContent = `Luftdruck: ${aktuell.pressure} hPa`;
    document.getElementById("windgeschwindigkeit").textContent = `Windgeschwindigkeit: ${aktuell.windSpeed} m/s`;
    document.getElementById("uv-index").textContent = `UV-Index: ${aktuell.uvIndex}`;
    document.getElementById("wolkendecke").textContent = `Wolkendecke: ${(aktuell.cloudCover * 100).toFixed(2)}%`;
}

function zeigeWetterIcon(zustand) {
    const iconMap = {
        "clear-day": "wb_sunny",
        "clear-night": "nights_stay",
        "rain": "rainy",
        "snow": "ac_unit",
        "sleet": "grain",
        "wind": "air",
        "fog": "blur_on",
        "cloudy": "cloud",
        "partly-cloudy-day": "wb_cloudy",
        "partly-cloudy-night": "cloudy_night"
    };

    const iconName = iconMap[zustand] || "help"; // Fallback-Icon
    return `<span class="material-icons">${iconName}</span>`;
}
// Funktion zur Anzeige der Karte
let map; // Globale Variable für die Karte

function initMap(lat, lon) {
    if (!map) {
        // Karte erstmalig erstellen
        map = L.map('map').setView([lat, lon], 10);

        // OpenStreetMap-Tiles hinzufügen
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    } else {
        // Karte auf neue Koordinaten zentrieren
        map.setView([lat, lon], 10);
    }

    // Marker setzen
    L.marker([lat, lon]).addTo(map)
        .bindPopup('Gewählter Ort')
        .openPopup();
}

