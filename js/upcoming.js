// upcoming.js
document.addEventListener('DOMContentLoaded', async () => {
    let upcomingMovies = []; //
    try {
        const response = await window.getUpcoming(); // api.js의 getUpcoming 사용 가정
        console.log('받아온 상영 예정작:', response); //
        if (response && response.movies) { //
            upcomingMovies = response.movies; //
            displayMoviesByMonth(upcomingMovies); //
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
                    case '예매율순':  //
                        upcomingMovies.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)); //
                        break;
                    case '개봉일순': //
                        upcomingMovies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date)); //
                        break;
                    case '관람등급': //
                        upcomingMovies.sort((a, b) => {
                            const ratingOrder = { 'ALL': 0, '12': 1, '15': 2, '18+': 3, '18': 3 }; //
                            const getRatingOrder = (movie) => {
                                let rating = movie.certification || (movie.adult ? '18+' : 'ALL'); //
                                return ratingOrder[rating] !== undefined ? ratingOrder[rating] : 99; //
                            };
                            return getRatingOrder(a) - getRatingOrder(b); //
                        });
                        break;
                    case '장르별': //
                        upcomingMovies.sort((a, b) => {
                            const genreA = a.genre_ids && a.genre_ids.length > 0 ? a.genre_ids[0] : Number.MAX_SAFE_INTEGER; //
                            const genreB = b.genre_ids && b.genre_ids.length > 0 ? b.genre_ids[0] : Number.MAX_SAFE_INTEGER; //
                            return genreA - genreB; //
                        });
                        break;
                }
                
                displayMoviesByMonth(upcomingMovies); //
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

function groupMoviesByMonth(movies) { //
    const groups = {}; //
    const today = new Date(); //
    today.setHours(0, 0, 0, 0); //

    movies.forEach(movie => { //
        if (!movie.release_date) return; //
        const releaseDate = new Date(movie.release_date); //
        
        if (releaseDate >= today) { //
            const month = `${releaseDate.getMonth() + 1}월`; //
            if (!groups[month]) { //
                groups[month] = []; //
            }
            groups[month].push(movie); //
        }
    });
    
    return Object.entries(groups).sort(([a], [b]) => { //
        const monthA = parseInt(a.replace('월', '')); //
        const monthB = parseInt(b.replace('월', '')); //
        return monthA - monthB; //
    });
}

function displayMoviesByMonth(movies) { //
    const moviesContainerParent = document.querySelector('.movies-container'); //
    if (!moviesContainerParent) {
        console.error('.movies-container 요소를 찾을 수 없습니다.'); //
        return;
    }

    const groupedMovies = groupMoviesByMonth(movies); //
    
    const posterBaseUrl = 'https://image.tmdb.org/t/p/w185'; 
    const placeholderPoster = 'https://placehold.co/180x260/2a2a2a/2a2a2a';

    moviesContainerParent.innerHTML = groupedMovies //
        .map(([month, monthMovies]) => {
            const moviesHTML = monthMovies.map(movie => { //
                const imageUrl = movie.poster_path ? `${posterBaseUrl}${movie.poster_path}` : placeholderPoster;
                const rawPosterPath = movie.poster_path || ''; 
                
                let ratingDisplay = 'ALL';
                if (movie.adult === true) {
                    ratingDisplay = '18+';
                } else if (movie.certification) {
                    ratingDisplay = movie.certification;
                }
                const dDay = calculateDDay(movie.release_date); //

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
                `; //
            }).join('');

            return `
                <div class="month-section">
                    <h2 class="month-title">${month}</h2> 
                    <div class="movie-grid">
                        ${moviesHTML}
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
    // restoreButtonStates(); // API 호출로 실제 상태를 반영한 후 호출하는 것이 더 좋음
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
                const result = await window.toggleMovieLike(movieId, title, posterPath);
                if (result && result.success) {
                    this.classList.toggle('active');
                    saveButtonState(movieId, 'like', this.classList.contains('active')); //
                    console.log(`Like button for movie ${movieId} is now ${this.classList.contains('active')}`); //
                } else if (result === null) {
                    // API 호출 실패 (리디렉션 등)
                } else {
                    console.error('좋아요 토글 실패 (서버 응답 오류):', result ? result.error : '알 수 없는 오류');
                }
            } catch (error) {
                console.error('좋아요 토글 중 예외 발생:', error); //
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
                const result = await window.toggleMovieBookmark(movieId, title, posterPath);
                if (result && result.success) {
                    this.classList.toggle('active');
                    saveButtonState(movieId, 'bookmark', this.classList.contains('active')); //
                    console.log(`Bookmark button for movie ${movieId} is now ${this.classList.contains('active')}`); //
                } else if (result === null) {
                    // API 호출 실패 (리디렉션 등)
                } else {
                    console.error('북마크 토글 실패 (서버 응답 오류):', result ? result.error : '알 수 없는 오류');
                }
            } catch (error) {
                console.error('북마크 토글 중 예외 발생:', error); //
            }
        });
    });
}


function calculateDDay(releaseDate) { //
    if (!releaseDate) return 'N/A'; //
    const today = new Date(); //
    today.setHours(0,0,0,0); //
    const release = new Date(releaseDate); //
    release.setHours(0,0,0,0); //
    
    const diffTime = release.getTime() - today.getTime(); //
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); //
    
    if (diffDays < 0) return `+${Math.abs(diffDays)}`; //
    return `${diffDays}`; //
}