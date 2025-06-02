// js/common/header.js
document.addEventListener('DOMContentLoaded', () => {
    const headerSearchInput = document.querySelector('.header .header-search-input');
    const headerSearchButton = document.querySelector('.header .header-search-button');

    function performSearch() {
        const query = headerSearchInput.value.trim();
        if (query) {
            // search.html로 검색어와 함께 이동
            // 현재 페이지가 search.html이고, 검색어가 같다면 새로고침 대신 다른 동작을 할 수도 있음 (선택적)
            window.location.href = `search.html?query=${encodeURIComponent(query)}`;
        } else {
            // 검색어가 없을 경우 동작 (예: 알림 표시)
            // alert('검색어를 입력해주세요.');
        }
    }

    if (headerSearchInput && headerSearchButton) {
        headerSearchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
        headerSearchButton.addEventListener('click', performSearch);
    }

    // 현재 페이지의 URL을 확인하여 네비게이션 아이템에 active 클래스 추가
    const navItems = document.querySelectorAll('.header .nav-item');
    const currentPageUrl = window.location.pathname.split('/').pop(); // 예: "now-playing.html"

    navItems.forEach(item => {
        const itemUrl = item.getAttribute('href').split('/').pop();
        if (itemUrl === currentPageUrl) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
});