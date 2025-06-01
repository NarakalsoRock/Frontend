// 트레일러 모달 관련 요소
const trailerModal = document.getElementById('trailerModal');
const videoContainer = trailerModal.querySelector('.video-container iframe');

// 예고편 URL (실제 구현 시에는 서버에서 받아오거나 데이터베이스에서 가져와야 함)
const trailerUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ'; // 예시 URL

// 모달 열기 함수
function openTrailerModal() {
    trailerModal.classList.add('active');
    videoContainer.src = trailerUrl;
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
}

// 모달 닫기 함수
function closeTrailerModal() {
    trailerModal.classList.remove('active');
    videoContainer.src = ''; // iframe 소스 초기화
    document.body.style.overflow = ''; // 배경 스크롤 복구
}

// 모달 바깥 영역 클릭 시 닫기
trailerModal.addEventListener('click', (e) => {
    if (e.target === trailerModal) {
        closeTrailerModal();
    }
});

// ESC 키 누를 때 모달 닫기
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && trailerModal.classList.contains('active')) {
        closeTrailerModal();
    }
}); 