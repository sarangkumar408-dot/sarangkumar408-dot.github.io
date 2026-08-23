const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const archiver = require('archiver');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const galleryDir = path.join(dataDir, 'gallery_files');
const messagesFile = path.join(dataDir, 'messages.json');
const visitsFile = path.join(dataDir, 'visits.json');
const galleryFile = path.join(dataDir, 'gallery.json');
const ownerUsersFile = path.join(dataDir, 'owners.json');
const ownerAdsFile = path.join(dataDir, 'project_ads.json');
const ownerAuditFile = path.join(dataDir, 'owner_audit.json');
const JWT_SECRET = process.env.JWT_SECRET || 'sk-web-owner-secret-2026';

// Simple projects-images upload
const projectsImagesDir = path.join(dataDir, 'projects_images');
const projectsImagesFile = path.join(dataDir, 'projects_images.json');


app.use(express.json());
app.use('/gallery-files', express.static(galleryDir));
app.use('/projects-images-files', express.static(projectsImagesDir));
app.use(express.static(path.join(__dirname)));


function ensureDataFile() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(messagesFile)) {
        fs.writeFileSync(messagesFile, '[]', 'utf8');
    }
    if (!fs.existsSync(visitsFile)) {
        fs.writeFileSync(visitsFile, '[]', 'utf8');
    }
    if (!fs.existsSync(galleryFile)) {
        fs.writeFileSync(galleryFile, '[]', 'utf8');
    }
    if (!fs.existsSync(ownerUsersFile)) {
        const defaultOwner = [{
            id: 'owner-1',
            username: 'owner',
            password: 'Owner@2026',
            email: 'owner@skwebsolutions.com',
            role: 'OWNER',
            firstName: 'Sarang',
            lastName: 'Kumar',
            active: true,
            createdAt: new Date().toISOString()
        }];
        fs.writeFileSync(ownerUsersFile, JSON.stringify(defaultOwner, null, 2), 'utf8');
    }
    if (!fs.existsSync(ownerAdsFile)) {
        fs.writeFileSync(ownerAdsFile, JSON.stringify([
            {
                id: 'seed-ad-1',
                title: 'XIT View Interior',
                subtitle: 'Premium Interior Design',
                description: 'Premium Interior Design & Turnkey Solutions for Homes, Offices, Retail Stores, and Commercial Spaces.',
                contact: '+91 9032434349',
                status: 'active',
                imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
                imageAlt: 'Interior design project showcase',
                buttonText: 'Contact Owner',
                buttonUrl: 'tel:+919032434349',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'owner'
            }
        ], null, 2), 'utf8');
    }
    if (!fs.existsSync(ownerAuditFile)) {
        fs.writeFileSync(ownerAuditFile, JSON.stringify([], null, 2), 'utf8');
    }

    // Projects-images storage
    if (!fs.existsSync(projectsImagesFile)) {
        fs.writeFileSync(projectsImagesFile, '[]', 'utf8');
    }
    if (!fs.existsSync(projectsImagesDir)) {
        fs.mkdirSync(projectsImagesDir, { recursive: true });
    }
}

