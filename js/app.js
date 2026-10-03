/* ============================= HELPERS ============================= */


/* cover intro animation after assets/page are ready */
window.addEventListener('load', function(){
  injectSectionFoliage();
  var cover = document.getElementById('cover');
  if(!cover) return;
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      cover.classList.add('intro-ready');
    });
  });
});

/* guest name from ?to= */
(function(){

  var params = new URLSearchParams(window.location.search);
  var to = params.get('to');

  if(to){

    // "_" pada URL diubah menjadi spasi
    var guest = decodeURIComponent(to)
      .replace(/_/g, ' ')
      .trim();

    document.getElementById('guestName').textContent = guest;

    var rsvpName = document.getElementById('rsvpName');
    var giftSender = document.getElementById('giftSender');

    if(rsvpName) rsvpName.value = guest;
    if(giftSender) giftSender.value = guest;

  }

})();


/* ============================= BACKGROUND MUSIC ============================= */
var bgMusic = document.getElementById('bgMusic');
var musicToggle = document.getElementById('musicToggle');
var musicHasStarted = false;

function syncMusicToggle(){
  if(!bgMusic || !musicToggle) return;

  var isOff = bgMusic.paused || bgMusic.muted;
  musicToggle.classList.toggle('muted', isOff);
  musicToggle.classList.toggle('playing', !isOff);

  var label = musicToggle.querySelector('.music-label');
  if(label){
    label.textContent = isOff ? 'Musik Off' : 'Musik On';
  }

  var accessibleLabel = isOff ? 'Nyalakan musik' : 'Matikan musik';
  musicToggle.setAttribute('aria-label', accessibleLabel);
  musicToggle.setAttribute('title', accessibleLabel);
  musicToggle.setAttribute('aria-pressed', isOff ? 'false' : 'true');
}

async function startBackgroundMusic(){
  if(!bgMusic) return false;

  try{
    bgMusic.volume = 0.35;
    bgMusic.muted = false;
    await bgMusic.play();
    musicHasStarted = true;
    syncMusicToggle();
    return true;
  }catch(err){
    console.warn('Musik belum dapat diputar:', err);
    syncMusicToggle();
    return false;
  }
}

if(bgMusic && musicToggle){
  bgMusic.addEventListener('play', syncMusicToggle);
  bgMusic.addEventListener('pause', syncMusicToggle);
  bgMusic.addEventListener('volumechange', syncMusicToggle);
  bgMusic.addEventListener('ended', syncMusicToggle);
  bgMusic.addEventListener('error', function(){
    console.warn('File musik tidak dapat dimuat. Pastikan audio/wedding-theme.mp3 tersedia.');
    musicToggle.classList.add('music-error');
    musicToggle.setAttribute('title', 'File musik tidak ditemukan');
  });

  syncMusicToggle();

  musicToggle.addEventListener('click', async function(event){
    event.stopPropagation();

    if(bgMusic.paused){
      await startBackgroundMusic();
      return;
    }

    bgMusic.muted = !bgMusic.muted;
    syncMusicToggle();
  });
}

/* cover open: floral gate transition, then the invitation opens */
document.getElementById('btnOpen').addEventListener('click', function(){
  var cover = document.getElementById('cover');
  if(cover.classList.contains('opening')) return;

  startBackgroundMusic();
  cover.classList.add('opening');

  window.setTimeout(function(){
    cover.classList.add('closed');
    document.body.classList.remove('locked');
    document.getElementById('greeting').scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
  }, 1000);
});

function goTo(id){ document.getElementById(id).scrollIntoView({behavior:'smooth'}); }

/* reveal on scroll */
var revealEls = document.querySelectorAll('.reveal, .reveal-scale');
var io = new IntersectionObserver(function(entries){
  entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); } });
}, {threshold:.18});
revealEls.forEach(function(el){ io.observe(el); });

/* nav dots */
var sections = ['greeting','ayat','couple','events','timeline','gallery','rsvp','gift','wishes','closing'];
var navdots = document.getElementById('navdots');
sections.forEach(function(id){
  var b = document.createElement('button');
  b.setAttribute('aria-label', id);
  b.addEventListener('click', function(){ goTo(id); });
  navdots.appendChild(b);
});
var dotBtns = navdots.querySelectorAll('button');
var secObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if(e.isIntersecting){
      var idx = sections.indexOf(e.target.id);
      dotBtns.forEach(function(d,i){ d.classList.toggle('active', i===idx); });
    }
  });
}, {threshold:.5});
sections.forEach(function(id){ secObserver.observe(document.getElementById(id)); });

