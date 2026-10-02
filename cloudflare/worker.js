const DEFAULT_FOUNDER = {
  image: 'Sarang.png',
  name: 'Mr. Sarang Kumar',
  title: 'Founder & Lead Developer',
  tagline: 'Building the future, one pixel at a time.'
};

const DEFAULT_NEWS = [
  {
    title: 'India expands digital public infrastructure for faster citizen services',
    description: 'The government announces new initiatives to support secure digital access across communities.',
    source: 'India News Desk',
    publishedAt: new Date().toISOString(),
    category: 'Technology',
    link: 'https://www.india.gov.in/'
  }
];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function readJson(env, key, fallback) {
  const raw = await env.APP_KV.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Could not parse KV key:', key, error);
    return fallback;
  }
}

async function writeJson(env, key, value) {
  await env.APP_KV.put(key, JSON.stringify(value));
}

async function storeProjectMedia(env, dataUrl, fileName, fileType) {
  if (!dataUrl || !dataUrl.startsWith('data:') || !env.MEDIA) {
    return { url: dataUrl || '', key: '' };
  }

  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) {
      return { url: dataUrl, key: '' };
    }

    const contentType = match[1] || fileType || 'application/octet-stream';
    const safeName = String(fileName || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `projects/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const binary = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));

    await env.MEDIA.put(key, binary, {
      httpMetadata: {
        contentType
      }
    });

    return {
      url: `/media/${key}`,
      key
    };
  } catch (error) {
    console.warn('R2 media upload failed, keeping original data URL.', error);
    return { url: dataUrl || '', key: '' };
  }
}

async function readMessages(env) {
  return await readJson(env, 'nexusforge_messages', []);
}

async function writeMessages(env, value) {
  await writeJson(env, 'nexusforge_messages', value);
}

async function readProjects(env) {
  return await readJson(env, 'nexusforge_projects', []);
}

async function writeProjects(env, value) {
  await writeJson(env, 'nexusforge_projects', value);
}

async function readVisits(env) {
  return await readJson(env, 'nexusforge_visits', []);
}

async function writeVisits(env, value) {
  await writeJson(env, 'nexusforge_visits', value);
}

function getBrowserName(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('opera')) return 'Opera';
  return 'Unknown';
}

function humanDate(value) {
  return new Date(value).toLocaleString();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    try {
      if (url.pathname === '/api/founder') {
        if (request.method === 'GET') {
          const founder = await readJson(env, 'nexusforge_founder', DEFAULT_FOUNDER);
          return jsonResponse(founder);
        }

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const current = await readJson(env, 'nexusforge_founder', DEFAULT_FOUNDER);
          const next = {
            ...current,
            ...(body.image ? { image: body.image } : {}),
            ...(body.name ? { name: body.name } : {}),
            ...(body.title ? { title: body.title } : {}),
            ...(body.tagline ? { tagline: body.tagline } : {})
          };
          await writeJson(env, 'nexusforge_founder', next);
          return jsonResponse({ success: true, config: next });
        }

        if (request.method === 'DELETE') {
          await writeJson(env, 'nexusforge_founder', DEFAULT_FOUNDER);
          return jsonResponse({ success: true, config: DEFAULT_FOUNDER });
        }
      }

      if (url.pathname === '/api/messages') {
        if (request.method === 'GET') {
          const messages = await readMessages(env);
          const contact = url.searchParams.get('contact');
          if (contact) {
            const normalized = contact.toLowerCase().trim();
            const filtered = messages.filter((item) => String(item.contact || '').toLowerCase().trim() === normalized);
            return jsonResponse(filtered);
          }
          return jsonResponse(messages);
        }

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const messages = await readMessages(env);
          const item = {
            id: body.id || crypto.randomUUID(),
            name: body.name || 'Anonymous',
            contact: body.contact || '',
            message: body.message || '',
            status: body.status || 'pending',
            responseMessage: body.responseMessage || 'The request is pending and awaiting admin review.',
            receivedAt: body.receivedAt || new Date().toISOString(),
            createdAt: body.createdAt || new Date().toISOString()
          };
          messages.push(item);
          await writeMessages(env, messages);
          return jsonResponse({ success: true, message: item }, 201);
        }

        if (request.method === 'DELETE') {
          await writeMessages(env, []);
          return jsonResponse({ success: true });
        }
      }

      if (url.pathname.startsWith('/media/')) {
        const key = decodeURIComponent(url.pathname.replace(/^\/media\//, ''));
        if (!key || !env.MEDIA) {
          return jsonResponse({ error: 'Media not found.' }, 404);
        }

        const object = await env.MEDIA.get(key);
        if (!object) {
          return jsonResponse({ error: 'Media not found.' }, 404);
        }

        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      }

      if (url.pathname.startsWith('/api/projects')) {
        const projectId = url.pathname.split('/').pop();

        if (request.method === 'GET') {
          return jsonResponse(await readProjects(env));
        }

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const projects = await readProjects(env);
          const media = await storeProjectMedia(env, body.dataUrl, body.fileName, body.fileType);
          const entry = {
            id: body.id || crypto.randomUUID(),
            title: body.title || 'Project',
            description: body.description || '',
            fileName: body.fileName || 'project',
            fileType: body.fileType || 'image/png',
            dataUrl: media.url || body.dataUrl || '',
            mediaKey: media.key || ''
          };
          projects.push(entry);
          await writeProjects(env, projects);
          return jsonResponse({ success: true, project: entry }, 201);
        }

        if (request.method === 'DELETE' && projectId && projectId !== 'projects') {
          const projects = await readProjects(env);
          const filtered = [];

          for (const item of projects) {
            if (item.id === projectId) {
              if (item.mediaKey && env.MEDIA) {
                await env.MEDIA.delete(item.mediaKey);
              }
            } else {
              filtered.push(item);
            }
          }

          await writeProjects(env, filtered);
          return jsonResponse({ success: true, projects: filtered });
        }
      }

      if (url.pathname === '/api/visits') {
        if (request.method === 'GET') {
          const visits = await readVisits(env);
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const weekStart = new Date(todayStart);
          weekStart.setDate(weekStart.getDate() - 7);
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

          const stats = {
            total: visits.length,
            today: visits.filter((item) => new Date(item.timestamp) >= todayStart).length,
            week: visits.filter((item) => new Date(item.timestamp) >= weekStart).length,
            month: visits.filter((item) => new Date(item.timestamp) >= monthStart).length,
            uniqueVisitors: new Set(visits.map((item) => item.visitorId || item.ipHash || 'unknown')).size
          };
          return jsonResponse(stats);
        }

        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          const visits = await readVisits(env);
          const newVisit = {
            id: body.id || crypto.randomUUID(),
            timestamp: body.timestamp || new Date().toISOString(),
            visitorId: body.visitorId || body.sessionId || 'visitor_' + Date.now(),
            userAgent: body.userAgent || 'Unknown',
            referrer: body.referrer || 'Direct',
            ipHash: body.ipHash || 'local'
          };
          visits.push(newVisit);
          await writeVisits(env, visits);
          return jsonResponse({ success: true, visit: newVisit }, 201);
        }

        if (request.method === 'DELETE') {
          await writeVisits(env, []);
          return jsonResponse({ success: true });
        }
      }

      if (url.pathname === '/api/visits/history') {
        const visits = await readVisits(env);
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Number(url.searchParams.get('limit') || '20');
        const sorted = [...visits].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const start = (page - 1) * limit;
        const pageVisits = sorted.slice(start, start + limit);

        return jsonResponse({
          visits: pageVisits.map((item) => ({
            ...item,
            browser: getBrowserName(item.userAgent),
            timestampLabel: humanDate(item.timestamp)
          })),
          pagination: {
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(sorted.length / limit))
          }
        });
      }

      if (url.pathname === '/api/news') {
        const lang = (url.searchParams.get('lang') || 'en').toLowerCase();
        const response = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(lang === 'en' ? 'India breaking news' : 'भारत समाचार')}&hl=${lang === 'en' ? 'en-IN' : 'hi-IN'}&gl=IN&ceid=IN:${lang}`);
        const xml = await response.text();
        const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
        const items = matches.slice(0, 8).map((match) => {
          const block = match[1];
          const title = (block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || 'News';
          const desc = (block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || 'Latest news';
          const link = (block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || 'https://www.india.gov.in/';
          return {
            title: title.replace(/<[^>]+>/g, '').trim(),
            description: desc.replace(/<[^>]+>/g, '').trim(),
            source: 'Google News',
            publishedAt: new Date().toISOString(),
            category: 'General',
            link
          };
        });

        return jsonResponse({ items: items.length ? items : DEFAULT_NEWS, language: lang, source: 'cloudflare-worker' });
      }

      return jsonResponse({ ok: true, message: 'NexusForge Worker is running.' });
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Something went wrong in the Cloudflare worker.' }, 500);
    }
  }
};
