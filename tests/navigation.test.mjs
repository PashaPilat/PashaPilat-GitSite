import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import * as geometry from '../src/navigation/scrollGeometry.mjs';
const require=createRequire(import.meta.url);
const config=JSON.parse(readFileSync(new URL('../src/navigation/navigation.json',import.meta.url)));
const {code}=require('@babel/core').transformSync(readFileSync(new URL('../src/navigation/scroll.js',import.meta.url),'utf8'),{babelrc:false,configFile:false,presets:[['@babel/preset-env',{targets:{node:'current'}}]]});
function setup({pinned=false,heroHeight=1800,dividerHeight=60,lenis=true}={}){
 const calls=[];const hero={offsetHeight:heroHeight,classList:{contains:()=>pinned}};
 const elements=Object.fromEntries(Object.values(config.web.home).map(item=>item.id).map(id=>[id,{id,offsetTop:5000,offsetParent:null}]));
 const dividers=Object.keys(elements).map(id=>({dataset:{scrollSection:id},offsetTop:5000+(pinned?0:heroHeight),offsetHeight:dividerHeight,offsetParent:null,closest:()=>({})}));
 const context={exports:{},document:{getElementById:id=>elements[id],querySelector:()=>hero,querySelectorAll:()=>dividers},window:{scrollY:0,matchMedia:()=>({matches:false}),scrollTo:options=>calls.push(options),lenis:lenis?{resize:()=>{},scrollTo:(position,options)=>calls.push({position,...options})}:null},require:name=>name==='./navigate'?{nav:()=>Object.values(config.web.home).map(item=>({...item,href:`#${item.id}`}))}:geometry};
 vm.runInNewContext(code,context);return {...context.exports,calls,dividers,context};
}
test('all Web links land below their divider from top and from pinned Hero',()=>{
 for(const pinned of [false,true]){const app=setup({pinned});for(const id of Object.values(config.web.home).map(item=>item.id)){app.scrollToSection(`#${id}`);assert.equal(app.calls.at(-1).position,5061)}}
});
test('resizing remeasures divider position and height without hardcoded offsets',()=>{
 const app=setup({pinned:true});app.scrollToSection('#services');const divider=app.dividers.find(d=>d.dataset.scrollSection==='services');divider.offsetTop=9200;divider.offsetHeight=88;app.scrollToSection('#services');assert.equal(app.calls.at(-1).position,9289);
 for(const heroHeight of [1474,1909]){const resized=setup({heroHeight,dividerHeight:88});resized.scrollToSection('#about');assert.equal(resized.calls.at(-1).position,5089)}
});
test('completion corrects layout changes during animation',()=>{const app=setup({pinned:true});app.scrollToSection('#about');const finish=app.calls[0].onComplete;app.dividers.find(d=>d.dataset.scrollSection==='about').offsetTop=5200;app.context.window.scrollY=5061;finish();assert.equal(app.calls.at(-1).position,5261);assert.equal(app.calls.at(-1).immediate,true)});
test('native fallback uses the same measured destination',()=>{const app=setup({lenis:false});app.scrollToSection('#direct-contact');assert.equal(app.calls[0].top,5061)});
test('top and missing anchors do not depend on dividers',()=>{const app=setup();assert.equal(app.scrollToSection('#missing'),false);assert.equal(app.scrollToSection('#%bad'),false);app.scrollToSection('#top');assert.equal(app.calls[0].position,0)});
test('unmarked sections keep ordinary layout and optional offsets',()=>{const app=setup();app.dividers.length=0;app.scrollToSection('#about',{offset:-40});assert.equal(app.calls[0].position,4960)});
test('same-page anchors preserve route, language, queries and modified destinations',()=>{const current='https://pashapilat.github.io/PashaPilat-GitSite/en?preview=1';const anchor=(href,extra={})=>({href,target:'',hasAttribute:()=>false,...extra});assert.equal(geometry.getSamePageHash(anchor('#contact'),current),'#contact');for(const href of ['/projects/demo#contact','/PashaPilat-GitSite/ua#contact','https://example.com/#contact','?other=1#contact'])assert.equal(geometry.getSamePageHash(anchor(href),current),null);assert.equal(geometry.getSamePageHash(anchor('#contact',{target:'_blank'}),current),null)});
test('completion rechecks layout after React commits immediate navigation',()=>{
 const app=setup({pinned:true});const frames=[];app.context.window.requestAnimationFrame=callback=>frames.push(callback);
 app.scrollToSection('#direct-contact');app.context.window.scrollY=5061;app.calls[0].onComplete();
 app.dividers.find(d=>d.dataset.scrollSection==='direct-contact').offsetTop+=24;
 frames.shift()();frames.shift()();assert.equal(app.calls.at(-1).position,5085);
});
