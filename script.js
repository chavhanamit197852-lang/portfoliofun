const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const video = $("#backgroundVideo");
video?.addEventListener("error", () => {
  document.body.classList.add("video-missing");
});

const nav = $(".nav");
const toggle = $(".nav-toggle");
toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
$$(".nav-link").forEach(link => link.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle?.setAttribute("aria-expanded", "false");
}));

// Elegant cursor magic: soft aura + trailing sparks, with no cursor replacement on touch screens.
const canvas = $("#magicCanvas");
const ctx = canvas.getContext("2d", {alpha:true});
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let particles = [];
let mouse = {x: innerWidth/2, y: innerHeight/2, tx: innerWidth/2, ty: innerHeight/2};

function resizeCanvas(){
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
resizeCanvas();
addEventListener("resize", resizeCanvas);

function spawnParticle(x,y,energy=1){
  particles.push({
    x, y,
    vx:(Math.random()-.5)*1.2,
    vy:(Math.random()-.5)*1.2 - .25,
    life:35+Math.random()*28,
    max:63,
    size:.7+Math.random()*1.6,
    rot:Math.random()*Math.PI,
    spin:(Math.random()-.5)*.08,
    glyph:Math.random()>.72 ? (Math.random()>.5?"✦":"·") : null,
    energy
  });
}
addEventListener("pointermove",(e)=>{
  mouse.tx=e.clientX; mouse.ty=e.clientY;
  const speed=Math.hypot(e.movementX||0,e.movementY||0);
  if(speed>0.6) spawnParticle(e.clientX,e.clientY, Math.min(1.4, .5+speed/5));
});
addEventListener("pointerdown",(e)=>{
  for(let i=0;i<9;i++) spawnParticle(e.clientX,e.clientY,1.6);
});

function drawMagic(){
  mouse.x += (mouse.tx-mouse.x)*.22;
  mouse.y += (mouse.ty-mouse.y)*.22;
  const aura=$("#cursorAura");
  if(aura){ aura.style.left=mouse.x+"px"; aura.style.top=mouse.y+"px"; }

  ctx.clearRect(0,0,innerWidth,innerHeight);
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.life--; p.rot+=p.spin;
    const alpha=Math.max(0,p.life/p.max)*.85;
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle=`rgba(227,197,126,${alpha})`;
    ctx.shadowColor=`rgba(227,197,126,${alpha*.7})`;
    ctx.shadowBlur=7;
    if(p.glyph){
      ctx.font=`${8+p.size*2}px serif`;
      ctx.fillText(p.glyph,0,0);
    }else{
      ctx.beginPath(); ctx.arc(0,0,p.size,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    if(p.life<=0) particles.splice(i,1);
  }
  requestAnimationFrame(drawMagic);
}
drawMagic();

// 3D mouse parallax for the whole scene, kept subtle so text remains readable.
const depthLayers = $$(".depth-layer");
addEventListener("pointermove",(e)=>{
  const nx = (e.clientX/innerWidth - .5);
  const ny = (e.clientY/innerHeight - .5);
  depthLayers.forEach(el=>{
    const d = Number(el.dataset.depth||1);
    el.style.transform = `translate3d(${nx*d*18}px,${ny*d*12}px,0)`;
  });
});

// Tilt only for larger pointer devices.
const canHover = matchMedia("(hover:hover) and (pointer:fine)").matches;
if(canHover){
  $$(".depth-card").forEach(card=>{
    card.addEventListener("pointermove",(e)=>{
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`perspective(900px) rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg) translateZ(6px)`;
    });
    card.addEventListener("pointerleave",()=>{ card.style.transform=""; });
  });
}

// Scroll reveal + active chapter.
const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting) entry.target.classList.add("visible");
  });
},{threshold:.14});
$$(".reveal").forEach(el=>observer.observe(el));

const sections = $$("main section[id]");
const links = $$(".nav-link");
const sectionObserver = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      links.forEach(l=>l.classList.toggle("active", l.getAttribute("href")===`#${entry.target.id}`));
      const depth = String(String(sections.indexOf ? sections.indexOf(entry.target) : 0).padStart(2,"0"));
      const scene = $("#sceneDepth");
      if(scene) scene.textContent = `DEPTH ${String([...sections].indexOf(entry.target)+1).padStart(2,"0")}`;
    }
  });
},{rootMargin:"-35% 0px -50% 0px"});
sections.forEach(s=>sectionObserver.observe(s));

// Time-like progress indicator, only cosmetic.
let start = performance.now();
function clockLoop(t){
  const elapsed=Math.floor((t-start)/1000);
  const mm=String(Math.floor(elapsed/60)).padStart(2,"0");
  const ss=String(elapsed%60).padStart(2,"0");
  const scene=$("#sceneDepth");
  // Keep the depth label intact; this is intentionally only a subtle page-time signal via document title.
  document.title = `Amit Chavhan | ${mm}:${ss}`;
  requestAnimationFrame(clockLoop);
}
requestAnimationFrame(clockLoop);
