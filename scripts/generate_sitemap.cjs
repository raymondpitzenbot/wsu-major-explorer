const fs = require('fs');
const path = require('path');

const WSU_DATA_PATH = path.join(__dirname, '../data/wsuData.ts');
const SITEMAP_PATH = path.join(__dirname, '../public/sitemap.xml');
const BASE_URL = 'https://wsu-major-explorer.vercel.app';

function extractProgramsFromTs() {
    try {
        const content = fs.readFileSync(WSU_DATA_PATH, 'utf8');
        const programs = [];
        // Regex to find objects with program_id
        // Matches: program_id: 'foo'
        const parts = content.split('program_id:');
        for (let i = 1; i < parts.length; i++) {
            const chunk = parts[i];
            const idMatch = chunk.match(/^\s*['"]([^'"]+)['"]/);
            if (!idMatch) continue;
            programs.push(idMatch[1]);
        }
        // Deduplicate
        return [...new Set(programs)];
    } catch (e) {
        console.error("Failed to read wsuData.ts:", e);
        return [];
    }
}

function generateSitemap() {
    console.log("Generating sitemap...");
    const programs = extractProgramsFromTs();
    console.log(`Found ${programs.length} programs.`);

    const date = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/explore</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/compare</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/advisor</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
`;

    programs.forEach(id => {
        xml += `  <url>
    <loc>${BASE_URL}/program/${id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    xml += `</urlset>`;

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`Sitemap written to ${SITEMAP_PATH}`);
}

generateSitemap();
