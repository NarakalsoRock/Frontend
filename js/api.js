// js/api.js

const APP_BASE_URL = 'http://localhost:5000'; //
window.BASE_API_URL = `${APP_BASE_URL}/api`; //

window.MOVIES_API_URL = `${window.BASE_API_URL}/movies`; //
window.AUTH_URL = `${window.BASE_API_URL}/auth`;       //
window.ACTIONS_URL = `${window.BASE_API_URL}/actions`;   //

async function checkLoginStatus() { //
    try {
        const token = localStorage.getItem('token'); //
        if (!token) { //
            return false; //
        }
        const response = await fetch(`${window.AUTH_URL}/me`, { //
            headers: {
                'Authorization': `Bearer ${token}` //
            }
        });
        return response.ok; //
    } catch (error) {
        console.error('로그인 상태 확인 실패:', error); //
        return false; //
    }
}
window.checkLoginStatus = checkLoginStatus;


async function getMainMovie() { //
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/main-movie`); //
        if (!response.ok) { //
            throw new Error(`API 요청 실패: ${response.status}`); //
        }
        const data = await response.json(); //
        console.log('메인 영화 데이터:', data); //
        return data; //
    } catch (error) {
        console.error('메인 영화를 가져오는데 실패했습니다:', error); //
        throw error; //
    }
}
window.getMainMovie = getMainMovie;


async function getNowPlaying(page = 1) { //
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/now-playing?page=${page}`); //
        if (!response.ok) { //
            throw new Error(`API 요청 실패: ${response.status}`); //
        }
        const data = await response.json(); //
        console.log('현재 상영작 데이터:', data); //
        return data; //
    } catch (error) {
        console.error('현재 상영작을 가져오는데 실패했습니다:', error); //
        throw error; //
    }
}
window.getNowPlaying = getNowPlaying;


async function getUpcoming(page = 1) { //
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/upcoming?page=${page}`); //
        if (!response.ok) { //
            throw new Error(`API 요청 실패: ${response.status}`); //
        }
        const data = await response.json(); //
        console.log('개봉 예정작 데이터:', data); //
        return data; //
    } catch (error) {
        console.error('개봉 예정작을 가져오는데 실패했습니다:', error); //
        throw error; //
    }
}
window.getUpcoming = getUpcoming;


async function getMovieDetails(movieId) { //
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/${movieId}`); //
        if (!response.ok) { //
            throw new Error(`API 요청 실패: ${response.status}`); //
        }
        const data = await response.json(); //
        console.log('영화 상세 정보:', data); //
        return data; //
    } catch (error) {
        console.error('영화 상세 정보를 가져오는데 실패했습니다:', error); //
        throw error; //
    }
}
window.getMovieDetails = getMovieDetails;

