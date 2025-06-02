// API 기본 URL은 movieApi.js에서 가져옵니다

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // URL에서 영화 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        if (!movieId) {
            throw new Error('영화 ID가 없습니다.');
        }

        // 영화 상세 정보와 추천 영화 동시에 가져오기
        const [movieData, recommendedMovies] = await Promise.all([
            getMovieDetails(movieId),
            getRecommendedMovies(movieId)
        ]);

        // 영화 상세 정보 업데이트
        updateMovieDetails(movieData);
        
        // 추천 영화 업데이트
        updateRecommendedMovies(recommendedMovies);

    } catch (error) {
        console.error('영화 상세 정보 로딩 중 오류 발생:', error);
        // 에러 메시지 표시
        const movieDetailSection = document.querySelector('.movie-detail');
        if (movieDetailSection) {
            movieDetailSection.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 2rem;">
                    <h2>오류가 발생했습니다</h2>
                    <p>${error.message}</p>
                    <a href="javascript:history.back()" class="back-button">이전 페이지로 돌아가기</a>
                </div>
            `;
        }
    }
});

// 영화 상세 정보 업데이트 함수
function updateMovieDetails(movie) {
    // 포스터 이미지 업데이트
    const posterImg = document.querySelector('.movie-poster');
    if (posterImg) {
        posterImg.src = movie.poster_path || 'https://placehold.co/380x540';
        posterImg.alt = movie.title;
    }

    // 제목 업데이트
    const titleElement = document.querySelector('.movie-title');
    if (titleElement) {
        titleElement.textContent = movie.title;
    }

    // 메타 정보 업데이트
    const metaElement = document.querySelector('.movie-meta');
    if (metaElement) {
        metaElement.innerHTML = `
            <span class="rating">${movie.adult ? '18' : movie.vote_average >= 7 ? '15' : movie.vote_average >= 5 ? '12' : 'ALL'}</span>
            <span class="release-date">${movie.release_date}</span>
            <span class="score">★ ${movie.vote_average.toFixed(1)}</span>
            <span class="duration">${movie.runtime}분</span>
            <span class="genre">${movie.genres.join(', ')}</span>
        `;
    }

    // 줄거리 업데이트
    const synopsisText = document.querySelector('.synopsis-text');
    if (synopsisText) {
        synopsisText.textContent = movie.overview || '등록된 줄거리가 없습니다.';
    }

    // 출연진 정보 업데이트 (있는 경우)
    if (movie.cast && movie.cast.length > 0) {
        const creditsScroll = document.querySelector('.credits-scroll');
        if (creditsScroll) {
            creditsScroll.innerHTML = movie.cast.map(actor => `
                <a href="person-detail.html?id=${actor.id}" class="credit-item">
                    <img src="${actor.profile_path || 'https://placehold.co/150x150'}" 
                         alt="${actor.name}" 
                         class="credit-image">
                    <div class="credit-info">
                        <p class="credit-name">${actor.name}</p>
                        <p class="credit-role">${actor.character}</p>
                    </div>
                </a>
            `).join('');
        }
    }

    // 좋아요 버튼 이벤트 리스너
    const likeButton = document.querySelector('.btn-like');
    if (likeButton) {
        likeButton.addEventListener('click', async function() {
            try {
                await toggleMovieLike(movie.id);
                this.classList.toggle('active');
            } catch (error) {
                console.error('좋아요 토글 실패:', error);
            }
        });
    }

    // 북마크 버튼 이벤트 리스너
    const bookmarkButton = document.querySelector('.btn-bookmark');
    if (bookmarkButton) {
        bookmarkButton.addEventListener('click', async function() {
            try {
                await toggleMovieBookmark(movie.id);
                this.classList.toggle('active');
            } catch (error) {
                console.error('북마크 토글 실패:', error);
            }
        });
    }

    // 예고편 모달 관련 코드
    const trailerBtn = document.querySelector('.btn-trailer');
    const modal = document.getElementById('trailerModal');
    const closeBtn = modal.querySelector('.modal-close');
    const iframe = modal.querySelector('iframe');

    if (trailerBtn && modal && closeBtn && iframe) {
        // 예고편 URL (실제 예고편 주소로 변경 필요)
        const trailerUrl = movie.trailer_url || `https://www.youtube.com/embed/${movie.video_id}`;

        trailerBtn.addEventListener('click', function() {
            modal.style.display = 'block';
            iframe.src = trailerUrl;
        });

        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            iframe.src = '';
        });

        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                iframe.src = '';
            }
        });
    }

    // 가로 스크롤 영역에서 마우스 휠 이벤트 처리
    const scrollContainers = document.querySelectorAll('.credits-grid, .movie-grid');
    
    scrollContainers.forEach(container => {
        container.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        });
    });

    document.querySelectorAll('.scroll-more-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'media.html';
        });
    });
}

// 추천 영화 업데이트 함수
function updateRecommendedMovies(movies) {
    const recommendedGrid = document.querySelector('.recommended-movies .movie-grid');
    if (recommendedGrid && movies.length > 0) {
        recommendedGrid.innerHTML = movies.map(movie => `
            <a href="movie-detail.html?id=${movie.id}" class="movie-item">
                <img src="${movie.poster_path || 'https://placehold.co/150x220'}" 
                     alt="${movie.title}" 
                     class="movie-poster">
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="release-date">${formatDate(movie.release_date)}</div>
                </div>
            </a>
        `).join('');
    } else if (recommendedGrid) {
        recommendedGrid.innerHTML = '<p class="no-recommendations">추천 영화가 없습니다.</p>';
    }
}

// 날짜 포맷 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}