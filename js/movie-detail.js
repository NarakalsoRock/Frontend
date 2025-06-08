// 예고편 모달 열기
function openTrailerModal(videoId) {
    const modal = document.getElementById('trailerModal');
    if (!modal || !videoId) return;

    const iframe = modal.querySelector('iframe');
    if (!iframe) return;

    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.classList.add('active'); // CSS 클래스로 제어
}

// 예고편 모달 닫기
function closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    if (!modal) return;

    const iframe = modal.querySelector('iframe');
    if (iframe) {
        iframe.src = ''; // 비디오 재생 중지
    }
    modal.classList.remove('active'); // CSS 클래스로 제어
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const rawMovieId = urlParams.get('id');

        if (!rawMovieId) {
            throw new Error('영화 ID가 없습니다.');
        }
        const movieId = rawMovieId.replace(/[^0-9]/g, '');
        if (!movieId) {
            throw new Error('유효하지 않은 영화 ID입니다.');
        }

        const [movieData, seriesData, recommendedMovies] = await Promise.all([
            getMovieDetails(movieId),
            getMovieSeries(movieId),
            getRecommendedMovies(movieId)
        ]);

        updateMovieDetails(movieData);
        updateRecommendedMovies(recommendedMovies);

        if (seriesData) {
            updateSeriesInfo(seriesData);
        } else {
            const seriesSection = document.querySelector('.related-series');
            if (seriesSection) seriesSection.style.display = 'none';
        }

        await initializeMediaSection(movieId);
        setupModalListeners();

    } catch (error) {
        console.error('영화 상세 정보 로딩 중 오류 발생:', error);
        showErrorMessage();
    }
});

// 모달 이벤트 리스너 설정 (한 번만 실행)
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

// 영화 상세 정보 업데이트
function updateMovieDetails(movie) {
    document.title = `CineX - ${movie.title}`;
    
    const posterImg = document.querySelector('.movie-poster');
    if (posterImg) {
        posterImg.src = movie.poster_path || 'https://placehold.co/380x540';
        posterImg.alt = movie.title;
    }

    const titleElement = document.querySelector('.movie-title');
    if (titleElement) {
        titleElement.textContent = movie.title;
    }

    const metaElement = document.querySelector('.movie-meta');
    if (metaElement) {
        metaElement.innerHTML = `
            <span class="rating">${movie.adult ? '18' : movie.vote_average >= 7 ? '15' : movie.vote_average >= 5 ? '12' : 'ALL'}</span>
            <span class="release-date">${movie.release_date || ''}</span>
            <span class="score">★ ${movie.vote_average.toFixed(1)}</span>
            <span class="duration">${movie.runtime ? movie.runtime + '분' : ''}</span>
            <span class="genre">${movie.genres ? movie.genres.join(', ') : ''}</span>
        `;
    }

    const synopsisText = document.querySelector('.synopsis-text');
    if (synopsisText) {
        synopsisText.textContent = movie.overview || '등록된 줄거리가 없습니다.';
    }

    const creditsScroll = document.querySelector('.credits-scroll');
    if (creditsScroll) {
        if (movie.cast && movie.cast.length > 0) {
            creditsScroll.innerHTML = movie.cast.map(actor => `
                <a href="person-detail.html?id=${actor.id}" class="credit-item">
                    <img src="${actor.profile_path || 'https://placehold.co/150x150'}" alt="${actor.name}" class="credit-image">
                    <div class="credit-info"><p class="credit-name">${actor.name}</p></div>
                </a>
            `).join('');
        } else {
            creditsScroll.innerHTML = '<p>출연진 정보가 없습니다.</p>';
        }
    }
    
    // 버튼 이벤트 리스너 설정
    const likeButton = document.querySelector('.btn-like');
    if (likeButton) {
        likeButton.classList.toggle('active', movie.isLiked);
        likeButton.onclick = async () => {
            const result = await toggleMovieLike(movie.id, movie.title, movie.poster_path);
            if (result && result.success) likeButton.classList.toggle('active');
        };
    }

    const bookmarkButton = document.querySelector('.btn-bookmark');
    if (bookmarkButton) {
        bookmarkButton.classList.toggle('active', movie.isBookmarked);
        bookmarkButton.onclick = async () => {
            const result = await toggleMovieBookmark(movie.id, movie.title, movie.poster_path);
            if (result && result.success) bookmarkButton.classList.toggle('active');
        };
    }

    const trailerBtn = document.querySelector('.btn-trailer');
    if (trailerBtn) {
        trailerBtn.onclick = () => {
            if (movie.video_id) {
                openTrailerModal(movie.video_id);
            } else {
                alert('이 영화의 예고편을 찾을 수 없습니다.');
            }
        };
    }
}

