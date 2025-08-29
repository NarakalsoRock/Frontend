// js/search.js
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    let currentPage = parseInt(urlParams.get('page')) || 1;

    const displayedSearchQueryInput = document.getElementById('displayedSearchQuery');
    const searchResultsTitle = document.getElementById('searchResultsTitle');
    const movieResultsGrid = document.getElementById('movieResultsGrid');
    
    console.log('Search.js loaded. Query from URL:', query, "Page:", currentPage); 

    if (displayedSearchQueryInput) {
        displayedSearchQueryInput.value = query || '';
    }

    if (query) {
        if (searchResultsTitle) {
            searchResultsTitle.textContent = `'${query}' 검색 결과`;
        }
        fetchAndDisplaySearchResults(query, currentPage);
    } else {
        if (searchResultsTitle) {
            searchResultsTitle.textContent = '검색어를 입력해주세요.';
        }
        if (movieResultsGrid) {
            movieResultsGrid.innerHTML = '<div class="no-results">표시할 검색 결과가 없습니다. 검색창에 키워드를 입력해주세요.</div>';
        }
        clearPagination();
    }

    async function fetchAndDisplaySearchResults(searchQuery, page) {
        if (!movieResultsGrid) {
            console.error('movieResultsGrid 요소를 찾을 수 없습니다.');
            return;
        }
        movieResultsGrid.innerHTML = '<div class="loading">결과를 가져오는 중...</div>'; 

        try {
            console.log(`Fetching search results for query: "${searchQuery}", page: ${page}`); 
            const data = await window.searchMovies(searchQuery, page); 
            console.log('API 응답 데이터 (search.js):', data); 

            if (data && data.movies && data.movies.length > 0) {
                movieResultsGrid.innerHTML = ''; 
                const totalPages = data.total_pages || 1;
                currentPage = data.page || 1;

                data.movies.forEach(movie => {
                    const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : 'https://placehold.co/185x278?text=No+Image';
                    
                    const movieElement = document.createElement('div');
                    movieElement.classList.add('movie-item-result');
                    movieElement.innerHTML = `
                        <a href="movie-detail.html?id=${movie.id}" class="poster-link">
                            <img src="${posterPath}" alt="${movie.title || '제목 없음'}" onerror="this.onerror=null; this.src='https://placehold.co/185x278?text=No+Image';">
                        </a>
                        <div class="title-result">${movie.title || '제목 없음'}</div>
                        <div class="movie-item-buttons">
                             <button class="like-button search-like-btn" data-movie-id="${movie.id}" data-title="${encodeURIComponent(movie.title || '')}" data-poster-path="${movie.poster_path || ''}" aria-label="좋아요">
                                <i class="heart-icon"></i>
                            </button>
                            <button class="bookmark-button search-bookmark-btn" data-movie-id="${movie.id}" data-title="${encodeURIComponent(movie.title || '')}" data-poster-path="${movie.poster_path || ''}" aria-label="북마크">
                                <svg class="bookmark-icon" viewBox="0 0 24 24">
                                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                                </svg>
                            </button>
                        </div>
                    `;
                    movieResultsGrid.appendChild(movieElement);
                });
                attachSearchItemButtonListeners(); 
                renderPagination(searchQuery, totalPages);
            } else {
                movieResultsGrid.innerHTML = `<div class="no-results">'${searchQuery}'에 대한 검색 결과가 없습니다.</div>`;
                if (data && data.error) { 
                     movieResultsGrid.innerHTML += `<p style="color:red;">서버 메시지: ${data.error}</p>`;
                }
                clearPagination();
            }
        } catch (error) {
            console.error('영화 검색 중 오류 발생 (search.js catch):', error);
            movieResultsGrid.innerHTML = '<div class="no-results">검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</div>';
            clearPagination();
        }
    }

    function attachSearchItemButtonListeners() {
        document.querySelectorAll('.search-like-btn').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', async function(e) {
                e.preventDefault(); e.stopPropagation();
                const movieId = this.dataset.movieId;
                const title = decodeURIComponent(this.dataset.title);
                const posterPath = this.dataset.posterPath;
                handleMovieInteraction(movieId, title, posterPath, 'like', this);
            });
        });

        document.querySelectorAll('.search-bookmark-btn').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', async function(e) {
                e.preventDefault(); e.stopPropagation();
                const movieId = this.dataset.movieId;
                const title = decodeURIComponent(this.dataset.title);
                const posterPath = this.dataset.posterPath;
                handleMovieInteraction(movieId, title, posterPath, 'bookmark', this);
            });
        });
    }
    
    async function handleMovieInteraction(movieId, title, posterPath, type, buttonElement) {
        if (!localStorage.getItem('token')) {
            alert( (type === 'like' ? '좋아요' : '북마크') + ' 기능을 사용하려면 로그인이 필요합니다.');
            window.location.href = 'login.html';
            return;
        }
        const result = type === 'like' 
            ? await window.toggleMovieLike(movieId, title, posterPath) 
            : await window.toggleMovieBookmark(movieId, title, posterPath);
        
        if (result && result.success) {
            buttonElement.classList.toggle('active');
        } else if (result !== null) { 
            console.error(`${type} 처리 실패:`, result ? result.error : '알 수 없는 서버 오류');
        }
    }

    function renderPagination(currentQuery, totalPages) {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        const maxPagesToShow = 5; 
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.textContent = '<<';
            firstPageButton.addEventListener('click', () => {
                 window.location.href = `search.html?query=${encodeURIComponent(currentQuery)}&page=1`;
            });
            paginationContainer.appendChild(firstPageButton);
        }

        const prevButton = document.createElement('button');
        prevButton.textContent = '이전';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                window.location.href = `search.html?query=${encodeURIComponent(currentQuery)}&page=${currentPage - 1}`;
            }
        });
        paginationContainer.appendChild(prevButton);

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.disabled = true; 
                pageButton.style.fontWeight = 'bold';
                pageButton.style.backgroundColor = '#4a1e8c'; 
            }
            pageButton.addEventListener('click', () => {
                window.location.href = `search.html?query=${encodeURIComponent(currentQuery)}&page=${i}`;
            });
            paginationContainer.appendChild(pageButton);
        }

        const nextButton = document.createElement('button');
        nextButton.textContent = '다음';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                 window.location.href = `search.html?query=${encodeURIComponent(currentQuery)}&page=${currentPage + 1}`;
            }
        });
        paginationContainer.appendChild(nextButton);

        if (endPage < totalPages) {
            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = '>>';
            lastPageButton.addEventListener('click', () => {
                 window.location.href = `search.html?query=${encodeURIComponent(currentQuery)}&page=${totalPages}`;
            });
            paginationContainer.appendChild(lastPageButton);
        }
    }
    
    function clearPagination() {
        const paginationContainer = document.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
    }
});