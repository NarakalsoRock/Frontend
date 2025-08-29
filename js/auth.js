// js/auth.js

// 로그아웃 함수
async function logout() {
    const token = localStorage.getItem('token');

    // window.AUTH_URL은 api.js에서 정의된다고 가정
    if (!window.AUTH_URL) {
        console.error('AUTH_URL is not defined for logout.');
        alert('API 설정 오류로 로그아웃을 진행할 수 없습니다.');
        return;
    }

    try {
        // 서버에 로그아웃 요청 (선택적)
        // 백엔드에 /api/auth/logout 엔드포인트가 POST로 구현되어 있어야 함
        const response = await fetch(`${window.AUTH_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // 서버 응답이 실패해도 클라이언트 측에서는 로그아웃 처리를 계속 진행할 수 있음
            const errorData = await response.json().catch(() => ({ message: '서버 응답 오류' }));
            console.warn('서버 로그아웃 실패:', errorData.message);
        }
    } catch (error) {
        console.error('로그아웃 요청 중 네트워크 오류:', error);
    }

    // 클라이언트 측 토큰 삭제
    localStorage.removeItem('token');

    // 로그아웃 후 헤더 UI 업데이트
    updateHeaderUI();

    // 로그인 페이지로 리디렉션
    alert('로그아웃되었습니다.');
    window.location.href = 'login.html'; // 또는 메인 페이지 'index.html'
}

// 헤더 UI 업데이트 함수 (로그인 상태에 따라 링크 표시 변경)
function updateHeaderUI() {
    const token = localStorage.getItem('token');
    const mypageLink = document.getElementById('headerMypageLink');
    const loginLink = document.getElementById('headerLoginLink');
    const signupLink = document.getElementById('headerSignupLink');

    if (token) { // 로그인 상태
        if (mypageLink) mypageLink.style.display = 'inline'; // 또는 'block'
        if (loginLink) loginLink.style.display = 'none';
        if (signupLink) signupLink.style.display = 'none';
    } else { // 로그아웃 상태
        if (mypageLink) mypageLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline';
        if (signupLink) signupLink.style.display = 'inline';
    }
}

// 이 함수들을 전역 스코프에 노출시켜 다른 파일에서 직접 호출 가능하게 함
window.logout = logout;
window.updateHeaderUI = updateHeaderUI;

// 페이지 로드 시 즉시 헤더 UI 업데이트 (auth.js가 로드될 때 한 번 실행)
// 단, DOMContentLoaded 이후에 DOM 요소에 접근해야 하므로 main.js에서 호출하는 것이 더 안전할 수 있음
// 여기서는 main.js에서 호출한다고 가정하고 이 부분을 주석 처리하거나 삭제합니다.
// document.addEventListener('DOMContentLoaded', updateHeaderUI);