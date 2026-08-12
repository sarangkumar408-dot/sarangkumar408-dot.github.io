// SK Web Solutions - Main JavaScript

// Admin credentials (in production, this should be server-side)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// API base URL - will use localStorage if server is not available
const API_BASE = '/api/messages';
const API_GALLERY = '/api/gallery';
const API_GALLERY_UPLOAD = '/api/gallery/upload';
const USE_LOCAL_STORAGE = true; // Set to false when using actual server

// Local storage keys
const STORAGE_KEY = 'sk_web_messages';
const GALLERY_STORAGE_KEY = 'sk_web_gallery';

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initMobileMenu();

    // Track visit
    trackVisit();

    // Check which page we're on and initialize accordingly
    if (document.getElementById('feedback-form')) {
        initContactForm();
        initStatusCheck();
    }

    if (document.getElementById('admin-login-form')) {
        initAdminLogin();
    }

    if (document.getElementById('admin-inbox')) {
        initAdminInbox();
    }

    if (document.getElementById('gallery-page')) {
        initGalleryPage();
    }

    if (document.getElementById('project-upload-form')) {
        initProjectUpload();
    }

    // New simple projects images admin upload
    if (document.getElementById('projects-upload-form')) {
        initProjectsImagesAdmin();
    }

    // New frontend projects page
    if (document.getElementById('projects-page')) {
        initProjectsImagesPage();
    }


    // Load visitor count on homepage
    if (document.getElementById('visitor-count')) {
        loadVisitorCount();
    }

    // Initialize visit stats on admin page
    if (document.getElementById('admin-visit-stats')) {
        initVisitStats();
    }
});

// Local Storage Helper Functions (for demo without server)
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

// Contact Form Submission (works with localStorage for demo)
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
            // Try to use server first, fall back to localStorage
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

            // If server didn't work, use localStorage
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

            // Show status info
            setTimeout(() => {
                clientNotification.innerHTML = `
                    <strong>Reference ID:</strong> ${data.id}<br>
                    <strong>Status:</strong> ${data.status}<br>
                    <strong>Message:</strong> ${data.responseMessage}<br>
                    <small>Use the "Check meeting status" section below to check updates using your contact info.</small>
                `;
                clientNotification.classList.remove('hidden');
            }, 1000);

            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.add('hidden');
            }, 5000);

        } catch (error) {
            console.error('Error:', error);
            // Even if everything fails, save to localStorage
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

// Status Check (works with localStorage for demo)
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

            // Try server first
            try {
                const response = await fetch(`${API_BASE}?contact=${encodeURIComponent(contact)}`);
                if (response.ok) {
                    messages = await response.json();
                    usedServer = true;
                }
            } catch (e) {
                console.log('Server not available, checking localStorage');
            }

            // If server didn't work, use localStorage
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
    const statusMessage = document.getElementById('admin-status');

    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value;

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            loginCard.classList.add('hidden');
            // Show both visit stats and inbox after login
            const visitStatsSection = document.getElementById('admin-visit-stats');
            if (visitStatsSection) {
                visitStatsSection.classList.remove('hidden');
                // Initialize visit stats after login when section becomes visible
                initVisitStats();
            }
            const galleryCard = document.getElementById('admin-gallery-card');
            if (galleryCard) {
                galleryCard.classList.remove('hidden');
            }
            inboxSection.classList.remove('hidden');
            statusMessage.textContent = 'Logged in successfully.';
            statusMessage.style.color = 'var(--success-color)';
            
            // Load messages and gallery projects
            loadAdminMessages();
            loadAdminGalleryList();
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
                // Try server first
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

                // Clear localStorage
                localStorage.removeItem(STORAGE_KEY);
                loadAdminMessages();
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to clear messages.');
            }
        });
    }
}

