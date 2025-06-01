// API 엔드포인트 기본 URL
const BASE_URL = 'http://localhost:5000/api/movies';
const AUTH_URL = 'http://localhost:5000/api/auth';

// 전역 변수 설정
window.BASE_URL = BASE_URL;
window.AUTH_URL = AUTH_URL;

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
        console.log('메인 영화 데이터:', data); // 디버깅용
        return data;
    } catch (error) {
        console.error('메인 영화를 가져오는데 실패했습니다:', error);
        throw error;
    }
}

// 현재 상영작 가져오기
async function getNowPlaying() {
    try {
        const response = await fetch(`${BASE_URL}/now-playing`);
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('현재 상영작 데이터:', data); // 디버깅용
        return data;
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
        const response = await fetch(`${BASE_URL}/movie/${movieId}`);
        if (!response.ok) {
            throw new Error('API 요청 실패');
        }
        const data = await response.json();
        console.log('영화 상세 정보:', data); // 디버깅용
        return data;
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