/* prewedding slider — autoplay, dots, click navigation, and touch swipe */
var prewedTimer = null;
var prewedIndex = 0;
var prewedTouchStartX = null;

function getPrewedSlides(){
  return Array.prototype.slice.call(document.querySelectorAll('#prewedSlider .prewed-slide'));
}

function renderPrewedDots(){
  var dots = document.getElementById('prewedDots');
  var slides = getPrewedSlides();
  if(!dots) return;
  dots.innerHTML = '';

  slides.forEach(function(_, i){
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'prewed-dot' + (i === prewedIndex ? ' active' : '');
    dot.setAttribute('aria-label', 'Tampilkan foto ' + (i + 1));
    dot.addEventListener('click', function(){
      showPrewedSlide(i, true);
    });
    dots.appendChild(dot);
  });

  dots.style.display = slides.length > 1 ? 'flex' : 'none';
}

function showPrewedSlide(index, restart){
  var slides = getPrewedSlides();
  if(!slides.length) return;

  prewedIndex = (index + slides.length) % slides.length;
  slides.forEach(function(slide, i){
    slide.classList.toggle('active', i === prewedIndex);
  });

  var dots = document.querySelectorAll('#prewedDots .prewed-dot');
  dots.forEach(function(dot, i){
    dot.classList.toggle('active', i === prewedIndex);
  });

  if(restart) restartPrewedAutoplay();
}

function nextPrewedSlide(){ showPrewedSlide(prewedIndex + 1, false); }
function prevPrewedSlide(){ showPrewedSlide(prewedIndex - 1, false); }

function restartPrewedAutoplay(){
  clearInterval(prewedTimer);
  if(getPrewedSlides().length > 1){
    prewedTimer = setInterval(nextPrewedSlide, 5000);
  }
}

function initPrewedSlider(){
  var slides = getPrewedSlides();
  var stage = document.getElementById('prewedStage');
  if(!slides.length || !stage) return;

  prewedIndex = 0;
  slides.forEach(function(slide, i){ slide.classList.toggle('active', i === 0); });
  renderPrewedDots();
  restartPrewedAutoplay();

  stage.addEventListener('mouseenter', function(){ clearInterval(prewedTimer); });
  stage.addEventListener('mouseleave', restartPrewedAutoplay);

  stage.addEventListener('touchstart', function(e){
    prewedTouchStartX = e.touches[0].clientX;
  }, {passive:true});

  stage.addEventListener('touchend', function(e){
    if(prewedTouchStartX === null) return;
    var endX = e.changedTouches[0].clientX;
    var delta = endX - prewedTouchStartX;
    prewedTouchStartX = null;

    if(Math.abs(delta) < 45) return;
    if(delta < 0) nextPrewedSlide();
    else prevPrewedSlide();
    restartPrewedAutoplay();
  }, {passive:true});

  document.addEventListener('visibilitychange', function(){
    if(document.hidden) clearInterval(prewedTimer);
    else restartPrewedAutoplay();
  });
}

window.addEventListener('load', function(){
  /* Allow failed image elements to remove their slide before counting dots. */
  setTimeout(initPrewedSlider, 80);
});




/* Add animated corner ornaments to each content section */
function injectSectionFoliage(){
  var corners = [
    ['tl', 'images/foliage-top-left.png'],
    ['tr', 'images/foliage-top-right.png'],
    ['bl', 'images/foliage-bottom-left.png'],
    ['br', 'images/foliage-bottom-right.png']
  ];

  document.querySelectorAll('section.section').forEach(function(section){
    if(section.querySelector('.section-foliage')) return;
    corners.forEach(function(pair){
      var img = document.createElement('img');
      img.className = 'section-foliage ' + pair[0];
      img.src = pair[1];
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      section.appendChild(img);
    });
  });
}

/* countdown */
var target = new Date('2026-11-17T10:00:00+07:00').getTime();
function tickCountdown(){
  var now = Date.now();
  var diff = Math.max(0, target - now);
  var d = Math.floor(diff/86400000);
  var h = Math.floor(diff%86400000/3600000);
  var m = Math.floor(diff%3600000/60000);
  var s = Math.floor(diff%60000/1000);
  document.getElementById('cd-d').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-h').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-m').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-s').textContent = String(s).padStart(2,'0');
}
tickCountdown(); setInterval(tickCountdown, 1000);

