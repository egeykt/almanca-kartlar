// Posts the next card in hatalar.json to Instagram and advances durum.json.
// Env: IG_ACCESS_TOKEN (required), IG_USER_ID (default "me"), GRAPH_VERSION, DRY_RUN=1 to only print.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const REPO_RAW = 'https://raw.githubusercontent.com/egeykt/almanca-kartlar/main/instagram/kartlar/';
const HASHTAGS = '#ingilizce #ingilizceöğreniyorum #ingilizcekelimeler #ingilizcedersi #englishlearning #learnenglish #ingilizcegramer #yurtdışı #dilöğrenimi #turkce_dusunme';

const items = JSON.parse(readFileSync(dir + 'hatalar.json', 'utf8'));
const statePath = dir + 'durum.json';
const state = JSON.parse(readFileSync(statePath, 'utf8'));

if (state.sira >= items.length) {
  console.log(`Liste bitti (${items.length} kart paylaşıldı). hatalar.json'a yeni hata ekle.`);
  process.exit(0);
}
const x = items[state.sira];
const no = String(x.id).padStart(2, '0');

const caption = [
  `${x.baslik} 👇`,
  '',
  `❌ ${x.yanlis}`,
  `✅ ${x.dogru}`,
  '',
  `💡 ${x.neden}`,
  x.bonus ? `\n➕ ${x.bonus}` : '',
  '',
  'Sen de bu hatayı yapıyor muydun? Yorumlara yaz 👇',
  'Kaydet, sonra tekrar bak 🔖 Her gün yeni bir hata için @turkce_dusunme takip et.',
  '',
  HASHTAGS
].filter(l => l !== '').join('\n').replace(/\n(?=❌|💡|Sen de|#)/g, '\n\n');

const imageUrl = REPO_RAW + no + '.png';
console.log(`#${no} paylaşılıyor: ${imageUrl}\n\n${caption}\n`);

if (process.env.DRY_RUN) process.exit(0);

const token = process.env.IG_ACCESS_TOKEN;
if (!token) throw new Error('IG_ACCESS_TOKEN eksik. GitHub > Settings > Secrets bölümüne ekle.');
const user = process.env.IG_USER_ID || 'me';
const base = `https://graph.instagram.com/${process.env.GRAPH_VERSION || 'v23.0'}/${user}`;

async function call(path, params) {
  const res = await fetch(`${base}/${path}`, {
    method: 'POST',
    body: new URLSearchParams({ ...params, access_token: token })
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`${path}: ${JSON.stringify(body.error || body)}`);
  return body;
}

const container = await call('media', { image_url: imageUrl, caption });
// Instagram needs a moment to fetch the image before it can be published
let published;
for (let i = 0; i < 6 && !published; i++) {
  await new Promise(r => setTimeout(r, 5000));
  try { published = await call('media_publish', { creation_id: container.id }); }
  catch (e) { if (i === 5) throw e; }
}
console.log('Paylaşıldı, gönderi id:', published.id);

state.sira += 1;
state.son = { id: x.id, tarih: new Date().toISOString(), gonderi: published.id };
writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
