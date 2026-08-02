document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Custom Glowing Mouse Cursor Logic ---
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');

    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            // Move the inner dot instantly to mouse coordinates
            cursorDot.style.transform = `translate(${posX}px, ${posY}px)`;

            // Move the outer ring with a smooth trailing effect
            cursorOutline.animate({
                transform: `translate(${posX - 17}px, ${posY - 17}px)`
            }, { duration: 500, fill: "forwards" });
        });
    }

    // --- 2. Mobile Hamburger Menu Toggle ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // --- 3. Scroll Animation Observer ---
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(element => {
        observer.observe(element);
    });

    // --- 4. Dynamic Case Studies / Projects Loader ---
    const container = document.getElementById('projects-container');
    
    if (container) {
        fetch('projects.json')
            .then(response => response.json())
            .then(data => {
                data.forEach(project => {
                    const card = document.createElement('div');
                    card.classList.add('card', 'fade-in');

                    card.innerHTML = `
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                    `;

                    container.appendChild(card);
                    observer.observe(card); // Animate cards as they load into view
                });
            })
            .catch(error => console.error('Error loading the projects:', error));
    }
});