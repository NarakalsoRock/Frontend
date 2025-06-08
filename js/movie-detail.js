// TMDB API 설정
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = 'e79d211004d63ca22d668182dc17ebbb'; // TMDB API 키
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'original';
const PROFILE_SIZE = 'w185';

// DOM 요소 캐싱
const elements = {
    loadingIndicator: document.querySelector('.loading-indicator'),
    errorMessage: document.querySelector('.error-message'),
    moviePoster: document.querySelector('.movie-poster'),
    movieTitle: document.querySelector('.movie-title'),
    movieMeta: document.querySelector('.movie-meta'),
    synopsisText: document.querySelector('.synopsis-text'),
    creditsScroll: document.querySelector('.credits-scroll'),
    mediaLink: document.querySelector('.media-link'),
    seriesSection: document.querySelector('.related-series'),
    seriesBannerTitle: document.querySelector('.related-series-banner-title'),
    seriesList: document.querySelector('.related-series-list'),
    movieGrid: document.querySelector('.movie-grid')
};

// 이미지 지연 로딩 설정
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            observer.unobserve(img);
        }
    });
}, {
    rootMargin: '50px 0px',
    threshold: 0.1
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoading();

        // URL에서 영화 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const rawMovieId = urlParams.get('id');
        
        if (!rawMovieId) {
            throw new Error('영화 ID가 없습니다.');
        }

        // movieId에서 숫자만 추출
        const movieId = rawMovieId.replace(/[^0-9]/g, '');
        if (!movieId) {
            throw new Error('유효하지 않은 영화 ID입니다.');
        }

        // 모든 데이터를 병렬로 가져오기
        const [movieData, seriesData, recommendedMovies] = await Promise.all([
            getMovieDetails(movieId),
            getMovieSeries(movieId).catch(() => null),
            getRecommendedMovies(movieId).catch(() => ({ movies: [] }))
        ]);

        // 영화 상세 정보 업데이트
        updateMovieDetails(movieData);
        
        // 시리즈 정보가 있는 경우에만 표시
        if (seriesData) {
            updateSeriesInfo(seriesData);
        } else {
            elements.seriesSection.style.display = 'none';
        }

        // 추천 영화 표시
        updateRecommendedMovies(recommendedMovies);

        // 미디어 섹션 초기화
        await initializeMediaSection(movieId);

        // 미디어 탭 이벤트 리스너 추가
        const mediaTabs = document.querySelectorAll('.media-tab');
        mediaTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 현재 탭 활성화
                mediaTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // 컨텐츠 변경
                const targetId = tab.dataset.tab;
                document.querySelectorAll('.media-content').forEach(content => {
                    content.classList.toggle('hidden', content.id !== targetId);
                });
            });
        });

        // 미디어 스크롤 더보기 버튼 이벤트 리스너 추가
        const mediaScrollMoreBtn = document.querySelector('.media-scroll-more-btn');
        if (mediaScrollMoreBtn) {
            mediaScrollMoreBtn.addEventListener('click', () => {
                window.location.href = `media.html?id=${movieId}&tab=stills`;
            });
        }

        hideLoading();
    } catch (error) {
        console.error('영화 상세 정보 로딩 중 오류 발생:', error);
        showError();
    }
});

function showLoading() {
    elements.loadingIndicator.style.display = 'flex';
    elements.errorMessage.style.display = 'none';
}

function hideLoading() {
    elements.loadingIndicator.style.display = 'none';
}

function showError() {
    elements.loadingIndicator.style.display = 'none';
    elements.errorMessage.style.display = 'block';
}

