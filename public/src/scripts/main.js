// ===========================
// Utility Functions
// ===========================

// HTML escaping utility to prevent XSS
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Validate and sanitize content object
function validateContent(content, schema) {
    if (!content || typeof content !== 'object') {
        console.error('Invalid content structure');
        return false;
    }

    // Check if required properties exist
    for (const key of schema) {
        if (!(key in content)) {
            console.error(`Missing required content property: ${key}`);
            return false;
        }
    }

    return true;
}

// Safe URL validator (supports both absolute URLs and relative paths)
function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false;

    // Allow relative paths (for local assets)
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || !url.includes('://')) {
        // Simple validation: no script tags or javascript: protocol
        if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('<script')) {
            return false;
        }
        return true;
    }

    // For absolute URLs, validate protocol
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

// Store active ripple timeouts for cleanup
const activeRippleTimeouts = [];

// Store active observers for cleanup
const activeObservers = [];

// Store Lenis instance for cleanup
let lenisInstance = null;

// Ripple animation function
function createRippleAnimation(x, y, targetTheme, callback) {
    // Create ripple container
    const rippleContainer = document.createElement('div');
    rippleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 1000;
        overflow: hidden;
    `;
    document.body.appendChild(rippleContainer);

    // Create ripple circle
    const ripple = document.createElement('div');
    const bgColor = targetTheme === 'dark' ? '#000000' : '#f9fafb';

    // Calculate the maximum distance to cover the entire screen
    const maxDistance = Math.sqrt(
        Math.pow(Math.max(x, window.innerWidth - x), 2) +
        Math.pow(Math.max(y, window.innerHeight - y), 2)
    );

    // Set initial position and size
    const size = maxDistance * 2;
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        background-color: ${bgColor};
        border-radius: 50%;
        transform: scale(0);
        opacity: 0;
    `;

    rippleContainer.appendChild(ripple);

    // Start ripple animation and theme change simultaneously
    requestAnimationFrame(() => {
        ripple.classList.add('ripple-animate');
        callback();
    });

    // Clean up after animation completes with timeout tracking
    const timeoutId = setTimeout(() => {
        if (document.body.contains(rippleContainer)) {
            document.body.removeChild(rippleContainer);
        }
        // Remove this timeout from active list
        const index = activeRippleTimeouts.indexOf(timeoutId);
        if (index > -1) {
            activeRippleTimeouts.splice(index, 1);
        }
    }, 900);

    // Track timeout for cleanup
    activeRippleTimeouts.push(timeoutId);
}

// Cleanup function for ripple animations
function cleanupRippleAnimations() {
    activeRippleTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    activeRippleTimeouts.length = 0;

    // Remove any remaining ripple containers
    const rippleContainers = document.querySelectorAll('div[style*="z-index: 1000"]');
    rippleContainers.forEach(container => {
        if (container.style.position === 'fixed' && document.body.contains(container)) {
            document.body.removeChild(container);
        }
    });
}

