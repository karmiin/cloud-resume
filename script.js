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
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerText;
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            btn.innerText = "SENDING_PACKET...";
            btn.style.opacity = "0.7";
            btn.disabled = true;

            try {
                const response = await fetch(API_URL + '/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, message })
                });
                
                const data = await response.json();

                if (data.success === "true" || data.success === true) {
                    btn.innerText = "ACK_RECEIVED";
                    btn.style.color = "var(--accent-green)";
                    btn.style.borderColor = "var(--accent-green)";
                    contactForm.reset();
                    
                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.style.color = "";
                        btn.style.borderColor = "";
                        btn.style.opacity = "1";
                        btn.disabled = false;
                    }, 3000);
                } else {
                    throw new Error(data.error || "Unknown error");
                }
            } catch (error) {
                console.error('Contact form error:', error);
                btn.innerText = "ERR_TRANSMISSION";
                btn.style.color = "var(--accent-red)";
                btn.style.borderColor = "var(--accent-red)";
                alert("Error: " + error.message);
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.color = "";
                    btn.style.borderColor = "";
                    btn.style.opacity = "1";
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // --- SKILLS GRAPH INTERACTION ---
    const skillsData = [
    // --- CENTRO: IL TUO PROFILO "SYSTEMS" ---
    { 
        id: 'core', 
        label: 'CORE', 
        x: 50, y: 50, 
        type: 'hub', 
        desc: 'Systems Engineering & Cloud Architecture. Focus on High Performance Computing (HPC) and Scalability.', 
        level: 100, 
        tags: ['Systems Eng', 'Cloud Native'] 
    },
    
    // --- RAMO 1: MULTI-CLOUD (AWS + AZURE) ---
    { 
        id: 'cloud', 
        label: 'CLOUD', 
        x: 20, y: 30, 
        type: 'category', 
        parent: 'core', 
        desc: 'Designing distributed architectures across different providers (Multi-Cloud).', 
        level: 95, 
        tags: ['AWS', 'Azure'] 
    },
    { 
        id: 'aws', 
        label: 'AWS', 
        x: 10, y: 15, 
        parent: 'cloud', 
        desc: 'Serverless architecture (Lambda), Infrastructure as Code (Terraform), and Networking.', 
        level: 85, 
        tags: ['Terraform', 'Serverless'] 
    },
    { 
        id: 'azure', 
        label: 'AZURE', 
        x: 30, y: 10, 
        parent: 'cloud', 
        desc: 'Identity Management (AD B2C), integrating ML models (OCR) and Cognitive Services.', 
        level: 80, 
        tags: ['Auth B2C', 'AI Services', 'ML'] 
    },
    
    // --- RAMO 2: SYSTEMS PROGRAMMING & HPC (Il tuo valore aggiunto) ---
    { 
        id: 'systems', 
        label: 'SYSTEMS', 
        x: 80, y: 30, 
        type: 'category', 
        parent: 'core', 
        desc: 'Low-level programming focused on memory safety, concurrency, and parallelism.', 
        level: 90, 
        tags: ['Performance', 'Parallelism'] 
    },
    { 
        id: 'rust', 
        label: 'RUST', 
        x: 90, y: 15, 
        parent: 'systems', 
        desc: 'Memory-safe systems programming. Async runtimes (Tokio) and web frameworks (Axum).', 
        level: 80, 
        tags: ['Safety', 'Async'] 
    },
    { 
        id: 'cpp', 
        label: 'C / C++', 
        x: 85, y: 45, 
        parent: 'systems', 
        desc: 'Deep knowledge of memory management, pointers, and object-oriented design.', 
        level: 85, 
        tags: ['STL', 'Memory Mgmt'] 
    },
    { 
        id: 'hpc', 
        label: 'HPC / CUDA', 
        x: 95, y: 30, 
        parent: 'systems', 
        desc: 'Parallel computing on GPU (CUDA) and distributed processing (OpenMPI).', 
        level: 70, 
        tags: ['GPU', 'OpenMPI', 'Grid'] 
    },

    // --- RAMO 3: GLUE CODE & DEVOPS ---
    { 
        id: 'ops', 
        label: 'OPS & TOOLS', 
        x: 50, y: 80, 
        type: 'category', 
        parent: 'core', 
        desc: 'Tools to glue systems together, automate deployments, and manage environments.', 
        level: 85, 
        tags: ['Automation', 'Linux'] 
    },
    { 
        id: 'python', 
        label: 'PYTHON', 
        x: 35, y: 90, 
        parent: 'ops', 
        desc: 'Scripting for automation, Data Analysis, and Cloud SDK interactions.', 
        level: 90, 
        tags: ['Scripting', 'Boto3'] 
    },
    { 
        id: 'docker', 
        label: 'DOCKER', 
        x: 65, y: 90, 
        parent: 'ops', 
        desc: 'Containerization for consistent environments and microservices deployment.', 
        level: 85, 
        tags: ['Containers', 'Compose'] 
    },
    { 
        id: 'java', 
        label: 'JAVA', 
        x: 50, y: 95, 
        parent: 'ops', 
        desc: 'Object Oriented Programming and Enterprise backend structures.', 
        level: 80, 
        tags: ['OOP', 'Backend'] 
    }
];

    function initSkillsGraph() {
        const container = document.getElementById('skills-nodes');
        const svg = document.getElementById('skills-connections');
        const panel = document.getElementById('skill-detail-panel');
        if (!container || !svg) return;

        // Clear existing
        container.innerHTML = '';
        svg.innerHTML = '';

        // Helper to create SVG line
        const createLine = (x1, y1, x2, y2) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', `${x1}%`);
            line.setAttribute('y1', `${y1}%`);
            line.setAttribute('x2', `${x2}%`);
            line.setAttribute('y2', `${y2}%`);
            line.setAttribute('stroke', 'rgba(0, 243, 255, 0.2)');
            line.setAttribute('stroke-width', '1');
            return line;
        };

        // 1. Draw Connections first (so they are behind nodes)
        skillsData.forEach(skill => {
            if (skill.parent) {
                const parent = skillsData.find(s => s.id === skill.parent);
                if (parent) {
                    svg.appendChild(createLine(skill.x, skill.y, parent.x, parent.y));
                }
            }
        });

        // 2. Draw Nodes
        skillsData.forEach(skill => {
            const node = document.createElement('div');
            node.className = 'skill-node';
            node.textContent = skill.label;
            node.style.left = `${skill.x}%`;
            node.style.top = `${skill.y}%`;
            
            node.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent closing when clicking node
                showSkillDetails(skill, node);
            });

            container.appendChild(node);
        });

        // Close panel logic
        const closePanel = () => {
            panel.classList.add('hidden');
            document.querySelectorAll('.skill-node').forEach(n => n.classList.remove('active'));
        };

        document.getElementById('close-skill-panel').addEventListener('click', closePanel);

        // Close when clicking outside (Background)
        document.addEventListener('click', (e) => {
            // Nodes stop propagation, so this fires for background or panel clicks.
            // We check if click is NOT inside the panel.
            if (!panel.contains(e.target) && !panel.classList.contains('hidden')) {
                closePanel();
            }
        });
    }

    function showSkillDetails(skill, nodeElement) {
        const panel = document.getElementById('skill-detail-panel');
        const nameEl = document.getElementById('skill-name');
        const descEl = document.getElementById('skill-desc');
        const levelEl = document.getElementById('skill-level');
        const tagsEl = document.getElementById('skill-tags');

        // Highlight active node
        document.querySelectorAll('.skill-node').forEach(n => n.classList.remove('active'));
        nodeElement.classList.add('active');

        // Populate Data
        nameEl.textContent = skill.label;
        descEl.textContent = skill.desc;
        tagsEl.innerHTML = skill.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('');
        
        // Reset animation
        levelEl.style.width = '0%';
        panel.classList.remove('hidden');
        
        // Animate bar
        setTimeout(() => {
            levelEl.style.width = `${skill.level}%`;
        }, 100);
    }

    initSkillsGraph();

    fetchGithubActivity();
    fetchSpotifyStatus();
    fetchBlog();
});

    // --- BLOG NAVIGATION ---
    const blogSection = document.getElementById('blog');
    const blogPostSection = document.getElementById('blog-post');
    // Fix: Select only back buttons within the blog post section to avoid conflict with Project Detail back button
    const backBtns = document.querySelectorAll('#blog-post .back-btn');

    backBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            blogPostSection.classList.remove('active-section');
            blogSection.classList.add('active-section');
        });
    });
