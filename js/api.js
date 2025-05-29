// API 엔드포인트 기본 URL
const BASE_URL = 'http://localhost:5000/api/movies';

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