// ui/newsletterPopup.js
export function showNewsletter(newsletterUrlEncoded) {
    const url = decodeURIComponent(newsletterUrlEncoded);
    document.getElementById('newsletter-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'newsletter-overlay';
    overlay.innerHTML = `
        <div id="newsletter-content">
            <button id="newsletter-close-btn" title="닫기">✖</button>
            <div id="newsletter-media-area"></div>
        </div>`;
    document.body.appendChild(overlay);
    const area = overlay.querySelector('#newsletter-media-area');
    if (url.match(/\.(pdf)$/i)) {
        area.innerHTML = `
            <iframe src="https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}"
                    style="width:90vw; height:75vh;" frameborder="0" allowfullscreen></iframe>
            <div style="font-size:0.95em; color:#777; margin-top:6px;">
                PDF가 정상표시 안될 때
                <a href="${url}" target="_blank" style="color:#1574d4; text-decoration:underline;">새 창에서 열기</a>
            </div>`;
    }
    overlay.querySelector('#newsletter-close-btn').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}