function readOwnerUsers() {
    ensureDataFile();
    try {
        return JSON.parse(fs.readFileSync(ownerUsersFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function writeOwnerUsers(users) {
    ensureDataFile();
    fs.writeFileSync(ownerUsersFile, JSON.stringify(users, null, 2), 'utf8');
}

function readOwnerAds() {
    ensureDataFile();
    try {
        return JSON.parse(fs.readFileSync(ownerAdsFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function writeOwnerAds(ads) {
    ensureDataFile();
    fs.writeFileSync(ownerAdsFile, JSON.stringify(ads, null, 2), 'utf8');
}

function readAuditLogs() {
    ensureDataFile();
    try {
        return JSON.parse(fs.readFileSync(ownerAuditFile, 'utf8'));
    } catch (error) {
        return [];
    }
}

function writeAuditLogs(logs) {
    ensureDataFile();
    fs.writeFileSync(ownerAuditFile, JSON.stringify(logs, null, 2), 'utf8');
}

function logOwnerAudit(action, details = {}, actor = null) {
    const logs = readAuditLogs();
    logs.unshift({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        action,
        actor: actor ? { id: actor.id, username: actor.username, role: actor.role } : { id: 'system', username: 'system', role: 'SYSTEM' },
        details,
        timestamp: new Date().toISOString()
    });
    writeAuditLogs(logs.slice(0, 100));
}

function createOwnerToken(user) {
    return jwt.sign({
        sub: user.id,
        id: user.id,
        username: user.username,
        role: user.role
    }, JWT_SECRET, { expiresIn: '8h' });
}

function authOwnerMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!bearer) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
        const decoded = jwt.verify(bearer, JWT_SECRET);
        const users = readOwnerUsers();
        const owner = users.find(user => user.id === decoded.sub || user.username === decoded.username);

        if (!owner || owner.role !== 'OWNER' || owner.active === false) {
            return res.status(403).json({ error: 'Owner role required.' });
        }

        req.owner = owner;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

function readGallery() {
    ensureDataFile();
    const raw = fs.readFileSync(galleryFile, 'utf8');
    try {
        return JSON.parse(raw);
    } catch (error) {
        return [];
    }
}

function writeGallery(gallery) {
    ensureDataFile();
    fs.writeFileSync(galleryFile, JSON.stringify(gallery, null, 2), 'utf8');
}

function readProjectsImages() {
    ensureDataFile();
    const raw = fs.readFileSync(projectsImagesFile, 'utf8');
    try {
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function writeProjectsImages(items) {
    ensureDataFile();
    fs.writeFileSync(projectsImagesFile, JSON.stringify(items, null, 2), 'utf8');
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, galleryDir);
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 300 * 1024 * 1024 }
});

app.post('/api/gallery/upload', upload.array('files', 30), (req, res) => {

    try {
        const { title, description, clientName, category, visibility, accessCode } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Project title and description are required.' });
        }

        const files = (req.files || []).map(file => ({
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            url: `/gallery-files/${file.filename}`
        }));

        const gallery = readGallery();
        const newProject = {
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            title: title.trim(),
            description: description.trim(),
            clientName: clientName ? clientName.trim() : '',
            category: category ? category.trim() : 'Others',
            visibility: visibility === 'private' ? 'private' : 'public',
            accessCode: visibility === 'private' ? (accessCode ? accessCode.trim() : '') : '',
            uploadedAt: new Date().toISOString(),
            files,
            downloads: 0
        };

        gallery.unshift(newProject);
        writeGallery(gallery);

        res.status(201).json(newProject);
    } catch (error) {
        console.error('Gallery upload error:', error);
        res.status(500).json({ error: 'Server error during project upload.' });
    }
});
app.get('/api/gallery', (req, res) => {
    const gallery = readGallery();
    const query = (req.query.q || '').toLowerCase().trim();
    const category = (req.query.category || '').toLowerCase().trim();
    const client = (req.query.client || '').toLowerCase().trim();
    const accessCode = (req.query.accessCode || '').trim();
    const isAdmin = req.query.admin === 'true';

    const filtered = gallery.filter(project => {
        const isPublic = project.visibility === 'public';
        const isAuthorized = accessCode && project.visibility === 'private' && project.accessCode === accessCode;
        if (!isPublic && !isAuthorized && !isAdmin) {
            return false;
        }

        if (query) {
            const text = `${project.title} ${project.description} ${project.clientName} ${project.category}`.toLowerCase();
            if (!text.includes(query)) {
                return false;
            }
        }

        if (category && project.category.toLowerCase() !== category) {
            return false;
        }

        if (client && project.clientName.toLowerCase() !== client) {
            return false;
        }

        return true;
    });

    res.json(filtered);
});

app.get('/api/gallery/:projectId/download-all', (req, res) => {
    const gallery = readGallery();
    const project = gallery.find(item => item.id === req.params.projectId);
    if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
    }

    project.downloads = (project.downloads || 0) + 1;
    writeGallery(gallery);

    const archive = archiver('zip', { zlib: { level: 9 } });
    res.attachment(`${project.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project'}-files.zip`);

    archive.on('error', err => {
        res.status(500).send({ error: err.message });
    });

    archive.pipe(res);
    project.files.forEach(file => {
        const filePath = path.join(galleryDir, file.storedName);
        if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: file.originalName });
        }
    });
    archive.finalize();
});

// Projects Images (simple upload + download + delete)
const projectsImagesStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, projectsImagesDir);
    },
    filename: function (req, file, cb) {
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`);
    }
});

const projectsImagesUpload = multer({
    storage: projectsImagesStorage,
    limits: { fileSize: 300 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowed = /^image\//.test(file.mimetype) ||
            file.mimetype === 'application/pdf' ||
            file.mimetype.startsWith('video/') ||
            file.originalname.toLowerCase().endsWith('.zip');
        cb(null, allowed);
    }
});

app.post('/api/projects-images/upload', projectsImagesUpload.array('images', 50), (req, res) => {
    try {
        const { projectName } = req.body;
        const files = (req.files || []).map(file => ({
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            url: `/projects-images-files/${file.filename}`,
            id: file.filename
        }));

        if (!files.length) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const items = readProjectsImages();
        const now = new Date().toISOString();
        const newItems = files.map(f => ({
            id: f.id,
            originalName: f.originalName,
            storedName: f.storedName,
            mimeType: f.mimeType,
            size: f.size,
            url: f.url,
            uploadedAt: now,
            projectName: (projectName || '').trim()
        }));

        const out = [...newItems, ...items];
        writeProjectsImages(out);
        res.status(201).json({ success: true, items: newItems });
    } catch (error) {
        console.error('Projects-images upload error:', error);
        res.status(500).json({ error: 'Server error during upload.' });
    }
});

app.get('/api/projects-images', (req, res) => {
    const items = readProjectsImages();
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) return res.json({ items });
    const filtered = items.filter(i => {
        const text = `${i.originalName} ${i.projectName || ''} ${i.mimeType || ''}`.toLowerCase();
        return text.includes(q);
    });
    res.json({ items: filtered });
});

app.get('/api/projects-images/image/:id/download', (req, res) => {
    const items = readProjectsImages();
    const item = items.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'File not found.' });

    const filePath = path.join(projectsImagesDir, item.storedName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server.' });

    res.download(filePath, item.originalName);
});

app.delete('/api/projects-images/image/:id', (req, res) => {
    const items = readProjectsImages();
    const idx = items.findIndex(x => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'File not found.' });

    const [item] = items.splice(idx, 1);
    const filePath = path.join(projectsImagesDir, item.storedName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    writeProjectsImages(items);
    res.json({ success: true });
});

app.delete('/api/gallery/:projectId', (req, res) => {


    const gallery = readGallery();
    const projectIndex = gallery.findIndex(item => item.id === req.params.projectId);
    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found.' });
    }

    const [project] = gallery.splice(projectIndex, 1);
    project.files.forEach(file => {
        const filePath = path.join(galleryDir, file.storedName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });

    writeGallery(gallery);
    res.json({ success: true });
});

function readMessages() {
  ensureDataFile();
  const raw = fs.readFileSync(messagesFile, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeMessages(messages) {
  ensureDataFile();
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2), 'utf8');
}

// Visit tracking functions
function readVisits() {
  ensureDataFile();
  const raw = fs.readFileSync(visitsFile, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeVisits(visits) {
  ensureDataFile();
  fs.writeFileSync(visitsFile, JSON.stringify(visits, null, 2), 'utf8');
}

// Simple hash function for anonymizing IPs
function anonymizeIP(ip) {
  // Simple hash to anonymize IP addresses
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Check if visit is from same session (within last 30 minutes)
function isDuplicateVisit(visits, sessionId, ipHash) {
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  return visits.some(v => 
    (v.sessionId === sessionId || v.ipHash === ipHash) && 
    new Date(v.timestamp).getTime() > thirtyMinutesAgo
  );
}

app.get('/api/messages', (req, res) => {
  const messages = readMessages();
  const contact = req.query.contact;
  if (contact) {
    const normalized = contact.toLowerCase().trim();
    return res.json(messages.filter(item => item.contact && item.contact.toLowerCase().trim() === normalized));
  }
  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const { name, contact, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required.' });
  }

  const messages = readMessages();
  const newMessage = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    name,
    contact: contact || '',
    message,
    status: 'pending',
    responseMessage: 'Your request is pending and waiting for admin review.',
    receivedAt: new Date().toISOString()
  };

  messages.push(newMessage);
  writeMessages(messages);

  res.status(201).json(newMessage);
});

app.put('/api/messages/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'accepted', 'rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const messages = readMessages();
  const message = messages.find(item => item.id === id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found.' });
  }

  message.status = status;
  message.responseMessage =
    status === 'accepted'
      ? 'The meeting request has been accepted. SK Web Solutions will contact the client shortly.'
      : status === 'rejected'
      ? 'The meeting request has been rejected. The client will be notified and may submit a new request if needed.'
      : 'The request is pending and awaiting admin review.';

  writeMessages(messages);
  res.json(message);
});

app.delete('/api/messages', (req, res) => {
  writeMessages([]);
  res.json({ success: true });
});

// SMS Reply endpoint
app.post('/api/messages/:id/sms', (req, res) => {
  const { id } = req.params;
  const { to, from, message, sentAt } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'To and message are required.' });
  }

  const messages = readMessages();
  const msg = messages.find(item => item.id === id);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found.' });
  }

  // Store SMS reply
  msg.smsReplies = msg.smsReplies || [];
  msg.smsReplies.push({
    to,
    from: from || 'SK Web Solutions',
    message,
    sentAt: sentAt || new Date().toISOString()
  });
  msg.lastReplyAt = sentAt || new Date().toISOString();

  writeMessages(messages);
  res.json({ success: true, smsId: Date.now().toString() });
});

// Visit tracking endpoints
app.get('/api/visits', (req, res) => {
  const visits = readVisits();
  
  // Calculate statistics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const todayVisits = visits.filter(v => new Date(v.timestamp) >= todayStart).length;
  const weekVisits = visits.filter(v => new Date(v.timestamp) >= weekStart).length;
  const monthVisits = visits.filter(v => new Date(v.timestamp) >= monthStart).length;
  const totalVisits = visits.length;
  
  // Get unique visitors (by anonymized IP)
  const uniqueVisitors = new Set(visits.map(v => v.ipHash)).size;
  
  // Daily visits for the last 30 days
  const dailyVisits = [];
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(todayStart);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const count = visits.filter(v => {
      const visitDate = new Date(v.timestamp);
      return visitDate >= dayStart && visitDate < dayEnd;
    }).length;
    
    dailyVisits.push({
      date: dayStart.toISOString().split('T')[0],
      count
    });
  }
  
  res.json({
    total: totalVisits,
    today: todayVisits,
    week: weekVisits,
    month: monthVisits,
    uniqueVisitors,
    dailyVisits
  });
});

app.post('/api/visits', (req, res) => {
  const { sessionId, userAgent } = req.body;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const ipHash = anonymizeIP(ip);
  
  const visits = readVisits();
  
  // Check for duplicate visits within 30 minutes
  if (sessionId && isDuplicateVisit(visits, sessionId, ipHash)) {
    return res.json({ success: true, duplicate: true });
  }
  
  const newVisit = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    timestamp: new Date().toISOString(),
    ipHash,
    sessionId: sessionId || null,
    userAgent: userAgent || '',
    referrer: req.get('Referrer') || ''
  };
  
  visits.push(newVisit);
  writeVisits(visits);
  
  res.json({ success: true, duplicate: false, visit: newVisit });
});

app.get('/api/visits/history', (req, res) => {
  const visits = readVisits();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  
  let filteredVisits = visits;
  
  if (startDate) {
    filteredVisits = filteredVisits.filter(v => new Date(v.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    filteredVisits = filteredVisits.filter(v => new Date(v.timestamp) <= new Date(endDate + 'T23:59:59'));
  }
  
  // Sort by most recent first
  filteredVisits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Paginate
  const totalFiltered = filteredVisits.length;
  const startIndex = (page - 1) * limit;
  const paginatedVisits = filteredVisits.slice(startIndex, startIndex + limit);
  
  res.json({
    visits: paginatedVisits,
    pagination: {
      page,
      limit,
      total: totalFiltered,
      totalPages: Math.ceil(totalFiltered / limit)
    }
  });
});

app.delete('/api/visits', (req, res) => {
  writeVisits([]);
  res.json({ success: true });
});

app.post('/api/owner/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const trimmedUsername = (username || '').trim();
  const trimmedPassword = (password || '').trim();

  if (!trimmedUsername || !trimmedPassword) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const users = readOwnerUsers();
  const owner = users.find(user => user.role === 'OWNER' && user.username.toLowerCase() === trimmedUsername.toLowerCase());

  if (!owner || owner.password !== trimmedPassword || owner.active === false) {
    logOwnerAudit('FAILED_LOGIN', { username: trimmedUsername, ip: req.ip }, null);
    return res.status(401).json({ error: 'Invalid owner credentials.' });
  }

  const token = createOwnerToken(owner);
  logOwnerAudit('LOGIN', { username: owner.username }, owner);

  return res.json({
    token,
    user: {
      id: owner.id,
      username: owner.username,
      email: owner.email,
      role: owner.role,
      firstName: owner.firstName,
      lastName: owner.lastName
    }
  });
});

app.get('/api/owner/me', authOwnerMiddleware, (req, res) => {
  res.json({
    id: req.owner.id,
    username: req.owner.username,
    email: req.owner.email,
    role: req.owner.role,
    firstName: req.owner.firstName,
    lastName: req.owner.lastName
  });
});

app.get('/api/ads', (req, res) => {
  res.json(readOwnerAds().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));
});

app.get('/api/owner/ads', authOwnerMiddleware, (req, res) => {
  const ads = readOwnerAds().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  res.json(ads);
});

app.post('/api/owner/ads', authOwnerMiddleware, (req, res) => {
  const { title, subtitle, description, contact, status, imageUrl, imageAlt, buttonText, buttonUrl } = req.body || {};

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const now = new Date().toISOString();
  const ads = readOwnerAds();
  const newAd = {
    id: `ad-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: String(title).trim(),
    subtitle: String(subtitle || '').trim(),
    description: String(description).trim(),
    contact: String(contact || '').trim(),
    status: ['active', 'draft', 'archived'].includes(status) ? status : 'active',
    imageUrl: String(imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80').trim(),
    imageAlt: String(imageAlt || title).trim(),
    buttonText: String(buttonText || 'Contact Owner').trim(),
    buttonUrl: String(buttonUrl || 'tel:+919000000000').trim(),
    createdAt: now,
    updatedAt: now,
    createdBy: req.owner.username
  };

  ads.unshift(newAd);
  writeOwnerAds(ads);
  logOwnerAudit('CREATE_AD', { id: newAd.id, title: newAd.title }, req.owner);

  res.status(201).json({ success: true, ad: newAd });
});

