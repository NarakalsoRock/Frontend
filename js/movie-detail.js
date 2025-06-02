// API 기본 URL은 movieApi.js에서 가져옵니다

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // URL에서 영화 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        if (!movieId) {
            throw new Error('영화 ID가 없습니다.');
        }

        // 영화 상세 정보와 시리즈 정보를 동시에 가져오기
        const [movieData, seriesData] = await Promise.all([
            getMovieDetails(movieId),
            getMovieSeries(movieId)
        ]);

        // 영화 상세 정보 업데이트
        updateMovieDetails(movieData);
        
        // 시리즈 정보가 있는 경우에만 표시
        if (seriesData) {
            updateSeriesInfo(seriesData);
        } else {
            // 시리즈 정보가 없는 경우 섹션 숨기기
            const seriesSection = document.querySelector('.related-series');
            if (seriesSection) {
                seriesSection.style.display = 'none';
            }
        }

        // 추천 영화 가져오기 및 표시
        const recommendedMovies = await getRecommendedMovies(movieId);
        updateRecommendedMovies(recommendedMovies);

        // 미디어 섹션 초기화
        await initializeMediaSection(movieId);

        // 트레일러 로딩
        await loadTrailer(movieId);

    } catch (error) {
        console.error('영화 상세 정보 로딩 중 오류 발생:', error);
        showErrorMessage();
        showTrailerError();
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

// 시리즈 정보 업데이트 함수
function updateSeriesInfo(series) {
    const seriesSection = document.querySelector('.related-series');
    if (!seriesSection) return;

    const bannerTitle = seriesSection.querySelector('.related-series-banner-title');
    const seriesList = seriesSection.querySelector('.related-series-list');
    const viewCollectionBtn = seriesSection.querySelector('.btn-view-collection');

    if (bannerTitle) {
        bannerTitle.textContent = `${series.name} 시리즈에 포함된 작품`;
    }

    if (seriesList) {
        // 영화 제목들을 쉼표로 구분하여 표시
        seriesList.textContent = series.movies
            .map(movie => movie.title)
            .join(', ');
    }

    if (viewCollectionBtn) {
        viewCollectionBtn.onclick = () => {
            // 시리즈 페이지로 이동하면서 시리즈 ID를 전달
            location.href = `series.html?collection_id=${series.id}`;
        };
    }
}

// 에러 메시지 표시 함수
function showErrorMessage() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-message">
                <p>죄송합니다. 정보를 불러오는 중 오류가 발생했습니다.</p>
                <p>잠시 후 다시 시도해 주세요.</p>
            </div>
        `;
    }
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

// 미디어 섹션 초기화
async function initializeMediaSection(movieId) {
    try {
        // 비디오와 이미지 데이터 동시에 가져오기
        const [videosResponse, imagesResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=ko-KR`),
            fetch(`${TMDB_BASE_URL}/movie/${movieId}/images?api_key=${TMDB_API_KEY}`)
        ]);

        if (!videosResponse.ok || !imagesResponse.ok) {
            throw new Error('미디어 데이터를 가져오는데 실패했습니다.');
        }

        const videosData = await videosResponse.json();
        const imagesData = await imagesResponse.json();

        // 트레일러 섹션 업데이트
        updateTrailers(videosData.results);
        
        // 스틸컷 섹션 업데이트
        updateStills(imagesData);

        // 미디어 링크에 영화 ID 추가
        updateMediaLink(movieId);

    } catch (error) {
        console.error('미디어 섹션 초기화 중 오류 발생:', error);
    }
}

// 트레일러 섹션 업데이트
function updateTrailers(videos) {
    const trailersGrid = document.querySelector('.video-grid');
    if (!trailersGrid || !videos.length) return;

    // 최대 1개의 트레일러만 표시
    const trailer = videos.find(video => video.type === 'Trailer');
    if (trailer) {
        const thumbnailUrl = `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`;
        trailersGrid.innerHTML = `
            <div class="media-item video">
                <img src="${thumbnailUrl}" alt="${trailer.name}" class="media-thumbnail">
                <button class="play-button" data-video-id="${trailer.key}">▶</button>
            </div>
        `;

        // 트레일러 재생 버튼 이벤트 리스너
        const playButton = trailersGrid.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', () => {
                const videoId = playButton.dataset.videoId;
                openTrailerModal(videoId);
            });
        }
    }
}

