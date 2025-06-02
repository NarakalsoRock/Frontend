document.addEventListener('DOMContentLoaded', async () => {
    let upcomingMovies = [];
    try {
        // 상영 예정작 로드
        const response = await getUpcoming();
        console.log('받아온 상영 예정작:', response);
        if (response && response.movies) {
            upcomingMovies = response.movies;
            displayMoviesByMonth(upcomingMovies);
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
                        upcomingMovies.sort((a, b) => b.vote_average - a.vote_average);
                        break;
                    case '개봉일순':
                        upcomingMovies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
                        break;
                    case '관람등급':
                        upcomingMovies.sort((a, b) => {
                            const ratingOrder = { 'ALL': 0, '12': 1, '15': 2, '18': 3 };
                            return ratingOrder[a.rating] - ratingOrder[b.rating];
                        });
                        break;
                    case '장르별':
                        upcomingMovies.sort((a, b) => a.genre_ids[0] - b.genre_ids[0]);
                        break;
                }
                
                displayMoviesByMonth(upcomingMovies);
            });
        });

        document.addEventListener('click', function(event) {
            if (!sortButton.contains(event.target) && !sortOptions.contains(event.target)) {
                sortOptions.style.display = 'none';
            }
        });
    }
});

// 월별로 영화 그룹화 함수
function groupMoviesByMonth(movies) {
    const groups = {};
    
    // 현재 날짜 가져오기
    const today = new Date();
    
    movies.forEach(movie => {
        const releaseDate = new Date(movie.release_date);
        
        // 현재 날짜보다 이전인 영화는 제외
        if (releaseDate < today) return;
        
        // 월만 추출 (예: "5월")
        const month = `${releaseDate.getMonth() + 1}월`;
        
        if (!groups[month]) {
            groups[month] = [];
        }
        groups[month].push(movie);
    });
    
    // 월 순서대로 정렬
    return Object.entries(groups).sort(([a], [b]) => {
        const monthA = parseInt(a.replace('월', ''));
        const monthB = parseInt(b.replace('월', ''));
        return monthA - monthB;
    });
}

// 월별로 영화 표시 함수
function displayMoviesByMonth(movies) {
    const container = document.querySelector('.movies-container');
    if (!container) return;

    const groupedMovies = groupMoviesByMonth(movies);
    
    container.innerHTML = groupedMovies
        .map(([month, monthMovies]) => `
            <div class="month-section">
                <h2 class="month-title">${month}</h2>
                <div class="movie-grid">
                    ${monthMovies.map(movie => `
                        <div class="movie-item" data-movie-id="${movie.id}">
                            <div class="poster-container">
                                <img src="https://placehold.co/180x260/2a2a2a/2a2a2a" 
                                     data-src="${movie.poster_path || 'https://placehold.co/180x260/2a2a2a/2a2a2a'}" 
                                     alt="${movie.title}" 
                                     class="movie-poster lazy"
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
                                    <span class="release-date">${movie.release_date}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

    // Lazy loading 구현
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

// D-Day 계산 함수
function calculateDDay(releaseDate) {
    const today = new Date();
    const release = new Date(releaseDate);
    const diffTime = release.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
} 