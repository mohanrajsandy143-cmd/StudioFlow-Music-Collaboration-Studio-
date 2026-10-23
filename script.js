
<style>
.feature-panel{margin-top:24px;padding:22px;border:1px solid var(--line);background:var(--panel);border-radius:16px}
.feature-panel h2{font:600 20px 'Space Grotesk',sans-serif}
.feature-panel p,.muted{color:var(--muted);line-height:1.6}
.feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
.feature-card{padding:17px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
.feature-card label{display:block;font-size:12px;color:var(--muted);margin:12px 0 7px}
.feature-card input,.feature-card select{width:100%;padding:11px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--text)}
.feature-btn{padding:10px 13px;border:0;border-radius:8px;background:var(--purple);color:#171321;font-weight:700;margin-top:12px}
.feature-table{width:100%;border-collapse:collapse;margin-top:15px}
.feature-table th,.feature-table td{text-align:left;padding:12px 8px;border-bottom:1px solid var(--line);font-size:12px}
.feature-table th{color:var(--muted)}
.wave-canvas{width:100%;height:90px;display:block;background:var(--bg);border-radius:10px;margin:15px 0}
.range-control{width:100%;accent-color:var(--purple)}
@media(max-width:650px){.feature-grid{grid-template-columns:1fr}.feature-panel{padding:15px;overflow-x:auto}}
</style>

<script>
/* StudioFlow feature add-on */
(function(){
  const $ = id => document.getElementById(id);
  const root = $("secondaryPage");
  if(!root) return;

  let contributors = [
    {name:"You",role:"Producer",share:40},
    {name:"Alex",role:"Composer",share:35},
    {name:"Jordan",role:"Songwriter",share:25}
  ];
  let versions = [];
  let mix = {volume:80,pan:0,bass:0,treble:0};
  let audioContext = null, sourceNode = null, gainNode = null, filterNode = null;
  let activeAudio = null;

  const featureHTML = {
    "Audio Tracks": `
      <div class="feature-panel">
        <h2>Audio Studio</h2>
        <p>Upload an audio file to view its waveform preview and play it.</p>
        <input id="studioAudioFile" type="file" accept="audio/*,.aiff,.aif">
        <canvas id="studioWave" class="wave-canvas"></canvas>
        <audio id="studioAudio" controls style="width:100%"></audio>
        <div class="feature-grid" style="margin-top:20px">
          <div class="feature-card"><label>Volume <span id="volValue">80%</span></label><input class="range-control" id="mixVolume" type="range" min="0" max="100" value="80"></div>
          <div class="feature-card"><label>Pan <span id="panValue">Center</span></label><input class="range-control" id="mixPan" type="range" min="-100" max="100" value="0"></div>
          <div class="feature-card"><label>Bass <span id="bassValue">0 dB</span></label><input class="range-control" id="mixBass" type="range" min="-12" max="12" value="0"></div>
          <div class="feature-card"><label>Treble <span id="trebleValue">0 dB</span></label><input class="range-control" id="mixTreble" type="range" min="-12" max="12" value="0"></div>
        </div>
        <p class="muted">Mixer controls apply to the audio loaded in this player. Browser support may vary for AIFF and other formats.</p>
      </div>`,
    "Collaborators": `
      <div class="feature-panel">
        <h2>Collaborators</h2>
        <p>Manage a local list of contributors for your music project.</p>
        <form id="collabForm" class="feature-grid">
          <div class="feature-card"><label>Name</label><input id="collabName" required placeholder="Contributor name"></div>
          <div class="feature-card"><label>Role</label><select id="collabRole"><option>Producer</option><option>Composer</option><option>Songwriter</option><option>Vocalist</option><option>Mix Engineer</option></select></div>
          <div><button class="feature-btn">＋ Add collaborator</button></div>
        </form>
        <table class="feature-table"><thead><tr><th>Name</th><th>Role</th><th>Action</th></tr></thead><tbody id="collabRows"></tbody></table>
      </div>`,
    "Version History": `
      <div class="feature-panel">
        <h2>Version History</h2>
        <p>Create local checkpoints to track project progress. These save project metadata, not audio backups.</p>
        <div class="feature-grid">
          <div class="feature-card"><label>Version description</label><input id="versionName" placeholder="e.g. Vocal mix v2"></div>
          <div class="feature-card"><label>Project</label><select id="versionProject"></select></div>
        </div>
        <button id="saveVersion" class="feature-btn">＋ Save checkpoint</button>
        <table class="feature-table"><thead><tr><th>Version</th><th>Project</th><th>Created</th></tr></thead><tbody id="versionRows"></tbody></table>
      </div>`,
    "Royalty Splits": `
      <div class="feature-panel">
        <h2>Royalty Split Calculator</h2>
        <p>Add contributors and allocate a percentage of the royalty pool. Total must equal 100% to validate.</p>
        <form id="royaltyForm" class="feature-grid">
          <div class="feature-card"><label>Contributor name</label><input id="royaltyName" required placeholder="Contributor name"></div>
          <div class="feature-card"><label>Share percentage</label><input id="royaltyShare" required type="number" min="0" max="100" step="0.1" placeholder="e.g. 20"></div>
          <div><button class="feature-btn">＋ Add split</button></div>
        </form>
        <table class="feature-table"><thead><tr><th>Contributor</th><th>Role</th><th>Share</th><th>Action</th></tr></thead><tbody id="royaltyRows"></tbody></table>
        <div class="feature-card" style="margin-top:15px"><div class="muted">Total allocated</div><h2 id="royaltyTotal">100%</h2><div id="royaltyStatus">Check your allocations.</div></div>
      </div>`,
    "Mixer": `
      <div class="feature-panel">
        <h2>Mixing Console</h2>
        <p>Load a track in Audio Tracks to use its volume, pan, bass and treble controls.</p>
        <button id="openAudio" class="feature-btn">Open Audio Studio</button>
      </div>`,
    "Marketplace": `
      <div class="feature-panel">
        <h2>Beat Marketplace</h2>
        <p>This is a starter listing area. Purchases, licensing and creator payouts are not connected.</p>
        <div class="feature-grid">
          <div class="feature-card"><h3>Beat listing</h3><p>Upload your beat through your local audio workspace.</p></div>
          <div class="feature-card"><h3>Licensing</h3><p>Checkout and license delivery require a backend and payment provider.</p></div>
        </div>
      </div>`
  };

  function esc(s){
    return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function message(s){
    const t=$("toast");
    if(t){t.textContent=s;t.style.display="block";setTimeout(()=>t.style.display="none",2500);}
  }
  function drawWave(buffer){
    const canvas=$("studioWave");
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const ratio=window.devicePixelRatio||1;
    canvas.width=canvas.clientWidth*ratio;
    canvas.height=canvas.clientHeight*ratio;
    ctx.scale(ratio,ratio);
    const w=canvas.clientWidth,h=canvas.clientHeight;
    ctx.clearRect(0,0,w,h);
    const data=buffer.getChannelData(0);
    const step=Math.max(1,Math.floor(data.length/w));
    for(let x=0;x<w;x++){
      let max=0;
      for(let j=0;j<step;j++)max=Math.max(max,Math.abs(data[x*step+j]||0));
      const bar=Math.max(2,max*(h*.85));
      ctx.fillStyle="#9b87ff";
      ctx.fillRect(x,h/2-bar/2,1.5,bar);
    }
  }
  async function decodeWave(file){
    const canvas=$("studioWave");
    if(!canvas)return;
    const ctx=canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#9b87ff";
    for(let x=0;x<canvas.clientWidth;x+=5){
      const bar=5+Math.abs(Math.sin(x*.09)*Math.cos(x*.03))*30;
      ctx.fillRect(x,canvas.clientHeight/2-bar/2,3,bar);
    }
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      const temporary=new AC();
      const buffer=await temporary.decodeAudioData(await file.arrayBuffer());
      drawWave(buffer);
      await temporary.close();
    }catch(e){
      message("Audio loaded. A decoded waveform isn't available for this file; player may still work.");
    }
  }
  function setupAudio(){
    const fileInput=$("studioAudioFile"),audio=$("studioAudio");
    if(!fileInput||!audio)return;
    fileInput.addEventListener("change",async()=>{
      const file=fileInput.files&&fileInput.files[0];
      if(!file)return;
      if(activeAudio)URL.revokeObjectURL(activeAudio);
      activeAudio=URL.createObjectURL(file);
      audio.src=activeAudio;
      audio.load();
      decodeWave(file);
      setupMixer(audio);
      message("Audio loaded into the studio.");
    });
    $("mixVolume").addEventListener("input",e=>{
      mix.volume=+e.target.value;
      $("volValue").textContent=mix.volume+"%";
      if(gainNode)gainNode.gain.value=mix.volume/100;
    });
    $("mixPan").addEventListener("input",e=>{
      mix.pan=+e.target.value;
      $("panValue").textContent=mix.pan===0?"Center":mix.pan<0?"Left "+Math.abs(mix.pan)+"%":"Right "+mix.pan+"%";
      if(sourceNode&&sourceNode.pan)sourceNode.pan.value=mix.pan/100;
    });
    $("mixBass").addEventListener("input",e=>{
      mix.bass=+e.target.value;$("bassValue").textContent=mix.bass+" dB";
      if(filterNode)filterNode.lowShelf.gain.value=mix.bass;
    });
    $("mixTreble").addEventListener("input",e=>{
      mix.treble=+e.target.value;$("trebleValue").textContent=mix.treble+" dB";
      if(filterNode)filterNode.highShelf.gain.value=mix.treble;
    });
  }
  function setupMixer(audio){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      if(!audioContext)audioContext=new AC();
      if(sourceNode){try{sourceNode.disconnect()}catch(e){}}
      sourceNode=audioContext.createMediaElementSource(audio);
      gainNode=audioContext.createGain();
      const panNode=audioContext.createStereoPanner();
      panNode.pan.value=mix.pan/100;
      filterNode={
        lowShelf:audioContext.createBiquadFilter(),
        highShelf:audioContext.createBiquadFilter()
      };
      filterNode.lowShelf.type="lowshelf";filterNode.lowShelf.frequency.value=250;filterNode.lowShelf.gain.value=mix.bass;
      filterNode.highShelf.type="highshelf";filterNode.highShelf.frequency.value=4000;filterNode.highShelf.gain.value=mix.treble;
      gainNode.gain.value=mix.volume/100;
      sourceNode.connect(filterNode.lowShelf);
      filterNode.lowShelf.connect(filterNode.highShelf);
      filterNode.highShelf.connect(panNode);
      panNode.connect(gainNode);gainNode.connect(audioContext.destination);
      audio.addEventListener("play",()=>audioContext.resume());
    }catch(e){message("Mixer controls may not be available in this browser.");}
  }
  function renderCollaborators(){
    const rows=$("collabRows");if(!rows)return;
    rows.innerHTML=contributors.map((c,i)=>`<tr><td>${esc(c.name)}</td><td>${esc(c.role)}</td><td><button class="feature-btn" data-collab-remove="${i}">Remove</button></td></tr>`).join("");
  }
  function renderRoyalty(){
    const rows=$("royaltyRows");if(!rows)return;
    rows.innerHTML=contributors.map((c,i)=>`<tr><td>${esc(c.name)}</td><td>${esc(c.role)}</td><td>${Number(c.share).toFixed(1)}%</td><td><button class="feature-btn" data-royalty-remove="${i}">Remove</button></td></tr>`).join("");
    const total=contributors.reduce((sum,c)=>sum+Number(c.share||0),0);
    $("royaltyTotal").textContent=total.toFixed(1)+"%";
    $("royaltyStatus").textContent=Math.abs(total-100)<0.01?"Valid: allocation equals 100%.":"Allocation must equal 100% before it is valid.";
    $("royaltyStatus").style.color=Math.abs(total-100)<0.01?"#72e2b2":"#ffae81";
  }
  function renderVersions(){
    const sel=$("versionProject"),rows=$("versionRows");if(!sel||!rows)return;
    const list=Array.isArray(window.projects)?window.projects:[];
    sel.innerHTML=list.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
    rows.innerHTML=versions.length?versions.map(v=>`<tr><td>${esc(v.name)}</td><td>${esc(v.project)}</td><td>${esc(v.date)}</td></tr>`).join(""):'<tr><td colspan="3">No checkpoints yet.</td></tr>';
  }
  function renderFeature(page){
    const old=$("featureContent");if(old)old.remove();
    const html=featureHTML[page];if(!html)return;
    const host=document.createElement("div");
    host.id="featureContent";host.innerHTML=html;
    root.appendChild(host);
    if(page==="Audio Tracks")setupAudio();
    if(page==="Collaborators"){
      renderCollaborators();
      $("collabForm").addEventListener("submit",e=>{
        e.preventDefault();
        contributors.push({name:$("collabName").value.trim(),role:$("collabRole").value,share:0});
        $("collabName").value="";renderCollaborators();message("Collaborator added to this session.");
      });
      $("collabRows").addEventListener("click",e=>{
        const b=e.target.closest("[data-collab-remove]");if(!b)return;
        contributors.splice(+b.dataset.collabRemove,1);renderCollaborators();
      });
    }
    if(page==="Royalty Splits"){
      renderRoyalty();
      $("royaltyForm").addEventListener("submit",e=>{
        e.preventDefault();
        const name=$("royaltyName").value.trim(),share=Number($("royaltyShare").value);
        if(!name||share<0||share>100){message("Enter a name and a share from 0 to 100.");return;}
        contributors.push({name,role:"Contributor",share});
        $("royaltyName").value="";$("royaltyShare").value="";renderRoyalty();
      });
      $("royaltyRows").addEventListener("click",e=>{
        const b=e.target.closest("[data-royalty-remove]");if(!b)return;
        contributors.splice(+b.dataset.royaltyRemove,1);renderRoyalty();
      });
    }
    if(page==="Version History"){
      renderVersions();
      $("saveVersion").addEventListener("click",()=>{
        const list=Array.isArray(window.projects)?window.projects:[];
        const p=list.find(x=>String(x.id)===$("versionProject").value);
        if(!p){message("Create a project first.");return;}
        versions.unshift({name:$("versionName").value.trim()||"Checkpoint "+(versions.length+1),project:p.name,date:new Date().toLocaleString()});
        $("versionName").value="";renderVersions();message("Checkpoint saved for this session.");
      });
    }
    if(page==="Mixer")$("openAudio").onclick=()=>window.showPage("Audio Tracks");
  }
  const originalShowPage=window.showPage;
  if(typeof originalShowPage==="function"){
    window.showPage=function(page){
      originalShowPage(page);
      renderFeature(page);
    };
  }
  document.querySelectorAll(".nav[data-page]").forEach(button=>{
    button.addEventListener("click",()=>renderFeature(button.dataset.page));
  });
  // Add a mixer navigation entry to the existing sidebar.
  const nav=document.querySelector(".sidebar .sidebar-bottom");
  if(nav&&!document.querySelector('[data-page="Mixer"]')){
    const button=document.createElement("button");
    button.className="nav";button.dataset.page="Mixer";
    button.innerHTML='<span class="ico">♫</span> Mixing Console';
    button.addEventListener("click",()=>window.showPage("Mixer"));
    nav.insertBefore(button,nav.firstChild);
  }
  // Restore the selected feature if the current page is one of its sections.
  const crumb=$("crumb");
  if(crumb&&featureHTML[crumb.textContent])renderFeature(crumb.textContent);
})();
</script>
</body>
</html>

