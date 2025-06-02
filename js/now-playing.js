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

function displayMovies(movies) {
    const container = document.querySelector('.movie-grid');
    if (!container) {
        console.error("'.movie-grid' 요소를 찾을 수 없습니다.");
        return;
    }

    const posterBaseUrl = 'https://image.tmdb.org/t/p/w185'; // 또는 w342 등 원하는 크기
    const placeholderPoster = 'https://placehold.co/180x260/2a2a2a/2a2a2a';

    container.innerHTML = movies.map((movie, index) => {
        // movie.poster_path가 TMDB에서 제공하는 /xxxx.jpg 형태의 경로라고 가정합니다.
        const imageUrl = movie.poster_path ? `${posterBaseUrl}${movie.poster_path}` : placeholderPoster;
        const rawPosterPath = movie.poster_path || ''; // data-poster-path에 저장할 순수 경로

        // 영화 등급 처리 (TMDB API 응답에 따라 'certification' 필드가 없을 수 있음)
        // TMDB의 경우 'adult' 필드로 성인 영화 여부 판단 가능. 
        // 또는, 상세 정보 API 호출을 통해 각 국가별 등급 정보를 가져와야 할 수 있습니다.
        // 여기서는 간단히 'adult' 필드를 확인하거나, 기본값 'ALL'을 사용합니다.
        let ratingDisplay = 'ALL';
        if (movie.adult === true) {
            ratingDisplay = '18+';
        } else if (movie.certification) { // 백엔드에서 certification 정보를 추가해준다면 사용
            ratingDisplay = movie.certification;
        }
        // (주의: TMDB API 'discover'나 'now_playing' 기본 응답에는 상세 국가별 등급(certification)이 없을 수 있습니다.
        // 필요시 `movie_details` API를 추가 호출하거나 백엔드에서 이 정보를 조합해야 합니다.)

        return `
        <div class="movie-item" data-movie-id="${movie.id}">
            <div class="rank">${index + 1}</div>
            <div class="poster-container">
                <a href="movie-detail.html?id=${movie.id}">
                    <img src="${placeholderPoster}" 
                         data-src="${imageUrl}" 
                         alt="${movie.title || '영화 제목 없음'}" 
                         class="movie-poster lazy"
                         data-poster-path="${rawPosterPath}"  {# 여기에 data-poster-path 추가 #}
                         onerror="this.onerror=null; this.src='${placeholderPoster}';">
                </a>
                <button class="like-button" aria-label="좋아요">
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

    // Lazy loading 구현
    const lazyImages = document.querySelectorAll('img.lazy');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src; // data-src의 값을 실제 src로 설정
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // 이벤트 리스너 재설정 (중요: displayMovies 호출 후 매번 실행)
    attachButtonListeners(); // 이 함수는 해당 JS 파일 내에 정의되어 있어야 합니다.
    
    // 저장된 버튼 상태 복원 (선택사항, 필요시 구현)
    // restoreButtonStates(); // 이 함수는 해당 JS 파일 내에 정의되어 있어야 합니다.
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