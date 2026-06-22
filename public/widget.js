/**
 * Soft Story 챗봇 임베드 위젯 — 어떤 사이트든 아래 한 줄로 우측 하단에 챗 버튼을 띄운다.
 *   <script src="https://pine-apple-web-chatbot.vercel.app/widget.js" defer></script>
 *
 * 동작: 플로팅 버튼('Ask AI') 클릭 → /embed(챗 UI)를 iframe 패널로 열고 닫는다.
 * 호스트 사이트 CSS와 충돌하지 않도록 모든 스타일을 인라인으로 지정한다.
 */
(function () {
  if (window.__softStoryChatLoaded) return;
  window.__softStoryChatLoaded = true;

  // 이 스크립트의 출처에서 /embed 를 연다 (배포 도메인이 바뀌어도 자동 추적).
  var origin = "https://pine-apple-web-chatbot.vercel.app";
  try {
    if (document.currentScript && document.currentScript.src) {
      origin = new URL(document.currentScript.src).origin;
    }
  } catch (e) {}
  var CHAT_URL = origin + "/embed";
  var ACCENT = "#ff8a3d";

  function init() {
    var Z = 2147483000;

    // 패널 (iframe 컨테이너)
    var panel = document.createElement("div");
    panel.style.cssText = [
      "position:fixed",
      "bottom:92px",
      "right:20px",
      "width:380px",
      "max-width:calc(100vw - 32px)",
      "height:600px",
      "max-height:calc(100vh - 120px)",
      "background:#1a1d24",
      "border-radius:16px",
      "overflow:hidden",
      "box-shadow:0 16px 48px rgba(0,0,0,.45)",
      "z-index:" + Z,
      "opacity:0",
      "transform:translateY(12px) scale(.98)",
      "pointer-events:none",
      "transition:opacity .2s ease, transform .2s ease",
    ].join(";");

    var iframe = document.createElement("iframe");
    iframe.src = CHAT_URL;
    iframe.title = "FineApple Voice 도우미";
    iframe.setAttribute("loading", "lazy");
    iframe.style.cssText = "width:100%;height:100%;border:0;display:block;";
    panel.appendChild(iframe);

    // 런처 버튼
    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "채팅 열기");
    btn.style.cssText = [
      "position:fixed",
      "bottom:20px",
      "right:20px",
      "height:52px",
      "padding:0 20px", // 알약형 버튼: 'Ask AI' 텍스트가 들어갈 가로 여백
      "border:0", // 단색(인디고) 버튼이라 테두리 제거
      "border-radius:999px", // 알약(pill) 모양
      "cursor:pointer",
      "background:#4f46e5", // 인디고 — 사이트 'indigo-600' 버튼 색
      "color:#ffffff", // 인디고 배경 위 흰 글자
      "font-size:16px",
      "font-weight:600",
      "line-height:1",
      "white-space:nowrap",
      "box-shadow:0 6px 20px rgba(0,0,0,.18)", // 흰 버튼에 맞춰 그림자 부드럽게
      "z-index:" + (Z + 1),
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "transition:transform .15s ease",
    ].join(";");
    btn.textContent = "Ask AI"; // 직관적인 텍스트 라벨
    btn.onmouseenter = function () {
      btn.style.transform = "scale(1.06)";
    };
    btn.onmouseleave = function () {
      btn.style.transform = "scale(1)";
    };

    var open = false;
    function setOpen(v) {
      open = v;
      panel.style.opacity = open ? "1" : "0";
      panel.style.transform = open
        ? "translateY(0) scale(1)"
        : "translateY(12px) scale(.98)";
      panel.style.pointerEvents = open ? "auto" : "none";
      btn.textContent = open ? "✕" : "Ask AI";
      btn.setAttribute("aria-label", open ? "채팅 닫기" : "채팅 열기");
    }
    btn.addEventListener("click", function () {
      setOpen(!open);
    });
    // ESC로 닫기
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setOpen(false);
    });

    document.body.appendChild(panel);
    document.body.appendChild(btn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
