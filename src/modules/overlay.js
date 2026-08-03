import { escapeHtml } from '../core/utils.js';
const root=()=>document.querySelector('#overlayRoot');
let lastFocused=null;
let keyHandler=null;
const focusable='button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
function teardown(){
  if(keyHandler)document.removeEventListener('keydown',keyHandler);
  keyHandler=null;
}
export function closeOverlay(){
  teardown();
  root().innerHTML='';
  document.body.classList.remove('overlay-open');
  if(lastFocused?.isConnected)lastFocused.focus({preventScroll:true});
  lastFocused=null;
}
function mountOverlay(backdrop,dialog,{dismissible=true,onMount}={}){
  lastFocused=document.activeElement;
  document.body.classList.add('overlay-open');
  requestAnimationFrame(()=>{
    backdrop.classList.add('show');
    const first=dialog.querySelector(focusable)||dialog;
    first.focus({preventScroll:true});
  });
  keyHandler=event=>{
    if(event.key==='Escape'&&dismissible){event.preventDefault();closeOverlay();return}
    if(event.key!=='Tab')return;
    const nodes=[...dialog.querySelectorAll(focusable)].filter(node=>node.offsetParent!==null);
    if(!nodes.length){event.preventDefault();dialog.focus();return}
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',keyHandler);
  onMount?.(dialog);
}
export function showSheet(content,{className='',onMount,dismissible=true}={}){
  root().innerHTML=`<div class="overlay-backdrop" data-overlay-close><section class="bottom-sheet ${className}" role="dialog" aria-modal="true" tabindex="-1"><div class="sheet-handle" aria-hidden="true"></div><button class="sheet-close" type="button" data-sheet-close aria-label="关闭">×</button>${content}</section></div>`;
  const backdrop=root().firstElementChild;
  const dialog=backdrop.querySelector('.bottom-sheet');
  backdrop.addEventListener('click',event=>{if(dismissible&&event.target.matches('[data-overlay-close]'))closeOverlay()});
  dialog.querySelector('[data-sheet-close]').onclick=closeOverlay;
  mountOverlay(backdrop,dialog,{dismissible,onMount});
}
export function showModal(content,{className='',dismissible=true,onMount}={}){
  root().innerHTML=`<div class="overlay-backdrop modal-backdrop"><section class="modal-card ${className}" role="dialog" aria-modal="true" tabindex="-1">${content}</section></div>`;
  const backdrop=root().firstElementChild;
  const dialog=backdrop.querySelector('.modal-card');
  if(dismissible)backdrop.addEventListener('click',event=>{if(event.target===backdrop)closeOverlay()});
  mountOverlay(backdrop,dialog,{dismissible,onMount});
}
export function confirmDialog({title,message,confirmText='确认',cancelText='取消',danger=false}){
  return new Promise(resolve=>showModal(`<h2>${escapeHtml(title)}</h2><p class="modal-copy">${escapeHtml(message)}</p><div class="modal-actions"><button class="button secondary" data-cancel>${escapeHtml(cancelText)}</button><button class="button ${danger?'danger':'primary'}" data-confirm>${escapeHtml(confirmText)}</button></div>`,{dismissible:false,onMount(card){card.querySelector('[data-cancel]').onclick=()=>{closeOverlay();resolve(false)};card.querySelector('[data-confirm]').onclick=()=>{closeOverlay();resolve(true)}}}));
}
export function toast(message){
  const node=document.querySelector('#toast');
  node.textContent=message;node.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),2200);
}
