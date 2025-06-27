class FlipClock {
  constructor(container) {
    this.container = container;
    this.currentTime = { h1: '0', h2: '0', m1: '0', m2: '0', s1: '0', s2: '0' };
    this.init();
  }

  init() {
    this.createClockStructure();
    this.updateTime();
    this.startClock();
  }

  createClockStructure() {
    this.container.innerHTML = `
      <div class="flip-clock">
        <div class="flip-digit" data-digit="h1">
          <div class="flip-card">
            <span class="flip-number">0</span>
          </div>
        </div>
        
        <div class="flip-digit" data-digit="h2">
          <div class="flip-card">
            <span class="flip-number">0</span>
          </div>
        </div>
        
        <div class="flip-digit" data-digit="m1">
          <div class="flip-card">
            <span class="flip-number">0</span>
          </div>
        </div>
        
        <div class="flip-digit" data-digit="m2">
          <div class="flip-card">
            <span class="flip-number">0</span>
          </div>
        </div>
        
        <div class="flip-digit" data-digit="s1">
          <div class="flip-card">
            <span class="flip-number">0</span>
          </div>
        </div>
        
        <div class="flip-digit" data-digit="s2">
          <div class="flip-card">
            <span class="flip-number">0</span>
          </div>
        </div>
      </div>
    `;
  }

  updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const newTime = {
      h1: hours[0],
      h2: hours[1],
      m1: minutes[0],
      m2: minutes[1],
      s1: seconds[0],
      s2: seconds[1]
    };

    // 각 자릿수가 변경된 경우에만 플립 애니메이션 실행
    Object.keys(newTime).forEach(digit => {
      if (newTime[digit] !== this.currentTime[digit]) {
        this.flipDigit(digit, newTime[digit]);
      }
    });

    this.currentTime = newTime;
  }

  flipDigit(digit, newValue) {
    const digitElement = this.container.querySelector(`[data-digit="${digit}"]`);
    const flipNumber = digitElement.querySelector('.flip-number');
    
    if (flipNumber) {
      flipNumber.textContent = newValue;
    }
  }

  startClock() {
    // 즉시 시간 업데이트
    this.updateTime();
    // 1초마다 업데이트
    setInterval(() => {
      this.updateTime();
    }, 1000);
  }
}

// 전역으로 내보내기
window.FlipClock = FlipClock; 