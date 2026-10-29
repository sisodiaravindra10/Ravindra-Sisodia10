#!/usr/bin/env python3
"""Tiny local uploader: drag images into the browser, they save into ./work/.
Run:  python3 upload-server.py   then open http://localhost:8777
No external deps; uses PUT so it works on any Python 3.x."""
import http.server, socketserver, os, re, json
from urllib.parse import urlparse, parse_qs

PORT = 8777
ROOT = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(ROOT, "work")
os.makedirs(WORK, exist_ok=True)

PAGE = """<!doctype html><html><head><meta charset="utf-8"><title>Upload to gallery</title>
<style>
 body{margin:0;font-family:-apple-system,Inter,sans-serif;background:#0a0812;color:#ECE7F8;
   display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:22px}
 h1{font-weight:600;letter-spacing:-.02em;font-size:24px;margin:0}
 .muted{color:#8a86a0;font-size:13px}
 #drop{width:min(620px,90vw);min-height:320px;border:2px dashed #B6A2F2;border-radius:14px;
   display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
   background:rgba(182,162,242,.06);cursor:pointer;transition:.2s;text-align:center;padding:30px}
 #drop.over{background:rgba(182,162,242,.18);border-color:#C9B8FF}
 .btn{background:#B6A2F2;color:#0a0812;border:none;padding:12px 22px;border-radius:8px;font-weight:600;cursor:pointer}
 #list{width:min(620px,90vw);font-size:13px;color:#cfc7e6;max-height:220px;overflow:auto}
 #list div{padding:5px 0;border-bottom:1px solid rgba(236,231,248,.1)}
 .ok{color:#8BC24A}
</style></head><body>
 <h1>Sneha&rsquo;s gallery &mdash; image uploader</h1>
 <div class="muted">Drag in all your project images (or click to choose). They save into <b>work/</b>.</div>
 <div id="drop">
   <div style="font-size:42px">&#127804;</div>
   <div><b>Drop images here</b></div>
   <div class="muted">or</div>
   <button class="btn" id="pick">Choose files</button>
   <input id="file" type="file" accept="image/*" multiple hidden>
 </div>
 <div id="list"></div>
<script>
 const drop=document.getElementById('drop'),inp=document.getElementById('file'),list=document.getElementById('list');
 document.getElementById('pick').onclick=e=>{e.stopPropagation();inp.click()};
 drop.onclick=()=>inp.click();
 ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));
 ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over')}));
 drop.addEventListener('drop',e=>send(e.dataTransfer.files));
 inp.addEventListener('change',()=>send(inp.files));
 async function send(files){
   for(const f of files){
     const row=document.createElement('div'); row.textContent='Uploading '+f.name+' ...'; list.prepend(row);
     try{ await fetch('/up?name='+encodeURIComponent(f.name),{method:'PUT',body:f});
          row.innerHTML='<span class="ok">&#10003;</span> saved <b>'+f.name+'</b>'; }
     catch(err){ row.textContent='Failed '+f.name; }
   }
 }
</script></body></html>"""

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path == "/" or self.path.startswith("/index"):
            self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers()
            self.wfile.write(PAGE.encode("utf-8"))
        else:
            self.send_response(404); self.end_headers()
    def do_PUT(self):
        q = parse_qs(urlparse(self.path).query)
        name = (q.get("name", ["file"])[0]) or "file"
        name = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(name))
        n = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(n)
        with open(os.path.join(WORK, name), "wb") as fh:
            fh.write(data)
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers()
        self.wfile.write(json.dumps({"saved": name, "bytes": len(data)}).encode())

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), H) as httpd:
    print(f"Uploader running. Open  http://localhost:{PORT}  and drop your images.")
    httpd.serve_forever()
