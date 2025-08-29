// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 메인 영화 로드
        const mainMovie = await getMainMovie();
        if (mainMovie) {
            displayMainMovie(mainMovie);
        }

        // 현재 상영작과 개봉 예정작 병렬로 로드
        const [nowPlayingResponse, upcomingResponse] = await Promise.all([
            getNowPlaying(),
            getUpcoming()
        ]);

        if (nowPlayingResponse && nowPlayingResponse.movies) {
            displayNowPlaying(nowPlayingResponse.movies);
        }

        if (upcomingResponse && upcomingResponse.movies) {
            displayUpcoming(upcomingResponse.movies);
        }

        // 모달 닫기 버튼 이벤트 리스너
        const closeButton = document.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeTrailerModal);
        }

        // 모달 외부 클릭 시 닫기
        const modal = document.querySelector('.trailer-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeTrailerModal();
                }
            });
        }

        // 검색 기능 설정
        setupSearch();
    } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
    }
});

// 메인 영화 표시 함수
function displayMainMovie(movie) {
    const mainMovieSection = document.querySelector('.main-movie');
    mainMovieSection.style.backgroundImage = `url(${movie.backdrop_path})`;

    document.querySelector('.main-movie-title').textContent = movie.title;

    const movieInfo = document.querySelector('.main-movie-info');
    movieInfo.innerHTML = `
        <span class="movie-rating">평점 ${movie.vote_average.toFixed(1)}</span>
        <span class="movie-runtime">${movie.runtime}분</span>
        <span class="movie-release">${formatDate(movie.release_date)}</span>
    `;

    const genresContainer = document.querySelector('.movie-genres');
    genresContainer.innerHTML = movie.genres
        .map(genre => `<span>${genre}</span>`)
        .join('');

    document.querySelector('.main-movie-description').textContent = movie.overview;

    const directorContainer = document.querySelector('.movie-director');
    if (movie.director) {
        directorContainer.textContent = `감독: ${movie.director.name}`;
    }

    const detailButton = document.querySelector('.btn-detail');
    if (detailButton) {
        detailButton.href = `movie-detail.html?id=${movie.id}`;
    }

    // 예고편 버튼 이벤트 리스너 (기능 유지)
    // const trailerButton = document.querySelector('.btn-trailer');
    // if (trailerButton && movie.video_id) {
    //     trailerButton.onclick = () => openTrailerModal(movie.video_id);
    // }
}

// 예고편 모달 관련 함수들
function openTrailerModal(videoId) {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    if (modal && iframe && videoId) {
        modal.classList.add('active');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
    }
}

function closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    if (modal && iframe) {
        modal.classList.remove('active');
        iframe.src = '';
    }
}

// 날짜 포맷 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// 현재 상영작 표시 함수
function displayNowPlaying(movies) {
    const container = document.getElementById('nowPlayingMovies');
    if (!container) return;
    container.innerHTML = movies.map(movie => `
        <a href="movie-detail.html?id=${movie.id}" class="movie-item">
            <img src="${movie.poster_path || 'https://placehold.co/150x220'}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='https://placehold.co/150x220';">
            <div class="movie-title">${movie.title}</div>
        </a>
    `).join('');
}

// 개봉 예정작 표시 함수
function displayUpcoming(movies) {
    const container = document.getElementById('upcomingMovies');
    if (!container) return;
    container.innerHTML = movies.map(movie => `
        <a href="movie-detail.html?id=${movie.id}" class="movie-item">
            <img src="${movie.poster_path || 'https://placehold.co/150x220'}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='https://placehold.co/150x220';">
            <div class="movie-title">${movie.title}</div>
        </a>
    `).join('');
}

// 검색 기능 설정
function setupSearch() {
    const searchInput = document.querySelector('.header-search-input');
    const searchButton = document.querySelector('.header-search-button');

    async function executeSearch() {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }
    }

    searchButton.addEventListener('click', executeSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    });
}