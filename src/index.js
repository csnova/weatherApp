import "./style.css";
import { format, addDays } from "date-fns";

// const weatherBox = document.getElementById("weatherBox");
const btn = document.getElementById("searchBtn");
const searchInput = document.getElementById("search");

// Used to remove the hourly boxed before they are remade
function removeElementsByClass(className) {
  const elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

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

// Used to get the city location of the current user from coordinates
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

// Used to get the coordinates of the current user
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
    getCity(coordinates);
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }

  navigator.geolocation.getCurrentPosition(success, error, options);
}

// Used to get a random photo of the location
function getPhoto(location) {
  const photoSrc = `https://source.unsplash.com/random/350x400/?${location}`;
  return photoSrc;
}

// Used to get the weather history of the last 7 days
async function getHistoricalWeather(searchTerm) {
  const dates = getDay();
  const location = searchTerm.toLowerCase();
  try {
    const historicalData = [];

    for (const date of dates) {
      const historical = await fetch(
        `https://api.weatherapi.com/v1/history.json?key=a9cf78d18a474724bd5183446232609&q=${location}&dt=${date}`,
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

// Used to get the current weather and the forecast for a specific city
async function getForecastWeather(searchTerm) {
  const location = searchTerm.toLowerCase();
  try {
    const forecast = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=a9cf78d18a474724bd5183446232609&q=${location}&days=3&aqi=yes&alerts=yes`,
      { mode: "cors" }
    );
    const forecastData = await forecast.json();
    return forecastData;
  } catch (error) {
    console.log(error);
  }
}

// Prints the weather on the actual webpage
async function printWeather(searchValue, units) {
  const forecastData = await getForecastWeather(searchValue);
  const historicalData = await getHistoricalWeather(searchValue);
  const photoSrc = await getPhoto(searchValue);
  const indexValue = await forecastData.current.air_quality["us-epa-index"];
  const willSnowTomorrow = await forecastData.forecast.forecastday[1].day
    .daily_will_it_snow;
  const willSnowNextDay = await forecastData.forecast.forecastday[2].day
    .daily_will_it_snow;

  // Gets the date in month and days for the next 2 days
  const tomorrowDate = await forecastData.forecast.forecastday[1].date;
  const tomorrowMonth = tomorrowDate.slice(5, 7);
  const tomorrowDay = tomorrowDate.slice(8, 10);
  const nextDayDate = await forecastData.forecast.forecastday[2].date;
  const nextDayMonth = nextDayDate.slice(5, 7);
  const nextDayDay = nextDayDate.slice(8, 10);

  // Gets the local time and the hour
  const localDateTime = await forecastData.location.localtime;
  const localTime = localDateTime.slice(11, 16);
  const localHour1 = localTime.slice(0, 1);
  const localHour2 = localTime.slice(0, 2);
  let localHour = Number(localHour2);
  if (isNaN(localHour)) {
    localHour = Number(localHour1);
  }

  // Change Background Image
  if (localHour > 19 || localHour < 7) {
    document.body.style.backgroundImage = `url(../src/weather-icons/backgroundNight/${forecastData.current.condition.code}.jpg)`;
  } else {
    document.body.style.backgroundImage = `url(../src/weather-icons/backgroundDay/${forecastData.current.condition.code}.jpg)`;
  }

  // Make List of Hours Left in Day
  let hours = await forecastData.forecast.forecastday[0].hour;
  hours = hours.slice(localHour, 25);

  // Current Weather except Temp
  document.getElementById(
    "currentWeatherType"
  ).textContent = `${forecastData.current.condition.text}`;
  if (localHour > 19 || localHour < 7) {
    document.getElementById(
      "currentWeatherIcon"
    ).src = `../src/weather-icons/night/${forecastData.current.condition.code}.png`;
  } else {
    document.getElementById(
      "currentWeatherIcon"
    ).src = `../src/weather-icons/day/${forecastData.current.condition.code}.png`;
  }

  // Hourly Weather
  removeElementsByClass("hours");
  hours.forEach((value, index) => {
    const currentDateTime = hours[index].time;
    const currentTime = currentDateTime.slice(11, 16);
    let currentHour = currentTime.slice(0, 2);
    currentHour = Number(currentHour);

    const hourly = document.getElementById("hourly");
    const hour = document.createElement("div");
    hour.setAttribute("id", `hours${index}`);
    hour.classList.add("hours");
    hourly.appendChild(hour);

    const type = document.createElement("p");
    type.setAttribute("id", `weatherType${index}`);
    type.classList.add("weatherType");
    type.textContent = `${hours[index].condition.text}`;
    hour.appendChild(type);

    const temp = document.createElement("p");
    temp.setAttribute("id", `weatherTemp${index}`);
    temp.classList.add("weatherTemp");
    if (units === "f") {
      temp.textContent = `${hours[index].temp_f}\u00B0`;
    }
    if (units === "c") {
      temp.textContent = `${hours[index].temp_c}\u00B0`;
    }
    hour.appendChild(temp);

    const icon = document.createElement("img");
    icon.setAttribute("id", `iconHourly${index}`);
    icon.setAttribute("alt", "weather icon");
    icon.classList.add("icon");
    if (currentHour > 19 || currentHour < 7) {
      icon.src = `../src/weather-icons/night/${hours[index].condition.code}.png`;
      hour.appendChild(icon);
    } else {
      icon.src = `../src/weather-icons/day/${hours[index].condition.code}.png`;
      hour.appendChild(icon);
    }

    const title = document.createElement("h4");
    title.setAttribute("id", `hour${index}`);
    if (currentHour === 0) {
      title.textContent = "12 AM";
    } else if (currentHour <= 12) {
      title.textContent = ` ${currentHour} AM`;
    } else {
      const pmTime = currentHour - 12;
      title.textContent = ` ${pmTime} PM`;
    }
    hour.appendChild(title);
  });

  // Local Information
  document.getElementById(
    "city"
  ).textContent = ` ${forecastData.location.name}`;
  document.getElementById(
    "country"
  ).textContent = ` ${forecastData.location.country}`;
  document.getElementById("locationPhoto").src = photoSrc;
  if (localHour === 0) {
    const nightTime = localTime.replace(localHour, 12);
    document.getElementById("localTime").textContent = ` ${nightTime} AM`;
  } else if (localHour < 12) {
    document.getElementById("localTime").textContent = ` ${localTime} AM`;
  } else {
    let pmTime = localHour - 12;
    pmTime = localTime.replace(localHour, pmTime);
    document.getElementById("localTime").textContent = ` ${pmTime} PM`;
  }

  // Tomorrows Forecast Except Temp
  document.getElementById(
    "tomorrowType"
  ).textContent = `${forecastData.forecast.forecastday[1].day.condition.text}`;
  document.getElementById(
    "tomorrowIcon"
  ).src = `../src/weather-icons/day/${forecastData.forecast.forecastday[1].day.condition.code}.png`;
  if (willSnowTomorrow === 1) {
    document.getElementById("tomorrowRainSnow").textContent = "Snow Chance:";
    document.getElementById(
      "tomorrowRain"
    ).textContent = `${forecastData.forecast.forecastday[1].day.daily_chance_of_snow}%`;
  } else {
    document.getElementById("tomorrowRainSnow").textContent = "Rain Chance:";
    document.getElementById(
      "tomorrowRain"
    ).textContent = `${forecastData.forecast.forecastday[1].day.daily_chance_of_rain}%`;
  }
  document.getElementById(
    "tomorrow"
  ).textContent = `Tomorrow ${tomorrowMonth}/${tomorrowDay}`;

  // Day After Tomorrow Forecast Except Temp
  document.getElementById(
    "nextDayType"
  ).textContent = `${forecastData.forecast.forecastday[2].day.condition.text}`;
  document.getElementById(
    "nextDayIcon"
  ).src = `../src/weather-icons/day/${forecastData.forecast.forecastday[2].day.condition.code}.png`;
  if (willSnowNextDay === 1) {
    document.getElementById("nextDayRainSnow").textContent = "Snow Chance:";
    document.getElementById(
      "nextDayRain"
    ).textContent = `${forecastData.forecast.forecastday[2].day.daily_chance_of_snow}%`;
  } else {
    document.getElementById("nextDayRainSnow").textContent = "Rain Chance:";
    document.getElementById(
      "nextDayRain"
    ).textContent = `${forecastData.forecast.forecastday[2].day.daily_chance_of_rain}%`;
  }
  document.getElementById(
    "nextDay"
  ).textContent = `Overmorrow ${nextDayMonth}/${nextDayDay}`;

  // Air Quality Information
  if (indexValue === 1) {
    document.getElementById("indexValue").textContent = "Good";
    document.getElementById("indexDescription").textContent =
      "Air Quality is Satisfactory, little or no risk";
    document.getElementById("indexBox").style.background = "lightGreen";
    document.getElementById("indexBox").style.borderColor = "darkGreen";
    document.getElementById("epaIndex").textContent = `${indexValue}`;
  } else if (indexValue === 2) {
    document.getElementById("indexValue").textContent = "Moderate";
    document.getElementById("indexDescription").textContent =
      "Air Quality is Acceptable, maybe risk fro some people";
    document.getElementById("indexBox").style.background = "lightYellow";
    document.getElementById("indexBox").style.borderColor = "gold";
    document.getElementById("epaIndex").textContent = `${indexValue}`;
  } else if (indexValue === 3) {
    document.getElementById("indexValue").textContent =
      "Unhealthy for Sensitive Groups";
    document.getElementById("indexValue").style.fontSize = "18px";
    document.getElementById("indexDescription").textContent =
      "Sensitive Groups may experience health effects";
    document.getElementById("indexBox").style.background = "orange";
    document.getElementById("indexBox").style.borderColor = "darkOrange";
    document.getElementById("epaIndex").textContent = `${indexValue}`;
  } else if (indexValue === 4) {
    document.getElementById("indexValue").textContent = "Unhealthy";
    document.getElementById("indexDescription").textContent =
      "General Public may experience health effects";
    document.getElementById("indexBox").style.background = "red";
    document.getElementById("indexBox").style.borderColor = "crimson";
    document.getElementById("epaIndex").textContent = `${indexValue}`;
  } else if (indexValue === 5) {
    document.getElementById("indexValue").textContent = "Very Unhealthy";
    document.getElementById("indexDescription").textContent =
      "Health Alert: The health risk is increased for everyone.";
    document.getElementById("indexBox").style.background = "mediumPurple";
    document.getElementById("indexBox").style.borderColor = "darkViolet";
    document.getElementById("epaIndex").textContent = `${indexValue}`;
  } else if (indexValue > 5) {
    document.getElementById("indexValue").textContent = "Hazardous";
    document.getElementById("indexDescription").textContent =
      "Health Warning of emergency conditions, everyone is more likely to be effected";
    document.getElementById("indexBox").style.background = "purple";
    document.getElementById("indexBox").style.borderColor = "darkMagenta";
    document.getElementById("epaIndex").textContent = `${indexValue}`;
  } else {
    document.getElementById("indexValue").textContent = "Undefined";
    document.getElementById("indexDescription").textContent =
      "There is no Air Quality Data Available";
    document.getElementById("indexBox").style.background = "white";
    document.getElementById("indexBox").style.borderColor = "black";
    document.getElementById("epaIndex").textContent = "";
  }

  // Last 7 Days Weather
  for (let i = 1; i <= 7; i++) {
    if (units === "f") {
      document.getElementById(`highLowHistory${i}`).textContent = `${Math.round(
        historicalData[i].forecast.forecastday[0].day.maxtemp_f
      )}\u00B0/${Math.round(
        historicalData[i].forecast.forecastday[0].day.mintemp_f
      )}\u00B0`;
    }
    if (units === "c") {
      document.getElementById(`highLowHistory${i}`).textContent = `${Math.round(
        historicalData[i].forecast.forecastday[0].day.maxtemp_c
      )}\u00B0/${Math.round(
        historicalData[i].forecast.forecastday[0].day.mintemp_c
      )}\u00B0`;
    }
    document.getElementById(
      `historicalIcon${i}`
    ).src = `../src/weather-icons/day/${historicalData[i].forecast.forecastday[0].day.condition.code}.png`;
    const historicalDate = historicalData[i].forecast.forecastday[0].date;
    const historicalMonth = historicalDate.slice(5, 7);
    const historicalDay = historicalDate.slice(8, 10);
    document.getElementById(
      `history${i}`
    ).textContent = `${historicalMonth}/${historicalDay}`;
  }

  // Temp for Each Section
  if (units === "f") {
    document.getElementById(
      "currentWeatherTemp"
    ).textContent = ` ${forecastData.current.temp_f}\u00B0`;
    document.getElementById(
      "currentWeatherFeel"
    ).textContent = ` ${forecastData.current.feelslike_f}\u00B0`;
    document.getElementById(
      "currentWeatherHigh"
    ).textContent = ` ${forecastData.forecast.forecastday[0].day.maxtemp_f}\u00B0`;
    document.getElementById(
      "currentWeatherLow"
    ).textContent = ` ${forecastData.forecast.forecastday[0].day.mintemp_f}\u00B0`;
    document.getElementById("tomorrowHighLow").textContent = ` ${Math.round(
      forecastData.forecast.forecastday[1].day.maxtemp_f
    )}\u00B0 / ${Math.round(
      forecastData.forecast.forecastday[1].day.mintemp_f
    )}\u00B0`;
    document.getElementById("nextDayHighLow").textContent = ` ${Math.round(
      forecastData.forecast.forecastday[2].day.maxtemp_f
    )}\u00B0 / ${Math.round(
      forecastData.forecast.forecastday[2].day.mintemp_f
    )}\u00B0`;
  }
  if (units === "c") {
    document.getElementById(
      "currentWeatherTemp"
    ).textContent = ` ${forecastData.current.temp_c}\u00B0`;
    document.getElementById(
      "currentWeatherFeel"
    ).textContent = ` ${forecastData.current.feelslike_c}\u00B0`;
    document.getElementById(
      "currentWeatherHigh"
    ).textContent = ` ${forecastData.forecast.forecastday[0].day.maxtemp_c}\u00B0`;
    document.getElementById(
      "currentWeatherLow"
    ).textContent = ` ${forecastData.forecast.forecastday[0].day.mintemp_c}\u00B0`;
    document.getElementById("tomorrowHighLow").textContent = ` ${Math.round(
      forecastData.forecast.forecastday[1].day.maxtemp_c
    )}\u00B0 / ${Math.round(
      forecastData.forecast.forecastday[1].day.mintemp_c
    )}\u00B0`;
    document.getElementById("nextDayHighLow").textContent = ` ${Math.round(
      forecastData.forecast.forecastday[2].day.maxtemp_c
    )}\u00B0 / ${Math.round(
      forecastData.forecast.forecastday[2].day.mintemp_c
    )}\u00B0`;
  }
}

printWeather("Seattle", "f");
window.onload = (event) => {
  getCoordinates();
};

btn.addEventListener("click", () => {
  const searchValue = searchInput.value;
  let units;
  if (document.getElementById("f").checked) {
    units = "f";
  }
  if (document.getElementById("c").checked) {
    units = "c";
  }
  printWeather(searchValue, units);
});
