// prok-pages/js/utils.js

// 날짜 포맷팅 함수
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 텍스트 길이 제한 함수
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// 안전한 HTML 이스케이프
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 로딩 스피너 표시/숨김
function showLoading(element) {
    if (element) {
        element.innerHTML = '<div class="loading-spinner">로딩 중...</div>';
    }
}

function hideLoading(element) {
    if (element && element.querySelector('.loading-spinner')) {
        element.querySelector('.loading-spinner').remove();
    }
}

// 에러 메시지 표시
function showError(message, element) {
    if (element) {
        element.innerHTML = `<div class="error-message">${escapeHtml(message)}</div>`;
    }
    console.error('Error:', message);
}

// 성공 메시지 표시
function showSuccess(message, element) {
    if (element) {
        element.innerHTML = `<div class="success-message">${escapeHtml(message)}</div>`;
    }
    console.log('Success:', message);
}

// 디바이스 타입 확인
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid() {
    return /Android/.test(navigator.userAgent);
}

// 로컬 스토리지 유틸리티
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },
    
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    }
};

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 스로틀 함수
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 랜덤 ID 생성
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// URL 파라미터 파싱
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// URL 파라미터 설정
function setUrlParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.replaceState({}, '', url);
}

// 전화번호 포맷팅
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
}

// 이메일 유효성 검사
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 전화번호 유효성 검사
function isValidPhone(phone) {
    const phoneRegex = /^[0-9-+\s()]+$/;
    return phoneRegex.test(phone);
}

// 숫자 포맷팅 (천 단위 콤마)
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 시간 경과 표시
function timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
    return `${Math.floor(diffInSeconds / 31536000)}년 전`;
}

// 클립보드 복사
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Clipboard copy failed:', error);
        return false;
    }
}

// 모바일 브라우저에서 뒤로가기 감지
function onBackButton(callback) {
    if (window.history && window.history.pushState) {
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', function() {
            callback();
        });
    }
}

// 화면 방향 변경 감지
function onOrientationChange(callback) {
    window.addEventListener('orientationchange', callback);
}

// 네트워크 상태 감지
function onNetworkChange(callback) {
    if ('onLine' in navigator) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    }
}

// 뷰포트 크기 변경 감지
function onViewportChange(callback) {
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            callback({
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 250);
    });
}

// 전역 유틸리티 객체
window.Utils = {
    formatDate,
    truncateText,
    escapeHtml,
    showLoading,
    hideLoading,
    showError,
    showSuccess,
    isMobile,
    isIOS,
    isAndroid,
    Storage,
    debounce,
    throttle,
    generateId,
    getUrlParameter,
    setUrlParameter,
    formatPhoneNumber,
    isValidEmail,
    isValidPhone,
    formatNumber,
    formatFileSize,
    timeAgo,
    copyToClipboard,
    onBackButton,
    onOrientationChange,
    onNetworkChange,
    onViewportChange
}; 