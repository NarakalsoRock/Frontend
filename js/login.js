// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');

    // 이미 로그인되어 있는 경우 처리 (페이지 로드 시)
    // api.js의 checkLoginStatus를 사용하여 토큰 유효성 검사
    window.checkLoginStatus().then(isLoggedIn => {
        if (isLoggedIn) {
            const redirectUrl = localStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            } else {
                window.location.href = 'index.html'; // 기본 페이지로 리다이렉트
            }
        } else {
            // 토큰이 없거나 유효하지 않으면 localStorage에서 토큰 제거 (checkLoginStatus가 내부적으로 처리할 수 있음)
            // localStorage.removeItem('token'); // validateTokenInternal에서 이미 처리할 수 있음
        }
    }).catch(error => {
        console.error("페이지 로드 시 로그인 상태 확인 중 오류:", error);
        // 오류 발생 시 안전하게 토큰 제거
        localStorage.removeItem('token');
    });


    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value.trim();

            if (!email || !password) {
                alert('이메일과 비밀번호를 모두 입력해주세요.');
                return;
            }

            try {
                const response = await fetch(`${window.AUTH_URL}/login`, { // authController.js의 login 함수 호출
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json(); // 응답을 먼저 받고

                if (response.ok && data.success && data.token) { // 성공 응답 및 토큰 존재 확인
                    localStorage.setItem('token', data.token);

                    // 로그인 성공 후, 저장된 리다이렉트 URL 확인
                    const redirectUrl = localStorage.getItem('redirectAfterLogin');
                    if (redirectUrl) {
                        localStorage.removeItem('redirectAfterLogin'); // 사용 후 삭제
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = 'index.html'; // 기본 페이지로 리다이렉트
                    }
                } else {
                    // 서버에서 오는 오류 메시지 사용
                    alert(data.error || data.message || '로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.');
                    localStorage.removeItem('token'); // 실패 시 토큰이 있다면 제거
                }
            } catch (error) {
                console.error('로그인 요청 실패:', error);
                alert('로그인 처리 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');
                localStorage.removeItem('token');
            }
        });
    }
});