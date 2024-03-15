const lastCity = localStorage.getItem('lastCity');
const cityHistory = JSON.parse(localStorage.getItem('cityHistory'));
const lastImg = localStorage.getItem('lastImg');
const lastCoords = JSON.parse(localStorage.getItem('lastCoords'));
const todayCont = $('#todayWeather');
const forecastCont = $('#foreCast');
const hisUl = $('#dropdownList');
const searchForm = $('#searchForm');
const hisBtn = $('button')
const weatherKey = '458a573eccf3afd70e16d5cf44ac4e90';
let forecastUrl;
let todayUrl;
let savedCity;
let savedHistory = [[], []];
let savedPlace;
let savedImg;
let coords = [];

const weatherTypes = {
    sunny: '☀',
    cloudy: '☁',
    rain: '🌧',
    storm: '🌩',
    snow: '❄',
    someClouds: '⛅'
};

class api {
    constructor(type, url) {
        this.type = type;
        this.url = url;
    }
 
    async call() {
        try {
            let response = await fetch(this.url);
 
            if (response.status === 404) {
                if (this.type === 'forecast') {
                } 
                else if (this.type === 'today') {
                    alert(`${savedCity} not found for search`);
                    const errorCity = savedHistory.indexOf(savedCity)
                    savedHistory[0].splice(errorCity, 1);
                    savedHistory[1].splice(errorCity, 1);
                    savedCity = savedHistory[savedHistory.length-1]
                    localStorage.setItem('cityHistory', JSON.stringify(savedHistory));
                    localStorage.setItem('lastCity', savedCity);
                    const firstLi = $('ul > li:first-child');
                    const searchBox = searchForm.find('input');
                    firstLi.remove();
                    searchBox.val('');
                }
                return;
            }
 
            let data = await response.json();
 
            switch (this.type) {
                case 'forecast':
                    console.log(data);
                    renderForeCast(data);
                    // renderForeCast(data);
                    break;
                case 'today':
                    renderToday(data);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.log(error);
        }
    }
}

function arraymove(arr, fromIndex, toIndex) {
    let element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}
 
function initAutocomplete() {
    const searchInput = document.querySelector('#searchCity');
    const options = {
            types: ['(cities)'],
            componentRestrictions: {country: "us"}
           };
    const autocomplete = new google.maps.places.Autocomplete(searchInput, options);
    
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        savedPlace = place;
        const objLength = Object.keys(savedPlace).length
        console.log(objLength);
        if (objLength > 1) { 
            savedImg = savedPlace.photos[0].getUrl();
            localStorage.setItem('lastImg', savedImg);
            getCoordinates(place);
        } else {
            return;
        }
        })
}

function getCoordinates(place) {
    console.log(place);
    coords = [place.geometry.location.lat().toFixed(2), place.geometry.location.lng().toFixed(2)];
}

function searchSubmit() {
    const searchInput = searchForm.find('input');
    console.log(savedPlace.length)
    const objLength = Object.keys(savedPlace).length
    if (objLength > 1) { 
        const cityName = searchInput.val().toLowerCase();
        savedCity = cityName;
        localStorage.setItem('lastCoords', JSON.stringify(coords));
        updateSearchHistory(cityName);
        updateDropDown();
        saveToLocalStorage();
        searchInput.val('');
        setUrls();
    }
    else {
        alert('Invalid Search, use autocomplete for valid search');
        searchInput.val('');
    return;
    }
}

function updateSearchHistory(cityName) {
    if (savedHistory[0].length === 5 && !savedHistory[0].includes(cityName)) {
        savedHistory[0].shift();
        savedHistory[1].shift();
        $('#dropdownList li:last-child').remove();
    }
    if (!savedHistory[0].includes(cityName)) {
        savedHistory[0].push(cityName);
        savedHistory[1].push(savedPlace.place_id);
    } else {
        const index = savedHistory[0].indexOf(cityName);
        arraymove(savedHistory[0], index, savedHistory[0].length);
        arraymove(savedHistory[1], index, savedHistory[1].length);
    }
}

function updateDropDown() {
    hisBtn.css('visibility', 'visible');
    hisUl.empty();
    const places = savedHistory[1].slice().reverse();
    const citiesReversed = savedHistory[0].slice().reverse();
    for (let i = 0; i < citiesReversed.length; i++) {
        hisUl.append(`<li class="dropdown-item" data-placeid="${places[i]}">${citiesReversed[i]}</li>`);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('cityHistory', JSON.stringify(savedHistory));
    localStorage.setItem('lastCity', savedCity);
}

function setUrls() {
    todayUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords[0]}&lon=${coords[1]}&appid=${weatherKey}&units=imperial`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords[0]}&lon=${coords[1]}&appid=${weatherKey}&units=imperial`;
    handleApiCall();
}

