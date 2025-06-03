// API 엔드포인트 기본 URL
const APP_BASE_URL = 'http://localhost:5000';
window.BASE_API_URL = `${APP_BASE_URL}/api`;

// API 엔드포인트 설정
window.MOVIES_API_URL = `${window.BASE_API_URL}/movies`;
window.AUTH_URL = `${window.BASE_API_URL}/auth`;
window.ACTIONS_URL = `${window.BASE_API_URL}/actions`;

const TMDB_API_KEY = 'e79d211004d63ca22d668182dc17ebbb';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// 전역 변수 설정
window.BASE_URL = `${APP_BASE_URL}/api/movies`;
window.AUTH_URL = `${APP_BASE_URL}/api/auth`;

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

// 토큰 검증 함수
async function validateToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }

    try {
        const response = await fetch(`${window.AUTH_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                // 현재 페이지가 로그인이 필요한 페이지인 경우에만 리다이렉트
                if (window.location.pathname.includes('mypage.html')) {
                    localStorage.setItem('redirectAfterLogin', 'mypage.html');
                    window.location.href = 'login.html';
                }
            }
            return false;
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('토큰 검증 실패:', error);
        return false;
    }
}

// 로그인 상태 체크 (페이지 로드 시 자동 실행)
async function checkLoginStatus() {
    const isValid = await validateToken();
    if (!isValid && window.location.pathname.includes('mypage.html')) {
        localStorage.setItem('redirectAfterLogin', 'mypage.html');
        window.location.href = 'login.html';
    }
    return isValid;
}

// 페이지 로드 시 토큰 검증 실행
document.addEventListener('DOMContentLoaded', checkLoginStatus);

window.checkLoginStatus = checkLoginStatus;
window.validateToken = validateToken;

// 메인 영화 가져오기
async function getMainMovie() {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/main-movie`);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        const data = await response.json();
        console.log('메인 영화 데이터:', data);
        return data;
    } catch (error) {
        console.error('메인 영화를 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getMainMovie = getMainMovie;

// 현재 상영작 가져오기
async function getNowPlaying(page = 1) {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/now-playing?page=${page}`);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        const data = await response.json();
        console.log('현재 상영작 데이터:', data);
        return data;
    } catch (error) {
        console.error('현재 상영작을 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getNowPlaying = getNowPlaying;

// 개봉 예정작 가져오기
async function getUpcoming(page = 1) {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/upcoming?page=${page}`);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        const data = await response.json();
        console.log('개봉 예정작 데이터:', data);
        return data;
    } catch (error) {
        console.error('개봉 예정작을 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getUpcoming = getUpcoming;

// 영화 상세 정보 가져오기
async function getMovieDetails(movieId) {
    try {
        // TMDB에서 영화 상세 정보를 가져옴 (이 안에 vote_average 등이 포함됨)
        const tmdbData = await fetchTMDBMovieDetails(movieId);

        // 백엔드 서버에서 사용자별 좋아요/북마크 정보를 가져오기 시도
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        let isLikedFromServer = false;
        let isBookmarkedFromServer = false;

        if (token) { // 토큰이 있을 때만 사용자 정보를 요청
            try {
                // movieId를 문자열로 변환하고 URL에서 특수문자 제거
                const cleanMovieId = String(movieId).replace(/[^0-9]/g, '');
                
                const response = await fetch(`${window.MOVIES_API_URL}/${cleanMovieId}`, {
                    headers: headers
                });

                if (response.ok) {
                    const backendMovieData = await response.json();
                    isLikedFromServer = backendMovieData.isLiked || false;
                    isBookmarkedFromServer = backendMovieData.isBookmarked || false;
                }
            } catch (error) {
                // 오류 발생 시 기본값 사용
            }
        }

        // 최종적으로 TMDB 데이터와 서버에서 받은 (또는 기본값) 좋아요/북마크 상태를 합쳐서 반환
        return {
            ...tmdbData,
            isLiked: isLikedFromServer,
            isBookmarked: isBookmarkedFromServer
        };

    } catch (error) {
        throw error;
    }
}
window.getMovieDetails = getMovieDetails;

// 영화 검색
window.searchMovies = async function(query, page = 1) {
    console.log(`api.js: searchMovies 호출됨 - query: "${query}", page: ${page}`);
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/search?query=${encodeURIComponent(query)}&page=${page}`);
        console.log(`api.js: search API 요청 URL: ${response.url}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Search API response not OK:", response.status, errorText);
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `영화 검색 실패: ${response.status}`);
            } catch (e) {
                throw new Error(errorText || `영화 검색 실패: ${response.status}`);
            }
        }
        const data = await response.json();
        console.log('api.js: search API 응답 데이터:', data);

        if (data.results && !data.movies) {
            console.log('api.js: TMDB results를 movies로 변환 중');
            return {
                movies: data.results,
                page: data.page,
                total_pages: data.total_pages,
                total_results: data.total_results
            };
        }
        return data;
    } catch (error) {
        console.error("Error in searchMovies API call (api.js catch):", error);
        return { movies: [], page: 1, total_pages: 1, error: error.message || "검색 중 오류 발생" };
    }
};

