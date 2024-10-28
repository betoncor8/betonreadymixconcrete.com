const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { execSync } = require('child_process');
const axios = require('axios');

const contentDir = path.join(__dirname, 'content');
const now = new Date();

// Daftar layanan ping
const pingServices = [
  'http://ping.googleapis.com/ping?sitemap=',
  'http://www.bing.com/ping?sitemap=',
  'http://rpc.pingomatic.com/',
  'http://www.sitemaps.org/ping?sitemap=',
  'http://www.feedburner.com/fb/a/pingSubmit?bloglink=',
  'https://indexnow.org/ping?sitemap=',
];

// Fungsi untuk melakukan ping
async function pingSearchEngines(sitemapUrl) {
  for (const service of pingServices) {
    try {
      await axios.get(`${service}${sitemapUrl}`);
      console.log(`Berhasil melakukan ping ke ${service}`);
    } catch (error) {
      console.error(`Gagal melakukan ping ke ${service}:`, error.message);
    }
  }
}

// Fungsi untuk memeriksa dan memperbarui artikel
function recyclePost(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  
  const postDate = new Date(data.date);
  const monthsDiff = (now.getFullYear() - postDate.getFullYear()) * 12 + now.getMonth() - postDate.getMonth();
  
  if (monthsDiff >= 12) {
    data.date = now.toISOString().split('T')[0];
    const updatedContent = matter.stringify(content, data);
    fs.writeFileSync(filePath, updatedContent);
    return true;
  }
  
  return false;
}

// Fungsi rekursif untuk memeriksa artikel di dalam subfolder
function updatePostsInDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      updatePostsInDir(filePath); // Rekursif untuk subfolder
    } else if (file.endsWith('.md')) {
      if (recyclePost(filePath)) {
        updatedCount++;
      }
    }
  });
}

// Memeriksa semua artikel di folder content dan subfoldernya
let updatedCount = 0;
updatePostsInDir(contentDir);

if (updatedCount > 0) {
  console.log(`${updatedCount} artikel telah diperbarui.`);
  // Rebuild situs Hugo
  execSync('hugo', { stdio: 'inherit' });
  
  // Lakukan ping ke mesin pencari
  const sitemapUrl = 'https://betonreadymixconcrete.com/sitemap.xml';
  pingSearchEngines(sitemapUrl);
} else {
  console.log('Tidak ada artikel yang perlu diperbarui.');
}
