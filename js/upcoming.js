document.addEventListener('DOMContentLoaded', async () => {
    let upcomingMovies = [];
    try {
        // 상영 예정작 로드
        const response = await window.getUpcoming();
        console.log('받아온 상영 예정작:', response);
        if (response && response.movies) {
            upcomingMovies = response.movies;
            displayMoviesByMonth(upcomingMovies);
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
    const moviesContainerParent = document.querySelector('.movies-container');
    if (!moviesContainerParent) {
        console.error('.movies-container 요소를 찾을 수 없습니다.');
        return;
    }

    const groupedMovies = groupMoviesByMonth(movies);
    
    const posterBaseUrl = 'https://image.tmdb.org/t/p/w185';
    const placeholderPoster = 'https://placehold.co/180x260/2a2a2a/2a2a2a';

    moviesContainerParent.innerHTML = groupedMovies
        .map(([month, monthMovies]) => {
            const moviesHTML = monthMovies.map(movie => {

                // 포스터 URL 처리 수정
                let imageUrl = placeholderPoster;
                let rawPosterPath = '';
                
                if (movie.poster_path && movie.poster_path.startsWith('/')) {
                    imageUrl = `${posterBaseUrl}${movie.poster_path}`;
                    rawPosterPath = movie.poster_path;
                } else if (movie.poster_path && !movie.poster_path.startsWith('http')) {
                    imageUrl = `${posterBaseUrl}/${movie.poster_path}`;
                    rawPosterPath = movie.poster_path;
                } else if (movie.poster_path) {
                    imageUrl = movie.poster_path;
                    rawPosterPath = movie.poster_path;
                }

                console.log('Final image URL:', imageUrl); // 최종 이미지 URL 확인
                
                let ratingDisplay = 'ALL';
                if (movie.adult === true) {
                    ratingDisplay = '18+';
                } else if (movie.certification) {
                    ratingDisplay = movie.certification;
                }
                const dDay = calculateDDay(movie.release_date);

                return `
                    <div class="movie-item" data-movie-id="${movie.id}">
                        <div class="poster-container">
                            <a href="movie-detail.html?id=${movie.id}">
                                <img src="${placeholderPoster}" 
                                     data-src="${imageUrl}" 
                                     alt="${movie.title || '영화 제목 없음'}" 
                                     class="movie-poster lazy"
                                     data-poster-path="${rawPosterPath}"
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
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    attachButtonListeners();
    restoreButtonStates();
}

// D-Day 계산 함수
function calculateDDay(releaseDate) {
    const today = new Date();
    const release = new Date(releaseDate);
    const diffTime = release.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function saveButtonState(movieId, type, isActive) {
    const key = `${type}_${movieId}`;
    localStorage.setItem(key, isActive);
}

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

function attachButtonListeners() {
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

            const titleElement = movieItem.querySelector('.movie-info .title');
            const posterElement = movieItem.querySelector('.movie-poster');
            const title = titleElement ? titleElement.textContent : '제목 없음';
            const posterPath = posterElement ? posterElement.dataset.posterPath : '';

            if (!localStorage.getItem('token')) {
                alert('좋아요 기능을 사용하려면 로그인이 필요합니다.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const result = await window.toggleMovieLike(movieId, title, posterPath);
                if (result && result.success) {
                    this.classList.toggle('active');
                    saveButtonState(movieId, 'like', this.classList.contains('active'));
                    console.log(`Like button for movie ${movieId} is now ${this.classList.contains('active')}`);
                } else if (result === null) {
                    // API 호출 자체가 실패
                } else {
                    console.error('좋아요 토글 실패 (서버 응답 오류):', result ? result.error : '알 수 없는 오류');
                }
            } catch (error) {
                console.error('좋아요 토글 중 예외 발생:', error);
            }
        });
    });

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
            
            const titleElement = movieItem.querySelector('.movie-info .title');
            const posterElement = movieItem.querySelector('.movie-poster');
            const title = titleElement ? titleElement.textContent : '제목 없음';
            const posterPath = posterElement ? posterElement.dataset.posterPath : '';

            if (!localStorage.getItem('token')) {
                alert('북마크 기능을 사용하려면 로그인이 필요합니다.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const result = await window.toggleMovieBookmark(movieId, title, posterPath);
                if (result && result.success) {
                    this.classList.toggle('active');
                    saveButtonState(movieId, 'bookmark', this.classList.contains('active'));
                    console.log(`Bookmark button for movie ${movieId} is now ${this.classList.contains('active')}`);
                } else if (result === null) {
                    // API 호출 자체가 실패
                } else {
                    console.error('북마크 토글 실패 (서버 응답 오류):', result ? result.error : '알 수 없는 오류');
                }
            } catch (error) {
                console.error('북마크 토글 중 예외 발생:', error);
            }
        });
    });
} 