// MobileNewsSwip.js - 선교편지 인스타 스타일 카드 스와이프 테스트

document.addEventListener('DOMContentLoaded', function() {
  // 더미 데이터 (photo를 배열로 변경)
  const newsList = [
    {
      photo: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80'
      ],
      name: '홍길동',
      country: '대한민국',
      mission: '청년사역',
      content: '주님의 은혜로 청년들과 함께 성장하고 있습니다. 많은 기도 부탁드립니다.',
      date: '2024.07.01'
    },
    {
      photo: [
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80'
      ],
      name: '김선교',
      country: '일본',
      mission: '교회개척',
      content: '일본에서 새로운 교회가 세워지고 있습니다. 하나님의 인도하심에 감사드립니다.',
      date: '2024.06.28'
    },
    {
      photo: [
        'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
      ],
      name: '이사랑',
      country: '몽골',
      mission: '어린이사역',
      content: '몽골의 아이들과 함께 복음을 나누고 있습니다. 계속적인 관심과 기도 부탁드립니다.',
      date: '2024.06.25'
    },
    {
      photo: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
      ],
      name: '박단일',
      country: '태국',
      mission: '의료선교',
      content: '태국에서 의료봉사를 통해 하나님의 사랑을 전하고 있습니다. 사진이 1장뿐인 경우 테스트입니다.',
      date: '2024.06.20'
    }
  ];

  // 카드 HTML 생성 (내부 Swiper)
  function createCard(news, idx) {
    const photoSlides = (news.photo || []).slice(0,5).map(url =>
      `<div class="swiper-slide"><img class="news-card-photo" src="${url}" alt="사진"></div>`
    ).join('');
    return `
      <div class="news-card">
        <div class="news-photo-swiper swiper news-photo-swiper-${idx}">
          <div class="swiper-wrapper">
            ${photoSlides}
          </div>
          <div class="swiper-pagination"></div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
        </div>
        <div class="news-card-title">${news.name}</div>
        <div class="news-card-meta">📍 ${news.country} | ${news.mission}</div>
        <div class="news-card-content">${news.content}</div>
        <div class="news-card-date">${news.date}</div>
        <div class="news-card-bottom">
          <button class="news-card-original-btn">뉴스레터 원본보기</button>
        </div>
      </div>
    `;
  }

  // 카드 삽입
  const wrapper = document.getElementById('news-swiper-wrapper');
  wrapper.innerHTML = newsList.map((news, i) => `<div class="swiper-slide">${createCard(news, i)}</div>`).join('');

  // Swiper 초기화 (세로 스와이프)
  new Swiper('.swiper', {
    direction: 'vertical',
    slidesPerView: 1,
    spaceBetween: 30,
    mousewheel: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    on: {
      init: function() {
        // 각 카드별 내부(가로) Swiper 초기화
        newsList.forEach((news, i) => {
          const photoCount = (news.photo || []).length;
          
          new Swiper('.news-photo-swiper-' + i, {
            direction: 'horizontal',
            slidesPerView: 1,
            spaceBetween: 8,
            pagination: photoCount > 1 ? {
              el: '.news-photo-swiper-' + i + ' .swiper-pagination',
              clickable: true,
            } : false,
            navigation: photoCount > 1 ? {
              nextEl: '.news-photo-swiper-' + i + ' .swiper-button-next',
              prevEl: '.news-photo-swiper-' + i + ' .swiper-button-prev',
            } : false,
            effect: 'fade',
            fadeEffect: { crossFade: true },
            autoplay: photoCount > 1 ? {
              delay: 5000,
              disableOnInteraction: false,
            } : false,
            loop: photoCount > 1,
          });
          
          // 사진이 1장 이하일 때 네비게이션과 페이징 숨기기
          if (photoCount <= 1) {
            const swiperContainer = document.querySelector('.news-photo-swiper-' + i);
            if (swiperContainer) {
              const pagination = swiperContainer.querySelector('.swiper-pagination');
              const prevBtn = swiperContainer.querySelector('.swiper-button-prev');
              const nextBtn = swiperContainer.querySelector('.swiper-button-next');
              
              if (pagination) pagination.style.display = 'none';
              if (prevBtn) prevBtn.style.display = 'none';
              if (nextBtn) nextBtn.style.display = 'none';
            }
          }
        });
      }
    }
  });
}); 