// Blog Content Data
const blogContent = {
    // Meta Information
    meta: {
        title: "Blogs - rohiitspace",
        description: "Thoughts, tutorials, and insights on software development, technology, and life as a developer.",
        keywords: "rohit, blog, software development, programming, tutorials, tech, developer insights",
        author: "Rohit",
        url: "https://www.rohiit.space/blogs.html",
        siteName: "rohiitspace",
        ogTitle: "Rohit's Blog - Developer Insights",
        ogDescription: "Thoughts, tutorials, and insights on software development, technology, and life as a developer.",
        ogImage: "https://www.rohiit.space/pfp.webp",
        twitterTitle: "Rohit's Blog - Developer Insights",
        twitterDescription: "Thoughts, tutorials, and insights on software development, technology, and life as a developer.",
        twitterImage: "https://www.rohiit.space/pfp.webp"
    },

    // Blog Listing Page Content
    listing: {
        title: "rohiitspace blogs",
        subtitle: "a documentation of what drove me and helped me to build stuff",
        description: "welcome to my corner of the internet where i share what i learn, build, and discover along the way."
    },

    // Individual Blog Posts
    blogs: [
        {
            id: "system-design-for-noobs-01-heartbeats",
            title: "system design for noobs | 01: heartbeats, status and scaling",
            excerpt: "an honest exploration of system design fundamentals, starting with user online/offline status tracking and scaling considerations for beginners.",
            date: "2025-07-18",
            readTime: "6 min read",
            tags: ["system design", "scaling", "databases", "learning"],
            featured: true,
            content: `
                <p>hello everyone, my name is rohit and i am an absolute noob in system design.</p>

                <p>if you had asked me 2 hour ago what system design is, my answer would have been something like, "system design is where you think about the best approaches that would help an app work, in worst of tsunamis and thunderstorms, before even start building it."</p>

                <p>in the last two hours though, i have managed to make myself a little more familiar with it. and so i will use this platform to spread whatever i have been able to gather.</p>

                <blockquote>
                <p>ps: there will be a lot of mistakes. rather than taking this as a guide/course to system design, take it as a documentation where i try to make sense of an unfamiliar territory by stepping into it, unaware of its laws. there might be a lot of crimes i might be committing during the journey, so feel free to correct me or bully me anywhere that happens.</p>
                </blockquote>

                <h2>📖 what is system design?</h2>

                <p>system design is the process of planning how different parts of a system or an application, like its architecture, components and how they interact and work together to meet the goals.</p>

                <p>it's like creating a blueprint that shows how different parts of a system fits and work together so everything works to do what it is supposed to. like how a building is first designed before construction.</p>

                <p>there are approaches to design a system and the two approaches we will get familiar with are:</p>

                <h3>🔁 spiral building:</h3>
                <p>where you understand the core component of a system and so you build that first and build everything else around it.</p>

                <h3>🧱 incremental building</h3>
                <p>where you:</p>
                <ol>
                    <li>start with day 0 architecture</li>
                    <li>see how each component would behave under load or at scale</li>
                    <li>identify the bottlenecks and things that holds back the system</li>
                    <li>re-architect the system</li>
                </ol>

                <p>both of these has their benefits and everyone has their preference. for now, lets not bother ourselves too much with these jargons and let's jump straight into designing something real.</p>

                <h2>🛠️ our first mini-project: online/offline indicator</h2>

                <p>a system where we need to show if a user is online or not. sounds simple.</p>

                <p>all we need is a user_id and a boolean entry in the database. user_id to represent a user and boolean to show if he's online or not.</p>

                <p>simple enough, right? let's dive deeper.</p>

                <p>so we send a GET request to the api service everytime we need to know if a user is offline/online. in database, we store a key value pair, where key is user_id and value is the boolean value based on his status. which DB to use? let's decide that later.</p>

                <p>suppose we have 1000 users, using our current solution we will have to make a request for each user's status, won't that be a bit expensive? one request for one user? ofcourse it will be.</p>

                <p>let's think of a solution. what if instead of making a GET req for a single user, we make a req for a batch of users? that should work, right?</p>

                <p>yes, it will help reduce request overhead to some point.</p>

                <p>what's our next step? to update the DB with the status.</p>

                <p>to do that, we will send the user's status periodically to inform DB if user is online or not. let's call this periodic update request a <strong>heartbeat</strong>.</p>

                <p>so the client will send a heartbeat periodically to api service, thus updating the user's status in DB.</p>

                <p>so when is a user offline? if there's no request received by api service for a long enough time, user will be marked as offline. the "long enough" can be subjective based on use cases. for now, we will assume this to be 30 seconds.</p>

                <p>to handle this more gracefully in our business logic, what we can do is instead of storing a boolean in our value, we will store the current timestamp, which will help us calculate how long it has been since the last heartbeat was sent.</p>

                <p>so when api service recieves a hearbeat, a DB query will be made like:</p>
                <pre><code>UPDATE pulse SET last_hb = now() WHERE user_id = user_batch</code></pre>

                <p>every time this query is sent, one of three things can happen:</p>
                <ul>
                    <li>if user doesn't exists in DB, he will be marked offline</li>
                    <li>if user exists and has last_hb < now() — 30 seconds then user will be offline</li>
                    <li>else he'll be marked as online</li>
                </ul>

                <h2>⚖️ scaling concerns</h2>

                <p>now, let us do some scaling calculations.</p>

                <p>we are storing one entry in DB consisting of two integer values, the user_id and last_hb.</p>
                <p>size(int) = 4 bytes => size(entry) = 8 bytes</p>

                <p>1 billion users means 1 billion entries</p>

                <p>therefore, <strong>storage required for 1 billion users = 8GB</strong></p>

                <p>which is not too much considering only your phone has 128 GB and probably atleast 12 GB RAM. still, can we do better on the storage?</p>

                <p>let's find out.</p>

                <p>since all we need to care about is if user is online or not, maybe we can change our DB to only store user if he is online and remove any entry from the DB where user is offline?</p>

                <ul>
                    <li><strong>presence = online</strong></li>
                    <li><strong>absence = offline</strong></li>
                </ul>

                <p>that helps us lessen the storage from 8 GB right?</p>

                <p>to achieve this, we will expire the entries and delete them from DB after recieving no new heartebeat for 30 seconds.</p>

                <p>if we do this, we save bunch of space by not storing offline users.</p>

                <p><strong>if 1 billion total users has 100k active users then our total storage comes down to 800 KB from 8GB. big win, right?</strong></p>

                <h2>💡 optimization with ttl</h2>

                <p>now comes the question, how to auto delete the expired entries? we have two options to do this.</p>

                <p>the first one is creating a cron job that will delete the expired entries for us and second option is offloading this task to our DB.</p>

                <p>the cron job is something which will be managed by some external tool while DB operations are internal since we are already using one.</p>

                <p>thats why the second option would be a better choice because it saves a lot of extra work and we should not reinvent the wheel if we don't have to.</p>

                <p>there are many different DBs that supports expiration and key value handling. <strong>Redis and dynamoDB</strong> are just the two of them.</p>

                <p>choosing a suitable DB is also an important part of system design since it deciedes a lot of things for us inherently based on the DB we choose. there are many factors to consider like persistence, management, vendor locking, competition, time sensitivity, etc. these factors are better understood when you are aware of how a DB actually functions and what it provides. we will keep this topic for someday else. for now, let's focus on our system.</p>

                <p>so we can use such a DB and upon recieving a heartbeat, we will update the entry in our DB with a TTL(time to live) definition of 30 sec. this makes a lot of things easy for us.</p>

                <blockquote>
                <p><strong>note:</strong> in real world, web sockets are actually used for such systems, we are just using this as an example for the sake of simplicity. let's explore websockets someday else.</p>
                </blockquote>

                <h2>📉 reducing load on the db</h2>

                <p>let's check how is our DB doing right now.</p>

                <p>what we know is, a heartbeat is sent every 30 second. so one user sends 6 heartbeats in one minute.</p>

                <p>which means, if there are 1 million active users, our system will be getting <strong>6 million requests per minute</strong>. since each heartbeat results in 1 DB call, our DB is currently handling 6 million updates per minute which is <strong>VERY SCARY</strong>.</p>

                <p>how to fix this and make a better system?</p>

                <p><em>let's dive into that next time.</em></p>

                <h2>🧠 wrap-up</h2>

                <blockquote>
                <p>system design is not a something you drink in one gulp, it's meant to be sipped very slowly.</p>
                </blockquote>

                <p>it can easily take 1–1.5 years for someone to be get perfect in system design, and we will reach there with patience, perserverence and consistency.</p>

                <p>see you next time.</p>
                <p><strong>rohit.</strong></p>
            `
        },
        {
            id: "blockchain-101",
            title: "blockchain 101",
            excerpt: "demystifying blockchain technology with simple explanations and practical examples. understand what makes blockchain special and why it's revolutionizing digital transactions.",
            date: "2024-08-07",
            readTime: "5 min read",
            tags: ["blockchain", "cryptocurrency", "technology", "beginners"],
            featured: true,
            content: `
                <h2>welcome to blockchain 101.</h2>

                <p>i bet you have a lot of questions going on, let us start with the most common one:</p>

                <blockquote>
                <p><strong>"what is blockchain and why do i keep hearing about it on the internet so much?"</strong></p>
                </blockquote>

                <p>i bet you've asked this yourself a lot of times, if not then it's time you do.</p>

                <p>a blockchain is as simple as its name suggests. it is a <strong>chain of blocks</strong>.</p>

                <p><em>"blocks of what?"</em></p>

                <p>blocks of data that <strong>can not be changed</strong>. yes, it fails all your erasers and backspaces. once a block is written it can't be altered, fixed, or deleted.</p>

                <h2>🔗 how does blockchain work?</h2>

                <p>imagine you're in a classroom taking a test. every time someone completes a question, they announce it to the entire class. everyone writes down what that person answered.</p>

                <p>now, if someone tries to change their answer later, everyone else will notice because they all have the original answer written down. that person will be called a cheater and their new answer will be rejected.</p>

                <p>this is exactly how blockchain works:</p>
                <ul>
                    <li>when a new block is created, it's broadcast to thousands of computers worldwide</li>
                    <li>everyone gets a notification and saves a copy</li>
                    <li>if someone tries to modify a block later, the network rejects it as "cheating"</li>
                </ul>

                <h2>🌐 what makes blockchain special?</h2>

                <h3>decentralized</h3>
                <p>no single person, company, or government controls it. it's maintained by thousands of computers working together.</p>

                <h3>transparent</h3>
                <p>every action is visible to everyone in the network. there are no hidden transactions or secret changes.</p>

                <h3>secure</h3>
                <p>because everyone has a copy and is watching, it's extremely difficult to manipulate or hack.</p>

                <h2>💰 practical example: cryptocurrency</h2>

                <p>blockchain enables a new type of digital money called cryptocurrency. unlike traditional money controlled by governments and banks, cryptocurrencies are:</p>

                <ul>
                    <li><strong>impossible to manipulate</strong> - every transaction is recorded and verified</li>
                    <li><strong>globally accessible</strong> - works the same everywhere in the world</li>
                    <li><strong>transparent</strong> - anyone can verify transactions</li>
                </ul>

                <p>when you send cryptocurrency to someone, that transaction becomes a new block. the entire network verifies it's legitimate before adding it to the chain permanently.</p>

                <h2>🚀 why does this matter?</h2>

                <p>blockchain is revolutionizing how we think about:</p>
                <ul>
                    <li>digital ownership and assets</li>
                    <li>financial transactions without middlemen</li>
                    <li>transparent and trustworthy record-keeping</li>
                    <li>global systems that work without central control</li>
                </ul>

                <p>this technology is still in its early stages, but it's already changing industries from finance to healthcare to supply chain management.</p>

                <p>next up: cryptocurrency 101 - how digital money actually works and why it's more than just "internet money."</p>
            `
        }
    ]
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = blogContent;
} else if (typeof window !== 'undefined') {
    window.blogContent = blogContent;
}