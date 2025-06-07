// 캐시 저장소
const movieCache = {
    data: null,
    timestamp: null,
    CACHE_DURATION: 5 * 60 * 1000 // 5분
};

// 이미지 사이즈 최적화
const POSTER_SIZES = {
    THUMBNAIL: 'w185',
    SMALL: 'w342',
    MEDIUM: 'w500',
    LARGE: 'w780'
};

document.addEventListener('DOMContentLoaded', async () => {
    let upcomingMovies = [];
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = '영화 목록을 불러오는 중...';
    document.querySelector('.movies-container').appendChild(loadingIndicator);

    try {
        // 캐시된 데이터 확인
        const now = Date.now();
        if (movieCache.data && movieCache.timestamp && (now - movieCache.timestamp < movieCache.CACHE_DURATION)) {
            upcomingMovies = movieCache.data;
        } else {
            const response = await window.getUpcoming();
            if (response && response.movies) {
                upcomingMovies = response.movies;
                // 캐시 업데이트
                movieCache.data = upcomingMovies;
                movieCache.timestamp = now;
            }
        }
        
        // 초기 정렬: 개봉일순
        upcomingMovies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
        
        // 현재 날짜 이후의 영화만 필터링
        const today = new Date();
        upcomingMovies = upcomingMovies.filter(movie => new Date(movie.release_date) > today);
        
        displayMoviesByMonth(upcomingMovies);
    } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
        loadingIndicator.textContent = '영화 목록을 불러오는데 실패했습니다.';
    }

    // 정렬 기능 초기화
    initializeSortingFeature(upcomingMovies);
});

// 정렬 기능 초기화
function initializeSortingFeature(movies) {
    const sortButton = document.querySelector('.sort-button');
    const sortOptions = document.querySelector('.sort-options');
    if (!sortButton || !sortOptions) return;

    const sortFunctions = {
        '개봉일순': (a, b) => new Date(a.release_date) - new Date(b.release_date),
        '관람등급': (a, b) => {
            const ratingOrder = { 'ALL': 0, '12': 1, '15': 2, '18': 3 };
            return ratingOrder[a.rating] - ratingOrder[b.rating];
        }
    };

    let isOptionsVisible = false;
    
    sortButton.addEventListener('click', () => {
        isOptionsVisible = !isOptionsVisible;
        sortOptions.style.display = isOptionsVisible ? 'block' : 'none';
    });

    sortOptions.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', () => {
            const sortType = option.textContent;
            sortButton.textContent = sortType + ' ▼';
            isOptionsVisible = false;
            sortOptions.style.display = 'none';
            
            const sortedMovies = [...movies].sort(sortFunctions[sortType]);
            requestAnimationFrame(() => displayMoviesByMonth(sortedMovies));
        });
    });

    // 외부 클릭 시 옵션 닫기
    document.addEventListener('click', (event) => {
        if (!sortButton.contains(event.target) && !sortOptions.contains(event.target)) {
            isOptionsVisible = false;
            sortOptions.style.display = 'none';
        }
    });
}

// 월별로 영화 그룹화 함수
function groupMoviesByMonth(movies) {
    const groups = new Map();
    const today = new Date();
    
    movies.forEach(movie => {
        const releaseDate = new Date(movie.release_date);
        if (releaseDate < today) return;
        
        const month = `${releaseDate.getMonth() + 1}월`;
        if (!groups.has(month)) {
            groups.set(month, []);
        }
        groups.get(month).push(movie);
    });
    
    return Array.from(groups.entries()).sort(([a], [b]) => {
        return parseInt(a) - parseInt(b);
    });
}

// 월별로 영화 표시 함수
function displayMoviesByMonth(movies) {
    const moviesContainerParent = document.querySelector('.movies-container');
    if (!moviesContainerParent) return;

    const groupedMovies = groupMoviesByMonth(movies);
    const fragment = document.createDocumentFragment();
    const today = new Date();
    
    groupedMovies.forEach(([month, monthMovies]) => {
        const monthSection = document.createElement('div');
        monthSection.className = 'month-section';
        
        const monthTitle = document.createElement('h2');
        monthTitle.className = 'month-title';
        monthTitle.textContent = month;
        monthSection.appendChild(monthTitle);
        
        const movieGrid = document.createElement('div');
        movieGrid.className = 'movie-grid';
        
        monthMovies.forEach(movie => {
            const movieItem = createMovieElement(movie, today);
            movieGrid.appendChild(movieItem);
        });
        
        monthSection.appendChild(movieGrid);
        fragment.appendChild(monthSection);
    });

    // 한 번에 DOM 업데이트
    moviesContainerParent.innerHTML = '';
    moviesContainerParent.appendChild(fragment);

    // Intersection Observer로 이미지 지연 로딩
    setupLazyLoading();
}

// 영화 요소 생성 함수
function createMovieElement(movie, today) {
    const movieItem = document.createElement('div');
    movieItem.className = 'movie-item';
    movieItem.dataset.movieId = movie.id;

    const releaseDate = new Date(movie.release_date);
    const dDay = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));
    
    movieItem.innerHTML = `
        <div class="poster-container">
            <a href="movie-detail.html?id=${movie.id}">
                <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                     data-src="${movie.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZES.THUMBNAIL}${movie.poster_path}` : '../images/no-poster.png'}"
                     alt="${movie.title || '영화 제목 없음'}"
                     class="movie-poster lazy">
            </a>
        </div>
        <div class="movie-info">
            <div class="movie-header">
                <span class="rating">${movie.rating || 'ALL'}</span>
                <span class="title">${movie.title || '제목 정보 없음'}</span>
            </div>
            <div class="movie-details">
                <span class="release-date">${movie.release_date || '개봉일 정보 없음'} (D-${dDay})</span>
            </div>
        </div>
    `;

    return movieItem;
}

// 지연 로딩 설정
function setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });

    document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img));
}

// D-Day 계산 함수
function calculateDDay(releaseDate) {
    const today = new Date();
    const release = new Date(releaseDate);
    const diffTime = release.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
} 