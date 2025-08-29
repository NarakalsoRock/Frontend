// TMDB API 설정
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = 'e79d211004d63ca22d668182dc17ebbb';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // URL에서 컬렉션 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const collectionId = urlParams.get('collection_id');

        if (!collectionId) {
            throw new Error('컬렉션 ID가 없습니다.');
        }

        // TMDB API에서 컬렉션 정보 가져오기
        const response = await fetch(
            `${TMDB_BASE_URL}/collection/${collectionId}?api_key=${TMDB_API_KEY}&language=ko-KR`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const collectionData = await response.json();
        
        // 영화들을 개봉일 순으로 정렬
        const sortedMovies = collectionData.parts.sort((a, b) => {
            return new Date(a.release_date) - new Date(b.release_date);
        });

        // 시리즈 정보 업데이트
        updateSeriesInfo(collectionData, sortedMovies);

    } catch (error) {
        console.error('시리즈 정보 로딩 중 오류 발생:', error);
        showErrorMessage();
    }
});

// 시리즈 정보 업데이트 함수
function updateSeriesInfo(collection, movies) {
    // 메인 타이틀 업데이트
    const mainTitle = document.querySelector('.main-title');
    if (mainTitle) {
        mainTitle.textContent = collection.name;
    }

    // 시리즈 편수 업데이트
    const seriesCount = document.querySelector('.series-count');
    if (seriesCount) {
        seriesCount.textContent = `${movies.length}편`;
    }

    // 시리즈 목록 컨테이너
    const seriesSection = document.querySelector('.series-section');
    if (!seriesSection) return;

    // 각 영화 정보를 HTML로 변환하여 추가
    const moviesHTML = movies.map(movie => `
        <div class="series-item-wrapper">
            <div class="series-poster-container" onclick="location.href='movie-detail.html?id=${movie.id}'">
                <img src="${movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/210x259'}" 
                     alt="${movie.title} 포스터" 
                     class="series-poster" />
            </div>
            <div class="series-detail-container">
                <h3 class="series-detail-title">${movie.title}</h3>
                <p class="series-release-date">${formatDate(movie.release_date)}</p>
                <p class="series-synopsis">
                    ${movie.overview || '등록된 줄거리가 없습니다.'}
                </p>
            </div>
        </div>
    `).join('');

    seriesSection.innerHTML = `
        <div class="series-category-info">
            <h2 class="series-count">${movies.length}편</h2>
        </div>
        ${moviesHTML}
    `;

    // 포스터 클릭 이벤트 리스너 추가
    document.querySelectorAll('.series-poster-container').forEach(container => {
        container.addEventListener('click', function() {
            const movieId = this.getAttribute('data-movie-id');
            if (movieId) {
                location.href = `movie-detail.html?id=${movieId}`;
            }
        });
    });
}

// 에러 메시지 표시 함수
function showErrorMessage() {
    const mainContent = document.querySelector('.series-main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-message">
                <p>죄송합니다. 시리즈 정보를 불러오는 중 오류가 발생했습니다.</p>
                <p>잠시 후 다시 시도해 주세요.</p>
            </div>
        `;
    }
}

// 날짜 포맷 함수
function formatDate(dateString) {
    if (!dateString) return '미정';
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
} 