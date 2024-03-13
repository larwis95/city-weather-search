const lastCity = localStorage.getItem('lastCity');
const cityHistory = JSON.parse(localStorage.getItem('cityHistory'));
const todayCont = $('#todayWeather');
const forecastCont = $('#foreCast');
const hisUl = $('#dropdownList');
const searchForm = $('#searchForm');
const hisBtn = $('button')
const weatherKey = '458a573eccf3afd70e16d5cf44ac4e90';
const googleKey = 'AIzaSyDnQrwimq5N9fmNE5_U78isjLduxYvsc6Y';
let renderImg = [true, true];
let forecastUrl;
let todayUrl;
let imageUrl;
let savedCity;
let savedHistory = [];

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
    create() {
        switch (this.type) {
            case('forecast'):
                fetch(this.url)
                    .then((response) => {
                        if (response.status === 404) {
                            renderImg[1] = false;
                        return;
                    } else {
                        renderImg[1] = true;
                        return response.json();
                    };
                    })
                    .then((forecastData) => {
                        //renderForeCast(forecastData);
                    return;
                        
                    })
                    .catch(error => {
                        console.log(error);
                    return;
            })
            break;

            case ('today'):
                fetch(this.url)
                    .then((response) => {
                        if (response.status === 404) {
                            alert(`${lastCity} not found for search`);
                            savedHistory.shift();
                            console.log(savedHistory)
                            savedCity = savedHistory[0];
                            localStorage.setItem('cityHistory', JSON.stringify(savedHistory));
                            localStorage.setItem('lastCity', savedCity)
                            const firstLi = $('ul > li:first-child')
                            const searchBox = searchForm.find('input');
                            firstLi.remove();
                            searchBox.val('');
                            renderImg[0] = false;
                        return;
                        } else {
                            renderImg[0] = true;
                            return response.json();
                        }
                    })
                    .then((todayData) => {
                        renderToday(todayData);
                    return;
                    })
                    .catch(error => {
                        console.log(error);
                    return;
                    })
            break;

            case ('image'):
                fetch(this.url)
                    .then((response) => {
                        return response.json();
                    })
                    .then((imageData) => {
                        if(renderImg[0] === true && renderImg[0] === true) {
                        console.log(imageData);
                        console.log(imageData.items[0].link);
                        const cityImg = $('#cardImg')
                        let imageSrc = imageData.items[0].link;
                        cityImg.attr('src', imageSrc);
                        };
                    return;
                    })
                    .catch(error => {
                        alert(`Error in img search api call: ${error}`);
                    })
            break;
            
            default:
            break;
        }
    }

}

const move = (from, to, array) => {
    array.splice(to, 0, array.splice(from, 1)[0]);
}

const last = (array) => {
    return array.length - 1;
}

function searchSubmit() {
    const searchInput = searchForm.find('input');
    let cityName = searchInput.val().toLowerCase();
    savedCity = cityName.toLowerCase();
    if (savedHistory.length === 5 && savedHistory.includes(cityName) === false) {
        savedHistory.shift();
    } 
    if (savedHistory.includes(cityName) === false) {
        hisBtn.css('visibility', 'visible');
        hisUl.prepend(`<li class="dropdown-item"><a>${cityName}</a></li>`);
        savedHistory.push(cityName);
        localStorage.setItem('cityHistory', JSON.stringify(savedHistory));
        localStorage.setItem('lastCity', savedCity);
    };
    if (savedCity.includes(cityName)) {
        let index = savedHistory.indexOf(cityName);
        move(index, last(savedHistory), savedHistory);
        hisUl.empty();
        for (let i of savedHistory.reverse()) { ; 
            hisUl.append(`<li class="dropdown-item"><a>${i}</a></li>`);
        }
    }
    setUrls(cityName);
    searchInput.val('');
}

function setUrls(city) {
    todayUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city.replace(' ', '%20')}&appid=${weatherKey}&units=imperial`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city.replace(' ', '%20')}&appid=${weatherKey}&units=imperial`;
    imageUrl = `https://customsearch.googleapis.com/customsearch/v1?cx=c3b00bc2bd3ae4d8d&exactTerms=${city.replace(' ', '%20')}&excludeTerms=wikipedia&safe=active&searchType=image&key=${googleKey}`;
    console.log(imageUrl);
    handleApiCall();
}

function handleApiCall() {
    const todayApi = new api('today', todayUrl);
    const forecastApi = new api('forecast', forecastUrl);
    todayApi.create();
}

function renderToday(data) {
    console.log(renderImg[0])
    if (renderImg[0] === false) {
        return;
    }
    todayCont.empty();
    console.log(data);
    const lowercaseCity = savedCity.toLowerCase();
    const city = lowercaseCity.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
    const weatherIcon = checkWeatherIcon(data);
    todayCont.append(`
      <div class="card text-bg-dark" id="currentWeatherCard">
                  <img src="" class="card-img border border-white" alt="${city} skyline" id="cardImg">
                <div class="card-img-overlay">
                  <div class="card col-5 text-center">
                    <h4 class="card-title">${city} - Today</h4>
                    <h5 class="card-text">${Math.round(data.main.temp)} °F ${weatherIcon}</h5>
                    <p class="card-text mb-0">Humidity: ${data.main.humidity}%</p>
                    <p class="card-text">Wind Speed: ${Math.round(data.wind.speed)} mph</p>
                </div>
                </div>
              </div>
    `);
    const img = new api('image', imageUrl);
    img.create();
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
        setUrls(savedCity);
    }
    console.log(savedHistory);
    for (let i of savedHistory.reverse()) {  
        hisUl.append(`<li class="dropdown-item"><a>${i}</a></li>`);
    }
    if (hisUl.children().length === 0) {
        hisBtn.css('visibility', 'hidden');
    } else {
        hisBtn.css('visibility', 'visible');
    }
    searchForm.on('submit', (event) => {
        event.preventDefault();
        searchSubmit(event);
    })
 }
)

