// js/header.js

// 검색 기능
function setupSearch() {
    const searchInput = document.querySelector('.header-search-input');
    const searchButton = document.querySelector('.header-search-button');

    if (!searchInput || !searchButton) return;

    // 검색 실행 함수
    function executeSearch() {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        }
    }

    // 검색 버튼 클릭 이벤트
    searchButton.addEventListener('click', executeSearch);

    // 엔터 키 입력 이벤트
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    });
}

// 현재 페이지 네비게이션 활성화
function setActiveNavItem() {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (currentPath.endsWith(href)) {
            item.classList.add('active');
        }
    });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setActiveNavItem();
});