// 스틸컷 섹션 업데이트
function updateStills(imagesData) {
    const stillsScroll = document.querySelector('.media-stills-scroll');
    if (!stillsScroll) return;

    const images = [...(imagesData.backdrops || []), ...(imagesData.posters || [])]
        .slice(0, 4)
        .map(image => `https://image.tmdb.org/t/p/w500${image.file_path}`);

    if (images.length > 0) {
        stillsScroll.innerHTML = images.map(imageUrl => `
            <div class="media-item image">
                <img src="${imageUrl}" alt="영화 스틸컷" class="media-image">
            </div>
        `).join('');
    }
}

// 미디어 링크 업데이트
function updateMediaLink(movieId) {
    const mediaLink = document.querySelector('.media-link');
    if (mediaLink) {
        mediaLink.href = `media.html?id=${movieId}`;
    }

    const mediaScrollMoreBtn = document.querySelector('.media-scroll-more-btn');
    if (mediaScrollMoreBtn) {
        mediaScrollMoreBtn.onclick = () => location.href = `media.html?id=${movieId}`;
    }
}

// 미디어 탭 전환
document.addEventListener('DOMContentLoaded', () => {
    const mediaTabs = document.querySelectorAll('.media-tab');
    const mediaContents = document.querySelectorAll('.media-content');

    mediaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 활성 탭 변경
            mediaTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 컨텐츠 변경
            const targetId = tab.dataset.tab;
            mediaContents.forEach(content => {
                content.classList.toggle('hidden', content.id !== targetId);
            });
        });
    });

    // URL에서 영화 ID를 가져와서 미디어 섹션 초기화
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    if (movieId) {
        initializeMediaSection(movieId);
    }
});

// 트레일러 관련 함수들
async function loadTrailer(movieId) {
    try {
        // 한국어 트레일러 먼저 시도
        let response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=ko-KR`);
        let data = await response.json();
        
        // 한국어 트레일러가 없으면 영어 트레일러 시도
        if (!data.results || data.results.length === 0) {
            response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
            data = await response.json();
        }

        if (!data.results || data.results.length === 0) {
            throw new Error('사용 가능한 비디오가 없습니다.');
        }

        // 비디오 우선순위: Trailer > Teaser > Clip > Behind the Scenes
        const videoTypes = ['Trailer', 'Teaser', 'Clip', 'Behind the Scenes'];
        let selectedVideo = null;

        for (const type of videoTypes) {
            selectedVideo = data.results.find(video => 
                video.type === type && 
                video.site === 'YouTube' && 
                video.key
            );
            if (selectedVideo) break;
        }

        if (!selectedVideo) {
            throw new Error('재생 가능한 비디오를 찾을 수 없습니다.');
        }

        const videoContainer = document.querySelector('.media-item.video');
        if (!videoContainer) {
            throw new Error('비디오 컨테이너를 찾을 수 없습니다.');
        }

        const videoContent = videoContainer.querySelector('.video-content');
        if (!videoContent) {
            throw new Error('비디오 콘텐츠 요소를 찾을 수 없습니다.');
        }

        // 썸네일 이미지 로드 시도 (고품질 -> 중간 품질 -> 기본 품질)
        const thumbnailImg = videoContent.querySelector('.media-thumbnail');
        if (!thumbnailImg) {
            throw new Error('썸네일 이미지를 찾을 수 없습니다.');
        }

        // 썸네일 로드 함수
        const loadThumbnail = async () => {
            const qualities = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'];
            
            for (const quality of qualities) {
                try {
                    const thumbnailUrl = `https://img.youtube.com/vi/${selectedVideo.key}/${quality}.jpg`;
                    const response = await fetch(thumbnailUrl);
                    
                    if (response.ok) {
                        thumbnailImg.src = thumbnailUrl;
                        return;
                    }
                } catch (error) {
                    console.warn(`${quality} 썸네일 로드 실패:`, error);
                }
            }
            
            // 모든 품질의 썸네일 로드 실패 시 기본 이미지 사용
            thumbnailImg.src = '../assets/images/video-placeholder.jpg';
        };

        await loadThumbnail();

        const playButton = videoContent.querySelector('.play-button');
        if (!playButton) {
            throw new Error('재생 버튼을 찾을 수 없습니다.');
        }

        // 비디오 타입에 따른 아이콘 및 텍스트 설정
        const typeText = {
            'Trailer': '예고편',
            'Teaser': '티저',
            'Clip': '클립',
            'Behind the Scenes': '비하인드'
        };

        // 비디오 정보 표시 추가
        const videoInfo = document.createElement('div');
        videoInfo.className = 'video-info';
        videoInfo.innerHTML = `
            <span class="video-type">${typeText[selectedVideo.type] || selectedVideo.type}</span>
            <span class="video-title">${selectedVideo.name}</span>
        `;
        videoContent.appendChild(videoInfo);

        playButton.addEventListener('click', () => openTrailerModal(selectedVideo.key));
        hideTrailerError();

    } catch (error) {
        console.error('트레일러 로딩 오류:', error);
        showTrailerError();
    }
}

