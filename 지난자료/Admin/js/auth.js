document.addEventListener('DOMContentLoaded', function () {
    const auth = firebase.auth();

    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const errorMessage = document.getElementById('error-message');

    /**
     * 로그인 처리
     */
    const handleLogin = async (email, password) => {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            // 로그인 성공 시 body 스타일 복구
            document.body.style.display = 'flex';
            document.body.style.justifyContent = 'center';
            document.body.style.alignItems = 'center';
            document.body.style.height = '100vh';
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Login failed:', error);
            if (errorMessage) {
                errorMessage.textContent = '이메일 또는 비밀번호가 잘못되었습니다.';
                errorMessage.style.display = 'block';
            }
        }
    };

    /**
     * 로그아웃 처리
     */
    const handleLogout = async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    /**
     * 페이지 접근 제어
     * 로그인이 되어있지 않거나, 어드민 권한이 없으면 로그인 페이지로 리디렉션
     */
    const protectPage = () => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                // 사용자가 로그인한 경우
                const idTokenResult = await user.getIdTokenResult();
                // 커스텀 클레임에 admin: true가 있는지 확인
                if (idTokenResult.claims.admin) {
                    // 어드민이 맞으면 페이지 내용을 보여줌
                    document.body.style.display = 'block'; 
                } else {
                    // 어드민이 아니면 로그아웃 처리 후 로그인 페이지로
                    alert('접근 권한이 없습니다. 관리자에게 문의하세요.');
                    await handleLogout();
                }
            } else {
                // 사용자가 로그인하지 않은 경우
                window.location.href = 'index.html';
            }
        });
    };

    // --- 스크립트 실행 분기 ---
    
    // 현재 페이지가 로그인 페이지인 경우
    if (window.location.pathname.endsWith('index.html')) {
        // 이미 로그인된 사용자는 대시보드로 리디렉션
        auth.onAuthStateChanged(user => {
            if (user) {
                window.location.href = 'dashboard.html';
            }
        });

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                handleLogin(email, password);
            });
        }
    } 
    // 그 외 관리자 페이지인 경우
    else {
        // 페이지 접근 제어 실행
        protectPage();

        // 로그아웃 버튼에 이벤트 리스너 추가
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    }
}); 