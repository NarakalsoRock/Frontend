// API 엔드포인트 기본 URL
const APP_BASE_URL = 'http://localhost:5000';
window.BASE_API_URL = `${APP_BASE_URL}/api`;

// API 엔드포인트 설정
window.MOVIES_API_URL = `${window.BASE_API_URL}/movies`;
window.AUTH_URL = `${window.BASE_API_URL}/auth`;
window.ACTIONS_URL = `${window.BASE_API_URL}/actions`;
window.POSTS_API_URL = `${window.BASE_API_URL}/posts`;

const TMDB_API_KEY = 'e79d211004d63ca22d668182dc17ebbb';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// TMDB API 관련 함수들 (변경 없음, 기존 코드 유지)
async function fetchTMDBNowPlaying() {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=ko-KR&region=KR`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            movies: data.results.map(movie => ({
                id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
                genre_ids: movie.genre_ids,
                rating: movie.adult ? '18' : movie.vote_average >= 7 ? '15' : movie.vote_average >= 5 ? '12' : 'ALL'
            }))
        };
    } catch (error) {
        console.error('TMDB 현재 상영작을 가져오는데 실패했습니다:', error);
        throw error;
    }
}

async function fetchTMDBMovieDetails(movieId) {
    try {
        const [movieResponse, creditsResponse, videosResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=ko-KR`),
            fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=ko-KR`),
            fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=ko-KR`)
        ]);

        if (!movieResponse.ok || !creditsResponse.ok || !videosResponse.ok) {
            throw new Error(`HTTP error! status: ${movieResponse.status}`);
        }

        const [movieData, creditsData, videosData] = await Promise.all([
            movieResponse.json(),
            creditsResponse.json(),
            videosResponse.json()
        ]);

        return {
            id: movieData.id,
            title: movieData.title,
            original_title: movieData.original_title,
            poster_path: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
            backdrop_path: movieData.backdrop_path ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}` : null,
            release_date: movieData.release_date,
            runtime: movieData.runtime,
            vote_average: movieData.vote_average,
            overview: movieData.overview,
            genres: movieData.genres.map(genre => genre.name),
            adult: movieData.adult,
            video_id: videosData.results?.[0]?.key,
            cast: creditsData.cast.slice(0, 10).map(actor => ({
                id: actor.id,
                name: actor.name,
                character: actor.character,
                profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
            })),
            director: creditsData.crew.find(person => person.job === 'Director')
        };
    } catch (error) {
        console.error('TMDB 영화 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}


// 토큰 유효성 검증 함수 (내부 사용)
async function validateTokenInternal() {
    const token = localStorage.getItem('token');
    if (!token) {
        return { isValid: false, user: null };
    }
    try {
        const response = await fetch(`${window.AUTH_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            if (response.status === 401) localStorage.removeItem('token');
            return { isValid: false, user: null };
        }
        const data = await response.json();
        return { isValid: data.success, user: data.success ? data.data : null };
    } catch (error) {
        console.error('토큰 검증 실패:', error);
        return { isValid: false, user: null };
    }
}

// 로그인 상태 확인 (외부 호출 가능)
// 이 함수는 단순히 현재 로그인 상태(토큰 유효성)만 반환하고, 리다이렉션은 각 페이지에서 필요에 따라 처리합니다.
window.checkLoginStatus = async function() {
    const { isValid } = await validateTokenInternal();
    return isValid;
};

// 사용자 정보 가져오기 (외부 호출 가능)
// 로그인이 되어 있으면 사용자 정보를, 아니면 null을 반환합니다.
window.getCurrentUser = async function() {
    const { isValid, user } = await validateTokenInternal();
    return isValid ? user : null;
};


