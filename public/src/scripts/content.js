// Website Content Data
const siteContent = {
    // Meta Information
    meta: {
        title: "Rohit | Software Engineer in Bangalore | rohiitspace",
        description: "Rohit's portfolio - Computer science grad building fullstack apps, computer vision solutions, and automation tools. SIH 2024 finalist.",
        keywords: "rohit, portfolio, developer, computer science, fullstack, computer vision, python, javascript, react",
        author: "Rohit",
        url: "https://www.rohiit.space/",
        siteName: "rohiitspace",
        ogTitle: "Rohit - Software Developer",
        ogDescription: "Computer science grad building fullstack apps, computer vision solutions, and automation tools. SIH 2024 finalist working at OpenBlood.",
        ogImage: "https://www.rohiit.space/pfp.webp",
        twitterTitle: "Rohit - Software Developer",
        twitterDescription: "Computer science grad building fullstack apps, computer vision solutions, and automation tools. SIH 2024 finalist working at OpenBlood.",
        twitterImage: "https://www.rohiit.space/pfp.webp"
    },

    // Personal Information
    personal: {
        name: "rohit",
        profileImage: "assets/images/pfp.webp",
        fallbackImage: "assets/images/pfp.webp",
        location: "bangalore",
        currentCompany: {

        }
    },

    // Navigation
    navigation: [
        { name: "about", href: "#about" },
        { name: "experience", href: "#experience" },
        { name: "projects", href: "#projects" },
        { name: "achievements", href: "#achievements" }
    ],

    // Hero Section
    hero: {
        greeting: "hi, i'm rohit  ",
        tldrTitle: "tldr;",
        tldrContent: [
            "i'm obsessed with ideas (even if half of them don't show up).",
            "interned at a startup as a '<strong>python intern</strong>' where they threw <strong>C++</strong> at me day 1. i didn't know it. <strong>still cooked</strong>.",
            "i adapt fast. tools change, but shipping matters more."
        ]
    },

    // About Section
    about: {
        title: "about me",
        content: [
            "i'm a computer science grad who just likes building stuff that works. Whether it's <strong>full-stack apps</strong>, <strong>computer vision</strong> or <strong>automation</strong>, i'll pick up whatever tool gets the job done.",
            "right now, I'm in <strong>bangalore</strong>, hacking on real problems and trying to solve them with code. i like to move fast, take initiative, and believe in just getting things done."
        ]
    },

    // Experience Section
    experience: {
        title: "experience",
        jobs: [
            {
                title: "software engineer",
                company: "alvora",
                companyUrl: "https://www.linkedin.com/company/alvora-group/",
                duration: "oct 2025 - present",
                description: "primary author of the backend (<strong>Express/TypeScript</strong>, <strong>PostgreSQL</strong>, no ORM): 15 domains covering booking lifecycle, scheduling, billing, and admin reporting; <strong>41 test suites</strong> with enforced CI coverage.<br> <br>migrated the platform off Supabase to self-hosted <strong>Better Auth</strong> (invite-only onboarding, role-based access, Google OAuth). built the <strong>React 19</strong> frontend with dual role-based portals, and an <strong>iCal sync bridge</strong> integrating a Timefold scheduling solver and billing microservice."
            },
            {
                title: "software engineer intern",
                company: "alvora",
                companyUrl: "https://www.linkedin.com/company/alvora-group/",
                duration: "aug 2025 - sep 2025",
                description: "built a tiered scraping pipeline processing <strong>~3,000 listings/day</strong>: direct JSON API first (~30 KB) with a <strong>Playwright</strong> browser fallback (~2 MB), reducing per-property bandwidth by <strong>98.5%</strong>.<br> <br>authored 107 of 113 commits across the ingestion service; implemented batch scheduling, IP rotation, health monitoring, and a <strong>FastAPI + PostgreSQL</strong> storage pipeline."
            },
            {
                title: "python developer intern",
                company: "celebrare",
                companyUrl: "https://in.linkedin.com/company/celebrarecompany",
                duration: "nov 2024 - apr 2025",
                description: "benchmarked multiple <strong>face-recognition models</strong> across image datasets, measuring accuracy, latency, and throughput; experimented with clustering algorithms to improve recognition quality.<br> <br>rewrote the production pipeline from <strong>python to C++</strong>, achieving a <strong>5–8x speedup</strong> and reducing average processing latency by <strong>91%</strong>."
            }
        ]
    },

    // Projects Section
    projects: {
        title: "projects",
        items: [
            {
                title: "fynl-it",
                description: "ai-powered <strong>invoice follow-up platform</strong> integrating gemini ai, supabase, and razorpay to automate payment reminders. event-driven workflows with <strong>configurable escalation rules</strong> and prompt-based communication.",
                technologies: ["next.js", "supabase", "gemini ai", "tailwindcss"],
                links: {
                    live: "https://fynl-it.vercel.app/"
                }
            },
            {
                title: "on-device semantic segmentation webapp",
                description: "real-time satellite image analysis via <strong>lightweight u-net model</strong> in-browser. led <strong>r&d + gpu deployment pipeline</strong> for inference at the edge.",
                technologies: ["react", "python", "tensorflow"],
                links: {
                    live: "https://semseg.vercel.app/"
                }
            },
            {
                title: "mailsync",
                description: "ai-powered <strong>email intelligence platform</strong> that syncs mailboxes over persistent imap. <strong>semantic search</strong> with elasticsearch + qdrant and retrieval-augmented generation for natural-language querying, on fault-tolerant background workers.",
                technologies: ["node.js", "imap", "elasticsearch", "qdrant", "gemini"],
                links: {
                    github: "https://github.com/rohiitgit/mailsync"
                }
            },
            {
                title: "kdoc",
                description: "document processing pipeline in <strong>go</strong> with concurrent worker pools on <strong>redis streams</strong> — retries, dead-letter queues, and observability tooling. <strong>load-tested to 30k documents</strong> and validated with a 108-test suite.",
                technologies: ["go", "sqlite", "redis", "docker", "prometheus"],
                links: {
                    github: "https://github.com/rohiitgit/kdoc"
                }
            }
        ]
    },

    // Side Projects Section
    sideProjects: {
        title: "i made it cuz im lazy",
        items: [
            {
                title: "nodemaid",
                description: "cli tool to find and delete all node_modules folders in a directory. because manually searching for them is exhausting.",
                technologies: ["node.js", "cli"],
                links: {
                    live: "https://www.npmjs.com/package/nodemaid",
                    github: "https://github.com/rohiitgit/nodemaid"
                }
            }
        ]
    },

    // Achievements Section
    achievements: {
        title: "achievements & certifications",
        achievements: [
            {
                title: "smart india hackathon 2024 finalist",
                url: "https://www.linkedin.com/posts/rohiitcodes_smart-india-hackathon-was-a-fabulous-experience-activity-7274397856336101376-Rh_Q?utm_source=share&utm_medium=member_desktop",
                description: "finalist in national hackathon; built <strong>webgis solution for isro</strong>. used meta's <strong>segment anything model v2</strong> for precise satellite image segmentation.",
                image: "assets/images/sih.webp",
                imageAlt: "Smart India Hackathon 2024 Certificate"
            }
        ],
        certifications: [
            {
                title: "intermediate machine learning",
                organization: "kaggle",
                url: "https://www.kaggle.com/learn/certification/rohiitcodes/intermediate-machine-learning",
                date: "sep 2023"
            },
            {
                title: "machine learning explainability",
                organization: "kaggle",
                url: "https://www.kaggle.com/learn/certification/rohiitcodes/machine-learning-explainability",
                date: "sep 2023"
            }
        ]
    },

    // Music Section
    music: {
        title: "recently played"
    },

    // Footer
    footer: {
        built: "built using html, tailwind css & vanilla js",
        inspired: "inspired by <a href=\"https://tailwindcss.com/\" class=\"underline\">tailwindcss</a>, berserk & haikyuu!!",
        copyright: "© 2026 rohit. all rights reserved."
    },

    // Social Links
    social: {
        email: "rohitcodes03@gmail.com",
        twitter: "https://x.com/rohiitspace",
        linkedin: "https://linkedin.com/in/rohiitcodes",
        github: "https://github.com/rohiitgit",
        cal: "https://cal.com/rohiitcodes/15min"
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = siteContent;
} else if (globalThis.window !== undefined) {
    globalThis.siteContent = siteContent;
}
