// now-playing.js
document.addEventListener('DOMContentLoaded', async () => {
    let currentMovies = [];
    try {
        const response = await window.getNowPlaying(); // api.js의 getNowPlaying 사용 가정
        console.log('받아온 현재 상영작:', response); //
        if (response && response.movies) { //
            currentMovies = response.movies; //
            displayMovies(currentMovies); //
            restoreButtonStates(); //
        }
    } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error); //
    }

    // 정렬 기능 초기화
    const sortButton = document.querySelector('.sort-button'); //
    const sortOptions = document.querySelector('.sort-options'); //

    if (sortButton && sortOptions) { //
        sortButton.addEventListener('click', function() { //
            sortOptions.style.display = sortOptions.style.display === 'block' ? 'none' : 'block'; //
        });

        sortOptions.querySelectorAll('.sort-option').forEach(option => { //
            option.addEventListener('click', function() { //
                const sortType = this.textContent; //
                sortButton.textContent = sortType + ' ▼'; //
                sortOptions.style.display = 'none'; //
                
                switch(sortType) { //
                    case '예매율순': //
                        currentMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)); // vote_average가 없을 경우 0으로 처리
                        break;
                    case '개봉일순': //
                        currentMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date)); //
                        break;
                    case '관람등급': //
                        currentMovies.sort((a, b) => {
                            const ratingOrder = { 'ALL': 0, '12': 1, '15': 2, '18+': 3, '18': 3 }; // 18+ 추가
                            const getRatingOrder = (movie) => {
                                let rating = movie.certification || (movie.adult ? '18+' : 'ALL');
                                return ratingOrder[rating] !== undefined ? ratingOrder[rating] : 99;
                            };
                            return getRatingOrder(a) - getRatingOrder(b);
                        });
                        break;
                    case '장르별': //
                        currentMovies.sort((a, b) => {
                            const genreA = a.genre_ids && a.genre_ids.length > 0 ? a.genre_ids[0] : Number.MAX_SAFE_INTEGER; //
                            const genreB = b.genre_ids && b.genre_ids.length > 0 ? b.genre_ids[0] : Number.MAX_SAFE_INTEGER; //
                            return genreA - genreB; //
                        });
                        break;
                }
                
                displayMovies(currentMovies); //
                restoreButtonStates(); //
            });
        });

        document.addEventListener('click', function(event) { //
            if (sortButton && !sortButton.contains(event.target) && sortOptions && !sortOptions.contains(event.target)) { //
                sortOptions.style.display = 'none'; //
            }
        });
    }
});

function saveButtonState(movieId, type, isActive) { //
    const key = `${type}_${movieId}`; //
    localStorage.setItem(key, isActive); //
}

function restoreButtonStates() { //
    // 페이지 로드 시 `/api/auth/me`를 호출하여 사용자의 실제 좋아요/북마크 상태를 가져와 버튼에 반영하는 것이 더 정확합니다.
    // localStorage는 다른 브라우저나 시크릿 모드에서 동기화되지 않으므로, 보조적인 수단으로 사용하거나,
    // 혹은 로그인 시 서버로부터 받은 정보로 초기화하는 것이 좋습니다.
    // 여기서는 일단 localStorage 기반 로직을 유지하되, API 호출 후 실제 상태로 덮어쓰는 것을 권장합니다.

    document.querySelectorAll('.movie-item').forEach(item => { //
        const movieId = item.dataset.movieId; //
        if (!movieId) return; //
        
        const likeButton = item.querySelector('.like-button'); //
        if (likeButton) { //
            const likeState = localStorage.getItem(`like_${movieId}`); //
            if (likeState === 'true') { //
                likeButton.classList.add('active'); //
            } else {
                likeButton.classList.remove('active'); //
            }
        }
        
        const bookmarkButton = item.querySelector('.bookmark-button'); //
        if (bookmarkButton) { //
            const bookmarkState = localStorage.getItem(`bookmark_${movieId}`); //
            if (bookmarkState === 'true') { //
                bookmarkButton.classList.add('active'); //
            } else {
                bookmarkButton.classList.remove('active'); //
            }
        }
    });
}

