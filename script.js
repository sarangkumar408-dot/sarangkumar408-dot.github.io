// NexusForge - Main JavaScript
// Forge Your Digital Presence

// Admin credentials (in production, this should be server-side)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// API base URL - will use localStorage if server is not available
const API_BASE = '/api/messages';
const USE_LOCAL_STORAGE = true; // Set to false when using actual server

// Local storage keys
const STORAGE_KEY = 'nexusforge_messages';
const PROJECT_GALLERY_KEY = 'nexusforge_project_gallery';

// Typing animation phrases
const TYPING_PHRASES = [
    'High-performance web development.',
    'Responsive brand-focused design.',
    'Cutting-edge digital solutions.',
    'Modern, fast, and reliable.',
    'Your vision, our expertise.'
];
let typingIndex = 0;
let charIndex = 0;
let isDeleting = false;

// Track scroll position with RAF throttling for performance
let lastScrollY = window.scrollY;
let rafId = null;

function handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Header scroll effect
    const header = document.getElementById('site-header');
    if (header) {
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Back to top button
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        if (currentScrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }
    
    lastScrollY = currentScrollY;
    rafId = null;
}

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initMobileMenu();

    // Track visit
    trackVisit();

    // Initialize scroll reveal animations
    initScrollReveal();

    // Initialize typing animation
    initTypingAnimation();

    // Initialize back to top button
    initBackToTop();

    // Initialize header scroll effect with passive listener
    window.addEventListener('scroll', () => {
        if (!rafId) {
            rafId = requestAnimationFrame(handleScroll);
        }
    }, { passive: true });

    // Check which page we're on and initialize accordingly
    if (document.getElementById('feedback-form')) {
        initContactForm();
        initStatusCheck();
    }

    initLiveNews();

    if (document.getElementById('admin-login-form')) {
        initAdminLogin();
    }

    if (document.getElementById('admin-inbox')) {
        initAdminInbox();
    }

    initProjectGallery();
    initProjectUploadForm();
    initAdminGalleryManager();

    // Initialize Wikipedia Knowledge section
    initWikiSection();

    // Initialize visit stats on admin page
    if (document.getElementById('admin-visit-stats')) {
        initVisitStats();
    }
});

// ============================================
// Scroll Reveal Animation
// ============================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

