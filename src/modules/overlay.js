import { escapeHtml } from '../core/utils.js';
const root=()=>document.querySelector('#overlayRoot');
export function closeOverlay() { root().innerHTML=''; document.body.classList.remove('overlay-open'); }
export function showSheet(content, {className='',onMount}={}) {
  root().innerHTML=`<div class="overlay-backdrop" data-overlay-close><section class="bottom-sheet ${className}" role="dialog" aria-modal="true"><div class="sheet-handle"></div>${content}</section></div>`;
  document.body.classList.add('overlay-open');
  const backdrop=root().firstElementChild;
  requestAnimationFrame(()=>backdrop.classList.add('show'));
  backdrop.addEventListener('click',event=>{if(event.target.matches('[data-overlay-close]'))closeOverlay()});
  onMount?.(backdrop.querySelector('.bottom-sheet'));
}
export function showModal(content,{className='',dismissible=true,onMount}={}) {
  root().innerHTML=`<div class="overlay-backdrop modal-backdrop"><section class="modal-card ${className}" role="dialog" aria-modal="true">${content}</section></div>`;
  document.body.classList.add('overlay-open');
  const backdrop=root().firstElementChild;
  requestAnimationFrame(()=>backdrop.classList.add('show'));
  if(dismissible) backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeOverlay()});
  onMount?.(backdrop.querySelector('.modal-card'));
}
export function confirmDialog({title,message,confirmText='确认',cancelText='取消',danger=false}) {
  return new Promise(resolve=>showModal(`<h2>${escapeHtml(title)}</h2><p class="modal-copy">${escapeHtml(message)}</p><div class="modal-actions"><button class="button secondary" data-cancel>${escapeHtml(cancelText)}</button><button class="button ${danger?'danger':'primary'}" data-confirm>${escapeHtml(confirmText)}</button></div>`,{dismissible:false,onMount(card){card.querySelector('[data-cancel]').onclick=()=>{closeOverlay();resolve(false)};card.querySelector('[data-confirm]').onclick=()=>{closeOverlay();resolve(true)}}}));
}
export function toast(message) {
  const node=document.querySelector('#toast');
  node.textContent=message; node.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>node.classList.remove('show'),2200);
}