function displayMovies(movies) { //
    const container = document.querySelector('.movie-grid'); //
    if (!container) {
        console.error("'.movie-grid' 요소를 찾을 수 없습니다."); //
        return;
    }

    const posterBaseUrl = 'https://image.tmdb.org/t/p/w185'; 
    const placeholderPoster = 'https://placehold.co/180x260/2a2a2a/2a2a2a';

    container.innerHTML = movies.map((movie, index) => { //
        const imageUrl = movie.poster_path ? `${posterBaseUrl}${movie.poster_path}` : placeholderPoster;
        const rawPosterPath = movie.poster_path || ''; 

        let ratingDisplay = 'ALL';
        if (movie.adult === true) {
            ratingDisplay = '18+';
        } else if (movie.certification) { 
            ratingDisplay = movie.certification;
        }

        return `
        <div class="movie-item" data-movie-id="${movie.id}">
            <div class="rank">${index + 1}</div> 
            <div class="poster-container">
                <a href="movie-detail.html?id=${movie.id}"> <img src="${placeholderPoster}" 
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
                    <span class="booking-rate">평점 ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span> 
                    <span class="release-date">${movie.release_date || '개봉일 정보 없음'}</span>
                </div>
            </div>
        </div>
    `; //
    }).join('');

    const lazyImages = document.querySelectorAll('img.lazy'); //
    const imageObserver = new IntersectionObserver((entries, observer) => { //
        entries.forEach(entry => { //
            if (entry.isIntersecting) { //
                const img = entry.target; //
                img.src = img.dataset.src; //
                img.classList.remove('lazy'); //
                observer.unobserve(img); //
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img)); //

    attachButtonListeners(); //
    restoreButtonStates(); // API 호출로 실제 상태를 반영한 후 호출하는 것이 더 좋음
} 

function attachButtonListeners() { //
    const likeButtons = document.querySelectorAll('.like-button'); //
    likeButtons.forEach(button => { //
        const newButton = button.cloneNode(true); //
        button.parentNode.replaceChild(newButton, button); //

        newButton.addEventListener('click', async function(e) { //
            e.preventDefault(); //
            e.stopPropagation(); //
            const movieItem = this.closest('.movie-item'); //
            if (!movieItem) return; //
            const movieId = movieItem.dataset.movieId; //
            if (!movieId) return; //

            // 영화 제목 및 포스터 경로 가져오기 (displayMovies에서 설정한 것을 기반으로)
            const titleElement = movieItem.querySelector('.movie-info .title');
            const posterElement = movieItem.querySelector('.movie-poster');
            const title = titleElement ? titleElement.textContent : '제목 없음';
            const posterPath = posterElement ? posterElement.dataset.posterPath : '';

            if (!localStorage.getItem('token')) {
                alert('좋아요 기능을 사용하려면 로그인이 필요합니다.');
                window.location.href = 'login.html'; // 실제 로그인 페이지 경로로 수정
                return;
            }

            try {
                // api.js에 정의된 window.toggleMovieLike 함수 사용
                const result = await window.toggleMovieLike(movieId, title, posterPath); 
                if (result && result.success) {
                    this.classList.toggle('active'); // API 성공 시에만 버튼 상태 변경
                    saveButtonState(movieId, 'like', this.classList.contains('active')); //
                    console.log(`Like button for movie ${movieId} is now ${this.classList.contains('active')}`); //
                    // alert(result.message); // 사용자에게 피드백 (선택 사항)
                } else if (result === null) {
                    // API 호출 자체가 실패 (예: 로그인 필요로 리디렉션 된 경우)
                    // 이미 alert가 표시되었거나 리디렉션 되었으므로 추가 작업 불필요
                } else {
                    // API는 호출했으나 success: false 인 경우
                    console.error('좋아요 토글 실패 (서버 응답 오류):', result ? result.error : '알 수 없는 오류');
                    // alert(result ? result.error : '좋아요 처리에 실패했습니다.');
                }
            } catch (error) {
                console.error('좋아요 토글 중 예외 발생:', error); //
                // alert('좋아요 처리 중 예외가 발생했습니다.');
            }
        });
    });

    const bookmarkButtons = document.querySelectorAll('.bookmark-button'); //
    bookmarkButtons.forEach(button => { //
        const newButton = button.cloneNode(true); //
        button.parentNode.replaceChild(newButton, button); //
        
        newButton.addEventListener('click', async function(e) { //
            e.preventDefault(); //
            e.stopPropagation(); //
            const movieItem = this.closest('.movie-item'); //
            if (!movieItem) return; //
            const movieId = movieItem.dataset.movieId; //
            if (!movieId) return; //
            
            const titleElement = movieItem.querySelector('.movie-info .title');
            const posterElement = movieItem.querySelector('.movie-poster');
            const title = titleElement ? titleElement.textContent : '제목 없음';
            const posterPath = posterElement ? posterElement.dataset.posterPath : '';

            if (!localStorage.getItem('token')) {
                alert('북마크 기능을 사용하려면 로그인이 필요합니다.');
                window.location.href = 'login.html'; // 실제 로그인 페이지 경로로 수정
                return;
            }

            try {
                // api.js에 정의된 window.toggleMovieBookmark 함수 사용
                const result = await window.toggleMovieBookmark(movieId, title, posterPath);
                if (result && result.success) {
                    this.classList.toggle('active'); // API 성공 시에만 버튼 상태 변경
                    saveButtonState(movieId, 'bookmark', this.classList.contains('active')); //
                    console.log(`Bookmark button for movie ${movieId} is now ${this.classList.contains('active')}`); //
                    // alert(result.message); // 사용자에게 피드백 (선택 사항)
                } else if (result === null) {
                    // API 호출 자체가 실패
                } else {
                    console.error('북마크 토글 실패 (서버 응답 오류):', result ? result.error : '알 수 없는 오류');
                    // alert(result ? result.error : '북마크 처리에 실패했습니다.');
                }
            } catch (error) {
                console.error('북마크 토글 중 예외 발생:', error); //
                // alert('북마크 처리 중 예외가 발생했습니다.');
            }
        });
    });
}