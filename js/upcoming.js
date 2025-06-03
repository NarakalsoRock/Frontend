document.addEventListener('DOMContentLoaded', async () => {
    let upcomingMovies = [];
    try {
        // 상영 예정작 로드
        const response = await window.getUpcoming();
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
                
                let ratingDisplay = movie.rating || 'ALL';
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
}

// D-Day 계산 함수
function calculateDDay(releaseDate) {
    const today = new Date();
    const release = new Date(releaseDate);
    const diffTime = release.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
} 