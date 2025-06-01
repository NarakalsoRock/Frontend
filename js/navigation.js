// 네비게이션 이벤트 처리
document.addEventListener('DOMContentLoaded', () => {
    const mypageLink = document.querySelector('a[href="mypage.html"]');
    
    if (mypageLink) {
        mypageLink.addEventListener('click', async (e) => {
            e.preventDefault(); // 기본 링크 동작 방지
            
            const isLoggedIn = await checkLoginStatus();
            
            if (isLoggedIn) {
                window.location.href = 'mypage.html';
            } else {
                // 현재 페이지 URL을 로그인 후 리다이렉트할 페이지로 저장
                localStorage.setItem('redirectAfterLogin', 'mypage.html');
                window.location.href = 'login.html';
            }
        });
    }
}); 