// 시리즈 정보 업데이트
function updateSeriesInfo(series) {
    const seriesSection = document.querySelector('.related-series');
    if (!seriesSection) return;

    const bannerTitle = seriesSection.querySelector('.related-series-banner-title');
    const seriesList = seriesSection.querySelector('.related-series-list');
    const viewCollectionBtn = seriesSection.querySelector('.btn-view-collection');

    if (bannerTitle) bannerTitle.textContent = `${series.name} 시리즈에 포함된 작품`;
    if (seriesList) seriesList.textContent = series.movies.map(movie => movie.title).join(', ');
    if (viewCollectionBtn) viewCollectionBtn.onclick = () => location.href = `series.html?collection_id=${series.id}`;
}

// 에러 메시지 표시
function showErrorMessage() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `<div class="error-message" style="text-align:center; padding: 40px;"><p>죄송합니다. 정보를 불러오는 중 오류가 발생했습니다.</p></div>`;
    }
}

// 추천 영화 업데이트
function updateRecommendedMovies(movies) {
    const recommendedGrid = document.querySelector('.recommended-movies .movie-grid');
    if (!recommendedGrid) return;
    
    if (movies && movies.length > 0) {
        recommendedGrid.innerHTML = movies.map(movie => `
            <a href="movie-detail.html?id=${movie.id}" class="movie-item">
                <img src="${movie.poster_path || 'https://placehold.co/150x220'}" alt="${movie.title}" class="movie-poster">
                <div class="movie-info"><div class="movie-title">${movie.title}</div><div class="release-date">${formatDate(movie.release_date)}</div></div>
            </a>
        `).join('');
    } else {
        recommendedGrid.innerHTML = '<p class="no-recommendations">추천 영화가 없습니다.</p>';
    }
}

// 날짜 포맷
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
        updateStills(imagesData);
        updateMediaLink(movieId);

    } catch (error) {
        console.error('미디어 섹션 초기화 중 오류 발생:', error);
        document.querySelector('#trailers').innerHTML = '<p>동영상 정보를 불러오지 못했습니다.</p>';
        document.querySelector('#stills').innerHTML = '<p>이미지 정보를 불러오지 못했습니다.</p>';
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
function updateStills(imagesData) {
    const stillsScroll = document.querySelector('.media-stills-scroll');
    if (!stillsScroll) return;

    const images = [...(imagesData.backdrops || []), ...(imagesData.posters || [])].slice(0, 5);

    if (images.length > 0) {
        stillsScroll.innerHTML = images.map(image => `
            <div class="media-item image">
                <img src="https://image.tmdb.org/t/p/w500${image.file_path}" alt="영화 스틸컷" class="media-image">
            </div>
        `).join('');
    } else {
        stillsScroll.innerHTML = '<p>사용 가능한 이미지가 없습니다.</p>';
    }
}

// 미디어 페이지 링크 업데이트
function updateMediaLink(movieId) {
    const mediaLink = document.querySelector('.media-link');
    if (mediaLink) mediaLink.href = `media.html?id=${movieId}`;

    const mediaScrollMoreBtn = document.querySelector('.media-scroll-more-btn');
    if (mediaScrollMoreBtn) mediaScrollMoreBtn.onclick = () => location.href = `media.html?id=${movieId}`;
}

// 미디어 탭 기능
document.addEventListener('DOMContentLoaded', () => {
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
});