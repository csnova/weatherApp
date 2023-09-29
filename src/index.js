import "./style.css";
import { format, addDays } from "date-fns";

// const weatherBox = document.getElementById("weatherBox");
const btn = document.getElementById("searchBtn");
const searchInput = document.getElementById("search");

// Used to get the date of the last 7 days for Historical Weather
function getDay() {
  let currentDay = new Date();
  const dates = [];

  for (let i = 0; i < 8; i++) {
    const day = format(new Date(currentDay), "dd");
    const year = format(new Date(currentDay), "y");
    const month = format(new Date(currentDay), "MM");
    dates.push(`${year}-${month}-${day}`);
    currentDay = addDays(new Date(currentDay), -1);
  }

  return dates;
}

// Used to get the city location of the current user
function getCity(coordinates) {
  const xhr = new XMLHttpRequest();
  const lat = coordinates[0];
  const lng = coordinates[1];

  function processRequest(e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      const response = JSON.parse(xhr.responseText);
      const { city } = response.address;
      printWeather(city, "f");
    }
  }

  xhr.open(
    "GET",
    `https://us1.locationiq.com/v1/reverse.php?key=pk.15e38b9d11dfe2e8b01783310d18e023&lat=${lat}&lon=${lng}&format=json`,
    true
  );
  xhr.send();
  xhr.onreadystatechange = processRequest;
  xhr.addEventListener("readystatechange", processRequest, false);
}

function getCoordinates() {
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  function success(pos) {
    const crd = pos.coords;
    const lat = crd.latitude.toString();
    const lng = crd.longitude.toString();
    const coordinates = [lat, lng];
    console.log(`Latitude: ${lat}, Longitude: ${lng}`);
    getCity(coordinates);
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    printWeather("seattle", "f");
  }

  navigator.geolocation.getCurrentPosition(success, error, options);
}

getCoordinates();

function getPhoto(location) {
  const photoSrc = `https://source.unsplash.com/random/350x450/?${location}`;
  return photoSrc;
}

async function getHistoricalWeather(searchTerm) {
  const dates = getDay();
  const location = searchTerm.toLowerCase();
  try {
    const historicalData = [];

    for (const date of dates) {
      const historical = await fetch(
        `http://api.weatherapi.com/v1/history.json?key=a9cf78d18a474724bd5183446232609&q=${location}&dt=${date}`,
        { mode: "cors" }
      );
      const datesHistoricalData = await historical.json();
      historicalData.push(datesHistoricalData);
    }

    return historicalData;
  } catch (error) {
    console.log(error);
  }
}

async function getForecastWeather(searchTerm) {
  const location = searchTerm.toLowerCase();
  try {
    const forecast = await fetch(
      `http://api.weatherapi.com/v1/forecast.json?key=a9cf78d18a474724bd5183446232609&q=${location}&days=3&aqi=yes&alerts=yes`,
      { mode: "cors" }
    );
    const forecastData = await forecast.json();
    return forecastData;
  } catch (error) {
    console.log(error);
  }
}

async function printWeather(searchValue, units) {
  const forecastData = await getForecastWeather(searchValue);
  const historicalData = await getHistoricalWeather(searchValue);
  const photoSrc = await getPhoto(searchValue);
  console.log(forecastData);
  console.log(historicalData);

  document.getElementById("locationPhoto").src = photoSrc;
  document.getElementById(
    "currentWeatherType"
  ).textContent = `${forecastData.current.condition.text}`;
  document.getElementById(
    "currentWeatherIcon"
  ).src = `../src/weather-icons/day/${forecastData.current.condition.code}.png`;
  if (units === "f") {
    document.getElementById(
      "currentWeatherTemp"
    ).textContent = ` ${forecastData.current.temp_f} \u00B0`;
    document.getElementById(
      "currentWeatherFeel"
    ).textContent = ` ${forecastData.current.feelslike_f} \u00B0`;
    // document.getElementById(
    //   "currentWeatherHigh"
    // ).textContent = ` ${forecastData.forecast.forecastday.0.day.maxtemp_f}\u00B0`;
    document.getElementById(
      "currentWeatherLow"
    ).textContent = ` ${forecastData.forecast.forecastday[0]day.maxtemp_f}\u00B0`;
  }
  if (units === "c") {
    document.getElementById(
      "currentWeatherTemp"
    ).textContent = ` ${forecastData.current.temp_c} \u00B0`;
    document.getElementById(
      "currentWeatherFeel"
    ).textContent = ` ${forecastData.current.feelslike_c} \u00B0`;
  }

  // <div class="container" id="todaysInfo">
  //       <div class="innerContainer" id="currentWeatherBox">
  //         <h2 id="currentWeatherTitle">Now</h2>
  //         <p class="append" id="currentWeatherType">Weather Type</p>
  //         <img
  //           src="../src/weather-icons/unknow.png"
  //           alt="weather icon"
  //           class="icon append"
  //         />
  //         <div id="currentTempBox">
  //           <p><strong>Current Temp:</strong></p>
  //           <p class="append" id="currentWeatherTemp"></p>
  //         </div>
  //         <div id="feelsLikeBox">
  //           <p><strong>Feels Like:</strong></p>
  //           <p class="append" id="currentWeatherTemp"></p>
  //         </div>
  //       </div>

  // const weatherBox = document.getElementById("weatherBox");

  // const currentIcon = document.createElement("img");
  // currentIcon.src = `../src/weather-icons/day/${forecastData.current.condition.code}.png`;
  // currentIcon.classList.add("currentIcon");
  // weatherBox.appendChild(currentIcon);

  // const currentType = document.createElement("p");
  // currentType.classList.add("currentType");
  // currentType.textContent = `${forecastData.current.condition.text}`;
  // weatherBox.appendChild(currentType);

  // const currentTemp = document.createElement("p");
  // currentTemp.classList.add("currentTemp");
  // if (units === "f") {
  //   currentTemp.textContent = `${forecastData.current.temp_f} \u00B0`;
  // }
  // if (units === "c") {
  //   currentTemp.textContent = `${forecastData.current.temp_c} \u00B0`;
  // }
  // weatherBox.appendChild(currentTemp);
}

btn.addEventListener("click", () => {
  const searchValue = searchInput.value;
  printWeather(searchValue, "f");
});
