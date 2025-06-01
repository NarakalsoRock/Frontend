document.addEventListener('DOMContentLoaded', async () => {
    let currentMovies = [];
    try {
        // 현재 상영작 로드
        const response = await getNowPlaying();
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
                
                // 정렬 로직 적용
                switch(sortType) {
                    case '예매율순':
                        currentMovies.sort((a, b) => b.vote_average - a.vote_average);
                        break;
                    case '개봉일순':
                        currentMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
                        break;
                    case '관람등급':
                        currentMovies.sort((a, b) => {
                            const ratingOrder = { 'ALL': 0, '12': 1, '15': 2, '18': 3 };
                            return ratingOrder[a.rating] - ratingOrder[b.rating];
                        });
                        break;
                    case '장르별':
                        currentMovies.sort((a, b) => a.genre_ids[0] - b.genre_ids[0]);
                        break;
                }
                
                displayMovies(currentMovies);
            });
        });

        document.addEventListener('click', function(event) {
            if (!sortButton.contains(event.target) && !sortOptions.contains(event.target)) {
                sortOptions.style.display = 'none';
            }
        });
    }
});

// 영화 목록 표시 함수
function displayMovies(movies) {
    const container = document.querySelector('.movie-grid');
    if (!container) return;

    container.innerHTML = movies.map((movie, index) => `
        <div class="movie-item" data-movie-id="${movie.id}">
            <div class="rank">${index + 1}</div>
            <div class="poster-container">
                <img src="${movie.poster_path || 'https://placehold.co/180x260/2a2a2a/2a2a2a'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.onerror=null; this.src='https://placehold.co/180x260/2a2a2a/2a2a2a';">
                <button class="like-button">
                    <i class="heart-icon"></i>
                </button>
                <button class="bookmark-button">
                    <svg class="bookmark-icon" viewBox="0 0 24 24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                </button>
            </div>
            <div class="movie-info">
                <div class="movie-header">
                    <span class="rating">${movie.rating || 'ALL'}</span>
                    <span class="title">${movie.title}</span>
                </div>
                <div class="movie-details">
                    <span class="booking-rate">평점 ${movie.vote_average.toFixed(1)}</span>
                    <span class="release-date">${movie.release_date}</span>
                </div>
            </div>
        </div>
    `).join('');

    // 좋아요 버튼 이벤트 리스너
    const likeButtons = document.querySelectorAll('.like-button');
    likeButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const movieItem = this.closest('.movie-item');
            const movieId = movieItem.dataset.movieId;
            try {
                await toggleMovieLike(movieId);
                this.classList.toggle('active');
            } catch (error) {
                console.error('좋아요 토글 실패:', error);
            }
        });
    });

    // 북마크 버튼 이벤트 리스너
    const bookmarkButtons = document.querySelectorAll('.bookmark-button');
    bookmarkButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const movieItem = this.closest('.movie-item');
            const movieId = movieItem.dataset.movieId;
            try {
                await toggleMovieBookmark(movieId);
                this.classList.toggle('active');
            } catch (error) {
                console.error('북마크 토글 실패:', error);
            }
        });
    });
} 