// Theme toggle functionality
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) {
        console.error('Theme toggle button not found');
        return;
    }

    const html = document.documentElement;

    // Always start in light mode for fastest loading
    // Apply saved preference after initial render
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        html.classList.add('dark');
    }

    // Theme toggle event listener with ripple animation
    const themeClickHandler = function () {
        console.log('Theme toggle clicked');

        // Get the button position for ripple origin
        const rect = themeToggle.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Determine if switching to dark or light
        const isDarkMode = html.classList.contains('dark');
        const targetTheme = isDarkMode ? 'light' : 'dark';

        // Create ripple animation
        createRippleAnimation(centerX, centerY, targetTheme, function () {
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
    };

    addEventListenerWithCleanup(themeToggle, 'click', themeClickHandler);

    // Note: Removed system theme listener for better performance
}

// Content Population Functions
function populateContent() {
    if (!window.siteContent) {
        console.error('Site content not loaded');
        showContentLoadError();
        return;
    }

    const content = window.siteContent;

    // Validate content structure
    if (typeof content !== 'object') {
        console.error('Invalid content structure');
        showContentLoadError();
        return;
    }

    try {
        // Populate meta tags
        if (content.meta) updateMetaTags(content.meta);

        // Populate navigation
        if (content.navigation) populateNavigation(content.navigation);

        // Populate personal info
        if (content.personal) populatePersonalInfo(content.personal);

        // Populate hero section
        if (content.hero) populateHeroSection(content.hero);

        // Populate about section
        if (content.about) populateAboutSection(content.about);

        // Populate experience section
        if (content.experience) populateExperienceSection(content.experience);

        // Populate projects section
        if (content.projects) populateProjectsSection(content.projects);

        // Populate side projects section
        if (content.sideProjects) populateSideProjectsSection(content.sideProjects);

        // Populate achievements section
        if (content.achievements) populateAchievementsSection(content.achievements);

        // Populate footer
        if (content.footer) populateFooter(content.footer);

        // Populate social links
        if (content.social) populateSocialLinks(content.social);

        // Mark all content as populated to show it
        document.querySelectorAll('[data-content]').forEach(element => {
            element.classList.add('populated');
        });

        // Setup side projects heading animation
        setupSideProjectsHeadingAnimation();
    } catch (error) {
        console.error('Error populating content:', error.message);
        showContentLoadError();
    }
}

// Show user-friendly error message when content fails to load
function showContentLoadError() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-black z-50';
        errorDiv.innerHTML = `
            <div class="text-center p-8 max-w-md">
                <div class="text-6xl mb-4">⚠️</div>
                <h2 class="text-2xl font-bold mb-4">Content Loading Error</h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    We're having trouble loading the page content. Please try refreshing the page.
                </p>
                <button onclick="window.location.reload()"
                    class="bg-accent hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Populate content immediately when this script loads (after content.js)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateContent);
} else {
    populateContent();
}

function updateMetaTags(meta) {
    // Validate meta object
    if (!validateContent(meta, ['title', 'description', 'author'])) {
        console.error('Meta tags validation failed, using defaults');
        return;
    }

    try {
        // Safely set title (document.title automatically escapes)
        document.title = meta.title || 'Portfolio';

        const metaTags = [
            { selector: 'meta[name="description"]', attr: 'content', value: meta.description },
            { selector: 'meta[name="keywords"]', attr: 'content', value: meta.keywords },
            { selector: 'meta[name="author"]', attr: 'content', value: meta.author },
            { selector: 'meta[property="og:url"]', attr: 'content', value: meta.url },
            { selector: 'meta[property="og:title"]', attr: 'content', value: meta.ogTitle },
            { selector: 'meta[property="og:description"]', attr: 'content', value: meta.ogDescription },
            { selector: 'meta[property="og:image"]', attr: 'content', value: meta.ogImage },
            { selector: 'meta[property="og:site_name"]', attr: 'content', value: meta.siteName },
            { selector: 'meta[property="twitter:url"]', attr: 'content', value: meta.url },
            { selector: 'meta[property="twitter:title"]', attr: 'content', value: meta.twitterTitle },
            { selector: 'meta[property="twitter:description"]', attr: 'content', value: meta.twitterDescription },
            { selector: 'meta[property="twitter:image"]', attr: 'content', value: meta.twitterImage }
        ];

        metaTags.forEach(tag => {
            try {
                const element = document.querySelector(tag.selector);
                if (element && tag.value) {
                    // Validate URLs for image and url fields
                    if (tag.selector.includes('image') || tag.selector.includes('url')) {
                        if (isSafeUrl(tag.value)) {
                            element.setAttribute(tag.attr, tag.value);
                        }
                    } else {
                        // setAttribute escapes automatically, but we still escape for extra safety
                        // This protects against potential browser quirks
                        element.setAttribute(tag.attr, escapeHtml(tag.value));
                    }
                }
            } catch (error) {
                console.error(`Failed to set meta tag ${tag.selector}:`, error.message);
            }
        });
    } catch (error) {
        console.error('Error updating meta tags:', error.message);
    }
}

function populateNavigation(navigation) {
    // Navigation is now static in HTML to prevent flash
    // This function is kept for compatibility but doesn't modify existing content
    // The static navigation in HTML will be enhanced by the active section highlighting
}

function populatePersonalInfo(personal) {
    if (!validateContent(personal, ['name'])) {
        console.error('Personal info validation failed');
        return;
    }

    try {
        const nameElement = document.querySelector('[data-content="personal.name"]');
        if (nameElement && personal.name) {
            // textContent automatically escapes, no need for escapeHtml
            nameElement.textContent = personal.name;
        }

        const profileImage = document.querySelector('[data-content="personal.profileImage"]');
        if (profileImage && personal.profileImage) {
            // Validate image URL
            if (isSafeUrl(personal.profileImage)) {
                profileImage.src = personal.profileImage;
                profileImage.alt = `${personal.name}'s profile picture`;
            } else if (personal.fallbackImage && isSafeUrl(personal.fallbackImage)) {
                profileImage.src = personal.fallbackImage;
                profileImage.alt = `${personal.name}'s profile picture`;
            }
        }
    } catch (error) {
        console.error('Error populating personal info:', error.message);
    }
}