app.put('/api/owner/ads/:id', authOwnerMiddleware, (req, res) => {
  const { id } = req.params;
  const ads = readOwnerAds();
  const index = ads.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Ad not found.' });
  }

  const { title, subtitle, description, contact, status, imageUrl, imageAlt, buttonText, buttonUrl } = req.body || {};

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const updatedAd = {
    ...ads[index],
    title: String(title).trim(),
    subtitle: String(subtitle || '').trim(),
    description: String(description).trim(),
    contact: String(contact || '').trim(),
    status: ['active', 'draft', 'archived'].includes(status) ? status : ads[index].status,
    imageUrl: String(imageUrl || ads[index].imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80').trim(),
    imageAlt: String(imageAlt || title).trim(),
    buttonText: String(buttonText || ads[index].buttonText || 'Contact Owner').trim(),
    buttonUrl: String(buttonUrl || ads[index].buttonUrl || 'tel:+919000000000').trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: req.owner.username
  };

  ads[index] = updatedAd;
  writeOwnerAds(ads);
  logOwnerAudit('UPDATE_AD', { id: updatedAd.id, title: updatedAd.title }, req.owner);

  res.json({ success: true, ad: updatedAd });
});

app.delete('/api/owner/ads/:id', authOwnerMiddleware, (req, res) => {
  const ads = readOwnerAds();
  const index = ads.findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Ad not found.' });
  }

  const [removed] = ads.splice(index, 1);
  writeOwnerAds(ads);
  logOwnerAudit('DELETE_AD', { id: removed.id, title: removed.title }, req.owner);

  res.json({ success: true, deletedId: removed.id });
});

app.get('/api/owner/audit', authOwnerMiddleware, (req, res) => {
  const logs = readAuditLogs().slice(0, 25);
  res.json(logs);
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  const requestedPath = req.originalUrl || '';
  if (requestedPath.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// LinkedIn about/profile endpoint - return local data if present, otherwise a minimal fallback
app.get('/api/about/linkedin', (req, res) => {
  const url = req.query.url || '';
  const dataFile = path.join(dataDir, 'linkedin.json');
  if (fs.existsSync(dataFile)) {
    try {
      const raw = fs.readFileSync(dataFile, 'utf8');
      return res.json(JSON.parse(raw));
    } catch (e) {
      console.error('Invalid linkedin.json:', e);
    }
  }

  return res.json({
    name: 'SK Web Solutions',
    headline: 'Frontend Developer',
    summary: `Public LinkedIn: ${url || 'https://www.linkedin.com'}`,
    profilePicture: '/Founder1.jpeg',
    location: 'Hyderabad, India',
    linkedInUrl: url || 'https://www.linkedin.com/feed/'
  });
});

app.listen(port, () => {
  console.log(`SK Web Solutions server running at http://localhost:${port}`);
});
