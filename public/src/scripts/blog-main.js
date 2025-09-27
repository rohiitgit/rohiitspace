// Blog Main JavaScript - Handles both blogs listing and individual blog pages

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

// Initialize the blog functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme and mobile menu (same as main site)
    initTheme();
    initMobileMenu();

    // Populate common content (navigation, footer, etc.)
    populateCommonContent();

    // Initialize page-specific functionality
    const isListingPage = window.location.pathname.includes('blogs.html');
    const isIndividualBlogPage = window.location.pathname.includes('blog.html');

    if (isListingPage) {
        initBlogListingPage();
        initTagFiltering();
    } else if (isIndividualBlogPage) {
        initIndividualBlogPage();
        initShareButtons();
        initReadingProgress();
        initRelatedPosts();
        initCopyCodeButtons();
    }

    // Add navigation highlighting for blogs
    highlightActiveNavigation();

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanupEventListeners);
});

// Theme toggle functionality (same as main site)
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const html = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        html.classList.add('dark');
    }

    const themeClickHandler = function() {
        const rect = themeToggle.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const isDarkMode = html.classList.contains('dark');
        const targetTheme = isDarkMode ? 'light' : 'dark';

        createRippleAnimation(centerX, centerY, targetTheme, function() {
            html.classList.toggle('dark');
            if (html.classList.contains('dark')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
        });
    };

    addEventListenerWithCleanup(themeToggle, 'click', themeClickHandler);
}

// Mobile menu functionality (same as main site)
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    if (mobileMenuToggle && mobileNav) {
        const mobileMenuClickHandler = function() {
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
            const linkClickHandler = function() {
                mobileNav.classList.add('hidden');
                mobileMenuToggle.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
            };
            addEventListenerWithCleanup(link, 'click', linkClickHandler);
        });
    }
}