function populateHeroSection(hero) {
    if (!validateContent(hero, ['greeting', 'tldrTitle', 'tldrContent'])) {
        console.error('Hero section validation failed');
        return;
    }

    try {
        const greetingElement = document.querySelector('[data-content="hero.greeting"]');
        if (greetingElement && hero.greeting) {
            // textContent automatically escapes, no need for escapeHtml
            greetingElement.textContent = hero.greeting;
        }

        const tldrTitleElement = document.querySelector('[data-content="hero.tldrTitle"]');
        if (tldrTitleElement && hero.tldrTitle) {
            // textContent automatically escapes, no need for escapeHtml
            tldrTitleElement.textContent = hero.tldrTitle;
        }

        const tldrContentElement = document.querySelector('[data-content="hero.tldrContent"]');
        if (tldrContentElement && Array.isArray(hero.tldrContent)) {
            // Note: tldrContent contains intentional HTML (links, bold), so we keep innerHTML
            // but validate that the content array exists and has items
            tldrContentElement.innerHTML = hero.tldrContent.map(paragraph =>
                `<p>${paragraph}</p>`
            ).join('');
        }
    } catch (error) {
        console.error('Error populating hero section:', error.message);
    }
}

function populateAboutSection(about) {
    if (!validateContent(about, ['title', 'content'])) {
        console.error('About section validation failed');
        return;
    }

    try {
        const titleElement = document.querySelector('[data-content="about.title"]');
        if (titleElement && about.title) {
            // textContent automatically escapes, no need for escapeHtml
            titleElement.textContent = about.title;
        }

        const contentElement = document.querySelector('[data-content="about.content"]');
        if (contentElement && Array.isArray(about.content)) {
            // Note: about.content contains intentional HTML (strong tags), so we keep innerHTML
            // but validate that the content array exists
            contentElement.innerHTML = about.content.map(paragraph =>
                `<p class="text-sm sm:text-base leading-relaxed">${paragraph}</p>`
            ).join('');
        }
    } catch (error) {
        console.error('Error populating about section:', error.message);
    }
}

