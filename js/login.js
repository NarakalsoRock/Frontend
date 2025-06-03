// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');

    // 이미 로그인되어 있는 경우 처리
    const token = localStorage.getItem('token');
    if (token) {
        window.validateToken().then(isValid => {
            if (isValid) {
                const redirectUrl = localStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                localStorage.removeItem('token');
            }
        });
    }

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
                const response = await fetch(`${window.AUTH_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (!data.token) {
                        throw new Error('토큰이 없습니다.');
                    }
                    
                    // 토큰 저장
                    localStorage.setItem('token', data.token);
                    
                    // 토큰 유효성 검증
                    const isValid = await window.validateToken();
                    if (!isValid) {
                        throw new Error('토큰이 유효하지 않습니다.');
                    }
                    
                    // 저장된 리다이렉트 URL이 있는지 확인
                    const redirectUrl = localStorage.getItem('redirectAfterLogin');
                    localStorage.removeItem('redirectAfterLogin'); // 사용 후 삭제
                    
                    // 리다이렉트 URL이 있으면 해당 페이지로, 없으면 홈으로 이동
                    window.location.href = redirectUrl || 'index.html';
                } else {
                    const error = await response.json();
                    alert(error.message || '로그인에 실패했습니다.');
                }
            } catch (error) {
                console.error('로그인 요청 실패:', error);
                alert('로그인 처리 중 오류가 발생했습니다.');
                localStorage.removeItem('token');
            }
        });
    }
});