function handleApiCall() {
    const todayApi = new api('today', todayUrl);
    const forecastApi = new api('forecast', forecastUrl);
    todayApi.call();
    forecastApi.call();
}

function handleHistoryClick(id, tar) {
    const place = new google.maps.places.PlacesService(tar);
    place.getDetails({placeId: id}, (results, PlaceServiceStatus) => {
        console.log(results);
        savedImg = results.photos[0].getUrl();
        savedCity = results.formatted_address;
        getCoordinates(results);
        setUrls();
        updateDropDown();
    })
}

function renderToday(data) {
    todayCont.empty();
    const lowercaseCity = savedCity.toLowerCase();
    const city = lowercaseCity.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
    const weatherIcon = checkWeatherIcon(data);
    todayCont.append(`
      <div class="card text-bg-dark align-items-center" id="currentWeatherCard">
                  <img src="" class="card-img border border-white" alt="${city} skyline" id="cardImg">
                    <div class="card-img-overlay d-flex flex-column flex-wrap align-items-start justify-content-start align-content-center">
                    <h4 class="card-title " id="currentCity">${city} - Today</h4>
                    <h5 class="card-text">${Math.round(data.main.temp)} °F ${weatherIcon}</h5>
                    <p class="card-text mb-0">Humidity: ${data.main.humidity}%</p>
                    <p class="card-text">Wind Speed: ${Math.round(data.wind.speed)} mph</p>
                </div>
                </div>
    `);
    const cityImg = $('#cardImg');
    cityImg.attr('src', savedImg);

}

function renderForeCast(data) {
    const dayData = [data.list[10], data.list[18], data.list[26], data.list[34], data.list[39]];
    forecastCont.empty();
    console.log(dayData);
    for (let i = 0; i < dayData.length; i++) {
        let day = dayjs(dayData[i].dt_txt).format('MM/DD/YYYY');
        let weatherIcon = checkWeatherIcon(dayData[i]);
        forecastCont.append(`
        <div class="col-2 card text-bg-dark mb-3 text-center" style="max-width: 18rem;">  
        <div class="card-header">${day}</div>
        <div class="card-body">
          <h5 class="card-title">${Math.round(dayData[i].main.temp)} °F</h5>
          <h5 class="card-title">${weatherIcon}</h5>
          <p class="card-text">Humidity:</p>
          <p class="card-text">${dayData[i].main.humidity}%</p>
          <p class="card-text">Wind:</p> 
          <p class="card=text">${Math.round(dayData[i].wind.speed)} mph</p>
        </div>
        </div>`);
    }
}

function checkWeatherIcon(data) {
    switch (data.weather[0].main) {
        case ('Drizzle'):
        case ('Mist'):
        case ('Rain'):
            return weatherTypes.rain;

        case ('Thunderstorm'):
            return weatherTypes.storm;

        case ('Snow'):
            return weatherTypes.snow;

        case ('Clouds'):
            return weatherTypes.someClouds;

        default:
            return weatherTypes.sunny;
    }
}



$(document).ready(() => {
    if (cityHistory !== null) {
        savedHistory = cityHistory;
    }
    if (lastCity !== null) {
        savedCity = lastCity;
    }
    if (lastImg !== null) {
        savedImg = lastImg;
    }
    if (lastCoords !== null) {
        coords = lastCoords;
        setUrls();
    }
    const places = savedHistory[1].slice().reverse();
    const citiesReversed = savedHistory[0].slice().reverse()
    for (let i = 0; i < citiesReversed.length; i++) {
        hisUl.append(`<li class="dropdown-item" data-placeid="${places[i]}">${citiesReversed[i]}</li>`);
    }
    if (hisUl.children().length === 0) {
        hisBtn.css('visibility', 'hidden');
    } else {
        hisBtn.css('visibility', 'visible');
    }
    searchForm.on('submit', (event) => {
        event.preventDefault();
        searchSubmit();
    })
    hisUl.on('click', (event) => {
        event.stopPropagation();
        const tar = $(event.target);
        if (tar.get(0).nodeName === 'LI') {
        const id = tar.attr('data-placeid');
        handleHistoryClick(id, event.target);
        }
    return;
    })
})