// Load Admin Messages (works with localStorage for demo)
async function loadAdminMessages() {
    const statsContainer = document.getElementById('admin-stats');
    const messageList = document.getElementById('admin-message-list');

    if (!statsContainer || !messageList) return;

    try {
        let messages = [];
        let usedServer = false;

        // Try server first
        try {
            const response = await fetch(API_BASE);
            if (response.ok) {
                messages = await response.json();
                usedServer = true;
            }
        } catch (e) {
            console.log('Server not available, using localStorage');
        }

        // If server didn't work, use localStorage
        if (!usedServer) {
            messages = getMessagesFromStorage();
        }

        // Update stats
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

        // Load admin gallery projects too
        loadAdminGalleryList();

        // Render messages
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
                            <strong>SMS History:</strong>
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

// Update Message Status (works with localStorage for demo)
async function loadAdminGalleryList() {
    const galleryListContainer = document.getElementById('admin-gallery-list');
    const galleryCard = document.getElementById('admin-gallery-list-card');

    if (!galleryListContainer || !galleryCard) return;

    let gallery = [];
    let usedServer = false;

    try {
        const response = await fetch(`${API_GALLERY}?admin=true`);
        if (response.ok) {
            gallery = await response.json();
            usedServer = true;
        }
    } catch (e) {
        console.log('Gallery API unavailable, using local storage fallback.');
    }

    if (!usedServer) {
        gallery = getGalleryFromStorage();
    }

    if (!gallery.length) {
        galleryListContainer.innerHTML = '<p class="contact-note">No uploaded projects yet.</p>';
        galleryCard.classList.remove('hidden');
        return;
    }

    galleryCard.classList.remove('hidden');
    galleryListContainer.innerHTML = gallery.map(project => `
        <div class="admin-gallery-item">
            <div class="admin-gallery-thumbnail">
                ${project.files && project.files.length && project.files[0].mimeType.startsWith('image/') ? `<img src="${project.files[0].url}" alt="${escapeHtml(project.title)}">` : '<div class="admin-gallery-placeholder">No image</div>'}
            </div>
            <div class="admin-gallery-info">
                <h4>${escapeHtml(project.title)}</h4>
                <p>${escapeHtml(project.clientName || 'No client')}</p>
                <p>${new Date(project.uploadedAt).toLocaleDateString()}</p>
                <button class="button button-secondary admin-gallery-delete" data-id="${project.id}">Delete</button>
            </div>
        </div>
    `).join('');

    galleryListContainer.querySelectorAll('.admin-gallery-delete').forEach(button => {
        button.addEventListener('click', async function() {
            const projectId = this.dataset.id;
            if (!confirm('Delete this project and its image files?')) return;
            await deleteAdminGalleryProject(projectId);
        });
    });
}

async function deleteAdminGalleryProject(projectId) {
    const galleryListContainer = document.getElementById('admin-gallery-list');
    const galleryCard = document.getElementById('admin-gallery-list-card');
    const statusElement = document.getElementById('project-upload-status');

    try {
        const response = await fetch(`${API_GALLERY}/${projectId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Delete failed.' }));
            throw new Error(errorData.error || 'Delete failed.');
        }

        showNotification(statusElement, 'Project deleted successfully.', 'success');
        // refresh list
        await loadAdminGalleryList();
    } catch (error) {
        console.error('Gallery delete failed', error);
        showNotification(statusElement, `Delete failed: ${error.message}`, 'error');
    }
}

function updateMessageStatus(messageId, status) {
    try {
        // Try server first
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

        // Update in localStorage
        const messages = getMessagesFromStorage();
        const message = messages.find(item => item.id === messageId);
        if (message) {
            message.status = status;
            message.responseMessage =
                status === 'accepted'
                    ? 'The meeting request has been accepted. SK Web Solutions will contact the client shortly.'
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
        // Get the message - try server first, then localStorage
        let messages = [];
        let usedServer = false;

        try {
            // Fetch all messages from server (without contact filter)
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

        // Simulate SMS sending (in production, this would call a real SMS API like Twilio)
        const smsData = {
            to: message.contact,
            from: 'SK Web Solutions',
            message: replyText,
            sentAt: new Date().toISOString(),
            messageId: messageId,
            clientName: message.name
        };

        // Store the SMS reply in the message
        message.smsReplies = message.smsReplies || [];
        message.smsReplies.push(smsData);
        message.lastReplyAt = smsData.sentAt;

        // Save updated messages
        if (usedServer) {
            try {
                await fetch(`${API_BASE}/${messageId}/sms`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(smsData)
                });
            } catch (e) {
                // Server not available, use localStorage
                saveMessagesToStorage(messages);
            }
        } else {
            saveMessagesToStorage(messages);
        }

        // Show success notification
        alert(`SMS sent successfully to ${message.contact}!\n\nMessage: "${replyText}"\n\nNote: This is a demo. In production, this would send a real SMS via Twilio/AWS SNS.`);
        
        // Reload admin messages to show the reply
        loadAdminMessages();

    } catch (error) {
        console.error('Error sending SMS:', error);
        alert('Failed to send SMS. Please try again.');
    }
}

// Show SMS Reply Modal
function showSMSReplyModal(messageId, clientName, clientContact) {
    // Create modal HTML
    const modalHTML = `
        <div id="sms-modal-overlay" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Send SMS Reply</h3>
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
                        <textarea id="sms-message" rows="5" placeholder="Type your reply message here..."></textarea>
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

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add modal styles
    const style = document.createElement('style');
    style.id = 'sms-modal-style';
    style.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 1rem;
        }
        .modal-content {
            background: white;
            border-radius: 0.75rem;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h3 {
            margin: 0;
            font-size: 1.25rem;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-light);
            padding: 0;
            line-height: 1;
        }
        .modal-body {
            padding: 1.5rem;
        }
        .modal-footer {
            padding: 1.5rem;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
        .sms-preview {
            background: var(--bg-light);
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
        }
        .sms-preview p {
            margin: 0.5rem 0;
            font-style: italic;
            color: var(--text-light);
        }
        .sms-preview small {
            color: var(--text-light);
            font-size: 0.75rem;
        }
    `;
    document.head.appendChild(style);

    // Add character count listener
    const messageInput = document.getElementById('sms-message');
    const previewText = document.getElementById('sms-preview-text');
    const charCount = document.getElementById('char-count');

    messageInput.addEventListener('input', function() {
        const text = this.value;
        previewText.textContent = text || 'Your message will appear here...';
        charCount.textContent = text.length;
        
        // Change color if too long
        if (text.length > 160) {
            charCount.style.color = 'var(--error-color)';
        } else {
            charCount.style.color = 'inherit';
        }
    });
}

// Close SMS Modal
function closeSMSModal() {
    const overlay = document.getElementById('sms-modal-overlay');
    const style = document.getElementById('sms-modal-style');
    if (overlay) overlay.remove();
    if (style) style.remove();
}

// Send SMS from Modal
function sendSMSFromModal(messageId) {
    const messageInput = document.getElementById('sms-message');
    const replyText = messageInput.value.trim();
    
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

// Gallery helpers
function getGalleryFromStorage() {
    try {
        const saved = localStorage.getItem(GALLERY_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error reading gallery storage', error);
        return [];
    }
}

function saveGalleryToStorage(gallery) {
    try {
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(gallery));
    } catch (error) {
        console.error('Error saving gallery storage', error);
    }
}

async function fetchGalleryProjects(filters = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.client) params.set('client', filters.client);
    if (filters.accessCode) params.set('accessCode', filters.accessCode);

    try {
        const response = await fetch(`${API_GALLERY}?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Unable to fetch gallery from server');
        }
        const data = await response.json();
        saveGalleryToStorage(data);
        return data;
    } catch (error) {
        console.log('Gallery API unavailable, using local storage fallback.');
        return getGalleryFromStorage();
    }
}

function buildProjectCard(project) {
    const day = new Date(project.uploadedAt).toLocaleDateString();
    const thumbnail = project.files && project.files.length && project.files[0].mimeType.startsWith('image/')
        ? `<img class="project-thumb" src="${project.files[0].url}" alt="${escapeHtml(project.title)}">`
        : '<div class="project-thumb project-thumb-placeholder">No image</div>';
    const projectVisibility = project.visibility === 'private' ? 'Private' : 'Public';
    const lockLabel = project.visibility === 'private' ? '<span class="project-tag project-tag-private">Private</span>' : '<span class="project-tag project-tag-public">Public</span>';

    return `
        <article class="project-card">
            <div class="project-card-thumb">${thumbnail}</div>
            <div class="project-card-header">
                <h3>${escapeHtml(project.title)}</h3>
                ${lockLabel}
            </div>
            <p class="project-meta">${escapeHtml(project.clientName || 'Client project')} • ${escapeHtml(project.category)} • ${day}</p>
            <p class="project-description">${escapeHtml(project.description)}</p>
            <div class="project-actions">
                <button class="button button-secondary" data-action="preview" data-id="${project.id}">Preview</button>
                <a href="${API_GALLERY}/${project.id}/download-all" class="button button-primary" download>Download All</a>
            </div>
            <div class="project-file-list">
                ${project.files.map(file => `
                    <div class="project-file-item">
                        <span>${escapeHtml(file.originalName)}</span>
                        <a href="${file.url}" download class="button button-secondary">Download</a>
                    </div>
                `).join('')}
            </div>
        </article>
    `;
}

function renderGalleryProjects(projects) {
    const galleryList = document.getElementById('gallery-list');
    const emptyState = document.getElementById('gallery-empty');

    if (!galleryList || !emptyState) return;

    if (!projects.length) {
        galleryList.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    galleryList.innerHTML = projects.map(buildProjectCard).join('');

    galleryList.querySelectorAll('[data-action="preview"]').forEach(button => {
        button.addEventListener('click', async function() {
            const projectId = this.dataset.id;
            const project = projects.find(p => p.id === projectId);
            if (project) {
                openGalleryPreview(project);
            }
        });
    });
}

function openGalleryPreview(project) {
    const modal = document.getElementById('gallery-preview-modal');
    const body = document.getElementById('gallery-preview-body');
    const details = document.getElementById('gallery-preview-details');

    if (!modal || !body || !details) return;

    const previewItems = project.files.map(file => {
        if (file.mimeType.startsWith('image/')) {
            return `<img class="preview-media" src="${file.url}" alt="${escapeHtml(file.originalName)}">`;
        }

        if (file.mimeType.startsWith('video/')) {
            return `<video class="preview-media" controls src="${file.url}"></video>`;
        }

        return `<div class="preview-file-card">
                    <strong>${escapeHtml(file.originalName)}</strong>
                    <p>${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <a class="button button-secondary" href="${file.url}" download>Download file</a>
                </div>`;
    }).join('');

    body.innerHTML = `
        <div class="preview-files">${previewItems}</div>
    `;

    details.innerHTML = `
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <p><strong>Client:</strong> ${escapeHtml(project.clientName || 'N/A')}</p>
        <p><strong>Category:</strong> ${escapeHtml(project.category)}</p>
        <p><strong>Files:</strong> ${project.files.length}</p>
        <a class="button button-primary" href="${API_GALLERY}/${project.id}/download-all" download>Download Full Project</a>
    `;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
}

function closeGalleryPreview() {
    const modal = document.getElementById('gallery-preview-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

async function initGalleryPage() {
    const searchInput = document.getElementById('gallery-search');
    const categoryInput = document.getElementById('gallery-category');
    const clientInput = document.getElementById('gallery-client');
    const searchButton = document.getElementById('gallery-search-btn');
    const filterButton = document.getElementById('gallery-filter-btn');
    const modalClose = document.getElementById('gallery-preview-close');
    const modal = document.getElementById('gallery-preview-modal');

    const loadProjects = async (filters = {}) => {
        const projects = await fetchGalleryProjects(filters);
        renderGalleryProjects(projects);
    };

    const promptAccess = async () => {
        const accessCode = prompt('Enter your client access code to load private projects, or leave blank to see public projects only.');
        return accessCode ? accessCode.trim() : '';
    };

    const initialCode = await promptAccess();
    await loadProjects({ accessCode: initialCode });

    if (searchButton) {
        searchButton.addEventListener('click', async () => {
            await loadProjects({
                q: searchInput.value.trim(),
                category: categoryInput.value,
                client: clientInput.value.trim(),
                accessCode: initialCode
            });
        });
    }

    if (filterButton) {
        filterButton.addEventListener('click', async () => {
            await loadProjects({
                q: searchInput.value.trim(),
                category: categoryInput.value,
                client: clientInput.value.trim(),
                accessCode: initialCode
            });
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeGalleryPreview);
    }

    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeGalleryPreview();
            }
        });
    }
}

async function initProjectUpload() {
    const uploadForm = document.getElementById('project-upload-form');
    const visibilitySelect = document.getElementById('project-visibility');
    const accessGroup = document.getElementById('project-access-group');
    const statusElement = document.getElementById('project-upload-status');

    if (!uploadForm) return;

    visibilitySelect.addEventListener('change', () => {
        if (visibilitySelect.value === 'private') {
            accessGroup.classList.remove('hidden');
        } else {
            accessGroup.classList.add('hidden');
        }
    });

    uploadForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(uploadForm);
        statusElement.textContent = 'Uploading project…';

        try {
            const response = await fetch(API_GALLERY_UPLOAD, {
                method: 'POST',
                body: formData
            });

            const contentType = response.headers.get('content-type') || '';
            let result;

            if (contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                result = { error: text || 'Upload failed' };
            }

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            saveGalleryToStorage([result, ...getGalleryFromStorage()]);
            uploadForm.reset();
            accessGroup.classList.add('hidden');
            showNotification(statusElement, 'Project uploaded successfully!', 'success');
        } catch (error) {
            console.error('Project upload failed', error);
            showNotification(statusElement, `Upload failed: ${error.message}`, 'error');
        }
    });
}

