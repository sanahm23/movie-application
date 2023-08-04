const apiKey = '637526fb495fa4159cc28bf14a864c87';
let searchResults = [];
const topContainer = document.getElementById('topContainer');
const popularContainer = document.getElementById('popularContainer');
const popHeading = document.getElementById('popHeading');
const language = 'en-US';
let currentPage = 1;
let popularMovies = [];
let currentSearchTerm = '';
let isSearching = false;
let fetchingMovies = false;
let imageUrl = 'https://image.tmdb.org/t/p/w300'

async function getTopMovies() {
    const api_url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=${language}`;

    try {
        const response = await fetch(api_url);
        const data = await response.json();
        return data.results.slice(0, 3);
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

function createCarouselIndicators(data) {
    const carouselIndicators = document.getElementById('carouselIndicators');
    data.forEach((_, index) => {
        const indicator = document.createElement('li');
        indicator.setAttribute('data-target', '#topMoviesCarousel');
        indicator.setAttribute('data-slide-to', index.toString());
        if (index === 0) {
            indicator.classList.add('active');
        }
        carouselIndicators.appendChild(indicator);
    });
}

function createCarouselSlides(data) {
    const carouselInner = document.getElementById('carouselInner');
    data.forEach((movie, index) => {
        const slide = document.createElement('div');
        slide.classList.add('carousel-item');
        if (index === 0) {
            slide.classList.add('active');
        }
        const img = document.createElement('img');
        img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        img.alt = movie.title;
        img.classList.add('mx-auto', 'col-md-8', 'd-block', 'w-25');
        img.loading = 'lazy';
        slide.appendChild(img);
        carouselInner.appendChild(slide);
        slide.addEventListener('click', async () => {
            await showMovieDetails(movie);
        });
    });
}


async function getPopularMovies() {
    const api_url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=${language}&page=${currentPage}`;

    try {
        const response = await fetch(api_url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results;
        } else {
            console.error('Error: No movies found in the response.');
            return [];
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

function createMovieCard(movie) {
    const movieList = document.getElementById('movieList');
    const movieCard = document.createElement('div');
    movieCard.classList.add('col-md-3', 'my-2', 'card1');

    const posterUrl = `${imageUrl}${movie.poster_path}`;
    const title = movie.title;
    const releaseDate = movie.release_date;
    const imdbRating = movie.vote_average;

    const cardContent = `
    <div class="card">
      <img src="${posterUrl}" class="card-img-top" alt="${title}" loading="lazy">
      <div class="card-body">
        <h5 class="card-title">${title}</h5>
        <p class="card-text">Release Date: ${releaseDate}</p>
        <p class="card-text">IMDb Rating: ${imdbRating}</p>
        <button class="btn btn-primary view-details" data-movie-id="${movie.id}">View Details</button>
      </div>
    </div>
  `;

    movieCard.innerHTML = cardContent;
    movieList.appendChild(movieCard);
}
async function getMovieDetails(movieId) {
    const api_url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=${language}`;
    const api_url_videos = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}&language=${language}`;
    const api_url_credits = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}&language=${language}`;

    try {
        const [responseDetails, responseVideos, responseCredits] = await Promise.all([
            fetch(api_url).then(response => response.json()),
            fetch(api_url_videos).then(response => response.json()),
            fetch(api_url_credits).then(response => response.json())
        ]);

        const trailer = responseVideos.results.find(result => result.type === 'Trailer' && result.site === 'YouTube');
        const cast = responseCredits.cast.slice(0, 5);

        return {
            trailerKey: trailer ? trailer.key : null,
            cast,
            overview: responseDetails.overview
        };
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
}
async function showMovieDetails(movie) {

    const movieDetailsData = await getMovieDetails(movie.id);
    if (!movieDetailsData) {
        return;
    }

    const content = `
    <div class="containers" style="color:white">
      <div class="row">
        <div class="col-12">
          <h2>${movie.title}</h2>
          <p style="font-size:20px"><strong>Overview:</strong> ${movieDetailsData.overview}</p>
        
      <div class="row">
        <div class ="col-lg-4">
          <div class="embed-responsive embed-responsive-16by9" id="youtubeDiv">
            <iframe class="embed-responsive-item" src="https://www.youtube.com/embed/${movieDetailsData.trailerKey}"></iframe>
          </div>
        </div>
        <div class="col-12">
            <h3>Cast:</h3>
        </div>
          <div class="cast-images" ">
            ${movieDetailsData.cast.map(cast => `
              <div class="cast-item">
                <img src="https://image.tmdb.org/t/p/w200${cast.profile_path}" alt="${cast.name}" class="cast-image">
                <h4 class="cast-name" style="">${cast.name}</h4>
              </div>
              
            `).join('')}
          </div>
        </div>
      
      <div class="row">
        <div class="col-12">
          <p><strong>IMDb Rating:</strong> ${movie.vote_average}</p>
        </div>
      
    </div>
  `;

    document.body.innerHTML = content;
}

function isBottomOfPage() {
    return (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200
    );
}


async function handleInfiniteScroll() {
    if (!fetchingMovies && isBottomOfPage()) {
        if (isSearching) {
            const searchResultsPage = await fetchSearchResults(
                currentSearchTerm,
                currentPage + 1
            );

            if (searchResultsPage.length > 0) {
                searchResults = [...searchResults, ...searchResultsPage];
                currentPage++;
                searchResultsPage.forEach((movie) => createMovieCard(movie));
            }
        } else {
            const popularMoviesPage = await getPopularMovies(currentPage + 1);

            if (popularMoviesPage.length > 0) {
                popularMovies = [...popularMovies, ...popularMoviesPage];
                currentPage++;
                popularMoviesPage.forEach((movie) => createMovieCard(movie));
            }
        }
    }
}

async function handleSearchInfiniteScroll() {
    if (isSearching && isBottomOfPage()) {
        currentPage++;

        const searchResultsPage = await fetchSearchResults(currentSearchTerm, currentPage);
        searchResults = [...searchResults, ...searchResultsPage];

        const movieList = document.getElementById('movieList');
        searchResultsPage.forEach((movie) => createMovieCard(movie));
    }
}

let infiniteScrollEnabled = true;


const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const movieList = document.getElementById('movieList');



async function fetchSearchResults(query, page) {
    fetchingMovies = true;
    try {
        const api_url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=${language}&query=${encodeURIComponent(
            query
        )}&page=${page}`;
        const response = await fetch(api_url);
        const data = await response.json();
        fetchingMovies = false;

        return data.results;
    } catch (error) {
        console.error('Error fetching search results:', error);
        fetchingMovies = false;
        return [];
    }
}


async function handleSearchForm(event) {
    event.preventDefault();
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        alert('Please enter a valid search term.');
        return;
    }

    currentPage = 1;
    currentSearchTerm = searchTerm;
    isSearching = true;
    infiniteScrollEnabled = false;
    searchResults = [];

    const api_url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=${language}&query=${encodeURIComponent(
        searchTerm
    )}&page=${currentPage}`;

    try {
        const response = await fetch(api_url);
        const data = await response.json();

        if (data.results.length === 0) {
            alert('No movies found with the given search term.');
            return;
        }

        searchResults = data.results;
        const movieList = document.getElementById('movieList');
        movieList.innerHTML = '';
        data.results.forEach((movie) => createMovieCard(movie));
        infiniteScrollEnabled = true;
    } catch (error) {
        console.error('Error fetching search results:', error);
    }
}



document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.classList.contains('view-details')) {
        const movieId = target.dataset.movieId;
        if (movieId) {
            const movie = searchResults.find((movie) => movie.id.toString() === movieId);
            if (movie) {
                await showMovieDetails(movie);
            }
        } else {
            await showMovieDetails(target.dataset.movie);
        }
    }
    searchForm.addEventListener('click', handleSearchForm);
});


searchForm.addEventListener('submit', handleSearchForm);


function enableSearchInfiniteScroll() {
    if (isSearching && infiniteScrollEnabled) {
        handleSearchInfiniteScroll();
    }
}
window.addEventListener('scroll', enableSearchInfiniteScroll);


async function handlePopularMovieInfiniteScroll() {
    if (!isSearching && isBottomOfPage()) {
        currentPage++;

        const popularMoviesPage = await getPopularMovies();
        popularMovies = [...popularMovies, ...popularMoviesPage];

        popularMoviesPage.forEach((movie) => createMovieCard(movie));
    }
}

window.addEventListener('scroll', handlePopularMovieInfiniteScroll);

document.addEventListener('DOMContentLoaded', async () => {
    const topMovies = await getTopMovies();
    createCarouselIndicators(topMovies);
    createCarouselSlides(topMovies);

    popularMovies = await getPopularMovies();
    popularMovies.forEach((movie) => createMovieCard(movie));

    document.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.classList.contains('view-details')) {
            const movieId = target.dataset.movieId;
            const movie = topMovies.find((movie) => movie.id.toString() === movieId) ||
                popularMovies.find((movie) => movie.id.toString() === movieId) ||
                searchResults.find((movie) => movie.id.toString() === movieId);

            if (movie) {
                await showMovieDetails(movie);
            }
        }
    });
});