// --- PROJECTS DATA & RENDERING ---
const projectsData = [
    {
        id: 'cloud-resume',
        title: 'Serverless Cloud Resume',
        category: 'Cloud Native',
        tech: ['Rust', 'AWS Lambda', 'Terraform', 'GitHub Actions', 'DynamoDB'],
        description: 'A full-stack serverless platform built with a "Zero-Cost" architecture. Features a high-performance Rust backend (Axum), Infrastructure as Code for reproducible deployments, and a custom CI/CD pipeline performing atomic cache invalidations on edge locations.',
        links: {
            github: 'https://github.com/karmiin/cloud-resume',
            live: 'https://karmin.dev'
        },
        featured: true
    },
    {
        id: 'smartbills',
        title: 'Smart Bills',
        category: 'Cloud ML',
        tech: ['Azure AD B2C', 'Azure Cosmos DB', 'Azure Document Intelligence', 'Python', 'Flask', 'Azure Blob Storage'],
        description: 'Smart Bills is an intelligent bill-management system that automates document processing and provides advanced analytics. It automatically uploads and analyzes utility bills using Azure Document Intelligence, delivers interactive dashboards and forecasting insights, and ensures secure access through Azure AD B2C. The platform stores structured data in Azure Cosmos DB and offers a seamless end-to-end workflow powered by Python, Flask, and modern cloud technologies.',
        links: {
            github: 'https://github.com/karmiin/smartbills',
            live: null
        },
        featured: false
    }
];

    function renderProjects() {
        const container = document.getElementById('projects-grid');
        if (!container) return;

        container.innerHTML = projectsData.map(project => `
            <div class="project-card ${project.featured ? 'featured' : ''}" onclick="openProject('${project.id}')" style="cursor: pointer;">
                <div class="project-header">
                    <div class="folder-icon"><i class="far fa-folder"></i></div>
                    <div class="project-links">
                        <i class="fas fa-expand-arrows-alt"></i>
                    </div>
                </div>
                <h3 class="project-title">${project.title}</h3>
                <p class="project-desc">${project.description.substring(0, 100)}...</p>
                <div class="project-tech-list">
                    ${project.tech.slice(0, 3).map(t => `<span class="tech-tag">${t}</span>`).join('')}
                    ${project.tech.length > 3 ? `<span class="tech-tag">+${project.tech.length - 3}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderProjects();

    // --- PROJECT DETAIL NAVIGATION ---
    window.openProject = function(projectId) {
        const project = projectsData.find(p => p.id === projectId);
        if (!project) return;

        const projectsSection = document.getElementById('projects');
        const detailSection = document.getElementById('project-detail');
        
        // Populate Data
        document.getElementById('proj-title').textContent = project.title;
        document.getElementById('proj-category').textContent = project.category;
        document.getElementById('proj-desc').textContent = project.description;
        
        const techContainer = document.getElementById('proj-tech');
        techContainer.innerHTML = project.tech.map(t => `<span class="big-tech-tag">${t}</span>`).join('');

        const btnGithub = document.getElementById('btn-github');
        const btnLive = document.getElementById('btn-live');

        if (project.links.github) {
            btnGithub.href = project.links.github;
            btnGithub.style.display = 'flex';
        } else {
            btnGithub.style.display = 'none';
        }

        if (project.links.live) {
            btnLive.href = project.links.live;
            btnLive.style.display = 'flex';
        } else {
            btnLive.style.display = 'none';
        }

        // Switch View
        projectsSection.classList.remove('active-section');
        detailSection.classList.add('active-section');
    };

    document.getElementById('back-to-projects').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('project-detail').classList.remove('active-section');
        document.getElementById('projects').classList.add('active-section');
    });

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
            // Removed excerpt to show only title as requested

            html += `
                <div class="featured-post">
                    <div class="post-status">
                        <span class="blink-dot"></span> INCOMING TRANSMISSION
                    </div>
                    <h3 class="featured-title">${featuredPost.title}</h3>
                    <div class="post-meta">${date} // ${category}</div>
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