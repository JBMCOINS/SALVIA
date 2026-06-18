// --- SÁLVIA PREMIUM INTERACTIVE LOGIC (GSAP POWERED) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Registro do ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 2. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Hero Initial Animation
    const heroTl = gsap.timeline({ defaults: { ease: "power4.out" } });

    heroTl.from('.navbar', { 
        y: -100, 
        opacity: 0, 
        duration: 1.2 
    })
    .from('.badge', { 
        opacity: 0, 
        x: -20, 
        duration: 0.8 
    }, "-=0.5")
    .from('.hero h1', { 
        y: 50, 
        opacity: 0, 
        duration: 1.2,
        skewY: 2
    }, "-=0.6")
    .from('.hero p', { 
        opacity: 0, 
        y: 20, 
        duration: 0.8 
    }, "-=0.8")
    .from('.hero-cta', { 
        scale: 0.8, 
        opacity: 0, 
        duration: 1 
    }, "-=0.6")
    .from('.hero-image-wrapper', { 
        x: 100, 
        opacity: 0, 
        duration: 1.5,
        rotate: 5
    }, "-=1.2")
    .from('.metric-card', {
        scale: 0,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
    }, "-=0.5");

    // 4. Section Reveals (ScrollTrigger) - Reforçado para evitar espaços em branco
    const sections = document.querySelectorAll('section:not(#hero)');
    
    sections.forEach(section => {
        const title = section.querySelector('.section-title');
        const cards = section.querySelectorAll('.problema-card, .plano-card, .depoimento-card');
        const content = section.querySelector('.solucao-text, .solucao-img');

        // Garantir que os elementos estejam visíveis inicialmente se o JS falhar (CSS)
        // Usamos GSAP para animar de forma segura
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

        if (cards.length > 0) {
            gsap.from(cards, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 95%",
                    toggleActions: "play none none none"
                },
                y: 30,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out"
            });
        }

        if (content) {
            gsap.from(content, {
                scrollTrigger: {
                    trigger: content,
                    start: "top 95%",
                },
                y: 20,
                duration: 1,
                stagger: 0.2
            });
        }
    });

    // 5. Benefits List Staggered Reveal
    gsap.from('.reveal-list', {
        scrollTrigger: {
            trigger: '.beneficios-lista',
            start: "top 85%"
        },
        x: -30,
        opacity: 0,
        stagger: 0.3,
        duration: 1,
        ease: "power3.out"
    });

    // 6. Smooth Scroll with Offset Logic
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight - 20;

                gsap.to(window, { 
                    duration: 1.5, 
                    scrollTo: targetPosition, 
                    ease: "power4.inOut" 
                });
            }
        });
    });

    // 7. Parallax Effect for Images
    gsap.to('.parallax-img', {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
            trigger: '.solucao',
            scrub: true
        }
    });

    // 8. Hover Magnification (Simples) em botões
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
