// API 엔드포인트 기본 URL
const BASE_URL = 'http://localhost:5000/api/movies';
const AUTH_URL = 'http://localhost:5000/api/auth';
const TMDB_API_KEY = 'e79d211004d63ca22d668182dc17ebbb';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 전역 변수 설정
window.BASE_URL = BASE_URL;
window.AUTH_URL = AUTH_URL;

// TMDB API 관련 함수들
async function fetchTMDBNowPlaying() {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=ko-KR&region=KR`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            movies: data.results.map(movie => ({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
                genre_ids: movie.genre_ids,
                rating: movie.adult ? '18' : movie.vote_average >= 7 ? '15' : movie.vote_average >= 5 ? '12' : 'ALL'
            }))
        };
    } catch (error) {
        console.error('TMDB 현재 상영작을 가져오는데 실패했습니다:', error);
        throw error;
    }
}

async function fetchTMDBMovieDetails(movieId) {
    try {
        const [movieResponse, creditsResponse, videosResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=ko-KR`),
            fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=ko-KR`),
            fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=ko-KR`)
        ]);

        if (!movieResponse.ok || !creditsResponse.ok || !videosResponse.ok) {
            throw new Error(`HTTP error! status: ${movieResponse.status}`);
        }

        const [movieData, creditsData, videosData] = await Promise.all([
            movieResponse.json(),
            creditsResponse.json(),
            videosResponse.json()
        ]);

        return {
            id: movieData.id,
            title: movieData.title,
            original_title: movieData.original_title,
            poster_path: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
            backdrop_path: movieData.backdrop_path ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}` : null,
            release_date: movieData.release_date,
            runtime: movieData.runtime,
            vote_average: movieData.vote_average,
            overview: movieData.overview,
            genres: movieData.genres.map(genre => genre.name),
            adult: movieData.adult,
            video_id: videosData.results?.[0]?.key,
            cast: creditsData.cast.slice(0, 10).map(actor => ({
                id: actor.id,
                name: actor.name,
                character: actor.character,
                profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
            })),
            director: creditsData.crew.find(person => person.job === 'Director')
        };
    } catch (error) {
        console.error('TMDB 영화 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 로그인 상태 체크
async function checkLoginStatus() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return false;
        }
        
        const response = await fetch(`${AUTH_URL}/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('로그인 상태 확인 실패:', error);
        return false;
    }
}

// 메인 영화 가져오기
async function getMainMovie() {
    try {
        const response = await fetch(`${BASE_URL}/main-movie`);
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('메인 영화 데이터:', data);
        return data;
    } catch (error) {
        console.error('메인 영화를 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 현재 상영작 가져오기
async function getNowPlaying() {
    try {
        // 먼저 TMDB에서 현재 상영작 데이터를 가져옴
        const tmdbData = await fetchTMDBNowPlaying();
        
        // 백엔드 서버에서 사용자별 좋아요/북마크 정보를 가져옴
        const response = await fetch(`${BASE_URL}/now-playing`);
        if (!response.ok) {
            return tmdbData; // 백엔드 서버 오류시 TMDB 데이터만 반환
        }
        
        const userData = await response.json();
        
        // TMDB 데이터와 사용자 데이터를 합침
        return {
            movies: tmdbData.movies.map(movie => ({
                ...movie,
                isLiked: userData.likedMovies?.includes(movie.id) || false,
                isBookmarked: userData.bookmarkedMovies?.includes(movie.id) || false
            }))
        };
    } catch (error) {
        console.error('현재 상영작을 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 개봉 예정작 가져오기
async function getUpcoming() {
    try {
        const response = await fetch(`${BASE_URL}/upcoming`);
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('개봉 예정작 데이터:', data); // 디버깅용
        return data;
    } catch (error) {
        console.error('개봉 예정작을 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 영화 상세 정보 가져오기
async function getMovieDetails(movieId) {
    try {
        // TMDB에서 영화 상세 정보를 가져옴
        const tmdbData = await fetchTMDBMovieDetails(movieId);
        
        // 백엔드 서버에서 사용자별 정보를 가져옴
        const response = await fetch(`${BASE_URL}/movie/${movieId}`);
        if (!response.ok) {
            return tmdbData; // 백엔드 서버 오류시 TMDB 데이터만 반환
        }
        
        const userData = await response.json();
        
        // TMDB 데이터와 사용자 데이터를 합침
        return {
            ...tmdbData,
            isLiked: userData.isLiked || false,
            isBookmarked: userData.isBookmarked || false,
            userRating: userData.userRating,
            userReview: userData.userReview
        };
    } catch (error) {
        console.error('영화 상세 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 좋아요한 영화 목록 가져오기
async function getLikedMovies() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/liked`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('좋아요한 영화 데이터:', data);
        return data;
    } catch (error) {
        console.error('좋아요한 영화 목록을 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 북마크한 영화 목록 가져오기
async function getBookmarkedMovies() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/bookmarked`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('북마크한 영화 데이터:', data);
        return data;
    } catch (error) {
        console.error('북마크한 영화 목록을 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 영화 좋아요 토글
async function toggleMovieLike(movieId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/like/${movieId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('좋아요 토글 결과:', data);
        return data;
    } catch (error) {
        console.error('영화 좋아요 토글 실패:', error);
        throw error;
    }
}

// 영화 북마크 토글
async function toggleMovieBookmark(movieId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/bookmark/${movieId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('북마크 토글 결과:', data);
        return data;
    } catch (error) {
        console.error('영화 북마크 토글 실패:', error);
        throw error;
    }
}

// 사용자 정보 가져오기
async function getMe() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${AUTH_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('사용자 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 추천 영화 가져오기
async function getRecommendedMovies(movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=ko-KR`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            vote_average: movie.vote_average,
            release_date: movie.release_date
        }));
    } catch (error) {
        console.error('추천 영화를 가져오는데 실패했습니다:', error);
        return [];
    }
} 