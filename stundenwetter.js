const API_KEY = "dWL7n8jTc69tmrPmxxoNMfeaCUGJzKCR";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Stündliche Wettervorhersage geladen.");
});

window.ladeStundenWetter = async function (lat, lon) {
    console.log("Stündliche Wetterdaten abrufen für:", lat, lon);
    
    const apiUrl = `https://api.pirateweather.net/forecast/${API_KEY}/${lat},${lon}?units=us&exclude=minutely,daily,alerts,flags`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Fehler beim Abrufen der Wetterdaten.");

    const daten = await response.json();

    // Temperatur von Fahrenheit in Celsius umrechnen
    daten.hourly.data.forEach(stunde => {
        stunde.temperature = ((stunde.temperature - 32) * 5) / 9;
    });

    zeigeStundenDaten(daten);
}

function zeigeStundenDaten(daten) {
    const tempContainer = document.querySelector(".Temperatur-Stunden");
    const regenContainer = document.querySelector(".Niederschlag-Stunden");
    const windContainer = document.querySelector(".Wind-Stunden");

    if (!tempContainer || !regenContainer || !windContainer) {
        console.error("Elemente für stündliche Vorhersage nicht gefunden!");
        return;
    }

    // Vorherige Inhalte löschen
    tempContainer.innerHTML = "";
    regenContainer.innerHTML = "";
    windContainer.innerHTML = "";

    daten.hourly.data.slice(0, 12).forEach(stunde => {
        const zeit = new Date(stunde.time * 1000);
        const temperaturCelsius = `${stunde.temperature.toFixed(1)}°C`;
        const niederschlag = `${(stunde.precipProbability * 100).toFixed(0)}%`;
        const windGeschwindigkeit = `${(stunde.windSpeed * 3.6).toFixed(1)} km/h`;
        const windRichtung = windRichtungBestimmen(stunde.windBearing);

        tempContainer.innerHTML += `<p>${zeit.getHours()}:00 - ${temperaturCelsius}</p>`;
        regenContainer.innerHTML += `<p>${zeit.getHours()}:00 - ${niederschlag}</p>`;
        windContainer.innerHTML += `<p>${zeit.getHours()}:00 - ${windGeschwindigkeit} ${windRichtung}</p>`;
    });

    document.getElementById("stunden-daten").style.display = "block";
}

function windRichtungBestimmen(winkel) {
    const richtungen = ["⬆️ N", "↗️ NO", "➡️ O", "↘️ SO", "⬇️ S", "↙️ SW", "⬅️ W", "↖️ NW"];
    return richtungen[Math.round(winkel / 45) % 8];
}
