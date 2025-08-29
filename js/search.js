// URL에서 검색 쿼리 파라미터 가져오기
const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('query');

// DOM 요소
const displayedSearchInput = document.getElementById('displayedSearchQuery');
const searchResultsTitle = document.getElementById('searchResultsTitle');
const movieResultsGrid = document.getElementById('movieResultsGrid');
const paginationContainer = document.querySelector('.pagination-container');

// 현재 페이지 상태
let currentPage = 1;
const itemsPerPage = 20;

// 검색 결과 표시 초기화
function initializeSearch() {
    if (searchQuery) {
        displayedSearchInput.value = searchQuery;
        searchResultsTitle.textContent = `"${searchQuery}" 검색 결과`;
        searchAll(currentPage);
    }
}

// 통합 검색 함수
async function searchAll(page) {
    try {
        movieResultsGrid.innerHTML = '<div class="loading">검색 중...</div>';
        
        // 영화와 사람 동시 검색
        const [movieResponse, personResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=ko-KR&page=${page}`),
            fetch(`${API_BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=ko-KR&page=${page}`)
        ]);

        // API 응답 상태 확인
        if (!movieResponse.ok || !personResponse.ok) {
            throw new Error('API 요청 실패: ' + 
                (movieResponse.status === 401 || personResponse.status === 401 ? 
                'API 키가 유효하지 않습니다.' : '서버 오류가 발생했습니다.'));
        }

        const movieData = await movieResponse.json();
        const personData = await personResponse.json();

        // 검색 결과 합치기
        const combinedResults = [
            ...(movieData.results || []).map(item => ({ ...item, type: 'movie' })),
            ...(personData.results || []).map(item => ({ ...item, type: 'person' }))
        ];

        if (combinedResults.length === 0) {
            movieResultsGrid.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
            paginationContainer.style.display = 'none';
            return;
        }

        displayResults(combinedResults);
        
        // 전체 페이지 수 계산 (영화와 인물 중 더 큰 값 사용)
        const totalPages = Math.max(movieData.total_pages || 0, personData.total_pages || 0);
        updatePagination(totalPages);
    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        movieResultsGrid.innerHTML = `<div class="no-results">검색 중 오류가 발생했습니다.<br>${error.message}</div>`;
        paginationContainer.style.display = 'none';
    }
}

// 검색 결과 표시
function displayResults(results) {
    movieResultsGrid.innerHTML = results.map(item => {
        if (item.type === 'movie') {
            return `
                <div class="movie-item-result">
                    <a href="movie-detail.html?id=${item.id}" class="poster-link">
                        <img src="${item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '../images/no-poster.png'}" 
                             alt="${item.title}" 
                             loading="lazy">
                    </a>
                    <div class="title-result">${item.title}</div>
                    <div class="movie-item-buttons">
                        <button class="like-button" data-movie-id="${item.id}">
                            <span class="heart-icon"></span>
                        </button>
                        <button class="bookmark-button" data-movie-id="${item.id}">
                            <svg class="bookmark-icon" viewBox="0 0 24 24">
                                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                        </button>
                    </div>
                </div>`;
        } else {
            return `
                <div class="movie-item-result">
                    <a href="person-detail.html?id=${item.id}" class="poster-link">
                        <img src="${item.profile_path ? `https://image.tmdb.org/t/p/w500${item.profile_path}` : '../images/no-profile.png'}" 
                             alt="${item.name}" 
                             loading="lazy">
                    </a>
                    <div class="title-result">${item.name}</div>
                    <div class="known-for">${item.known_for_department || '배우'}</div>
                </div>`;
        }
    }).join('');

    // 좋아요/북마크 버튼 이벤트 리스너 추가
    setupMovieItemButtons();
}

// 페이지네이션 업데이트
function updatePagination(totalPages) {
    const maxVisiblePages = Math.min(totalPages, 5);
    
    let paginationHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">이전</button>
        <span class="page-info">${currentPage} / ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">다음</button>
    `;

    paginationContainer.innerHTML = paginationHTML;
    paginationContainer.style.display = 'block';
}

// 페이지 변경
function changePage(newPage) {
    currentPage = newPage;
    searchAll(currentPage);
    window.scrollTo(0, 0);
}

// 좋아요/북마크 버튼 설정
function setupMovieItemButtons() {
    // 좋아요 버튼 이벤트
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            // TODO: 좋아요 상태 저장 로직 구현
        });
    });

    // 북마크 버튼 이벤트
    document.querySelectorAll('.bookmark-button').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            // TODO: 북마크 상태 저장 로직 구현
        });
    });
}

// 페이지 로드 시 검색 초기화
document.addEventListener('DOMContentLoaded', initializeSearch); 