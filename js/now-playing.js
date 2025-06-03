document.addEventListener('DOMContentLoaded', async () => {
    let currentMovies = [];
    try {
        const response = await window.getNowPlaying();
        console.log('받아온 현재 상영작:', response);
        if (response && response.movies) {
            currentMovies = response.movies;
            displayMovies(currentMovies);
        }
    } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
    }

    // 정렬 기능 초기화
    const sortButton = document.querySelector('.sort-button');
    const sortOptions = document.querySelector('.sort-options');

    if (sortButton && sortOptions) {
        sortButton.addEventListener('click', function() {
            sortOptions.style.display = sortOptions.style.display === 'block' ? 'none' : 'block';
        });

        sortOptions.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', function() {
                const sortType = this.textContent;
                sortButton.textContent = sortType + ' ▼';
                sortOptions.style.display = 'none';
                
                switch(sortType) {
                    case '예매율순':
                        currentMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
                        break;
                    case '개봉일순':
                        currentMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
                        break;
                    case '관람등급':
                        currentMovies.sort((a, b) => {
                            const ratingOrder = { 'ALL': 0, '12': 1, '15': 2, '18': 3 };
                            return (ratingOrder[a.rating] || 0) - (ratingOrder[b.rating] || 0);
                        });
                        break;
                    case '장르별':
                        currentMovies.sort((a, b) => {
                            const genreA = a.genre_ids && a.genre_ids.length > 0 ? a.genre_ids[0] : Number.MAX_SAFE_INTEGER;
                            const genreB = b.genre_ids && b.genre_ids.length > 0 ? b.genre_ids[0] : Number.MAX_SAFE_INTEGER;
                            return genreA - genreB;
                        });
                        break;
                }
                
                displayMovies(currentMovies);
            });
        });

        document.addEventListener('click', function(event) {
            if (sortButton && !sortButton.contains(event.target) && sortOptions && !sortOptions.contains(event.target)) {
                sortOptions.style.display = 'none';
            }
        });
    }
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
        const rawPosterPath = movie.poster_path || '';

        let ratingDisplay = movie.rating || 'ALL';

        return `
        <div class="movie-item" data-movie-id="${movie.id}">
            <div class="rank">${index + 1}</div>
            <div class="poster-container">
                <a href="movie-detail.html?id=${movie.id}">
                    <img src="${placeholderPoster}"
                         data-src="${imageUrl}"
                         alt="${movie.title || '영화 제목 없음'}"
                         class="movie-poster lazy"
                         data-poster-path="${rawPosterPath}"
                         onerror="this.onerror=null; this.src='${placeholderPoster}';">
                </a>
            </div>
            <div class="movie-info">
                <div class="movie-header">
                    <span class="rating">${ratingDisplay}</span>
                    <span class="title">${movie.title || '제목 정보 없음'}</span>
                </div>
                <div class="movie-details">
                    <span class="booking-rate">평점 ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                    <span class="release-date">${movie.release_date || '개봉일 정보 없음'}</span>
                </div>
            </div>
        </div>
        `;
    }).join('');

    const lazyImages = document.querySelectorAll('img.lazy');
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
} 