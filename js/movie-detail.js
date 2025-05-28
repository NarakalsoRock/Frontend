document.addEventListener('DOMContentLoaded', () => {
    // 미디어 탭 전환
    const mediaTabs = document.querySelectorAll('.media-tab');
    const mediaContents = document.querySelectorAll('.media-content');

    mediaTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 활성 탭 스타일 변경
            mediaTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 컨텐츠 표시/숨김
            const targetId = tab.dataset.tab;
            mediaContents.forEach(content => {
                content.classList.add('hidden');
                if (content.id === targetId) {
                    content.classList.remove('hidden');
                }
            });
        });
    });

    // 좋아요 버튼 토글
    const likeButton = document.querySelector('.btn-like');
    likeButton?.addEventListener('click', () => {
        likeButton.classList.toggle('active');
    });

    // 북마크 버튼 토글
    const bookmarkButton = document.querySelector('.btn-bookmark');
    bookmarkButton?.addEventListener('click', () => {
        bookmarkButton.classList.toggle('active');
    });

    // 예고편 모달
    const trailerButtons = document.querySelectorAll('.btn-trailer, .play-button');
    const trailerModal = document.getElementById('trailerModal');
    const modalClose = document.querySelector('.modal-close');
    const videoContainer = document.querySelector('.video-container iframe');

    // 예고편 버튼 클릭 시 모달 표시
    trailerButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 실제 구현 시에는 여기에 실제 동영상 URL을 설정
            videoContainer.src = 'https://www.youtube.com/embed/example';
            trailerModal.style.display = 'block';
        });
    });

    // 모달 닫기
    modalClose?.addEventListener('click', () => {
        trailerModal.style.display = 'none';
        videoContainer.src = ''; // 동영상 중지
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        if (event.target === trailerModal) {
            trailerModal.style.display = 'none';
            videoContainer.src = '';
        }
    });

    // 가로 스크롤 영역에서 마우스 휠 이벤트 처리
    const scrollContainers = document.querySelectorAll('.credits-grid, .movie-grid');
    
    scrollContainers.forEach(container => {
        container.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                container.scrollLeft += e.deltaY;
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const trailerBtn = document.querySelector('.btn-trailer');
    const modal = document.getElementById('trailerModal');
    const closeBtn = modal.querySelector('.modal-close');
    const iframe = modal.querySelector('iframe');

    // 예고편 URL (실제 예고편 주소로 변경)
    const trailerUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";

    trailerBtn.addEventListener('click', function() {
        modal.classList.add('active');
        iframe.src = trailerUrl;
    });

    closeBtn.addEventListener('click', function() {
        modal.classList.remove('active');
        iframe.src = ""; // 재생 중지
    });

    // 모달 바깥 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            iframe.src = "";
        }
    });
});