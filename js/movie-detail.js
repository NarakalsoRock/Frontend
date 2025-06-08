// 예고편 모달 열기
function openTrailerModal(videoId) {
    const modal = document.getElementById('trailerModal');
    if (!modal || !videoId) return;

    const iframe = modal.querySelector('iframe');
    if (!iframe) return;

    // 올바른 YouTube Embed URL
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.classList.add('active');
}

// 예고편 모달 닫기
function closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    if (!modal) return;

    const iframe = modal.querySelector('iframe');
    if (iframe) {
        iframe.src = ''; // 비디오 재생 중지
    }
    modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        if (!movieId) {
            throw new Error('URL에서 영화 ID를 찾을 수 없습니다.');
        }

        const [movieData, seriesData, recommendedMovies] = await Promise.all([
            getMovieDetails(movieId),
            getMovieSeries(movieId),
            getRecommendedMovies(movieId)
        ]);

        if (movieData) {
            displayMovieContent(movieData, seriesData, recommendedMovies);
            // 미디어 섹션 초기화 시 movieId 전달
            await initializeMediaSection(movieId);
            setupModalListeners();
        } else {
            throw new Error('영화 정보를 불러오지 못했습니다.');
        }

    } catch (error) {
        console.error('영화 상세 정보 로딩 중 오류 발생:', error);
        showErrorMessage(error.message);
    }
});


// 영화 상세 정보, 관련 시리즈, 추천 영화를 받아 화면에 표시하는 함수
function displayMovieContent(movie, seriesData, recommendedMovies) {
    document.title = `CineX - ${movie.title}`;
    const movieDetailSection = document.querySelector('.movie-detail');
    if (!movieDetailSection) return;

    // 수정된 부분: 영화 평점을 기준으로 관람 등급을 추정하는 로직 적용
    const rating = movie.adult ? '18' : (movie.vote_average >= 7 ? '15' : (movie.vote_average >= 5 ? '12' : 'ALL'));

    const metaInfoHTML = `
        <span class="rating">${rating}</span>
        <span class="release-date">${movie.release_date || '미정'}</span>
        <span class="score">★ ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
        <span class="duration">${movie.runtime ? movie.runtime + '분' : ''}</span>
        <span class="genre">${movie.genres ? movie.genres.join(', ') : ''}</span>
    `;

    const creditsHTML = movie.cast && movie.cast.length > 0
        ? movie.cast.map(person => `
            <a href="person-detail.html?id=${person.id}" class="credit-item">
                <img src="${person.profile_path || 'https://placehold.co/150x150'}" alt="${person.name}" class="credit-image">
                <div class="credit-info"><p class="credit-name">${person.name}</p></div>
            </a>`).join('')
        : '<p>출연진 정보가 없습니다.</p>';

    const seriesHTML = seriesData
        ? `
        <section class="related-series">
            <h2 class="section-title">관련 시리즈</h2>
            <div class="related-series-banner">
                <h3 class="related-series-banner-title">${seriesData.name} 시리즈에 포함된 작품</h3>
                <p class="related-series-list">${seriesData.movies.map(m => m.title).join(', ')}</p>
                <button class="btn-view-collection" onclick="location.href='series.html?collection_id=${seriesData.id}'">컬렉션 보기</button>
            </div>
        </section>`
        : '';
        
    const recommendedMoviesHTML = recommendedMovies && recommendedMovies.length > 0
        ? `
        <section class="recommended-movies">
            <div class="section-header"><h2 class="section-title">추천 영화</h2></div>
            <div class="movie-grid">
                ${recommendedMovies.map(recMovie => `
                    <a href="movie-detail.html?id=${recMovie.id}" class="movie-item">
                        <img src="${recMovie.poster_path || 'https://placehold.co/150x220'}" alt="${recMovie.title}" class="movie-poster">
                        <div class="movie-info">
                            <div class="movie-title">${recMovie.title}</div>
                            <div class="release-date">${formatDate(recMovie.release_date)}</div>
                        </div>
                    </a>`).join('')}
            </div>
        </section>`
        : '';

    movieDetailSection.innerHTML = `
        <div class="movie-header">
            <div class="poster-container">
                <img src="${movie.poster_path || 'https://placehold.co/380x540'}" alt="${movie.title} 포스터" class="movie-poster">
            </div>
            <div class="movie-info">
                <h1 class="movie-title">${movie.title}</h1>
                <div class="movie-meta">${metaInfoHTML}</div>
                <div class="action-buttons">
                    <button class="btn-like ${movie.isLiked ? 'active' : ''}" aria-label="좋아요">
                        <svg class="icon-heart" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                    <button class="btn-bookmark ${movie.isBookmarked ? 'active' : ''}" aria-label="북마크">
                        <svg class="icon-bookmark" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                    </button>
                    <button class="btn-trailer" aria-label="예고편 재생"> 
                        <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        <span>예고편 재생</span>
                    </button>
                </div>
                <section class="movie-synopsis">
                    <h2 class="section-title">개요</h2>
                    <p class="synopsis-text">${movie.overview || '등록된 줄거리가 없습니다.'}</p>
                </section>
            </div>
        </div>
        <section class="movie-credits">
            <div class="section-header">
                <h2 class="section-title">제작진 및 출연자</h2>
            </div>
            <div class="credits-scroll-wrapper">
                <div class="credits-scroll">${creditsHTML}</div>
            </div>
        </section>
        <section class="movie-media">
            <div class="section-header">
                <div class="section-title media-section-title">
                    <a href="#" class="media-link">미디어</a>
                </div>
                <div class="media-tabs">
                    <button class="media-tab active" data-tab="trailers">동영상/트레일러</button>
                    <button class="media-tab" data-tab="stills">포스터/스틸컷</button>
                </div>
            </div>
            <div class="media-content" id="trailers"><div class="media-grid video-grid"></div></div>
            <div class="media-content hidden" id="stills"><div class="media-stills-scroll-wrapper"><div class="media-stills-scroll"></div></div></div>
        </section>
        ${seriesHTML}
        ${recommendedMoviesHTML}
    `;

    setupActionButtons(movie);
}

