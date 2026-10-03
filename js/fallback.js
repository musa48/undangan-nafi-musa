function fallbackImg(img, label){
  label = label || 'Foto';
  var wrap = document.createElement('div');
  wrap.className = 'img-fallback';
  wrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-6-6-9 9"/></svg><span>'+label+'</span>';
  if(img.parentElement){ img.parentElement.replaceChild(wrap, img); }
}
