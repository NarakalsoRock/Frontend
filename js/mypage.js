document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 토큰 확인
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // 사용자 정보 로드
        const userResponse = await fetch(`${window.AUTH_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!userResponse.ok) {
            throw new Error('사용자 정보를 가져올 수 없습니다.');
        }

        const userData = await userResponse.json();
        if (userData.success && userData.data) {
            displayUserProfile(userData.data);
        } else {
            throw new Error('사용자 데이터가 올바르지 않습니다.');
        }

        // 좋아요한 영화 목록 로드
        const likedResponse = await fetch(`${window.BASE_URL}/liked`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (likedResponse.ok) {
            const likedData = await likedResponse.json();
            if (likedData.movies) {
                displayLikedMovies(likedData.movies);
            }
        }

        // 북마크한 영화 목록 로드
        const bookmarkedResponse = await fetch(`${window.BASE_URL}/bookmarked`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (bookmarkedResponse.ok) {
            const bookmarkedData = await bookmarkedResponse.json();
            if (bookmarkedData.movies) {
                displayBookmarkedMovies(bookmarkedData.movies);
            }
        }
    } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
});

// 사용자 프로필 정보 표시
function displayUserProfile(user) {
    document.getElementById('profileUsername').textContent = user.username || '사용자';
    document.getElementById('profileEmail').textContent = user.email || '';
    
    if (user.createdAt) {
        const createdAt = new Date(user.createdAt);
        const formattedDate = `${createdAt.getFullYear()}.${String(createdAt.getMonth() + 1).padStart(2, '0')}.${String(createdAt.getDate()).padStart(2, '0')}`;
        document.getElementById('profileCreatedAt').textContent = formattedDate;
    } else {
        document.getElementById('profileCreatedAt').textContent = '정보 없음';
    }
}

// 좋아요한 영화 목록 표시
function displayLikedMovies(movies) {
    const container = document.querySelector('.liked-movies .movie-grid');
    if (!container) return;

    container.innerHTML = movies.map(movie => `
        <div class="movie-item" data-movie-id="${movie.id}">
            <div class="poster-container">
                <img src="${movie.poster_path || 'https://placehold.co/180x260'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.onerror=null; this.src='https://placehold.co/180x260';">
            </div>
            <div class="movie-info">
                <div class="movie-header">
                    <span class="title">${movie.title}</span>
                </div>
                <div class="movie-details">
                    <span class="rating">평점 ${movie.vote_average.toFixed(1)}</span>
                    <span class="release-date">${movie.release_date}</span>
                </div>
            </div>
        </div>
    `).join('') || '<div class="no-movies">좋아요한 영화가 없습니다.</div>';
}

// 북마크한 영화 목록 표시
function displayBookmarkedMovies(movies) {
    const container = document.querySelector('.bookmarked-movies .movie-grid');
    if (!container) return;

    container.innerHTML = movies.map(movie => `
        <div class="movie-item" data-movie-id="${movie.id}">
            <div class="poster-container">
                <img src="${movie.poster_path || 'https://placehold.co/180x260'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.onerror=null; this.src='https://placehold.co/180x260';">
            </div>
            <div class="movie-info">
                <div class="movie-header">
                    <span class="title">${movie.title}</span>
                </div>
                <div class="movie-details">
                    <span class="rating">평점 ${movie.vote_average.toFixed(1)}</span>
                    <span class="release-date">${movie.release_date}</span>
                </div>
            </div>
        </div>
    `).join('') || '<div class="no-movies">북마크한 영화가 없습니다.</div>';
}
