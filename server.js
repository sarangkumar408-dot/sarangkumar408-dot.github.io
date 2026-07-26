const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const messagesFile = path.join(dataDir, 'messages.json');
const visitsFile = path.join(dataDir, 'visits.json');
const projectsFile = path.join(dataDir, 'projects.json');
const NEWS_CACHE_TTL = 10 * 60 * 1000;
const NEWS_LANGUAGE_CONFIG = {
  en: { label: 'English', query: 'India breaking news', hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
  hi: { label: 'Hindi', query: 'भारत समाचार', hl: 'hi-IN', gl: 'IN', ceid: 'IN:hi' },
  te: { label: 'Telugu', query: 'భారత వార్తలు', hl: 'te-IN', gl: 'IN', ceid: 'IN:te' },
  ta: { label: 'Tamil', query: 'இந்திய செய்திகள்', hl: 'ta-IN', gl: 'IN', ceid: 'IN:ta' },
  kn: { label: 'Kannada', query: 'ಭಾರತದ ಸುದ್ದಿ', hl: 'kn-IN', gl: 'IN', ceid: 'IN:kn' },
  bn: { label: 'Bengali', query: 'ভারতীয় সংবাদ', hl: 'bn-IN', gl: 'IN', ceid: 'IN:bn' },
  mr: { label: 'Marathi', query: 'भारतीय बातम्या', hl: 'mr-IN', gl: 'IN', ceid: 'IN:mr' }
};
const NEWS_FALLBACK = {
  en: [
    { title: 'India expands digital public infrastructure for faster citizen services', description: 'The government announces new initiatives to support secure digital access across communities.', source: 'India News Desk', publishedAt: new Date().toISOString(), category: 'Technology', link: 'https://www.india.gov.in/' },
    { title: 'Major infrastructure project to boost regional connectivity', description: 'New transport and logistics investment is expected to improve travel and commerce across states.', source: 'Live India Report', publishedAt: new Date(Date.now() - 15 * 60000).toISOString(), category: 'Business', link: 'https://www.india.gov.in/' },
    { title: 'State leaders gather for policy roundtable on urban growth', description: 'Officials discuss housing, transport, and local employment opportunities for fast-growth cities.', source: 'City Chronicle', publishedAt: new Date(Date.now() - 45 * 60000).toISOString(), category: 'Local/City News', link: 'https://www.india.gov.in/' }
  ],
  hi: [
    { title: 'भारत डिजिटल आधार परियोजनाओं को तेज़ी से बढ़ा रहा है', description: 'सरकार नागरिक सेवाओं को अधिक सुलभ बनाने के लिए नई पहलें शुरू कर रही है।', source: 'भारत समाचार', publishedAt: new Date().toISOString(), category: 'Technology', link: 'https://www.india.gov.in/' },
    { title: 'राज्यों में बुनियादी ढांचे पर निवेश बढ़ रहा है', description: 'नई परियोजनाओं से परिवहन और व्यापार की गति तेज होने की उम्मीद है।', source: 'लाइव इंडिया', publishedAt: new Date(Date.now() - 20 * 60000).toISOString(), category: 'Business', link: 'https://www.india.gov.in/' }
  ],
  te: [
    { title: 'భారతం డిజిటల్ సేవల కోసం కొత్త పథకాలను ప్రారంభిస్తోంది', description: 'నగరాలు మరియు గ్రామాల మధ్య సేవల యాక్సెస్ మెరుగుపర్చేందుకు ప్రభుత్వం సహకరిస్తోంది.', source: 'తెలుగుజోతి', publishedAt: new Date().toISOString(), category: 'Technology', link: 'https://www.india.gov.in/' }
  ],
  ta: [
    { title: 'இந்தியாவில் டிஜிட்டல் கட்டமைப்பு மேம்பாட்டில் புதிய முன்னேற்றம்', description: 'நகர மற்றும் கிராம மக்களுக்கான சேவைகளை மேலும் எளிதாக்கும் முயற்சிகள் தொடங்கப்பட்டுள்ளன.', source: 'தமிழ் செய்திகள்', publishedAt: new Date().toISOString(), category: 'Technology', link: 'https://www.india.gov.in/' }
  ],
  kn: [
    { title: 'ಭಾರತ ಡಿಜಿಟಲ್ ಸಾರ್ವಜನಿಕ ಸೇವೆಗಳಿಗೆ ಹೊಸ ಬದ್ಧತೆಯನ್ನು ಘೋಷಿಸಿದೆ', description: 'ಹೊಸತೆಯ ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ನಗರೀಕರಣಕ್ಕೆ ಅನುಕೂಲವಾಗುವ ಯೋಜನೆಗಳನ್ನು ಸರ್ಕಾರ ಚರ್ಚಿಸುತ್ತಿದೆ.', source: 'ಕನ್ನಡ ನ್ಯೂಸ್', publishedAt: new Date().toISOString(), category: 'Technology', link: 'https://www.india.gov.in/' }
  ],
  bn: [
    { title: 'ভারত ডিজিটাল পরিষেবা সম্প্রসারণে নতুন পদক্ষেপ নিচ্ছে', description: 'জনসাধারণের সহজ অ্যাক্সেসের জন্য নতুন উদ্যোগ প্রকাশিত হয়েছে।', source: 'বাংলা খবর', publishedAt: new Date().toISOString(), category: 'Technology', link: 'https://www.india.gov.in/' }
  ],
  mr: [
    { title: 'भारत डिजिटल सार्वजनिक सेवांमध्ये वेगाने वाढ करत आहे', description: 'नवीन उपायांमुळे नागरिकांच्या सेवा अधिक सुलभ होणार आहेत.', source: 'मराठी बातम्या', publishedAt: new Date().toISOString(), category: 'Technology', link: 'https://www.india.gov.in/' }
  ]
};
let newsCache = {};
let wikiCache = {};
const WIKI_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours (Wikipedia featured content changes daily)

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(value) {
  return decodeEntities(String(value || '')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectCategory(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  if (/(politic|election|parliament|minister|government|assembly|policy)/.test(text)) {
    return 'Politics';
  }
  if (/(business|market|finance|economy|stock|trade|startup)/.test(text)) {
    return 'Business';
  }
  if (/(tech|ai|software|digital|app|cyber|gadget|innovation)/.test(text)) {
    return 'Technology';
  }
  if (/(sport|cricket|football|hockey|tournament|match|olympic)/.test(text)) {
    return 'Sports';
  }
  if (/(film|movie|celebrity|entertainment|bollywood|music|series|festival)/.test(text)) {
    return 'Entertainment';
  }
  return 'Local/City News';
}

function getFallbackNews(language) {
  return NEWS_FALLBACK[language] || NEWS_FALLBACK.en;
}

function parseNewsFeed(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi);

  for (const match of itemMatches) {
    const block = match[1];
    const title = stripHtml((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const link = stripHtml((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '');
    const description = stripHtml((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '');
    const pubDate = stripHtml((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '');
    const image = stripHtml((block.match(/<media:thumbnail[^>]+url="([^"]+)"/i) || [])[1] || '');
    const source = stripHtml((block.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || 'India News');

    if (!title) {
      continue;
    }

    items.push({
      title,
      description: description || title,
      link,
      image,
      source,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      category: detectCategory(title, description)
    });
  }

  return items.slice(0, 12);
}

function getNewsFeedUrl(language) {
  const config = NEWS_LANGUAGE_CONFIG[language] || NEWS_LANGUAGE_CONFIG.en;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(config.query)}&hl=${config.hl}&gl=${config.gl}&ceid=${config.ceid}`;
}

function fetchRemoteNews(language) {
  return new Promise((resolve) => {
    const url = getNewsFeedUrl(language);
    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        if (response.statusCode >= 400) {
          resolve(getFallbackNews(language));
          return;
        }
        const parsed = parseNewsFeed(data);
        resolve(parsed.length ? parsed : getFallbackNews(language));
      });
    }).on('error', () => {
      resolve(getFallbackNews(language));
    });
  });
}

async function getNewsFeed(language) {
  const cacheKey = language || 'en';
  const cached = newsCache[cacheKey];
  if (cached && Date.now() - cached.fetchedAt < NEWS_CACHE_TTL) {
    return cached.items;
  }

  const items = await fetchRemoteNews(cacheKey);
  newsCache[cacheKey] = { fetchedAt: Date.now(), items };
  return items;
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
  if (!fs.existsSync(projectsFile)) {
    fs.writeFileSync(projectsFile, '[]', 'utf8');
  }
}

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

function readProjects() {
  ensureDataFile();
  const raw = fs.readFileSync(projectsFile, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeProjects(projects) {
  ensureDataFile();
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2), 'utf8');
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
      ? 'The meeting request has been accepted. NexusForge will contact the client shortly.'
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
    from: from || 'NexusForge',
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

app.get('/api/projects', (req, res) => {
  const projects = readProjects().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { title, description, fileName, fileType, dataUrl } = req.body;

  if (!title || !description || !fileName || !fileType || !dataUrl) {
    return res.status(400).json({ error: 'Title, description, media file, and data are required.' });
  }

  const projects = readProjects();
  const newProject = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    title,
    description,
    fileName,
    fileType,
    dataUrl,
    createdAt: new Date().toISOString()
  };

  projects.push(newProject);
  writeProjects(projects);
  res.status(201).json(newProject);
});

app.delete('/api/projects/:id', (req, res) => {
  const projects = readProjects();
  const filteredProjects = projects.filter((project) => project.id !== req.params.id);

  if (filteredProjects.length === projects.length) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  writeProjects(filteredProjects);
  res.json({ success: true });
});

// ============================================
// Founder Image API Endpoints
// ============================================

const founderFile = path.join(dataDir, 'founder.json');

function readFounderConfig() {
  ensureDataFile();
  try {
    if (!fs.existsSync(founderFile)) {
      const defaultConfig = { image: 'Sarang.png', name: 'Mr. Sarang Kumar', title: 'Founder & Lead Developer', tagline: 'Building the future, one pixel at a time.' };
      fs.writeFileSync(founderFile, JSON.stringify(defaultConfig, null, 2), 'utf8');
      return defaultConfig;
    }
    const raw = fs.readFileSync(founderFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return { image: 'Sarang.png', name: 'Mr. Sarang Kumar', title: 'Founder & Lead Developer', tagline: 'Building the future, one pixel at a time.' };
  }
}

function writeFounderConfig(config) {
  ensureDataFile();
  try {
    // Strip the data:image prefix for storage, we store the full dataUrl
    fs.writeFileSync(founderFile, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing founder config:', error);
  }
}

/**
 * GET /api/founder
 * Returns the current founder card configuration (image, name, title, tagline)
 */
app.get('/api/founder', (req, res) => {
  const config = readFounderConfig();
  res.json(config);
});

/**
 * POST /api/founder
 * Updates the founder image (dataUrl) and optionally name/title/tagline
 */
app.post('/api/founder', (req, res) => {
  const { image, name, title, tagline } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  const config = readFounderConfig();
  config.image = image;
  if (name) config.name = name;
  if (title) config.title = title;
  if (tagline) config.tagline = tagline;

  writeFounderConfig(config);
  res.json({ success: true, config });
});

/**
 * GET /api/founder/image
 * Serves the founder image directly (redirects to the stored dataUrl or default)
 */
app.get('/api/founder/image', (req, res) => {
  const config = readFounderConfig();
  const imageData = config.image;
  
  if (imageData && imageData.startsWith('data:')) {
    // Extract the base64 data and send as image
    const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (matches) {
      const mimeType = `image/${matches[1]}`;
      const buffer = Buffer.from(matches[2], 'base64');
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(buffer);
      return;
    }
  }
  
  // Fallback to default image
  res.sendFile(path.join(__dirname, 'Sarang.png'));
});

/**
 * DELETE /api/founder
 * Resets the founder image back to default
 */
app.delete('/api/founder', (req, res) => {
  const defaultConfig = { image: 'Sarang.png', name: 'Mr. Sarang Kumar', title: 'Founder & Lead Developer', tagline: 'Building the future, one pixel at a time.' };
  writeFounderConfig(defaultConfig);
  res.json({ success: true, config: defaultConfig });
});

app.get('/api/news', async (req, res) => {
  const language = (req.query.lang || 'en').toLowerCase();
  try {
    const items = await getNewsFeed(language);
    res.json({ items, language, source: 'live-news-feed' });
  } catch (error) {
    res.json({ items: getFallbackNews(language), language, source: 'fallback-data' });
  }
});

// ============================================
// Wikipedia API Endpoints
// ============================================

/**
 * Helper to make HTTPS GET requests and parse JSON
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get cached or fresh Wikipedia data
 */
async function getCachedWiki(cacheKey, fetchFn, ttl) {
  const cached = wikiCache[cacheKey];
  if (cached && Date.now() - cached.fetchedAt < (ttl || WIKI_CACHE_TTL)) {
    return cached.data;
  }
  const data = await fetchFn();
  wikiCache[cacheKey] = { fetchedAt: Date.now(), data };
  return data;
}

/**
 * GET /api/wiki/featured
 * Returns featured content from Wikipedia: featured article, on this day, and current events
 */
app.get('/api/wiki/featured', async (req, res) => {
  try {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // Fetch multiple Wikipedia data sources in parallel
    const [featuredArticle, onThisDay, currentEvents] = await Promise.all([
      // 1. Featured article (TFA) - uses en.wikipedia.org feed
      getCachedWiki('tfa', async () => {
        const data = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/feed/featured/${today.getFullYear()}/${month}/${day}`);
        return data.tfa ? {
          title: data.tfa.title,
          extract: data.tfa.extract || data.tfa.description || '',
          pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(data.tfa.title.replace(/ /g, '_'))}`,
          thumbnail: data.tfa.thumbnail ? data.tfa.thumbnail.source : null,
          description: data.tfa.description || 'Featured article from Wikipedia'
        } : null;
      }, WIKI_CACHE_TTL),

      // 2. On this day
      getCachedWiki(`otd_${month}_${day}`, async () => {
        const data = await fetchJSON(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`);
        return (data.events || []).slice(0, 8).map(event => ({
          year: event.year,
          text: event.text,
          pages: (event.pages || []).slice(0, 3).map(p => ({
            title: p.title,
            pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`
          }))
        }));
      }, WIKI_CACHE_TTL),

      // 3. Current events from Wikipedia's current events portal
      getCachedWiki('current_events', async () => {
        const data = await fetchJSON('https://en.wikipedia.org/api/rest_v1/feed/featured/current');
        // Try to get news from the current events feed
        // Also fetch the current events summary
        try {
          const newsData = await fetchJSON('https://en.wikipedia.org/api/rest_v1/page/summary/Portal:Current_events');
          return {
            extract: newsData.extract || 'Ongoing current events from around the world.',
            pageUrl: newsData.content_urls?.desktop?.page || 'https://en.wikipedia.org/wiki/Portal:Current_events'
          };
        } catch (e) {
          return {
            extract: 'Ongoing current events from around the world.',
            pageUrl: 'https://en.wikipedia.org/wiki/Portal:Current_events'
          };
        }
      }, WIKI_CACHE_TTL)
    ]);

    res.json({
      featuredArticle,
      onThisDay,
      currentEvents,
      date: today.toISOString()
    });
  } catch (error) {
    console.error('Wikipedia featured content error:', error.message);
    // Return graceful fallback
    res.json({
      featuredArticle: null,
      onThisDay: [],
      currentEvents: { extract: 'Wikipedia content temporarily unavailable. Please try again later.', pageUrl: 'https://en.wikipedia.org/' },
      date: new Date().toISOString()
    });
  }
});

/**
 * GET /api/wiki/search?q=query&limit=10
 * Search Wikipedia articles by query
 */
app.get('/api/wiki/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  const limit = parseInt(req.query.limit) || 10;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const data = await fetchJSON(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&format=json&origin=*`
    );

    const results = (data.query?.search || []).map(result => ({
      title: result.title,
      snippet: result.snippet.replace(/<[^>]+>/g, ''),
      pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
      wordCount: result.wordcount,
      timestamp: result.timestamp
    }));

    res.json({ query, results, totalResults: data.query?.searchinfo?.totalHits || 0 });
  } catch (error) {
    console.error('Wikipedia search error:', error.message);
    res.json({ query, results: [], totalResults: 0, error: 'Search temporarily unavailable.' });
  }
});

/**
 * GET /api/wiki/article?title=Article_Title
 * Get a summary/extract of a specific Wikipedia article
 */
app.get('/api/wiki/article', async (req, res) => {
  const title = (req.query.title || '').trim();

  if (!title) {
    return res.status(400).json({ error: 'Article title is required.' });
  }

  try {
    const cacheKey = `article_${title.replace(/ /g, '_')}`;
    const data = await getCachedWiki(cacheKey, async () => {
      return await fetchJSON(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`
      );
    }, WIKI_CACHE_TTL);

    res.json({
      title: data.title,
      extract: data.extract,
      description: data.description || '',
      thumbnail: data.thumbnail ? data.thumbnail.source : null,
      pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      modified: data.timestamp || null
    });
  } catch (error) {
    console.error('Wikipedia article fetch error:', error.message);
    res.status(404).json({ error: 'Article not found or unavailable.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`NexusForge server running at http://localhost:${port}`);
});
