// 국가별 배경 사진 관리 시스템
const CountryBackgrounds = {
    // 선교사가 파송된 국가들의 고품질 배경 사진 (Unsplash 무료 이미지)
    backgrounds: {
        '미국': {
            url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80',
            alt: '미국 뉴욕 맨해튼 스카이라인',
            credit: 'Unsplash'
        },
        '일본': {
            url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80',
            alt: '일본 후지산과 벚꽃',
            credit: 'Unsplash'
        },
        '중국': {
            url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
            alt: '중국 만리장성',
            credit: 'Unsplash'
        },
        '인도': {
            url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
            alt: '인도 타지마할',
            credit: 'Unsplash'
        },
        '태국': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '태국 방콕 사원',
            credit: 'Unsplash'
        },
        '베트남': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '베트남 하롱베이',
            credit: 'Unsplash'
        },
        '캄보디아': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '캄보디아 앙코르와트',
            credit: 'Unsplash'
        },
        '라오스': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '라오스 루앙프라방',
            credit: 'Unsplash'
        },
        '미얀마': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '미얀마 양곤',
            credit: 'Unsplash'
        },
        '네팔': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '네팔 히말라야',
            credit: 'Unsplash'
        },
        '몽골': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '몽골 초원',
            credit: 'Unsplash'
        },
        '러시아': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '러시아 모스크바',
            credit: 'Unsplash'
        },
        '우즈베키스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '우즈베키스탄 사마르칸트',
            credit: 'Unsplash'
        },
        '카자흐스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '카자흐스탄 아스타나',
            credit: 'Unsplash'
        },
        '키르기스스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '키르기스스탄 산맥',
            credit: 'Unsplash'
        },
        '타지키스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '타지키스탄 파미르 고원',
            credit: 'Unsplash'
        },
        '아프가니스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '아프가니스탄 카불',
            credit: 'Unsplash'
        },
        '파키스탄': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '파키스탄 이슬라마바드',
            credit: 'Unsplash'
        },
        '방글라데시': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '방글라데시 다카',
            credit: 'Unsplash'
        },
        '스리랑카': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '스리랑카 콜롬보',
            credit: 'Unsplash'
        },
        '몰디브': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '몰디브 말레',
            credit: 'Unsplash'
        },
        '필리핀': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '필리핀 마닐라',
            credit: 'Unsplash'
        },
        '말레이시아': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '말레이시아 쿠알라룸푸르',
            credit: 'Unsplash'
        },
        '싱가포르': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '싱가포르 마리나베이',
            credit: 'Unsplash'
        },
        '인도네시아': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '인도네시아 발리',
            credit: 'Unsplash'
        },
        '브루나이': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '브루나이 반다르스리브가완',
            credit: 'Unsplash'
        },
        '동티모르': {
            url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
            alt: '동티모르 딜리',
            credit: 'Unsplash'
        }
    },

    // 기본 배경 (국가 정보가 없거나 매칭되지 않을 때)
    defaultBackground: {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
        alt: '세계지도 배경',
        credit: 'Unsplash'
    },

    // 국가명 정규화 (다양한 표기법을 통일)
    normalizeCountryName(countryName) {
        if (!countryName) return null;
        
        const normalized = countryName.trim();
        const mappings = {
            'USA': '미국',
            'United States': '미국',
            'America': '미국',
            'Japan': '일본',
            'China': '중국',
            'India': '인도',
            'Thailand': '태국',
            'Vietnam': '베트남',
            'Cambodia': '캄보디아',
            'Laos': '라오스',
            'Myanmar': '미얀마',
            'Nepal': '네팔',
            'Mongolia': '몽골',
            'Russia': '러시아',
            'Uzbekistan': '우즈베키스탄',
            'Kazakhstan': '카자흐스탄',
            'Kyrgyzstan': '키르기스스탄',
            'Tajikistan': '타지키스탄',
            'Afghanistan': '아프가니스탄',
            'Pakistan': '파키스탄',
            'Bangladesh': '방글라데시',
            'Sri Lanka': '스리랑카',
            'Maldives': '몰디브',
            'Philippines': '필리핀',
            'Malaysia': '말레이시아',
            'Singapore': '싱가포르',
            'Indonesia': '인도네시아',
            'Brunei': '브루나이',
            'East Timor': '동티모르',
            'Timor-Leste': '동티모르'
        };

        return mappings[normalized] || normalized;
    },

    // 국가별 배경 사진 가져오기
    getBackground(countryName) {
        const normalizedCountry = this.normalizeCountryName(countryName);
        
        if (normalizedCountry && this.backgrounds[normalizedCountry]) {
            return this.backgrounds[normalizedCountry];
        }
        
        return this.defaultBackground;
    },

    // 배경 사진 URL만 가져오기
    getBackgroundUrl(countryName) {
        return this.getBackground(countryName).url;
    },

    // 배경 사진 미리 로드 (성능 최적화)
    preloadBackgrounds() {
        console.log('국가별 배경 사진 미리 로드 시작...');
        
        Object.values(this.backgrounds).forEach(background => {
            const img = new Image();
            img.src = background.url;
        });
        
        // 기본 배경도 미리 로드
        const defaultImg = new Image();
        defaultImg.src = this.defaultBackground.url;
        
        console.log('국가별 배경 사진 미리 로드 완료');
    },

    // 동적으로 배경 설정
    setBackground(element, countryName, options = {}) {
        const background = this.getBackground(countryName);
        const {
            overlay = 'rgba(0, 0, 0, 0.4)',
            blur = '0px',
            transition = 'background-image 0.5s ease-in-out'
        } = options;

        element.style.transition = transition;
        element.style.backgroundImage = `
            linear-gradient(${overlay}, ${overlay}),
            url('${background.url}')
        `;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.style.backgroundRepeat = 'no-repeat';
        
        if (blur !== '0px') {
            element.style.backdropFilter = `blur(${blur})`;
        }
    },

    // 카드별 배경 설정 (모바일 스와이퍼용)
    setCardBackground(cardElement, missionary) {
        const countryName = missionary.country;
        const background = this.getBackground(countryName);
        
        // 카드에 배경 이미지 설정
        cardElement.style.backgroundImage = `
            linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)),
            url('${background.url}')
        `;
        cardElement.style.backgroundSize = 'cover';
        cardElement.style.backgroundPosition = 'center';
        
        // 카드에 국가 정보 저장
        cardElement.dataset.country = countryName;
        cardElement.dataset.backgroundAlt = background.alt;
    },

    // 사용 가능한 국가 목록 가져오기
    getAvailableCountries() {
        return Object.keys(this.backgrounds);
    },

    // 데이터에서 실제 사용되는 국가들 확인
    getUsedCountries(missionaries) {
        const usedCountries = new Set();
        
        missionaries.forEach(missionary => {
            if (missionary.country) {
                const normalized = this.normalizeCountryName(missionary.country);
                if (normalized) {
                    usedCountries.add(normalized);
                }
            }
        });
        
        return Array.from(usedCountries);
    }
};

// 전역에서 사용할 수 있도록 등록
window.CountryBackgrounds = CountryBackgrounds;

console.log('CountryBackgrounds 모듈 로드 완료'); 