// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 메인 영화 로드
        const mainMovie = await getMainMovie();
        if (mainMovie) {
            displayMainMovie(mainMovie);
        }

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

// 메인 영화 표시 함수
function displayMainMovie(movie) {
    // 배경 이미지 설정
    const mainMovieSection = document.querySelector('.main-movie');
    mainMovieSection.style.backgroundImage = `url(${movie.backdrop_path})`;

    // 제목 설정
    document.querySelector('.main-movie-title').textContent = movie.title;

    // 영화 정보 설정
    const movieInfo = document.querySelector('.main-movie-info');
    movieInfo.innerHTML = `
        <span class="movie-rating">평점 ${movie.vote_average.toFixed(1)}</span>
        <span class="movie-runtime">${movie.runtime}분</span>
        <span class="movie-release">${formatDate(movie.release_date)}</span>
    `;

    // 장르 설정
    const genresContainer = document.querySelector('.movie-genres');
    genresContainer.innerHTML = movie.genres
        .map(genre => `<span>${genre}</span>`)
        .join('');

    // 줄거리 설정
    document.querySelector('.main-movie-description').textContent = movie.overview;

    // 감독 정보 설정
    const directorContainer = document.querySelector('.movie-director');
    if (movie.director) {
        directorContainer.textContent = `감독: ${movie.director.name}`;
    }

    // 상세보기 버튼 href 설정
    const detailButton = document.querySelector('.btn-detail');
    detailButton.href = `../html/movie-detail.html?id=${movie.id}`;

    // 예고편 버튼 이벤트 리스너
    const trailerButton = document.querySelector('.btn-trailer');
    trailerButton.onclick = () => openTrailerModal(movie.video_url);
}

// 예고편 모달 열기 함수
function openTrailerModal(videoUrl) {
    if (!videoUrl) {
        alert('예고편 영상이 준비되지 않았습니다.');
        return;
    }

    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    
    // YouTube URL을 임베드 URL로 변환
    const embedUrl = videoUrl.replace('watch?v=', 'embed/');
    iframe.src = embedUrl;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
}

// 예고편 모달 닫기 함수
function closeTrailerModal() {
    const modal = document.getElementById('trailerModal');
    const iframe = modal.querySelector('iframe');
    
    iframe.src = ''; // iframe 소스 초기화
    modal.style.display = 'none';
    document.body.style.overflow = ''; // 배경 스크롤 복구
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeTrailerModal();
    }
});

// 모달 외부 클릭으로 닫기
document.getElementById('trailerModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closeTrailerModal();
    }
});

// 날짜 포맷 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// 현재 상영작 표시 함수
function displayNowPlaying(movies) {
    const container = document.querySelector('.now-playing .movie-grid');
    if (!container) return;

    container.innerHTML = movies.map(movie => {
        console.log('영화 포스터 URL:', movie.poster_path); // 디버깅용
        return `
            <a href="../html/movie-detail.html?id=${movie.id}" class="movie-item">
                <img src="${movie.poster_path || 'https://placehold.co/150x220'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.onerror=null; this.src='https://placehold.co/150x220';">
                <div class="movie-title">${movie.title}</div>
            </a>
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
            <a href="../html/movie-detail.html?id=${movie.id}" class="movie-item">
                <img src="${movie.poster_path || 'https://placehold.co/150x220'}" 
                     alt="${movie.title}" 
                     class="movie-poster"
                     onerror="this.onerror=null; this.src='https://placehold.co/150x220';">
                <div class="movie-title">${movie.title}</div>
            </a>
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