// 메인 영화 가져오기 (변경 없음)
async function getMainMovie() {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/main-movie`);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('메인 영화를 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getMainMovie = getMainMovie;

// 현재 상영작 가져오기 (변경 없음)
async function getNowPlaying(page = 1) {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/now-playing?page=${page}`);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('현재 상영작을 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getNowPlaying = getNowPlaying;

// 개봉 예정작 가져오기 (변경 없음)
async function getUpcoming(page = 1) {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/upcoming?page=${page}`);
        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('개봉 예정작을 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getUpcoming = getUpcoming;

// 영화 상세 정보 가져오기 (변경 없음, 좋아요/북마크는 기존 로직 따름)
async function getMovieDetails(movieId) {
    try {
        const tmdbData = await fetchTMDBMovieDetails(movieId);
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        let isLikedFromServer = false;
        let isBookmarkedFromServer = false;

        if (token) {
            try {
                const cleanMovieId = String(movieId).replace(/[^0-9]/g, '');
                const response = await fetch(`${window.MOVIES_API_URL}/${cleanMovieId}`, { headers });
                if (response.ok) {
                    const backendMovieData = await response.json();
                    isLikedFromServer = backendMovieData.isLiked || false;
                    isBookmarkedFromServer = backendMovieData.isBookmarked || false;
                }
            } catch (error) {
                console.warn('좋아요/북마크 상태 가져오기 실패 (무시하고 진행):', error);
            }
        }
        return { ...tmdbData, isLiked: isLikedFromServer, isBookmarked: isBookmarkedFromServer };
    } catch (error) {
        console.error('영화 상세 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getMovieDetails = getMovieDetails;


// 영화 검색 (변경 없음)
window.searchMovies = async function(query, page = 1) {
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/search?query=${encodeURIComponent(query)}&page=${page}`);
        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `영화 검색 실패: ${response.status}`);
            } catch (e) {
                throw new Error(errorText || `영화 검색 실패: ${response.status}`);
            }
        }
        const data = await response.json();
        if (data.results && !data.movies) {
            return {
                movies: data.results,
                page: data.page,
                total_pages: data.total_pages,
                total_results: data.total_results
            };
        }
        return data;
    } catch (error) {
        console.error("Error in searchMovies API call (api.js catch):", error);
        return { movies: [], page: 1, total_pages: 1, error: error.message || "검색 중 오류 발생" };
    }
};

// 사용자 정보 가져오기 (getMe는 마이페이지 등에서 사용, 여기서는 getCurrentUser 사용 권장)
// window.getMe는 기존 호환성을 위해 유지, 하지만 내부적으로 getCurrentUser와 유사하게 작동 가능
async function getMe() { // 기존 mypage.js 등에서 사용될 수 있으므로 유지
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('사용자 토큰이 없습니다. 로그인이 필요합니다.');
        // 마이페이지에서 호출 시 리다이렉션 처리는 마이페이지 자체에서 하는 것이 좋음
        return null;
    }
    try {
        const response = await fetch(`${window.AUTH_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                // 이 함수를 호출하는 곳에서 리다이렉션 처리
            }
            const errorData = await response.json().catch(() => ({ error: `서버 응답 오류: ${response.status}` }));
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        const userData = await response.json();
        return userData; // success 포함된 전체 객체 반환
    } catch (error) {
        console.error('사용자 정보를 가져오는데 실패했습니다:', error);
        return null;
    }
}
window.getMe = getMe;


// 영화 좋아요/북마크 토글 공통 함수 (변경 없음, 기존 로직 따름)
async function toggleMovieInteraction(movieId, title, posterPath, type) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('로그인이 필요합니다.');
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return null;
    }

    const endpoint = type === 'like'
        ? `${window.ACTIONS_URL}/movies/like`
        : `${window.ACTIONS_URL}/movies/bookmark`;
    const interactionTypeDisplay = type === 'like' ? '좋아요' : '북마크';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                movieId: String(movieId),
                title: title,
                posterPath: posterPath
            })
        });
        const responseData = await response.json();
        if (!response.ok) {
            console.error(`${interactionTypeDisplay} 요청 실패:`, response.status, responseData);
            alert(`${interactionTypeDisplay} 처리 중 오류: ${responseData.error || responseData.message || '알 수 없는 오류가 발생했습니다.'}`);
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            }
            return null;
        }
        return responseData;
    } catch (error) {
        console.error(`${interactionTypeDisplay} API 호출 중 네트워크 또는 JSON 파싱 오류:`, error);
        alert(`${interactionTypeDisplay} 처리 중 네트워크 오류가 발생했습니다.`);
        return null;
    }
}

// 영화 좋아요 토글 (변경 없음)
window.toggleMovieLike = async function(movieId, title, posterPath) {
    return await toggleMovieInteraction(movieId, title, posterPath, 'like');
};

// 영화 북마크 토글 (변경 없음)
window.toggleMovieBookmark = async function(movieId, title, posterPath) {
    return await toggleMovieInteraction(movieId, title, posterPath, 'bookmark');
};

// 좋아요한 영화 목록 가져오기 (변경 없음)
async function getLikedMovies() {
    const token = localStorage.getItem('token');
    if (!token) { console.warn('Token not found for getLikedMovies'); return null; }
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/liked`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('API 요청 실패');
        return await response.json();
    } catch (error) {
        console.error('좋아요한 영화 목록을 가져오는데 실패했습니다:', error);
        return { movies: [] };
    }
}
window.getLikedMovies = getLikedMovies;