// 영화 상세 정보 업데이트 함수
function updateMovieDetails(movie) {
    // 포스터 이미지 업데이트 (지연 로딩 적용)
    if (elements.moviePoster) {
        elements.moviePoster.dataset.src = movie.poster_path ? 
            `${TMDB_IMAGE_BASE_URL}/${POSTER_SIZE}${movie.poster_path}` : 
            'https://placehold.co/380x540';
        elements.moviePoster.alt = movie.title;
        imageObserver.observe(elements.moviePoster);
    }

    // 제목 업데이트
    if (elements.movieTitle) {
        elements.movieTitle.textContent = movie.title;
    }

    // 메타 정보 업데이트
    if (elements.movieMeta) {
        elements.movieMeta.innerHTML = `
            <span class="rating">${movie.adult ? '18' : movie.vote_average >= 7 ? '15' : movie.vote_average >= 5 ? '12' : 'ALL'}</span>
            <span class="release-date">${movie.release_date}</span>
            <span class="score">★ ${movie.vote_average.toFixed(1)}</span>
            <span class="duration">${movie.runtime}분</span>
            <span class="genre">${movie.genres.join(', ')}</span>
        `;
    }

    // 줄거리 업데이트
    if (elements.synopsisText) {
        elements.synopsisText.textContent = movie.overview || '등록된 줄거리가 없습니다.';
    }

    // 출연진 정보 업데이트 (있는 경우)
    if (movie.cast && movie.cast.length > 0 && elements.creditsScroll) {
        const fragment = document.createDocumentFragment();
        
        movie.cast.forEach(actor => {
            const creditItem = document.createElement('a');
            creditItem.href = `person-detail.html?id=${actor.id}`;
            creditItem.className = 'credit-item';
            
            const img = document.createElement('img');
            img.dataset.src = actor.profile_path ? 
                `${TMDB_IMAGE_BASE_URL}/${PROFILE_SIZE}${actor.profile_path}` : 
                'https://placehold.co/150x150';
            img.alt = actor.name;
            img.className = 'credit-image';
            imageObserver.observe(img);

            const info = document.createElement('div');
            info.className = 'credit-info';
            info.innerHTML = `
                <p class="credit-name">${actor.name}</p>
                <p class="credit-role">${actor.character}</p>
            `;

            creditItem.appendChild(img);
            creditItem.appendChild(info);
            fragment.appendChild(creditItem);
        });

        elements.creditsScroll.appendChild(fragment);
    }

    // 좋아요/북마크 버튼 상태 업데이트
    updateActionButtons(movie);
}

// 좋아요/북마크 버튼 상태 업데이트
function updateActionButtons(movie) {
    const likeButton = document.querySelector('.btn-like');
    const bookmarkButton = document.querySelector('.btn-bookmark');

    if (likeButton) {
        if (movie.isLiked) {
            likeButton.classList.add('active');
        }
        likeButton.addEventListener('click', () => toggleMovieLike(movie));
    }

    if (bookmarkButton) {
        if (movie.isBookmarked) {
            bookmarkButton.classList.add('active');
        }
        bookmarkButton.addEventListener('click', () => toggleMovieBookmark(movie));
    }
}

// 좋아요 토글
async function toggleMovieLike(movie) {
    try {
        const button = document.querySelector('.btn-like');
        const result = await toggleMovieInteraction(
            movie.id,
            movie.title,
            movie.poster_path,
            'like'
        );

        if (result && result.success) {
            button.classList.toggle('active');
        }
    } catch (error) {
        console.error('좋아요 토글 실패:', error);
    }
}

// 북마크 토글
async function toggleMovieBookmark(movie) {
    try {
        const button = document.querySelector('.btn-bookmark');
        const result = await toggleMovieInteraction(
            movie.id,
            movie.title,
            movie.poster_path,
            'bookmark'
        );

        if (result && result.success) {
            button.classList.toggle('active');
        }
    } catch (error) {
        console.error('북마크 토글 실패:', error);
    }
}

// 미디어 섹션 초기화
async function initializeMediaSection(movieId) {
    try {
        const [videosResponse, imagesResponse] = await Promise.all([
            fetch(`${TMDB_API_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=ko-KR`),
            fetch(`${TMDB_API_BASE_URL}/movie/${movieId}/images?api_key=${TMDB_API_KEY}`)
        ]);

        if (!videosResponse.ok || !imagesResponse.ok) {
            throw new Error('미디어 데이터를 가져오는데 실패했습니다.');
        }

        const [videosData, imagesData] = await Promise.all([
            videosResponse.json(),
            imagesResponse.json()
        ]);

        // 트레일러 섹션 업데이트
        updateTrailers(videosData.results);
        
        // 스틸컷 섹션 업데이트
        updateStills(imagesData);

        // 미디어 링크에 영화 ID 추가
        if (elements.mediaLink) {
            elements.mediaLink.href = `media.html?id=${movieId}`;
        }

    } catch (error) {
        console.error('미디어 섹션 초기화 중 오류 발생:', error);
    }
}