// ============================================
// Typing Animation
// ============================================
function initTypingAnimation() {
    const typingText = document.getElementById('typing-text');
    if (!typingText) return;

    function type() {
        const currentPhrase = TYPING_PHRASES[typingIndex];

        if (isDeleting) {
            typingText.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingText.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 30 : 60;

        if (!isDeleting && charIndex === currentPhrase.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            typingIndex = (typingIndex + 1) % TYPING_PHRASES.length;
            typeSpeed = 500; // Pause before typing next
        }

        setTimeout(type, typeSpeed);
    }

    setTimeout(type, 1000);
}

// ============================================
// Back to Top Button (click handler only - visibility is RAF-throttled)
// ============================================
function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Local Storage Helper Functions
function getMessagesFromStorage() {
    try {
        const messages = localStorage.getItem(STORAGE_KEY);
        return messages ? JSON.parse(messages) : [];
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return [];
    }
}

function saveMessagesToStorage(messages) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function getProjectsFromStorage() {
    try {
        const projects = localStorage.getItem(PROJECT_GALLERY_KEY);
        return projects ? JSON.parse(projects) : [];
    } catch (e) {
        console.error('Error reading project gallery from localStorage:', e);
        return [];
    }
}

function saveProjectsToStorage(projects) {
    try {
        localStorage.setItem(PROJECT_GALLERY_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error('Error saving project gallery to localStorage:', e);
    }
}

// Mobile Menu Toggle
function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', 
                mainNav.classList.contains('active'));
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !mainNav.contains(e.target)) {
                mainNav.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close menu when clicking a link
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

function initProjectGallery() {
    const galleryGrid = document.getElementById('project-gallery-grid');
    if (!galleryGrid) {
        return;
    }

    function renderProjects(projects) {
        if (!projects.length) {
            galleryGrid.innerHTML = '<div class="project-empty">No project media uploaded yet. Check back soon for a polished showcase.</div>';
            return;
        }

        galleryGrid.innerHTML = projects.map((project) => {
            const isVideo = project.fileType && project.fileType.startsWith('video/');
            const preview = isVideo
                ? `<video controls preload="metadata" src="${project.dataUrl}"></video>`
                : `<img src="${project.dataUrl}" alt="${escapeHtml(project.title)}">`;

            return `
                <article class="project-card reveal-scale">
                    <div class="project-media">${preview}</div>
                    <div class="project-content">
                        <h3>${escapeHtml(project.title)}</h3>
                        <p>${escapeHtml(project.description)}</p>
                        <div class="project-actions">
                            <a class="button button-secondary" href="${project.dataUrl}" download="${escapeHtml(project.fileName || project.title)}">Download</a>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        // Re-initialize scroll reveal for dynamically added content
        initScrollReveal();
    }

    async function loadProjects() {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) {
                throw new Error('Server returned an error');
            }
            const data = await response.json();
            const projects = Array.isArray(data) ? data : data.projects || [];
            if (projects.length) {
                saveProjectsToStorage(projects);
            }
            renderProjects(projects);
        } catch (error) {
            console.error('Unable to load project gallery:', error);
            const storedProjects = getProjectsFromStorage();
            if (storedProjects.length) {
                renderProjects(storedProjects);
            } else {
                galleryGrid.innerHTML = '<div class="project-empty">No project media uploaded yet. Check back soon for a polished showcase.</div>';
            }
        }
    }

    loadProjects();
}

function initAdminGalleryManager() {
    const list = document.getElementById('admin-gallery-list');
    if (!list) {
        return;
    }

    function renderAdminProjects(projects) {
        if (!projects.length) {
            list.innerHTML = '<div class="project-empty">No gallery items yet.</div>';
            return;
        }

        list.innerHTML = projects.map((project) => `
            <div class="admin-gallery-item">
                <div>
                    <strong>${escapeHtml(project.title)}</strong>
                    <small>${escapeHtml(project.fileName || 'Uploaded media')}</small>
                </div>
                <button class="button button-secondary" type="button" data-delete-id="${project.id}">Delete</button>
            </div>
        `).join('');
    }

    async function loadAdminProjects() {
        let projects = getProjectsFromStorage();

        try {
            const response = await fetch('/api/projects');
            if (response.ok) {
                const data = await response.json();
                projects = Array.isArray(data) ? data : data.projects || [];
                saveProjectsToStorage(projects);
            }
        } catch (error) {
            console.error('Unable to sync admin gallery list:', error);
        }

        renderAdminProjects(projects);
    }

    list.addEventListener('click', async (event) => {
        const deleteButton = event.target.closest('[data-delete-id]');
        if (!deleteButton) {
            return;
        }

        const projectId = deleteButton.getAttribute('data-delete-id');
        if (!projectId) {
            return;
        }

        try {
            await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Delete request failed:', error);
        }

        const updatedProjects = getProjectsFromStorage().filter((project) => project.id !== projectId);
        saveProjectsToStorage(updatedProjects);
        renderAdminProjects(updatedProjects);
        initProjectGallery();
    });

    loadAdminProjects();
}

// ============================================
// Image Crop State (using Cropper.js)
// ============================================
let cropCropper = null;
let cropFile = null;
let cropResolve = null;
let cropFilesToProcess = [];
let cropCurrentIndex = 0;
let cropTitle = '';
let cropDescription = '';

// Open crop modal for a specific file
function openCropModal(file) {
    return new Promise((resolve) => {
        cropFile = file;
        cropResolve = resolve;
        
        const modal = document.getElementById('crop-modal');
        const img = document.getElementById('crop-image');
        
        if (!modal || !img) {
            // Crop modal not found, resolve with original file
            resolve(null);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            modal.style.display = 'flex';
            
            // Destroy previous cropper if exists
            if (cropCropper) {
                cropCropper.destroy();
            }
            
            // Initialize cropper after image loads
            img.onload = function() {
                cropCropper = new Cropper(img, {
                    aspectRatio: NaN,
                    viewMode: 1,
                    dragMode: 'move',
                    background: false,
                    autoCropArea: 1,
                    responsive: true,
                    restore: false,
                    checkCrossOrigin: false,
                });
            };
        };
        reader.readAsDataURL(file);
    });
}

function closeCropModal() {
    const modal = document.getElementById('crop-modal');
    if (modal) modal.style.display = 'none';
    if (cropCropper) {
        cropCropper.destroy();
        cropCropper = null;
    }
    if (cropResolve) {
        cropResolve(null);
        cropResolve = null;
    }
}

function setCropAspectRatio(ratio) {
    if (cropCropper) {
        cropCropper.setAspectRatio(ratio);
    }
}

function rotateCropImage(degrees) {
    if (cropCropper) {
        cropCropper.rotate(degrees);
    }
}

function flipCropImage(direction) {
    if (cropCropper) {
        if (direction === 'h') {
            cropCropper.scaleX(-cropCropper.getData().scaleX || -1);
        } else {
            cropCropper.scaleY(-cropCropper.getData().scaleY || -1);
        }
    }
}

function resetCrop() {
    if (cropCropper) {
        cropCropper.reset();
    }
}

function cropAndConfirm() {
    if (!cropCropper || !cropResolve) return;
    
    const canvas = cropCropper.getCroppedCanvas({
        maxWidth: 1920,
        maxHeight: 1920,
        imageSmoothingQuality: 'high'
    });
    
    // Convert canvas to blob
    canvas.toBlob(function(blob) {
        // Create a new File from the blob
        const croppedFile = new File([blob], cropFile.name, {
            type: cropFile.type,
            lastModified: Date.now()
        });
        
        // IMPORTANT: Resolve BEFORE closing modal, because closeCropModal() nullifies cropResolve
        const resolve = cropResolve;
        cropResolve = null;
        closeCropModal();
        resolve(croppedFile);
    }, cropFile.type, 0.92);
}

// Make crop functions globally available
window.openCropModal = openCropModal;
window.closeCropModal = closeCropModal;
window.setCropAspectRatio = setCropAspectRatio;
window.rotateCropImage = rotateCropImage;
window.flipCropImage = flipCropImage;
window.resetCrop = resetCrop;
window.cropAndConfirm = cropAndConfirm;

function initProjectUploadForm() {
    const form = document.getElementById('project-upload-form');
    const status = document.getElementById('project-upload-status');
    if (!form || !status) {
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('project-title').value.trim();
        const description = document.getElementById('project-description').value.trim();
        const fileInput = document.getElementById('project-file');
        const files = Array.from(fileInput.files || []);

        if (!title || !description || !files.length) {
            status.textContent = 'Please complete every field before uploading.';
            return;
        }

        status.textContent = `Processing ${files.length} file(s)...`;

        // Process files: crop images, keep videos as-is
        const processedFiles = [];
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                // Open crop modal for images
                const croppedFile = await openCropModal(file);
                if (croppedFile) {
                    processedFiles.push(croppedFile);
                } else {
                    // User cancelled crop, use original
                    processedFiles.push(file);
                }
            } else {
                // Video files are uploaded directly
                processedFiles.push(file);
            }
        }

        status.textContent = `Uploading ${processedFiles.length} file(s)...`;

        const uploadFiles = async () => {
            const storedProjects = getProjectsFromStorage();

            for (const file of processedFiles) {
                const reader = new FileReader();
                const dataUrl = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                try {
                    const payload = {
                        title,
                        description,
                        fileName: file.name,
                        fileType: file.type,
                        dataUrl
                    };

                    const response = await fetch('/api/projects', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!response.ok) {
                        throw new Error('Upload failed');
                    }

                    const createdProject = await response.json();
                    storedProjects.unshift(createdProject);
                } catch (error) {
                    console.error('Project upload error:', error);
                    storedProjects.unshift({
                        id: Date.now().toString() + Math.random().toString(16).slice(2),
                        title,
                        description,
                        fileName: file.name,
                        fileType: file.type,
                        dataUrl,
                        createdAt: new Date().toISOString()
                    });
                }
            }

            saveProjectsToStorage(storedProjects);
            form.reset();
            status.textContent = `${processedFiles.length} file(s) uploaded. They are now visible in the gallery.`;
            initProjectGallery();
            initAdminGalleryManager();
        };

        uploadFiles();
    });
}

function initLiveNews() {
    const newsGrid = document.getElementById('news-grid');
    const newsStatus = document.getElementById('news-status');
    const languageSelect = document.getElementById('news-language');
    const categorySelect = document.getElementById('news-category');
    const searchInput = document.getElementById('news-search');
    const refreshButton = document.getElementById('refresh-news');

    if (!newsGrid || !newsStatus || !languageSelect || !categorySelect || !searchInput || !refreshButton) {
        return;
    }

    const state = {
        items: [],
        language: languageSelect.value,
        category: categorySelect.value,
        query: searchInput.value.trim().toLowerCase()
    };

    const updateStatus = (message, isLive = false) => {
        newsStatus.innerHTML = isLive
            ? `<span class="live-pill">● LIVE</span> ${message}`
            : message;
    };

    async function loadNews() {
        updateStatus('Fetching the latest news updates…', true);

        try {
            const response = await fetch(`/api/news?lang=${encodeURIComponent(state.language)}`);
            const data = await response.json();
            state.items = data.items || [];
            renderNews();
            updateStatus(`Showing ${state.items.length} live stories for ${languageSelect.options[languageSelect.selectedIndex].text}.`, true);
        } catch (error) {
            console.error('Unable to load live news:', error);
            state.items = [];
            renderNews();
            updateStatus('Live feed unavailable. Showing the latest local highlights instead.', false);
        }
    }

    function renderNews() {
        const query = state.query;
        const filtered = state.items.filter((item) => {
            const matchesCategory = state.category === 'all' || item.category === state.category;
            const matchesQuery = !query || `${item.title} ${item.description}`.toLowerCase().includes(query);
            return matchesCategory && matchesQuery;
        });

        if (!filtered.length) {
            newsGrid.innerHTML = '<div class="news-empty">No stories match this filter right now. Try another search or category.</div>';
            return;
        }

        newsGrid.innerHTML = filtered.map((item) => {
            const imageMarkup = item.image
                ? `<img src="${item.image}" alt="${escapeHtml(item.title)}">`
                : `<div class="news-image-placeholder">${escapeHtml(item.category || 'News')}</div>`;
            const timeText = item.publishedAt ? new Date(item.publishedAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }) : 'Just updated';

            return `
                <article class="news-card">
                    <div class="news-media">${imageMarkup}</div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span class="news-category">${escapeHtml(item.category || 'News')}</span>
                            <span class="news-live">● LIVE</span>
                        </div>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.description || 'Latest updates from India and around the world.')}</p>
                        <div class="news-footer">
                            <span>${escapeHtml(item.source || 'Live India News')}</span>
                            <span>${escapeHtml(timeText)}</span>
                        </div>
                        ${item.link ? `<a class="news-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">Read story →</a>` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    languageSelect.addEventListener('change', () => {
        state.language = languageSelect.value;
        loadNews();
    });

    categorySelect.addEventListener('change', () => {
        state.category = categorySelect.value;
        renderNews();
    });

    searchInput.addEventListener('input', () => {
        state.query = searchInput.value.trim().toLowerCase();
        renderNews();
    });

    refreshButton.addEventListener('click', () => loadNews());

    loadNews();
    setInterval(loadNews, 60000);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/\"/g, '"')
        .replace(/'/g, '&#39;');
}

// Contact Form Submission
function initContactForm() {
    const form = document.getElementById('feedback-form');
    const successMessage = document.getElementById('form-success');
    const clientNotification = document.getElementById('client-notification');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('feedback-name').value.trim();
        const contact = document.getElementById('feedback-contact').value.trim();
        const message = document.getElementById('feedback-message').value.trim();

        if (!name || !message) {
            showNotification(clientNotification, 'Please fill in all required fields.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            let data;
            let usedServer = false;
            
            try {
                const response = await fetch(API_BASE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, contact, message })
                });

                if (response.ok) {
                    data = await response.json();
                    usedServer = true;
                }
            } catch (serverError) {
                console.log('Server not available, using localStorage');
            }

            if (!usedServer) {
                const messages = getMessagesFromStorage();
                data = {
                    id: Date.now().toString() + Math.random().toString(16).slice(2),
                    name,
                    contact: contact || '',
                    message,
                    status: 'pending',
                    responseMessage: 'Your request is pending and waiting for admin review.',
                    receivedAt: new Date().toISOString()
                };
                messages.push(data);
                saveMessagesToStorage(messages);
            }

            form.reset();
            successMessage.classList.remove('hidden');
            showNotification(clientNotification, 'Your message has been sent successfully!', 'success');

            setTimeout(() => {
                clientNotification.innerHTML = `
                    <strong>Reference ID:</strong> ${data.id}<br>
                    <strong>Status:</strong> ${data.status}<br>
                    <strong>Message:</strong> ${data.responseMessage}<br>
                    <small>Use the "Check meeting status" section below to check updates using your contact info.</small>
                `;
                clientNotification.classList.remove('hidden');
            }, 1000);

            setTimeout(() => {
                successMessage.classList.add('hidden');
            }, 5000);

        } catch (error) {
            console.error('Error:', error);
            const messages = getMessagesFromStorage();
            const fallbackData = {
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                name,
                contact: contact || '',
                message,
                status: 'pending',
                responseMessage: 'Your request is pending and waiting for admin review.',
                receivedAt: new Date().toISOString()
            };
            messages.push(fallbackData);
            saveMessagesToStorage(messages);
            
            form.reset();
            showNotification(clientNotification, 'Message saved locally. Admin will review it.', 'success');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Status Check
function initStatusCheck() {
    const checkBtn = document.getElementById('status-check-button');
    const statusResult = document.getElementById('status-result');
    const contactInput = document.getElementById('status-contact');

    if (!checkBtn || !statusResult) return;

    checkBtn.addEventListener('click', async function() {
        const contact = contactInput.value.trim();

        if (!contact) {
            showNotification(statusResult, 'Please enter your email or phone number.', 'error');
            return;
        }

        checkBtn.textContent = 'Checking...';
        checkBtn.disabled = true;

        try {
            let messages = [];
            let usedServer = false;

            try {
                const response = await fetch(`${API_BASE}?contact=${encodeURIComponent(contact)}`);
                if (response.ok) {
                    messages = await response.json();
                    usedServer = true;
                }
            } catch (e) {
                console.log('Server not available, checking localStorage');
            }

            if (!usedServer) {
                const allMessages = getMessagesFromStorage();
                const normalized = contact.toLowerCase().trim();
                messages = allMessages.filter(item => item.contact && item.contact.toLowerCase().trim() === normalized);
            }

            if (messages.length === 0) {
                showNotification(statusResult, 'No messages found for this contact. Please check your input or submit a new message.', 'info');
            } else {
                const latestMessage = messages[messages.length - 1];
                const statusClass = latestMessage.status === 'accepted' ? 'success' : 
                                   latestMessage.status === 'rejected' ? 'error' : 'info';
                
                statusResult.className = `client-notification ${statusClass}`;
                statusResult.innerHTML = `
                    <strong>Status:</strong> ${latestMessage.status.toUpperCase()}<br>
                    <strong>Message:</strong> ${latestMessage.responseMessage}<br>
                    <strong>Received:</strong> ${new Date(latestMessage.receivedAt).toLocaleString()}
                `;
                statusResult.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification(statusResult, 'An error occurred while checking status.', 'error');
        } finally {
            checkBtn.textContent = 'Check Status';
            checkBtn.disabled = false;
        }
    });
}

// Admin Login
function initAdminLogin() {
    const loginForm = document.getElementById('admin-login-form');
    const loginCard = document.getElementById('admin-login-card');
    const inboxSection = document.getElementById('admin-inbox');
    const gallerySection = document.getElementById('admin-gallery-section');
    const statusMessage = document.getElementById('admin-status');

    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value;

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            loginCard.classList.add('hidden');
            
            // Show visit stats
            const visitStatsSection = document.getElementById('admin-visit-stats');
            if (visitStatsSection) {
                visitStatsSection.classList.remove('hidden');
                initVisitStats();
            }
            
            // Show inbox
            inboxSection.classList.remove('hidden');
            statusMessage.textContent = 'Logged in successfully.';
            statusMessage.style.color = 'var(--success-color)';
            
            loadAdminMessages();

            // Show gallery upload & delete section
            if (gallerySection) {
                gallerySection.classList.remove('hidden');
            }

            // Show founder management section
            const founderSection = document.getElementById('admin-founder-section');
            if (founderSection) {
                founderSection.classList.remove('hidden');
                initFounderManager();
            }

            // Load founder data into preview
            loadFounderPreview();
        } else {
            statusMessage.textContent = 'Invalid credentials. Please try again.';
            statusMessage.style.color = 'var(--error-color)';
        }
    });
}

// Admin Inbox
function initAdminInbox() {
    const clearBtn = document.getElementById('admin-clear-messages');

    if (clearBtn) {
        clearBtn.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
                return;
            }

            try {
                try {
                    const response = await fetch(API_BASE, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        loadAdminMessages();
                        return;
                    }
                } catch (e) {
                    // Server not available, use localStorage
                }

                localStorage.removeItem(STORAGE_KEY);
                loadAdminMessages();
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to clear messages.');
            }
        });
    }
}