function showTrailerError() {
    try {
        const videoContainer = document.querySelector('.media-item.video');
        if (!videoContainer) {
            console.error('비디오 컨테이너를 찾을 수 없습니다.');
            return;
        }

        const errorState = videoContainer.querySelector('.video-error-state');
        const videoContent = videoContainer.querySelector('.video-content');

        if (!errorState || !videoContent) {
            console.error('오류 상태 또는 비디오 콘텐츠 요소를 찾을 수 없습니다.');
            return;
        }
        
        errorState.classList.remove('hidden');
        videoContent.classList.add('hidden');
    } catch (error) {
        console.error('트레일러 오류 표시 중 문제 발생:', error);
    }
}

function hideTrailerError() {
    try {
        const videoContainer = document.querySelector('.media-item.video');
        if (!videoContainer) {
            console.error('비디오 컨테이너를 찾을 수 없습니다.');
            return;
        }

        const errorState = videoContainer.querySelector('.video-error-state');
        const videoContent = videoContainer.querySelector('.video-content');

        if (!errorState || !videoContent) {
            console.error('오류 상태 또는 비디오 콘텐츠 요소를 찾을 수 없습니다.');
            return;
        }
        
        errorState.classList.add('hidden');
        videoContent.classList.remove('hidden');
    } catch (error) {
        console.error('트레일러 오류 숨기기 중 문제 발생:', error);
    }
}

function openTrailerModal(videoKey) {
    try {
    const modal = document.getElementById('trailerModal');
        if (!modal) {
            console.error('트레일러 모달을 찾을 수 없습니다.');
            return;
        }

    const iframe = modal.querySelector('iframe');
        if (!iframe) {
            console.error('트레일러 iframe을 찾을 수 없습니다.');
            return;
        }

        iframe.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1`;
        modal.classList.add('active');
        
        // 모달 닫기 이벤트
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.onclick = closeTrailerModal;
        }
        
        // 모달 외부 클릭시 닫기
        modal.onclick = (e) => {
            if (e.target === modal) closeTrailerModal();
        };
        
        // ESC 키로 닫기
        const escHandler = (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeTrailerModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    } catch (error) {
        console.error('트레일러 모달 열기 중 오류 발생:', error);
    }
}

function closeTrailerModal() {
    try {
        const modal = document.getElementById('trailerModal');
        if (!modal) {
            console.error('트레일러 모달을 찾을 수 없습니다.');
            return;
        }

        const iframe = modal.querySelector('iframe');
        if (!iframe) {
            console.error('트레일러 iframe을 찾을 수 없습니다.');
            return;
        }
        
        iframe.src = '';
        modal.classList.remove('active');
    } catch (error) {
        console.error('트레일러 모달 닫기 중 오류 발생:', error);
    }
}