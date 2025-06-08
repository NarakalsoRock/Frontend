// TMDB API 설정
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = 'e79d211004d63ca22d668182dc17ebbb';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // URL에서 영화 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');

        if (!movieId) {
            throw new Error('영화 ID가 없습니다.');
        }

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

        // 비디오 데이터 처리 및 표시
        displayVideos(videosData.results);
        
        // 이미지 데이터 처리 및 표시
        displayImages(imagesData);

    } catch (error) {
        console.error('미디어 로딩 중 오류 발생:', error);
        showErrorMessage();
    }
});

// 비디오 표시 함수
function displayVideos(videos) {
    const videoGrid = document.querySelector('.video-grid');
    if (!videoGrid) return;

    // 트레일러가 없거나 비디오 데이터가 없는 경우
    if (!videos || videos.length === 0) {
        videoGrid.innerHTML = `
            <div class="video-error-message">
                <svg class="video-error-icon" viewBox="0 0 24 24" width="48" height="48">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <p>등록된 트레일러가 없습니다.</p>
            </div>
        `;
        return;
    }

    // 최대 2개의 트레일러만 표시
    const trailers = videos
        .filter(video => video.type === 'Trailer')
        .slice(0, 2);

    // 트레일러가 없는 경우
    if (trailers.length === 0) {
        videoGrid.innerHTML = `
            <div class="video-error-message">
                <svg class="video-error-icon" viewBox="0 0 24 24" width="48" height="48">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <p>등록된 트레일러가 없습니다.</p>
            </div>
        `;
        return;
    }

    // 트레일러 표시
    videoGrid.innerHTML = trailers.map(video => {
        const thumbnailUrl = `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`;
        return `
            <div class="video-item">
                <div class="video-thumbnail-container">
                    <img src="${thumbnailUrl}" 
                         alt="${video.name}" 
                         class="video-thumbnail"
                         onerror="this.src='../assets/images/video-placeholder.jpg'">
                    <button class="play-button" data-video-id="${video.key}">
                        <svg viewBox="0 0 24 24" width="48" height="48">
                            <path fill="currentColor" d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.name}</h3>
                    <p class="video-type">${video.type}</p>
                </div>
            </div>
        `;
    }).join('');

    // 트레일러 재생 버튼 이벤트 리스너
    const playButtons = videoGrid.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            const videoId = button.dataset.videoId;
            try {
                openTrailerModal(videoId);
            } catch (error) {
                console.error('트레일러 재생 중 오류 발생:', error);
                showVideoError(button.closest('.video-item'));
            }
        });
    });
}

// 트레일러 모달 열기 함수
function openTrailerModal(videoId) {
    // 기존 모달이 있다면 제거
    let modal = document.querySelector('.trailer-modal');
    if (modal) {
        modal.remove();
    }

    // 새 모달 생성
    modal = document.createElement('div');
    modal.className = 'trailer-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <div class="video-container">
                <iframe
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                ></iframe>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 모달 닫기 이벤트
    const closeButton = modal.querySelector('.modal-close');
    closeButton.addEventListener('click', () => {
        modal.remove();
    });

    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.querySelector('.trailer-modal')) {
            modal.remove();
        }
    });
}

// 비디오 에러 표시 함수
function showVideoError(videoItem) {
    if (!videoItem) return;
    
    videoItem.innerHTML = `
        <div class="video-error-message">
            <svg class="video-error-icon" viewBox="0 0 24 24" width="48" height="48">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>트레일러를 재생할 수 없습니다.</p>
            <p>잠시 후 다시 시도해 주세요.</p>
        </div>
    `;
}

// 이미지 표시 함수
function displayImages(imagesData) {
    const posters = imagesData.posters || [];
    const backdrops = imagesData.backdrops || [];
    
    // 포스터와 스틸컷을 합치고 최대 10개만 선택
    const allImages = [...posters, ...backdrops]
        .slice(0, 10)
        .map(image => `https://image.tmdb.org/t/p/w500${image.file_path}`);

    // 이미지 표시
    allImages.forEach((imageUrl, index) => {
        const posterItem = document.querySelector(`.poster-item-${index + 1}`);
        if (posterItem) {
            posterItem.style.backgroundImage = `url(${imageUrl})`;
            posterItem.style.backgroundSize = 'cover';
            posterItem.style.backgroundPosition = 'center';
            posterItem.style.cursor = 'pointer';
            
            // 클릭 시 원본 이미지 보기
            posterItem.addEventListener('click', () => {
                window.open(imageUrl.replace('/w500/', '/original/'), '_blank');
            });
        }
    });
}

// 에러 메시지 표시 함수
function showErrorMessage() {
    const container = document.querySelector('.media-page-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message" style="text-align: center; color: white; padding: 20px;">
                <p>죄송합니다. 미디어를 불러오는 중 오류가 발생했습니다.</p>
                <p>잠시 후 다시 시도해 주세요.</p>
            </div>
        `;
    }
} 