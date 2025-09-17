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

    if (savedTheme === 'dark') {
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

    // Spotify Integration
    initSpotify();

    // Handle responsive Spotify display on window resize
    window.addEventListener('resize', function() {
        if (window.currentTracks) {
            displayRecentTracks(window.currentTracks);
        }
    });
});

// Spotify integration using backend API

// Spotify Authentication and API Functions
function initSpotify() {
    const loginBtn = document.getElementById('spotify-login');
    const retryBtn = document.getElementById('retry-spotify');

    if (loginBtn) {
        loginBtn.addEventListener('click', handleSpotifyAuth);
    }

    if (retryBtn) {
        retryBtn.addEventListener('click', loadYourRecentTracks);
    }

    // Check if returning from successful auth
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (error) {
        showSpotifyError();
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (success) {
        // Clean URL and load tracks
        window.history.replaceState({}, document.title, window.location.pathname);
        loadYourRecentTracks();
        return;
    }

    // Check authentication status and load tracks
    checkAuthAndLoadTracks();
}

// Check backend authentication status and load tracks if authenticated
async function checkAuthAndLoadTracks() {
    try {
        // Always try to load tracks first - the backend will handle auth
        loadYourRecentTracks();
    } catch (error) {
        console.error('Error checking auth status:', error);
        showSpotifyConnect();
    }
}

// Handle Spotify authentication through backend
function handleSpotifyAuth() {
    const authUrl = `${window.API_CONFIG.BACKEND_URL}${window.API_CONFIG.ENDPOINTS.SPOTIFY_AUTH}`;
    window.location.href = authUrl;
}

function exchangeCodeForToken(code) {
    showSpotifyLoading();

    // Note: In production, this should be done on your backend for security
    // This is a simplified example for demonstration
    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
            client_id: SPOTIFY_CONFIG.CLIENT_ID,
            // Note: client_secret should be handled on backend
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            // Store token and expiry
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));

            if (data.refresh_token) {
                localStorage.setItem('spotify_refresh_token', data.refresh_token);
            }

            loadRecentTracks();
        } else {
            showSpotifyError();
        }
    })
    .catch(error => {
        console.error('Token exchange failed:', error);
        showSpotifyError();
    });
}

function loadRecentTracks() {
    const accessToken = localStorage.getItem('spotify_access_token');
    if (!accessToken) {
        showSpotifyConnect();
        return;
    }

    showSpotifyLoading();

    fetch(`${SPOTIFY_CONFIG.API_BASE}/me/player/recently-played?limit=5`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            // Token expired, clear storage and show connect
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_token_expiry');
            showSpotifyConnect();
            return null;
        }
        return response.json();
    })
    .then(data => {
        if (data && data.items) {
            displayRecentTracks(data.items);
        }
    })
    .catch(error => {
        console.error('Failed to load recent tracks:', error);
        showSpotifyError();
    });
}

function displayRecentTracks(tracks) {
    // Store tracks globally for resize handling
    if (typeof window !== 'undefined') {
        window.currentTracks = tracks;
    }

    const musicGrid = document.getElementById('music-grid');
    const gridContainer = musicGrid.querySelector('div');

    // Check if mobile view
    const isMobile = window.innerWidth < 768; // md breakpoint

    // Clear existing content
    gridContainer.innerHTML = '';

    if (isMobile) {
        // Mobile: List view
        gridContainer.className = 'space-y-3';
        tracks.forEach(item => {
            const track = item.track;
            const trackListItem = createTrackListItem(track);
            gridContainer.appendChild(trackListItem);
        });
    } else {
        // Desktop: Grid view
        gridContainer.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4';
        tracks.forEach(item => {
            const track = item.track;
            const trackCard = createTrackCard(track);
            gridContainer.appendChild(trackCard);
        });
    }

    showMusicGrid();
}

function createTrackListItem(track) {
    const listItem = document.createElement('div');
    listItem.className = 'flex items-center space-x-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-lg p-3 hover:shadow-lg dark:hover:shadow-white/10 transition-all duration-300';

    const imageUrl = track.album.images[0]?.url || '';
    const trackName = track.name;
    const artistName = track.artists.map(artist => artist.name).join(', ');
    const albumName = track.album.name;
    const spotifyUrl = track.external_urls.spotify;

    listItem.innerHTML = `
        <div class="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
            ${imageUrl ? `<img src="${imageUrl}" alt="${albumName}" class="w-full h-full object-cover">` :
              `<div class="w-full h-full flex items-center justify-center">
                <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>`}
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-sm truncate" title="${trackName}">${trackName}</h4>
            <p class="text-gray-600 dark:text-gray-400 text-xs truncate" title="${artistName}">${artistName}</p>
        </div>
        <a href="${spotifyUrl}" target="_blank" rel="noopener noreferrer"
           class="flex-shrink-0 text-green-600 hover:text-green-700 transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.188.305-.516.457-.844.457-.188 0-.375-.047-.563-.152-1.266-.797-2.859-1.219-4.594-1.219-1.078 0-2.156.188-3.141.516-.328.109-.703-.047-.844-.375-.141-.328.047-.703.375-.844 1.172-.375 2.391-.609 3.609-.609 1.969 0 3.797.469 5.297 1.359.328.188.422.609.234.937zm1.078-2.391c-.234.375-.656.563-1.031.563-.234 0-.469-.063-.656-.188-1.547-.891-3.469-1.359-5.391-1.359-1.266 0-2.531.234-3.703.656-.422.141-.844-.094-.984-.516-.141-.422.094-.844.516-.984 1.406-.516 2.859-.797 4.313-.797 2.203 0 4.359.563 6.234 1.641.375.234.516.75.281 1.125zm.984-2.5c-.281.047-.516.141-.75.234-1.734-1.031-3.984-1.594-6.375-1.594-1.547 0-3.094.281-4.5.844-.469.188-.984-.047-1.172-.516s.047-.984.516-1.172c1.641-.656 3.375-.984 5.156-.984 2.75 0 5.344.656 7.359 1.875.422.281.563.844.281 1.266-.234.375-.656.563-1.031.563z"/>
            </svg>
        </a>
    `;

    return listItem;
}

