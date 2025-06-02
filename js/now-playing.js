document.addEventListener('DOMContentLoaded', async () => {
    let currentMovies = [];
    try {
        // 현재 상영작 로드
        const response = await getNowPlaying();
        console.log('받아온 현재 상영작:', response);
        if (response && response.movies) {
            currentMovies = response.movies;
            displayMovies(currentMovies);
            // 저장된 상태 복원
            restoreButtonStates();
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
                            const ratingOrder = { 'ALL': 0, '12': 1, '15': 2, '18': 3 }; // 등급 순서 정의
                            // API 응답에 rating 필드가 있는지, 값이 어떻게 오는지 확인 필요
                            // 여기서는 movie.certification 또는 유사한 필드를 사용한다고 가정
                            const getRatingOrder = (movie) => ratingOrder[movie.certification] !== undefined ? ratingOrder[movie.certification] : 99;
                            return getRatingOrder(a) - getRatingOrder(b);
                        });
                        break;
                    case '장르별':
                         // 장르 ID가 배열로 온다고 가정 (예: movie.genre_ids[0])
                        currentMovies.sort((a, b) => {
                            const genreA = a.genre_ids && a.genre_ids.length > 0 ? a.genre_ids[0] : Number.MAX_SAFE_INTEGER;
                            const genreB = b.genre_ids && b.genre_ids.length > 0 ? b.genre_ids[0] : Number.MAX_SAFE_INTEGER;
                            return genreA - genreB;
                        });
                        break;
                }
                
                displayMovies(currentMovies);
                 // 정렬 후에도 버튼 상태 복원
                restoreButtonStates();
            });
        });

        document.addEventListener('click', function(event) {
            if (sortButton && !sortButton.contains(event.target) && sortOptions && !sortOptions.contains(event.target)) {
                sortOptions.style.display = 'none';
            }
        });
    }
});

// 버튼 상태 저장 함수
function saveButtonState(movieId, type, isActive) {
    const key = `${type}_${movieId}`;
    localStorage.setItem(key, isActive);
}

// 버튼 상태 복원 함수
function restoreButtonStates() {
    document.querySelectorAll('.movie-item').forEach(item => {
        const movieId = item.dataset.movieId;
        if (!movieId) return; // movieId가 없으면 건너뛰기
        
        // 좋아요 버튼 상태 복원
        const likeButton = item.querySelector('.like-button');
        if (likeButton) {
            const likeState = localStorage.getItem(`like_${movieId}`);
            if (likeState === 'true') {
                likeButton.classList.add('active');
            } else {
                likeButton.classList.remove('active');
            }
        }
        
        // 북마크 버튼 상태 복원
        const bookmarkButton = item.querySelector('.bookmark-button');
        if (bookmarkButton) {
            const bookmarkState = localStorage.getItem(`bookmark_${movieId}`);
            if (bookmarkState === 'true') {
                bookmarkButton.classList.add('active');
            } else {
                bookmarkButton.classList.remove('active');
            }
        }
    });
}

// 영화 목록 표시 함수
function displayMovies(movies) {
    const container = document.querySelector('.movie-grid');
    if (!container) return;

    container.innerHTML = movies.map((movie, index) => `
        <div class="movie-item" data-movie-id="${movie.id}">
            <div class="rank">${index + 1}</div>
            <div class="poster-container">
                <a href="movie-detail.html?id=${movie.id}"> <img src="https://placehold.co/180x260/2a2a2a/2a2a2a" 
                         data-src="${movie.poster_path || 'https://placehold.co/180x260/2a2a2a/2a2a2a'}" 
                         alt="${movie.title}" 
                         class="movie-poster lazy"
                         onerror="this.onerror=null; this.src='https://placehold.co/180x260/2a2a2a/2a2a2a';">
                </a>
                <button class="like-button">
                    <i class="heart-icon"></i>
                </button>
                <button class="bookmark-button" aria-label="북마크">
                    <svg class="bookmark-icon" viewBox="0 0 24 24">
                        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                </button>
            </div>
            <div class="movie-info">
                <div class="movie-header">
                    <span class="rating">${movie.certification || 'ALL'}</span>
                    <span class="title">${movie.title}</span>
                </div>
                <div class="movie-details">
                    <span class="booking-rate">평점 ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                    <span class="release-date">${movie.release_date}</span>
                </div>
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

    // 이벤트 리스너 재설정 (중요: displayMovies 호출 후 매번 실행)
    attachButtonListeners();
    
    // 저장된 상태 복원
    restoreButtonStates();
} 

// 버튼 이벤트 리스너 첨부 함수
function attachButtonListeners() {
    // 좋아요 버튼 이벤트 리스너
    const likeButtons = document.querySelectorAll('.like-button');
    likeButtons.forEach(button => {
        // 기존 리스너 제거 (중복 방지)
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            const movieItem = this.closest('.movie-item');
            if (!movieItem) return;
            const movieId = movieItem.dataset.movieId;
            if (!movieId) return;

            try {
                // API 호출 (실제 구현은 api.js 에 있어야 함)
                // await toggleMovieLike(movieId); 
                this.classList.toggle('active');
                saveButtonState(movieId, 'like', this.classList.contains('active'));
                console.log(`Like button for movie ${movieId} is now ${this.classList.contains('active')}`);
            } catch (error) {
                console.error('좋아요 토글 실패:', error);
            }
        });
    });

    // 북마크 버튼 이벤트 리스너
    const bookmarkButtons = document.querySelectorAll('.bookmark-button');
    bookmarkButtons.forEach(button => {
        // 기존 리스너 제거 (중복 방지)
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            const movieItem = this.closest('.movie-item');
            if (!movieItem) return;
            const movieId = movieItem.dataset.movieId;
            if (!movieId) return;
            
            try {
                 // API 호출 (실제 구현은 api.js 에 있어야 함)
                // await toggleMovieBookmark(movieId);
                this.classList.toggle('active');
                saveButtonState(movieId, 'bookmark', this.classList.contains('active'));
                console.log(`Bookmark button for movie ${movieId} is now ${this.classList.contains('active')}`);
            } catch (error) {
                console.error('북마크 토글 실패:', error);
            }
        });
    });
}