/* gallery — masonry layout, .jpg/.jpeg fallback, missing images are hidden */
var galleryGrid = document.getElementById('galleryGrid');
var galleryEmpty = document.getElementById('galleryEmpty');
var galleryPending = 8;
var galleryLoaded = 0;

function finishGalleryAttempt(){
  galleryPending--;
  if(galleryPending <= 0 && galleryLoaded === 0 && galleryEmpty){
    galleryEmpty.classList.add('show');
  }
}

function loadGalleryItem(index){
  var item = document.createElement('div');
  item.className = 'g-item';
  var img = document.createElement('img');
  img.alt = 'Foto galeri ' + index;
  img.loading = 'lazy';
  img.dataset.extTried = 'jpg';

  img.addEventListener('load', function(){
    galleryLoaded++;
    item.classList.add('ready');
    finishGalleryAttempt();
  }, {once:true});

  img.addEventListener('error', function onGalleryError(){
    if(img.dataset.extTried === 'jpg'){
      img.dataset.extTried = 'jpeg';
      img.src = 'images/galeri-' + index + '.jpeg';
      return;
    }
    item.remove();
    finishGalleryAttempt();
  });

  item.addEventListener('click', function(){
    if(img.complete && img.naturalWidth){ openLightbox(img.src); }
  });

  item.appendChild(img);
  galleryGrid.appendChild(item);
  img.src = 'images/galeri-' + index + '.jpg';
}

if(galleryGrid){
  for(var i=1;i<=11;i++) loadGalleryItem(i);
}

function openLightbox(src){
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox(e){
  if(e.target.id==='lightbox' || e.target.tagName==='BUTTON'){
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }
}

var GIFT_WHATSAPP = '6281212903846';

function confirmGiftViaWhatsApp(){
  var senderEl = document.getElementById('giftSender');
  var recipientEl = document.getElementById('giftRecipient');
  var noteEl = document.getElementById('giftNote');

  var sender = senderEl ? senderEl.value.trim() : '';
  var recipient = recipientEl ? recipientEl.value : '';
  var note = noteEl ? noteEl.value.trim() : '';

  if(!sender){
    alert('Silakan isi nama pengirim terlebih dahulu.');

    if(senderEl){
      senderEl.focus();
    }

    return;
  }

  var message =
    "Assalamu'alaikum, saya " + sender +
    ". Saya ingin mengonfirmasi bahwa saya sudah mengirim hadiah pernikahan untuk " +
    recipient + "." +
    (note ? "\n\nCatatan: " + note : "") +
    "\n\nSaya dapat melampirkan bukti transfer di chat ini jika diperlukan. Terima kasih.";

  var url =
    'https://wa.me/' +
    GIFT_WHATSAPP +
    '?text=' +
    encodeURIComponent(message);

  window.location.href = url;
}

/* ============================= RSVP + WISHES API ============================= */
var rsvpData = [];
var wishData = [];

async function apiJson(url, options){
  var response = await fetch(url, options || {});
  var payload = {};
  try{
    payload = await response.json();
  }catch(err){
    payload = {};
  }

  if(!response.ok){
    throw new Error(payload.message || 'Permintaan tidak dapat diproses.');
  }

  return payload;
}

function setFormFeedback(id, message, type){
  var el = document.getElementById(id);
  if(!el) return;
  el.textContent = message || '';
  el.classList.remove('success','error');
  if(type) el.classList.add(type);
}

function setSubmitState(form, isLoading, loadingText){
  if(!form) return;
  var button = form.querySelector('button[type="submit"]');
  if(!button) return;

  if(isLoading){
    if(!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText || 'Menyimpan...';
  }else{
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}

/* RSVP */
async function loadRsvp(){
  try{
    var payload = await apiJson('/api/rsvp');
    rsvpData = Array.isArray(payload.data) ? payload.data : [];
    renderRsvp();
  }catch(err){
    console.warn('RSVP belum dapat dimuat:', err);
    setFormFeedback('rsvpFeedback', 'Daftar kehadiran belum dapat dimuat.', 'error');
  }
}

async function submitRsvp(e){
  e.preventDefault();

  var form = e.currentTarget;
  var name = document.getElementById('rsvpName').value.trim();
  var status = document.getElementById('rsvpStatus').value;
  var count = Number(document.getElementById('rsvpCount').value || 1);
  var msg = document.getElementById('rsvpMsg').value.trim();

  if(!name) return;

  setFormFeedback('rsvpFeedback', '', '');
  setSubmitState(form, true, 'Menyimpan...');

  try{
    await apiJson('/api/rsvp', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name:name,
        status:status,
        count:count,
        msg:msg
      })
    });

    form.reset();
    document.getElementById('rsvpCount').value = 1;
    setFormFeedback('rsvpFeedback', 'Konfirmasi kehadiran berhasil disimpan.', 'success');
    await loadRsvp();
  }catch(err){
    console.error(err);
    setFormFeedback('rsvpFeedback', err.message || 'Konfirmasi belum dapat disimpan.', 'error');
  }finally{
    setSubmitState(form, false);
  }
}

