const C='kabelplan-v12';
const F=['./','index.html','lager.html','companion.html','exceljs.min.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(u=>new Request(u,{cache:'reload'})))));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
// Seiten (HTML): zuerst online holen (max. 4 s), damit Updates sofort da sind – offline aus dem Speicher.
// Alles andere: aus dem Speicher, sonst online.
function fallback(req){const p=new URL(req.url).pathname;return caches.match(req,{ignoreSearch:true}).then(r=>r||caches.match(p.endsWith('lager.html')?'lager.html':p.endsWith('companion.html')?'companion.html':'index.html'));}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  const isPage=req.mode==='navigate'||/\.html$|\/$/.test(new URL(req.url).pathname);
  if(isPage){
    e.respondWith(new Promise(resolve=>{let done=false;
      const t=setTimeout(()=>{if(!done){done=true;resolve(fallback(req));}},4000);
      fetch(req,{cache:'no-store'}).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(req,cp));}
        if(!done){done=true;clearTimeout(t);resolve(res.ok?res:fallback(req));}})
      .catch(()=>{if(!done){done=true;clearTimeout(t);resolve(fallback(req));}});}));
    return;}
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(req,cp));return res;})).catch(()=>fallback(req)));
});
