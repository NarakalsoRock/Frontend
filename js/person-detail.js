document.addEventListener('DOMContentLoaded', async () => {
    try {
        // URL에서 인물 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const personId = urlParams.get('id');

        if (!personId) {
            throw new Error('인물 ID가 없습니다.');
        }

        // 인물 상세 정보와 출연작 정보 동시에 가져오기
        const [personData, movieCredits] = await Promise.all([
            getPersonDetails(personId),
            getPersonMovieCredits(personId)
        ]);

        // 인물 정보 업데이트
        updatePersonDetails(personData);
        
        // 출연작 업데이트
        updateMainWorks(movieCredits);

    } catch (error) {
        console.error('인물 상세 정보 로딩 중 오류 발생:', error);
        // 에러 메시지 표시
        const personDetailSection = document.querySelector('.person-detail-wrapper');
        if (personDetailSection) {
            personDetailSection.innerHTML = `
                <div class="error-message">
                    <p>죄송합니다. 정보를 불러오는 중 오류가 발생했습니다.</p>
                    <p>잠시 후 다시 시도해 주세요.</p>
                </div>
            `;
        }
    }
});

// 인물 상세 정보 업데이트 함수
function updatePersonDetails(person) {
    // 프로필 이미지 업데이트
    const profileImage = document.querySelector('.person-profile-image');
    if (profileImage) {
        profileImage.src = person.profile_path 
            ? `https://image.tmdb.org/t/p/w300${person.profile_path}`
            : 'https://placehold.co/307x460';
        profileImage.alt = person.name;
    }

    // 이름 업데이트
    const nameElement = document.querySelector('.person-name');
    if (nameElement) {
        nameElement.textContent = person.name;
    }

    // 인물 정보 업데이트
    const infoContent = document.querySelector('.person-info-content');
    if (infoContent) {
        infoContent.innerHTML = `
            활동명: ${person.name} <br/>
            성별: ${person.gender === 1 ? '여성' : '남성'}<br/>
            국적: ${person.place_of_birth || '정보 없음'}<br/>
            생년월일: ${formatDate(person.birthday) || '정보 없음'}<br/>
            주요 활동 분야: ${person.known_for_department || '정보 없음'}<br/>
            ${person.deathday ? `사망일: ${formatDate(person.deathday)}<br/>` : ''}
        `;
    }

    // 약력 업데이트
    const biographyContent = document.querySelector('.person-biography-content');
    if (biographyContent) {
        biographyContent.textContent = person.biography || '약력 정보가 없습니다.';
    }

    // 연기 경력 업데이트
    const awardsContent = document.querySelector('.person-awards-content');
    if (awardsContent) {
        if (!person.acting_career || person.acting_career.length === 0) {
            awardsContent.innerHTML = '<p class="no-career">연기 경력이 없습니다.</p>';
            return;
        }

        const careerHTML = person.acting_career.map(movie => {
            const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '정보 없음';
            const rating = movie.vote_average ? `평점 ${movie.vote_average.toFixed(1)}` : '';
            
            return `
                <a href="movie-detail.html?id=${movie.id}" class="career-item">
                    <div class="career-year">${year}</div>
                    <div class="career-info">
                        <div class="career-title">${movie.title}</div>
                        <div class="career-role">${movie.character}</div>
                        ${rating ? `<div class="career-rating">${rating}</div>` : ''}
                    </div>
                </a>
            `;
        }).join('');

        awardsContent.innerHTML = careerHTML;
    }

    // 공식 사이트 업데이트
    const officialSiteIcons = document.querySelector('.official-site-icons');
    if (officialSiteIcons && person.external_links) {
        const links = [];
        
        // Instagram
        if (person.external_links.instagram_id) {
            links.push(`
                <a href="${person.external_links.instagram_id}" target="_blank" class="official-site-icon" title="Instagram">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                </a>
            `);
        }
        
        // Twitter
        if (person.external_links.twitter_id) {
            links.push(`
                <a href="${person.external_links.twitter_id}" target="_blank" class="official-site-icon" title="Twitter">
                    <svg viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                </a>
            `);
        }
        
        // Facebook
        if (person.external_links.facebook_id) {
            links.push(`
                <a href="${person.external_links.facebook_id}" target="_blank" class="official-site-icon" title="Facebook">
                    <svg viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </a>
            `);
        }
        
        // IMDb
        if (person.external_links.imdb_id) {
            links.push(`
                <a href="${person.external_links.imdb_id}" target="_blank" class="official-site-icon" title="IMDb">
                    <svg viewBox="0 0 24 24">
                        <path d="M14.31 9.588v.005c-.077-.048-.227-.07-.42-.07v4.815c.222 0 .374-.023.46-.07.086-.044.128-.12.128-.224V9.777c0-.103-.037-.177-.168-.189zm-2.368 3.024h-.85v-3.09h.85v3.09zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM10.722 8.91h-1.224l-1.34 4.916-.822-4.916H6.288l-.936 4.916-.792-4.916H3.288l1.557 6.066h1.464l.936-4.836.852 4.836h1.483l1.143-6.066zm3.754 6.066h1.373v-6.066h-1.373v6.066zm5.051-6.066h-1.557v6.066h1.373v-4.526l1.016 4.526h1.246l1.005-4.44v4.44h1.373v-6.066h-1.557l-1.225 4.738-1.674-4.738z"/>
                    </svg>
                </a>
            `);
        }
        
        // 공식 홈페이지
        if (person.external_links.homepage) {
            links.push(`
                <a href="${person.external_links.homepage}" target="_blank" class="official-site-icon" title="Homepage">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1 16.947V21h-2v-4.053c-3.94-.495-7-3.858-7-7.947h2c0 3.309 2.691 6 6 6s6-2.691 6-6h2c0 4.089-3.06 7.452-7 7.947zM12 11c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2z"/>
                    </svg>
                </a>
            `);
        }

        // 링크가 있는 경우에만 표시
        if (links.length > 0) {
            officialSiteIcons.innerHTML = links.join('');
        } else {
            officialSiteIcons.innerHTML = '<p class="no-links">공식 사이트 정보가 없습니다.</p>';
        }
    }
}

// 수상 정보 업데이트 함수
function updateAwards(awards) {
    const awardsSection = document.querySelector('.person-awards-content');
    if (!awardsSection) return;

    if (!awards || awards.length === 0) {
        awardsSection.innerHTML = '<p class="no-awards">수상 이력이 없습니다.</p>';
        return;
    }

    const awardsHTML = awards.map(award => `
        <div class="award-item">
            <div class="award-title">${award.title} (${award.year})</div>
            <div class="award-role">${award.character}</div>
            <div class="award-info">
                ${award.awards.map(awardName => `
                    <span class="award-badge">${awardName}</span>
                `).join('')}
            </div>
        </div>
    `).join('');

    awardsSection.innerHTML = awardsHTML;
}

// 주요 작품 업데이트 함수
function updateMainWorks(credits) {
    const mainWorksGrid = document.querySelector('.main-works-grid');
    if (!mainWorksGrid || !credits.cast) return;

    // 출연작을 인기도 순으로 정렬
    const sortedMovies = credits.cast
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 6); // 상위 6개만 표시

    mainWorksGrid.innerHTML = sortedMovies.map(movie => `
        <a href="movie-detail.html?id=${movie.id}" class="movie-item">
            <img src="${movie.poster_path 
                ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
                : 'https://placehold.co/163x245'}" 
                alt="${movie.title} 포스터" 
                class="movie-poster" />
            <div class="movie-title">${movie.title}</div>
        </a>
    `).join('');
}

// 날짜 포맷 함수
function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
} 