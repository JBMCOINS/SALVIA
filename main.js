// --- SÁLVIA PREMIUM INTERACTIVE LOGIC (GSAP POWERED) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Registro dos Plugins (Plugins Premium agora Gratuitos)
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin, TextPlugin);

    // 2. Inicialização do ScrollSmoother (Efeito Amanteigado)
    let smoother;
    try {
        smoother = ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 1.5,
            effects: true,
            normalizeScroll: true
        });
        document.body.classList.add('js-ready');
        console.log("Sálvia: GSAP Engine Ready");
        
        // 3. Navbar Scroll Effect (Ajustado para ScrollSmoother)
        const navbar = document.querySelector('.navbar');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    } catch (e) {
        document.body.classList.add('js-error');
        console.error("Sálvia: GSAP Init Error", e);
    }

    // 4. Hero Intro Animation (SplitText Power)
    const heroTl = gsap.timeline({ defaults: { ease: "expo.out" } });
    const heroTitle = new SplitText(".hero h1", { type: "words,chars" });
    const heroDesc = new SplitText(".hero p", { type: "lines" });

    heroTl.from(".navbar", { 
        y: -100, 
        opacity: 0, 
        duration: 1.5 
    })
    .from(".badge", { 
        opacity: 0, 
        x: -20, 
        duration: 0.8 
    }, "-=0.8")
    .from(heroTitle.chars, { 
        y: 100, 
        opacity: 0, 
        stagger: 0.02, 
        duration: 1.2,
        rotateX: -90,
        transformOrigin: "0% 50% -50"
    }, "-=0.6")
    .from(heroDesc.lines, { 
        y: 20, 
        opacity: 0, 
        stagger: 0.1, 
        duration: 1 
    }, "-=0.8")
    .from(".hero-cta", { 
        scale: 0.8, 
        opacity: 0, 
        duration: 1 
    }, "-=0.8")
    .from(".hero-image-wrapper", { 
        x: 100, 
        opacity: 0, 
        duration: 1.5,
        rotate: 5
    }, "-=1.2")
    .from(".metric-card", {
        scale: 0,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
    }, "-=0.5");

    // 5. Section Reveals (ScrollTrigger)
    const sections = document.querySelectorAll('section:not(#hero)');
    
    sections.forEach(section => {
        const title = section.querySelector('.section-title');
        const cards = section.querySelectorAll('.problema-card, .plano-card, .depoimento-card');
        const content = section.querySelector('.solucao-text, .solucao-img');

        if (title) {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: title,
                    start: "top 95%",
                    toggleActions: "play none none none"
                },
                y: 30,
                opacity: 0,
                duration: 1
            });
        }

        if (cards.length > 0) {
            gsap.from(cards, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 95%",
                },
                y: 30,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out"
            });
        }
    });

    // 6. Raio-X Interativo (Pinning + DrawSVG)
    const raioXSection = document.querySelector('.raio-x');
    if (raioXSection) {
        let mm = gsap.matchMedia();

        mm.add("(min-width: 993px)", () => {
            // Desktop: Pinning e Animação completa
            const raioXTL = gsap.timeline({
                scrollTrigger: {
                    trigger: ".raio-x",
                    start: "top top",
                    end: "+=2000",
                    pin: true,
                    scrub: 1,
                    anticipatePin: 1
                }
            });

            const labels = document.querySelectorAll('.x-label');
            labels.forEach((label, index) => {
                const point = label.getAttribute('data-point');
                const pathId = `#path-${point}`;
                gsap.set(pathId, { drawSVG: "0%" });
                raioXTL.to(pathId, { drawSVG: "100%", duration: 1 })
                       .to(label, { opacity: 1, x: 0, duration: 0.8 }, "-=0.5");
            });
        });

        mm.add("(max-width: 992px)", () => {
            // Mobile: Sem pinning, animações simples de entrada
            gsap.set(".x-label", { opacity: 1, x: 0 }); // Garantir visibilidade
            gsap.set(".connection-line", { display: "none" });
        });

        // Loop de pulso nos pontos (sempre ativo)
        gsap.to(".x-label .dot", {
            scale: 1.3,
            repeat: -1,
            yoyo: true,
            duration: 1,
            ease: "sine.inOut"
        });
    }

    // 7. Smooth Scroll with Offset (Ajustado para ScrollSmoother)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (smoother) {
                smoother.scrollTo(targetId, true, "top 80px");
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 8. Hover Magnification
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, { scale: 1.05, duration: 0.3 });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { scale: 1, duration: 0.3 });
        });
    });
});