// Show Notification Helper
function showNotification(container, message, type = 'info') {
    if (!container) return;
    
    container.className = `client-notification ${type}`;
    container.textContent = message;
    container.classList.remove('hidden');

    // Auto-hide after 5 seconds
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

// Local Storage keys for visit tracking (fallback when server is unavailable)
const VISIT_STORAGE_KEY = 'sk_web_visits';
const VISITOR_ID_KEY = 'sk_visitor_id';

// Visit Tracking - works with localStorage as fallback
function trackVisit() {
    // Generate or get unique visitor ID
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(16).slice(2);
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    // Generate or get session ID
    let sessionId = sessionStorage.getItem('sk_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(16).slice(2);
        sessionStorage.setItem('sk_session_id', sessionId);
    }

    const userAgent = navigator.userAgent;

    // Try to send visit to server first
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
        // Fallback to localStorage tracking
        console.log('Server tracking not available, using localStorage:', error);
        trackVisitLocalStorage(visitorId, userAgent);
    });
}

// Track visit using localStorage (fallback method)
function trackVisitLocalStorage(visitorId, userAgent) {
    try {
        // Get existing visits
        const visits = getVisitsFromStorage();
        
        // Check if this is a new visit (not within last 30 minutes)
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
            console.log('Visit tracked in localStorage:', newVisit);
            
            // Update the counter if on homepage
            const visitorCountEl = document.getElementById('visitor-count');
            if (visitorCountEl) {
                animateCounter(visitorCountEl, visits.length);
            }
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

// Load Visitor Count - works with server or localStorage fallback
async function loadVisitorCount() {
    const visitorCountEl = document.getElementById('visitor-count');
    if (!visitorCountEl) return;

    try {
        const response = await fetch('/api/visits');
        if (response.ok) {
            const data = await response.json();
            animateCounter(visitorCountEl, data.total);
            return;
        }
    } catch (error) {
        console.log('Server not available for visitor count, using localStorage');
    }

    // Fallback to localStorage
    try {
        const visits = getVisitsFromStorage();
        const count = visits.length > 0 ? visits.length : 1000; // Show at least 1000 as base
        animateCounter(visitorCountEl, count);
    } catch (error) {
        console.error('Error loading visitor count from localStorage:', error);
        visitorCountEl.textContent = '1,000+';
    }
}

// Animate Counter
function animateCounter(element, target) {
    const duration = 1500;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * easeProgress);
        
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Visit Statistics for Admin - works with server or localStorage fallback
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

            // Try server first, then fall back to localStorage
            fetch('/api/visits', {
                method: 'DELETE'
            }).then(response => {
                if (response.ok) {
                    loadVisitStatistics();
                }
            }).catch(() => {
                // Clear localStorage
                localStorage.removeItem(VISIT_STORAGE_KEY);
                loadVisitStatistics();
            });
        });
    }

    // Load initial stats
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
        // Try server first
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

    // Fallback to localStorage
    if (!usedServer) {
        visits = getVisitsFromStorage();
        
        // Calculate statistics from localStorage data
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

    // Load visit history - try server first, then localStorage
    try {
        if (!usedServer) {
            // Use localStorage data
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

                // Pagination
                if (totalPages > 1) {
                    let paginationHTML = '<div class="pagination">';
                    for (let i = 1; i <= totalPages; i++) {
                        paginationHTML += `<button class="button button-secondary" onclick="loadVisitPageLocal(${i})">${i}</button>`;
                    }
                    paginationHTML += '</div>';
                    paginationContainer.innerHTML = paginationHTML;
                } else {
                    paginationContainer.innerHTML = '';
                }
            }
        } else {
            // Use server data
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

                    // Pagination
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

    // Update pagination
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

// Make loadVisitPageLocal globally available
window.loadVisitPageLocal = loadVisitPageLocal;

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

// New Projects Images (simple upload + list + delete)
const API_PROJECTS = '/api/projects-images';

async function initProjectsImagesAdmin() {
    const uploadForm = document.getElementById('projects-upload-form');
    const statusElement = document.getElementById('projects-upload-status');
    const listContainer = document.getElementById('admin-projects-list');
    const listCard = document.getElementById('admin-gallery-list-card');

    if (!uploadForm || !listContainer) return;

    uploadForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(uploadForm);
        statusElement.textContent = 'Uploading...';
        statusElement.classList.remove('hidden');

        try {
            const res = await fetch(`${API_PROJECTS}/upload`, { method: 'POST', body: formData });
            const contentType = res.headers.get('content-type') || '';
            const data = contentType.includes('application/json') ? await res.json() : { error: await res.text() };
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            uploadForm.reset();
            statusElement.textContent = 'Uploaded successfully.';
            statusElement.className = 'client-notification success';
            await loadProjectsImagesAdminList();
        } catch (err) {
            console.error(err);
            statusElement.textContent = `Upload failed: ${err.message}`;
            statusElement.className = 'client-notification error';
        }
    });

    if (listCard) listCard.classList.remove('hidden');
    await loadProjectsImagesAdminList();
}

