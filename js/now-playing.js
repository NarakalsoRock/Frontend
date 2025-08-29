document.addEventListener('DOMContentLoaded', async () => {
    let currentMovies = [];
    const container = document.querySelector('.movie-grid');
    if (container) container.innerHTML = '<div class="loading-indicator">영화 목록을 불러오는 중...</div>';
    
    try {
        const response = await window.getNowPlaying();
        if (response && response.movies) {
            currentMovies = response.movies;
            // 초기에는 평점순으로 정렬
            currentMovies.sort((a, b) => b.vote_average - a.vote_average);
            displayMovies(currentMovies);
        } else {
            throw new Error("영화 정보를 받아오지 못했습니다.");
        }
    } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
        if (container) container.innerHTML = '<div class="error-message">영화 목록을 불러오는데 실패했습니다.</div>';
    }

    initializeSortingFeature(currentMovies);
});

function displayMovies(movies) {
    const container = document.querySelector('.movie-grid');
    if (!container) {
        console.error("'.movie-grid' 요소를 찾을 수 없습니다.");
        return;
    }

    const posterBaseUrl = 'https://image.tmdb.org/t/p/w185';
    const placeholderPoster = 'https://placehold.co/180x260/2a2a2a/2a2a2a';

    container.innerHTML = movies.map((movie, index) => {
        const imageUrl = movie.poster_path ? `${posterBaseUrl}${movie.poster_path}` : placeholderPoster;
        return `
        <div class="movie-item">
            <a href="movie-detail.html?id=${movie.id}">
                <div class="rank">${index + 1}</div>
                <div class="poster-container">
                    <img data-src="${imageUrl}"
                         alt="${movie.title || '영화 제목 없음'}"
                         class="movie-poster lazy"
                         onerror="this.onerror=null; this.src='${placeholderPoster}';">
                </div>
                <div class="movie-info">
                    <div class="movie-header">
                        <span class="rating">${movie.rating || 'ALL'}</span>
                        <span class="title">${movie.title || '제목 정보 없음'}</span>
                    </div>
                    <div class="movie-details">
                        <span class="booking-rate">평점 ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                        <span class="release-date">${movie.release_date || '개봉일 정보 없음'}</span>
                    </div>
                </div>
            </a>
        </div>
        `;
    }).join('');

    setupLazyLoading();
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
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
        });
    }
}


// 정렬 기능 초기화
function initializeSortingFeature(movies) {
    const sortButton = document.querySelector('.sort-button');
    const sortOptions = document.querySelector('.sort-options');
    if (!sortButton || !sortOptions) return;

    const sortFunctions = {
        '예매율순': (a, b) => b.vote_average - a.vote_average,
        '개봉일순': (a, b) => new Date(b.release_date) - new Date(a.release_date) // 최신순
    };

    sortOptions.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const sortType = option.textContent.trim();
            sortButton.textContent = sortType + ' ▼';
            sortOptions.style.display = 'none';
            
            const sortedMovies = [...movies].sort(sortFunctions[sortType]);
            requestAnimationFrame(() => displayMovies(sortedMovies));
        });
    });

    sortButton.addEventListener('click', (e) => {
        e.stopPropagation();
        sortOptions.style.display = sortOptions.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        sortOptions.style.display = 'none';
    });
}