// Ripple animation for theme toggle (same as main site)
function createRippleAnimation(x, y, targetTheme, callback) {
    const rippleContainer = document.createElement('div');
    rippleContainer.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        pointer-events: none; z-index: 1000; overflow: hidden;
    `;
    document.body.appendChild(rippleContainer);

    const ripple = document.createElement('div');
    const bgColor = targetTheme === 'dark' ? '#000000' : '#f9fafb';
    const maxDistance = Math.sqrt(
        Math.pow(Math.max(x, window.innerWidth - x), 2) +
        Math.pow(Math.max(y, window.innerHeight - y), 2)
    );
    const size = maxDistance * 2;

    ripple.style.cssText = `
        position: absolute; width: ${size}px; height: ${size}px;
        left: ${x - size / 2}px; top: ${y - size / 2}px;
        background-color: ${bgColor}; border-radius: 50%;
        transform: scale(0); opacity: 0;
    `;

    rippleContainer.appendChild(ripple);
    requestAnimationFrame(() => {
        ripple.classList.add('ripple-animate');
        callback();
    });

    setTimeout(() => {
        if (document.body.contains(rippleContainer)) {
            document.body.removeChild(rippleContainer);
        }
    }, 900);
}

// Populate common content (navigation, footer, social links)
function populateCommonContent() {
    if (!window.siteContent) return;

    const content = window.siteContent;

    // Populate personal info
    const nameElement = document.querySelector('[data-content="personal.name"]');
    if (nameElement) {
        nameElement.textContent = content.personal.name;
    }

    // Navigation is now static in HTML to prevent flash
    // No need to populate dynamically - it's already there with correct links

    // Populate social links
    const socialElement = document.querySelector('[data-content="social"]');
    if (socialElement) {
        socialElement.className = 'flex gap-4';
        socialElement.innerHTML = `
            <a href="mailto:${content.social.email}" class="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-gray-300 dark:text-gray-600 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-110" aria-label="Email">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
            </a>
            <a href="${content.social.github}" class="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-gray-300 dark:text-gray-600 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-110" aria-label="GitHub">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
            </a>
            <a href="${content.social.linkedin}" class="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-gray-300 dark:text-gray-600 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-110" aria-label="LinkedIn">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
        `;
    }

    // Populate footer
    const footerElement = document.querySelector('[data-content="footer"]');
    if (footerElement) {
        footerElement.innerHTML = `
            <p class="text-gray-600 dark:text-gray-400 text-sm">${content.footer.built}</p>
            <p>${content.footer.inspired}</p>
            <p class="text-gray-400 text-xs mt-2">${content.footer.copyright}</p>
        `;
    }

    // Mark all content as populated to show it
    document.querySelectorAll('[data-content]').forEach(element => {
        element.classList.add('populated');
    });
}

// Highlight active navigation item
function highlightActiveNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const currentPage = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if ((currentPage === 'blogs.html' && linkHref === 'blogs.html') ||
            (currentPage === 'blog.html' && linkHref === 'blogs.html')) {
            link.classList.add('text-accent');
        }
    });
}

// Initialize blog listing page
function initBlogListingPage() {
    if (!window.blogContent) return;

    const content = window.blogContent;

    // Update page meta
    document.title = content.meta.title;

    // Populate blog listing content
    const titleElement = document.querySelector('[data-content="blog.title"]');
    const subtitleElement = document.querySelector('[data-content="blog.subtitle"]');
    const descriptionElement = document.querySelector('[data-content="blog.description"]');

    if (titleElement) titleElement.textContent = content.listing.title;
    if (subtitleElement) subtitleElement.textContent = content.listing.subtitle;
    if (descriptionElement) descriptionElement.textContent = content.listing.description;

    // Hide featured blogs section
    const featuredSection = document.getElementById('featured-blogs');
    if (featuredSection) {
        featuredSection.style.display = 'none';
    }

    // Populate all blogs
    const allBlogsContainer = document.getElementById('all-blogs-container');
    if (allBlogsContainer) {
        allBlogsContainer.innerHTML = `
            <div class="grid grid-cols-1 gap-6">
                ${content.blogs.map(blog => createBlogCard(blog, false)).join('')}
            </div>
        `;
    }


}

// Create blog card HTML
function createBlogCard(blog, isFeatured = false) {
    if (isFeatured) {
        // Featured cards - clean design without background
        return `
            <div class="h-full flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-accent/50 transition-all duration-300">
                <h3 class="font-semibold mb-3 text-lg">
                    <a href="blog.html?slug=${blog.id}" class="hover:text-accent transition-colors">
                        ${blog.title}
                    </a>
                </h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-6 flex-grow leading-relaxed">
                    ${blog.excerpt}
                </p>
                <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <time>${formatDate(blog.date)}</time>
                    <span>•</span>
                    <span>${blog.readTime}</span>
                </div>
                <div class="flex flex-wrap gap-2 mb-6">
                    ${blog.tags.map((tech, index) => `
                        <button class="tag-link px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-accent/10 hover:text-accent transition-colors ${index === 0 ? 'bg-accent/10 text-accent' : ''}" data-tag="${tech}">${tech}</button>
                    `).join('')}
                </div>
                <div class="flex gap-6 mt-auto">
                    <a href="blog.html?slug=${blog.id}" class="text-accent hover:text-indigo-700 font-medium text-sm transition-colors">read →</a>
                </div>
            </div>
        `;
    } else {
        // All posts cards - minimal design without background
        return `
            <div class="h-full flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-accent/50 transition-all duration-300">
                <h3 class="font-semibold mb-3 text-lg">
                    <a href="blog.html?slug=${blog.id}" class="hover:text-accent transition-colors">
                        ${blog.title}
                    </a>
                </h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-6 flex-grow leading-relaxed">
                    ${blog.excerpt}
                </p>
                <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <time>${formatDate(blog.date)}</time>
                    <span>•</span>
                    <span>${blog.readTime}</span>
                </div>
                <div class="flex flex-wrap gap-2 mb-6">
                    ${blog.tags.map((tech, index) => `
                        <button class="tag-link px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-accent/10 hover:text-accent transition-colors ${index === 0 ? 'bg-accent/10 text-accent' : ''}" data-tag="${tech}">${tech}</button>
                    `).join('')}
                </div>
                <div class="flex gap-6 mt-auto">
                    <a href="blog.html?slug=${blog.id}" class="text-accent hover:text-indigo-700 font-medium text-sm transition-colors">read →</a>
                </div>
            </div>
        `;
    }
}

// Initialize individual blog page
function initIndividualBlogPage() {
    if (!window.blogContent) {
        console.error('Blog content not loaded');
        showErrorState();
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        console.error('No slug found in URL');
        showErrorState();
        return;
    }

    const blog = window.blogContent.blogs.find(b => b.id === slug);

    if (!blog) {
        console.error('Blog not found for slug:', slug);
        showErrorState();
        return;
    }

    populateBlogPost(blog);
    setupPostNavigation(blog);
}

// Populate individual blog post
function populateBlogPost(blog) {
    console.log('Populating blog post:', blog.title);

    try {
        // Update page meta
        document.title = `${blog.title} - rohiitspace`;

        const blogDescription = document.getElementById('blog-description');
        const blogKeywords = document.getElementById('blog-keywords');

        if (blogDescription) blogDescription.content = blog.excerpt;
        if (blogKeywords) blogKeywords.content = blog.tags.join(', ');

        // Update Open Graph meta
        const currentUrl = `${window.location.origin}${window.location.pathname}?slug=${blog.id}`;
        const ogUrl = document.getElementById('blog-og-url');
        const ogTitle = document.getElementById('blog-og-title');
        const ogDescription = document.getElementById('blog-og-description');

        if (ogUrl) ogUrl.content = currentUrl;
        if (ogTitle) ogTitle.content = blog.title;
        if (ogDescription) ogDescription.content = blog.excerpt;

        // Update Twitter meta
        const twitterUrl = document.getElementById('blog-twitter-url');
        const twitterTitle = document.getElementById('blog-twitter-title');
        const twitterDescription = document.getElementById('blog-twitter-description');

        if (twitterUrl) twitterUrl.content = currentUrl;
        if (twitterTitle) twitterTitle.content = blog.title;
        if (twitterDescription) twitterDescription.content = blog.excerpt;

        // Populate blog post content
        const postTitle = document.getElementById('post-title');
        const postDate = document.getElementById('post-date');
        const postReadTime = document.getElementById('post-read-time');

        if (postTitle) {
            postTitle.textContent = blog.title;
            console.log('Set title:', blog.title);
        }

        if (postDate) {
            postDate.innerHTML = `<span class="font-medium">${formatDate(blog.date)}</span>`;
            console.log('Set date:', formatDate(blog.date));
        }

        if (postReadTime) {
            postReadTime.innerHTML = `<span class="font-medium">${blog.readTime}</span>`;
            console.log('Set read time:', blog.readTime);
        }

        // Populate tags
        const tagsContainer = document.getElementById('post-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = blog.tags.map((tag, index) =>
                `<span class="px-5 py-2.5 border transition-all duration-300 cursor-default font-medium rounded-full text-sm ${
                    index === 0
                        ? 'text-white border-accent hover:bg-accent/90'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-accent hover:text-accent hover:bg-accent/5'
                }" ${index === 0 ? 'style="background-color: var(--color-accent);"' : ''}>${tag}</span>`
            ).join('');
            console.log('Set tags:', blog.tags.length);
        }

        // Populate blog content
        const postContent = document.getElementById('post-content');
        if (postContent) {
            postContent.innerHTML = blog.content;
            console.log('Set content, length:', blog.content.length);
        }

    } catch (error) {
        console.error('Error populating blog post:', error);
        showErrorState();
    }
}