function populateExperienceSection(experience) {
    const titleElement = document.querySelector('[data-content="experience.title"]');
    if (titleElement) {
        titleElement.textContent = experience.title;
    }

    const jobsContainer = document.querySelector('[data-content="experience.jobs"]');
    if (jobsContainer) {
        jobsContainer.innerHTML = experience.jobs.map((job, index) => `
            <div class="timeline-item border-l-2 border-gray-200 dark:border-gray-600 pl-4 md:pl-6 relative">
                <div class="timeline-item-progress" data-item="${index}"></div>
                <div class="timeline-dot-animated" data-item="${index}"></div>
                <div class="space-y-2">
                    <div>
                        <h3 class="font-bold sm:font-semibold text-sm sm:text-base">${job.title}</h3>
                        <p class="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                            <a href="${job.companyUrl}" class="hover:text-accent transition-colors">${job.company}</a> • ${job.duration}
                        </p>
                    </div>
                    <div>
                        <p class="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                            ${job.description}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function populateProjectsSection(projects) {
    const titleElement = document.querySelector('[data-content="projects.title"]');
    if (titleElement) {
        titleElement.textContent = projects.title;
    }

    const projectsContainer = document.querySelector('[data-content="projects.items"]');
    if (projectsContainer) {
        projectsContainer.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${projects.items.map(project => `
                    <div class="project-card h-full flex flex-col border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-300">
                        <h3 class="font-bold sm:font-semibold mb-3 text-lg">${project.title}</h3>
                        <p class="text-gray-600 dark:text-gray-300 text-sm mb-6 flex-grow leading-relaxed">
                            ${project.description}
                        </p>
                        <div class="flex flex-wrap gap-2 mb-6">
                            ${project.technologies.map(tech => `
                                <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">${tech}</span>
                            `).join('')}
                        </div>
                        <div class="flex gap-6 mt-auto">
                            ${project.links.live ? `
                                <a href="${project.links.live}" class="text-accent hover:text-indigo-700 font-medium text-sm transition-colors">live →</a>
                            ` : ''}
                            ${project.links.github ? `
                                <a href="${project.links.github}" class="text-accent hover:text-indigo-700 font-medium text-sm transition-colors">github →</a>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function populateSideProjectsSection(sideProjects) {
    const titleElement = document.querySelector('[data-content="sideProjects.title"]');
    if (titleElement) {
        titleElement.textContent = sideProjects.title;
    }

    const sideProjectsContainer = document.querySelector('[data-content="sideProjects.items"]');
    if (sideProjectsContainer && sideProjects.items.length > 0) {
        sideProjectsContainer.innerHTML = `
            <div class="space-y-3">
                ${sideProjects.items.map(project => `
                    <div class="group p-4 rounded-lg bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30 dark:to-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-300">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div class="flex-1">
                                <div class="flex items-baseline gap-2 mb-2">
                                    <h4 class="font-bold text-base text-gray-900 dark:text-gray-100">${project.title}</h4>
                                    <div class="flex gap-2">
                                        ${project.links.live ? `
                                            <a href="${project.links.live}" class="text-accent hover:text-indigo-700 text-xs font-medium transition-colors">live →</a>
                                        ` : ''}
                                        ${project.links.github ? `
                                            <a href="${project.links.github}" class="text-accent hover:text-indigo-700 text-xs font-medium transition-colors">github →</a>
                                        ` : ''}
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">${project.description}</p>
                                <div class="flex flex-wrap gap-2">
                                    ${project.technologies.map(tech => `
                                        <span class="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">${tech}</span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (sideProjectsContainer) {
        sideProjectsContainer.innerHTML = '';
    }
}

function populateAchievementsSection(achievements) {
    if (!validateContent(achievements, ['title'])) {
        console.error('Achievements section validation failed');
        return;
    }

    try {
        const titleElement = document.querySelector('[data-content="achievements.title"]');
        if (titleElement && achievements.title) {
            titleElement.textContent = achievements.title;
        }

        const achievementsContainer = document.querySelector('[data-content="achievements"]');
        if (achievementsContainer) {
            const achievementsHtml = Array.isArray(achievements.achievements) && achievements.achievements.length > 0
                ? achievements.achievements.map(achievement => {
                    // Validate image URL if present
                    const hasValidImage = achievement.image && isSafeUrl(achievement.image);

                    return `
                        <div class="border-l-2 border-accent pl-3 md:pl-4">
                            <h4 class="font-semibold text-xs sm:text-sm">
                                <a href="${achievement.url || '#'}" class="hover:text-accent transition-colors">${achievement.title || 'Achievement'}</a>
                            </h4>
                            <p class="text-gray-600 dark:text-gray-300 text-xs mt-1 leading-relaxed">
                                ${achievement.description || ''}
                            </p>
                            ${hasValidImage ? `
                                <div class="mt-3">
                                    <img src="${achievement.image}"
                                         alt="${achievement.imageAlt || achievement.title || 'Achievement image'}"
                                         class="w-full max-w-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300"
                                         loading="lazy"
                                         onerror="console.error('Failed to load image for ${achievement.title}:', this.src); this.parentElement.innerHTML='<p class=\\'text-sm text-gray-500 dark:text-gray-400 italic\\'>Image unavailable (LinkedIn hotlink protection)</p>';">
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')
                : '<p class="text-gray-600 dark:text-gray-400 text-sm">No achievements to display.</p>';

            const certificationsHtml = Array.isArray(achievements.certifications) && achievements.certifications.length > 0
                ? achievements.certifications.map(cert => `
                    <div class="border-l-2 border-accent pl-3 md:pl-4">
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex-1">
                                <h4 class="font-semibold text-xs sm:text-sm">
                                    <a href="${cert.url || '#'}" class="hover:text-accent transition-colors">${cert.title || 'Certification'}</a>
                                </h4>
                                <p class="text-gray-600 dark:text-gray-400 text-xs">${cert.organization || ''}</p>
                            </div>
                            <span class="text-gray-400 text-xs shrink-0">${cert.date || ''}</span>
                        </div>
                    </div>
                `).join('')
                : '<p class="text-gray-600 dark:text-gray-400 text-sm">No certifications to display.</p>';

            achievementsContainer.innerHTML = `
                <!-- Achievements - Mobile: full width, Desktop: 6 columns -->
                <div class="mb-6 md:mb-0">
                    <h3 class="font-semibold mb-3 md:mb-4 text-accent text-sm sm:text-base">achievements</h3>
                    <div class="space-y-3 md:space-y-4">
                        ${achievementsHtml}
                    </div>
                </div>

                <!-- Certifications - Mobile: full width, Desktop: 6 columns -->
                <div>
                    <h3 class="font-semibold mb-3 md:mb-4 text-accent text-sm sm:text-base">certifications</h3>
                    <div class="space-y-3">
                        ${certificationsHtml}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error populating achievements section:', error.message);
    }
}

function populateFooter(footer) {
    const footerElement = document.querySelector('[data-content="footer"]');
    if (footerElement) {
        footerElement.innerHTML = `
            <p class="text-gray-600 dark:text-gray-400 text-sm">${footer.built}</p>
            <p>${footer.inspired}</p>
            <p class="text-gray-400 text-xs mt-2">${footer.copyright}</p>
        `;
    }
}

function populateSocialLinks(social) {
    const socialElement = document.querySelector('[data-content="social"]');
    if (socialElement) {
        // Set parent container to flex to match expected layout
        socialElement.className = 'flex gap-4';
        socialElement.innerHTML = `
            <a href="${social.twitter}"
                class="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-gray-300 dark:text-gray-600 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-110 md:w-10 md:h-10"
                aria-label="Twitter" title="Twitter">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            </a>
            <a href="${social.linkedin}"
                class="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-gray-300 dark:text-gray-600 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-110 md:w-10 md:h-10"
                aria-label="LinkedIn" title="LinkedIn">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            </a>
            <a href="${social.github}"
                class="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-gray-300 dark:text-gray-600 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-110 md:w-10 md:h-10"
                aria-label="GitHub" title="GitHub">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
            </a>
            <a href="${social.cal}"
                class="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-gray-300 dark:text-gray-600 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-110 md:w-10 md:h-10"
                aria-label="Schedule a call" title="Schedule a call">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                </svg>
            </a>
        `;
    }
}


// Store cleanup functions to prevent memory leaks
const eventCleanupFunctions = [];

// Helper function to add event listener with cleanup tracking
function addEventListenerWithCleanup(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    eventCleanupFunctions.push(() => {
        element.removeEventListener(event, handler, options);
    });
}

// Cleanup function to remove all event listeners
function cleanupEventListeners() {
    eventCleanupFunctions.forEach(cleanup => cleanup());
    eventCleanupFunctions.length = 0;
}

// Global cleanup function for all resources
function cleanupAllResources() {
    // Cleanup event listeners
    cleanupEventListeners();

    // Cleanup intersection observers
    activeObservers.forEach(observer => {
        try {
            observer.disconnect();
        } catch (error) {
            console.error('Error disconnecting observer:', error.message);
        }
    });
    activeObservers.length = 0;

    // Cleanup ripple animations
    cleanupRippleAnimations();

    // Cleanup Lenis
    if (lenisInstance && typeof lenisInstance.destroy === 'function') {
        try {
            lenisInstance.destroy();
            lenisInstance = null;
            console.log('Lenis instance destroyed');
        } catch (error) {
            console.error('Error destroying Lenis:', error.message);
        }
    }
}

// Initialize Lenis Smooth Scroll
function initLenis() {
    // Check if Lenis is available
    if (typeof Lenis === 'undefined') {
        console.warn('Lenis library not loaded, falling back to native smooth scroll');
        return null;
    }

    try {
        // Create Lenis instance with custom options
        const lenis = new Lenis({
            duration: 1.2,        // Animation duration (seconds)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing (smooth)
            direction: 'vertical', // Scroll direction
            gestureDirection: 'vertical', // Touch gesture direction
            smooth: true,         // Enable smooth scrolling
            smoothTouch: false,   // Disable smooth scroll on touch devices (better performance)
            touchMultiplier: 2,   // Touch sensitivity
            infinite: false,      // Disable infinite scroll
        });

        // Animation frame loop for Lenis
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Handle anchor links with Lenis
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');

                // Skip empty hashes
                if (href === '#' || href === '#!') {
                    e.preventDefault();
                    return;
                }

                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();

                    // Get header height for offset
                    const header = document.querySelector('header');
                    const headerHeight = header ? header.offsetHeight : 0;

                    // Scroll to element with offset
                    lenis.scrollTo(targetElement, {
                        offset: -(headerHeight + 20), // 20px extra padding
                        duration: 1.2,
                        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
                    });
                }
            });
        });

        console.log('Lenis smooth scroll initialized');
        return lenis;
    } catch (error) {
        console.error('Error initializing Lenis:', error.message);
        return null;
    }
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function () {
    // Initialize Lenis smooth scroll
    lenisInstance = initLenis();

    // Initialize theme
    initTheme();

    // Highlight active section in navigation with throttling
    let highlightTicking = false;

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

        highlightTicking = false;
    }

    function requestHighlightTick() {
        if (!highlightTicking) {
            requestAnimationFrame(highlightActiveSection);
            highlightTicking = true;
        }
    }

    // Listen for scroll events with throttling
    addEventListenerWithCleanup(window, 'scroll', requestHighlightTick, { passive: true });

    // Initial call to highlight correct section on page load
    highlightActiveSection();

    // Handle anchor links when page loads (from external navigation)
    if (window.location.hash) {
        setTimeout(() => {
            const targetSection = document.querySelector(window.location.hash);
            if (targetSection) {
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 0;

                // Use Lenis if available, otherwise fallback to native
                if (lenisInstance) {
                    lenisInstance.scrollTo(targetSection, {
                        offset: -(headerHeight + 20),
                        duration: 1.2,
                        immediate: false
                    });
                } else {
                    const targetPosition = targetSection.offsetTop - headerHeight - 20;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        }, 100); // Small delay to ensure page is fully loaded
    }

    // Add fade-in animation for sections on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // Unobserve after animation to free resources
                sectionObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Track observer for cleanup
    activeObservers.push(sectionObserver);

    // Observe all sections for fade-in effect
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        sectionObserver.observe(section);
    });

    // Add hover effects for project cards
    const projectCards = document.querySelectorAll('#projects .border');
    projectCards.forEach(card => {
        const mouseEnterHandler = function () {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'transform 0.2s ease';
        };
        const mouseLeaveHandler = function () {
            this.style.transform = 'translateY(0)';
        };

        addEventListenerWithCleanup(card, 'mouseenter', mouseEnterHandler);
        addEventListenerWithCleanup(card, 'mouseleave', mouseLeaveHandler);
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
            const mobileMenuClickHandler = function () {
                const isHidden = mobileNav.classList.contains('hidden');

                if (isHidden) {
                    mobileNav.classList.remove('hidden');
                    mobileMenuToggle.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                } else {
                    mobileNav.classList.add('hidden');
                    mobileMenuToggle.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                }
            };

            addEventListenerWithCleanup(mobileMenuToggle, 'click', mobileMenuClickHandler);

            // Close mobile menu when clicking on a link
            mobileNav.querySelectorAll('a').forEach(link => {
                const linkClickHandler = function () {
                    mobileNav.classList.add('hidden');
                    mobileMenuToggle.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
                };
                addEventListenerWithCleanup(link, 'click', linkClickHandler);
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

        let timelineTicking = false;

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

            timelineTicking = false;
        }

        function requestTimelineTick() {
            if (!timelineTicking) {
                requestAnimationFrame(updateTimelineAnimation);
                timelineTicking = true;
            }
        }

        // Listen for scroll events with throttling
        addEventListenerWithCleanup(window, 'scroll', requestTimelineTick, { passive: true });
        addEventListenerWithCleanup(window, 'resize', requestTimelineTick, { passive: true });

        // Initial call
        updateTimelineAnimation();
    }

    initTimelineAnimation();

    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const contactFormSubmitHandler = function (e) {
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
        };

        addEventListenerWithCleanup(contactForm, 'submit', contactFormSubmitHandler);
    }

    // Spotify Integration
    initSpotify();

    // Handle responsive Spotify display on window resize
    const resizeHandler = function () {
        if (window.currentTracks) {
            displayRecentTracks(window.currentTracks);
        }
    };
    addEventListenerWithCleanup(window, 'resize', resizeHandler);

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanupAllResources);

    // Also cleanup on visibility change (when tab is closed or hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            cleanupAllResources();
        }
    });
});

// Spotify integration using backend API

// Spotify Authentication and API Functions
function initSpotify() {
    const loginBtn = document.getElementById('spotify-login');
    const retryBtn = document.getElementById('retry-spotify');

    if (loginBtn) {
        addEventListenerWithCleanup(loginBtn, 'click', handleSpotifyAuth);
    }

    if (retryBtn) {
        addEventListenerWithCleanup(retryBtn, 'click', loadYourRecentTracks);
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

// Setup side projects heading underline animation
function setupSideProjectsHeadingAnimation() {
    const heading = document.querySelector('.side-projects-heading');
    if (!heading) return;

    // Create an Intersection Observer
    const headingObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !heading.classList.contains('animate-underline')) {
                // Add the animation class once when it comes into view
                heading.classList.add('animate-underline');
                // Disconnect observer since we only want this to happen once
                headingObserver.disconnect();
                // Remove from active observers list
                const index = activeObservers.indexOf(headingObserver);
                if (index > -1) {
                    activeObservers.splice(index, 1);
                }
            }
        });
    }, {
        threshold: 0,
        rootMargin: '-30% 0px -30% 0px' // Trigger when heading reaches 70% from top (100% - 30% = 70%)
    });

    // Track observer for cleanup
    activeObservers.push(headingObserver);

    // Start observing the heading
    headingObserver.observe(heading);
}