// Load Admin Messages
async function loadAdminMessages() {
    const statsContainer = document.getElementById('admin-stats');
    const messageList = document.getElementById('admin-message-list');

    if (!statsContainer || !messageList) return;

    try {
        let messages = [];
        let usedServer = false;

        try {
            const response = await fetch(API_BASE);
            if (response.ok) {
                messages = await response.json();
                usedServer = true;
            }
        } catch (e) {
            console.log('Server not available, using localStorage');
        }

        if (!usedServer) {
            messages = getMessagesFromStorage();
        }

        const pending = messages.filter(m => m.status === 'pending').length;
        const accepted = messages.filter(m => m.status === 'accepted').length;
        const rejected = messages.filter(m => m.status === 'rejected').length;

        statsContainer.innerHTML = `
            <div class="admin-stat">
                <strong>${pending}</strong>
                <span>Pending</span>
            </div>
            <div class="admin-stat">
                <strong>${accepted}</strong>
                <span>Accepted</span>
            </div>
            <div class="admin-stat">
                <strong>${rejected}</strong>
                <span>Rejected</span>
            </div>
        `;

        if (messages.length === 0) {
            messageList.innerHTML = '<p class="contact-note">No messages yet.</p>';
        } else {
            messageList.innerHTML = messages.map(msg => {
                const smsCount = msg.smsReplies ? msg.smsReplies.length : 0;
                const hasContact = msg.contact ? true : false;
                
                return `
                <div class="admin-message" data-id="${msg.id}">
                    <div class="admin-message-header">
                        <div>
                            <h4>${escapeHtml(msg.name)}</h4>
                            <div class="message-meta">
                                ${msg.contact ? escapeHtml(msg.contact) : 'No contact provided'} | 
                                ${new Date(msg.receivedAt).toLocaleString()}
                                ${smsCount > 0 ? `<br><small style="color: var(--success-color);">📱 ${smsCount} SMS reply/replies sent</small>` : ''}
                            </div>
                        </div>
                        <span class="message-status ${msg.status}">${msg.status}</span>
                    </div>
                    <p>${escapeHtml(msg.message)}</p>
                    ${msg.smsReplies && msg.smsReplies.length > 0 ? `
                        <div class="sms-history">
                            <strong>SMS sent:</strong>
                            <ul>
                                ${msg.smsReplies.map(sms => `
                                    <li>
                                        <small>${new Date(sms.sentAt).toLocaleString()}</small><br>
                                        ${escapeHtml(sms.message)}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <div class="admin-message-actions">
                        <button class="button button-secondary" onclick="updateMessageStatus('${msg.id}', 'accepted')">Accept</button>
                        <button class="button button-secondary" onclick="updateMessageStatus('${msg.id}', 'rejected')">Reject</button>
                        <button class="button button-secondary" onclick="updateMessageStatus('${msg.id}', 'pending')">Mark Pending</button>
                        ${hasContact ? `<button class="button button-primary" onclick="showSMSReplyModal('${escapeForJS(msg.id)}', '${escapeForJS(msg.name)}', '${escapeForJS(msg.contact)}')" style="background: var(--success-color); border-color: var(--success-color); color: white;">📱 Send SMS</button>` : ''}
                    </div>
                </div>
            `}).join('');
        }
    } catch (error) {
        console.error('Error:', error);
        messageList.innerHTML = '<p class="contact-note">Failed to load messages.</p>';
    }
}

// Update Message Status
async function updateMessageStatus(messageId, status) {
    try {
        try {
            const response = await fetch(`${API_BASE}/${messageId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                loadAdminMessages();
                return;
            }
        } catch (e) {
            // Server not available, use localStorage
        }

        const messages = getMessagesFromStorage();
        const message = messages.find(item => item.id === messageId);
        if (message) {
            message.status = status;
            message.responseMessage =
                status === 'accepted'
                    ? 'The meeting request has been accepted. NexusForge will contact the client shortly.'
                    : status === 'rejected'
                    ? 'The meeting request has been rejected. The client will be notified and may submit a new request if needed.'
                    : 'The request is pending and awaiting admin review.';
            
            saveMessagesToStorage(messages);
            loadAdminMessages();
        } else {
            alert('Message not found.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating status.');
    }
}

// Send SMS Reply to Client
async function sendSMSReply(messageId, replyText) {
    if (!replyText || replyText.trim() === '') {
        alert('Please enter a reply message.');
        return;
    }

    try {
        let messages = [];
        let usedServer = false;

        try {
            const response = await fetch(API_BASE);
            if (response.ok) {
                messages = await response.json();
                usedServer = true;
            }
        } catch (e) {
            console.log('Server not available, using localStorage for SMS');
            messages = getMessagesFromStorage();
        }

        const message = messages.find(item => item.id === messageId);
        if (!message) {
            console.error('Message not found. Looking for ID:', messageId);
            console.error('Available message IDs:', messages.map(m => m.id));
            alert('Message not found. Please refresh the page and try again.');
            return;
        }

        if (!message.contact) {
            alert('No contact information available for this client. Cannot send SMS.');
            return;
        }

        const smsData = {
            to: message.contact,
            from: 'NexusForge',
            message: replyText,
            sentAt: new Date().toISOString(),
            messageId: messageId,
            clientName: message.name
        };

        message.smsReplies = message.smsReplies || [];
        message.smsReplies.push(smsData);
        message.lastReplyAt = smsData.sentAt;

        if (usedServer) {
            try {
                await fetch(`${API_BASE}/${messageId}/sms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(smsData)
                });
            } catch (e) {
                saveMessagesToStorage(messages);
            }
        } else {
            saveMessagesToStorage(messages);
        }

        alert(`SMS sent successfully to ${message.contact}!\n\nMessage: "${replyText}"\n\nNote: This is a demo. In production, this would send a real SMS via Twilio/AWS SNS.`);
        
        loadAdminMessages();

    } catch (error) {
        console.error('Error sending SMS:', error);
        alert('Failed to send SMS. Please try again.');
    }
}