// Setup navigation between posts
function setupPostNavigation(currentBlog) {
    const allBlogs = window.blogContent.blogs;
    const currentIndex = allBlogs.findIndex(b => b.id === currentBlog.id);

    const prevPost = currentIndex > 0 ? allBlogs[currentIndex - 1] : null;
    const nextPost = currentIndex < allBlogs.length - 1 ? allBlogs[currentIndex + 1] : null;

    const prevContainer = document.getElementById('prev-post');
    const nextContainer = document.getElementById('next-post');

    if (prevPost) {
        prevContainer.innerHTML = `
            <a href="blog.html?slug=${prevPost.id}" class="block p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-accent transition-all duration-300 h-full">
                <div class="text-sm font-medium text-accent mb-3 flex items-center gap-2">
                    <div class="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                        <svg class="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                    </div>
                    Previous Post
                </div>
                <div class="font-semibold text-gray-900 dark:text-white group-hover:text-accent transition-colors duration-300 text-lg leading-tight line-clamp-2">${prevPost.title}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">${formatDate(prevPost.date)}</div>
            </a>
        `;
    }

    if (nextPost) {
        nextContainer.innerHTML = `
            <a href="blog.html?slug=${nextPost.id}" class="block p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-accent transition-all duration-300 h-full">
                <div class="text-sm font-medium text-accent mb-3 flex items-center justify-end gap-2">
                    Next Post
                    <div class="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                        <svg class="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                    </div>
                </div>
                <div class="font-semibold text-gray-900 dark:text-white group-hover:text-accent transition-colors duration-300 text-lg leading-tight text-right line-clamp-2">${nextPost.title}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mt-2 text-right">${formatDate(nextPost.date)}</div>
            </a>
        `;
    }
}

