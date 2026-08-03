const ANIME_WAAPI_URL='https://cdn.jsdelivr.net/npm/animejs@4.4.1/dist/modules/waapi/index.js';
const active=new WeakMap();
let enginePromise=null;
let animeWaapi=null;

export function prefersReducedMotion(){
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
}

function canWarmRemoteEngine(){
  if(prefersReducedMotion()||globalThis.navigator?.onLine===false)return false;
  const host=globalThis.location?.hostname||'';
  return !['localhost','127.0.0.1','0.0.0.0'].includes(host);
}

export function warmMotionEngine(){
  if(!canWarmRemoteEngine())return Promise.resolve(null);
  if(!enginePromise){
    enginePromise=import(ANIME_WAAPI_URL)
      .then(module=>{
        animeWaapi=typeof module.waapi?.animate==='function'?module.waapi:null;
        return animeWaapi;
      })
      .catch(()=>null);
  }
  return enginePromise;
}

function easing(value='out(3)'){
  if(value.includes('linear'))return 'linear';
  if(value.startsWith('inOut'))return 'cubic-bezier(.65,0,.35,1)';
  if(value.startsWith('in'))return 'cubic-bezier(.55,0,1,.45)';
  return 'cubic-bezier(.16,1,.3,1)';
}

function valuesAt(value,index,count){
  if(Array.isArray(value)){
    if(value.length===1)return value[0];
    const position=index/(count-1||1)*(value.length-1);
    const lower=Math.floor(position),upper=Math.ceil(position);
    if(lower===upper)return value[lower];
    const a=value[lower],b=value[upper],mix=position-lower;
    return typeof a==='number'&&typeof b==='number'?a+(b-a)*mix:(mix<.5?a:b);
  }
  return value;
}

function nativeFrames(parameters){
  const ignored=new Set(['duration','delay','ease','loop','alternate','onComplete','autoplay','composition']);
  const entries=Object.entries(parameters).filter(([key])=>!ignored.has(key));
  const count=Math.max(2,...entries.map(([,value])=>Array.isArray(value)?value.length:2));
  return Array.from({length:count},(_,index)=>{
    const frame={};let x=null,y=null;const transforms=[];
    for(const [property,value] of entries){
      const current=valuesAt(value,index,count);
      if(property==='x'||property==='translateX')x=typeof current==='number'?`${current}px`:current;
      else if(property==='y'||property==='translateY')y=typeof current==='number'?`${current}px`:current;
      else if(property==='scale')frame.scale=String(current);
      else if(property==='rotate'||property==='rotateZ')frame.rotate=typeof current==='number'?`${current}deg`:current;
      else if(property==='rotateX')transforms.push(`rotateX(${typeof current==='number'?`${current}deg`:current})`);
      else if(property==='rotateY')transforms.push(`rotateY(${typeof current==='number'?`${current}deg`:current})`);
      else if(property==='transform')frame.transform=current;
      else frame[property]=current;
    }
    if(x!==null||y!==null)frame.translate=`${x??'0px'} ${y??'0px'}`;
    if(transforms.length)frame.transform=transforms.join(' ');
    frame.offset=count===1?1:index/(count-1);
    return frame;
  });
}

function stopPrevious(target){
  const previous=active.get(target);
  try{previous?.cancel?.()}catch{}
  active.delete(target);
}

function nativeAnimate(target,parameters){
  const animation=target.animate(nativeFrames(parameters),{
    duration:parameters.duration??400,
    delay:parameters.delay??0,
    easing:easing(parameters.ease),
    iterations:parameters.loop===true?Infinity:(Number(parameters.loop)||0)+1,
    direction:parameters.alternate?'alternate':'normal',
    fill:'both'
  });
  active.set(target,animation);
  return animation;
}

export async function animateLite(target,parameters={}){
  if(!target||prefersReducedMotion()){
    parameters.onComplete?.();
    return null;
  }
  stopPrevious(target);
  let animation;
  if(animeWaapi){
    try{animation=animeWaapi.animate(target,parameters)}catch{animation=nativeAnimate(target,parameters)}
  }else{
    // 首次进入或离线时立即使用原生 WAAPI，不等待网络模块，保证交互无延迟。
    animation=nativeAnimate(target,parameters);
    warmMotionEngine();
  }
  active.set(target,animation);
  try{
    if(typeof animation?.then==='function')await animation;
    else if(animation?.finished)await animation.finished;
  }catch{}
  if(active.get(target)===animation)active.delete(target);
  parameters.onComplete?.();
  return animation;
}

export function cancelMotion(target){stopPrevious(target)}