function setupActionButtons(movie) {
    const likeButton = document.querySelector('.btn-like');
    if (likeButton) {
        likeButton.onclick = async () => {
            const result = await toggleMovieLike(movie.id, movie.title, movie.poster_path);
            if (result && result.success) likeButton.classList.toggle('active');
        };
    }

    const bookmarkButton = document.querySelector('.btn-bookmark');
    if (bookmarkButton) {
        bookmarkButton.onclick = async () => {
            const result = await toggleMovieBookmark(movie.id, movie.title, movie.poster_path);
            if (result && result.success) bookmarkButton.classList.toggle('active');
        };
    }

    const trailerBtn = document.querySelector('.btn-trailer');
    if (trailerBtn) {
        if (movie.video_id) {
            trailerBtn.onclick = () => openTrailerModal(movie.video_id);
        } else {
            trailerBtn.onclick = () => alert('이 영화의 예고편을 찾을 수 없습니다.');
            trailerBtn.disabled = true;
            trailerBtn.style.opacity = 0.5;
        }
    }
}

function setupModalListeners() {
    const modal = document.getElementById('trailerModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTrailerModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTrailerModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeTrailerModal();
        }
    });
}

function showErrorMessage(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `<div class="error-message" style="text-align:center; padding: 40px;"><p>죄송합니다. 정보를 불러오는 중 오류가 발생했습니다.</p><p style="color: #ccc; font-size: 14px;">${message}</p></div>`;
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 미디어 섹션 초기화
async function initializeMediaSection(movieId) {
    try {
        const [videosResponse, imagesResponse] = await Promise.all([
            fetch(`${window.TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${window.TMDB_API_KEY}&language=ko-KR`),
            fetch(`${window.TMDB_BASE_URL}/movie/${movieId}/images?api_key=${window.TMDB_API_KEY}`)
        ]);

        if (!videosResponse.ok || !imagesResponse.ok) throw new Error('미디어 데이터 로딩 실패');

        const videosData = await videosResponse.json();
        const imagesData = await imagesResponse.json();

        updateTrailers(videosData.results);
        updateStills(imagesData, movieId);
        updateMediaLink(movieId);
        setupMediaTabs();

    } catch (error) {
        console.error('미디어 섹션 초기화 중 오류 발생:', error);
        const trailersContainer = document.querySelector('#trailers .media-grid');
        if (trailersContainer) trailersContainer.innerHTML = '<p>동영상 정보를 불러오지 못했습니다.</p>';

        const stillsContainer = document.querySelector('#stills .media-stills-scroll');
        if (stillsContainer) stillsContainer.innerHTML = '<p>이미지 정보를 불러오지 못했습니다.</p>';
    }
}

// 동영상/트레일러 업데이트
function updateTrailers(videos) {
    const trailersGrid = document.querySelector('.video-grid');
    if (!trailersGrid) return;

    const trailers = videos.filter(v => v.type === 'Trailer' && v.site === 'YouTube').slice(0, 2);

    if (trailers.length > 0) {
        trailersGrid.innerHTML = trailers.map(trailer => {
            const thumbnailUrl = `https://i.ytimg.com/vi/${trailer.key}/hqdefault.jpg`;
            return `
                <div class="media-item video" onclick="openTrailerModal('${trailer.key}')">
                    <img src="${thumbnailUrl}" alt="${trailer.name}" class="media-thumbnail">
                    <button class="play-button" aria-label="재생">▶</button>
                    <div class="video-info"><div class="video-title">${trailer.name}</div></div>
                </div>`;
        }).join('');
    } else {
        trailersGrid.innerHTML = '<p>사용 가능한 트레일러가 없습니다.</p>';
    }
}

// 포스터/스틸컷 업데이트
function updateStills(imagesData, movieId) {
    const stillsWrapper = document.querySelector('.media-stills-scroll-wrapper');
    const stillsScroll = document.querySelector('.media-stills-scroll');
    if (!stillsWrapper || !stillsScroll) return;

    const images = [...(imagesData.backdrops || []), ...(imagesData.posters || [])].slice(0, 5);

    if (images.length > 0) {
        stillsScroll.innerHTML = images.map(image => `
            <div class="media-item image">
                <img src="https://image.tmdb.org/t/p/w500${image.file_path}" alt="영화 스틸컷" class="media-image">
            </div>
        `).join('');

        const existingButton = stillsWrapper.querySelector('.media-scroll-more-btn');
        if (existingButton) {
            existingButton.remove();
        }

        const moreButton = document.createElement('button');
        moreButton.className = 'media-scroll-more-btn';
        moreButton.innerHTML = '>';
        moreButton.setAttribute('aria-label', '미디어 페이지로 이동');
        moreButton.onclick = () => {
            location.href = `media.html?id=${movieId}`;
        };
        stillsWrapper.appendChild(moreButton);

    } else {
        stillsScroll.innerHTML = '<p>사용 가능한 이미지가 없습니다.</p>';
    }
}

// 미디어 페이지 링크 업데이트
function updateMediaLink(movieId) {
    const mediaLink = document.querySelector('.media-link');
    if (mediaLink) {
        mediaLink.href = `media.html?id=${movieId}`;
    }
}

// 미디어 탭 기능
function setupMediaTabs() {
    const mediaTabs = document.querySelectorAll('.media-tab');
    mediaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            mediaTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.media-content').forEach(content => {
                content.classList.toggle('hidden', content.id !== tab.dataset.tab);
            });
        });
    });
}