// Show error state for invalid blog
function showErrorState() {
    document.getElementById('error-state').classList.remove('hidden');
    document.querySelector('.content-wrapper').classList.add('hidden');
}

// Format date helper
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Initialize share buttons functionality
function initShareButtons() {
    const shareTwitter = document.getElementById('share-twitter');
    const shareLinkedIn = document.getElementById('share-linkedin');
    const shareCopy = document.getElementById('share-copy');

    if (!shareTwitter || !shareLinkedIn || !shareCopy) return;

    const currentUrl = window.location.href;
    const postTitle = document.getElementById('post-title')?.textContent || 'Check out this blog post';

    // Twitter share
    const twitterShareHandler = function() {
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(postTitle)}&via=rohiitcodes`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    };
    addEventListenerWithCleanup(shareTwitter, 'click', twitterShareHandler);

    // LinkedIn share
    const linkedInShareHandler = function() {
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
        window.open(linkedInUrl, '_blank', 'width=550,height=420');
    };
    addEventListenerWithCleanup(shareLinkedIn, 'click', linkedInShareHandler);

    // Copy link
    const copyShareHandler = async function() {
        try {
            await navigator.clipboard.writeText(currentUrl);
            showToast('Link copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = currentUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Link copied to clipboard!');
        }
    };
    addEventListenerWithCleanup(shareCopy, 'click', copyShareHandler);
}

// Initialize reading progress bar
function initReadingProgress() {
    const progressBar = document.getElementById('reading-progress-bar');
    const postContent = document.getElementById('post-content');

    if (!progressBar || !postContent) return;

    let ticking = false;

    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Calculate progress based on content area
        const contentTop = postContent.offsetTop;
        const contentHeight = postContent.offsetHeight;
        const contentBottom = contentTop + contentHeight;

        let progress = 0;

        if (scrollTop >= contentTop) {
            if (scrollTop >= contentBottom - windowHeight) {
                progress = 100;
            } else {
                const contentScrolled = scrollTop - contentTop;
                const totalContentToScroll = contentHeight - windowHeight;
                progress = (contentScrolled / totalContentToScroll) * 100;
            }
        }

        progress = Math.max(0, Math.min(100, progress));
        progressBar.style.width = `${progress}%`;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateProgress);
            ticking = true;
        }
    }

    // Throttled scroll event listener
    addEventListenerWithCleanup(window, 'scroll', requestTick, { passive: true });
    addEventListenerWithCleanup(window, 'resize', requestTick, { passive: true });

    // Initial update
    updateProgress();
}

// Show toast notification
function showToast(message) {
    // Remove existing toast
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'fixed bottom-4 right-4 bg-accent text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-y-2 opacity-0';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Initialize tag filtering functionality
function initTagFiltering() {
    if (!window.blogContent) return;

    const content = window.blogContent;
    const tagFiltersContainer = document.getElementById('tag-filters');
    const allBlogsContainer = document.getElementById('all-blogs-container');

    if (!tagFiltersContainer || !allBlogsContainer) return;

    // Get all unique tags
    const allTags = [...new Set(content.blogs.flatMap(blog => blog.tags))].sort();

    // Create filter buttons for each tag
    allTags.forEach(tag => {
        const button = document.createElement('button');
        button.className = 'tag-filter';
        button.setAttribute('data-tag', tag);
        button.textContent = tag;
        tagFiltersContainer.appendChild(button);
    });

    // Handle filter button clicks
    const tagFilterClickHandler = function(e) {
        if (e.target.classList.contains('tag-filter')) {
            const selectedTag = e.target.getAttribute('data-tag');

            // Update active state
            tagFiltersContainer.querySelectorAll('.tag-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');

            // Filter blogs
            filterBlogsByTag(selectedTag);

            // Update URL
            const url = new URL(window.location);
            if (selectedTag === 'all') {
                url.searchParams.delete('tag');
            } else {
                url.searchParams.set('tag', selectedTag);
            }
            window.history.pushState({}, '', url);
        }
    };
    addEventListenerWithCleanup(tagFiltersContainer, 'click', tagFilterClickHandler);

    // Handle tag clicks from blog cards
    const documentTagClickHandler = function(e) {
        if (e.target.classList.contains('tag-link')) {
            e.preventDefault();
            const selectedTag = e.target.getAttribute('data-tag');

            // Update filter UI
            tagFiltersContainer.querySelectorAll('.tag-filter').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-tag') === selectedTag) {
                    btn.classList.add('active');
                }
            });

            // Filter blogs
            filterBlogsByTag(selectedTag);

            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('tag', selectedTag);
            window.history.pushState({}, '', url);
        }
    };
    addEventListenerWithCleanup(document, 'click', documentTagClickHandler);

    // Check for initial tag filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const initialTag = urlParams.get('tag');
    if (initialTag && allTags.includes(initialTag)) {
        // Update active state
        tagFiltersContainer.querySelectorAll('.tag-filter').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tag') === initialTag) {
                btn.classList.add('active');
            }
        });
        // Apply filter
        setTimeout(() => filterBlogsByTag(initialTag), 100);
    }
}

// Filter blogs by tag
function filterBlogsByTag(tag) {
    if (!window.blogContent) return;

    const content = window.blogContent;
    const allBlogsContainer = document.getElementById('all-blogs-container');

    if (!allBlogsContainer) return;

    let filteredBlogs;
    if (tag === 'all') {
        filteredBlogs = content.blogs;
    } else {
        filteredBlogs = content.blogs.filter(blog => blog.tags.includes(tag));
    }

    // Update container with filtered blogs
    allBlogsContainer.innerHTML = `
        <div class="grid grid-cols-1 gap-6">
            ${filteredBlogs.length > 0
                ? filteredBlogs.map(blog => createBlogCard(blog, false)).join('')
                : '<div class="col-span-1 text-center py-12"><p class="text-gray-500 dark:text-gray-400">No posts found with this tag.</p></div>'
            }
        </div>
    `;
}

// Initialize related posts functionality
function initRelatedPosts() {
    if (!window.blogContent) return;

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) return;

    const currentBlog = window.blogContent.blogs.find(b => b.id === slug);
    if (!currentBlog) return;

    const relatedPostsContainer = document.getElementById('related-posts-container');
    const relatedPostsSection = document.getElementById('related-posts');

    if (!relatedPostsContainer || !relatedPostsSection) return;

    // Find related posts based on shared tags
    const relatedPosts = window.blogContent.blogs
        .filter(blog => blog.id !== slug) // Exclude current post
        .map(blog => {
            // Calculate similarity score based on shared tags
            const sharedTags = blog.tags.filter(tag => currentBlog.tags.includes(tag));
            return {
                ...blog,
                similarity: sharedTags.length
            };
        })
        .filter(blog => blog.similarity > 0) // Only include posts with shared tags
        .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
        .slice(0, 2); // Limit to 2 related posts

    if (relatedPosts.length === 0) {
        // Hide the section if no related posts
        relatedPostsSection.style.display = 'none';
        return;
    }

    // Populate related posts
    relatedPostsContainer.innerHTML = relatedPosts.map(blog => createRelatedPostCard(blog)).join('');
}

// Create related post card HTML
function createRelatedPostCard(blog) {
    return `
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-accent/50 hover:shadow-lg transition-all duration-300">
            <h4 class="font-semibold mb-3 text-lg leading-tight">
                <a href="blog.html?slug=${blog.id}" class="hover:text-accent transition-colors">
                    ${blog.title}
                </a>
            </h4>
            <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed line-clamp-3">
                ${blog.excerpt}
            </p>
            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <time>${formatDate(blog.date)}</time>
                <span>•</span>
                <span>${blog.readTime}</span>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
                ${blog.tags.slice(0, 3).map((tag, index) => `
                    <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium ${index === 0 ? 'bg-accent/10 text-accent' : ''}">${tag}</span>
                `).join('')}
                ${blog.tags.length > 3 ? '<span class="text-xs text-gray-500">+' + (blog.tags.length - 3) + ' more</span>' : ''}
            </div>
            <a href="blog.html?slug=${blog.id}" class="text-accent hover:text-indigo-700 font-medium text-sm transition-colors">
                read article →
            </a>
        </div>
    `;
}

// Initialize copy code buttons functionality
function initCopyCodeButtons() {
    // Wait for content to be loaded
    setTimeout(() => {
        const codeBlocks = document.querySelectorAll('pre code');

        codeBlocks.forEach((codeBlock, index) => {
            const pre = codeBlock.parentElement;

            // Skip if copy button already exists
            if (pre.querySelector('.copy-code-btn')) return;

            // Add relative positioning to pre element
            pre.style.position = 'relative';

            // Create copy button
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-btn absolute top-2 right-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-all duration-200 opacity-80 hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center touch-action-manipulation';
            copyButton.innerHTML = `
                <div class="flex items-center gap-1.5">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    <span>Copy</span>
                </div>
            `;
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');

            // Add click handler
            const copyCodeHandler = async function() {
                const code = codeBlock.textContent;

                try {
                    await navigator.clipboard.writeText(code);

                    // Update button to show success
                    copyButton.innerHTML = `
                        <div class="flex items-center gap-1.5">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span>Copied!</span>
                        </div>
                    `;
                    copyButton.className = 'absolute top-2 right-2 px-3 py-2 bg-green-600 text-white text-xs rounded transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center';

                    // Reset button after 2 seconds
                    setTimeout(() => {
                        copyButton.innerHTML = `
                            <div class="flex items-center gap-1.5">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                </svg>
                                <span>Copy</span>
                            </div>
                        `;
                        copyButton.className = 'absolute top-2 right-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-all duration-200 opacity-80 hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center touch-action-manipulation';
                    }, 2000);

                } catch (err) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = code;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);

                    // Show success feedback
                    showToast('Code copied to clipboard!');
                }
            };
            addEventListenerWithCleanup(copyButton, 'click', copyCodeHandler);

            // Add button to pre element
            pre.appendChild(copyButton);
        });
    }, 500); // Delay to ensure content is fully loaded
}