function createTrackCard(track) {
    const card = document.createElement('div');
    card.className = 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-lg dark:hover:shadow-white/10 transition-all duration-300 hover:-translate-y-1';

    const imageUrl = track.album.images[0]?.url || '';
    const trackName = track.name;
    const artistName = track.artists.map(artist => artist.name).join(', ');
    const albumName = track.album.name;
    const spotifyUrl = track.external_urls.spotify;

    card.innerHTML = `
        <div class="aspect-square bg-gray-200 dark:bg-gray-800 rounded-lg mb-3 overflow-hidden">
            ${imageUrl ? `<img src="${imageUrl}" alt="${albumName}" class="w-full h-full object-cover">` :
              `<div class="w-full h-full flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>`}
        </div>
        <h4 class="font-semibold text-sm mb-1 truncate" title="${trackName}">${trackName}</h4>
        <p class="text-gray-600 dark:text-gray-400 text-xs mb-2 truncate" title="${artistName}">${artistName}</p>
        <a href="${spotifyUrl}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center text-green-600 hover:text-green-700 text-xs font-medium transition-colors">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.424c-.188.305-.516.457-.844.457-.188 0-.375-.047-.563-.152-1.266-.797-2.859-1.219-4.594-1.219-1.078 0-2.156.188-3.141.516-.328.109-.703-.047-.844-.375-.141-.328.047-.703.375-.844 1.172-.375 2.391-.609 3.609-.609 1.969 0 3.797.469 5.297 1.359.328.188.422.609.234.937zm1.078-2.391c-.234.375-.656.563-1.031.563-.234 0-.469-.063-.656-.188-1.547-.891-3.469-1.359-5.391-1.359-1.266 0-2.531.234-3.703.656-.422.141-.844-.094-.984-.516-.141-.422.094-.844.516-.984 1.406-.516 2.859-.797 4.313-.797 2.203 0 4.359.563 6.234 1.641.375.234.516.75.281 1.125zm.984-2.5c-.281.047-.516.141-.75.234-1.734-1.031-3.984-1.594-6.375-1.594-1.547 0-3.094.281-4.5.844-.469.188-.984-.047-1.172-.516s.047-.984.516-1.172c1.641-.656 3.375-.984 5.156-.984 2.75 0 5.344.656 7.359 1.875.422.281.563.844.281 1.266-.234.375-.656.563-1.031.563z"/>
            </svg>
            play on spotify
        </a>
    `;

    return card;
}

function showSpotifyConnect() {
    document.getElementById('spotify-connect').classList.remove('hidden');
    document.getElementById('music-grid').classList.add('hidden');
    document.getElementById('music-loading').classList.add('hidden');
    document.getElementById('music-error').classList.add('hidden');
}

function showMusicGrid() {
    document.getElementById('spotify-connect').classList.add('hidden');
    document.getElementById('music-grid').classList.remove('hidden');
    document.getElementById('music-loading').classList.add('hidden');
    document.getElementById('music-error').classList.add('hidden');
}

function showSpotifyLoading() {
    document.getElementById('spotify-connect').classList.add('hidden');
    document.getElementById('music-grid').classList.add('hidden');
    document.getElementById('music-loading').classList.remove('hidden');
    document.getElementById('music-error').classList.add('hidden');
}

function showSpotifyError() {
    document.getElementById('spotify-connect').classList.add('hidden');
    document.getElementById('music-grid').classList.add('hidden');
    document.getElementById('music-loading').classList.add('hidden');
    document.getElementById('music-error').classList.remove('hidden');
}

// Load YOUR recent tracks from backend API
async function loadYourRecentTracks(retryCount = 0) {
    showSpotifyLoading();

    try {
        const response = await fetch(`${window.API_CONFIG.BACKEND_URL}${window.API_CONFIG.ENDPOINTS.RECENT_TRACKS}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (response.status === 401) {
            // Not authenticated, show connect button
            showSpotifyConnect();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            displayRecentTracks(data.items);
            // Store success state to avoid showing auth prompt on refresh
            localStorage.setItem('spotify_last_success', Date.now().toString());
        } else {
            // If no tracks but API call succeeded, show a different message
            showSpotifyNoTracks();
        }
    } catch (error) {
        console.error('Failed to load your tracks:', error);

        // Auto-retry once after 2 seconds if first attempt fails
        if (retryCount === 0) {
            setTimeout(() => {
                loadYourRecentTracks(1);
            }, 2000);
        } else {
            showSpotifyError();
        }
    }
}

// Show message when authenticated but no tracks available
function showSpotifyNoTracks() {
    document.getElementById('spotify-connect').classList.add('hidden');
    document.getElementById('music-grid').classList.add('hidden');
    document.getElementById('music-loading').classList.add('hidden');
    document.getElementById('music-error').classList.remove('hidden');

    // Update error message for no tracks
    const errorDiv = document.getElementById('music-error');
    const errorMessage = errorDiv.querySelector('p');
    if (errorMessage) {
        errorMessage.textContent = 'no recent tracks found - play some music on spotify first!';
    }
}