document.addEventListener('DOMContentLoaded', function() {
    // 좋아요 버튼 이벤트 리스너
    const likeButtons = document.querySelectorAll('.like-button');
    
    likeButtons.forEach(button => {
        // 초기 상태 복원
        const postId = button.closest('.post-card').dataset.postId;
        const savedState = localStorage.getItem(`like_${postId}`);
        if (savedState === 'true') {
            button.classList.add('active');
            const countElement = button.parentElement.querySelector('.action-count');
            const savedCount = localStorage.getItem(`like_count_${postId}`);
            if (savedCount) {
                countElement.textContent = savedCount;
            }
        }

        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const postId = this.closest('.post-card').dataset.postId;
            const countElement = this.parentElement.querySelector('.action-count');
            let count = parseInt(countElement.textContent);
            
            if (!this.classList.contains('active')) {
                // 좋아요 활성화
                this.classList.add('active');
                count++;
                countElement.textContent = count;
                localStorage.setItem(`like_${postId}`, 'true');
                localStorage.setItem(`like_count_${postId}`, count);
                
                // 애니메이션 효과
                countElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    countElement.style.transform = 'scale(1)';
                }, 200);
            } else {
                // 좋아요 비활성화
                this.classList.remove('active');
                count--;
                countElement.textContent = count;
                localStorage.setItem(`like_${postId}`, 'false');
                localStorage.setItem(`like_count_${postId}`, count);
            }
        });
    });
}); 