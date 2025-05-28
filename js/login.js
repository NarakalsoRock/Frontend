// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    // const loginBtn = document.getElementById('loginBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const email = loginEmailInput.value.trim();
            const password = loginPasswordInput.value.trim();

            if (!email || !password) {
                alert('이메일과 비밀번호를 모두 입력해주세요.');
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/api/auth/login', { // 백엔드 로그인 API 주소
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    localStorage.setItem('token', data.token); // JWT 토큰 저장
                    // 사용자 정보를 필요한 경우 저장 (예: 닉네임)
                    // localStorage.setItem('userNickname', data.user.nickname);
                    window.location.href = 'my-page.html'; // 로그인 성공 후 마이페이지로 이동
                } else {
                    alert(data.error || '로그인에 실패했습니다.');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('서버와 통신 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        });
    }
});