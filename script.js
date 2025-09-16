// Ripple animation function
function createRippleAnimation(x, y, targetTheme, callback) {
    // Create ripple container using Tailwind classes
    const rippleContainer = document.createElement('div');
    rippleContainer.className = 'fixed inset-0 w-screen h-screen pointer-events-none z-[1000] overflow-hidden';
    document.body.appendChild(rippleContainer);

    // Create ripple circle using Tailwind classes
    const ripple = document.createElement('div');
    const bgColor = targetTheme === 'dark' ? 'bg-black' : 'bg-gray-50';
    ripple.className = `absolute rounded-full scale-0 opacity-0 ${bgColor}`;

    // Calculate the maximum distance to cover the entire screen
    const maxDistance = Math.sqrt(
        Math.pow(Math.max(x, window.innerWidth - x), 2) +
        Math.pow(Math.max(y, window.innerHeight - y), 2)
    );

    // Set initial position and size
    const size = maxDistance * 2;
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = (x - size / 2) + 'px';
    ripple.style.top = (y - size / 2) + 'px';

    rippleContainer.appendChild(ripple);

    // Start ripple animation and theme change simultaneously for smooth transition
    setTimeout(() => {
        ripple.classList.add('ripple-animate');
        // Execute callback immediately to start theme transition alongside ripple
        callback();
    }, 10);

    // Clean up after animation completes
    setTimeout(() => {
        document.body.removeChild(rippleContainer);
    }, 800);
}

// Theme toggle functionality
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) {
        console.error('Theme toggle button not found');
        return;
    }

    const html = document.documentElement;

    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    console.log('Saved theme:', savedTheme);
    console.log('System prefers dark:', systemPrefersDark);

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        html.classList.add('dark');
        console.log('Applied dark theme');
    } else {
        html.classList.remove('dark');
        console.log('Applied light theme');
    }

    // Theme toggle event listener with ripple animation
    themeToggle.addEventListener('click', function() {
        console.log('Theme toggle clicked');

        // Get the button position for ripple origin
        const rect = themeToggle.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Determine if switching to dark or light
        const isDarkMode = html.classList.contains('dark');
        const targetTheme = isDarkMode ? 'light' : 'dark';

        // Create ripple animation
        createRippleAnimation(centerX, centerY, targetTheme, function() {
            // Toggle theme after ripple animation starts
            html.classList.toggle('dark');

            // Save theme preference
            if (html.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
                console.log('Switched to dark theme');
            } else {
                localStorage.setItem('theme', 'light');
                console.log('Switched to light theme');
            }
        });
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
        }
    });
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    // Get all navigation links
    const navLinks = document.querySelectorAll('nav a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                // Calculate offset for fixed header
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Highlight active section in navigation
    function highlightActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('nav a[href^="#"]');

        let current = '';
        const headerHeight = document.querySelector('header').offsetHeight;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 50;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('text-accent');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('text-accent');
            }
        });
    }

    // Listen for scroll events
    window.addEventListener('scroll', highlightActiveSection);

    // Initial call to highlight correct section on page load
    highlightActiveSection();

    // Add fade-in animation for sections on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections for fade-in effect
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Add hover effects for project cards
    const projectCards = document.querySelectorAll('#projects .border');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.2s ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add typing animation for hero text (optional)
    const heroTitle = document.querySelector('#hero h1');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';

        let i = 0;
        function typeWriter() {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        }

        // Start typing animation after a brief delay
        setTimeout(typeWriter, 500);
    }

    // Mobile menu toggle functionality
    function initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileNav = document.getElementById('mobile-nav');

        if (mobileMenuToggle && mobileNav) {
            mobileMenuToggle.addEventListener('click', function() {
                const isHidden = mobileNav.classList.contains('hidden');

                if (isHidden) {
                    mobileNav.classList.remove('hidden');
                    mobileMenuToggle.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                } else {
                    mobileNav.classList.add('hidden');
                    mobileMenuToggle.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                }
            });

            // Close mobile menu when clicking on a link
            mobileNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function() {
                    mobileNav.classList.add('hidden');
                    mobileMenuToggle.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                });
            });
        }
    }

    initMobileMenu();

    // Timeline animation
    function initTimelineAnimation() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        const timelineProgressLines = document.querySelectorAll('.timeline-item-progress');
        const timelineDots = document.querySelectorAll('.timeline-dot-animated');

        if (timelineItems.length === 0) {
            return;
        }

        function updateTimelineAnimation() {
            const windowHeight = window.innerHeight;
            const midpoint = windowHeight * 0.35; // 20% from top of viewport

            timelineItems.forEach((item, index) => {
                const itemRect = item.getBoundingClientRect();
                const progressLine = timelineProgressLines[index];
                const dot = timelineDots[index];

                if (!progressLine || !dot) return;

                // Check if item is in view
                const itemTop = itemRect.top;
                const itemBottom = itemRect.bottom;
                const itemHeight = itemRect.height;

                // Item is visible when any part is in viewport
                const isVisible = itemTop < windowHeight && itemBottom > 0;

                if (!isVisible) {
                    // Reset if not visible
                    progressLine.style.height = '0%';
                    dot.classList.remove('visible');
                    dot.style.top = '0px';
                    return;
                }

                // Calculate progress based on midpoint intersection
                let progress = 0;

                if (itemTop <= midpoint && itemBottom >= midpoint) {
                    // Midpoint is within this item
                    const distanceFromTop = midpoint - itemTop;
                    progress = Math.min(1, Math.max(0, distanceFromTop / itemHeight));

                    // Show dot and progress line
                    dot.classList.add('visible');

                    // Position dot based on progress within this item
                    const dotPosition = progress * (itemHeight - 20); // Account for dot size
                    dot.style.top = dotPosition + 'px';

                    // Progress line height follows the dot position
                    progressLine.style.height = (progress * 100) + '%';
                } else if (itemBottom < midpoint) {
                    // Item is completely above midpoint - fully completed
                    progress = 1;
                    progressLine.style.height = '100%';
                    dot.classList.remove('visible'); // Hide dot when item is complete
                } else {
                    // Item is below midpoint - not started yet
                    progress = 0;
                    progressLine.style.height = '0%';
                    dot.classList.remove('visible');
                }
            });
        }

        // Listen for scroll events
        window.addEventListener('scroll', updateTimelineAnimation);
        window.addEventListener('resize', updateTimelineAnimation);

        // Initial call
        updateTimelineAnimation();
    }

    initTimelineAnimation();

    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            const submitBtn = contactForm.querySelector('button[type="submit"]');

            // Disable button and show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'sending...';

            // Create mailto link with pre-filled content
            const subject = encodeURIComponent('Contact from Portfolio Website');
            const body = encodeURIComponent(`From: ${email}\n\nMessage:\n${message}`);
            const mailtoLink = `mailto:rohitcodes03@gmail.com?subject=${subject}&body=${body}`;

            // Open user's email client
            window.location.href = mailtoLink;

            // Reset form after a short delay
            setTimeout(() => {
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.textContent = 'send message';

                // Show success message
                const successMsg = document.createElement('div');
                successMsg.className = 'mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm text-center';
                successMsg.textContent = 'Email client opened! Please send the message from your email app.';
                contactForm.appendChild(successMsg);

                // Remove success message after 5 seconds
                setTimeout(() => {
                    if (successMsg.parentNode) {
                        successMsg.parentNode.removeChild(successMsg);
                    }
                }, 5000);
            }, 1000);
        });
    }
});