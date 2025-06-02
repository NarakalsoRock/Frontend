// mypage.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token'); //
    if (!token) {
        alert('로그인이 필요합니다.'); //
        window.location.href = 'login.html'; // 실제 로그인 페이지 경로로 수정하세요.
        return;
    }

    if (!window.AUTH_URL) { //
        console.error('AUTH_URL is not defined. Make sure api.js is loaded and defines window.AUTH_URL.'); //
        alert('API endpoint configuration error. Please contact support.'); //
        return;
    }

    try {
        const response = await fetch(`${window.AUTH_URL}/me`, { //
            method: 'GET', //
            headers: {
                'Authorization': `Bearer ${token}`, //
                'Content-Type': 'application/json' //
            }
        });

        if (!response.ok) { //
            if (response.status === 401) { // Unauthorized
                localStorage.removeItem('token'); //
                alert('세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.'); //
                window.location.href = 'login.html'; // 실제 로그인 페이지 경로로 수정하세요.
            } else {
                const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' })); //
                throw new Error(`사용자 정보를 가져오는데 실패했습니다. 상태: ${response.status}, 메시지: ${errorData.error}`); //
            }
            return;
        }

        const result = await response.json(); //

        if (result.success && result.data) { //
            displayUserProfile(result.data); //
            displayUserStats(result.data); // 통계 (총 개수) 표시
            renderLikedMoviesChart(result.data.likedMovies || []); // 좋아요 차트 렌더링
            renderBookmarkedMoviesChart(result.data.bookmarkedMovies || []); // 북마크 차트 렌더링 추가
            displayLikedMovies(result.data.likedMovies || []); //
            displayBookmarkedMovies(result.data.bookmarkedMovies || []); //
        } else {
            throw new Error(result.error || '사용자 데이터를 가져오는데 실패했습니다.'); //
        }

    } catch (error) {
        console.error('마이페이지 데이터 로딩 중 오류 발생:', error); //
        alert(`오류가 발생했습니다: ${error.message}`);
    }
});

function displayUserProfile(userData) {
    document.getElementById('profileNickname').textContent = userData.nickname || 'N/A'; //
    document.getElementById('profileEmail').textContent = userData.email || 'N/A'; //
    if (userData.createdAt) { //
        const createdAtDate = new Date(userData.createdAt); //
        document.getElementById('profileCreatedAt').textContent = createdAtDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }); //
    } else {
        document.getElementById('profileCreatedAt').textContent = 'N/A'; //
    }
}

function displayUserStats(userData) {
    const totalLikedMoviesCountText = document.getElementById('totalLikedMoviesCountText');
    const totalBookmarkedMoviesCountText = document.getElementById('totalBookmarkedMoviesCountText'); // ID 변경 반영

    if (totalLikedMoviesCountText) {
        totalLikedMoviesCountText.textContent = userData.likedMoviesCount !== undefined ? userData.likedMoviesCount : 0;
    }
    if (totalBookmarkedMoviesCountText) { //
        totalBookmarkedMoviesCountText.textContent = userData.bookmarkedMoviesCount !== undefined ? userData.bookmarkedMoviesCount : 0;
    }
}

// 공통 차트 렌더링 함수
function renderGenericChart(canvasId, movies, label, borderColor, backgroundColor) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
        console.error(`Chart canvas element (${canvasId}) not found.`);
        return null;
    }

    const itemsByDate = {};
    if (movies && movies.length > 0) {
        movies.forEach(movie => {
            if (movie.addedAt) {
                const date = new Date(movie.addedAt).toISOString().split('T')[0];
                itemsByDate[date] = (itemsByDate[date] || 0) + 1;
            }
        });
    }

    const sortedDates = Object.keys(itemsByDate).sort((a, b) => new Date(a) - new Date(b));
    const chartLabels = sortedDates;
    const chartDataValues = sortedDates.map(date => itemsByDate[date]);

    // 기존 차트 인스턴스 확인 및 파괴 (window 객체에 저장된 차트 변수명 사용)
    const chartVarName = canvasId === 'likedMoviesChart' ? 'myLikedMoviesLineChart' : 'myBookmarkedMoviesLineChart';
    if (window[chartVarName] instanceof Chart) {
        window[chartVarName].destroy();
    }

    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: label,
                data: chartDataValues,
                fill: false,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'yyyy-MM-dd',
                        displayFormats: { day: 'MM-dd' }
                    },
                    title: { display: true, text: '날짜', color: '#fff' },
                    ticks: { color: '#ccc', maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '개수', color: '#fff' },
                    ticks: { stepSize: 1, color: '#ccc' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#fff' } },
                tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff' }
            }
        }
    });
    window[chartVarName] = newChart; // 새 차트 인스턴스를 window 객체에 저장
}


function renderLikedMoviesChart(likedMovies) {
    renderGenericChart('likedMoviesChart', likedMovies, '일별 좋아요 수', 'rgb(103, 58, 183)', 'rgba(103, 58, 183, 0.5)');
}

function renderBookmarkedMoviesChart(bookmarkedMovies) {
    renderGenericChart('bookmarkedMoviesChart', bookmarkedMovies, '일별 북마크 수', 'rgb(255, 159, 64)', 'rgba(255, 159, 64, 0.5)'); // 다른 색상 적용
}


function displayLikedMovies(movies) {
    const container = document.getElementById('likedMoviesGrid'); //
    if (!container) { //
        console.error('컨테이너 "likedMoviesGrid"를 찾을 수 없습니다.'); //
        return;
    }
    renderMovieList(container, movies, "좋아요한 영화가 없습니다."); //
}

function displayBookmarkedMovies(movies) {
    const container = document.getElementById('bookmarkedMoviesGrid'); //
    if (!container) { //
        console.error('컨테이너 "bookmarkedMoviesGrid"를 찾을 수 없습니다.'); //
        return;
    }
    renderMovieList(container, movies, "북마크한 영화가 없습니다."); //
}

function renderMovieList(container, movies, emptyMessage) {
    container.innerHTML = ''; // Clear previous items

    if (!movies || movies.length === 0) { //
        container.innerHTML = `<div class="no-movies">${emptyMessage}</div>`; //
        return;
    }

    const posterBaseUrl = 'https://image.tmdb.org/t/p/w185'; //

    movies.forEach(movie => { //
        const posterSrc = movie.posterPath ? `${posterBaseUrl}${movie.posterPath}` : 'https://placehold.co/180x260'; //
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
        `; //
        container.insertAdjacentHTML('beforeend', movieItemHTML); //
    });
}