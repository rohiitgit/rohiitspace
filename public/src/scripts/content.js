// Website Content Data
const siteContent = {
    // Meta Information
    meta: {
        title: "rohiitspace",
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
        profileImage: "https://media.licdn.com/dms/image/v2/D5603AQEfT67Uns4tJw/profile-displayphoto-crop_800_800/B56Zf4vxyoHUAI-/0/1752224965896?e=1761177600&v=beta&t=TKN2q9Sl986zN0b4U_JgroJj_dSma_uRCi6iGOAZzGQ",
        fallbackImage: "assets/images/pfp.webp",
        location: "agra, UP",
        currentCompany: {
            name: "openblood",
            url: "https://www.linkedin.com/company/openblood/posts/?feedView=all"
        }
    },

    // Navigation
    navigation: [
        { name: "about", href: "#about" },
        { name: "experience", href: "#experience" },
        { name: "projects", href: "#projects" },
        { name: "skills", href: "#skills" },
        { name: "achievements", href: "#achievements" },
        { name: "blogs", href: "blogs.html" }
    ],

    // Hero Section
    hero: {
        greeting: "hi, i'm rohit 👋",
        tldrTitle: "tldr;",
        tldrContent: [
            "i'm obsessed with ideas (even if half of them don't show up).",
            "interned at a startup as a '<strong>python intern</strong>' where they threw <strong>C++</strong> at me day 1. i didn't know it. <strong>still cooked</strong>.",
            "currently building at <a href=\"https://www.linkedin.com/company/openblood/posts/?feedView=all\" class=\"text-accent hover:text-indigo-700 transition-colors font-semibold\">@openblood.</a>",
            "i adapt fast. tools change, but shipping matters more."
        ]
    },

    // About Section
    about: {
        title: "about me",
        content: [
            "i'm a computer science grad who just likes building stuff that works. Whether it's <strong>full-stack apps</strong>, <strong>computer vision</strong> or <strong>automation</strong>, i'll pick up whatever tool gets the job done.",
            "right now, I'm in <strong>agra, UP</strong>, hacking on real problems and trying to solve them with code. i like to move fast, take initiative, and believe in just getting things done."
        ]
    },

    // Experience Section
    experience: {
        title: "experience",
        jobs: [
            {
                title: "engineer intern",
                company: "openblood",
                companyUrl: "https://www.linkedin.com/company/openblood/posts/?feedView=all",
                duration: "aug 2025 - present",
                description: "building <strong>openblood website</strong> with <strong>GSAP</strong>, <strong>HTML</strong>, <strong>TailwindCSS</strong> with smooth animations, modern UI, clean design system."
            },
            {
                title: "software developer engineer",
                company: "boundspec",
                companyUrl: "https://www.boundspec.com/",
                duration: "apr 2025 - sept 2025",
                description: "built role-based dashboards for <strong>doctor-patient booking</strong> system with dynamic ui/ux. developed <strong>core features for rydr</strong>, a biker community app — club creation, feed with maps. integrated <strong>sanity cms</strong> for dynamic content across prajna and boundspec websites. contributed full-stack features for production apps, using <strong>react native + supabase</strong>."
            },
            {
                title: "remote python developer intern",
                company: "celebrare",
                companyUrl: "https://in.linkedin.com/company/celebrarecompany",
                duration: "nov 2024 - apr 2025",
                description: "developed <strong>automated image processing pipelines</strong> using python and opencv. rewrote <strong>face recognition pipeline</strong> from python to c++ achieving <strong>5–8x performance gain</strong>. optimized vision models, reducing <strong>average processing time by 91.11%</strong>. maintained <strong>99% accuracy</strong>, added support for multiple orientations/formats."
            }
        ]
    },

    // Projects Section
    projects: {
        title: "projects",
        items: [
            {
                title: "fynl-it",
                description: "fullstack tool to <strong>automate invoice follow-up emails</strong> with progressive ai tone. integrated <strong>secure payment detection</strong> using razorpay upi.",
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
                title: "web3 referral platform landing page",
                description: "created <strong>responsive, animated landing page</strong> for blockchain referral startup. built <strong>reusable and performant ui components</strong>.",
                technologies: ["next.js", "tailwindcss"],
                links: {
                    live: "https://web3-referral-landing.vercel.app/"
                }
            }
        ]
    },

    // Skills Section
    skills: {
        title: "skills",
        categories: [
            {
                title: "languages",
                items: [
                    { name: "python", highlight: true },
                    { name: "javascript", highlight: true },
                    { name: "c/c++", highlight: true },
                    { name: "solidity", highlight: false },
                    { name: "react", highlight: true },
                    { name: "tailwindcss", highlight: true },
                    { name: "html/css", highlight: false }
                ]
            },
            {
                title: "backend",
                items: [
                    { name: "node.js", highlight: true },
                    { name: "flask", highlight: true },
                    { name: "rest apis", highlight: true }
                ]
            },
            {
                title: "tools",
                items: [
                    { name: "supabase", highlight: true },
                    { name: "mongodb", highlight: true },
                    { name: "sanity cms", highlight: true },
                    { name: "git", highlight: true },
                    { name: "docker", highlight: false },
                    { name: "postman", highlight: false },
                    { name: "arch linux", highlight: true }
                ]
            },
            {
                title: "ml/ai",
                items: [
                    { name: "computer vision", highlight: true },
                    { name: "opencv", highlight: true },
                    { name: "meta's SAM-2", highlight: true }
                ]
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
                image: "https://media.licdn.com/dms/image/v2/D5622AQFtlSU8SO8orw/feedshare-shrink_2048_1536/B56ZPPaQa5G8As-/0/1734351591846?e=1761177600&v=beta&t=W_5AxIVXytuX9V5mwq_3mK0iSAyzIR1s_BY0g2QccTU",
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
        inspired: "inspired by <a href=\"https://tailwindcss.com/\" class=\"underline\">tailwindcss</a>.",
        copyright: "© 2025 rohit. all rights reserved."
    },

    // Social Links
    social: {
        email: "rohitcodes03@gmail.com",
        github: "https://github.com/rohiitgit",
        linkedin: "https://linkedin.com/in/rohiitcodes"
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = siteContent;
} else if (typeof window !== 'undefined') {
    window.siteContent = siteContent;
}