async function loadProjectsImagesAdminList() {
    const listContainer = document.getElementById('admin-projects-list');
    const statusElement = document.getElementById('projects-upload-status');
    if (!listContainer) return;

    try {
        const res = await fetch(`${API_PROJECTS}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');

        if (!data.items || data.items.length === 0) {
            listContainer.innerHTML = '<p class="contact-note">No uploads yet.</p>';
            return;
        }

        listContainer.innerHTML = data.items.map(item => {
            const isImage = item.mimeType && item.mimeType.startsWith('image/');
            return `
                <div class="admin-gallery-item">
                    <div class="admin-gallery-thumbnail">
                        ${isImage ? `<img src="${item.url}" alt="${escapeHtml(item.originalName)}" />` : '<div class="admin-gallery-placeholder">No preview</div>'}
                    </div>
                    <div class="admin-gallery-info">
                        <h4>${escapeHtml(item.originalName)}</h4>
                        <p>${new Date(item.uploadedAt).toLocaleDateString()}</p>
                        <button class="button button-secondary admin-projects-delete" data-id="${item.id}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.querySelectorAll('.admin-projects-delete').forEach(btn => {
            btn.addEventListener('click', async function () {
                const id = this.dataset.id;
                if (!confirm('Delete this upload?')) return;
                try {
                    const delRes = await fetch(`${API_PROJECTS}/image/${id}`, { method: 'DELETE' });
                    const delData = await delRes.json().catch(() => ({}));
                    if (!delRes.ok) throw new Error(delData.error || 'Delete failed');
                    if (statusElement) {
                        statusElement.textContent = 'Deleted successfully.';
                        statusElement.className = 'client-notification success';
                        statusElement.classList.remove('hidden');
                    }
                    await loadProjectsImagesAdminList();
                } catch (err) {
                    console.error(err);
                    if (statusElement) {
                        statusElement.textContent = `Delete failed: ${err.message}`;
                        statusElement.className = 'client-notification error';
                        statusElement.classList.remove('hidden');
                    }
                }
            });
        });
    } catch (err) {
        console.error(err);
        listContainer.innerHTML = '<p class="contact-note">Failed to load uploads.</p>';
    }
}