function renderRsvp(){
  var list = document.getElementById('rsvpList');
  if(!list) return;

  list.innerHTML = '';

  if(!rsvpData.length){
    var empty = document.createElement('p');
    empty.className = 'rsvp-empty';
    empty.textContent = 'Belum ada konfirmasi kehadiran.';
    list.appendChild(empty);
    return;
  }

  rsvpData.forEach(function(r){
    var div = document.createElement('div');
    div.className = 'rsvp-entry';

    var count = Number(r.count || 1);
    var message = r.msg ? '<br>&ldquo;'+escapeHtml(r.msg)+'&rdquo;' : '';

    div.innerHTML =
      '<span class="status">'+escapeHtml(r.status || '')+'</span>'+
      '<b>'+escapeHtml(r.name || '')+'</b>'+
      '<br>Jumlah tamu: '+count+
      message;

    list.appendChild(div);
  });
}

/* Wishes */
async function loadWishes(){
  try{
    var payload = await apiJson('/api/wishes');
    wishData = Array.isArray(payload.data) ? payload.data : [];
    renderWish();
  }catch(err){
    console.warn('Ucapan belum dapat dimuat:', err);
    setFormFeedback('wishFeedback', 'Ucapan belum dapat dimuat.', 'error');
  }
}

async function submitWish(e){
  e.preventDefault();

  var form = e.currentTarget;
  var name = document.getElementById('wishName').value.trim();
  var text = document.getElementById('wishText').value.trim();

  if(!name || !text) return;

  setFormFeedback('wishFeedback', '', '');
  setSubmitState(form, true, 'Mengirim...');

  try{
    await apiJson('/api/wishes', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        name:name,
        text:text
      })
    });

    form.reset();
    setFormFeedback('wishFeedback', 'Doa dan ucapan berhasil dikirim.', 'success');
    await loadWishes();
  }catch(err){
    console.error(err);
    setFormFeedback('wishFeedback', err.message || 'Ucapan belum dapat dikirim.', 'error');
  }finally{
    setSubmitState(form, false);
  }
}

function renderWish(){
  var list = document.getElementById('wishList');
  var empty = document.getElementById('wishEmpty');

  if(!list) return;

  list.querySelectorAll('.wish-entry').forEach(function(el){ el.remove(); });

  if(wishData.length){
    if(empty) empty.style.display = 'none';
  }else{
    if(empty) empty.style.display = 'block';
    return;
  }

  wishData.forEach(function(w){
    var div = document.createElement('div');
    div.className = 'wish-entry';

    var time = '';
    if(w.createdAt){
      try{
        time = new Date(w.createdAt).toLocaleString('id-ID',{
          day:'numeric',
          month:'short',
          hour:'2-digit',
          minute:'2-digit'
        });
      }catch(err){}
    }

    div.innerHTML =
      '<div class="wname">'+escapeHtml(w.name || '')+'</div>'+
      '<div class="wtext">'+escapeHtml(w.text || '')+'</div>'+
      '<div class="wtime">'+escapeHtml(time)+'</div>';

    list.appendChild(div);
  });
}

/* Load persisted data once the page is ready. */
loadRsvp();
loadWishes();

function copyText(text, btn){
  navigator.clipboard.writeText(text).then(function(){
    var orig = btn.textContent;
    btn.textContent = 'Tersalin!';
    setTimeout(function(){ btn.textContent = orig; }, 1500);
  });
}

function escapeHtml(str){
  var d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}