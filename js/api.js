// api.js

// API 엔드포인트 기본 URL
const APP_BASE_URL = 'http://localhost:5000'; // 앱의 기본 URL (프로토콜 + 호스트 + 포트)
window.BASE_API_URL = `${APP_BASE_URL}/api`; // API 요청을 위한 기본 경로 /api

// 전역 변수 설정 (각 모듈별 URL)
window.MOVIES_API_URL = `${window.BASE_API_URL}/movies`; // '/api/movies'
window.AUTH_URL = `${window.BASE_API_URL}/auth`;       // '/api/auth'
window.ACTIONS_URL = `${window.BASE_API_URL}/actions`;   // '/api/actions' <= 수정됨

// 로그인 상태 체크 (백엔드에 /api/auth/verify 엔드포인트가 있어야 함)
// 현재 백엔드에는 /verify 라우트가 없으므로, /me를 활용하거나 다른 방식 고려 필요.
// 여기서는 일단 함수 구조는 유지합니다.
async function checkLoginStatus() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return false;
        }
        // /api/auth/verify 대신 /api/auth/me 로 토큰 유효성 간접 확인 가능
        const response = await fetch(`${window.AUTH_URL}/me`, { // /verify 대신 /me 사용
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
window.checkLoginStatus = checkLoginStatus;


// 메인 영화 가져오기 (백엔드에 /api/movies/main-movie 엔드포인트 필요)
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
        throw error; // 호출한 곳에서 에러를 처리할 수 있도록 전파
    }
}
window.getMainMovie = getMainMovie;

// 현재 상영작 가져오기 (백엔드에 /api/movies/now-playing 엔드포인트 필요)
async function getNowPlaying(page = 1) { // 페이지 파라미터 추가
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


// 개봉 예정작 가져오기 (백엔드에 /api/movies/upcoming 엔드포인트 필요)
async function getUpcoming(page = 1) { // 페이지 파라미터 추가
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


// 영화 상세 정보 가져오기 (백엔드에 /api/movies/:movieId 엔드포인트 필요)
async function getMovieDetails(movieId) {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/${movieId}`); // 경로 수정 /movie/:id -> /:id
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        const data = await response.json();
        console.log('영화 상세 정보:', data);
        return data;
    } catch (error) {
        console.error('영화 상세 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getMovieDetails = getMovieDetails;

// 영화 검색 (백엔드에 /api/movies/search 엔드포인트 필요)
async function searchMovies(query, page = 1) {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/search?query=${encodeURIComponent(query)}&page=${page}`);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error searching movies:", error);
        throw error;
    }
}
window.searchMovies = searchMovies;


// --- 사용자 정보 및 상호작용 API ---

// 사용자 정보 가져오기 (mypage.js 에서 주로 사용)
async function getMe() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('사용자 토큰이 없습니다. 로그인이 필요합니다.');
        // 필요시 로그인 페이지로 리디렉션
        // window.location.href = 'login.html'; 
        return null; // 또는 throw new Error('로그인이 필요합니다.');
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
                window.location.href = 'login.html'; // 실제 로그인 페이지 경로
            }
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        return await response.json(); // { success: true, data: { ... } }
    } catch (error) {
        console.error('사용자 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getMe = getMe;


// 영화 좋아요/북마크 토글 공통 함수
async function toggleMovieInteraction(movieId, title, posterPath, type) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html'; // 실제 로그인 페이지 경로로 수정
        return null; // Promise<null> 반환
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
                movieId: String(movieId), // 백엔드에서 movieId를 문자열로 비교할 수 있으므로 일관성 유지
                title: title, 
                posterPath: posterPath  // TMDB의 순수 poster_path (예: /xxxx.jpg)
            })
        });

        const responseData = await response.json(); // 에러 응답도 JSON일 수 있으므로 먼저 파싱 시도

        if (!response.ok) {
            console.error(`${interactionTypeDisplay} 요청 실패:`, response.status, responseData);
            alert(`${interactionTypeDisplay} 처리 중 오류: ${responseData.error || responseData.message || '알 수 없는 오류가 발생했습니다.'}`);
            if (response.status === 401) { // Unauthorized
                 localStorage.removeItem('token');
                 window.location.href = 'login.html'; // 실제 로그인 페이지 경로로 수정
            }
            return null; // Promise<null> 반환
        }
        
        // 성공 메시지는 호출한 쪽에서 result.message를 사용하도록 변경 (선택사항)
        // alert(responseData.message); 
        return responseData; // { success: true, message: "...", likedMovies: [...] } 또는 bookmarkedMovies
    } catch (error) {
        console.error(`${interactionTypeDisplay} API 호출 중 네트워크 또는 JSON 파싱 오류:`, error);
        alert(`${interactionTypeDisplay} 처리 중 네트워크 오류가 발생했습니다.`);
        return null; // Promise<null> 반환
    }
}

// 영화 좋아요 토글 (다른 JS 파일에서 호출 가능하도록 window 객체에 할당)
window.toggleMovieLike = async function(movieId, title, posterPath) {
    return await toggleMovieInteraction(movieId, title, posterPath, 'like');
};

// 영화 북마크 토글 (다른 JS 파일에서 호출 가능하도록 window 객체에 할당)
window.toggleMovieBookmark = async function(movieId, title, posterPath) {
    return await toggleMovieInteraction(movieId, title, posterPath, 'bookmark');
};


/* 참고: 아래 getLikedMovies, getBookmarkedMovies 함수는 백엔드에
   /api/movies/liked, /api/movies/bookmarked 엔드포인트가 없으므로
   현재 백엔드 구조에서는 직접적으로 사용되지 않습니다.
   마이페이지에서는 /api/auth/me 를 통해 모든 정보를 한번에 받습니다.
   만약 별도의 엔드포인트가 필요하다면 백엔드 수정이 필요합니다.
   기존 코드에 있었으므로 일단 유지합니다.
*/
async function getLikedMovies() { //
    const token = localStorage.getItem('token');
    if (!token) { /* ... */ return null; }
    try {
        // 현 백엔드 구조상 이 엔드포인트는 존재하지 않음. /api/auth/me 를 통해 받아옴.
        const response = await fetch(`${window.MOVIES_API_URL}/liked`, { //
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('API 요청 실패');
        return await response.json();
    } catch (error) {
        console.error('좋아요한 영화 목록 (별도 호출) 실패:', error);
        throw error;
    }
}
window.getLikedMovies = getLikedMovies; //

async function getBookmarkedMovies() { //
    const token = localStorage.getItem('token');
    if (!token) { /* ... */ return null; }
    try {
        // 현 백엔드 구조상 이 엔드포인트는 존재하지 않음. /api/auth/me 를 통해 받아옴.
        const response = await fetch(`${window.MOVIES_API_URL}/bookmarked`, { //
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('API 요청 실패');
        return await response.json();
    } catch (error) {
        console.error('북마크한 영화 목록 (별도 호출) 실패:', error);
        throw error;
    }
}
window.getBookmarkedMovies = getBookmarkedMovies; //