async function initProjectsImagesPage() {
    const listContainer = document.getElementById('projects-list');
    const empty = document.getElementById('projects-empty');
    const searchInput = document.getElementById('projects-search');
    const searchBtn = document.getElementById('projects-search-btn');

    if (!listContainer) return;

    async function loadProjectsImagesPage() {
        let q = (searchInput && searchInput.value ? searchInput.value.trim() : '');
        const url = q ? `${API_PROJECTS}?q=${encodeURIComponent(q)}` : `${API_PROJECTS}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');

        const items = data.items || [];
        if (!items.length) {
            listContainer.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }

        if (empty) empty.classList.add('hidden');
        listContainer.innerHTML = items.map(item => {
            const isImage = item.mimeType && item.mimeType.startsWith('image/');
            return `
                <article class="project-card">
                    <div class="project-card-thumb">
                        ${isImage ? `<img class="project-thumb" src="${item.url}" alt="${escapeHtml(item.originalName)}" />` : '<div class="project-thumb project-thumb-placeholder">File</div>'}
                    </div>
                    <div class="project-card-header">
                        <h3>${escapeHtml(item.originalName)}</h3>
                    </div>
                    <p class="project-meta">${new Date(item.uploadedAt).toLocaleDateString()} • ${escapeHtml(item.mimeType || 'file')}</p>
                    <div class="project-actions">
                        <a class="button button-primary" href="${API_PROJECTS}/image/${item.id}/download" download>Download</a>
                    </div>
                </article>
            `;
        }).join('');
    }

    try {
        await loadProjectsImagesPage();
    } catch (e) {
        console.error(e);
        listContainer.innerHTML = '<p class="contact-note">Failed to load projects.</p>';
    }

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', async () => {
            try {
                await loadProjectsImagesPage();
            } catch (e) {
                console.error(e);
            }
        });
    }
}

// Make functions globally available
window.updateMessageStatus = updateMessageStatus;
window.loadVisitPage = loadVisitPage;

