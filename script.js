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


    // --- VISITOR COUNTER ---
    const counterElement = document.getElementById('visitor-counter');
    const apiUrl = "https://ljjjjnmeisku6y3rvurca2rtii0prxjy.lambda-url.eu-central-1.on.aws/";

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            counterElement.innerText = data.count || "Error";
            counterElement.classList.add('blink'); // Add effect on load
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
    `;
    document.head.appendChild(styleSheet);

    fetchGithubActivity();
});

    // --- BLOG NAVIGATION ---
    const blogSection = document.getElementById('blog');
    const blogPostSection = document.getElementById('blog-post');
    const openPostBtn = document.getElementById('open-blog-post');
    const backToBlogBtn = document.getElementById('back-to-blog');

    if (openPostBtn && backToBlogBtn) {
        openPostBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Hide current section (blog)
            blogSection.classList.remove('active-section');
            // Show post section
            blogPostSection.classList.add('active-section');
        });

        backToBlogBtn.addEventListener('click', (e) => {
            e.preventDefault();
            blogPostSection.classList.remove('active-section');
            blogSection.classList.add('active-section');
        });
    }

    // --- SPOTIFY WIDGET LOGIC ---
    const tracks = [
        { title: "Neural Net Dreams", artist: "Synthwave Boy" },
        { title: "Deploying to Prod", artist: "The DevOps" },
        { title: "Rust in Peace", artist: "Megadeth (Cover)" },
        { title: "Cloud City", artist: "Lando" },
        { title: "Infinite Loop", artist: "While(True)" }
    ];

    const trackEl = document.getElementById('spotify-track');
    const artistEl = document.getElementById('spotify-artist');
    
if (trackEl && artistEl) {
    let currentTrackIndex = 0;
    
    function updateTrack() {
        const track = tracks[currentTrackIndex];
        trackEl.textContent = track.title;
        artistEl.textContent = track.artist;
        
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    }

    // Change track every 30 seconds (simulating song end)
    setInterval(updateTrack, 30000);
}

async function fetchGithubActivity(){
    const logList = document.querySelector('.log-list');

    try{
        const response = await fetch('/api/github')

        if(!response.ok)
            throw new Error('error ' + response.status);

        const data = await response.json();

        if(!Array.isArray(data)) return;

        logList.innerHTML = '';

        data.forEach((event, index) =>{
            const actionType = event.type.replace('Event', '').toUpperCase();
            const repoName = event.repo;
            const message = event.message;

            const li = document.createElement('li');
            li.innerHTML = `
            <span class="timestamp">${actionType}</span>
            <span class="cmd">${repoName}</span>
            ${message}
            `;

            li.style.animation = `fadeIn 0.5s ease forwards ${index * 0.2}s`;
            li.style.opacity = 0;
            
            logList.appendChild(li);
        });

    } catch (error){
        console.error('Failed to fetch GitHub activity:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchGithubActivity();
});