// 북마크한 영화 목록 가져오기 (변경 없음)
async function getBookmarkedMovies() {
    const token = localStorage.getItem('token');
    if (!token) { console.warn('Token not found for getBookmarkedMovies'); return null; }
    try {
        const response = await fetch(`${window.MOVIES_API_URL}/bookmarked`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('API 요청 실패');
        return await response.json();
    } catch (error) {
        console.error('북마크한 영화 목록을 가져오는데 실패했습니다:', error);
        return { movies: [] };
    }
}
window.getBookmarkedMovies = getBookmarkedMovies;


// 추천 영화 가져오기 (변경 없음)
async function getRecommendedMovies(movieId) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=ko-KR`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            vote_average: movie.vote_average,
            release_date: movie.release_date
        }));
    } catch (error) {
        console.error('추천 영화를 가져오는데 실패했습니다:', error);
        return [];
    }
}
window.getRecommendedMovies = getRecommendedMovies;


// 인물 상세 정보 가져오기 (변경 없음)
async function getPersonDetails(personId) {
    try {
        const [korResponse, externalResponse, creditsResponse] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=ko-KR`),
            fetch(`${TMDB_BASE_URL}/person/${personId}/external_ids?api_key=${TMDB_API_KEY}`),
            fetch(`${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}&language=ko-KR`)
        ]);
        if (!korResponse.ok) throw new Error(`HTTP error! status: ${korResponse.status}`);
        const korData = await korResponse.json();
        const externalData = externalResponse.ok ? await externalResponse.json() : {};
        const creditsData = creditsResponse.ok ? await creditsResponse.json() : { cast: [], crew: [] };
        if (!korData.biography) {
            const engResponse = await fetch(`${TMDB_BASE_URL}/person/${personId}?api_key=${TMDB_API_KEY}&language=en-US`);
            if (engResponse.ok) korData.biography = (await engResponse.json()).biography;
        }
        const externalLinks = {
            instagram_id: externalData.instagram_id ? `https://www.instagram.com/${externalData.instagram_id}` : null,
            twitter_id: externalData.twitter_id ? `https://twitter.com/${externalData.twitter_id}` : null,
            facebook_id: externalData.facebook_id ? `https://www.facebook.com/${externalData.facebook_id}` : null,
            imdb_id: externalData.imdb_id ? `https://www.imdb.com/name/${externalData.imdb_id}` : null,
            homepage: korData.homepage || null
        };
        const actingCareer = creditsData.cast.filter(m => m.release_date).sort((a, b) => new Date(b.release_date) - new Date(a.release_date)).slice(0, 5).map(m => ({ id: m.id, title: m.title, character: m.character || '정보 없음', release_date: m.release_date, popularity: m.popularity, vote_average: m.vote_average }));
        return { ...korData, biography: korData.biography || '약력 정보가 없습니다.', external_links: externalLinks, acting_career: actingCareer };
    } catch (error) {
        console.error('인물 상세 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getPersonDetails = getPersonDetails;

// 인물의 출연작 정보 가져오기 (변경 없음)
async function getPersonMovieCredits(personId) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/person/${personId}/movie_credits?api_key=${TMDB_API_KEY}&language=ko-KR`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('인물의 출연작 정보를 가져오는데 실패했습니다:', error);
        throw error;
    }
}
window.getPersonMovieCredits = getPersonMovieCredits;

// 영화의 관련 시리즈 정보 가져오기 (변경 없음)
async function getMovieSeries(movieId) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=ko-KR&append_to_response=belongs_to_collection`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.belongs_to_collection) return null;
        const collectionResponse = await fetch(`${TMDB_BASE_URL}/collection/${data.belongs_to_collection.id}?api_key=${TMDB_API_KEY}&language=ko-KR`);
        if (!collectionResponse.ok) throw new Error(`HTTP error! status: ${collectionResponse.status}`);
        const collectionData = await collectionResponse.json();
        const sortedMovies = collectionData.parts.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
        return { id: collectionData.id, name: collectionData.name, overview: collectionData.overview, poster_path: collectionData.poster_path, movies: sortedMovies.map(m => ({ id: m.id, title: m.title, poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null, release_date: m.release_date, overview: m.overview })) };
    } catch (error) {
        console.error('시리즈 정보를 가져오는데 실패했습니다:', error);
        return null;
    }
}
window.getMovieSeries = getMovieSeries;


// --- 게시판 API 함수들 ---