// 트레일러 섹션 업데이트
function updateTrailers(videos) {
    const trailersGrid = document.querySelector('.video-grid');
    if (!trailersGrid) return;

    // 트레일러가 없는 경우 오류 상태 표시
    if (!videos || !videos.length) {
        trailersGrid.innerHTML = `
            <div class="media-item video">
                <div class="video-error-state">
                    <svg class="video-error-icon" viewBox="0 0 24 24" width="48" height="48">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <p class="video-error-message">트레일러를 불러올 수 없습니다</p>
                    <p class="video-error-submessage">잠시 후 다시 시도해 주세요</p>
                </div>
            </div>
        `;
        return;
    }

    // 최대 1개의 트레일러만 표시
    const trailer = videos.find(video => video.type === 'Trailer');
    if (trailer) {
        const thumbnailUrl = `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`;
        const videoItem = document.createElement('div');
        videoItem.className = 'media-item video';
        videoItem.innerHTML = `
            <div class="video-content">
                <img src="${thumbnailUrl}" alt="${trailer.name}" class="media-thumbnail">
                <button class="play-button" data-video-id="${trailer.key}">▶</button>
            </div>
        `;

        trailersGrid.appendChild(videoItem);

        // 트레일러 재생 버튼 이벤트 리스너
        const playButton = videoItem.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', () => {
                const videoId = playButton.dataset.videoId;
                openTrailerModal(videoId);
            });
        }
    } else {
        // 트레일러가 없는 경우 오류 상태 표시
        trailersGrid.innerHTML = `
            <div class="media-item video">
                <div class="video-error-state">
                    <svg class="video-error-icon" viewBox="0 0 24 24" width="48" height="48">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <p class="video-error-message">트레일러를 불러올 수 없습니다</p>
                    <p class="video-error-submessage">잠시 후 다시 시도해 주세요</p>
                </div>
            </div>
        `;
    }
}

// 스틸컷 섹션 업데이트
function updateStills(imagesData) {
    const stillsScroll = document.querySelector('.media-stills-scroll');
    if (!stillsScroll) return;

    const images = [...(imagesData.backdrops || []), ...(imagesData.posters || [])]
        .slice(0, 4)
        .map(image => `${TMDB_IMAGE_BASE_URL}/${POSTER_SIZE}${image.file_path}`);

    if (images.length > 0) {
        const fragment = document.createDocumentFragment();
        
        images.forEach(imageUrl => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'media-item image';
            
            const img = document.createElement('img');
            img.dataset.src = imageUrl;
            img.alt = '영화 스틸컷';
            img.className = 'media-image';
            imageObserver.observe(img);

            mediaItem.appendChild(img);
            fragment.appendChild(mediaItem);
        });

        stillsScroll.appendChild(fragment);
    } else {
        // 스틸컷이 없는 경우 오류 상태 표시
        stillsScroll.innerHTML = `
            <div class="media-item image">
                <div class="image-error-state">
                    <svg class="image-error-icon" viewBox="0 0 24 24" width="48" height="48">
                        <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    <p class="image-error-message">이미지를 불러올 수 없습니다</p>
                    <p class="image-error-submessage">잠시 후 다시 시도해 주세요</p>
                </div>
            </div>
        `;
    }
}

// 시리즈 정보 업데이트
function updateSeriesInfo(series) {
    if (!elements.seriesSection) return;

    if (elements.seriesBannerTitle) {
        elements.seriesBannerTitle.textContent = `${series.name} 시리즈에 포함된 작품`;
    }

    if (elements.seriesList) {
        elements.seriesList.textContent = series.movies
            .map(movie => movie.title)
            .join(', ');
    }

    const viewCollectionBtn = elements.seriesSection.querySelector('.btn-view-collection');
    if (viewCollectionBtn) {
        viewCollectionBtn.onclick = () => {
            location.href = `series.html?collection_id=${series.id}`;
        };
    }
}