window.searchMovies = async function(query, page = 1) { //
    console.log(`api.js: searchMovies 호출됨 - query: "${query}", page: ${page}`);
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/search?query=${encodeURIComponent(query)}&page=${page}`); //
        console.log(`api.js: search API 요청 URL: ${response.url}`);
        
        if (!response.ok) { //
            const errorText = await response.text(); 
            console.error("Search API response not OK:", response.status, errorText);
            try {
                const errorData = JSON.parse(errorText); 
                throw new Error(errorData.message || `영화 검색 실패: ${response.status}`);
            } catch (e) { 
                throw new Error(errorText || `영화 검색 실패: ${response.status}`);
            }
        }
        const data = await response.json(); //
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
        console.error("Error in searchMovies API call (api.js catch):", error); //
        return { movies: [], page: 1, total_pages: 1, error: error.message || "검색 중 오류 발생" }; //
    }
};


async function getMe() { //
    const token = localStorage.getItem('token'); //
    if (!token) {
        console.warn('사용자 토큰이 없습니다. 로그인이 필요합니다.');
        return null; 
    }
    try {
        const response = await fetch(`${window.AUTH_URL}/me`, { //
            headers: {
                'Authorization': `Bearer ${token}` //
            }
        });
        if (!response.ok) { //
            if (response.status === 401) {
                localStorage.removeItem('token');
                alert('세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
                window.location.href = 'login.html'; 
            }
            const errorData = await response.json().catch(() => ({ error: `서버 응답 오류: ${response.status}` }));
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        return await response.json(); //
    } catch (error) {
        console.error('사용자 정보를 가져오는데 실패했습니다:', error); //
        return null;
    }
}
window.getMe = getMe;


async function toggleMovieInteraction(movieId, title, posterPath, type) { //
    const token = localStorage.getItem('token'); //
    if (!token) {
        alert('로그인이 필요합니다.'); //
        window.location.href = 'login.html'; //
        return null; 
    }

    const endpoint = type === 'like' 
        ? `${window.ACTIONS_URL}/movies/like` 
        : `${window.ACTIONS_URL}/movies/bookmark`; //
    const interactionTypeDisplay = type === 'like' ? '좋아요' : '북마크'; //

    try {
        const response = await fetch(endpoint, { //
            method: 'POST', //
            headers: {
                'Content-Type': 'application/json', //
                'Authorization': `Bearer ${token}` //
            },
            body: JSON.stringify({ 
                movieId: String(movieId), 
                title: title, 
                posterPath: posterPath 
            })
        });

        const responseData = await response.json();  //

        if (!response.ok) { //
            console.error(`${interactionTypeDisplay} 요청 실패:`, response.status, responseData); //
            alert(`${interactionTypeDisplay} 처리 중 오류: ${responseData.error || responseData.message || '알 수 없는 오류가 발생했습니다.'}`); //
            if (response.status === 401) {  //
                 localStorage.removeItem('token'); //
                 window.location.href = 'login.html';  //
            }
            return null;  //
        }
        
        return responseData;  //
    } catch (error) {
        console.error(`${interactionTypeDisplay} API 호출 중 네트워크 또는 JSON 파싱 오류:`, error); //
        alert(`${interactionTypeDisplay} 처리 중 네트워크 오류가 발생했습니다.`); //
        return null;  //
    }
}

window.toggleMovieLike = async function(movieId, title, posterPath) { //
    return await toggleMovieInteraction(movieId, title, posterPath, 'like'); //
};

window.toggleMovieBookmark = async function(movieId, title, posterPath) { //
    return await toggleMovieInteraction(movieId, title, posterPath, 'bookmark'); //
};

async function getLikedMovies() { //
    const token = localStorage.getItem('token'); //
    if (!token) { console.warn('Token not found for getLikedMovies'); return null; } //
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/liked`, { //
            headers: {
                'Authorization': `Bearer ${token}` //
            }
        });
        if (!response.ok) { //
            throw new Error('API 요청 실패'); //
        }
        const data = await response.json(); //
        console.log('좋아요한 영화 데이터 (별도호출 시):', data); //
        return data; //
    } catch (error) {
        console.error('좋아요한 영화 목록을 가져오는데 실패했습니다 (별도호출 시):', error); //
        return { movies: [] }; 
    }
}
window.getLikedMovies = getLikedMovies; //

async function getBookmarkedMovies() { //
    const token = localStorage.getItem('token'); //
    if (!token) { console.warn('Token not found for getBookmarkedMovies'); return null; } //
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/bookmarked`, { //
            headers: {
                'Authorization': `Bearer ${token}` //
            }
        });
        if (!response.ok) { //
            throw new Error('API 요청 실패'); //
        }
        const data = await response.json(); //
        console.log('북마크한 영화 데이터 (별도호출 시):', data); //
        return data; //
    } catch (error) {
        console.error('북마크한 영화 목록을 가져오는데 실패했습니다 (별도호출 시):', error); //
        return { movies: [] }; 
    }
}
window.getBookmarkedMovies = getBookmarkedMovies; //