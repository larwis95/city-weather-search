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
 
    async create() {
        try {
            let response = await fetch(this.url);
 
            if (response.status === 404) {
                if (this.type === 'forecast') {
                } else if (this.type === 'today') {
                    alert(`${savedCity} not found for search`);
                    const errorCity = savedHistory.indexOf(savedCity)
                    console.log(savedHistory);
                    savedHistory.splice(errorCity, 1);
                    savedCity = savedHistory[savedHistory.length-1]
                    localStorage.setItem('cityHistory', JSON.stringify(savedHistory));
                    localStorage.setItem('lastCity', savedCity);
                    const firstLi = $('ul > li:first-child');
                    console.log(`first li ${firstLi}`)
                    const searchBox = searchForm.find('input');
                    firstLi.remove();
                    searchBox.val('');
                }
                return;
            }
 
            let data = await response.json();
 
            switch (this.type) {
                case 'forecast':
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
    const geocoder = new google.maps.Geocoder();
    const options = {
            types: ['(cities)'],
            componentRestrictions: {country: "us"}
           };
    console.log(searchInput);
    const autocomplete = new google.maps.places.Autocomplete(searchInput, options);
    
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log(place);
        console.log("autocomplete " + autocomplete)
        savedPlace = place;
        console.log(place);
        geocoder
            .geocode({placeId: savedPlace.place_id})
                .then(({results}) => {
                    coords = [results[0].geometry.location.lat().toFixed(2), results[0].geometry.location.lng().toFixed(2)];
                    console.log(coords);
                    savedImg = savedPlace.photos[0].getUrl({maxWidth: 500, maxHeight: 500});
                    
                })
                .catch((e) => window.alert("Geocoder failed due to: " + e));
    })

}

function searchSubmit() {
    const searchInput = searchForm.find('input');
    const cityName = searchInput.val().toLowerCase();
    savedCity = cityName;
    updateSearchHistory(cityName);
    updateDropDown();
    saveToLocalStorage();
    searchInput.val('');
    setUrls();
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
    console.log(coords);
    todayUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords[0]}&lon=${coords[1]}&appid=${weatherKey}&units=imperial`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords[0]}&lon=${coords[1]}&appid=${weatherKey}&units=imperial`;
    localStorage.setItem('lastCoords', JSON.stringify(coords));
    handleApiCall();
}

function handleApiCall() {
    const todayApi = new api('today', todayUrl);
    const forecastApi = new api('forecast', forecastUrl);
    todayApi.create();
}

function handleHistoryClick(id) {
    const key = 'AIzaSyDAICu2uRtO8MB_8-vw03aONwaK-fVV5us'
        fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${id}&key=${key}`)
            .then((response) => {
                if (response.status === 404) {
                    alert('Place not found!');
                    return;
                }
                return response.json();
                }
            )
            .then ((results) => {
                coords = [results[0].geometry.location.lat().toFixed(2), results[0].geometry.location.lng().toFixed(2)];
                console.log(coords);
                savedImg = savedPlace.photos[0].getUrl({maxWidth: 500, maxHeight: 500});
                setUrls();
            })
}

function renderToday(data,) {
    todayCont.empty();
    console.log(data);
    const lowercaseCity = savedCity.toLowerCase();
    const city = lowercaseCity.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
    const weatherIcon = checkWeatherIcon(data);
    todayCont.append(`
      <div class="card text-bg-dark" id="currentWeatherCard">
                  <img src="" class="card-img border border-white" alt="${city} skyline" id="cardImg">
                <div class="card-img-overlay">
                  <div class="card col-6 text-center">
                    <h4 class="card-title" id="currentCity">${city} - Today</h4>
                    <h5 class="card-text">${Math.round(data.main.temp)} °F ${weatherIcon}</h5>
                    <p class="card-text mb-0">Humidity: ${data.main.humidity}%</p>
                    <p class="card-text">Wind Speed: ${Math.round(data.wind.speed)} mph</p>
                </div>
                </div>
              </div>
    `);
    const cityImg = $('#cardImg');
    localStorage.setItem('lastImg', savedImg);
    cityImg.attr('src', savedImg);

}

function checkWeatherIcon(data) {
    console.log(data.weather[0].main);
    switch (data.weather[0].main) {
        case ('Rain' || 'Drizzle'):
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
    console.log(places[0])
    for (let i = 0; i < citiesReversed.length; i++) {
        console.log(i)
        console.log(savedHistory[1])
        console.log(places[i])
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
        const id = tar.attr('data-placeid')
        handleHistoryClick(id);
    })
})