// 사용자 정보 가져오기
async function getMe() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('사용자 토큰이 없습니다. 로그인이 필요합니다.');
        return null;
    }
    try {
        const response = await fetch(`${window.AUTH_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                alert('세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
                window.location.href = 'login.html';
            }
            const errorData = await response.json().catch(() => ({ error: `서버 응답 오류: ${response.status}` }));
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('사용자 정보를 가져오는데 실패했습니다:', error);
        return null;
    }
}
window.getMe = getMe;

// 영화 좋아요/북마크 토글 공통 함수
async function toggleMovieInteraction(movieId, title, posterPath, type) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return null;
    }

    const endpoint = type === 'like'
        ? `${window.ACTIONS_URL}/movies/like`
        : `${window.ACTIONS_URL}/movies/bookmark`;
    const interactionTypeDisplay = type === 'like' ? '좋아요' : '북마크';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                movieId: String(movieId),
                title: title,
                posterPath: posterPath
            })
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error(`${interactionTypeDisplay} 요청 실패:`, response.status, responseData);
            alert(`${interactionTypeDisplay} 처리 중 오류: ${responseData.error || responseData.message || '알 수 없는 오류가 발생했습니다.'}`);
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
            return null;
        }
        
        return responseData;
    } catch (error) {
        console.error(`${interactionTypeDisplay} API 호출 중 네트워크 또는 JSON 파싱 오류:`, error);
        alert(`${interactionTypeDisplay} 처리 중 네트워크 오류가 발생했습니다.`);
        return null;
    }
}

// 영화 좋아요 토글
window.toggleMovieLike = async function(movieId, title, posterPath) {
    return await toggleMovieInteraction(movieId, title, posterPath, 'like');
};

// 영화 북마크 토글
window.toggleMovieBookmark = async function(movieId, title, posterPath) {
    return await toggleMovieInteraction(movieId, title, posterPath, 'bookmark');
};

// 좋아요한 영화 목록 가져오기
async function getLikedMovies() {
    const token = localStorage.getItem('token');
    if (!token) { console.warn('Token not found for getLikedMovies'); return null; }
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/liked`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('좋아요한 영화 데이터 (별도호출 시):', data);
        return data;
    } catch (error) {
        console.error('좋아요한 영화 목록을 가져오는데 실패했습니다 (별도호출 시):', error);
        return { movies: [] };
    }
}
window.getLikedMovies = getLikedMovies;

