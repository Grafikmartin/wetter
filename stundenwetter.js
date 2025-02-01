document.addEventListener("DOMContentLoaded", () => {
    console.log("Stündliche Wettervorhersage geladen.");
});
function zeigeStundenDaten(daten) {
    console.log("✅ Funktion zeigeStundenDaten() wurde aufgerufen!");

    const tempContainer = document.querySelector(".Temperatur-Stunden");
    const regenContainer = document.querySelector(".Niederschlag-Stunden");
    const windContainer = document.querySelector(".Wind-Stunden");

    console.log("📌 Temperatur-Stunden:", tempContainer);
    console.log("📌 Niederschlag-Stunden:", regenContainer);
    console.log("📌 Wind-Stunden:", windContainer);

    if (!tempContainer) console.error("❌ Fehler: 'Temperatur-Stunden' existiert nicht!");
    if (!regenContainer) console.error("❌ Fehler: 'Niederschlag-Stunden' existiert nicht!");
    if (!windContainer) console.error("❌ Fehler: 'Wind-Stunden' existiert nicht!");

    if (!tempContainer || !regenContainer || !windContainer) {
        console.error("❌ Fehler: Ein oder mehrere Container für stündliche Wetterdaten fehlen!");
        console.log("DOM-Struktur:", document.body.innerHTML); // DOM-Inhalt prüfen
        return;
    }

    // Falls die Container existieren, Inhalte leeren
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

