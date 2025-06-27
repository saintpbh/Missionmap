/**
 * 인사말 관리 클래스
 * 시간대별 다국어 인사말을 관리하고 표시합니다.
 */
class GreetingManager {
  constructor() {
    this.greetingsByTime = null;
    this.greetIdx = 0;
    this.greetTimer = null;
    this.lastTouchTime = Date.now();
    this.init();
  }

  async init() {
    try {
      await this.loadGreetings();
      this.setupEventListeners();
      this.showGreetingAnimated(0);
      this.autoGreetingLoop();
    } catch (error) {
      console.error('인사말 초기화 실패:', error);
    }
  }

  async loadGreetings() {
    try {
      const response = await fetch('js/greetings.json');
      this.greetingsByTime = await response.json();
    } catch (error) {
      console.error('인사말 데이터 로드 실패:', error);
      // 폴백 데이터
      this.greetingsByTime = {
        morning: [{ country: "한국", text: "좋은 아침입니다!" }],
        afternoon: [{ country: "한국", text: "좋은 오후입니다!" }],
        evening: [{ country: "한국", text: "좋은 저녁입니다!" }]
      };
    }
  }

  getTimePeriod() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  showGreetingAnimated(nextIdx = null) {
    const period = this.getTimePeriod();
    const arr = this.greetingsByTime[period];
    const greetElem = document.getElementById('greeting-text');
    
    if (!greetElem || !arr) return;

    greetElem.classList.remove('flip');
    void greetElem.offsetWidth; // reflow for restart animation
    
    if (nextIdx !== null) this.greetIdx = nextIdx;
    
    greetElem.classList.add('flip');
    
    setTimeout(() => {
      greetElem.textContent = `[${arr[this.greetIdx].country}] ${arr[this.greetIdx].text}`;
      greetElem.classList.remove('flip');
      
      // 시간대별 색상 클래스 적용
      greetElem.classList.remove('morning', 'afternoon', 'evening');
      greetElem.classList.add(period);
      
      this.greetIdx = (this.greetIdx + 1) % arr.length;
    }, 350);
  }

  autoGreetingLoop() {
    if (this.greetTimer) clearInterval(this.greetTimer);
    
    this.greetTimer = setInterval(() => {
      if (Date.now() - this.lastTouchTime >= 10000) {
        this.showGreetingAnimated();
      }
    }, 10000);
  }

  setupEventListeners() {
    const clockIcon = document.getElementById('clock-icon');
    const greetElem = document.getElementById('greeting-text');

    if (clockIcon) {
      clockIcon.style.cursor = 'pointer';
      clockIcon.addEventListener('click', () => this.handleUserInteraction());
      clockIcon.addEventListener('touchstart', () => this.handleUserInteraction());
    }

    if (greetElem) {
      greetElem.style.cursor = 'pointer';
      greetElem.addEventListener('click', () => this.handleUserInteraction());
      greetElem.addEventListener('touchstart', () => this.handleUserInteraction());
    }
  }

  handleUserInteraction() {
    this.lastTouchTime = Date.now();
    this.showGreetingAnimated();
  }

  destroy() {
    if (this.greetTimer) {
      clearInterval(this.greetTimer);
      this.greetTimer = null;
    }
  }
}

// 전역으로 내보내기
window.GreetingManager = GreetingManager; 