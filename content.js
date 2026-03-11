// Scan for game engine signatures
const signatures = ['unity-container', 'phaser', 'canvas-game', 'webgl-content'];

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            signatures.forEach(sig => {
                if (document.body.innerHTML.toLowerCase().includes(sig)) {
                    // Trigger a "Block Screen" overlay
                    document.body.innerHTML = `
                        <div style="background:black; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
                            <h1>🚫 Access Denied</h1>
                            <p>Billy Blocksi detected an unauthorized Game Engine on this page.</p>
                            <button onclick="window.location.href='https://google.com'">Return to Work</button>
                        </div>
                    `;
                    observer.disconnect();
                }
            });
        }
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
