// Tiny stack VM, ISA v1 (kit generator/subject/ISA.md + vm.mjs).
// Node 22, no deps, no network, no clock, deterministic. For each
// /input/<id>/ it writes /output/<id>/stdout.bin and exit.txt.
// Wrapping 32-bit ints, 256 stack, 64 call stack, 256 memory words,
// traps 2..11 in ISA order; a trap is thrown and caught below.
import{mkdirSync,readdirSync,readFileSync,writeFileSync}from'node:fs';
import{join}from'node:path';
const I=process.env.MAKEFUN_INPUT_DIR??'/input',O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
// Per-opcode tables, indexed by opcode byte: pops, pushes, immediate bytes.
const A='000112230000000022222221222122202220000000000000011000000000000012000000000000001101';
const B='011022330000000011111111111111101110000000000000000000000000000010000000000000000010';
const C='014000000000000000000000000000000000000000000000222200000000000000000000000000000000';
// Binary ops, indexed by opcode-16 (holes at 23 NEG, 27 NOT, 31 unknown).
const F=[(v,b)=>(v+b)|0,(v,b)=>(v-b)|0,Math.imul,
(v,b)=>{if(!b)throw 4;return v===-2147483648&&b===-1?v:(v/b)|0},
(v,b)=>{if(!b)throw 4;return b===-1?0:(v%b)|0},
(v,b)=>{if(!b)throw 4;return Math.floor((v>>>0)/(b>>>0))|0},
(v,b)=>{if(!b)throw 4;return((v>>>0)%(b>>>0))|0},,
(v,b)=>v&b,(v,b)=>v|b,(v,b)=>v^b,,
(v,b)=>v<<(b&31),(v,b)=>v>>(b&31),(v,b)=>(v>>>(b&31))|0,,
(v,b)=>v===b?1:0,(v,b)=>v<b?1:0,(v,b)=>(v>>>0)<(b>>>0)?1:0];
function run(p,q){
const n=p.length,s=new Int32Array(256),c=new Int32Array(64),m=new Int32Array(256),o=new Uint8Array(65536);
let a=0,d=0,l=0,i=0,x=0,t=0;
const e=v=>({stdout:o.slice(0,l),exit:v});
try{for(;;){
if(t===1000000)throw 10;
if(x<0||x>=n)throw 9;
const k=p[x];
if(!(k<8||k>15&&k<35&&k!==31||k>47&&k<53||k===64||k===65||k>79&&k<84))throw 5;
const f=+C[k],u=+A[k],w=+B[k];
if(x+f>=n)throw 9;
t++;const y=x+1+f;
if(a<u)throw 2;
if(a-u+w>256)throw 3;
x=y;
switch(k){
case 0:return e(0);
case 1:s[a++]=(p[y-1]<<24)>>24;break;
case 2:s[a++]=p[y-4]|(p[y-3]<<8)|(p[y-2]<<16)|(p[y-1]<<24);break;
case 3:a--;break;
case 4:s[a]=s[a-1];a++;break;
case 5:{const v=s[a-1];s[a-1]=s[a-2];s[a-2]=v;break;}
case 6:s[a]=s[a-2];a++;break;
case 7:{const v=s[a-3];s[a-3]=s[a-2];s[a-2]=s[a-1];s[a-1]=v;break;}
case 23:s[a-1]=-s[a-1]|0;break;
case 27:s[a-1]=~s[a-1];break;
case 16:case 17:case 18:case 19:case 20:case 21:case 22:
case 24:case 25:case 26:case 28:case 29:case 30:case 32:
case 33:case 34:{const b=s[a-1],v=s[a-2];a-=2;s[a++]=F[k-16](v,b);break;}
case 48:case 49:case 50:{const r=((p[y-2]|(p[y-1]<<8))<<16)>>16;let j=k===48;
if(k!==48){const v=s[--a];j=k===49?v===0:v!==0;}if(j)x=y+r;break;}
case 51:if(d===64)throw 7;c[d++]=y;x=p[y-2]|(p[y-1]<<8);break;
case 52:if(d===0)throw 8;x=c[--d];break;
case 64:{const w=s[a-1];if(w<0||w>=256)throw 6;s[a-1]=m[w];break;}
case 65:{const w=s[a-1],v=s[a-2];if(w<0||w>=256)throw 6;a-=2;m[w]=v;break;}
case 80:{const z=String(s[a-1]);if(l+z.length>65536)throw 11;a--;
for(let j=0;j<z.length;j++)o[l++]=z.charCodeAt(j);break;}
case 81:if(l+1>65536)throw 11;o[l++]=s[--a]&255;break;
case 82:s[a++]=i<q.length?q[i++]:-1;break;
case 83:return e(s[--a]&255);
}}}catch(v){return e(v);}
}
for(const id of readdirSync(I).sort()){
let p=new Uint8Array(0),q=new Uint8Array(0);
try{p=readFileSync(join(I,id,'program.bin'));}catch{}
try{q=readFileSync(join(I,id,'input.bin'));}catch{}
const r=run(p,q);
mkdirSync(join(O,id),{recursive:true});
writeFileSync(join(O,id,'stdout.bin'),r.stdout);
writeFileSync(join(O,id,'exit.txt'),r.exit+'\n');
}
