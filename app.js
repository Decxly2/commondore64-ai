/**
 * Commodore 64 & AI-Historia - Ultra-High Performance & Smooth Scrolling
 * Zero CPU thrashing, GPU-composited animations, 120 FPS.
 */

document.addEventListener("DOMContentLoaded", () => {
    initStarfield();
    initScrollReveal();
    initCounterAnimation();
    initFooterActions();
    initReadingProgressBar();
    initNavScrollSpy();
    initCopyQuote();
});

/**
 * Lättviktigt stjärnfält utan CPU-krävande shadowBlur för silkeslen prestanda
 */
function initStarfield() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Endast 45 skarpa stjärnor för noll lagg
    const starCount = 45;
    const stars = [];

    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.3 + 0.4,
            alpha: Math.random() * 0.7 + 0.2,
            twinkleSpeed: Math.random() * 0.015 + 0.005,
            vx: (Math.random() - 0.5) * 0.1,
            vy: -Math.random() * 0.2 - 0.04
        });
    }

    let animationFrameId;
    let isVisible = true;

    // Pausa när fliken inte är aktiv
    document.addEventListener("visibilitychange", () => {
        isVisible = !document.hidden;
        if (isVisible) render();
    });

    function render() {
        if (!isVisible) return;

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];

            s.x += s.vx;
            s.y += s.vy;

            if (s.y < 0) s.y = height;
            if (s.x < 0) s.x = width;
            if (s.x > width) s.x = 0;

            s.alpha += Math.sin(Date.now() * s.twinkleSpeed) * 0.008;
            const currentAlpha = Math.max(0.2, Math.min(0.85, s.alpha));

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
            ctx.fill();
        }

        animationFrameId = requestAnimationFrame(render);
    }

    render();

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }, { passive: true });
}

/**
 * Smidig skroll-inladdning: Endast hårdvaruaccelererad opacity & translateY
 */
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-revealed");
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const items = document.querySelectorAll(
        ".section-header, .stat-card, .feature-box, .info-widget, .compare-card, .reflection-card"
    );

    items.forEach((el) => {
        el.classList.add("reveal-item");

        const parent = el.parentElement;
        if (parent && (
            parent.classList.contains("stats-grid") ||
            parent.classList.contains("compare-grid") ||
            parent.classList.contains("reflection-wrapper") ||
            parent.classList.contains("editorial-main") ||
            parent.classList.contains("editorial-sidebar")
        )) {
            const siblings = Array.from(parent.children);
            const index = siblings.indexOf(el);
            el.style.transitionDelay = `${index * 90}ms`;
        }

        observer.observe(el);
    });
}

/**
 * Räknaranimation för statistik
 */
function initCounterAnimation() {
    const statElements = document.querySelectorAll(".stat-num");
    if (!statElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.getAttribute("data-target"));
                const prefix = el.getAttribute("data-prefix") || "";
                const suffix = el.getAttribute("data-suffix") || "";
                const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);

                if (isNaN(target)) return;

                const duration = 1400;
                const startTime = performance.now();

                function updateNumber(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    const currentVal = target * easeOut;

                    el.textContent = `${prefix}${currentVal.toFixed(decimals)}${suffix}`;

                    if (progress < 1) {
                        requestAnimationFrame(updateNumber);
                    } else {
                        el.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
                    }
                }

                requestAnimationFrame(updateNumber);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.3 });

    statElements.forEach((el) => observer.observe(el));
}

/**
 * Läs-progressindikator i överkant av sidan (optimerad med requestAnimationFrame)
 */
function initReadingProgressBar() {
    const progressBar = document.getElementById("readingProgress");
    if (!progressBar) return;

    let ticking = false;

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = (scrollTop / (docHeight || 1)) * 100;
                progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/**
 * Automatisk markering av aktiv sektion i navigationsmenyn
 */
function initNavScrollSpy() {
    const sections = document.querySelectorAll("header, section");
    const navLinks = document.querySelectorAll(".nav-links a:not(.nav-btn)");

    let ticking = false;

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                let currentSectionId = "";
                const scrollPos = window.scrollY + 180;

                sections.forEach((section) => {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.offsetHeight;

                    if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                        currentSectionId = section.getAttribute("id");
                    }
                });

                navLinks.forEach((link) => {
                    link.classList.remove("active");
                    if (currentSectionId && link.getAttribute("href") === `#${currentSectionId}`) {
                        link.classList.add("active");
                    }
                });
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/**
 * Kopiera citat till urklipp
 */
function initCopyQuote() {
    const copyBtn = document.getElementById("copyQuoteBtn");
    const quoteEl = document.getElementById("c64Quote");

    if (!copyBtn || !quoteEl) return;

    copyBtn.addEventListener("click", async () => {
        const textToCopy = quoteEl.innerText.trim();
        try {
            await navigator.clipboard.writeText(textToCopy);
            copyBtn.textContent = "Kopierat!";
            copyBtn.classList.add("copied");

            setTimeout(() => {
                copyBtn.textContent = "Kopiera";
                copyBtn.classList.remove("copied");
            }, 2500);
        } catch (err) {
            copyBtn.textContent = "Kunde inte kopiera";
            setTimeout(() => {
                copyBtn.textContent = "Kopiera";
            }, 2000);
        }
    });
}

/**
 * Footer-knappar: Scrolla till toppen samt slumpa intressant C64-fakta
 */
function initFooterActions() {
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    const facts = [
        "C64 är listad i Guinness Rekordbok som historiens bäst säljande enskilda datormodell med nästan 17 miljoner exemplar!",
        "Ljudchippet SID 6581 var så avancerat att musiker än idag använder gamla C64:or som synthesizers i elektronisk musik.",
        "Under CES 1982 trodde konkurrenterna knappt sina ögon när Commodore presenterade priset på $595 för en dator med hela 64 KB RAM.",
        "Många tidiga C64-spel hade 'AI' som inte var mer än 10–20 rader assembler-kod som växlade mellan tre fasta beteenden.",
        "Över 10 000 kommersiella programvaror och spel utvecklades för Commodore 64 under dess aktiva livstid."
    ];

    const triviaBtn = document.getElementById("triviaBtn");
    const triviaToast = document.getElementById("triviaToast");
    let toastTimeout;

    if (triviaBtn && triviaToast) {
        triviaBtn.addEventListener("click", () => {
            const randomFact = facts[Math.floor(Math.random() * facts.length)];
            triviaToast.innerHTML = `<strong>Visste du att...</strong><br>${randomFact}`;
            triviaToast.classList.add("show");

            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                triviaToast.classList.remove("show");
            }, 5000);
        });
    }
}
