document.addEventListener('DOMContentLoaded', async () => {
    let upcomingMovies = [];
    try {
        // 상영 예정작 로드
        const response = await getUpcoming();
        console.log('받아온 상영 예정작:', response);
        if (response && response.movies) {
            upcomingMovies = response.movies;
            displayMoviesByMonth(upcomingMovies);
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
                    case '예매율순': // upcoming 영화에는 예매율 정보가 없을 수 있으므로 vote_average로 대체하거나 다른 기준으로 정렬
                        upcomingMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
                        break;
                    case '개봉일순':
                        upcomingMovies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
                        break;
                    case '관람등급':
                        upcomingMovies.sort((a, b) => {
                            const ratingOrder = { 'ALL': 0, '12': 1, '15': 2, '18': 3 };
                            const getRatingOrder = (movie) => ratingOrder[movie.certification] !== undefined ? ratingOrder[movie.certification] : 99;
                            return getRatingOrder(a) - getRatingOrder(b);
                        });
                        break;
                    case '장르별':
                        upcomingMovies.sort((a, b) => {
                            const genreA = a.genre_ids && a.genre_ids.length > 0 ? a.genre_ids[0] : Number.MAX_SAFE_INTEGER;
                            const genreB = b.genre_ids && b.genre_ids.length > 0 ? b.genre_ids[0] : Number.MAX_SAFE_INTEGER;
                            return genreA - genreB;
                        });
                        break;
                }
                
                displayMoviesByMonth(upcomingMovies);
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
        if (!movieId) return;
        
        const likeButton = item.querySelector('.like-button');
        if (likeButton) {
            const likeState = localStorage.getItem(`like_${movieId}`);
            if (likeState === 'true') {
                likeButton.classList.add('active');
            } else {
                likeButton.classList.remove('active');
            }
        }
        
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

// 월별로 영화 그룹화 함수
function groupMoviesByMonth(movies) {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작

    movies.forEach(movie => {
        if (!movie.release_date) return; // 개봉일 없는 영화 제외
        const releaseDate = new Date(movie.release_date);
        
        if (releaseDate >= today) { // 오늘 이후 개봉작만 포함
            const month = `${releaseDate.getMonth() + 1}월`;
            if (!groups[month]) {
                groups[month] = [];
            }
            groups[month].push(movie);
        }
    });
    
    return Object.entries(groups).sort(([a], [b]) => {
        const monthA = parseInt(a.replace('월', ''));
        const monthB = parseInt(b.replace('월', ''));
        return monthA - monthB;
    });
}

// 월별로 영화 표시 함수
// 월별로 영화 표시 함수
function displayMoviesByMonth(movies) {
    const moviesContainerParent = document.querySelector('.movies-container'); // movies-container를 직접 조작
    if (!moviesContainerParent) {
        console.error('.movies-container 요소를 찾을 수 없습니다.');
        return;
    }

    const groupedMovies = groupMoviesByMonth(movies); // 이 함수는 이미 정의되어 있다고 가정
    
    const posterBaseUrl = 'https://image.tmdb.org/t/p/w185'; // 또는 w342 등 원하는 크기
    const placeholderPoster = 'https://placehold.co/180x260/2a2a2a/2a2a2a';

    moviesContainerParent.innerHTML = groupedMovies
        .map(([month, monthMovies]) => {
            const moviesHTML = monthMovies.map(movie => {
                const imageUrl = movie.poster_path ? `${posterBaseUrl}${movie.poster_path}` : placeholderPoster;
                const rawPosterPath = movie.poster_path || ''; // data-poster-path에 저장할 순수 경로
                
                let ratingDisplay = 'ALL';
                if (movie.adult === true) {
                    ratingDisplay = '18+';
                } else if (movie.certification) {
                    ratingDisplay = movie.certification;
                }
                // D-Day 계산 함수는 이미 있다고 가정
                const dDay = calculateDDay(movie.release_date);

                return `
                    <div class="movie-item" data-movie-id="${movie.id}">
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
                                <span class="release-date">${movie.release_date || '개봉일 정보 없음'} (D-${dDay})</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="month-section">
                    <h2 class="month-title">${month}</h2>
                    <div class="movie-grid">
                        ${moviesHTML}
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
    
    // 이벤트 리스너 재설정 (중요: displayMoviesByMonth 호출 후 매번 실행)
    attachButtonListeners(); // 이 함수는 해당 JS 파일 내에 정의되어 있어야 함
    
    // 저장된 버튼 상태 복원 (선택사항, 필요시 구현)
    // restoreButtonStates(); // 이 함수는 해당 JS 파일 내에 정의되어 있어야 함
}

// 버튼 이벤트 리스너 첨부 함수
function attachButtonListeners() {
    // 좋아요 버튼 이벤트 리스너
    const likeButtons = document.querySelectorAll('.like-button');
    likeButtons.forEach(button => {
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
                // await toggleMovieLike(movieId); // 실제 API 호출은 주석 처리 (필요시 api.js 에 구현)
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
                // await toggleMovieBookmark(movieId); // 실제 API 호출은 주석 처리 (필요시 api.js 에 구현)
                this.classList.toggle('active');
                saveButtonState(movieId, 'bookmark', this.classList.contains('active'));
                console.log(`Bookmark button for movie ${movieId} is now ${this.classList.contains('active')}`);
            } catch (error) {
                console.error('북마크 토글 실패:', error);
            }
        });
    });
}


// D-Day 계산 함수
function calculateDDay(releaseDate) {
    if (!releaseDate) return 'N/A';
    const today = new Date();
    today.setHours(0,0,0,0); // 시간 정보 제거
    const release = new Date(releaseDate);
    release.setHours(0,0,0,0); // 시간 정보 제거
    
    const diffTime = release.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `+${Math.abs(diffDays)}`; // 개봉일 지남
    return `${diffDays}`; // D-Day
}