// Show SMS Reply Modal
function showSMSReplyModal(messageId, clientName, clientContact) {
    const modalHTML = `
        <div id="sms-modal-overlay" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📱 Send SMS Reply</h3>
                    <button onclick="closeSMSModal()" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>To:</label>
                        <input type="text" id="sms-to" value="${clientContact}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Client:</label>
                        <input type="text" id="sms-client" value="${clientName}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Message:</label>
                        <textarea id="sms-message" rows="5" placeholder="Type your reply message here..." style="background: var(--bg-glass); color: var(--text-primary); border: 1px solid var(--glass-border); border-radius: 0.5rem; padding: 0.75rem; width: 100%; font-family: inherit;"></textarea>
                    </div>
                    <div class="sms-preview">
                        <strong>SMS Preview:</strong>
                        <p id="sms-preview-text">Your message will appear here...</p>
                        <small>Character count: <span id="char-count">0</span>/160</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeSMSModal()" class="button button-secondary">Cancel</button>
                    <button onclick="sendSMSFromModal('${messageId}')" class="button button-primary">Send SMS</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const messageInput = document.getElementById('sms-message');
    const previewText = document.getElementById('sms-preview-text');
    const charCount = document.getElementById('char-count');

    if (messageInput) {
        messageInput.addEventListener('input', function() {
            const text = this.value;
            if (previewText) previewText.textContent = text || 'Your message will appear here...';
            if (charCount) charCount.textContent = text.length;
        });
    }
}

// Close SMS Modal
function closeSMSModal() {
    const overlay = document.getElementById('sms-modal-overlay');
    if (overlay) overlay.remove();
}

// Send SMS from Modal
function sendSMSFromModal(messageId) {
    const messageInput = document.getElementById('sms-message');
    const replyText = messageInput ? messageInput.value.trim() : '';
    
    if (!replyText) {
        alert('Please enter a message.');
        return;
    }

    closeSMSModal();
    sendSMSReply(messageId, replyText);
}

// Make SMS functions globally available
window.showSMSReplyModal = showSMSReplyModal;
window.closeSMSModal = closeSMSModal;
window.sendSMSFromModal = sendSMSFromModal;

// Show Notification Helper
function showNotification(container, message, type = 'info') {
    if (!container) return;
    
    container.className = `client-notification ${type}`;
    container.textContent = message;
    container.classList.remove('hidden');

    setTimeout(() => {
        container.classList.add('hidden');
    }, 5000);
}

// Escape HTML Helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Escape string for use in JavaScript onclick handlers
function escapeForJS(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// Local Storage keys for visit tracking
const VISIT_STORAGE_KEY = 'nexusforge_visits';
const VISITOR_ID_KEY = 'nexusforge_visitor_id';

// Visit Tracking
function trackVisit() {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(16).slice(2);
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    let sessionId = sessionStorage.getItem('nexusforge_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(16).slice(2);
        sessionStorage.setItem('nexusforge_session_id', sessionId);
    }

    const userAgent = navigator.userAgent;

    fetch('/api/visits', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId, userAgent })
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Server not available');
    }).then(data => {
        console.log('Visit tracked on server:', data);
    }).catch(error => {
        console.log('Server tracking not available, using localStorage:', error);
        trackVisitLocalStorage(visitorId, userAgent);
    });
}

// Track visit using localStorage
function trackVisitLocalStorage(visitorId, userAgent) {
    try {
        const visits = getVisitsFromStorage();
        
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        const isDuplicate = visits.some(v => 
            v.visitorId === visitorId && 
            new Date(v.timestamp).getTime() > thirtyMinutesAgo
        );

        if (!isDuplicate) {
            const newVisit = {
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                timestamp: new Date().toISOString(),
                visitorId: visitorId,
                userAgent: userAgent,
                referrer: document.referrer || 'Direct'
            };
            visits.push(newVisit);
            saveVisitsToStorage(visits);
            
        }
    } catch (error) {
        console.error('Error tracking visit in localStorage:', error);
    }
}

// Local Storage helpers for visits
function getVisitsFromStorage() {
    try {
        const visits = localStorage.getItem(VISIT_STORAGE_KEY);
        return visits ? JSON.parse(visits) : [];
    } catch (e) {
        console.error('Error reading visits from localStorage:', e);
        return [];
    }
}

function saveVisitsToStorage(visits) {
    try {
        localStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(visits));
    } catch (e) {
        console.error('Error saving visits to localStorage:', e);
    }
}

// Visit Statistics for Admin
function initVisitStats() {
    const refreshBtn = document.getElementById('refresh-visits');
    const clearBtn = document.getElementById('clear-visits');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadVisitStatistics);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (!confirm('Are you sure you want to clear all visit history? This cannot be undone.')) {
                return;
            }

            fetch('/api/visits', {
                method: 'DELETE'
            }).then(response => {
                if (response.ok) {
                    loadVisitStatistics();
                }
            }).catch(() => {
                localStorage.removeItem(VISIT_STORAGE_KEY);
                loadVisitStatistics();
            });
        });
    }

    loadVisitStatistics();
}

async function loadVisitStatistics() {
    const summaryContainer = document.getElementById('visit-stats-summary');
    const historyList = document.getElementById('visit-history-list');
    const paginationContainer = document.getElementById('visit-pagination');

    if (!summaryContainer || !historyList) return;

    let visits = [];
    let usedServer = false;

    try {
        const statsResponse = await fetch('/api/visits');
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            
            summaryContainer.innerHTML = `
                <div class="admin-stat">
                    <strong>${stats.total.toLocaleString()}</strong>
                    <span>Total Visits</span>
                </div>
                <div class="admin-stat">
                    <strong>${stats.today.toLocaleString()}</strong>
                    <span>Today</span>
                </div>
                <div class="admin-stat">
                    <strong>${stats.week.toLocaleString()}</strong>
                    <span>This Week</span>
                </div>
                <div class="admin-stat">
                    <strong>${stats.month.toLocaleString()}</strong>
                    <span>This Month</span>
                </div>
                <div class="admin-stat">
                    <strong>${stats.uniqueVisitors.toLocaleString()}</strong>
                    <span>Unique Visitors</span>
                </div>
            `;
            usedServer = true;
        }
    } catch (error) {
        console.log('Server not available for visit stats, using localStorage');
    }

    if (!usedServer) {
        visits = getVisitsFromStorage();
        
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const todayVisits = visits.filter(v => new Date(v.timestamp) >= todayStart).length;
        const weekVisits = visits.filter(v => new Date(v.timestamp) >= weekStart).length;
        const monthVisits = visits.filter(v => new Date(v.timestamp) >= monthStart).length;
        const totalVisits = visits.length;
        const uniqueVisitors = new Set(visits.map(v => v.visitorId)).size;
        
        summaryContainer.innerHTML = `
            <div class="admin-stat">
                <strong>${totalVisits.toLocaleString()}</strong>
                <span>Total Visits</span>
            </div>
            <div class="admin-stat">
                <strong>${todayVisits.toLocaleString()}</strong>
                <span>Today</span>
            </div>
            <div class="admin-stat">
                <strong>${weekVisits.toLocaleString()}</strong>
                <span>This Week</span>
            </div>
            <div class="admin-stat">
                <strong>${monthVisits.toLocaleString()}</strong>
                <span>This Month</span>
            </div>
            <div class="admin-stat">
                <strong>${uniqueVisitors.toLocaleString()}</strong>
                <span>Unique Visitors</span>
            </div>
        `;
    }

    try {
        if (!usedServer) {
            const sortedVisits = [...visits].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const page = 1;
            const limit = 20;
            const startIndex = (page - 1) * limit;
            const paginatedVisits = sortedVisits.slice(startIndex, startIndex + limit);
            const totalPages = Math.ceil(sortedVisits.length / limit);
            
            if (paginatedVisits.length === 0) {
                historyList.innerHTML = '<p class="contact-note">No visit records yet.</p>';
            } else {
                historyList.innerHTML = `
                    <table class="visit-history-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Visitor ID</th>
                                <th>Browser</th>
                                <th>Referrer</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paginatedVisits.map(visit => {
                                const browser = getBrowserName(visit.userAgent);
                                const date = new Date(visit.timestamp).toLocaleString();
                                const referrer = visit.referrer ? 
                                    (visit.referrer.length > 50 ? visit.referrer.substring(0, 50) + '...' : visit.referrer) : 
                                    'Direct';
                                const visitorId = visit.visitorId || visit.ipHash || 'unknown';
                                return `
                                    <tr>
                                        <td>${date}</td>
                                        <td title="${visitorId}">${visitorId.substring(0, 12)}...</td>
                                        <td>${browser}</td>
                                        <td>${referrer}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;

                if (totalPages > 1) {
                    let paginationHTML = '<div class="pagination">';
                    for (let i = 1; i <= totalPages; i++) {
                        paginationHTML += `<button class="button button-secondary ${i === page ? 'active' : ''}" onclick="loadVisitPageLocal(${i})">${i}</button>`;
                    }
                    paginationHTML += '</div>';
                    paginationContainer.innerHTML = paginationHTML;
                } else {
                    paginationContainer.innerHTML = '';
                }
            }
        } else {
            const historyResponse = await fetch('/api/visits/history?page=1&limit=20');
            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                
                if (historyData.visits.length === 0) {
                    historyList.innerHTML = '<p class="contact-note">No visit records yet.</p>';
                } else {
                    historyList.innerHTML = `
                        <table class="visit-history-table">
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Visitor ID</th>
                                    <th>Browser</th>
                                    <th>Referrer</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${historyData.visits.map(visit => {
                                    const browser = getBrowserName(visit.userAgent);
                                    const date = new Date(visit.timestamp).toLocaleString();
                                    const referrer = visit.referrer ? 
                                        (visit.referrer.length > 50 ? visit.referrer.substring(0, 50) + '...' : visit.referrer) : 
                                        'Direct';
                                    return `
                                        <tr>
                                            <td>${date}</td>
                                            <td title="${visit.ipHash}">${visit.ipHash.substring(0, 8)}...</td>
                                            <td>${browser}</td>
                                            <td>${referrer}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    `;

                    if (historyData.pagination.totalPages > 1) {
                        let paginationHTML = '<div class="pagination">';
                        for (let i = 1; i <= historyData.pagination.totalPages; i++) {
                            paginationHTML += `<button class="button button-secondary" onclick="loadVisitPage(${i})">${i}</button>`;
                        }
                        paginationHTML += '</div>';
                        paginationContainer.innerHTML = paginationHTML;
                    } else {
                        paginationContainer.innerHTML = '';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading visit history:', error);
        historyList.innerHTML = '<p class="contact-note">Failed to load visit history.</p>';
    }
}

// Local storage based pagination for visits
function loadVisitPageLocal(page) {
    const historyList = document.getElementById('visit-history-list');
    const paginationContainer = document.getElementById('visit-pagination');

    if (!historyList) return;

    const visits = getVisitsFromStorage();
    const limit = 20;
    const sortedVisits = [...visits].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const startIndex = (page - 1) * limit;
    const paginatedVisits = sortedVisits.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(sortedVisits.length / limit);

    historyList.innerHTML = `
        <table class="visit-history-table">
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>Visitor ID</th>
                    <th>Browser</th>
                    <th>Referrer</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedVisits.map(visit => {
                    const browser = getBrowserName(visit.userAgent);
                    const date = new Date(visit.timestamp).toLocaleString();
                    const referrer = visit.referrer ? 
                        (visit.referrer.length > 50 ? visit.referrer.substring(0, 50) + '...' : visit.referrer) : 
                        'Direct';
                    const visitorId = visit.visitorId || 'unknown';
                    return `
                        <tr>
                            <td>${date}</td>
                            <td title="${visitorId}">${visitorId.substring(0, 12)}...</td>
                            <td>${browser}</td>
                            <td>${referrer}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    if (totalPages > 1) {
        let paginationHTML = '<div class="pagination">';
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="button button-secondary ${i === page ? 'active' : ''}" onclick="loadVisitPageLocal(${i})">${i}</button>`;
        }
        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
    } else {
        paginationContainer.innerHTML = '';
    }
}

/**
 * Server-side pagination for visit history
 */
function loadVisitPage(page) {
    const historyList = document.getElementById('visit-history-list');
    const paginationContainer = document.getElementById('visit-pagination');

    if (!historyList) return;

    fetch(`/api/visits/history?page=${page}&limit=20`)
        .then(response => response.json())
        .then(historyData => {
            if (historyData.visits.length === 0) {
                historyList.innerHTML = '<p class="contact-note">No visit records yet.</p>';
            } else {
                historyList.innerHTML = `
                    <table class="visit-history-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Visitor ID</th>
                                <th>Browser</th>
                                <th>Referrer</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${historyData.visits.map(visit => {
                                const browser = getBrowserName(visit.userAgent);
                                const date = new Date(visit.timestamp).toLocaleString();
                                const referrer = visit.referrer ? 
                                    (visit.referrer.length > 50 ? visit.referrer.substring(0, 50) + '...' : visit.referrer) : 
                                    'Direct';
                                return `
                                    <tr>
                                        <td>${date}</td>
                                        <td title="${visit.ipHash}">${visit.ipHash.substring(0, 8)}...</td>
                                        <td>${browser}</td>
                                        <td>${referrer}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `;

                if (historyData.pagination.totalPages > 1) {
                    let paginationHTML = '<div class="pagination">';
                    for (let i = 1; i <= historyData.pagination.totalPages; i++) {
                        paginationHTML += `<button class="button button-secondary ${i === page ? 'active' : ''}" onclick="loadVisitPage(${i})">${i}</button>`;
                    }
                    paginationHTML += '</div>';
                    paginationContainer.innerHTML = paginationHTML;
                } else {
                    paginationContainer.innerHTML = '';
                }
            }
        })
        .catch(error => {
            console.error('Error loading visit history page:', error);
            historyList.innerHTML = '<p class="contact-note">Failed to load visit history.</p>';
        });
}

// Make loadVisitPageLocal globally available
window.loadVisitPageLocal = loadVisitPageLocal;
window.loadVisitPage = loadVisitPage;

function getBrowserName(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    
    return 'Other';
}

// ============================================
// Wikipedia Knowledge Section
// ============================================

/**
 * Initialize the Wikipedia Knowledge section
 * Sets up tab switching, fetches data, and handles search
 */
function initWikiSection() {
    const wikiSection = document.getElementById('wikipedia');
    if (!wikiSection) {
        return; // Not on the main page
    }

    // Tab switching
    const tabs = document.querySelectorAll('.wiki-tab');
    const panels = {
        featured: document.getElementById('wiki-featured'),
        current: document.getElementById('wiki-current'),
        onthisday: document.getElementById('wiki-onthisday'),
        search: document.getElementById('wiki-search')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-wiki-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active panel
            Object.values(panels).forEach(p => p.classList.remove('active'));
            const targetPanel = panels[targetTab];
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Load content if not yet loaded
            if (targetTab === 'featured') {
                loadWikiFeatured();
            } else if (targetTab === 'current') {
                loadWikiCurrentEvents();
            } else if (targetTab === 'onthisday') {
                loadWikiOnThisDay();
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('wiki-search-input');
    const searchButton = document.getElementById('wiki-search-button');

    if (searchInput && searchButton) {
        function performSearch() {
            const query = searchInput.value.trim();
            if (query) {
                searchWikipedia(query);
            }
        }

        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Load default tab (featured)
    loadWikiFeatured();
}

/**
 * Fetch and display the featured article from Wikipedia
 */
async function loadWikiFeatured() {
    const loadingEl = document.getElementById('wiki-featured-loading');
    const contentEl = document.getElementById('wiki-featured-content');

    if (!loadingEl || !contentEl) return;
    
    // If already loaded, don't reload
    if (!contentEl.classList.contains('hidden')) return;

    loadingEl.classList.remove('hidden');
    contentEl.classList.add('hidden');

    try {
        const response = await fetch('/api/wiki/featured');
        const data = await response.json();

        if (data.featuredArticle) {
            const article = data.featuredArticle;
            const thumbnailHtml = article.thumbnail
                ? `<img src="${article.thumbnail}" alt="${escapeHtml(article.title)}" class="wiki-featured-image" loading="lazy">`
                : '';

            contentEl.innerHTML = `
                <article class="wiki-featured-article">
                    ${thumbnailHtml}
                    <div class="wiki-featured-body">
                        <div class="wiki-badge">⭐ Featured Article of the Day</div>
                        <h3>${escapeHtml(article.title)}</h3>
                        ${article.description ? `<p class="wiki-description">${escapeHtml(article.description)}</p>` : ''}
                        <p>${escapeHtml(article.extract ? article.extract.substring(0, 500) + '...' : '')}</p>
                        <a href="${article.pageUrl}" target="_blank" rel="noopener noreferrer" class="button button-secondary">
                            Read full article on Wikipedia →
                        </a>
                    </div>
                </article>
            `;
        } else {
            contentEl.innerHTML = `
                <div class="wiki-empty">
                    <p>Featured article unavailable at the moment. Please check back later.</p>
                </div>
            `;
        }

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        
        // Re-initialize scroll reveal
        initScrollReveal();
    } catch (error) {
        console.error('Error loading featured article:', error);
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        contentEl.innerHTML = `
            <div class="wiki-empty">
                <p>Unable to load the featured article. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Fetch and display current events from Wikipedia
 */
async function loadWikiCurrentEvents() {
    const loadingEl = document.getElementById('wiki-current-loading');
    const contentEl = document.getElementById('wiki-current-content');

    if (!loadingEl || !contentEl) return;
    
    // If already loaded, don't reload
    if (!contentEl.classList.contains('hidden')) return;

    loadingEl.classList.remove('hidden');
    contentEl.classList.add('hidden');

    try {
        const response = await fetch('/api/wiki/featured');
        const data = await response.json();

        if (data.currentEvents) {
            const events = data.currentEvents;
            contentEl.innerHTML = `
                <div class="wiki-current-block">
                    <div class="wiki-badge">🌍 Current Events from Wikipedia</div>
                    <div class="wiki-current-text">
                        <p>${escapeHtml(events.extract ? events.extract.substring(0, 800) : 'Ongoing current events from around the world.')}</p>
                    </div>
                    <div class="wiki-current-footer">
                        <a href="${events.pageUrl}" target="_blank" rel="noopener noreferrer" class="button button-secondary">
                            View all current events on Wikipedia →
                        </a>
                    </div>
                </div>
                <div class="wiki-current-note">
                    <p>For the most up-to-date breaking news, check our <a href="#live-news">Live News section</a> above.</p>
                </div>
            `;
        } else {
            contentEl.innerHTML = `
                <div class="wiki-empty">
                    <p>Current events information is being updated. Please check back soon.</p>
                </div>
            `;
        }

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        initScrollReveal();
    } catch (error) {
        console.error('Error loading current events:', error);
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        contentEl.innerHTML = `
            <div class="wiki-empty">
                <p>Unable to load current events. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Fetch and display "On This Day" historical events from Wikipedia
 */
async function loadWikiOnThisDay() {
    const loadingEl = document.getElementById('wiki-onthisday-loading');
    const contentEl = document.getElementById('wiki-onthisday-content');

    if (!loadingEl || !contentEl) return;
    
    // If already loaded, don't reload
    if (!contentEl.classList.contains('hidden')) return;

    loadingEl.classList.remove('hidden');
    contentEl.classList.add('hidden');

    try {
        const response = await fetch('/api/wiki/featured');
        const data = await response.json();

        if (data.onThisDay && data.onThisDay.length > 0) {
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
            });

            contentEl.innerHTML = `
                <div class="wiki-otd-header">
                    <div class="wiki-badge">📅 On This Day — ${escapeHtml(dateStr)}</div>
                    <p>Historical events that happened on this day in history.</p>
                </div>
                <div class="wiki-timeline">
                    ${data.onThisDay.map(event => `
                        <div class="wiki-timeline-event">
                            <div class="wiki-timeline-year">${event.year}</div>
                            <div class="wiki-timeline-content">
                                <p>${escapeHtml(event.text)}</p>
                                ${event.pages && event.pages.length > 0 ? `
                                    <div class="wiki-timeline-links">
                                        ${event.pages.map(page => `
                                            <a href="${page.pageUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(page.title)}</a>
                                        `).join(' · ')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="wiki-otd-footer">
                    <a href="https://en.wikipedia.org/wiki/Wikipedia:On_This_Day" target="_blank" rel="noopener noreferrer" class="button button-secondary">
                        View all events for today →
                    </a>
                </div>
            `;
        } else {
            contentEl.innerHTML = `
                <div class="wiki-empty">
                    <p>Historical events for today are being updated. Please check back later.</p>
                </div>
            `;
        }

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        initScrollReveal();
    } catch (error) {
        console.error('Error loading on this day:', error);
        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        contentEl.innerHTML = `
            <div class="wiki-empty">
                <p>Unable to load historical events. Please try again later.</p>
            </div>
        `;
    }
}

/**
 * Search Wikipedia and display results
 */
async function searchWikipedia(query) {
    const loadingEl = document.getElementById('wiki-search-loading');
    const resultsEl = document.getElementById('wiki-search-results');

    if (!loadingEl || !resultsEl) return;

    loadingEl.classList.remove('hidden');
    resultsEl.innerHTML = '';

    try {
        const response = await fetch(`/api/wiki/search?q=${encodeURIComponent(query)}&limit=12`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            resultsEl.innerHTML = `
                <div class="wiki-search-stats">
                    Found ${data.totalResults} result(s) for "${escapeHtml(query)}"
                </div>
                <div class="wiki-search-list">
                    ${data.results.map(result => `
                        <article class="wiki-search-result">
                            <h4><a href="${result.pageUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.title)}</a></h4>
                            <p>${escapeHtml(result.snippet ? result.snippet.substring(0, 300) + '...' : '')}</p>
                            <div class="wiki-result-meta">
                                <a href="${result.pageUrl}" target="_blank" rel="noopener noreferrer" class="button button-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                                    Read full article →
                                </a>
                                <small>${result.wordCount ? result.wordCount.toLocaleString() + ' words' : ''}</small>
                            </div>
                        </article>
                    `).join('')}
                </div>
            `;
        } else {
            resultsEl.innerHTML = `
                <div class="wiki-empty">
                    <p>No results found for "<strong>${escapeHtml(query)}</strong>". Try different keywords.</p>
                </div>
            `;
        }

        loadingEl.classList.add('hidden');
        initScrollReveal();
    } catch (error) {
        console.error('Error searching Wikipedia:', error);
        loadingEl.classList.add('hidden');
        resultsEl.innerHTML = `
            <div class="wiki-empty">
                <p>Search is temporarily unavailable. Please try again later.</p>
            </div>
        `;
    }
}

// ============================================
// Founder Image Manager (Admin)
// ============================================

/**
 * Initialize the Founder Manager on the admin page
 */
function initFounderManager() {
    const form = document.getElementById('founder-upload-form');
    const resetBtn = document.getElementById('founder-reset-btn');
    const statusEl = document.getElementById('founder-upload-status');
    
    if (!form) return;

    // Load current founder data into form fields
    loadFounderPreview();

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('founder-name').value.trim();
        const title = document.getElementById('founder-title-text').value.trim();
        const tagline = document.getElementById('founder-tagline').value.trim();
        const fileInput = document.getElementById('founder-image-file');
        const file = fileInput.files[0];

        if (!name && !title && !tagline && !file) {
            if (statusEl) statusEl.textContent = 'Please fill in at least one field or select an image.';
            return;
        }

        try {
            let imageData = null;
            
            // If a file was selected, read and optional crop it
            if (file) {
                if (file.type.startsWith('image/')) {
                    // Crop the image using the existing crop modal (square aspect for founder)
                    const croppedFile = await openCropModal(file);
                    if (croppedFile) {
                        // Read the cropped file as data URL
                        imageData = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.readAsDataURL(croppedFile);
                        });
                    }
                }
            }

            const payload = {};
            if (imageData) payload.image = imageData;
            if (name) payload.name = name;
            if (title) payload.title = title;
            if (tagline) payload.tagline = tagline;

            const response = await fetch('/api/founder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Save failed');

            if (statusEl) {
                statusEl.textContent = '✅ Founder profile updated successfully! Changes are live on the homepage.';
                statusEl.style.color = 'var(--success-color)';
            }

            // Reload the preview
            loadFounderPreview();
            form.reset();

            setTimeout(() => {
                if (statusEl) statusEl.textContent = 'Changes appear instantly on the website homepage.';
                if (statusEl) statusEl.style.color = '';
            }, 5000);
        } catch (error) {
            console.error('Error saving founder:', error);
            if (statusEl) {
                statusEl.textContent = '❌ Failed to save. Please try again.';
                statusEl.style.color = 'var(--error-color)';
            }
        }
    });

    // Handle reset
    if (resetBtn) {
        resetBtn.addEventListener('click', async function() {
            if (!confirm('Reset the founder image to the default? This cannot be undone.')) return;

            try {
                const response = await fetch('/api/founder', { method: 'DELETE' });
                if (!response.ok) throw new Error('Reset failed');

                loadFounderPreview();
                form.reset();
                if (statusEl) {
                    statusEl.textContent = '✅ Founder profile reset to default.';
                    statusEl.style.color = 'var(--success-color)';
                }

                setTimeout(() => {
                    if (statusEl) statusEl.textContent = 'Changes appear instantly on the website homepage.';
                    if (statusEl) statusEl.style.color = '';
                }, 5000);
            } catch (error) {
                console.error('Error resetting founder:', error);
                if (statusEl) {
                    statusEl.textContent = '❌ Reset failed. Please try again.';
                    statusEl.style.color = 'var(--error-color)';
                }
            }
        });
    }
}

/**
 * Load current founder data and update the preview + homepage
 */
async function loadFounderPreview() {
    try {
        const response = await fetch('/api/founder');
        if (!response.ok) throw new Error('Failed to fetch founder data');
        
        const config = await response.json();
        
        // Update admin preview
        const previewImg = document.getElementById('founder-preview-img');
        const previewName = document.getElementById('founder-preview-name');
        const previewTitle = document.getElementById('founder-preview-title');
        
        if (previewImg) {
            if (config.image && config.image.startsWith('data:')) {
                previewImg.src = config.image;
            } else {
                previewImg.src = config.image || 'Sarang.png';
            }
        }
        if (previewName) previewName.textContent = config.name || 'Mr. Sarang Kumar';
        if (previewTitle) previewTitle.textContent = (config.title || 'Founder & Lead Developer') + ' · ' + (config.tagline || 'Building the future, one pixel at a time.');
        
        // Update form fields
        const nameInput = document.getElementById('founder-name');
        const titleInput = document.getElementById('founder-title-text');
        const taglineInput = document.getElementById('founder-tagline');
        
        if (nameInput && !nameInput.value) nameInput.placeholder = config.name || 'Mr. Sarang Kumar';
        if (titleInput && !titleInput.value) titleInput.placeholder = config.title || 'Founder & Lead Developer';
        if (taglineInput && !taglineInput.value) taglineInput.placeholder = config.tagline || 'Building the future, one pixel at a time.';
        
        // Update homepage founder card (if present)
        const homepageImg = document.querySelector('.founder-image');
        const homepageName = document.querySelector('.founder-name');
        const homepageTitle = document.querySelector('.founder-title');
        const homepageTagline = document.querySelector('.founder-tagline');
        
        if (homepageImg) {
            if (config.image && config.image.startsWith('data:')) {
                homepageImg.src = config.image;
            } else {
                homepageImg.src = config.image || 'Sarang.png';
            }
        }
        if (homepageName) homepageName.textContent = config.name || 'Mr. Sarang Kumar';
        if (homepageTitle) homepageTitle.textContent = config.title || 'Founder & Lead Developer';
        if (homepageTagline) homepageTagline.textContent = config.tagline || 'Building the future, one pixel at a time.';
    } catch (error) {
        console.error('Error loading founder preview:', error);
    }
}

// Make functions globally available
window.updateMessageStatus = updateMessageStatus;
window.loadVisitPage = loadVisitPage;
window.initFounderManager = initFounderManager;
window.loadFounderPreview = loadFounderPreview;

