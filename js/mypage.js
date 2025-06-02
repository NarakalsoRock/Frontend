// mypage.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html'; // 실제 로그인 페이지 경로로 수정하세요.
        return;
    }

    // api.js에 BASE_URL 및 AUTH_URL이 정의되어 있다고 가정합니다.
    // 예: window.BASE_URL = 'http://localhost:5000/api';
    // 예: window.AUTH_URL = `${window.BASE_URL}/auth`;
    if (!window.AUTH_URL) {
        console.error('AUTH_URL is not defined. Make sure api.js is loaded and defines window.AUTH_URL.');
        alert('API endpoint configuration error. Please contact support.');
        return;
    }

    try {
        const response = await fetch(`${window.AUTH_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) { // Unauthorized
                localStorage.removeItem('token');
                alert('세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
                window.location.href = 'login.html'; // 실제 로그인 페이지 경로로 수정하세요.
            } else {
                const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }));
                throw new Error(`사용자 정보를 가져오는데 실패했습니다. 상태: ${response.status}, 메시지: ${errorData.error}`);
            }
            return;
        }

        const result = await response.json();

        if (result.success && result.data) {
            displayUserProfile(result.data);
            displayUserStats(result.data);
            displayLikedMovies(result.data.likedMovies || []);
            displayBookmarkedMovies(result.data.bookmarkedMovies || []);
        } else {
            throw new Error(result.error || '사용자 데이터를 가져오는데 실패했습니다.');
        }

    } catch (error) {
        console.error('마이페이지 데이터 로딩 중 오류 발생:', error);
        alert(`오류가 발생했습니다: ${error.message}`);
        // 필요에 따라 추가 오류 처리
    }
});

function displayUserProfile(userData) {
    document.getElementById('profileNickname').textContent = userData.nickname || 'N/A';
    document.getElementById('profileEmail').textContent = userData.email || 'N/A';
    if (userData.createdAt) {
        const createdAtDate = new Date(userData.createdAt);
        document.getElementById('profileCreatedAt').textContent = createdAtDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
        document.getElementById('profileCreatedAt').textContent = 'N/A';
    }
}

function displayUserStats(userData) {
    const likedMoviesCountText = document.getElementById('likedMoviesCountText');
    const bookmarkedMoviesCountText = document.getElementById('bookmarkedMoviesCountText');

    if (likedMoviesCountText) {
        likedMoviesCountText.textContent = userData.likedMoviesCount !== undefined ? userData.likedMoviesCount : 0;
    }
    if (bookmarkedMoviesCountText) {
        bookmarkedMoviesCountText.textContent = userData.bookmarkedMoviesCount !== undefined ? userData.bookmarkedMoviesCount : 0;
    }
}

function displayLikedMovies(movies) {
    const container = document.getElementById('likedMoviesGrid');
    if (!container) {
        console.error('컨테이너 "likedMoviesGrid"를 찾을 수 없습니다.');
        return;
    }
    renderMovieList(container, movies, "좋아요한 영화가 없습니다.");
}

function displayBookmarkedMovies(movies) {
    const container = document.getElementById('bookmarkedMoviesGrid');
    if (!container) {
        console.error('컨테이너 "bookmarkedMoviesGrid"를 찾을 수 없습니다.');
        return;
    }
    renderMovieList(container, movies, "북마크한 영화가 없습니다.");
}

function renderMovieList(container, movies, emptyMessage) {
    container.innerHTML = ''; // Clear previous items

    if (!movies || movies.length === 0) {
        container.innerHTML = `<div class="no-movies">${emptyMessage}</div>`;
        return;
    }

    const posterBaseUrl = 'https://image.tmdb.org/t/p/w185'; // 포스터 이미지 크기 (w185, w342, w500 등)

    movies.forEach(movie => {
        const posterSrc = movie.posterPath ? `${posterBaseUrl}${movie.posterPath}` : 'https://placehold.co/180x260';
        // movie-detail.html?id=${movie.movieId} 부분은 실제 상세 페이지 URL 구조에 맞게 조정해야 할 수 있습니다.
        const movieItemHTML = `
            <div class="movie-item" data-movie-id="${movie.movieId}">
                <div class="poster-container">
                    <a href="movie-detail.html?id=${movie.movieId}">
                        <img src="${posterSrc}" alt="${movie.title}" class="movie-poster" onerror="this.onerror=null;this.src='https://placehold.co/180x260';">
                    </a>
                </div>
                <div class="movie-info">
                    <div class="movie-header">
                        <span class="title">${movie.title}</span>
                    </div>
                    ${movie.addedAt ? `<div class="movie-details"><span class="added-date">추가일: ${new Date(movie.addedAt).toLocaleDateString('ko-KR')}</span></div>` : ''}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', movieItemHTML);
    });
}