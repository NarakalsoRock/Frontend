// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    // const loginBtn = document.getElementById('loginBtn');

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
                    localStorage.setItem('token', data.token);
                    
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
            }
        });
    }
});