// 추천 영화 업데이트
function updateRecommendedMovies(data) {
    if (!elements.movieGrid) return;

    // 추천 영화가 없거나 빈 배열인 경우
    if (!data.movies || data.movies.length === 0) {
        elements.movieGrid.innerHTML = '<p class="no-recommendations">추천 영화가 없습니다.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    
    data.movies.forEach(movie => {
        const movieItem = document.createElement('div');
        movieItem.className = 'movie-item';
        movieItem.onclick = () => location.href = `movie-detail.html?id=${movie.id}`;

        const img = document.createElement('img');
        img.dataset.src = movie.poster_path ? 
            `${TMDB_IMAGE_BASE_URL}/${POSTER_SIZE}${movie.poster_path}` : 
            'https://placehold.co/300x450';
        img.alt = movie.title;
        img.className = 'movie-poster';
        imageObserver.observe(img);

        const info = document.createElement('div');
        info.className = 'movie-info';
        info.innerHTML = `
            <h3 class="movie-title">${movie.title}</h3>
            <div class="movie-meta">
                <span class="rating">${movie.adult ? '18' : movie.vote_average >= 7 ? '15' : movie.vote_average >= 5 ? '12' : 'ALL'}</span>
                <span class="score">★ ${movie.vote_average.toFixed(1)}</span>
            </div>
        `;

        movieItem.appendChild(img);
        movieItem.appendChild(info);
        fragment.appendChild(movieItem);
    });

    elements.movieGrid.appendChild(fragment);
}

// 트레일러 모달 관련 함수들
function openTrailerModal(videoId) {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.style.display = 'block';

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = closeTrailerModal;

    window.onclick = (e) => {
        if (e.target === modal) {
            closeTrailerModal();
        }
    };

    window.addEventListener('keydown', escHandler);
}

function closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    
    iframe.src = '';
    modal.style.display = 'none';
    
    window.removeEventListener('keydown', escHandler);
}

function escHandler(e) {
    if (e.key === 'Escape') {
        closeTrailerModal();
    }
}

// API 호출 함수들
async function getMovieDetails(movieId) {
    const [detailsResponse, creditsResponse] = await Promise.all([
        fetch(`${TMDB_API_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=ko-KR`),
        fetch(`${TMDB_API_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=ko-KR`)
    ]);

    if (!detailsResponse.ok || !creditsResponse.ok) {
        throw new Error('영화 정보를 가져오는데 실패했습니다.');
    }

    const [details, credits] = await Promise.all([
        detailsResponse.json(),
        creditsResponse.json()
    ]);

    return {
        ...details,
        cast: credits.cast.slice(0, 10), // 상위 10명의 출연진만 표시
        genres: details.genres.map(genre => genre.name)
    };
}

async function getMovieSeries(movieId) {
    const response = await fetch(`${TMDB_API_BASE_URL}/movie/${movieId}/belongs_to_collection?api_key=${TMDB_API_KEY}&language=ko-KR`);
    
    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    if (!data || !data.id) {
        return null;
    }

    // 컬렉션 상세 정보 가져오기
    const collectionResponse = await fetch(`${TMDB_API_BASE_URL}/collection/${data.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
    if (!collectionResponse.ok) {
        return null;
    }

    const collectionData = await collectionResponse.json();
    return {
        id: collectionData.id,
        name: collectionData.name,
        movies: collectionData.parts.map(movie => ({
            id: movie.id,
            title: movie.title
        }))
    };
}

async function getRecommendedMovies(movieId) {
    const response = await fetch(`${TMDB_API_BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=ko-KR&page=1`);
    
    if (!response.ok) {
        throw new Error('추천 영화를 가져오는데 실패했습니다.');
    }

    const data = await response.json();
    return {
        movies: data.results.slice(0, 6).map(movie => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            adult: movie.adult
        }))
    };
}

async function toggleMovieInteraction(movieId, title, posterPath, type) {
    // 실제 API 구현 시 서버로 요청을 보내야 함
    // 현재는 임시로 성공 응답만 반환
    return { success: true };
}