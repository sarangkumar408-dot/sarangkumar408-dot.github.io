const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const archiver = require('archiver');

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const galleryDir = path.join(dataDir, 'gallery_files');
const messagesFile = path.join(dataDir, 'messages.json');
const visitsFile = path.join(dataDir, 'visits.json');
const galleryFile = path.join(dataDir, 'gallery.json');

// Simple projects-images upload
const projectsImagesDir = path.join(dataDir, 'projects_images');
const projectsImagesFile = path.join(dataDir, 'projects_images.json');

// Admin credentials (use environment variables in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Simple in-memory session store (replace with database for production)
const adminSessions = new Map();

app.use(express.json());
app.use('/gallery-files', express.static(galleryDir));
app.use('/projects-images-files', express.static(projectsImagesDir));

// --- PDF tools storage (upload + converted output) ---
const pdfToolsDataDir = path.join(dataDir, 'pdf_tools');
const pdfToolsUploadsDir = path.join(pdfToolsDataDir, 'uploads');
const pdfToolsConvertedDir = path.join(pdfToolsDataDir, 'converted');

// Ensure directories exist on boot
if (!fs.existsSync(pdfToolsUploadsDir)) fs.mkdirSync(pdfToolsUploadsDir, { recursive: true });
if (!fs.existsSync(pdfToolsConvertedDir)) fs.mkdirSync(pdfToolsConvertedDir, { recursive: true });

// Serve converted files directly (optional, but helps downloads)
app.use('/pdf-tools-converted', express.static(pdfToolsConvertedDir));

app.use(express.static(path.join(__dirname)));


// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  const sessionId = req.headers['x-admin-session'] || req.query.sessionId;
  if (!sessionId || !adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized. Please login first.' });
  }
  req.adminSessionId = sessionId;
  next();
}


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

    // Projects-images storage
    if (!fs.existsSync(projectsImagesFile)) {
        fs.writeFileSync(projectsImagesFile, '[]', 'utf8');
    }
    if (!fs.existsSync(projectsImagesDir)) {
        fs.mkdirSync(projectsImagesDir, { recursive: true });
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

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(16).slice(2);
    adminSessions.set(sessionId, {
      createdAt: Date.now(),
      username: username
    });
    
    // Auto-expire session after 24 hours
    setTimeout(() => {
      adminSessions.delete(sessionId);
    }, 24 * 60 * 60 * 1000);
    
    res.json({ success: true, sessionId });
  } else {
    res.status(401).json({ error: 'Invalid credentials.' });
  }
});

// Admin logout endpoint
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  adminSessions.delete(req.adminSessionId);
  res.json({ success: true });
});



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

app.post('/api/gallery/upload', requireAdmin, upload.array('files', 30), (req, res) => {

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

// =============================
// PDF Tools (stub convert + download)
// =============================
// Upload a PDF/image file and return an uploadId.
// Convert endpoint is a stub: it copies the uploaded file to converted output.

const pdfToolsUpload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, pdfToolsUploadsDir);
        },
        filename: function (req, file, cb) {
            const ext = path.extname(file.originalname) || '.bin';
            const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
            cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeBase}${ext}`);
        }
    }),
    limits: { fileSize: 300 * 1024 * 1024 }
});

app.post('/api/pdf-tools/upload', pdfToolsUpload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        const uploadId = req.file.filename;
        res.json({
            success: true,
            uploadId,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
        });
    } catch (e) {
        console.error('pdf-tools upload error:', e);
        res.status(500).json({ error: 'Upload failed.' });
    }
});

app.post('/api/pdf-tools/convert', (req, res) => {
    try {
        const { uploadId } = req.body || {};
        if (!uploadId) return res.status(400).json({ error: 'uploadId is required.' });

        const inputPath = path.join(pdfToolsUploadsDir, uploadId);
        if (!fs.existsSync(inputPath)) {
            return res.status(404).json({ error: 'Uploaded file not found.' });
        }

        // Stub conversion: copy upload -> converted
        const ext = path.extname(uploadId) || '.pdf';
        const convertedId = `converted-${uploadId.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const outputPath = path.join(pdfToolsConvertedDir, convertedId + ext);

        // Avoid double-ext if uploadId already includes ext
        // If outputPath doesn't exist as intended, fallback to exact copy name.
        if (fs.existsSync(outputPath)) {
            // noop
        } else {
            // If convertedId+ext already wrong, just use same extension as input file
            const inputExt = path.extname(inputPath);
            const finalConvertedName = `converted-${Date.now()}-${Math.random().toString(16).slice(2)}${inputExt}`;
            const finalOutputPath = path.join(pdfToolsConvertedDir, finalConvertedName);
            fs.copyFileSync(inputPath, finalOutputPath);
            return res.json({ success: true, convertedId: finalConvertedName });
        }

        fs.copyFileSync(inputPath, outputPath);
        res.json({ success: true, convertedId: convertedId + ext });
    } catch (e) {
        console.error('pdf-tools convert error:', e);
        res.status(500).json({ error: 'Convert failed.' });
    }
});

app.get('/api/pdf-tools/result/:convertedId/download', (req, res) => {
    try {
        const convertedId = req.params.convertedId;
        const filePath = path.join(pdfToolsConvertedDir, convertedId);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Converted file not found.' });
        }

        const downloadName = convertedId.replace(/^converted-/, 'converted-');
        res.download(filePath, downloadName);
    } catch (e) {
        console.error('pdf-tools download error:', e);
        res.status(500).json({ error: 'Download failed.' });
    }
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

app.post('/api/projects-images/upload', requireAdmin, projectsImagesUpload.array('images', 50), (req, res) => {
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

app.delete('/api/projects-images/image/:id', requireAdmin, (req, res) => {
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

app.delete('/api/gallery/:projectId', requireAdmin, (req, res) => {


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

app.put('/api/messages/:id/status', requireAdmin, (req, res) => {
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

app.delete('/api/messages', requireAdmin, (req, res) => {
  writeMessages([]);
  res.json({ success: true });
});

// SMS Reply endpoint
app.post('/api/messages/:id/sms', requireAdmin, (req, res) => {
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
app.get('/api/visits', requireAdmin, (req, res) => {
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

app.get('/api/visits/history', requireAdmin, (req, res) => {
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

app.delete('/api/visits', requireAdmin, (req, res) => {
  writeVisits([]);
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`SK Web Solutions server running at http://localhost:${port}`);
});