// 북마크한 영화 목록 가져오기
async function getBookmarkedMovies() {
    const token = localStorage.getItem('token');
    if (!token) { console.warn('Token not found for getBookmarkedMovies'); return null; }
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/bookmarked`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('북마크한 영화 데이터 (별도호출 시):', data);
        return data;
    } catch (error) {
        console.error('북마크한 영화 목록을 가져오는데 실패했습니다 (별도호출 시):', error);
        return { movies: [] };
    }
}
window.getBookmarkedMovies = getBookmarkedMovies;

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

// 인물 상세 정보 가져오기
async function getPersonDetails(personId) {
    try {
        // 한국어 데이터, 외부 링크 데이터, 출연작 정보를 동시에 가져오기
        const [korResponse, externalResponse, creditsResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=ko-KR`),
            fetch(`${TMDB_BASE_URL}/person/${personId}/external_ids?api_key=${TMDB_API_KEY}`),
            fetch(`${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}&language=ko-KR`)
        ]);
        
        if (!korResponse.ok) {
            throw new Error(`HTTP error! status: ${korResponse.status}`);
        }

        const korData = await korResponse.json();
        const externalData = externalResponse.ok ? await externalResponse.json() : {};
        const creditsData = creditsResponse.ok ? await creditsResponse.json() : { cast: [], crew: [] };

        // 한국어 약력이 없는 경우에만 영어 데이터 가져오기
        if (!korData.biography) {
            const engResponse = await fetch(
                `${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=en-US`
            );
            
            if (engResponse.ok) {
                const engData = await engResponse.json();
                korData.biography = engData.biography;
            }
        }

        // 외부 링크 데이터 추가
        const externalLinks = {
            instagram_id: externalData.instagram_id ? `https://www.instagram.com/${externalData.instagram_id}` : null,
            twitter_id: externalData.twitter_id ? `https://twitter.com/${externalData.twitter_id}` : null,
            facebook_id: externalData.facebook_id ? `https://www.facebook.com/${externalData.facebook_id}` : null,
            imdb_id: externalData.imdb_id ? `https://www.imdb.com/name/${externalData.imdb_id}` : null,
            homepage: korData.homepage || null
        };

        // 연기 경력 정보 생성 (개봉연도 순으로 정렬)
        const actingCareer = creditsData.cast
            .filter(movie => movie.release_date) // 개봉일이 있는 작품만 선택
            .sort((a, b) => new Date(b.release_date) - new Date(a.release_date)) // 최신순 정렬
            .slice(0, 5) // 최근 5개 작품만 선택
            .map(movie => ({
                id: movie.id, // 영화 ID 추가
                title: movie.title,
                character: movie.character || '정보 없음',
                release_date: movie.release_date,
                popularity: movie.popularity,
                vote_average: movie.vote_average
            }));

        return {
            ...korData,
            name: korData.name,
            place_of_birth: korData.place_of_birth,
            biography: korData.biography || '약력 정보가 없습니다.',
            external_links: externalLinks,
            acting_career: actingCareer
        };
    } catch (error) {
        console.error('인물 상세 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 인물의 출연작 정보 가져오기
async function getPersonMovieCredits(personId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}&language=ko-KR`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('인물의 출연작 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 영화의 관련 시리즈 정보 가져오기
async function getMovieSeries(movieId) {
    try {
        // TMDB API에서 컬렉션 정보 가져오기
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=ko-KR&append_to_response=belongs_to_collection`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.belongs_to_collection) {
            return null;
        }

        // 컬렉션의 상세 정보 가져오기
        const collectionResponse = await fetch(
            `${TMDB_BASE_URL}/collection/${data.belongs_to_collection.id}?api_key=${TMDB_API_KEY}&language=ko-KR`
        );

        if (!collectionResponse.ok) {
            throw new Error(`HTTP error! status: ${collectionResponse.status}`);
        }

        const collectionData = await collectionResponse.json();
        
        // 영화들을 개봉일 순으로 정렬
        const sortedMovies = collectionData.parts.sort((a, b) => {
            return new Date(a.release_date) - new Date(b.release_date);
        });

        return {
            id: collectionData.id,
            name: collectionData.name,
            overview: collectionData.overview,
            poster_path: collectionData.poster_path,
            movies: sortedMovies.map(movie => ({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                release_date: movie.release_date,
                overview: movie.overview
            }))
        };
    } catch (error) {
        console.error('시리즈 정보를 가져오는데 실패했습니다:', error);
        return null;
    }
} 