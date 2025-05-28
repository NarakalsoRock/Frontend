// signup.js
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const signupNicknameInput = document.getElementById('signupNickname');
    const signupEmailInput = document.getElementById('signupEmail');
    const signupPasswordInput = document.getElementById('signupPassword');
    //const signupBtn = document.getElementById('signupBtn');

    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const nickname = signupNicknameInput.value.trim();
            const email = signupEmailInput.value.trim();
            const password = signupPasswordInput.value.trim();

            if (!nickname || !email || !password) {
                alert('모든 필드를 입력해주세요.');
                return;
            }

            // 이메일 형식 검사 (간단한 클라이언트 측 검증)
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email)) {
                alert('유효한 이메일 주소를 입력해주세요.');
                return;
            }

            // 비밀번호 길이 검사
            /*
            if (password.length < 6) {
                alert('비밀번호는 최소 6자 이상이어야 합니다.');
                return;
            }
            */
            

            try {
                const response = await fetch('http://localhost:8080/api/auth/signup', { // 백엔드 회원가입 API 주소
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nickname, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message + '\n로그인 페이지로 이동합니다.');
                    window.location.href = 'login.html'; // 회원가입 성공 후 로그인 페이지로 이동
                } else {
                    alert(data.error || '회원가입에 실패했습니다.');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('서버와 통신 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        });
    }
});