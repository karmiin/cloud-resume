document.addEventListener('DOMContentLoaded', () => {
    
    // --- NAVIGATION LOGIC ---
    const dockItems = document.querySelectorAll('.dock-item');
    const sections = document.querySelectorAll('section');

    dockItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            
            // Update Dock Active State
            dockItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update Section Visibility
            sections.forEach(section => {
                section.classList.remove('active-section');
                if (section.id === targetId) {
                    section.classList.add('active-section');

                    if(targetId == 'feed'){
                        const listItems = document.querySelectorAll('.log-list li');
                        listItems.forEach((li, index) => {
                            li.style.animation = 'none';
                            li.offsetHeight; // Trigger reflow
                            li.style.opacity = '0';
                            li.style.animation = `fadeIn 0.5s ease forwards ${index * 0.2}s`;
                           
                        });
                    }
                }
            });
        });
    });

    // --- CANVAS BACKGROUND ANIMATION (The Nebula) ---
    const canvas = document.getElementById('nebula-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.z = Math.random() * 2 + 0.5; // Depth factor
            this.vx = (Math.random() - 0.5) * 0.2 * this.z;
            this.vy = (Math.random() - 0.5) * 0.2 * this.z;
            this.size = Math.random() * 1.5 * this.z;
            this.color = Math.random() > 0.6 ? 'rgba(0, 243, 255, ' : 'rgba(188, 19, 254, '; // Cyan or Purple
            this.baseAlpha = 0.3 * this.z;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Wrap around screen
            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color + this.baseAlpha + ')';
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < 150; i++) { // Increased count
            particles.push(new Particle());
        }
    }
    initParticles();

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Connect only if close enough and similar depth (z)
                if (distance < 120 && Math.abs(particles[i].z - particles[j].z) < 0.5) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${ (0.1 - distance/1200) * particles[i].z })`;
                    ctx.lineWidth = 0.3 * particles[i].z;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();


   
    const counterElement = document.getElementById('visitor-counter');
    API_URL = "https://ljjjjnmeisku6y3rvurca2rtii0prxjy.lambda-url.eu-central-1.on.aws";
    fetch(API_URL + '/api/visitors', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            counterElement.innerText = data.visitors;
            counterElement.classList.add('blink'); 
        })
        .catch(error => {
            console.error('Error fetching visitor count:', error);
            counterElement.innerText = "Offline";
            counterElement.style.color = "var(--accent-red)";
        });
    

    // --- CONTACT FORM SIMULATION ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerText;
            
            btn.innerText = "SENDING_PACKET...";
            btn.style.opacity = "0.7";
            
            setTimeout(() => {
                btn.innerText = "ACK_RECEIVED";
                btn.style.color = "var(--accent-green)";
                btn.style.borderColor = "var(--accent-green)";
                contactForm.reset();
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.color = "";
                    btn.style.borderColor = "";
                    btn.style.opacity = "1";
                }, 3000);
            }, 1500);
        });
    }

    // --- SKILLS GRAPH INTERACTION (Simple Drag Simulation) ---
    const skillNodes = document.querySelectorAll('.skill-node');
    skillNodes.forEach(node => {
        // Random float animation delay
        node.style.animation = `float ${3 + Math.random() * 2}s ease-in-out infinite`;
        node.style.animationDelay = `${Math.random() * 2}s`;
    });

    // Add float keyframes dynamically
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes float {
            0% { transform: translate(-50%, -50%) translateY(0px); }
            50% { transform: translate(-50%, -50%) translateY(-10px); }
            100% { transform: translate(-50%, -50%) translateY(0px); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(styleSheet);

    fetchGithubActivity();
    fetchSpotifyStatus();
    fetchBlog();
});

    // --- BLOG NAVIGATION ---
    const blogSection = document.getElementById('blog');
    const blogPostSection = document.getElementById('blog-post');
    const backToBlogBtn = document.getElementById('back-to-blog');

    if (backToBlogBtn) {
        backToBlogBtn.addEventListener('click', (e) => {
            e.preventDefault();
            blogPostSection.classList.remove('active-section');
            blogSection.classList.add('active-section');
        });
    }



async function fetchGithubActivity(){
    const logList = document.querySelector('.log-list');

    try{
        API_URL = "https://ljjjjnmeisku6y3rvurca2rtii0prxjy.lambda-url.eu-central-1.on.aws";
        const response = await fetch(API_URL + '/api/github')

        if(!response.ok)
            throw new Error('error ' + response.status);

        const data = await response.json();
        console.log(data);
        if(!Array.isArray(data)) return;

        logList.innerHTML = '';

        data.forEach((event, index) =>{
            const rawType = event.event_type || 'Event';
            const actionType = rawType.replace('Event', '').toUpperCase();
            const repoName = event.repo;
            const message = event.message;

            const li = document.createElement('li');
            li.innerHTML = `
            <span class="timestamp">${actionType}</span>
            <span class="cmd">${repoName}</span>
            ${message}
            `;

            //li.style.animation = `fadeIn 0.5s ease forwards ${index * 0.2}s`;
            li.style.opacity = '0';
            
            logList.appendChild(li);
        });

    } catch (error){
        console.error('Failed to fetch GitHub activity:', error);
    }
}



async function fetchSpotifyStatus() {
    const widget = document.querySelector('.spotify-widget');
    if (!widget) return;

    // Selettori interni al widget (assicurati che corrispondano al tuo HTML)
    const artImg = widget.querySelector('.album-art img');
    const titleEl = widget.querySelector('.song-title');
    const artistEl = widget.querySelector('.artist-name');
    const statusIcon = widget.querySelector('.status-icon'); // Se hai un'icona di stato

    try {
        API_URL = "https://ljjjjnmeisku6y3rvurca2rtii0prxjy.lambda-url.eu-central-1.on.aws";
        const response = await fetch(API_URL +'/api/spotify');
        const data = await response.json();

        if (data.is_playing) {
            // Aggiorna UI con i dati della canzone
            if (artImg) artImg.src = data.album_art;
            if (titleEl) titleEl.textContent = data.title;
            if (artistEl) artistEl.textContent = data.artist;
            
            // Rendi il widget cliccabile per aprire la canzone
            widget.style.cursor = 'pointer';
            widget.onclick = () => window.open(data.url, '_blank');

            // Attiva animazioni (es. rotazione vinile)
            widget.classList.add('playing');
            if (artImg) artImg.style.animationPlayState = 'running';
            
        } else {
            // Stato Offline / Pausa
            if (titleEl) titleEl.textContent = "Offline / Paused";
            if (artistEl) artistEl.textContent = "Spotify";
            
            widget.classList.remove('playing');
            if (artImg) artImg.style.animationPlayState = 'paused';
            widget.onclick = null;
        }
    } catch (error) {
        console.error("Errore Spotify:", error);
        if (titleEl) titleEl.textContent = "Connection Lost";
    }
}



async function fetchBlog() {
    const blogContainer = document.querySelector('.blog-container');
    if (!blogContainer) return;

    try {
        API_URL = "https://ljjjjnmeisku6y3rvurca2rtii0prxjy.lambda-url.eu-central-1.on.aws";
        const res = await fetch(`${API_URL}/api/blog`);
        const data = await res.json();
        
        // Handle both direct array (as per main.rs) and potential object wrapper
        const posts = Array.isArray(data) ? data : (data.posts || []);

        if (!Array.isArray(posts)) {
            console.error("Expected array of posts, got:", data);
            blogContainer.innerHTML = "<p>Error decoding transmission signal.</p>";
            return;
        }

        if (posts.length === 0) {
            blogContainer.innerHTML = "<p>No transmissions received.</p>";
            return;
        }

        const featuredPost = posts[0];
        const recentPosts = posts.slice(1);

        // Helper to format date
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        };
        
        // Helper to get category
        const getCategory = (labels) => {
             if (!labels || !Array.isArray(labels)) return 'GENERAL';
             const catLabel = labels.find(l => l.name.startsWith('category:'));
             return catLabel ? catLabel.name.replace('category:', '').toUpperCase() : 'GENERAL';
        };

        let html = '';

        // Featured Post
        if (featuredPost) {
            const category = getCategory(featuredPost.labels);
            const date = formatDate(featuredPost.created_at);
            const excerpt = featuredPost.body ? featuredPost.body.substring(0, 150) + "..." : "";

            html += `
                <div class="featured-post">
                    <div class="post-status">
                        <span class="blink-dot"></span> INCOMING TRANSMISSION
                    </div>
                    <h3 class="featured-title">${featuredPost.title}</h3>
                    <div class="post-meta">${date} // ${category}</div>
                    <p class="post-excerpt">
                        ${excerpt}
                    </p>
                    <a href="#" class="read-btn" onclick="openBlogPost(${JSON.stringify(featuredPost).replace(/"/g, '&quot;')})">DECRYPT_FULL_TEXT <i class="fas fa-arrow-right"></i></a>
                </div>
            `;
        }

        // Recent Posts
        if (recentPosts.length > 0) {
            html += '<div class="recent-posts">';
            recentPosts.forEach(post => {
                const category = getCategory(post.labels);
                const date = new Date(post.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
                
                html += `
                    <div class="post-item" onclick="openBlogPost(${JSON.stringify(post).replace(/"/g, '&quot;')})">
                        <span class="post-date">${date}</span>
                        <div class="post-info">
                            <h4>${post.title}</h4>
                            <span class="post-tag">${category}</span>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        blogContainer.innerHTML = html;

    } catch (error) {
        console.error("Blog Error:", error);
        blogContainer.innerHTML = "<p>Signal lost. Cannot retrieve transmissions.</p>";
    }
}

// Function to open blog post
window.openBlogPost = function(post) {
    const blogSection = document.getElementById('blog');
    const blogPostSection = document.getElementById('blog-post');
    
    // Populate content
    const articleTitle = blogPostSection.querySelector('.article-title');
    const articleMeta = blogPostSection.querySelector('.article-meta');
    const articleContent = blogPostSection.querySelector('.article-content');

    articleTitle.textContent = post.title;
    
    const date = new Date(post.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const labels = post.labels || [];
    const category = labels.find(l => l.name.startsWith('category:'))?.name.replace('category:', '').toUpperCase() || 'GENERAL';
    
    articleMeta.innerHTML = `
        <span><i class="far fa-calendar"></i> ${date}</span>
        <span><i class="fas fa-tag"></i> ${category}</span>
        <span><i class="far fa-clock"></i> ${Math.ceil(post.body.length / 500)} MIN READ</span>
    `;

    articleContent.innerHTML = marked.parse(post.body);

    // Switch sections
    blogSection.classList.remove('active-section');
    blogPostSection.classList.add('active-section');
    
    // Scroll to top
    blogPostSection.scrollTop = 0;
};