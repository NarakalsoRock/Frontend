// 캐시 저장소: API 응답을 5분간 저장하여 불필요한 요청 감소
const movieCache = {
    data: null,
    timestamp: null,
    CACHE_DURATION: 5 * 60 * 1000 // 5분
};

const POSTER_SIZES = {
    THUMBNAIL: 'w185',
    MEDIUM: 'w500'
};

document.addEventListener('DOMContentLoaded', async () => {
    let upcomingMovies = [];
    const moviesContainerParent = document.querySelector('.movies-container');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = '영화 목록을 불러오는 중...';
    if (moviesContainerParent) moviesContainerParent.prepend(loadingIndicator);

    try {
        const now = Date.now();
        // 캐시 확인: 5분 이내의 유효한 캐시가 있으면 사용
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
        const filteredMovies = upcomingMovies.filter(movie => new Date(movie.release_date) > today);
        
        displayMoviesByMonth(filteredMovies);
    } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
        if (loadingIndicator) loadingIndicator.textContent = '영화 목록을 불러오는데 실패했습니다.';
    } finally {
        if (loadingIndicator) loadingIndicator.remove();
    }

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
            return (ratingOrder[a.rating] || 0) - (ratingOrder[b.rating] || 0);
        }
    };

    sortOptions.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', () => {
            const sortType = option.textContent.trim();
            sortButton.textContent = sortType + ' ▼';
            sortOptions.style.display = 'none';
            
            const sortedMovies = [...movies].sort(sortFunctions[sortType]);
            requestAnimationFrame(() => displayMoviesByMonth(sortedMovies));
        });
    });
    
    // 드롭다운 토글
    sortButton.addEventListener('click', (e) => {
        e.stopPropagation();
        sortOptions.style.display = sortOptions.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        sortOptions.style.display = 'none';
    });
}

// 월별로 영화 그룹화 및 표시
function displayMoviesByMonth(movies) {
    const moviesContainerParent = document.querySelector('.movies-container');
    if (!moviesContainerParent) return;

    const groupedMovies = new Map();
    const today = new Date();
    
    movies.forEach(movie => {
        const releaseDate = new Date(movie.release_date);
        if (releaseDate < today) return;
        
        const monthKey = `${releaseDate.getFullYear()}-${String(releaseDate.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `${releaseDate.getFullYear()}년 ${releaseDate.getMonth() + 1}월`;
        
        if (!groupedMovies.has(monthKey)) {
            groupedMovies.set(monthKey, { label: monthLabel, movies: [] });
        }
        groupedMovies.get(monthKey).movies.push(movie);
    });
    
    const sortedGroups = Array.from(groupedMovies.entries()).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    const fragment = document.createDocumentFragment();
    
    sortedGroups.forEach(([, group]) => {
        const monthSection = document.createElement('div');
        monthSection.className = 'month-section';
        
        monthSection.innerHTML = `
            <h2 class="month-title">${group.label}</h2>
            <div class="movie-grid">
                ${group.movies.map(movie => createMovieElementHTML(movie, today)).join('')}
            </div>
        `;
        fragment.appendChild(monthSection);
    });

    moviesContainerParent.innerHTML = '';
    moviesContainerParent.appendChild(fragment);

    setupLazyLoading();
}

// 영화 아이템 HTML 생성
function createMovieElementHTML(movie, today) {
    const releaseDate = new Date(movie.release_date);
    const dDay = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));
    
    return `
        <div class="movie-item">
            <a href="movie-detail.html?id=${movie.id}">
                <div class="poster-container">
                    <img data-src="${movie.poster_path ? `https://image.tmdb.org/t/p/${POSTER_SIZES.THUMBNAIL}${movie.poster_path}` : '../images/no-poster.png'}"
                         alt="${movie.title || '영화 제목 없음'}"
                         class="movie-poster lazy">
                </div>
                <div class="movie-info">
                    <div class="movie-header">
                        <span class="rating">${movie.rating || 'ALL'}</span>
                        <span class="title">${movie.title || '제목 정보 없음'}</span>
                    </div>
                    <div class="movie-details">
                        <span class="release-date">${movie.release_date || '개봉일 정보 없음'} ${dDay > 0 ? `(D-${dDay})` : ''}</span>
                    </div>
                </div>
            </a>
        </div>
    `;
}

// 이미지 지연 로딩 설정
function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy');
    if ("IntersectionObserver" in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // IntersectionObserver를 지원하지 않는 구형 브라우저 대응
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
        });
    }
}