// 게시글 목록 가져오기
async function getPosts(boardType, page = 1, limit = 10) {
    try {
        const response = await fetch(`${window.POSTS_API_URL}?type=${boardType}&page=${page}&limit=${limit}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `게시글 목록 로드 실패: ${response.status}` }));
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`${boardType} 게시판 목록을 가져오는데 실패했습니다:`, error);
        throw error;
    }
}
window.getPosts = getPosts;

// 특정 게시글 상세 정보 가져오기
async function getPostDetails(postId) {
    try {
        const response = await fetch(`${window.POSTS_API_URL}/${postId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `게시글 상세 정보 로드 실패: ${response.status}` }));
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`게시글(ID: ${postId}) 상세 정보를 가져오는데 실패했습니다:`, error);
        throw error;
    }
}
window.getPostDetails = getPostDetails;

// 새 게시글 작성
async function createPost(title, content, boardType) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('게시글을 작성하려면 로그인이 필요합니다.');
        localStorage.setItem('redirectAfterLogin', `write-post.html?type=${boardType}`); // 현재 글쓰기 페이지로 돌아오도록
        window.location.href = 'login.html';
        return null; // 여기서 함수 실행 중단
    }
    try {
        const response = await fetch(window.POSTS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content, boardType })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `게시글 작성 실패: ${response.status}` }));
            if (response.status === 401) { // 토큰 만료 또는 유효하지 않은 경우
                 alert('세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
                 localStorage.removeItem('token');
                 localStorage.setItem('redirectAfterLogin', `write-post.html?type=${boardType}`);
                 window.location.href = 'login.html';
                 return null;
            }
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('게시글 작성에 실패했습니다:', error);
        alert(`게시글 작성 오류: ${error.message}`);
        // throw error; // 여기서 에러를 다시 던지지 않으면 호출부에서 null을 받게 됨
        return null; // 오류 발생 시 null 반환 명시
    }
}
window.createPost = createPost;

// 게시글 좋아요 토글
async function togglePostLike(postId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('좋아요를 표시하려면 로그인이 필요합니다.');
        localStorage.setItem('redirectAfterLogin', window.location.href); // 현재 페이지(post-detail)로 돌아오도록
        window.location.href = 'login.html';
        return null;
    }
    try {
        const response = await fetch(`${window.POSTS_API_URL}/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `좋아요 처리 실패: ${response.status}` }));
             if (response.status === 401) {
                 alert('세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
                 localStorage.removeItem('token');
                 localStorage.setItem('redirectAfterLogin', window.location.href);
                 window.location.href = 'login.html';
                 return null;
            }
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`게시글(ID: ${postId}) 좋아요 처리에 실패했습니다:`, error);
        alert(`좋아요 처리 오류: ${error.message}`);
        return null;
    }
}
window.togglePostLike = togglePostLike;

// 댓글 작성
async function createComment(postId, content) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('댓글을 작성하려면 로그인이 필요합니다.');
        localStorage.setItem('redirectAfterLogin', window.location.href); // 현재 페이지(post-detail)로 돌아오도록
        window.location.href = 'login.html';
        return null;
    }
    try {
        const response = await fetch(`${window.POSTS_API_URL}/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `댓글 작성 실패: ${response.status}` }));
            if (response.status === 401) {
                 alert('세션이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
                 localStorage.removeItem('token');
                 localStorage.setItem('redirectAfterLogin', window.location.href);
                 window.location.href = 'login.html';
                 return null;
            }
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`게시글(ID: ${postId})에 댓글 작성 실패:`, error);
        alert(`댓글 작성 오류: ${error.message}`);
        return null;
    }
}
window.createComment = createComment;

// 댓글 목록 가져오기
async function getComments(postId, page = 1, limit = 10) {
    try {
        const response = await fetch(`${window.POSTS_API_URL}/${postId}/comments?page=${page}&limit=${limit}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `댓글 목록 로드 실패: ${response.status}` }));
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`게시글(ID: ${postId})의 댓글 목록을 가져오는데 실패했습니다:`, error);
        throw error; // 이 함수는 UI에서 직접 호출되므로 에러를 던져서 UI단에서 처리하도록 할 수 있음
    }
}
window.getComments = getComments;

// 페이지 로드 시 실행되던 DOMContentLoaded 이벤트 리스너는 각 HTML 파일로 이동하거나,
// 필요한 경우에만 실행하도록 변경합니다. 여기서는 로그인 상태만 반환하는 함수를 제공합니다.
// document.addEventListener('DOMContentLoaded', checkLoginStatusAndRedirect); // 이 줄은 주석 처리 또는 삭제