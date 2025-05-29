// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 현재 상영작 로드
        const response = await getNowPlaying();
        console.log('받아온 현재 상영작:', response); // 디버깅용
        if (response && response.movies) {
            displayNowPlaying(response.movies);
        }

        // 개봉 예정작 로드
        const upcomingResponse = await getUpcoming();
        console.log('받아온 개봉 예정작:', upcomingResponse); // 디버깅용
        if (upcomingResponse && upcomingResponse.movies) {
            displayUpcoming(upcomingResponse.movies);
        }
    } catch (error) {
        console.error('데이터 로딩 중 오류 발생:', error);
    }
});

// 현재 상영작 표시 함수
function displayNowPlaying(movies) {
    const container = document.querySelector('.now-playing .movie-grid');
    if (!container) return;

    container.innerHTML = movies.map(movie => {
        console.log('영화 포스터 URL:', movie.poster_path); // 디버깅용
        return `
            <div class="movie-item" data-movie-id="${movie.id}">
                <img src="${movie.poster_path || 'https://placehold.co/150x220'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.onerror=null; this.src='https://placehold.co/150x220';">
                <div class="movie-title">${movie.title}</div>
            </div>
        `;
    }).join('');
}

// 개봉 예정작 표시 함수
function displayUpcoming(movies) {
    const container = document.querySelector('.coming-soon .movie-grid');
    if (!container) return;

    container.innerHTML = movies.map(movie => {
        console.log('영화 포스터 URL:', movie.poster_path); // 디버깅용
        return `
            <div class="movie-item" data-movie-id="${movie.id}">
                <img src="${movie.poster_path || 'https://placehold.co/150x220'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.onerror=null; this.src='https://placehold.co/150x220';">
                <div class="movie-title">${movie.title}</div>
            </div>
        `;
    }).join('');
}

// 영화 클릭 이벤트 처리
document.addEventListener('click', async (e) => {
    const movieItem = e.target.closest('.movie-item');
    if (movieItem) {
        const movieId = movieItem.dataset.movieId;
        try {
            const movieDetails = await getMovieDetails(movieId);
            console.log('영화 상세 정보:', movieDetails);
            // TODO: 영화 상세 정보 모달 표시
        } catch (error) {
            console.error('영화 상세 정보 로딩 실패:', error);
        }
    }
}); 