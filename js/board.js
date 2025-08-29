// 로컬 스토리지에서 게시글 데이터를 관리하는 클래스
class BoardManager {
    constructor() {
        this.storageKey = 'cinex_posts';
        this.posts = this.loadPosts();
    }

    // 게시글 목록 로드
    loadPosts() {
        const savedPosts = localStorage.getItem(this.storageKey);
        if (!savedPosts) {
            // 초기 데이터
            const initialPosts = [
                {
                    id: 1,
                    type: 'review',
                    title: "영화 '듄: 파트2' 관람 후기",
                    content: "드니 빌뇌브 감독의 '듄: 파트2'를 관람했습니다. 첫 번째 파트에 이어 놀라운 비주얼과 웅장한 스케일로 관객들을 압도합니다. 특히 폴 아트레이데스의 성장과 프레멘과의 유대 관계가 인상적이었습니다. 사막의 웜과 전투 장면은 IMAX에서 봐야 제대로 된 감동을 느낄 수 있습니다.",
                    author: "movieLover",
                    date: "2024.03.15 15:00",
                    views: 156,
                    likes: 23,
                    likedBy: [],
                    comments: [
                        {
                            author: "cinephile",
                            content: "정말 좋은 리뷰네요! 저도 이번 주말에 보러 갈 예정입니다.",
                            date: "2024.03.15 15:30"
                        }
                    ]
                },
                {
                    id: 2,
                    type: 'info',
                    title: "이번 달 개봉 예정작 추천",
                    content: "3월에 개봉하는 기대작들을 정리해보았습니다. 특히 주목할 만한 작품은 '듄: 파트2', '고질라 X 콩: 뉴 엠파이어' 등이 있습니다.",
                    author: "cinephile",
                    date: "2024.03.14 10:00",
                    views: 98,
                    likes: 15,
                    likedBy: [],
                    comments: []
                }
            ];
            localStorage.setItem(this.storageKey, JSON.stringify(initialPosts));
            return initialPosts;
        }
        return JSON.parse(savedPosts);
    }

    // 게시글 저장
    savePosts() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.posts));
    }

    // 게시글 작성
    createPost(post) {
        const newPost = {
            ...post,
            id: this.posts.length > 0 ? Math.max(...this.posts.map(p => p.id)) + 1 : 1,
            date: new Date().toLocaleString(),
            views: 0,
            likes: 0,
            likedBy: [],
            comments: []
        };
        this.posts.unshift(newPost);
        this.savePosts();
        return newPost;
    }

    // 게시글 조회
    getPost(id) {
        const post = this.posts.find(p => p.id === id);
        if (post) {
            post.views++;
            this.savePosts();
        }
        return post;
    }

    // 게시글 목록 조회
    getPosts(type) {
        return type ? this.posts.filter(p => p.type === type) : this.posts;
    }

    // 게시글 검색
    searchPosts(query, type) {
        const searchRegex = new RegExp(query, 'i');
        return this.posts.filter(post => 
            (!type || post.type === type) &&
            (searchRegex.test(post.title) || searchRegex.test(post.content))
        );
    }

    // 좋아요 토글
    toggleLike(postId, userId = 'anonymous') {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            const likedIndex = post.likedBy.indexOf(userId);
            if (likedIndex === -1) {
                post.likedBy.push(userId);
                post.likes++;
            } else {
                post.likedBy.splice(likedIndex, 1);
                post.likes--;
            }
            this.savePosts();
            return post.likes;
        }
        return null;
    }

    // 댓글 작성
    addComment(postId, comment) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            const newComment = {
                ...comment,
                date: new Date().toLocaleString()
            };
            post.comments.unshift(newComment);
            this.savePosts();
            return newComment;
        }
        return null;
    }
}

// 전역 인스턴스 생성
window.boardManager = new BoardManager(); 