"use strict";var Bn=Object.create;var Le=Object.defineProperty;var Zn=Object.getOwnPropertyDescriptor;var Hn=Object.getOwnPropertyNames;var Wn=Object.getPrototypeOf,Kn=Object.prototype.hasOwnProperty;var Jn=(u,p)=>{for(var e in p)Le(u,e,{get:p[e],enumerable:!0})},an=(u,p,e,n)=>{if(p&&typeof p=="object"||typeof p=="function")for(let t of Hn(p))!Kn.call(u,t)&&t!==e&&Le(u,t,{get:()=>p[t],enumerable:!(n=Zn(p,t))||n.enumerable});return u};var ge=(u,p,e)=>(e=u!=null?Bn(Wn(u)):{},an(p||!u||!u.__esModule?Le(e,"default",{value:u,enumerable:!0}):e,u)),Xn=u=>an(Le({},"__esModule",{value:!0}),u);var ct={};Jn(ct,{default:()=>Ze});module.exports=Xn(ct);var m=require("obsidian");var un=require("@codemirror/state"),W=require("@codemirror/view"),_n=require("obsidian");var de=/<!--\s*zrr:sync-start[^>]*-->/i,fe=/<!--\s*zrr:sync-end\s*-->/i,se=/<!--\s*zrr:chunk\b([^>]*)-->/i,Se=/<!--\s*zrr:chunk\s+end\s*-->/i,ke=/<!--\s*zrr:(?:exclude|delete)\s*-->/i,sn=u=>{let p=u.trim();if(!p.toLowerCase().startsWith("zrr:"))return null;if(/^zrr:sync-start\b/i.test(p)){let g=p.match(/\bdoc_id=(["']?)([^"'\s]+)\1/i);return{type:"sync-start",docId:g?g[2]:void 0}}if(/^zrr:sync-end\b/i.test(p))return{type:"sync-end"};if(/^zrr:chunk\s+end\b/i.test(p))return{type:"chunk-end"};let e=p.match(/^zrr:chunk\b(.*)$/i);if(!e)return null;let n=e[1]||"",t=n.match(/\bid=(["']?)([^"'\s]+)\1/i),i=t?t[2]:"",r=n.match(/\bpage(?:_start)?=(["']?)(\d+)\1/i),s=r?null:n.match(/\(\s*(\d+)\s*\)/),a=r?Number.parseInt(r[2],10):s?Number.parseInt(s[1],10):void 0,o=i.match(/^p(\d+)$/i),l=o?Number.parseInt(o[1],10):void 0,d=Number.isFinite(a!=null?a:NaN)?a:l,c=/\bexclude\b/i.test(n)||/\bdelete\b/i.test(n),_=/\bsection\b/i.test(n);return{type:"chunk-start",chunkId:i||void 0,excluded:c,pageNumber:Number.isFinite(d!=null?d:NaN)?d:void 0,chunkKind:_?"section":d?"page":"section"}},Ke=u=>{var l;if(!u)return null;let p=u.match(se);if(!p)return null;let e=p[1]||"",n=e.match(/\bid=(["']?)([^"'\s]+)\1/i),t=n?n[2].trim():void 0,i=e.match(/\bpage(?:_start)?=(["']?)(\d+)\1/i),r=i?null:e.match(/\(\s*(\d+)\s*\)/),s=i?Number.parseInt(i[2],10):r?Number.parseInt(r[1],10):void 0,a=t&&(l=Qn(t))!=null?l:void 0,o=Number.isFinite(s!=null?s:NaN)?s:a;return{chunkId:t,pageNumber:Number.isFinite(o!=null?o:NaN)?Number(o):void 0}},Ae=u=>{for(let p=1;p<=u.lines;p+=1){let e=u.line(p).text;if(de.test(e)){let n=e.match(/doc_id=([\"']?)([^\"'\s]+)\1/i);return n?n[2].trim():null}}return null},Je=(u,p)=>{let e=p;for(;e>=1;e-=1){let n=u.line(e).text;if(se.test(n))return{line:e,text:n};if(de.test(n)||fe.test(n))break}return null},Yn=(u,p)=>{for(let e=p;e<=u.lines;e+=1){let n=u.line(e).text;if(Se.test(n))return e;if(fe.test(n))break}return null},on=(u,p)=>{let e=Je(u,p);if(!e)return null;let n=Yn(u,e.line+1);return n===null||p<e.line||p>n?null:{startLine:e.line,endLine:n,text:e.text}},ln=(u,p,e)=>{if(p>e)return!1;for(let n=p;n<=e;n+=1){let t=u.line(n).text;if(ke.test(t))return!0}return!1},Qn=u=>{var t;if(!u)return null;let e=(u.includes(":")&&(t=u.split(":").pop())!=null?t:u).match(/^p(\d+)$/i);if(!e)return null;let n=Number.parseInt(e[1],10);return Number.isFinite(n)?n:null};var dn=u=>{if(!u)return null;let p=u.match(/<!--\s*zrr:chunk\b[^>]*-->/i);return p?Ke(p[0]):null};var et=(u,p)=>{let e=document.createElement("div");if(e.classList.add("zrr-sync-badge"),u.type==="sync-start"||u.type==="sync-end")return e.classList.add("zrr-sync-badge--sync"),e.classList.add(u.type==="sync-start"?"zrr-sync-badge--sync-start":"zrr-sync-badge--sync-end"),u.type==="sync-start"?e.textContent=u.docId?`Redis Index Sync start - ${u.docId}`:"Redis Index Sync start":e.textContent="Redis Index Sync end",e;if(u.type==="chunk-end")return e.classList.add("zrr-sync-badge--chunk-end"),e.textContent=u.chunkKind==="page"?"Page end":"Section end",u.chunkKind&&e.classList.add(`zrr-sync-badge--${u.chunkKind}`),e;if(u.type!=="chunk-start")return null;if(e.classList.add("zrr-sync-badge--chunk"),u.chunkKind&&e.classList.add(`zrr-sync-badge--${u.chunkKind}`),u.excluded&&e.classList.add("is-excluded"),u.pageNumber&&p>0)if(u.chunkKind==="section"){let n=u.chunkId?`Section ${u.chunkId}`:"Section";e.textContent=`${n} (p${u.pageNumber}/${p})`}else e.textContent=`Page ${u.pageNumber}/${p}`;else if(u.pageNumber)if(u.chunkKind==="section"){let n=u.chunkId?`Section ${u.chunkId}`:"Section";e.textContent=`${n} (p${u.pageNumber})`}else e.textContent=`Page ${u.pageNumber}`;else u.chunkId?e.textContent=`Section ${u.chunkId}`:e.textContent="Section";return u.excluded&&(e.textContent=`${e.textContent} - excluded`),e},Xe=class extends W.WidgetType{constructor(p,e,n,t,i){super(),this.plugin=p,this.docId=e,this.chunkId=n,this.startLine=t,this.excluded=i}eq(p){return this.docId===p.docId&&this.chunkId===p.chunkId&&this.startLine===p.startLine&&this.excluded===p.excluded}toDOM(){let p=document.createElement("span");p.className="zrr-chunk-toolbar",p.setAttribute("data-chunk-id",this.chunkId);let e=(d,c)=>{d.setAttribute("title",c),d.setAttribute("aria-label",c),d.setAttribute("data-tooltip-position","top")},n=(d,c,_)=>{let g=document.createElement("span");g.className="zrr-chunk-button-icon",(0,_n.setIcon)(g,c);let y=document.createElement("span");y.className="zrr-chunk-button-label",y.textContent=_,d.appendChild(g),d.appendChild(y)},t=document.createElement("button");t.type="button",t.className="zrr-chunk-button",n(t,"sparkles","Clean"),e(t,"Clean this chunk with the OCR cleanup model"),t.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),this.plugin.cleanChunkFromToolbar(this.startLine)}),p.appendChild(t);let i=document.createElement("button");i.type="button",i.className="zrr-chunk-button",n(i,"tag","Tags"),e(i,"Edit chunk tags"),i.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),this.plugin.openChunkTagEditor(this.docId,this.chunkId)}),p.appendChild(i);let r=document.createElement("button");r.type="button",r.className="zrr-chunk-button",n(r,"search","Indexed"),e(r,"Preview indexed chunk text"),r.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),this.plugin.openChunkIndexedTextPreview(this.docId,this.chunkId)}),p.appendChild(r);let s=document.createElement("button");s.type="button",s.className="zrr-chunk-button",n(s,"external-link","Zotero"),e(s,"Open this page in Zotero"),s.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),this.plugin.openChunkInZotero(this.docId,this.chunkId)}),p.appendChild(s);let a=document.createElement("button");a.type="button",a.className="zrr-chunk-button";let o=this.excluded?"Include":"Exclude",l=this.excluded?"check":"ban";return n(a,l,o),e(a,this.excluded?"Include this chunk in the index":"Exclude this chunk from the index"),a.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),this.plugin.toggleChunkExcludeFromToolbar(this.startLine)}),p.appendChild(a),p}ignoreEvent(){return!0}},cn=(u,p)=>{var b;let e=u.state.doc,n=Ae(e);if(!n)return W.Decoration.none;let t=u.state.selection.main.head,i=e.lineAt(t).number,r=on(e,i);if(!r)return W.Decoration.none;let s=r.text.match(se);if(!s)return W.Decoration.none;let a=((b=s[1])!=null?b:"").trim(),o=a.match(/id=(["']?)([^"'\s]+)\1/i);if(!o)return W.Decoration.none;let l=o[2].trim();if(!l)return W.Decoration.none;let d=/\bexclude\b/i.test(a)||/\bdelete\b/i.test(a),c=ln(e,r.startLine+1,r.endLine-1),_=d||c,g=e.line(r.startLine),y=W.Decoration.widget({widget:new Xe(p,n,l,r.startLine,_),side:1});return W.Decoration.set([y.range(g.to)])},Ye=class extends W.WidgetType{constructor(p,e){super(),this.info=p,this.totalPages=e}toDOM(){var p;return(p=et(this.info,this.totalPages))!=null?p:document.createElement("span")}},pn=u=>{var o,l;let p=u.dom.closest(".markdown-source-view");if(!p||!p.classList.contains("is-live-preview"))return W.Decoration.none;let e=u.state.doc,n=new un.RangeSetBuilder,t=[],i=[],r=!1,s=!1;for(let d=1;d<=e.lines;d+=1){let c=e.line(d),_=c.text.match(/<!--\s*([^>]*)\s*-->/);if(!_)continue;let g=sn(_[1]);g&&(g.type==="chunk-start"?(g.chunkKind=(o=g.chunkKind)!=null?o:g.pageNumber?"page":"section",g.pageNumber&&(r=!0),g.chunkKind==="section"&&(s=!0)):g.type==="chunk-end"&&(g.chunkKind=(l=g.chunkKind)!=null?l:"section"),t.push({line:d,from:c.from,to:c.to,info:g}),g.pageNumber&&i.push(g.pageNumber))}if(!t.length)return W.Decoration.none;if(r&&!s)for(let d of t)d.info.type==="chunk-end"&&(d.info.chunkKind="page");let a=i.length?Math.max(...i):0;for(let d of t){let c=W.Decoration.replace({widget:new Ye(d.info,a)});n.add(d.from,d.to,c)}return n.finish()},gn=()=>W.ViewPlugin.fromClass(class{constructor(u){this.decorations=pn(u)}update(u){(u.docChanged||u.viewportChanged)&&(this.decorations=pn(u.view))}},{decorations:u=>u.decorations}),fn=u=>W.ViewPlugin.fromClass(class{constructor(p){this.decorations=cn(p,u)}update(p){(p.docChanged||p.selectionSet||p.viewportChanged)&&(this.decorations=cn(p.view,u))}},{decorations:p=>p.decorations});var Q=require("child_process"),$=require("fs"),jn=ge(require("http")),$n=ge(require("https")),Pe=ge(require("net")),Vn=ge(require("os")),Gn=ge(require("tls")),A=ge(require("path")),rn=require("url"),Be=require("crypto");var R=require("obsidian"),J=".zotero-redisearch-rag",Y=`${J}/items`,U=`${J}/chunks`,mn=`${J}/metadata_snapshots.json`,hn={pythonPath:"",pythonEnvLocation:"shared",dockerPath:"docker",redisUrl:"redis://127.0.0.1:6379",autoAssignRedisPort:!1,redisDataDirOverride:"",redisProjectName:"",autoStartRedis:!0,zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",webApiBaseUrl:"https://api.zotero.org",webApiLibraryType:"user",webApiLibraryId:"",webApiKey:"",outputPdfDir:"Zotero/PDFs",outputNoteDir:"Zotero/Notes",frontmatterTemplate:`doc_id: {{doc_id}}
zotero_key: {{zotero_key}}
zotero_link: {{item_link_yaml}}
citekey: {{citekey}}
title: {{title_yaml}}
year: {{year_number}}
authors:
{{authors_yaml_list}}
editors:
{{editors_yaml_list}}
aliases:
{{aliases_yaml_list}}
tags:
{{tags_yaml_list}}
collection_titles: {{collection_titles_yaml}}
collections:
{{collections_yaml_list}}
item_type: {{item_type_yaml}}
short_title: {{short_title_yaml}}
creator_summary: {{creator_summary_yaml}}
publication_title: {{publication_title_yaml}}
book_title: {{book_title_yaml}}
journal_abbrev: {{journal_abbrev_yaml}}
publisher: {{publisher_yaml}}
volume: {{volume_yaml}}
issue: {{issue_yaml}}
pages: {{pages_yaml}}
doi: {{doi_yaml}}
isbn: {{isbn_yaml}}
issn: {{issn_yaml}}
place: {{place_yaml}}
url: {{url_yaml}}
language: {{language_yaml}}
abstract: {{abstract_yaml}}
pdf_link: {{pdf_link_yaml}}
item_json: {{item_json_yaml}}`,tagSanitizeMode:"kebab",noteBodyTemplate:"{{pdf_block}}{{docling_markdown}}",llmProviderProfiles:[{id:"lm-studio",name:"LM Studio",baseUrl:"http://localhost:1234/v1",apiKey:"lm-studio"},{id:"ollama",name:"Ollama",baseUrl:"http://localhost:11434/v1",apiKey:""},{id:"openrouter",name:"OpenRouter",baseUrl:"https://openrouter.ai/api/v1",apiKey:""},{id:"openai",name:"OpenAI",baseUrl:"https://api.openai.com/v1",apiKey:""}],chatOutputDir:"Zotero/Chats",copyPdfToVault:!0,createOcrLayeredPdf:!1,preferObsidianNoteForCitations:!0,ocrMode:"auto",ocrQualityThreshold:.5,chunkingMode:"page",ocrEngine:"auto",forcePerPageOcr:!1,paddleApiKey:"",paddleVlApiUrl:"",paddleStructureApiUrl:"",enableLlmCleanup:!1,llmCleanupProviderProfileId:"lm-studio",llmCleanupBaseUrl:"http://127.0.0.1:1234/v1",llmCleanupApiKey:"",llmCleanupModel:"openai/gpt-oss-20b",llmCleanupTemperature:0,llmCleanupMinQuality:.35,llmCleanupMaxChars:2e3,embedProviderProfileId:"lm-studio",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",embedIncludeMetadata:!0,embedSubchunkChars:3500,embedSubchunkOverlap:200,embedContextWindow:1,embedContextChars:220,enableChunkTagging:!1,chatProviderProfileId:"lm-studio",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,chatHistoryMessages:6,chatPaneLocation:"right",enableQueryExpansion:!1,queryExpansionCount:3,enableCrossEncoderRerank:!1,rerankModel:"BAAI/bge-reranker-v2-m3",rerankCandidateMultiplier:4,rrfK:60,rrfLogTop:0,maxChunksPerDoc:0,enableFileLogging:!1,logFilePath:`${J}/logs/docling_extract.log`,redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:"},Ee=class extends R.PluginSettingTab{constructor(e,n){super(e,n);this.activeTab="prerequisites";this.plugin=n}display(){let{containerEl:e}=this;e.empty();let n=()=>Array.isArray(this.plugin.settings.llmProviderProfiles)?this.plugin.settings.llmProviderProfiles:[],t=async f=>{this.plugin.settings.llmProviderProfiles=f,await this.plugin.saveSettings()},i=f=>{f.inputEl.type="password",f.inputEl.autocomplete="off",f.inputEl.spellcheck=!1},d=[{id:"prerequisites",label:"Prerequisites",render:f=>{f.createEl("h2",{text:"Prerequisites"}),new R.Setting(f).setName("Python path").setDesc("Optional path to the Python interpreter used to create or run the plugin env. Leave blank to auto-detect (python3.13/3.12/3.11/3.10/python3/python, or py on Windows).").addText(h=>h.setPlaceholder("auto-detect").setValue(this.plugin.settings.pythonPath).onChange(async C=>{this.plugin.settings.pythonPath=C.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("Python environment").setDesc("Create or update the plugin's Python env (location configured below).").addButton(h=>{h.setButtonText("Create/Update").setCta(),h.onClick(async()=>{h.setDisabled(!0);try{await this.plugin.setupPythonEnv()}finally{h.setDisabled(!1)}})}),new R.Setting(f).setName("Python env location").setDesc("Shared user cache can be reused across vaults; plugin folder keeps a per-vault env.").addDropdown(h=>{h.addOption("shared","Shared user cache"),h.addOption("plugin","Plugin folder (.venv)"),h.setValue(this.plugin.settings.pythonEnvLocation).onChange(async C=>{C!=="shared"&&C!=="plugin"||(this.plugin.settings.pythonEnvLocation=C,await this.plugin.saveSettings())})}),new R.Setting(f).setName("Docker/Podman path").setDesc("CLI path for Docker or Podman (used to start Redis Stack).").addText(h=>h.setPlaceholder("docker").setValue(this.plugin.settings.dockerPath).onChange(async C=>{this.plugin.settings.dockerPath=C.trim()||"docker",await this.plugin.saveSettings()})),new R.Setting(f).setName("Redis URL").addText(h=>h.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async C=>{this.plugin.settings.redisUrl=C.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("Redis data directory override").setDesc("Optional absolute path to store Redis persistence when auto-assign is off. Env var ZRR_DATA_DIR overrides this setting.").addText(h=>h.setPlaceholder("/Users/you/Redis/zrr-data").setValue(this.plugin.settings.redisDataDirOverride).onChange(async C=>{this.plugin.settings.redisDataDirOverride=C.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("Redis project name override").setDesc("Optional Docker/Podman Compose project name when auto-assign is off. Env var ZRR_PROJECT_NAME overrides this setting.").addText(h=>h.setPlaceholder("zrr-shared").setValue(this.plugin.settings.redisProjectName).onChange(async C=>{this.plugin.settings.redisProjectName=C.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("Auto-assign Redis port").setDesc("When starting Redis stack, pick a free local port and update the Redis URL.").addToggle(h=>h.setValue(this.plugin.settings.autoAssignRedisPort).onChange(async C=>{this.plugin.settings.autoAssignRedisPort=C,await this.plugin.saveSettings()})),new R.Setting(f).setName("Auto-start Redis stack (Docker/Podman Compose)").setDesc("Requires Docker Desktop running and your vault path shared with Docker. Uses a vault-specific data dir at .obsidian/zotero-redisearch-rag/redis-data unless overridden.").addToggle(h=>h.setValue(this.plugin.settings.autoStartRedis).onChange(async C=>{this.plugin.settings.autoStartRedis=C,await this.plugin.saveSettings()})),new R.Setting(f).setName("Start Redis stack now").setDesc("Restarts Docker/Podman Compose with the vault data directory.").addButton(h=>h.setButtonText("Start").onClick(async()=>{await this.plugin.startRedisStack()}))}},{id:"zotero-import",label:"Zotero import",render:f=>{f.createEl("h2",{text:"Zotero Local API"}),new R.Setting(f).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(P=>P.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async w=>{this.plugin.settings.zoteroBaseUrl=w.trim(),await this.plugin.saveSettings()}));let h=new R.Setting(f).setName("Zotero library").setDesc("Select your local library or a Zotero group library."),C=null,k=P=>{if(!C)return;let w=(this.plugin.settings.zoteroUserId||"0").trim()||"0";new Set(P.map(I=>I.value)).has(w)||(P=P.concat([{value:w,label:`Custom (${w})`}])),C.selectEl.options.length=0;for(let I of P)C.addOption(I.value,I.label);C.setValue(w)},E=async()=>{if(C){C.setDisabled(!0);try{let P=await this.plugin.fetchZoteroLibraryOptions();k(P)}finally{C.setDisabled(!1)}}};h.addDropdown(P=>{C=P;let w=(this.plugin.settings.zoteroUserId||"0").trim()||"0";P.addOption(w,"Loading..."),P.setValue(w),P.onChange(async D=>{this.plugin.settings.zoteroUserId=D.trim(),await this.plugin.saveSettings()})}),h.addButton(P=>{P.setButtonText("Refresh").onClick(async()=>{await E()})}),E(),f.createEl("h2",{text:"Zotero Web API"}),new R.Setting(f).setName("Web API base URL").setDesc("Zotero Web API base URL for write fallback, e.g. https://api.zotero.org").addText(P=>P.setPlaceholder("https://api.zotero.org").setValue(this.plugin.settings.webApiBaseUrl).onChange(async w=>{this.plugin.settings.webApiBaseUrl=w.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("Web API library type").setDesc("Library type for Web API writes.").addDropdown(P=>P.addOption("user","user").addOption("group","group").setValue(this.plugin.settings.webApiLibraryType).onChange(async w=>{this.plugin.settings.webApiLibraryType=w,await this.plugin.saveSettings()})),new R.Setting(f).setName("Web API library ID").setDesc("Numeric Zotero user/group ID for Web API writes.").addText(P=>P.setPlaceholder("15218").setValue(this.plugin.settings.webApiLibraryId).onChange(async w=>{this.plugin.settings.webApiLibraryId=w.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("Web API key").setDesc("Zotero API key for write fallback (from zotero.org).").addText(P=>{i(P),P.setPlaceholder("your-api-key").setValue(this.plugin.settings.webApiKey).onChange(async w=>{this.plugin.settings.webApiKey=w.trim(),await this.plugin.saveSettings()})}),f.createEl("h2",{text:"Output"}),new R.Setting(f).setName("PDF folder").addText(P=>P.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async w=>{this.plugin.settings.outputPdfDir=w.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("Notes folder").addText(P=>P.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async w=>{this.plugin.settings.outputNoteDir=w.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("Frontmatter template").setDesc("Template for note YAML frontmatter. Use {{var}} placeholders; leave blank to omit.").addTextArea(P=>{P.setValue(this.plugin.settings.frontmatterTemplate).onChange(async w=>{this.plugin.settings.frontmatterTemplate=w,await this.plugin.saveSettings()}),P.inputEl.rows=10,P.inputEl.style.width="100%"}),new R.Setting(f).setName("Tag sanitization").setDesc("Normalize Zotero tags for Obsidian (no spaces, punctuation trimmed).").addDropdown(P=>P.addOption("none","No change").addOption("camel","camelCase").addOption("pascal","PascalCase").addOption("snake","snake_case").addOption("kebab","kebab-case").setValue(this.plugin.settings.tagSanitizeMode==="replace"?"kebab":this.plugin.settings.tagSanitizeMode).onChange(async w=>{this.plugin.settings.tagSanitizeMode=w,await this.plugin.saveSettings()})),new R.Setting(f).setName("Note body template").setDesc("Template for the note body after frontmatter. Use {{pdf_block}} and {{docling_markdown}} placeholders.").addTextArea(P=>{P.setValue(this.plugin.settings.noteBodyTemplate).onChange(async w=>{this.plugin.settings.noteBodyTemplate=w,await this.plugin.saveSettings()}),P.inputEl.rows=8,P.inputEl.style.width="100%"}),new R.Setting(f).setName("Saved chats folder").setDesc("Where exported chat notes are stored (vault-relative).").addText(P=>P.setPlaceholder("zotero/chats").setValue(this.plugin.settings.chatOutputDir).onChange(async w=>{this.plugin.settings.chatOutputDir=w.trim()||"zotero/chats",await this.plugin.saveSettings()})),new R.Setting(f).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly. If a local file path is unavailable, the plugin temporarily copies the PDF into the vault for processing.").addToggle(P=>P.setValue(this.plugin.settings.copyPdfToVault).onChange(async w=>{this.plugin.settings.copyPdfToVault=w,!w&&this.plugin.settings.createOcrLayeredPdf&&(this.plugin.settings.createOcrLayeredPdf=!1),await this.plugin.saveSettings(),this.display()})),new R.Setting(f).setName("Create OCR-layered PDF copy").setDesc("When OCR is used, replace the vault PDF with a Tesseract text layer (requires Copy PDFs into vault).").addToggle(P=>{let w=this.plugin.settings.copyPdfToVault;P.setValue(w?this.plugin.settings.createOcrLayeredPdf:!1).setDisabled(!w).onChange(async D=>{if(!this.plugin.settings.copyPdfToVault){this.plugin.settings.createOcrLayeredPdf=!1,await this.plugin.saveSettings();return}this.plugin.settings.createOcrLayeredPdf=D,await this.plugin.saveSettings()})}),new R.Setting(f).setName("Prefer Obsidian note for citations").setDesc("Link citations to the Obsidian note when available; otherwise use Zotero deep links.").addToggle(P=>P.setValue(this.plugin.settings.preferObsidianNoteForCitations).onChange(async w=>{this.plugin.settings.preferObsidianNoteForCitations=w,await this.plugin.saveSettings()}))}},{id:"ocr",label:"OCR",render:f=>{f.createEl("h2",{text:"Docling"});let h=null,C=w=>{if(!h)return;let D=this.plugin.settings.ocrEngine;new Set(w.map(z=>z.value)).has(D)||(w=w.concat([{value:D,label:`Current (unavailable): ${D}`}])),h.selectEl.options.length=0;for(let z of w)h.addOption(z.value,z.label);h.setValue(D)},k=async()=>{if(!h)return;h.setDisabled(!0);let w={tesseract:!1,paddleStructureLocal:!1,paddleVlLocal:!1};if(this.plugin.detectOcrEngines)try{w=await this.plugin.detectOcrEngines()}catch(z){w={tesseract:!1,paddleStructureLocal:!1,paddleVlLocal:!1}}let D=[{value:"auto",label:"Auto (default)"}];w.tesseract&&D.push({value:"tesseract",label:"Tesseract (local)"}),w.paddleStructureLocal&&D.push({value:"paddle_structure_local",label:"Paddle PP-StructureV3 (local)"}),w.paddleVlLocal&&D.push({value:"paddle_vl_local",label:"PaddleOCR-VL (local)"}),(this.plugin.settings.paddleApiKey||"").trim()&&(D.push({value:"paddle_structure_api",label:"PP-StructureV3 API"}),D.push({value:"paddle_vl_api",label:"PaddleOCR-VL API"})),C(D),h.setDisabled(!1)},E=new R.Setting(f).setName("Paddle OCR API key").setDesc("API token for PaddleOCR-VL / PP-StructureV3 endpoints. Get a free API key at "),P=document.createElement("a");P.href="https://aistudio.baidu.com/paddleocr",P.textContent="https://aistudio.baidu.com/paddleocr",P.target="_blank",P.rel="noopener noreferrer",E.descEl.appendChild(P),E.descEl.append("."),E.addText(w=>{i(w),w.setPlaceholder("your-api-token").setValue(this.plugin.settings.paddleApiKey).onChange(async D=>{this.plugin.settings.paddleApiKey=D.trim(),await this.plugin.saveSettings(),await k()})}),new R.Setting(f).setName("PaddleOCR-VL API URL").setDesc("Optional override for the PaddleOCR-VL API endpoint.").addText(w=>w.setPlaceholder("https://.../layout-parsing").setValue(this.plugin.settings.paddleVlApiUrl).onChange(async D=>{this.plugin.settings.paddleVlApiUrl=D.trim(),await this.plugin.saveSettings()})),new R.Setting(f).setName("PP-StructureV3 API URL").setDesc("API endpoint for PP-StructureV3 (see Baidu AI Studio docs).").addText(w=>w.setPlaceholder("https://.../pp-structure").setValue(this.plugin.settings.paddleStructureApiUrl).onChange(async D=>{this.plugin.settings.paddleStructureApiUrl=D.trim(),await this.plugin.saveSettings(),await k()})),new R.Setting(f).setName("OCR engine").setDesc("Select the OCR engine to use when OCR is required.").addDropdown(w=>{h=w,w.addOption("auto","Auto (default)"),w.setValue(this.plugin.settings.ocrEngine),w.onChange(async D=>{this.plugin.settings.ocrEngine=D,await this.plugin.saveSettings()})}),new R.Setting(f).setName("OCR decision (when to OCR)").setDesc("Controls when OCR runs; per-page behavior is configured separately below.").addDropdown(w=>w.addOption("auto","Auto: use text layer when reliable").addOption("force_low_quality","OCR only if text is poor").addOption("force","Prefer OCR for full document").setValue(this.plugin.settings.ocrMode).onChange(async D=>{this.plugin.settings.ocrMode=D,await this.plugin.saveSettings()})),new R.Setting(f).setName("OCR layout override (per-page)").setDesc("Force per-page OCR when OCR runs, bypassing layout heuristics; can be slower for multi-column PDFs.").addToggle(w=>w.setValue(this.plugin.settings.forcePerPageOcr).onChange(async D=>{this.plugin.settings.forcePerPageOcr=D,await this.plugin.saveSettings()})),new R.Setting(f).setName("Text quality threshold").setDesc("Lower values are stricter; below this threshold the text is treated as low quality.").addSlider(w=>{w.setLimits(0,1,.05).setValue(this.plugin.settings.ocrQualityThreshold).setDynamicTooltip().onChange(async D=>{this.plugin.settings.ocrQualityThreshold=D,await this.plugin.saveSettings()})}),new R.Setting(f).setName("Chunking").setDesc("page or section").addDropdown(w=>w.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async D=>{this.plugin.settings.chunkingMode=D,await this.plugin.saveSettings()})),k()}},{id:"llms",label:"LLMs",render:f=>{f.createEl("h2",{text:"LLM Provider Profiles"});let h=f.createDiv({cls:"zrr-llm-profiles"}),C=()=>{h.empty();let v=n();v.length||h.createEl("p",{text:"No profiles yet. Add one below."});for(let x of v){let S=h.createEl("details",{cls:"zrr-profile"});v.length===1&&(S.open=!0);let G=S.createEl("summary",{text:x.name||x.id||"Profile"});G.addClass("zrr-profile-title");let re=S.createDiv({cls:"zrr-profile-body"});new R.Setting(re).setName("Profile name").addText(ae=>ae.setPlaceholder("My provider").setValue(x.name||"").onChange(async le=>{x.name=le.trim(),G.textContent=x.name||x.id||"Profile",await t(n())})),new R.Setting(re).setName("Base URL").addText(ae=>ae.setPlaceholder("http://localhost:1234/v1").setValue(x.baseUrl||"").onChange(async le=>{x.baseUrl=le.trim(),await t(n())})),new R.Setting(re).setName("API key").setDesc("Stored in settings (not encrypted).").addText(ae=>{i(ae),ae.setPlaceholder("sk-...").setValue(x.apiKey||"").onChange(async le=>{x.apiKey=le.trim(),await t(n())})}),new R.Setting(re).setName("Remove profile").setDesc("Deletes this saved profile.").addButton(ae=>ae.setButtonText("Delete profile").onClick(async()=>{let le=n().filter(Un=>Un.id!==x.id);this.plugin.settings.embedProviderProfileId=this.plugin.settings.embedProviderProfileId===x.id?"":this.plugin.settings.embedProviderProfileId,this.plugin.settings.chatProviderProfileId=this.plugin.settings.chatProviderProfileId===x.id?"":this.plugin.settings.chatProviderProfileId,this.plugin.settings.llmCleanupProviderProfileId=this.plugin.settings.llmCleanupProviderProfileId===x.id?"":this.plugin.settings.llmCleanupProviderProfileId,await t(le),C()}))}new R.Setting(h).addButton(x=>x.setButtonText("Add profile").onClick(async()=>{let S=`profile-${Date.now().toString(36)}`,G=n().concat([{id:S,name:"Custom",baseUrl:"",apiKey:""}]);await t(G),C()}))};C(),f.createEl("h2",{text:"OCR cleanup"}),new R.Setting(f).setName("LLM cleanup for low-quality chunks").setDesc("Automatic AI cleanup for poor OCR at import. Can be slow/costly.").addToggle(v=>v.setValue(this.plugin.settings.enableLlmCleanup).onChange(async x=>{this.plugin.settings.enableLlmCleanup=x,await this.plugin.saveSettings()}));let k=null,E=null,P=null,w=async()=>{},D=async(v,x=!0)=>{let S=v.trim();this.plugin.settings.llmCleanupBaseUrl=S,x&&(this.plugin.settings.llmCleanupProviderProfileId="",k&&k.setValue("custom")),E&&E.setValue(S),await this.plugin.saveSettings()},I=async v=>{let x=n().find(S=>S.id===v);this.plugin.settings.llmCleanupProviderProfileId=v,x&&(this.plugin.settings.llmCleanupBaseUrl=x.baseUrl,this.plugin.settings.llmCleanupApiKey=x.apiKey,E==null||E.setValue(x.baseUrl),P==null||P.setValue(x.apiKey)),await this.plugin.saveSettings(),await w()};new R.Setting(f).setName("LLM cleanup provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(v=>{k=v,v.addOption("custom","Custom (manual)");for(let S of n())v.addOption(S.id,S.name||S.id);let x=this.plugin.settings.llmCleanupProviderProfileId;v.setValue(x&&n().some(S=>S.id===x)?x:"custom"),v.onChange(async S=>{if(S==="custom"){this.plugin.settings.llmCleanupProviderProfileId="",await this.plugin.saveSettings();return}await I(S)})}),new R.Setting(f).setName("LLM cleanup base URL").setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1").addText(v=>{E=v,v.setPlaceholder("http://127.0.0.1:1234/v1").setValue(this.plugin.settings.llmCleanupBaseUrl).onChange(async x=>{await D(x)})}),new R.Setting(f).setName("LLM cleanup API key").setDesc("Optional API key for the cleanup endpoint.").addText(v=>{P=v,i(v),v.setPlaceholder("sk-...").setValue(this.plugin.settings.llmCleanupApiKey).onChange(async x=>{this.plugin.settings.llmCleanupApiKey=x.trim(),this.plugin.settings.llmCleanupProviderProfileId="",k&&k.setValue("custom"),await this.plugin.saveSettings()})});let z=new R.Setting(f).setName("LLM cleanup model").setDesc("Select a cleanup-capable model from the provider."),N=null,F=v=>{if(!N)return;let x=(this.plugin.settings.llmCleanupModel||"").trim(),S=new Set(v.map(G=>G.value));x&&!S.has(x)&&(v=v.concat([{value:x,label:`Custom (${x})`}])),N.selectEl.options.length=0;for(let G of v)N.addOption(G.value,G.label);x&&N.setValue(x)};w=async()=>{if(N){N.setDisabled(!0);try{let v=await this.plugin.fetchCleanupModelOptions();F(v)}finally{N.setDisabled(!1)}}},z.addDropdown(v=>{N=v;let x=(this.plugin.settings.llmCleanupModel||"").trim();v.addOption(x||"loading","Loading..."),v.setValue(x||"loading"),v.onChange(async S=>{this.plugin.settings.llmCleanupModel=S.trim(),await this.plugin.saveSettings()})}),z.addButton(v=>{v.setButtonText("Refresh").onClick(async()=>{await w()})}),w(),new R.Setting(f).setName("LLM cleanup temperature").setDesc("Lower is more conservative.").addText(v=>v.setPlaceholder("0.0").setValue(String(this.plugin.settings.llmCleanupTemperature)).onChange(async x=>{let S=Number.parseFloat(x);this.plugin.settings.llmCleanupTemperature=Number.isFinite(S)?S:0,await this.plugin.saveSettings()})),new R.Setting(f).setName("LLM cleanup min quality").setDesc("Only run cleanup when chunk quality is below this threshold (0-1).").addSlider(v=>v.setLimits(0,1,.05).setValue(this.plugin.settings.llmCleanupMinQuality).setDynamicTooltip().onChange(async x=>{this.plugin.settings.llmCleanupMinQuality=x,await this.plugin.saveSettings()})),new R.Setting(f).setName("LLM cleanup max chars").setDesc("Skip cleanup for chunks longer than this limit.").addText(v=>v.setPlaceholder("2000").setValue(String(this.plugin.settings.llmCleanupMaxChars)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.llmCleanupMaxChars=Number.isFinite(S)?S:2e3,await this.plugin.saveSettings()})),f.createEl("h2",{text:"Text Embedding"});let O=null,V=null,X=null,T=async()=>{},q=async(v,x=!0)=>{let S=v.trim();this.plugin.settings.embedBaseUrl=S,x&&(this.plugin.settings.embedProviderProfileId="",O&&O.setValue("custom")),V&&V.setValue(S),await this.plugin.saveSettings()},H=async v=>{let x=n().find(S=>S.id===v);this.plugin.settings.embedProviderProfileId=v,x&&(this.plugin.settings.embedBaseUrl=x.baseUrl,this.plugin.settings.embedApiKey=x.apiKey,V==null||V.setValue(x.baseUrl),X==null||X.setValue(x.apiKey)),await this.plugin.saveSettings(),await T()};new R.Setting(f).setName("Embeddings provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(v=>{O=v,v.addOption("custom","Custom (manual)");for(let S of n())v.addOption(S.id,S.name||S.id);let x=this.plugin.settings.embedProviderProfileId;v.setValue(x&&n().some(S=>S.id===x)?x:"custom"),v.onChange(async S=>{if(S==="custom"){this.plugin.settings.embedProviderProfileId="",await this.plugin.saveSettings();return}await H(S)})}),new R.Setting(f).setName("Embeddings base URL").addText(v=>{V=v,v.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async x=>{await q(x)})}),new R.Setting(f).setName("Embeddings API key").addText(v=>{X=v,i(v),v.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async x=>{this.plugin.settings.embedApiKey=x.trim(),this.plugin.settings.embedProviderProfileId="",O&&O.setValue("custom"),await this.plugin.saveSettings()})});let Z=new R.Setting(f).setName("Embeddings model").setDesc("Select an embeddings model from the provider."),K=null,pe=v=>{if(!K)return;let x=(this.plugin.settings.embedModel||"").trim(),S=new Set(v.map(G=>G.value));x&&!S.has(x)&&(v=v.concat([{value:x,label:`Custom (${x})`}])),K.selectEl.options.length=0;for(let G of v)K.addOption(G.value,G.label);x&&K.setValue(x)};T=async()=>{if(K){K.setDisabled(!0);try{let v=await this.plugin.fetchEmbeddingModelOptions();pe(v)}finally{K.setDisabled(!1)}}},Z.addDropdown(v=>{K=v;let x=(this.plugin.settings.embedModel||"").trim();v.addOption(x||"loading","Loading..."),v.setValue(x||"loading"),v.onChange(async S=>{this.plugin.settings.embedModel=S.trim(),await this.plugin.saveSettings()})}),Z.addButton(v=>{v.setButtonText("Refresh").onClick(async()=>{await T()})}),T(),new R.Setting(f).setName("Include metadata in embeddings").setDesc("Prepend title/authors/tags/section info before embedding chunks.").addToggle(v=>v.setValue(this.plugin.settings.embedIncludeMetadata).onChange(async x=>{this.plugin.settings.embedIncludeMetadata=x,await this.plugin.saveSettings()})),new R.Setting(f).setName("Embedding context window (chunks)").setDesc("Include neighboring chunk text around each chunk when embedding (0 disables).").addText(v=>v.setPlaceholder("1").setValue(String(this.plugin.settings.embedContextWindow)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.embedContextWindow=Number.isFinite(S)?Math.max(0,S):1,await this.plugin.saveSettings()})),new R.Setting(f).setName("Embedding context snippet size (chars)").setDesc("Max chars per neighboring chunk included in embeddings.").addText(v=>v.setPlaceholder("220").setValue(String(this.plugin.settings.embedContextChars)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.embedContextChars=Number.isFinite(S)?Math.max(0,S):220,await this.plugin.saveSettings()})),new R.Setting(f).setName("Embedding subchunk size (chars)").setDesc("Split long chunks into smaller subchunks for embedding only (0 disables).").addText(v=>v.setPlaceholder("1800").setValue(String(this.plugin.settings.embedSubchunkChars)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.embedSubchunkChars=Number.isFinite(S)?Math.max(0,S):3500,await this.plugin.saveSettings()})),new R.Setting(f).setName("Embedding subchunk overlap (chars)").setDesc("Overlap between embedding subchunks to keep context intact.").addText(v=>v.setPlaceholder("200").setValue(String(this.plugin.settings.embedSubchunkOverlap)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.embedSubchunkOverlap=Number.isFinite(S)?Math.max(0,S):200,await this.plugin.saveSettings()})),new R.Setting(f).setName("Generate LLM tags for chunks").setDesc("Use the OCR cleanup model to tag chunks before indexing.").addToggle(v=>v.setValue(this.plugin.settings.enableChunkTagging).onChange(async x=>{this.plugin.settings.enableChunkTagging=x,await this.plugin.saveSettings()})),f.createEl("h2",{text:"Chat LLM"});let oe=null,ie=null,ue=null,_e=async()=>{},He=async(v,x=!0)=>{let S=v.trim();this.plugin.settings.chatBaseUrl=S,x&&(this.plugin.settings.chatProviderProfileId="",oe&&oe.setValue("custom")),ie&&ie.setValue(S),await this.plugin.saveSettings()},We=async v=>{let x=n().find(S=>S.id===v);this.plugin.settings.chatProviderProfileId=v,x&&(this.plugin.settings.chatBaseUrl=x.baseUrl,this.plugin.settings.chatApiKey=x.apiKey,ie==null||ie.setValue(x.baseUrl),ue==null||ue.setValue(x.apiKey)),await this.plugin.saveSettings(),await _e()};new R.Setting(f).setName("Chat provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(v=>{oe=v,v.addOption("custom","Custom (manual)");for(let S of n())v.addOption(S.id,S.name||S.id);let x=this.plugin.settings.chatProviderProfileId;v.setValue(x&&n().some(S=>S.id===x)?x:"custom"),v.onChange(async S=>{if(S==="custom"){this.plugin.settings.chatProviderProfileId="",await this.plugin.saveSettings();return}await We(S)})}),new R.Setting(f).setName("Chat base URL").setDesc("OpenAI-compatible base URL for chat requests.").addText(v=>{ie=v,v.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async x=>{await He(x)})}),new R.Setting(f).setName("Chat API key").addText(v=>{ue=v,i(v),v.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async x=>{this.plugin.settings.chatApiKey=x.trim(),this.plugin.settings.chatProviderProfileId="",oe&&oe.setValue("custom"),await this.plugin.saveSettings()})});let Ce=new R.Setting(f).setName("Chat model").setDesc("Select a chat-capable model from the provider."),ne=null,xe=v=>{if(!ne)return;let x=(this.plugin.settings.chatModel||"").trim(),S=new Set(v.map(G=>G.value));x&&!S.has(x)&&(v=v.concat([{value:x,label:`Custom (${x})`}])),ne.selectEl.options.length=0;for(let G of v)ne.addOption(G.value,G.label);x&&ne.setValue(x)};_e=async()=>{if(ne){ne.setDisabled(!0);try{let v=await this.plugin.fetchChatModelOptions();xe(v)}finally{ne.setDisabled(!1)}}},Ce.addDropdown(v=>{ne=v;let x=(this.plugin.settings.chatModel||"").trim();v.addOption(x||"loading","Loading..."),v.setValue(x||"loading"),v.onChange(async S=>{this.plugin.settings.chatModel=S.trim(),await this.plugin.saveSettings()})}),Ce.addButton(v=>{v.setButtonText("Refresh").onClick(async()=>{await _e()})}),_e(),new R.Setting(f).setName("Temperature").addText(v=>v.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async x=>{let S=Number.parseFloat(x);this.plugin.settings.chatTemperature=Number.isFinite(S)?S:.2,await this.plugin.saveSettings()})),new R.Setting(f).setName("Chat history messages").setDesc("Number of recent messages to include for conversational continuity (0 disables).").addText(v=>v.setPlaceholder("6").setValue(String(this.plugin.settings.chatHistoryMessages)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.chatHistoryMessages=Number.isFinite(S)?Math.max(0,S):6,await this.plugin.saveSettings()})),new R.Setting(f).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(v=>v.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async x=>{this.plugin.settings.chatPaneLocation=x,await this.plugin.saveSettings()})),f.createEl("h2",{text:"Retrieval"}),new R.Setting(f).setName("Enable query expansion").setDesc("Use the chat model to expand queries before retrieval.").addToggle(v=>v.setValue(this.plugin.settings.enableQueryExpansion).onChange(async x=>{this.plugin.settings.enableQueryExpansion=x,await this.plugin.saveSettings()})),new R.Setting(f).setName("Query expansion count").setDesc("Number of expansion variants to request.").addText(v=>v.setPlaceholder("3").setValue(String(this.plugin.settings.queryExpansionCount)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.queryExpansionCount=Number.isFinite(S)?Math.max(1,S):3,await this.plugin.saveSettings()})),new R.Setting(f).setName("Enable cross-encoder reranking").setDesc("Rerank candidates locally with sentence-transformers (downloads model on first use).").addToggle(v=>v.setValue(this.plugin.settings.enableCrossEncoderRerank).onChange(async x=>{this.plugin.settings.enableCrossEncoderRerank=x,await this.plugin.saveSettings()})),new R.Setting(f).setName("Cross-encoder model").setDesc("Local reranker model name or path.").addText(v=>v.setPlaceholder("BAAI/bge-reranker-v2-m3").setValue(this.plugin.settings.rerankModel).onChange(async x=>{this.plugin.settings.rerankModel=x.trim()||"BAAI/bge-reranker-v2-m3",await this.plugin.saveSettings()})),new R.Setting(f).setName("Rerank candidate multiplier").setDesc("Retrieve k \xD7 N candidates before reranking.").addText(v=>v.setPlaceholder("4").setValue(String(this.plugin.settings.rerankCandidateMultiplier)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.rerankCandidateMultiplier=Number.isFinite(S)?Math.max(1,S):4,await this.plugin.saveSettings()})),new R.Setting(f).setName("RRF k").setDesc("Rank fusion constant for blending lexical and vector results.").addText(v=>v.setPlaceholder("60").setValue(String(this.plugin.settings.rrfK)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.rrfK=Number.isFinite(S)?Math.max(1,S):60,await this.plugin.saveSettings()})),new R.Setting(f).setName("RRF log top N").setDesc("Log the top N RRF-ranked chunks to stderr (0 disables).").addText(v=>v.setPlaceholder("0").setValue(String(this.plugin.settings.rrfLogTop)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.rrfLogTop=Number.isFinite(S)?Math.max(0,S):0,await this.plugin.saveSettings()})),new R.Setting(f).setName("Max chunks per document").setDesc("Limit how many chunks from a single document can appear in retrieval (0 disables).").addText(v=>v.setPlaceholder("0").setValue(String(this.plugin.settings.maxChunksPerDoc)).onChange(async x=>{let S=Number.parseInt(x,10);this.plugin.settings.maxChunksPerDoc=Number.isFinite(S)?Math.max(0,S):0,await this.plugin.saveSettings()}))}},{id:"maintenance",label:"Maintenance",render:f=>{f.createEl("h2",{text:"Logging"}),new R.Setting(f).setName("Enable logging to file").setDesc("Write plugin logs to a file.").addToggle(h=>h.setValue(this.plugin.settings.enableFileLogging).onChange(async C=>{this.plugin.settings.enableFileLogging=C,await this.plugin.saveSettings()})),new R.Setting(f).setName("Log file path (vault-relative)").setDesc("Where to write the log file. Keep inside the vault.").addText(h=>h.setPlaceholder(`${J}/logs/docling_extract.log`).setValue(this.plugin.settings.logFilePath).onChange(async C=>{this.plugin.settings.logFilePath=C.trim()||`${J}/logs/docling_extract.log`,await this.plugin.saveSettings()})),new R.Setting(f).setName("View or clear log").setDesc("Open the log file or clear it.").addButton(h=>h.setButtonText("Open log").onClick(async()=>{var C,k;await((k=(C=this.plugin).openLogFile)==null?void 0:k.call(C))})).addButton(h=>h.setButtonText("Clear log").onClick(async()=>{var C,k;await((k=(C=this.plugin).clearLogFile)==null?void 0:k.call(C))})),f.createEl("h2",{text:"Maintenance"}),new R.Setting(f).setName("Reindex Redis from cached chunks").setDesc("Rebuild the Redis index from cached chunk JSON files.").addButton(h=>h.setButtonText("Reindex").onClick(async()=>{await this.plugin.reindexRedisFromCache()})),new R.Setting(f).setName("Recreate missing notes from cache").setDesc("Rebuild missing notes using cached Zotero items and chunks.").addButton(h=>h.setButtonText("Recreate").onClick(async()=>{await this.plugin.recreateMissingNotesFromCache()})).addButton(h=>h.setButtonText("Cancel").onClick(()=>{this.plugin.cancelRecreateMissingNotesFromCache()}))}}],c=new Map,_=new Map,g=f=>{this.activeTab=f;for(let[h,C]of c){let k=h===f;C.classList.toggle("is-active",k),C.setAttribute("aria-selected",k?"true":"false"),C.setAttribute("tabindex",k?"0":"-1")}for(let[h,C]of _){let k=h===f;C.classList.toggle("is-active",k),C.hidden=!k}},y=e.createDiv({cls:"zrr-settings-tabs"});y.setAttribute("role","tablist");let b=e.createDiv({cls:"zrr-settings-tabs-panels"});for(let f of d){let h=y.createEl("button",{text:f.label,cls:"zrr-settings-tab-button"}),C=`zrr-settings-tab-${f.id}`,k=`zrr-settings-panel-${f.id}`;h.type="button",h.id=C,h.setAttribute("role","tab"),h.setAttribute("aria-controls",k),h.setAttribute("aria-selected","false"),h.addEventListener("click",()=>g(f.id));let E=b.createDiv({cls:"zrr-settings-tab-panel"});E.id=k,E.setAttribute("role","tabpanel"),E.setAttribute("aria-labelledby",C),E.hidden=!0,f.render(E),c.set(f.id,h),_.set(f.id,E)}let L=d.some(f=>f.id===this.activeTab)?this.activeTab:d[0].id;g(L)}};var yn=require("@codemirror/state"),bn=require("@codemirror/view"),te=require("obsidian");var nt=u=>{let p=u.scrollDOM.getBoundingClientRect(),e=u.posAtCoords({x:p.left+8,y:+p.height*.25});return e===null?null:u.state.doc.lineAt(e).number},Re=class{constructor(p,e){this.pdfSidebarLeaf=null;this.pdfSidebarDocId=null;this.pdfSidebarPdfPath=null;this.pdfSidebarPage=null;this.pendingPdfSync=null;this.chunkPageCache=new Map;this.previewScrollEl=null;this.previewScrollHandler=null;this.previewScrollFrame=null;this.deps=p,this.helpers=e}createSyncExtension(){let p=this,e=this.helpers;return bn.ViewPlugin.fromClass(class{constructor(n){this.docId=null;this.lastPage=null;this.lastChunkId=null;this.scrollFrame=null;this.view=n,this.docId=e.extractDocIdFromDoc(n.state.doc),this.onScroll=()=>this.scheduleSync(!1),n.scrollDOM.addEventListener("scroll",this.onScroll,{passive:!0}),this.scheduleSync(!0)}update(n){n.docChanged&&(this.docId=e.extractDocIdFromDoc(n.view.state.doc),this.lastPage=null,this.lastChunkId=null),(n.docChanged||n.viewportChanged)&&this.scheduleSync(!1)}destroy(){this.view.scrollDOM.removeEventListener("scroll",this.onScroll),this.scrollFrame!==null&&(window.cancelAnimationFrame(this.scrollFrame),this.scrollFrame=null)}scheduleSync(n){this.scrollFrame===null&&(this.scrollFrame=window.requestAnimationFrame(()=>{this.scrollFrame=null,this.syncPdfSidebar(this.view,n)}))}syncPdfSidebar(n,t){var _,g;let i=this.docId;if(!i)return;let r=nt(n);if(r===null)return;let s=e.findChunkStartLineInDoc(n.state.doc,r);if(!s)return;let a=e.parseChunkMarkerLine(s.text),o=(_=a==null?void 0:a.pageNumber)!=null?_:null,l=(g=a==null?void 0:a.chunkId)!=null?g:null;if(!o&&!l)return;let d=o!==null&&this.lastPage===o,c=o===null&&l!==null&&this.lastChunkId===l;!t&&(d||c)||(this.lastPage=o,this.lastChunkId=l,p.syncPdfSidebarForDoc(i,o!=null?o:void 0,l!=null?l:void 0))}})}async maybeSyncPendingPdf(){var e,n;if(!this.pendingPdfSync||(!this.pdfSidebarLeaf||((n=(e=this.pdfSidebarLeaf.view)==null?void 0:e.getViewType)==null?void 0:n.call(e))!=="pdf")&&!await this.getPdfSidebarLeaf()||!this.pdfSidebarLeaf||!this.isLeafTabActive(this.pdfSidebarLeaf))return;let p=this.pendingPdfSync;this.pendingPdfSync=null,await this.syncPdfSidebarForDoc(p.docId,p.pageNumber,p.chunkId)}updatePreviewScrollHandler(){var t;let p=this.deps.app.workspace.getActiveViewOfType(te.MarkdownView);if(!p||p.getMode()!=="preview"){this.detachPreviewScrollHandler();return}let e=(t=p.previewMode)==null?void 0:t.containerEl;if(!e){this.detachPreviewScrollHandler();return}if(this.previewScrollEl===e)return;this.detachPreviewScrollHandler();let n=()=>this.schedulePreviewSync(p);e.addEventListener("scroll",n,{passive:!0}),this.previewScrollEl=e,this.previewScrollHandler=n,this.schedulePreviewSync(p)}async syncPdfSidebarForFile(p){try{let e=await this.deps.app.vault.read(p),n=await this.deps.resolveDocIdForNote(p,e);if(!n)return;let t=this.helpers.extractFirstChunkMarkerFromContent(e);await this.syncPdfSidebarForDoc(n,t==null?void 0:t.pageNumber,t==null?void 0:t.chunkId)}catch(e){console.warn("Failed to sync PDF sidebar for opened note",e)}}async syncPdfSidebarForDoc(p,e,n){if(!p)return;let t=await this.deps.getDocIndexEntry(p);t||(t=await this.deps.hydrateDocIndexFromCache(p));let i=t!=null&&t.pdf_path?String(t.pdf_path):"";if(!i)return;let r=this.deps.toVaultRelativePath(i);if(!r){let g=(0,te.normalizePath)(i);this.deps.app.vault.getAbstractFileByPath(g)instanceof te.TFile&&(r=g)}if(!r)return;let s=this.deps.app.vault.getAbstractFileByPath(r);if(!(s instanceof te.TFile)||s.extension.toLowerCase()!=="pdf")return;let a=await this.getPdfSidebarLeaf();if(!a){this.pendingPdfSync={docId:p,pageNumber:e,chunkId:n};return}if(this.updatePdfSidebarIcon(a),!this.isLeafTabActive(a)){this.pendingPdfSync={docId:p,pageNumber:e,chunkId:n};return}let o=Number.isFinite(e!=null?e:NaN)?Number(e):null;if(o===null&&n&&(o=await this.resolvePageNumberForChunk(p,n)),o===null||this.pdfSidebarDocId===p&&this.pdfSidebarPdfPath===s.path&&this.pdfSidebarPage===o)return;this.pdfSidebarDocId=p,this.pdfSidebarPdfPath=s.path,this.pdfSidebarPage=o;let l=r,d=o!==null?`${l}#page=${o}`:l,c=this.deps.app.workspace,_=c.getMostRecentLeaf();c.setActiveLeaf(a,{focus:!1});try{await this.openPdfLinkInLeaf(a,d),this.updatePdfSidebarIcon(a)}finally{_&&c.setActiveLeaf(_,{focus:!1})}}detachPreviewScrollHandler(){this.previewScrollEl&&this.previewScrollHandler&&this.previewScrollEl.removeEventListener("scroll",this.previewScrollHandler),this.previewScrollEl=null,this.previewScrollHandler=null,this.previewScrollFrame!==null&&(window.cancelAnimationFrame(this.previewScrollFrame),this.previewScrollFrame=null)}schedulePreviewSync(p){this.previewScrollFrame===null&&(this.previewScrollFrame=window.requestAnimationFrame(()=>{this.previewScrollFrame=null,this.syncPdfSidebarForPreview(p)}))}syncPdfSidebarForPreview(p){let e=this.previewScrollEl;if(!e)return;let n=p.getViewData();if(!n)return;let t=yn.Text.of(n.split(/\r?\n/)),i=this.helpers.extractDocIdFromDoc(t);if(!i)return;let r=this.getPreviewTopLineNumber(e);if(r===null)return;let s=this.helpers.findChunkStartLineInDoc(t,r+1);if(!s)return;let a=this.helpers.parseChunkMarkerLine(s.text);!(a!=null&&a.pageNumber)&&!(a!=null&&a.chunkId)||this.syncPdfSidebarForDoc(i,a==null?void 0:a.pageNumber,a==null?void 0:a.chunkId)}getPreviewTopLineNumber(p){var t;let e=p.getBoundingClientRect().top,n=p.querySelectorAll("[data-line]");for(let i of Array.from(n))if(i.getBoundingClientRect().bottom>=e+2){let s=(t=i.getAttribute("data-line"))!=null?t:"",a=Number.parseInt(s,10);if(Number.isFinite(a))return a}return null}async getPdfSidebarLeaf(){var t,i;if(this.pdfSidebarLeaf&&((i=(t=this.pdfSidebarLeaf.view)==null?void 0:t.getViewType)==null?void 0:i.call(t))==="pdf")return this.pdfSidebarLeaf;let p=this.deps.app.workspace;if(typeof p.ensureSideLeaf=="function")try{let r=await p.ensureSideLeaf("pdf","right",{active:!1,split:!1,reveal:!0});return this.isRightSidebarLeaf(r)?(this.pdfSidebarLeaf=r,this.updatePdfSidebarIcon(r),r):null}catch(r){console.warn("Failed to ensure PDF side leaf",r)}let e=this.deps.app.workspace.getRightLeaf(!1);if(e&&this.isRightSidebarLeaf(e))return this.pdfSidebarLeaf=e,this.updatePdfSidebarIcon(e),e;let n=this.deps.app.workspace.getRightLeaf(!0);return n&&this.isRightSidebarLeaf(n)?(this.pdfSidebarLeaf=n,this.updatePdfSidebarIcon(n),n):null}isRightSidebarLeaf(p){if(!p)return!1;let n=p.containerEl;return!!(n!=null&&n.closest(".workspace-split.mod-right-split, .mod-right-split"))}updatePdfSidebarIcon(p){if(!p||!this.isRightSidebarLeaf(p))return;let n=p.containerEl,t=[];n&&t.push(...Array.from(n.querySelectorAll(".view-header-icon")));let i=p;if(i.tabHeaderEl&&t.push(...Array.from(i.tabHeaderEl.querySelectorAll(".workspace-tab-header-inner-icon, .view-header-icon"))),i.tabHeaderInnerIconEl&&t.push(i.tabHeaderInnerIconEl),t.length===0)return;let r=new Set;for(let a of t)r.has(a)||(r.add(a),a.innerHTML="",(0,te.setIcon)(a,"zrr-pdf"),!a.querySelector("svg")&&this.deps.iconSvg&&(a.innerHTML=this.deps.iconSvg),a.dataset&&(a.dataset.zrrIcon="zrr-pdf"));let s=p.view;s.icon="zrr-pdf",typeof s.getIcon=="function"&&(s.getIcon=()=>"zrr-pdf")}async openPdfLinkInLeaf(p,e){var r,s,a;let n=(r=this.getPluginsRegistry())==null?void 0:r["pdf-plus"],t=(a=(s=n==null?void 0:n.lib)==null?void 0:s.workspace)==null?void 0:a.openPDFLinkTextInLeaf;if(typeof t=="function"){await t.call(n.lib.workspace,p,e,"",{active:!1});return}let i=p;if(typeof i.openLinkText=="function"){await i.openLinkText(e,"",{active:!1});return}await this.deps.app.workspace.openLinkText(e,"",!1)}getPluginsRegistry(){var p;return(p=this.deps.app.plugins)==null?void 0:p.plugins}isLeafTabActive(p){var i;let e=p;if((i=e.parent)!=null&&i.activeLeaf)return e.parent.activeLeaf===p;let n=e.containerEl;if(n!=null&&n.classList.contains("is-active")||n!=null&&n.classList.contains("mod-active"))return!0;let t=e.tabHeaderEl;return!!(t!=null&&t.classList.contains("is-active")||t!=null&&t.classList.contains("mod-active"))}async resolvePageNumberForChunk(p,e){var l,d,c,_,g;if(!p||!e)return null;let n=this.deps.normalizeChunkIdForNote(e,p)||e,t=this.chunkPageCache.get(p);if(t&&t.has(n))return(l=t.get(n))!=null?l:null;let i=(0,te.normalizePath)(`${U}/${p}.json`);if(!await this.deps.app.vault.adapter.exists(i))return null;let s=await this.deps.readChunkPayload(i),a=Array.isArray(s==null?void 0:s.chunks)?s==null?void 0:s.chunks:[],o=new Map;for(let y of a){let b=typeof(y==null?void 0:y.chunk_id)=="string"?y.chunk_id.trim():"";if(!b)continue;let L=Number.isFinite((d=y==null?void 0:y.page_start)!=null?d:NaN)?Number(y.page_start):null,f=Number.isFinite((c=y==null?void 0:y.page_end)!=null?c:NaN)?Number(y.page_end):null,h=L!=null?L:f;h!==null&&(o.set(b,h),o.set(`${p}:${b}`,h))}return this.chunkPageCache.set(p,o),(g=(_=o.get(n))!=null?_:o.get(e))!=null?g:null}};var Ne={"zrr-picker":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="3"/>
  <path d="M7.5 8h9"/>
  <path d="M16.5 8 7.5 16"/>
  <path d="M7.5 16h9"/>
</svg>
`,"zrr-chat":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="m6.67,4.05l10.65,0a2.66,2.66 0 0 1 2.66,2.66l0,10.63a2.66,2.66 0 0 1 -2.66,2.66l-7.31,0l-3.36,2.85l0.02,-2.85a2.66,2.66 0 0 1 -2.66,-2.66l0,-10.63a2.66,2.66 0 0 1 2.66,-2.66z"/>
  <path d="m7.5,8l9,0"/>
  <path d="m16.5,8l-9,8"/>
  <path d="m7.5,16l9,0"/>
</svg>
`,"zrr-pdf":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="3"/>
  <path d="M6.2242988 6.2079436H11.186473"/>
  <path d="M11.186473 6.2079436L6.2242988 12.497067"/>
  <path d="M6.2242988 12.497067H11.186473"/>
  <path d="M14.058248 6.2669861H17.916907"/>
  <path d="M14.129658 10.958704H17.988318"/>
  <path d="M6.2694512 16.288346H17.916711"/>
</svg>
`};var ce=require("@codemirror/state"),ee=require("@codemirror/view"),j=require("obsidian");var M=u=>{if(typeof u=="string")return u.trim();if(typeof u=="number"&&Number.isFinite(u))return String(u);if(Array.isArray(u))for(let p of u){if(typeof p=="string"&&p.trim())return p.trim();if(typeof p=="number"&&Number.isFinite(p))return String(p)}if(u&&typeof u=="object"){let p=u[0];if(typeof p=="string"&&p.trim())return p.trim();if(typeof p=="number"&&Number.isFinite(p))return String(p)}return""},xn=u=>{let p=[u.key,u.itemKey,u.id,u.citationKey];for(let e of p)if(typeof e=="string"&&e.trim())return e.trim();return null},kn=u=>{var e,n,t;let p=(t=(n=u.key)!=null?n:(e=u.data)==null?void 0:e.key)!=null?t:"";return typeof p=="string"?p:""},Qe=u=>{if(!u)return"";let p=u.match(/\b(\d{4})\b/);return p?p[1]:""},vn=u=>{var e,n,t,i;let p=(i=(t=(e=u.meta)==null?void 0:e.parsedDate)!=null?t:(n=u.data)==null?void 0:n.date)!=null?i:"";return typeof p!="string"?"":Qe(p)},me=u=>{if(!u||typeof u!="object")return"";if(u.name)return String(u.name);let p=u.firstName?String(u.firstName):"",e=u.lastName?String(u.lastName):"";return[e,p].filter(Boolean).join(", ")||`${p} ${e}`.trim()},wn=(u,p)=>{let e=[p==null?void 0:p["citation-key"],p==null?void 0:p.citationKey,p==null?void 0:p.citationkey,p==null?void 0:p.citekey,p==null?void 0:p.citeKey,p==null?void 0:p.betterBibtexKey,p==null?void 0:p.betterbibtexkey,u["citation-key"],u.citationKey,u.citationkey,u.citekey,u.citeKey,u.betterBibtexKey,u.betterbibtexkey];for(let i of e){let r=M(i);if(r)return r}let n=typeof u.extra=="string"?u.extra:"";if(!n)return"";let t=n.split(/\r?\n/);for(let i of t){let r=i.match(/^\s*biblatexcitekey\s*\[([^\]]+)\]\s*$/i);if(r&&r[1])return r[1].trim();let s=i.match(/^\s*(citation key|citationkey|citekey|citation-key|bibtex key|bibtexkey|bibtex)\s*:\s*(.+)\s*$/i);if(s&&s[2])return s[2].trim()}return""},Pn=u=>{if(!u)return"";let p=[u["citation-key"],u.citationKey,u.citationkey,u.citekey,u.citation_key];for(let e of p){let n=M(e);if(n)return n}return""},Cn=u=>{var e,n;if(!u)return"";let p=(n=(e=u["title-short"])!=null?e:u.shortTitle)!=null?n:u.short_title;return typeof p=="string"?p.trim():""},he=u=>{let p=M(u.shortTitle);if(p)return p;let e=M(u.short_title);if(e)return e;let n=M(u["title-short"]);return n||""},Ln=u=>{let p=typeof u.extra=="string"?u.extra:"";if(!p)return"";let e=p.split(/\r?\n/);for(let t of e){let i=t.match(/^\s*doi\s*:\s*(.+)\s*$/i);if(i&&i[1])return i[1].trim().replace(/[.,;]+$/,"")}let n=p.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i);return n?n[0].replace(/[.,;]+$/,""):""},Sn=u=>{var e;if(!u)return"";let p=(e=u.DOI)!=null?e:u.doi;return typeof p=="string"?p.trim().replace(/[.,;]+$/,""):""},tt=u=>{if(!u)return[];let p=[u.attachments,u.children,u.items,u.attachment,u.allAttachments],e=[];for(let n of p)n&&(Array.isArray(n)?e.push(...n):typeof n=="object"&&e.push(n));return e},it=u=>{var n,t,i,r,s,a,o,l,d,c,_,g,y,b,L;if(((a=(s=(i=(n=u==null?void 0:u.contentType)!=null?n:u==null?void 0:u.mimeType)!=null?i:(t=u==null?void 0:u.data)==null?void 0:t.contentType)!=null?s:(r=u==null?void 0:u.data)==null?void 0:r.mimeType)!=null?a:"")==="application/pdf")return!0;let e=(L=(b=(g=(_=(d=(o=u==null?void 0:u.filename)!=null?o:u==null?void 0:u.fileName)!=null?d:(l=u==null?void 0:u.data)==null?void 0:l.filename)!=null?_:(c=u==null?void 0:u.data)==null?void 0:c.fileName)!=null?g:u==null?void 0:u.path)!=null?b:(y=u==null?void 0:u.data)==null?void 0:y.path)!=null?L:"";return!!(typeof e=="string"&&e.toLowerCase().endsWith(".pdf"))},An=u=>{var n;let p=tt(u.data);if(p.length>0)return p.some(i=>it(i))?"yes":"no";let e=(n=u.meta)==null?void 0:n.numChildren;return typeof e=="number"&&e===0?"no":"unknown"};var En=[{label:"Auto (no hint)",value:""},{label:"English (en)",value:"en"},{label:"German (de)",value:"de"},{label:"German + English (de,en)",value:"de,en"},{label:"French (fr)",value:"fr"},{label:"Spanish (es)",value:"es"},{label:"Italian (it)",value:"it"},{label:"Dutch (nl)",value:"nl"},{label:"Portuguese (pt)",value:"pt"},{label:"Polish (pl)",value:"pl"},{label:"Swedish (sv)",value:"sv"},{label:"Other (custom ISO code)",value:"__custom__"}],rt=u=>u.includes("STDERR")?"zrr-log-stderr":u.includes("ERROR")?"zrr-log-error":u.includes("WARNING")||u.includes("WARN")?"zrr-log-warning":u.includes("INFO")?"zrr-log-info":null,Rn=u=>{let p=new ce.RangeSetBuilder;for(let{from:e,to:n}of u.visibleRanges){let t=e;for(;t<=n;){let i=u.state.doc.lineAt(t),r=rt(i.text);r&&p.add(i.from,i.from,ee.Decoration.line({class:r})),t=i.to+1}}return p.finish()},Nn=ee.EditorView.theme({".cm-editor":{height:"100%",display:"flex",flexDirection:"column",minHeight:"0"},".cm-scroller":{fontFamily:"var(--font-monospace)",fontSize:"0.85rem",flex:"1",height:"100%",maxHeight:"100%",overflow:"auto"},".zrr-log-error":{color:"var(--text-error)"},".zrr-log-warning":{color:"var(--text-accent)"},".zrr-log-info":{color:"var(--text-muted)"},".zrr-log-stderr":{color:"var(--text-accent)"}}),Dn=ee.ViewPlugin.fromClass(class{constructor(u){this.decorations=Rn(u)}update(u){(u.docChanged||u.viewportChanged)&&(this.decorations=Rn(u.view))}},{decorations:u=>u.decorations}),ve=class extends j.Modal{constructor(p,e,n,t,i="Value cannot be empty."){super(p),this.titleText=e,this.placeholder=n,this.onSubmit=t,this.emptyMessage=i}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:this.titleText});let e=p.createEl("input",{type:"text",placeholder:this.placeholder});e.style.width="100%",e.focus();let n=p.createEl("button",{text:"Submit"});n.style.marginTop="0.75rem";let t=()=>{let i=e.value.trim();if(!i){new j.Notice(this.emptyMessage);return}this.close(),this.onSubmit(i)};n.addEventListener("click",t),e.addEventListener("keydown",i=>{i.key==="Enter"&&t()})}},De=class extends j.Modal{constructor(p,e,n,t,i){super(p),this.chunkId=e,this.initialTags=n,this.onSubmit=t,this.onRegenerate=i}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:`Edit tags for ${this.chunkId}`});let e=p.createEl("textarea",{attr:{rows:"3"}});e.style.width="100%",e.placeholder="tag1, tag2, tag3",e.value=this.initialTags.join(", "),e.focus();let n=p.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Save tags"}),i=async()=>{let s=(e.value||"").split(/[,;\n]+/).map(o=>o.trim()).filter(o=>o.length>0),a=Array.from(new Set(s));this.close(),await Promise.resolve(this.onSubmit(a))};if(this.onRegenerate){let r=n.createEl("button",{text:"Regenerate"});r.addEventListener("click",async()=>{var s;r.setAttribute("disabled","true"),t.setAttribute("disabled","true");try{let a=await((s=this.onRegenerate)==null?void 0:s.call(this));a&&a.length>0?(e.value=a.join(", "),await Promise.resolve(this.onSubmit(a))):a&&new j.Notice("No tags were generated.")}finally{r.removeAttribute("disabled"),t.removeAttribute("disabled")}})}t.addEventListener("click",i),e.addEventListener("keydown",r=>{r.key==="Enter"&&(r.metaKey||r.ctrlKey)&&i()})}},Te=class extends j.Modal{constructor(p,e,n,t=""){super(p),this.titleText=e,this.content=n,this.noteText=t}onOpen(){let{contentEl:p}=this;if(p.empty(),p.createEl("h3",{text:this.titleText}),this.noteText){let n=p.createEl("div",{text:this.noteText});n.className="zrr-indexed-note"}let e=p.createEl("textarea",{attr:{rows:"12",readonly:"true"}});e.style.width="100%",e.value=this.content}},Oe=class extends j.Modal{constructor(e,n,t=""){super(e);this.bodyText="";this.plugin=n,this.initialTerm=t}onOpen(){let{contentEl:e}=this;e.empty(),this.modalEl&&(this.modalEl.style.width="80vw",this.modalEl.style.maxWidth="1200px",this.modalEl.style.height="80vh",this.modalEl.style.maxHeight="90vh",this.modalEl.style.resize="both",this.modalEl.style.overflow="hidden"),e.style.display="flex",e.style.flexDirection="column",e.style.height="100%",e.style.overflow="hidden",e.style.minHeight="0";let n=e.createDiv();n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="space-between",n.style.gap="0.5rem",n.createEl("h3",{text:"Redis index search"});let t=n.createEl("button",{text:"Copy All"});t.style.marginLeft="auto",t.addEventListener("click",()=>{this.copyResultsToClipboard()});let i=e.createDiv();i.style.display="flex",i.style.alignItems="center",i.style.gap="0.5rem",i.style.margin="0.5rem 0";let r=i.createEl("input");r.type="text",r.placeholder="Search term",r.value=this.initialTerm,r.style.flex="1",r.style.minWidth="0",this.inputEl=r,i.createEl("button",{text:"Search"}).addEventListener("click",()=>{this.runSearch()}),r.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),this.runSearch())});let a=e.createDiv();a.style.color="var(--text-muted)",a.style.marginBottom="0.5rem",this.statusEl=a;let o=e.createDiv();o.style.flex="1 1 0",o.style.minHeight="0",o.style.border="1px solid var(--background-modifier-border)",o.style.borderRadius="6px",o.style.display="flex",o.style.flexDirection="column",o.style.overflow="auto";let l=ce.EditorState.create({doc:this.bodyText,extensions:[Nn,Dn,ee.EditorView.editable.of(!1),ce.EditorState.readOnly.of(!0),ee.EditorView.lineWrapping]});this.editorView=new ee.EditorView({state:l,parent:o}),this.initialTerm&&this.runSearch()}onClose(){var e;(e=this.editorView)==null||e.destroy(),this.editorView=void 0}async runSearch(){var t;let e=(((t=this.inputEl)==null?void 0:t.value)||"").trim();if(!e){this.statusEl&&(this.statusEl.textContent="Enter a search term.");return}this.statusEl&&(this.statusEl.textContent="Searching...");let n=await this.plugin.runRedisSearch(e);this.updateEditor(n),this.statusEl&&(this.statusEl.textContent=`Results for "${e}"`)}updateEditor(e){if(!this.editorView)return;let n=this.editorView,t=n.scrollDOM.scrollTop,i=n.state.selection.main,r=e.length,s=Math.min(i.anchor,r),a=Math.min(i.head,r);n.dispatch({changes:{from:0,to:n.state.doc.length,insert:e},selection:{anchor:s,head:a}}),n.scrollDOM.scrollTop=t,this.bodyText=e}copyResultsToClipboard(){let e=this.bodyText||"";if(!e){new j.Notice("Nothing to copy.");return}navigator.clipboard.writeText(e).then(()=>new j.Notice("Results copied to clipboard.")).catch(()=>new j.Notice("Failed to copy results."))}},ye=class extends j.Modal{constructor(p,e,n,t){super(p),this.titleText=e,this.bodyText=n,this.options=t}onOpen(){var r,s,a,o;let{contentEl:p}=this;p.empty(),this.modalEl&&(this.modalEl.style.width="80vw",this.modalEl.style.maxWidth="1200px",this.modalEl.style.height="80vh",this.modalEl.style.maxHeight="90vh",this.modalEl.style.resize="both",this.modalEl.style.overflow="hidden"),p.style.display="flex",p.style.flexDirection="column",p.style.height="100%",p.style.overflow="hidden",p.style.minHeight="0";let e=p.createDiv();e.style.display="flex",e.style.alignItems="center",e.style.justifyContent="space-between",e.style.gap="0.5rem",e.createEl("h3",{text:this.titleText});let n=e.createDiv();if(n.style.display="flex",n.style.gap="0.5rem",(r=this.options)!=null&&r.onClear){let l=(s=this.options.clearLabel)!=null?s:"Clear log";n.createEl("button",{text:l}).addEventListener("click",async()=>{var c,_;try{await((_=(c=this.options)==null?void 0:c.onClear)==null?void 0:_.call(c))}finally{await this.refreshFromSource()}})}let t=p.createDiv();t.style.flex="1 1 0",t.style.minHeight="0",t.style.border="1px solid var(--background-modifier-border)",t.style.borderRadius="6px",t.style.display="flex",t.style.flexDirection="column",t.style.overflow="auto";let i=ce.EditorState.create({doc:this.bodyText,extensions:[Nn,Dn,ee.EditorView.editable.of(!0),ce.EditorState.readOnly.of(!1),ee.EditorView.lineWrapping]});if(this.editorView=new ee.EditorView({state:i,parent:t}),this.refreshFromSource(),(a=this.options)!=null&&a.autoRefresh&&this.options.onRefresh){let l=(o=this.options.refreshIntervalMs)!=null?o:2e3;this.refreshTimer=window.setInterval(()=>{this.refreshFromSource()},l)}}onClose(){var p;this.refreshTimer!==void 0&&(window.clearInterval(this.refreshTimer),this.refreshTimer=void 0),(p=this.editorView)==null||p.destroy(),this.editorView=void 0}async refreshFromSource(){var a;if(!((a=this.options)!=null&&a.onRefresh)||!this.editorView)return;let p="";try{p=await this.options.onRefresh()||""}catch(o){return}if(p===this.bodyText)return;let e=this.editorView,n=e.scrollDOM.scrollTop,t=e.state.selection.main,i=p.length,r=Math.min(t.anchor,i),s=Math.min(t.head,i);e.dispatch({changes:{from:0,to:e.state.doc.length,insert:p},selection:{anchor:r,head:s}}),e.scrollDOM.scrollTop=n,this.bodyText=p}},Ie=class extends j.Modal{constructor(e,n,t){super(e);this.resolved=!1;this.filePath=n,this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Overwrite existing note?"}),e.createEl("p",{text:`This will overwrite: ${this.filePath}`});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Overwrite"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},Fe=class extends j.Modal{constructor(e,n,t,i){super(e);this.resolved=!1;this.notePath=n,this.docId=t,this.onResolve=i}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Delete note and cached data?"}),e.createEl("p",{text:`This will delete the note and cached chunks/items for doc_id ${this.docId}.`}),e.createEl("p",{text:`Note: ${this.notePath}`});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Delete"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},ze=class extends j.Modal{constructor(e,n,t){super(e);this.resolved=!1;this.reason=n,this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Rebuild Redis index?"}),e.createEl("p",{text:this.reason}),e.createEl("p",{text:"This will drop the RedisSearch index (and embeddings) and rebuild it from cached chunks."});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Drop & rebuild"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},Me=class extends j.Modal{constructor(e,n){super(e);this.resolved=!1;this.onResolve=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Purge Redis orphaned chunks?"}),e.createEl("p",{text:"This removes Redis chunk keys that have no cached item.json or chunk.json on disk."}),e.createEl("p",{text:"Cache files are not deleted. Use this to clean up stale Redis data."});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Purge orphans"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},qe=class extends j.Modal{constructor(e,n,t,i,r,s,a){super(e);this.resolved=!1;this.fieldLabel=n,this.noteLabel=t,this.zoteroLabel=i,this.noteValue=r,this.zoteroValue=s,this.onResolve=a}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:`Resolve metadata conflict: ${this.fieldLabel}`});let n=e.createEl("div");n.style.display="grid",n.style.gap="0.5rem",n.createEl("div",{text:"Note value"});let t=n.createEl("textarea",{attr:{readonly:"true",rows:"4"}});t.style.width="100%",t.value=this.noteValue||"(empty)",n.createEl("div",{text:"Zotero value"});let i=n.createEl("textarea",{attr:{readonly:"true",rows:"4"}});i.style.width="100%",i.value=this.zoteroValue||"(empty)";let r=e.createEl("div");r.style.display="flex",r.style.gap="0.5rem",r.style.marginTop="0.75rem";let s=r.createEl("button",{text:this.noteLabel}),a=r.createEl("button",{text:this.zoteroLabel}),o=r.createEl("button",{text:"Skip"});s.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve("note")}),a.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve("zotero")}),o.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve("skip")})}onClose(){this.resolved||this.onResolve("skip")}},je=class extends j.Modal{constructor(e,n,t){super(e);this.resolved=!1;this.selects=new Map;this.conflicts=n,this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Resolve metadata conflicts"}),e.createEl("p",{text:"Choose which values to keep for each field."});let n=e.createEl("div");n.style.display="grid",n.style.gap="0.75rem";for(let l of this.conflicts){let d=n.createEl("div");d.style.display="grid",d.style.gap="0.4rem",d.style.border="1px solid var(--background-modifier-border)",d.style.borderRadius="6px",d.style.padding="0.6rem",d.createEl("div",{text:l.fieldLabel}).style.fontWeight="600";let c=d.createEl("div");c.style.display="grid",c.style.gridTemplateColumns="1fr 1fr",c.style.gap="0.5rem";let _=c.createEl("textarea",{attr:{readonly:"true",rows:"3"}});_.style.width="100%",_.value=l.noteValue||"(empty)";let g=c.createEl("textarea",{attr:{readonly:"true",rows:"3"}});g.style.width="100%",g.value=l.zoteroValue||"(empty)";let y=d.createEl("div");y.style.display="flex",y.style.gap="0.5rem",y.style.alignItems="center",y.createEl("span",{text:"Decision:"});let b=y.createEl("select");b.add(new Option(l.noteLabel,"note")),b.add(new Option(l.zoteroLabel,"zotero")),b.add(new Option("Skip","skip")),b.value="skip",this.selects.set(l.field,b)}let t=e.createEl("div");t.style.display="flex",t.style.flexWrap="wrap",t.style.gap="0.5rem",t.style.marginTop="0.75rem";let i=l=>{for(let d of this.selects.values())d.value=l},r=t.createEl("button",{text:"Use note for all"}),s=t.createEl("button",{text:"Use Zotero for all"}),a=t.createEl("button",{text:"Skip all"}),o=t.createEl("button",{text:"Apply"});r.addEventListener("click",()=>i("note")),s.addEventListener("click",()=>i("zotero")),a.addEventListener("click",()=>i("skip")),o.addEventListener("click",()=>{let l={};for(let[d,c]of this.selects.entries())l[d]=c.value||"skip";this.resolved=!0,this.close(),this.onResolve(l)})}onClose(){if(!this.resolved){let e={};for(let[n,t]of this.selects.entries())e[n]=t.value||"skip";this.onResolve(e)}}},$e=class extends j.SuggestModal{constructor(e,n){super(e);this.resolved=!1;this.resolveSelection=n,this.setPlaceholder("Select a language for OCR/quality...")}getSuggestions(e){let n=e.trim().toLowerCase();return n?En.filter(t=>t.label.toLowerCase().includes(n)||t.value.toLowerCase().includes(n)):En}renderSuggestion(e,n){n.setText(e.label),n.addEventListener("click",()=>this.handleSelection(e))}onChooseSuggestion(e){this.handleSelection(e)}onClose(){this.resolved||this.resolveSelection(null)}handleSelection(e){if(!this.resolved){if(this.resolved=!0,e.value==="__custom__"){this.close(),new ve(this.app,"Custom language hint","e.g., en, de, fr, de,en",n=>this.resolveSelection(n.trim()),"Language hint cannot be empty.").open();return}this.resolveSelection(e.value),this.close()}}},Ve=class extends j.SuggestModal{constructor(e,n,t){super(e);this.lastError=null;this.indexedDocIds=null;this.attachmentStatusCache=new Map;this.attachmentChecks=new Set;this.plugin=n,this.resolveSelection=t,this.setPlaceholder("Search Zotero items...")}async getSuggestions(e){try{if(!this.indexedDocIds){let n=await this.plugin.getDocIndex();this.indexedDocIds=new Set(Object.keys(n))}return await this.plugin.searchZoteroItems(e)}catch(n){let t=n instanceof Error?n.message:String(n);return this.lastError!==t&&(this.lastError=t,new j.Notice(t)),console.error("Zotero search failed",n),[]}}renderSuggestion(e,n){var c,_,g;let t=(_=(c=e.data)==null?void 0:c.title)!=null?_:"[No title]",i=vn(e),r=kn(e),s=r?(g=this.indexedDocIds)==null?void 0:g.has(r):!1,a=An(e);s&&n.addClass("zrr-indexed-item"),a==="no"&&n.addClass("zrr-no-pdf-item"),n.createEl("div",{text:t});let o=n.createEl("small"),l=!1,d=()=>{l&&o.createSpan({text:" - "})};if(i&&(o.createSpan({text:i}),l=!0),s&&(d(),o.createSpan({text:"Indexed",cls:"zrr-indexed-flag"}),l=!0),a==="no"&&(d(),o.createSpan({text:"No PDF attachment",cls:"zrr-no-pdf-flag"}),l=!0),a==="unknown"){let y=r?this.attachmentStatusCache.get(r):void 0;y==="no"?(d(),o.createSpan({text:"No PDF attachment",cls:"zrr-no-pdf-flag"}),l=!0,n.addClass("zrr-no-pdf-item")):y==="yes"||r&&this.refreshAttachmentStatus(r,e,n,o)}n.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,n){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}async refreshAttachmentStatus(e,n,t,i){if(!this.attachmentChecks.has(e)){this.attachmentChecks.add(e);try{let r=await this.plugin.hasProcessableAttachment(n);this.attachmentStatusCache.set(e,r?"yes":"no"),!r&&i.isConnected&&t.isConnected&&(i.querySelector(".zrr-no-pdf-flag")||(i.childNodes.length>0&&i.createSpan({text:" - "}),i.createSpan({text:"No PDF attachment",cls:"zrr-no-pdf-flag"})),t.addClass("zrr-no-pdf-item"))}finally{this.attachmentChecks.delete(e)}}}};var Tn={"docling_extract.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8
import argparse
import atexit
import base64
import errno
import hashlib
import json
import math
import logging
import os
import random
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field, fields, asdict
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Set, Tuple
import langcodes
import warnings
from ocr_paddle import ocr_pages_with_paddle, ocr_pages_with_paddle_structure, ocr_pages_with_paddle_vl
from ocr_tesseract import find_tesseract_path, ocr_pages_with_tesseract

# Reduce noisy warnings and route them to logging
logging.captureWarnings(True)
try:
    from PIL import Image as _PILImage  # type: ignore
    # Disable DecompressionBomb warnings (we control DPI); still safe for local PDFs
    _PILImage.MAX_IMAGE_PIXELS = None  # type: ignore[attr-defined]
    if hasattr(_PILImage, "DecompressionBombWarning"):
        warnings.filterwarnings("ignore", category=_PILImage.DecompressionBombWarning)  # type: ignore[attr-defined]
except Exception:
    pass
warnings.filterwarnings("ignore", category=DeprecationWarning)


LOGGER = logging.getLogger("docling_extract")

# Stores details about the last spellchecker built (backend and dictionary files)
# Example: {"backend": "spylls", "aff": "/path/en_GB.aff", "dic": "/path/en_GB.dic"}
LAST_SPELLCHECKER_INFO: Dict[str, Any] = {}
SPELLCHECKER_CACHE: Dict[str, Any] = {}


def eprint(message: str) -> None:
    try:
        sys.stderr.write(message + "\\n")
    except BrokenPipeError:
        return
    except OSError as exc:
        if exc.errno == errno.EPIPE:
            return
        raise


ProgressCallback = Callable[[int, str, str], None]


def make_progress_emitter(enabled: bool) -> ProgressCallback:
    if not enabled:
        def _noop(percent: int, stage: str, message: str) -> None:
            return None
        return _noop

    broken_pipe = False

    def _emit(percent: int, stage: str, message: str) -> None:
        nonlocal broken_pipe
        if broken_pipe:
            return
        payload = {
            "type": "progress",
            "percent": max(0, min(100, int(percent))),
            "stage": stage,
            "message": message,
        }
        try:
            print(json.dumps(payload), flush=True)
        except BrokenPipeError:
            broken_pipe = True
        except OSError as exc:
            if exc.errno == errno.EPIPE:
                broken_pipe = True
                return
            raise

    return _emit


@dataclass
class DoclingProcessingConfig:
    ocr_mode: str = "auto"
    prefer_ocr_engine: str = "paddle"
    fallback_ocr_engine: str = "tesseract"
    language_hint: Optional[str] = None
    default_lang_german: str = "deu+eng"
    default_lang_english: str = "eng"
    min_text_chars_per_page: int = 40
    min_text_pages_ratio: float = 0.3
    quality_alpha_ratio_threshold: float = 0.6
    quality_suspicious_token_threshold: float = 0.25
    quality_min_avg_chars_per_page: int = 80
    quality_confidence_threshold: float = 0.5
    quality_use_wordfreq: bool = True
    quality_wordfreq_min_zipf: float = 3.0
    quality_image_heavy_text_chars: int = 200
    quality_image_heavy_min_images: int = 2
    quality_image_heavy_ratio_threshold: float = 0.6
    quality_image_heavy_penalty: float = 0.3
    quality_image_page_ratio_threshold: float = 0.7
    quality_classifier_enable: bool = True
    quality_classifier_max_pages: int = 12
    quality_classifier_min_samples: int = 6
    quality_classifier_decision_ratio: float = 0.6
    quality_classifier_image_coverage_threshold: float = 0.6
    quality_classifier_invisible_text_ratio_threshold: float = 0.7
    quality_classifier_min_text_ops: int = 4
    column_detect_enable: bool = True
    column_detect_dpi: int = 150
    column_detect_max_pages: int = 3
    column_detect_crop_top_ratio: float = 0.08
    column_detect_crop_bottom_ratio: float = 0.08
    column_detect_threshold_std_mult: float = 1.0
    column_detect_threshold_min: int = 120
    column_detect_threshold_max: int = 210
    column_detect_text_percentile: float = 0.7
    column_detect_min_text_density: float = 0.02
    column_detect_gap_threshold_ratio: float = 0.2
    column_detect_min_gap_density: float = 0.01
    column_detect_min_gap_ratio: float = 0.03
    column_detect_min_pages_ratio: float = 0.4
    column_detect_smooth_window: int = 5
    page_range_sample_tokens: int = 200
    page_range_min_overlap: float = 0.02
    page_range_min_hits: int = 5
    page_range_top_k: int = 5
    page_range_peak_ratio: float = 0.5
    page_range_cluster_gap: int = 1
    page_range_max_span_ratio: float = 0.7
    max_chunk_chars: int = 3000
    chunk_overlap_chars: int = 250
    per_page_ocr_on_low_quality: bool = True
    force_per_page_ocr: bool = False
    force_ocr_on_low_quality_text: bool = False
    enable_post_correction: bool = True
    enable_dictionary_correction: bool = False
    dictionary_path: Optional[str] = None
    dictionary_words: Optional[Sequence[str]] = None
    default_dictionary_name: str = "ocr_wordlist.txt"
    enable_llm_correction: bool = False
    llm_correct: Optional[Callable[[str], str]] = None
    llm_cleanup_base_url: Optional[str] = None
    llm_cleanup_api_key: Optional[str] = None
    llm_cleanup_model: Optional[str] = None
    llm_cleanup_temperature: float = 0.0
    llm_cleanup_timeout_sec: int = 60
    llm_correction_min_quality: float = 0.35
    llm_correction_max_chars: int = 2000
    enable_boilerplate_removal: bool = True
    boilerplate_min_line_len: int = 8
    boilerplate_repeat_ratio: float = 0.4
    boilerplate_min_pages: int = 3
    boilerplate_edge_lines: int = 3
    boilerplate_ngram_size: int = 3
    boilerplate_near_dup_threshold: float = 0.82
    postprocess_markdown: bool = False
    analysis_max_pages: int = 5
    analysis_sample_strategy: str = "middle"
    ocr_dpi: int = 300
    ocr_overlay_dpi: int = 300
    paddle_max_dpi: int = 300
    paddle_target_max_side_px: int = 6000
    paddle_use_doc_orientation_classify: bool = True
    paddle_use_doc_unwarping: bool = False
    paddle_use_textline_orientation: bool = True
    paddle_use_structure_v3: bool = False
    paddle_structure_version: str = "PP-StructureV3"
    paddle_structure_header_ratio: float = 0.05
    paddle_structure_footer_ratio: float = 0.05
    # When true and PP-StructureV3 is used, re-run recognition on detected layout
    # boxes using PaddleOCR recognizer to better follow layout boxes and reading order.
    paddle_recognize_from_layout_boxes: bool = True
    # PaddleX DocLayout extraction (mirrors paddle_ocr_smoke.py layout path).
    paddle_use_paddlex_layout: bool = True
    paddle_layout_model: str = "PP-DocLayout-L"
    paddle_layout_threshold: float = 0.3
    paddle_layout_img_size: Optional[int] = 6000
    paddle_layout_merge: str = "large"
    paddle_layout_unclip: float = 1.06
    paddle_crop_padding: int = 60
    paddle_crop_vbias: int = 6
    paddle_layout_device: Optional[str] = None
    paddle_layout_nms: bool = True
    paddle_layout_keep_labels: str = (
        "text,paragraph_title,title,heading,caption,header,number,figure_title,"
        "body,section,text_block,textbox,textline,paragraph"
    )
    paddle_layout_recognize_boxes: bool = True
    paddle_layout_fail_on_zero: bool = True
    paddle_layout_save_crops: Optional[str] = None
    paddle_dump: bool = False
    paddle_layout_markdown_out: Optional[str] = None
    # PaddleOCR-VL (optional, requires paddleocr[doc-parser])
    paddle_use_vl: bool = False
    paddle_vl_device: Optional[str] = None
    paddle_vl_rec_backend: Optional[str] = None
    paddle_vl_rec_server_url: Optional[str] = None
    paddle_vl_rec_max_concurrency: Optional[int] = None
    paddle_vl_rec_api_key: Optional[str] = None
    paddle_vl_use_layout_detection: Optional[bool] = True
    paddle_vl_use_chart_recognition: Optional[bool] = True
    paddle_vl_format_block_content: Optional[bool] = True
    paddle_vl_prompt_label: Optional[str] = "ocr"
    paddle_vl_use_queues: Optional[bool] = False
    paddle_vl_layout_threshold: Optional[float] = 0.3
    paddle_vl_layout_nms: Optional[bool] = True
    paddle_vl_layout_unclip: Optional[float] = 1.2
    paddle_vl_layout_merge: Optional[str] = "small"
    paddle_vl_api_disable: bool = False
    paddle_vl_api_url: Optional[str] = None
    paddle_vl_api_token: Optional[str] = None
    paddle_vl_api_timeout_sec: int = 600
    paddle_vl_api_max_pages: int = 100
    paddle_vl_api_max_chunk_bytes: int = 4000000
    paddle_vl_markdown_ignore_labels: Optional[Sequence[str]] = field(
        default_factory=lambda: ["header","header_image","footer","footer_image","number","aside_text"]
    )
    paddle_vl_repetition_penalty: Optional[float] = 1.0
    paddle_vl_temperature: Optional[float] = 0.0
    paddle_vl_top_p: Optional[float] = 1.0
    paddle_vl_min_pixels: Optional[int] = 147384
    paddle_vl_max_pixels: Optional[int] = 2822400
    paddle_structure_api_disable: bool = False
    paddle_structure_api_url: Optional[str] = None
    paddle_structure_api_token: Optional[str] = None
    paddle_structure_api_timeout_sec: int = 600
    # Optional Hunspell integration
    enable_hunspell: bool = True
    hunspell_aff_path: Optional[str] = None
    hunspell_dic_path: Optional[str] = None


@dataclass
class OcrRouteDecision:
    ocr_used: bool
    ocr_engine: str
    languages: str
    route_reason: str
    use_external_ocr: bool
    per_page_ocr: bool
    per_page_reason: str


@dataclass
class TextQuality:
    avg_chars_per_page: float
    alpha_ratio: float
    suspicious_token_ratio: float
    confidence_proxy: float
    dictionary_hit_ratio: Optional[float] = None
    spellchecker_hit_ratio: Optional[float] = None
    image_heavy_ratio: Optional[float] = None
    image_page_ratio: Optional[float] = None
    ocr_overlay_ratio: Optional[float] = None
    digital_page_ratio: Optional[float] = None
    layer_classification: Optional[str] = None
    effective_confidence_proxy: Optional[float] = None

@dataclass
class ColumnLayoutDetection:
    detected: bool
    page_ratio: float
    reason: str

@dataclass
class DoclingConversionResult:
    markdown: str
    pages: List[Dict[str, Any]]
    metadata: Dict[str, Any]


@dataclass
class BoilerplateCluster:
    rep: str
    shingles: Set[str]
    count: int = 0


def normalize_text(text: str) -> str:
    return re.sub(r"\\s+", " ", text).strip()


def extract_alnum_tokens(text: str) -> List[str]:
    tokens: List[str] = []
    current: List[str] = []
    for char in text:
        if char.isalnum():
            current.append(char)
        elif current:
            tokens.append("".join(current))
            current = []
    if current:
        tokens.append("".join(current))
    return tokens


def remove_image_placeholders(text: str) -> str:
    return re.sub(r"<!--\\s*image\\s*-->", "", text, flags=re.IGNORECASE)


def clean_chunk_text(text: str, config: Optional[DoclingProcessingConfig]) -> str:
    if not text:
        return ""
    return remove_image_placeholders(text)


def normalize_whitespace(text: str) -> str:
    text = text.replace("\\r\\n", "\\n").replace("\\r", "\\n")
    text = re.sub(r"[ \\t]+", " ", text)
    text = re.sub(r"\\n{3,}", "\\n\\n", text)
    return text.strip()

def normalize_display_markdown(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\\r\\n", "\\n").replace("\\r", "\\n")
    lines = [line.rstrip() for line in text.split("\\n")]
    text = "\\n".join(lines)
    text = re.sub(r"\\n{3,}", "\\n\\n", text)
    return text.strip()

_IMG_TAG_RE = re.compile(r"<img[^>]*?>", re.IGNORECASE)
_DIV_IMG_TAG_RE = re.compile(r"<div[^>]*>\\s*<img[^>]*?>\\s*</div>", re.IGNORECASE | re.DOTALL)


def _extract_image_filename(src: str) -> Optional[str]:
    if not src:
        return None
    if src.startswith("data:"):
        return None
    path = src
    if src.startswith(("http://", "https://")):
        try:
            path = urllib.parse.urlparse(src).path
        except Exception:
            path = src
    filename = os.path.basename(path)
    return filename or None


def _extract_img_attr(tag: str, attr: str) -> Optional[str]:
    match = re.search(rf"\\b{re.escape(attr)}=(['\\"])(?P<val>[^'\\"]*)\\1", tag, re.IGNORECASE)
    if match:
        return match.group("val")
    return None


def _obsidian_image_link(
    src: str,
    alt_text: Optional[str] = None,
    image_labels: Optional[Dict[str, str]] = None,
) -> Optional[str]:
    filename = _extract_image_filename(src)
    if not filename:
        return None
    label = None
    if image_labels:
        label = image_labels.get(filename) or image_labels.get(src)
    if not label and alt_text:
        label = alt_text.strip() or None
    if label:
        return f"![[{filename}|{label}]]"
    return f"![[{filename}]]"


def convert_html_images_to_obsidian(
    markdown: str,
    image_labels: Optional[Dict[str, str]] = None,
) -> str:
    if not markdown:
        return ""

    def replace_div(match: re.Match[str]) -> str:
        tag = match.group(0)
        src = _extract_img_attr(tag, "src")
        alt_text = _extract_img_attr(tag, "alt")
        if not src:
            return tag
        link = _obsidian_image_link(src, alt_text=alt_text, image_labels=image_labels)
        return link if link else match.group(0)

    def replace_img(match: re.Match[str]) -> str:
        tag = match.group(0)
        src = _extract_img_attr(tag, "src")
        alt_text = _extract_img_attr(tag, "alt")
        if not src:
            return tag
        link = _obsidian_image_link(src, alt_text=alt_text, image_labels=image_labels)
        return link if link else match.group(0)

    updated = _DIV_IMG_TAG_RE.sub(replace_div, markdown)
    updated = _IMG_TAG_RE.sub(replace_img, updated)
    return updated


def remap_layout_image_keys(layout_images: Dict[str, Any]) -> Dict[str, Any]:
    remapped: Dict[str, Any] = {}
    for key, value in layout_images.items():
        new_key = key
        if isinstance(key, str):
            filename = _extract_image_filename(key)
            if filename:
                new_key = filename
        if new_key in remapped:
            LOGGER.warning("Duplicate layout image key after remap: %s", new_key)
            continue
        remapped[new_key] = value
    return remapped


def normalize_chunk_whitespace(text: str) -> str:
    text = text.replace("\\r\\n", "\\n").replace("\\r", " ")
    text = re.sub(r"[ \\t]+", " ", text)
    text = re.sub(r"\\n{3,}", "\\n\\n", text)
    lines = text.split("\\n")
    out_lines: List[str] = []
    buffer: List[str] = []

    def flush() -> None:
        if buffer:
            out_lines.append(" ".join(buffer).strip())
            buffer.clear()

    heading_re = re.compile(r"^#{1,6}\\s+")
    list_re = re.compile(
        r"^(?:[-*+]\\s+|\\d+[.)]\\s+|[\\u2022\\u2023\\u25AA\\u2013\\u2014\\u00B7\\x81]\\s+)"
    )
    table_sep_re = re.compile(r"^\\s*\\|?\\s*:?-{2,}:?(?:\\s*\\|\\s*:?-{2,}:?)+\\s*\\|?\\s*$")

    def is_table_line(line: str) -> bool:
        if table_sep_re.match(line):
            return True
        return line.count("|") >= 2
    for line in lines:
        stripped = line.replace("\\ufeff", "").strip()
        if not stripped:
            flush()
            if out_lines and out_lines[-1] != "":
                out_lines.append("")
            continue
        if (
            heading_re.match(stripped)
            or list_re.match(stripped)
            or is_table_line(stripped)
        ):
            flush()
            out_lines.append(stripped)
            continue
        buffer.append(stripped)

    flush()
    result = "\\n".join(out_lines)
    result = re.sub(r"\\n{3,}", "\\n\\n", result)
    return result.strip()


def reset_debug_directory(path: Optional[str]) -> None:
    if not path:
        return
    try:
        if os.path.isdir(path):
            shutil.rmtree(path)
        elif os.path.exists(path):
            os.remove(path)
    except Exception as exc:
        LOGGER.warning("Failed to clear debug directory %s: %s", path, exc)


def reflow_page_text(text: str) -> str:
    if not text:
        return ""
    text = text.replace("\\r\\n", "\\n").replace("\\r", " ")
    text = re.sub(r"[ \\t]+", " ", text)
    text = re.sub(r"\\n{3,}", "\\n\\n", text)
    lines = text.split("\\n")
    out_lines: List[str] = []
    buffer: List[str] = []

    def flush() -> None:
        if buffer:
            out_lines.append(" ".join(buffer).strip())
            buffer.clear()

    heading_re = re.compile(r"^#{1,6}\\s+")
    list_bullet_re = re.compile(r"^[-*+]\\s+(.+)")
    list_number_re = re.compile(r"^(\\d+)[.)]\\s+(.+)")
    list_unicode_re = re.compile(r"^[\\u2022\\u2023\\u25AA\\u2013\\u2014\\u00B7\\x81]\\s*(.+)")
    table_sep_re = re.compile(r"^\\s*\\|?\\s*:?-{2,}:?(?:\\s*\\|\\s*:?-{2,}:?)+\\s*\\|?\\s*$")
    url_re = re.compile(r"^(https?://|doi:)", re.IGNORECASE)

    def is_table_line(line: str) -> bool:
        if table_sep_re.match(line):
            return True
        return line.count("|") >= 2

    list_active = False
    list_prefix = ""
    list_buffer: List[str] = []

    def flush_list() -> None:
        nonlocal list_active, list_prefix, list_buffer
        if list_active and list_buffer:
            out_lines.append(f"{list_prefix}{' '.join(list_buffer).strip()}")
        list_active = False
        list_prefix = ""
        list_buffer = []

    for line in lines:
        stripped = line.replace("\\ufeff", "").strip()
        if not stripped:
            flush_list()
            flush()
            if out_lines and out_lines[-1] != "":
                out_lines.append("")
            continue
        bullet_match = list_bullet_re.match(stripped)
        number_match = list_number_re.match(stripped)
        unicode_match = list_unicode_re.match(stripped)
        if bullet_match or number_match or unicode_match:
            flush()
            flush_list()
            if number_match:
                list_prefix = f"{number_match.group(1)}. "
                list_buffer = [number_match.group(2).strip()]
            else:
                list_prefix = "- "
                list_buffer = [(bullet_match or unicode_match).group(1).strip()]
            list_active = True
            continue
        if heading_re.match(stripped) or is_table_line(stripped):
            flush()
            flush_list()
            out_lines.append(stripped)
            continue
        if list_active and url_re.match(stripped):
            list_buffer.append(stripped)
            continue
        if url_re.match(stripped):
            flush()
            flush_list()
            out_lines.append(stripped)
            continue
        if list_active:
            list_buffer.append(stripped)
            continue
        buffer.append(stripped)

    flush()
    flush_list()
    result = "\\n".join(out_lines)
    result = re.sub(r"\\n{3,}", "\\n\\n", result)
    return result.strip()



def dehyphenate_text(text: str) -> str:
    return re.sub(r"(?<=\\w)-\\s*\\n\\s*(?=\\w)", "", text)


def replace_ligatures(text: str) -> str:
    return (
        text.replace("\\ufb01", "fi")
        .replace("\\ufb02", "fl")
        .replace("\\ufb03", "ffi")
        .replace("\\ufb04", "ffl")
    )

_BOILERPLATE_PATTERNS = [
    re.compile(r"(?i)^this content downloaded from"),
    re.compile(r"(?i)content downloaded from"),
    re.compile(r"(?i)^all use subject to"),
    re.compile(r"(?i)about\\s*\\.?jstor\\.org/terms"),
    re.compile(r"(?i)^jstor is a not-for-profit"),
    re.compile(r"(?i)^your use of the jstor archive"),
    re.compile(r"(?i)^for more information about jstor"),
    re.compile(r"(?i)^state historical society"),
    re.compile(r"(?i)\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b.*\\butc\\b"),
]
_PAGE_NUMBER_RE = re.compile(r"^[ivxlcdm]+$|^\\d{1,4}$", re.IGNORECASE)
_IP_RE = re.compile(r"\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b")
_TIME_RE = re.compile(r"\\b\\d{1,2}:\\d{2}(?::\\d{2})?\\b")
_DATE_ISO_RE = re.compile(r"\\b\\d{4}-\\d{2}-\\d{2}\\b")
_DATE_SLASH_RE = re.compile(r"\\b\\d{1,2}/\\d{1,2}/\\d{2,4}\\b")
_MONTH_RE = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
)
_DATE_TEXT_RE = re.compile(rf"\\b\\d{{1,2}}\\s+{_MONTH_RE}\\s+\\d{{2,4}}\\b", re.IGNORECASE)
_DATE_TEXT_REVERSE = re.compile(rf"\\b{_MONTH_RE}\\s+\\d{{1,2}},?\\s+\\d{{4}}\\b", re.IGNORECASE)
_LONG_NUM_RE = re.compile(r"\\b\\d{4,}\\b")


def mask_boilerplate_tokens(text: str) -> str:
    cleaned = text
    cleaned = _IP_RE.sub("<ip>", cleaned)
    cleaned = _TIME_RE.sub("<time>", cleaned)
    cleaned = _DATE_ISO_RE.sub("<date>", cleaned)
    cleaned = _DATE_SLASH_RE.sub("<date>", cleaned)
    cleaned = _DATE_TEXT_RE.sub("<date>", cleaned)
    cleaned = _DATE_TEXT_REVERSE.sub("<date>", cleaned)
    cleaned = _LONG_NUM_RE.sub("<num>", cleaned)
    cleaned = re.sub(r"\\d", "0", cleaned)
    return cleaned


def normalize_boilerplate_line(line: str) -> str:
    cleaned = line.replace("\\u00a0", " ")
    cleaned = cleaned.lower()
    cleaned = mask_boilerplate_tokens(cleaned)
    cleaned = re.sub(r"\\s+", " ", cleaned).strip()
    return cleaned


def is_boilerplate_line(line: str) -> bool:
    if not line:
        return False
    if _PAGE_NUMBER_RE.match(line):
        return True
    for pattern in _BOILERPLATE_PATTERNS:
        if pattern.search(line):
            return True
    return False


def line_shingles(text: str, size: int) -> Set[str]:
    cleaned = re.sub(r"\\s+", "", text)
    if size <= 1:
        return {cleaned} if cleaned else set()
    if len(cleaned) <= size:
        return {cleaned} if cleaned else set()
    return {cleaned[i:i + size] for i in range(len(cleaned) - size + 1)}


def jaccard_similarity(a: Set[str], b: Set[str]) -> float:
    if not a or not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def match_boilerplate_cluster(
    shingles: Set[str],
    clusters: Sequence[BoilerplateCluster],
    threshold: float,
) -> Optional[int]:
    best_idx: Optional[int] = None
    best_score = 0.0
    for idx, cluster in enumerate(clusters):
        score = jaccard_similarity(shingles, cluster.shingles)
        if score >= threshold and score > best_score:
            best_idx = idx
            best_score = score
    return best_idx


def get_edge_lines(lines: Sequence[str], edge_lines: int) -> List[str]:
    if edge_lines <= 0:
        return list(lines)
    total = len(lines)
    if total <= edge_lines * 2:
        return list(lines)
    return list(lines[:edge_lines]) + list(lines[-edge_lines:])


def is_edge_line_index(idx: int, total: int, edge_lines: int) -> bool:
    if edge_lines <= 0:
        return True
    return idx < edge_lines or idx >= max(0, total - edge_lines)


def select_edge_texts_by_y(
    lines: Sequence[Tuple[str, float]],
    edge_lines: int,
) -> List[str]:
    if edge_lines <= 0:
        return [text for text, _ in lines]
    sorted_lines = sorted(lines, key=lambda item: item[1])
    total = len(sorted_lines)
    if total <= edge_lines * 2:
        return [text for text, _ in sorted_lines]
    top = sorted_lines[:edge_lines]
    bottom = sorted_lines[-edge_lines:]
    return [text for text, _ in top + bottom]


def edge_ids_by_y(
    items: Sequence[Tuple[int, float]],
    edge_lines: int,
) -> Set[int]:
    if edge_lines <= 0:
        return {idx for idx, _ in items}
    sorted_items = sorted(items, key=lambda item: item[1])
    total = len(sorted_items)
    if total <= edge_lines * 2:
        return {idx for idx, _ in sorted_items}
    top = sorted_items[:edge_lines]
    bottom = sorted_items[-edge_lines:]
    return {idx for idx, _ in top + bottom}


def detect_repeated_line_clusters(
    page_lines: Sequence[Sequence[str]],
    total_pages: int,
    config: DoclingProcessingConfig,
) -> Tuple[List[BoilerplateCluster], int]:
    if total_pages < config.boilerplate_min_pages:
        return [], 0
    threshold = max(2, int(math.ceil(total_pages * config.boilerplate_repeat_ratio)))
    clusters: List[BoilerplateCluster] = []
    for lines in page_lines:
        seen: Set[int] = set()
        for line in lines:
            normalized = normalize_boilerplate_line(line)
            if not normalized or len(normalized) < config.boilerplate_min_line_len:
                continue
            shingles = line_shingles(normalized, config.boilerplate_ngram_size)
            idx = match_boilerplate_cluster(
                shingles,
                clusters,
                config.boilerplate_near_dup_threshold,
            )
            if idx is None:
                clusters.append(BoilerplateCluster(rep=normalized, shingles=shingles, count=0))
                idx = len(clusters) - 1
            if idx not in seen:
                clusters[idx].count += 1
                seen.add(idx)
    repeated = [cluster for cluster in clusters if cluster.count >= threshold]
    return repeated, threshold


def matches_repeated_cluster(
    line: str,
    clusters: Sequence[BoilerplateCluster],
    config: DoclingProcessingConfig,
) -> bool:
    if not clusters:
        return False
    normalized = normalize_boilerplate_line(line)
    if not normalized:
        return False
    shingles = line_shingles(normalized, config.boilerplate_ngram_size)
    return match_boilerplate_cluster(
        shingles,
        clusters,
        config.boilerplate_near_dup_threshold,
    ) is not None


def detect_repeated_lines(
    pages: Sequence[Dict[str, Any]],
    config: DoclingProcessingConfig,
) -> Tuple[List[BoilerplateCluster], int]:
    total_pages = len(pages)
    if total_pages < config.boilerplate_min_pages:
        return [], 0
    page_lines: List[List[str]] = []
    for page in pages:
        lines = str(page.get("text", "")).splitlines()
        page_lines.append(get_edge_lines(lines, config.boilerplate_edge_lines))
    clusters, threshold = detect_repeated_line_clusters(page_lines, total_pages, config)
    return clusters, threshold


def remove_boilerplate_from_pages(
    pages: List[Dict[str, Any]],
    config: DoclingProcessingConfig,
) -> Tuple[List[Dict[str, Any]], List[BoilerplateCluster], Dict[str, Any]]:
    if not config.enable_boilerplate_removal or not pages:
        return pages, [], {}
    repeated_clusters, threshold = detect_repeated_lines(pages, config)
    removed_total = 0
    updated_pages: List[Dict[str, Any]] = []
    for page in pages:
        text = str(page.get("text", ""))
        if not text:
            updated_pages.append(page)
            continue
        lines = text.splitlines()
        kept_lines: List[str] = []
        removed_page = 0
        for idx, line in enumerate(lines):
            normalized = normalize_boilerplate_line(line)
            if not normalized:
                kept_lines.append("")
                continue
            is_edge = is_edge_line_index(idx, len(lines), config.boilerplate_edge_lines)
            if is_edge and (
                matches_repeated_cluster(line, repeated_clusters, config)
                or is_boilerplate_line(normalized)
            ):
                removed_page += 1
                continue
            kept_lines.append(line)
        removed_total += removed_page
        new_page = dict(page)
        new_page["text"] = "\\n".join(kept_lines).strip()
        updated_pages.append(new_page)
    if removed_total:
        LOGGER.info(
            "Boilerplate removal: removed %s lines (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            threshold,
            len(repeated_clusters),
        )
    return updated_pages, repeated_clusters, {
        "removed_lines": removed_total,
        "repeat_threshold": threshold,
        "repeated_lines": len(repeated_clusters),
    }


def remove_boilerplate_from_markdown(
    markdown: str,
    repeated_clusters: Sequence[BoilerplateCluster],
    config: DoclingProcessingConfig,
) -> str:
    if not config.enable_boilerplate_removal or not markdown:
        return markdown
    kept: List[str] = []
    removed = 0
    for line in markdown.splitlines():
        normalized = normalize_boilerplate_line(line)
        if not normalized:
            kept.append(line)
            continue
        if matches_repeated_cluster(line, repeated_clusters, config) or is_boilerplate_line(normalized):
            removed += 1
            continue
        kept.append(line)
    if removed:
        LOGGER.info("Boilerplate removal: stripped %s markdown lines", removed)
    return "\\n".join(kept).strip()

def split_paragraphs(text: str) -> List[str]:
    paragraphs = re.split(r"\\n\\s*\\n", text)
    return [para.strip() for para in paragraphs if para.strip()]


def split_long_text(text: str, max_chars: int) -> List[str]:
    if max_chars <= 0 or len(text) <= max_chars:
        return [text]
    sentences = re.split(r"(?<=[.!?])\\s+", text.strip())
    if len(sentences) <= 1:
        return [text[i:i + max_chars] for i in range(0, len(text), max_chars)]
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0
    for sentence in sentences:
        sent = sentence.strip()
        if not sent:
            continue
        if current_len + len(sent) + 1 > max_chars and current:
            chunks.append(" ".join(current).strip())
            current = [sent]
            current_len = len(sent)
        else:
            current.append(sent)
            current_len += len(sent) + 1
    if current:
        chunks.append(" ".join(current).strip())
    return chunks


def split_text_by_size(text: str, max_chars: int, overlap_chars: int) -> List[str]:
    if max_chars <= 0 or len(text) <= max_chars:
        return [text]
    paragraphs = split_paragraphs(text) or [text]
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    def flush() -> None:
        nonlocal current, current_len
        if not current:
            return
        chunk = "\\n\\n".join(current).strip()
        chunks.append(chunk)
        current = []
        current_len = 0

    for para in paragraphs:
        for piece in split_long_text(para, max_chars):
            piece_len = len(piece)
            if current_len + piece_len + 2 > max_chars and current:
                flush()
            current.append(piece)
            current_len += piece_len + 2

    flush()

    if overlap_chars <= 0 or len(chunks) <= 1:
        return chunks

    overlapped: List[str] = []
    previous = ""
    for chunk in chunks:
        if previous:
            overlap = previous[-overlap_chars:]
            combined = f"{overlap}\\n{chunk}".strip()
        else:
            combined = chunk
        overlapped.append(combined)
        previous = chunk
    return overlapped


def select_wordfreq_languages(languages: str) -> List[str]:
    lang = (languages or "").lower()
    selected: List[str] = []
    if any(token in lang for token in ("deu", "ger", "de", "german", "deutsch")):
        selected.append("de")
    if any(token in lang for token in ("eng", "en", "english")):
        selected.append("en")
    if any(token in lang for token in ("fra", "fr", "french", "francais", "fran\xE7ais")):
        selected.append("fr")
    if any(token in lang for token in ("spa", "es", "spanish", "espanol", "espa\xF1ol")):
        selected.append("es")
    if any(token in lang for token in ("ita", "it", "italian", "italiano")):
        selected.append("it")
    if any(token in lang for token in ("pol", "pl", "polish", "polski")):
        selected.append("pl")
    if any(token in lang for token in ("por", "pt", "portuguese", "portugu\xEAs", "portugues")):
        selected.append("pt")
    if any(token in lang for token in ("nld", "dut", "nl", "dutch", "nederlands")):
        selected.append("nl")
    if any(token in lang for token in ("swe", "sv", "swedish", "svenska")):
        selected.append("sv")
    if any(token in lang for token in ("nor", "no", "norsk", "bokmal", "bokm\xE5l", "nynorsk")):
        selected.append("no")
    if any(token in lang for token in ("dan", "da", "danish", "dansk")):
        selected.append("da")
    if any(token in lang for token in ("fin", "fi", "finnish", "suomi")):
        selected.append("fi")
    if any(token in lang for token in ("rus", "ru", "russian", "\u0440\u0443\u0441")):
        selected.append("ru")
    if any(token in lang for token in ("ces", "cze", "cs", "czech", "\u010De\u0161tina", "cesky", "\u010Desky")):
        selected.append("cs")
    if any(token in lang for token in ("ell", "el", "greek", "\u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC")):
        selected.append("el")
    if not selected:
        selected.append("en")
    return selected


def compute_dictionary_hit_ratio(
    tokens: Sequence[str],
    languages: str,
    min_zipf: float,
) -> Optional[float]:
    try:
        from wordfreq import zipf_frequency
    except Exception:
        return None

    if not tokens:
        return None
    lang_codes = select_wordfreq_languages(languages)
    hits = 0
    total = 0
    for token in tokens:
        lower = token.lower()
        if len(lower) < 2:
            continue
        total += 1
        if any(zipf_frequency(lower, lang) >= min_zipf for lang in lang_codes):
            hits += 1
    if not total:
        return None
    return hits / total


def compute_spellchecker_hit_ratio(
    tokens: Sequence[str],
    languages: str,
    config: Optional[DoclingProcessingConfig],
) -> Optional[float]:
    if not config or not config.enable_hunspell or not languages:
        return None
    hs = build_spellchecker_for_languages(config, languages)
    if hs is None:
        return None
    hits = 0
    total = 0
    for token in tokens:
        if len(token) < 2:
            continue
        if not any(char.isalpha() for char in token):
            continue
        total += 1
        try:
            if hs.spell(token):
                hits += 1
        except Exception:
            continue
    if not total:
        return None
    return hits / total


def compute_image_heavy_ratio(
    pages: Sequence[Dict[str, Any]],
    config: DoclingProcessingConfig,
) -> Optional[float]:
    if not pages:
        return None
    heavy = 0
    total = 0
    for page in pages:
        total += 1
        text = str(page.get("text", ""))
        image_count = int(page.get("image_count") or 0)
        if len(text) < config.quality_image_heavy_text_chars and image_count >= config.quality_image_heavy_min_images:
            heavy += 1
    if not total:
        return None
    return heavy / total


def compute_image_page_ratio(pages: Sequence[Dict[str, Any]]) -> Optional[float]:
    if not pages:
        return None
    total = 0
    with_images = 0
    for page in pages:
        total += 1
        image_count = int(page.get("image_count") or 0)
        if image_count > 0:
            with_images += 1
    if not total:
        return None
    return with_images / total


def _matrix_multiply(
    left: Tuple[float, float, float, float, float, float],
    right: Tuple[float, float, float, float, float, float],
) -> Tuple[float, float, float, float, float, float]:
    a1, b1, c1, d1, e1, f1 = left
    a2, b2, c2, d2, e2, f2 = right
    return (
        a1 * a2 + b1 * c2,
        a1 * b2 + b1 * d2,
        c1 * a2 + d1 * c2,
        c1 * b2 + d1 * d2,
        e1 * a2 + f1 * c2 + e2,
        e1 * b2 + f1 * d2 + f2,
    )


def _operator_to_str(operator: Any) -> str:
    if isinstance(operator, bytes):
        try:
            return operator.decode("latin-1")
        except Exception:
            return str(operator)
    return str(operator)


def _extract_xobjects_from_resources(resources: Any) -> Dict[str, Any]:
    xobject_map: Dict[str, Any] = {}
    try:
        x_objects = resources.get("/XObject") if resources else None
        if x_objects:
            x_objects = x_objects.get_object() if hasattr(x_objects, "get_object") else x_objects
            for key, obj in x_objects.items():
                key_name = str(key)
                resolved = obj.get_object() if hasattr(obj, "get_object") else obj
                xobject_map[key_name] = resolved
    except Exception:
        return {}
    return xobject_map


def _extract_page_xobjects(page: Any) -> Dict[str, Any]:
    try:
        resources = page.get("/Resources") or {}
        return _extract_xobjects_from_resources(resources)
    except Exception:
        return {}


def _normalize_matrix(value: Any) -> Tuple[float, float, float, float, float, float]:
    try:
        if isinstance(value, (list, tuple)) and len(value) == 6:
            return tuple(float(item) for item in value)
    except Exception:
        return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    return (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def _scan_content_stream(
    content: Any,
    metrics: Dict[str, Any],
    ctm: Tuple[float, float, float, float, float, float],
    resources: Any,
    reader: Any,
    text_render_mode: int,
    visited: Set[Any],
) -> None:
    try:
        from pypdf import ContentStream
    except Exception:
        return
    try:
        stream = ContentStream(content, reader)
    except Exception:
        return
    local_ctm = ctm
    ctm_stack: List[Tuple[float, float, float, float, float, float]] = []
    render_mode = text_render_mode
    render_stack: List[int] = []
    xobject_map = _extract_xobjects_from_resources(resources)
    for operands, operator in stream.operations:
        op = _operator_to_str(operator)
        if op == "q":
            ctm_stack.append(local_ctm)
            render_stack.append(render_mode)
            continue
        if op == "Q":
            if ctm_stack:
                local_ctm = ctm_stack.pop()
            if render_stack:
                render_mode = render_stack.pop()
            continue
        if op == "cm" and len(operands) == 6:
            try:
                cm = tuple(float(value) for value in operands)
                local_ctm = _matrix_multiply(local_ctm, cm)  # type: ignore[arg-type]
            except Exception:
                pass
            continue
        if op == "Tr" and operands:
            try:
                render_mode = int(operands[0])
            except Exception:
                render_mode = 0
            continue
        if op in ("Tj", "TJ", "'", "\\""):
            metrics["text_ops"] += 1
            if render_mode == 3:
                metrics["invisible_text_ops"] += 1
            continue
        if op == "Do" and operands:
            name = str(operands[0])
            xobj = xobject_map.get(name)
            if not xobj:
                continue
            try:
                subtype = xobj.get("/Subtype")
            except Exception:
                subtype = None
            if subtype == "/Image":
                metrics["image_count"] += 1
                det = abs(local_ctm[0] * local_ctm[3] - local_ctm[1] * local_ctm[2])
                metrics["image_area"] += det
                continue
            if subtype == "/Form":
                form_key = getattr(xobj, "indirect_reference", None) or id(xobj)
                if form_key in visited:
                    continue
                visited.add(form_key)
                form_matrix = _normalize_matrix(xobj.get("/Matrix"))
                form_ctm = _matrix_multiply(local_ctm, form_matrix)
                form_resources = xobj.get("/Resources") or resources
                if hasattr(form_resources, "get_object"):
                    try:
                        form_resources = form_resources.get_object()
                    except Exception:
                        pass
                _scan_content_stream(
                    xobj,
                    metrics,
                    form_ctm,
                    form_resources,
                    reader,
                    render_mode,
                    visited,
                )
                visited.remove(form_key)


def _analyze_pdf_page_content(page: Any, reader: Any) -> Dict[str, Any]:
    metrics = {
        "text_ops": 0,
        "invisible_text_ops": 0,
        "image_area": 0.0,
        "image_count": 0,
        "image_coverage": 0.0,
        "invisible_text_ratio": 0.0,
    }
    try:
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
    except Exception:
        page_width = 0.0
        page_height = 0.0
    page_area = page_width * page_height if page_width > 0 and page_height > 0 else 0.0
    try:
        contents = page.get_contents()
        if not contents:
            return metrics
    except Exception:
        return metrics
    resources = page.get("/Resources") or {}
    visited: Set[Any] = set()
    _scan_content_stream(
        contents,
        metrics,
        (1.0, 0.0, 0.0, 1.0, 0.0, 0.0),
        resources,
        reader,
        0,
        visited,
    )

    if metrics["text_ops"] > 0:
        metrics["invisible_text_ratio"] = metrics["invisible_text_ops"] / metrics["text_ops"]
    if page_area > 0:
        metrics["image_coverage"] = min(1.0, metrics["image_area"] / page_area)
    return metrics


def classify_pdf_text_layer(
    pdf_path: str,
    config: DoclingProcessingConfig,
) -> Optional[Dict[str, Any]]:
    if not config.quality_classifier_enable:
        return None
    try:
        from pypdf import PdfReader
    except Exception:
        return None
    try:
        reader = PdfReader(pdf_path)
    except Exception as exc:
        LOGGER.warning("Text-layer classifier failed to read PDF: %s", exc)
        return None
    total_pages = len(reader.pages)
    if total_pages <= 0:
        return None

    sample_max = max(1, int(config.quality_classifier_max_pages))
    sample_count = min(total_pages, sample_max)
    seed_payload = f"{pdf_path}:{os.path.getsize(pdf_path)}".encode("utf-8")
    seed_bytes = hashlib.sha1(seed_payload).digest()
    rng = random.Random(int.from_bytes(seed_bytes[:8], "big"))
    sample_indices = select_classifier_sample_indices(total_pages, sample_count, rng)

    min_samples = max(1, min(int(config.quality_classifier_min_samples), sample_count))
    decision_ratio = max(0.5, min(1.0, float(config.quality_classifier_decision_ratio)))
    image_threshold = float(config.quality_classifier_image_coverage_threshold)
    invisible_threshold = float(config.quality_classifier_invisible_text_ratio_threshold)
    min_text_ops = max(1, int(config.quality_classifier_min_text_ops))
    min_text_len = max(1, int(config.min_text_chars_per_page))

    digital_count = 0
    ocr_count = 0
    mixed_count = 0
    ocr_score_sum = 0.0
    digital_score_sum = 0.0
    seen = 0
    decision = None
    short_circuit = False

    for idx in sample_indices:
        page = reader.pages[idx]
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        text_len = len(normalize_text(text))
        metrics = _analyze_pdf_page_content(page, reader)
        image_coverage = float(metrics.get("image_coverage") or 0.0)
        text_ops = int(metrics.get("text_ops") or 0)
        invisible_ratio = float(metrics.get("invisible_text_ratio") or 0.0)

        text_ops_factor = min(1.0, text_ops / max(1.0, float(min_text_ops)))
        image_score = 0.0
        if image_threshold < 1.0:
            image_score = (image_coverage - image_threshold) / max(1e-6, 1.0 - image_threshold)
            image_score = max(0.0, min(1.0, image_score))
        invisible_score = 0.0
        if invisible_threshold < 1.0:
            invisible_score = (invisible_ratio - invisible_threshold) / max(1e-6, 1.0 - invisible_threshold)
            invisible_score = max(0.0, min(1.0, invisible_score))
        text_score = 1.0 - min(1.0, text_len / max(1.0, min_text_len * 2.0))
        text_score = max(text_score, 1.0 - text_ops_factor)

        ocr_score = max(image_score, invisible_score)
        ocr_score = min(1.0, (ocr_score * 0.85) + (text_score * 0.15))
        text_factor = min(1.0, text_len / max(1.0, min_text_len * 2.0))
        text_factor *= text_ops_factor
        digital_score = text_factor * (1.0 - image_score) * (1.0 - invisible_score)

        ocr_score_sum += ocr_score
        digital_score_sum += digital_score

        if ocr_score >= decision_ratio and ocr_score >= digital_score:
            label = "ocr"
        elif digital_score >= decision_ratio and digital_score >= ocr_score:
            label = "digital"
        else:
            label = "mixed"

        seen += 1
        if label == "ocr":
            ocr_count += 1
        elif label == "digital":
            digital_count += 1
        else:
            mixed_count += 1

        if seen >= min_samples:
            avg_ocr = ocr_score_sum / seen
            avg_digital = digital_score_sum / seen
            if avg_ocr >= decision_ratio and avg_ocr >= avg_digital:
                decision = "ocr"
                short_circuit = True
                break
            if avg_digital >= decision_ratio and avg_digital >= avg_ocr:
                decision = "digital"
                short_circuit = True
                break

    if seen == 0:
        return None
    ocr_ratio = ocr_score_sum / seen
    digital_ratio = digital_score_sum / seen
    mixed_ratio = mixed_count / seen
    if decision is None:
        if ocr_ratio >= decision_ratio and ocr_ratio >= digital_ratio:
            decision = "ocr"
        elif digital_ratio >= decision_ratio and digital_ratio >= ocr_ratio:
            decision = "digital"
        else:
            decision = "mixed"

    return {
        "decision": decision,
        "ocr_ratio": ocr_ratio,
        "digital_ratio": digital_ratio,
        "mixed_ratio": mixed_ratio,
        "sampled_pages": seen,
        "short_circuit": short_circuit,
    }


def compute_effective_confidence(
    quality: TextQuality,
    config: DoclingProcessingConfig,
) -> float:
    score = float(quality.confidence_proxy)
    if quality.ocr_overlay_ratio is not None:
        ocr_ratio = max(0.0, min(1.0, float(quality.ocr_overlay_ratio)))
        score = (score * 0.6) + ((1.0 - ocr_ratio) * 0.4)
    if quality.digital_page_ratio is not None:
        digital_ratio = float(quality.digital_page_ratio)
        digital_weight = 0.7
        if quality.image_page_ratio is not None:
            threshold = max(0.0, min(1.0, float(config.quality_image_page_ratio_threshold)))
            if threshold < 1.0 and quality.image_page_ratio >= threshold:
                guard = 1.0 - (float(quality.image_page_ratio) - threshold) / max(1e-6, 1.0 - threshold)
                digital_weight *= max(0.0, min(1.0, guard))
        boosted = (score * (1.0 - digital_weight)) + (digital_ratio * digital_weight)
        score = max(score, boosted)
    return max(0.0, min(1.0, score))


def apply_text_layer_classifier(
    quality: TextQuality,
    pdf_path: str,
    config: DoclingProcessingConfig,
) -> Tuple[TextQuality, Optional[Dict[str, Any]]]:
    classifier = classify_pdf_text_layer(pdf_path, config)
    if not classifier:
        quality.effective_confidence_proxy = compute_effective_confidence(quality, config)
        return quality, None
    ocr_ratio = classifier.get("ocr_ratio")
    digital_ratio = classifier.get("digital_ratio")
    decision = classifier.get("decision")
    guardrail_applied = False
    ocr_ratio_value = float(ocr_ratio) if ocr_ratio is not None else 0.0
    digital_ratio_value = float(digital_ratio) if digital_ratio is not None else 0.0
    if quality.image_page_ratio is not None:
        threshold = max(0.0, min(1.0, float(config.quality_image_page_ratio_threshold)))
        if threshold < 1.0 and quality.image_page_ratio >= threshold:
            guard = 1.0 - (float(quality.image_page_ratio) - threshold) / max(1e-6, 1.0 - threshold)
            digital_ratio_value *= max(0.0, min(1.0, guard))
            ocr_ratio_value = max(ocr_ratio_value, float(quality.image_page_ratio))
            guardrail_applied = True
    if decision == "digital" and digital_ratio_value < config.quality_classifier_decision_ratio:
        decision = "mixed"
    if decision in (None, "mixed") and ocr_ratio_value >= config.quality_classifier_decision_ratio:
        if digital_ratio_value < config.quality_classifier_decision_ratio:
            decision = "ocr"
    quality.ocr_overlay_ratio = ocr_ratio_value
    quality.digital_page_ratio = digital_ratio_value
    quality.layer_classification = decision
    if guardrail_applied:
        classifier["ocr_ratio"] = ocr_ratio_value
        classifier["digital_ratio"] = digital_ratio_value
        classifier["decision"] = decision
        classifier["guardrail_applied"] = True
        classifier["short_circuit"] = False
    quality.effective_confidence_proxy = compute_effective_confidence(quality, config)
    return quality, classifier


def normalize_ocr_confidence(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        conf = float(value)
    except Exception:
        return None
    if conf < 0:
        return None
    if conf > 1.0:
        conf = conf / 100.0
    return max(0.0, min(1.0, conf))


def estimate_text_quality(
    pages: Sequence[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
    languages: Optional[str] = None,
) -> TextQuality:
    if not pages:
        return TextQuality(0.0, 0.0, 1.0, 0.0, None)

    texts = [str(page.get("text", "")) for page in pages]
    total_chars = sum(len(text) for text in texts)
    alpha_chars = sum(sum(char.isalpha() for char in text) for text in texts)
    alpha_ratio = alpha_chars / max(1, total_chars)

    tokens = extract_alnum_tokens(" ".join(texts))
    suspicious_tokens = [
        token for token in tokens
        if (sum(char.isdigit() for char in token) / max(1, len(token))) > 0.5
        or re.search(r"(.)\\1\\1", token)
    ]
    suspicious_ratio = len(suspicious_tokens) / max(1, len(tokens))

    avg_chars = total_chars / max(1, len(pages))
    dictionary_hit_ratio = None
    spellchecker_hit_ratio = None
    image_heavy_ratio = None
    image_page_ratio = None
    if config and config.quality_use_wordfreq and languages:
        dictionary_hit_ratio = compute_dictionary_hit_ratio(
            tokens,
            languages,
            config.quality_wordfreq_min_zipf,
        )
    if config and languages:
        spellchecker_hit_ratio = compute_spellchecker_hit_ratio(tokens, languages, config)
        image_heavy_ratio = compute_image_heavy_ratio(pages, config)
    if config:
        image_page_ratio = compute_image_page_ratio(pages)
    lexicon_ratio = None
    if dictionary_hit_ratio is not None and spellchecker_hit_ratio is not None:
        lexicon_ratio = max(dictionary_hit_ratio, spellchecker_hit_ratio)
    elif dictionary_hit_ratio is not None:
        lexicon_ratio = dictionary_hit_ratio
    elif spellchecker_hit_ratio is not None:
        lexicon_ratio = spellchecker_hit_ratio
    confidence = alpha_ratio * (1.0 - suspicious_ratio)
    if lexicon_ratio is not None:
        confidence *= 0.4 + (0.6 * lexicon_ratio)
    if (
        image_heavy_ratio is not None
        and config
        and image_heavy_ratio >= config.quality_image_heavy_ratio_threshold
    ):
        penalty = 1.0 - (config.quality_image_heavy_penalty * image_heavy_ratio)
        confidence *= max(0.0, penalty)
    confidence = max(0.0, min(1.0, confidence))
    return TextQuality(
        avg_chars,
        alpha_ratio,
        suspicious_ratio,
        confidence,
        dictionary_hit_ratio,
        spellchecker_hit_ratio,
        image_heavy_ratio,
        image_page_ratio,
    )


def detect_text_layer_from_pages(pages: Sequence[Dict[str, Any]], config: DoclingProcessingConfig) -> bool:
    if not pages:
        return False
    pages_with_text = 0
    for page in pages:
        cleaned = normalize_text(str(page.get("text", "")))
        if len(cleaned) >= config.min_text_chars_per_page:
            pages_with_text += 1
    ratio = pages_with_text / max(1, len(pages))
    return ratio >= config.min_text_pages_ratio


def is_low_quality(quality: TextQuality, config: DoclingProcessingConfig) -> bool:
    effective_confidence = (
        quality.effective_confidence_proxy
        if quality.effective_confidence_proxy is not None
        else quality.confidence_proxy
    )
    return effective_confidence < config.quality_confidence_threshold


def should_rasterize_text_layer(has_text_layer: bool, low_quality: bool, config: DoclingProcessingConfig) -> bool:
    if config.ocr_mode == "force":
        return True
    return bool(has_text_layer and low_quality and config.force_ocr_on_low_quality_text)


def decide_per_page_ocr(
    has_text_layer: bool,
    quality: TextQuality,
    config: DoclingProcessingConfig,
) -> Tuple[bool, str]:
    if config.force_per_page_ocr:
        return True, "Per-page OCR forced by config"
    if not config.per_page_ocr_on_low_quality:
        return False, "Per-page OCR disabled by config"
    if not has_text_layer and is_low_quality(quality, config):
        return True, "Low-quality scan detected"
    if quality.suspicious_token_ratio > config.quality_suspicious_token_threshold:
        return True, "High suspicious token ratio"
    if quality.avg_chars_per_page < config.quality_min_avg_chars_per_page:
        return True, "Low text density"
    return False, "Quality metrics acceptable"


def select_language_set(
    language_hint: Optional[str],
    filename: str,
    config: DoclingProcessingConfig,
) -> str:
    hint = (language_hint or "").lower().strip()
    name = os.path.basename(filename).lower()

    # import langcodes

    def normalize_hint(h: str) -> str:
        if not h:
            return ""
        try:
            lang = langcodes.find(h)
            code = lang.to_alpha3()
            if code == "deu":
                return config.default_lang_german
            if code == "eng":
                return config.default_lang_english
            if code == "fra":
                return "fra+eng"  # French + English fallback
            if code == "pol":
                return "pol+eng"  # Polish + English fallback
            if code == "ita":
                return "ita+eng"  # Italian + English fallback
            if code == "spa":
                return "spa+eng"  # Spanish + English fallback
            if code == "por":
                return "por+eng"  # Portuguese + English fallback
            if code == "nld" or code == "dut":
                return "nld+eng"  # Dutch + English fallback
            if code == "swe":
                return "swe+eng"  # Swedish + English fallback
            if code == "nor":
                return "nor+eng"  # Norwegian + English fallback
            if code == "dan":
                return "dan+eng"  # Danish + English fallback
            if code == "fin":
                return "fin+eng"  # Finnish + English fallback
            if code == "rus":
                return "rus+eng"  # Russian + English fallback
            if code == "ces" or code == "cze":
                return "ces+eng"  # Czech + English fallback
            if code == "ell" or code == "gre":
                return "ell+eng"  # Greek + English fallback
            # Add more as needed
            return code
        except Exception:
            return h

    if hint:
        return normalize_hint(hint)

    # Try to infer from filename using langcodes
    for pattern, lang_code in [
        (r"(\\bde\\b|_de\\b|-de\\b|deu|german|deutsch)", config.default_lang_german),
        (r"(\\bfr\\b|_fr\\b|-fr\\b|fra|french|francais|fran\xE7ais)", "fra+eng"),
        (r"(\\bit\\b|_it\\b|-it\\b|ita|italian|italiano)", "ita+eng"),
        (r"(\\bes\\b|_es\\b|-es\\b|spa|spanish|espanol|espa\xF1ol)", "spa+eng"),
        (r"(\\bpl\\b|_pl\\b|-pl\\b|pol|polish|polski)", "pol+eng"),
        (r"(\\bpt\\b|_pt\\b|-pt\\b|por|portuguese|portugu\xEAs|portugues)", "por+eng"),
        (r"(\\bnl\\b|_nl\\b|-nl\\b|nld|dut|dutch|nederlands)", "nld+eng"),
        (r"(\\bsv\\b|_sv\\b|-sv\\b|swe|swedish|svenska)", "swe+eng"),
        (r"(\\bno\\b|_no\\b|-no\\b|nor|norsk|bokmal|bokm\xE5l|nynorsk)", "nor+eng"),
        (r"(\\bda\\b|_da\\b|-da\\b|dan|danish|dansk)", "dan+eng"),
        (r"(\\bfi\\b|_fi\\b|-fi\\b|fin|finnish|suomi)", "fin+eng"),
        (r"(\\bru\\b|_ru\\b|-ru\\b|rus|russian|\u0440\u0443\u0441)", "rus+eng"),
        (r"(\\bcs\\b|_cs\\b|-cs\\b|ces|cze|czech|\u010De\u0161tina|cesky|\u010Desky)", "ces+eng"),
        (r"(\\bel\\b|_el\\b|-el\\b|ell|greek|\u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC)", "ell+eng"),
    ]:
        if re.search(pattern, name):
            return lang_code
    return config.default_lang_english


def normalize_languages_for_engine(languages: str, engine: str) -> str:
    lang = languages.lower()
    if engine == "paddle":
        # PaddleOCR expects ISO 639-1 or specific language names (e.g., 'german', 'french', etc.)
        try:
            # Use the first language if multiple are given
            first_lang = lang.split('+')[0].strip()
            code = langcodes.find(first_lang)
            paddle_map = {
                "de": "german",
                "deu": "german",
                "fr": "french",
                "fra": "french",
                "en": "en",
                "eng": "en",
                "it": "italian",
                "ita": "italian",
                "es": "spanish",
                "spa": "spanish",
                "pl": "polish",
                "pol": "polish",
                "pt": "portuguese",
                "por": "portuguese",
                "ru": "russian",
                "rus": "russian",
            }
            alpha2 = code.to_alpha2()
            alpha3 = code.to_alpha3()
            if alpha2 in paddle_map:
                return paddle_map[alpha2]
            if alpha3 in paddle_map:
                return paddle_map[alpha3]
        except Exception:
            return "en"
        return "en"
    return languages


def get_pdf_max_page_points(pdf_path: str, max_pages: int = 3) -> Optional[float]:
    try:
        from pypdf import PdfReader
    except Exception:
        return None
    try:
        reader = PdfReader(pdf_path)
        max_side = 0.0
        total_pages = len(reader.pages)
        sample_count = min(max_pages, total_pages)
        for idx in range(sample_count):
            page = reader.pages[idx]
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
            max_side = max(max_side, width, height)
        return max_side or None
    except Exception:
        return None


def decide_ocr_route(
    has_text_layer: bool,
    quality: TextQuality,
    available_engines: Sequence[str],
    config: DoclingProcessingConfig,
    languages: str,
) -> OcrRouteDecision:
    low_quality = is_low_quality(quality, config)
    force_external_for_paddle_layout = bool(
        config.prefer_ocr_engine == "paddle"
        and (
            getattr(config, "paddle_use_paddlex_layout", False)
            or getattr(config, "paddle_use_vl", False)
        )
        and config.ocr_mode != "off"
        and (config.ocr_mode == "force" or not has_text_layer or low_quality)
    )
    if config.ocr_mode == "off":
        return OcrRouteDecision(
            False,
            "none",
            languages,
            "OCR disabled by config",
            False,
            False,
            "Per-page OCR disabled by config",
        )

    if config.ocr_mode == "force":
        ocr_used = True
        route_reason = "OCR forced by config"
    elif has_text_layer and not (config.force_ocr_on_low_quality_text and low_quality) and not force_external_for_paddle_layout:
        return OcrRouteDecision(
            False,
            "none",
            languages,
            "Text layer detected",
            False,
            False,
            "Per-page OCR not applicable (text layer)",
        )
    else:
        ocr_used = True
        if has_text_layer:
            if force_external_for_paddle_layout:
                route_reason = "Text layer detected; external OCR forced for Paddle layout"
            else:
                route_reason = "Text layer detected but low quality"
        else:
            route_reason = "No usable text layer detected"

    engine = "docling"
    use_external = False
    if ocr_used:
        if config.prefer_ocr_engine in available_engines:
            engine = config.prefer_ocr_engine
            use_external = True
        elif config.fallback_ocr_engine in available_engines:
            engine = config.fallback_ocr_engine
            use_external = True

    per_page = False
    per_page_reason = "Per-page OCR not applicable"
    if use_external:
        per_page, per_page_reason = decide_per_page_ocr(has_text_layer, quality, config)
    if low_quality and not has_text_layer:
        route_reason = f"{route_reason}; low-quality scan suspected"

    return OcrRouteDecision(ocr_used, engine, languages, route_reason, use_external, per_page, per_page_reason)


def detect_available_ocr_engines() -> List[str]:
    available: List[str] = []
    try:
        import paddleocr  # noqa: F401
        import paddle  # noqa: F401
        from pdf2image import convert_from_path  # noqa: F401
        available.append("paddle")
    except Exception:
        pass
    try:
        import pytesseract  # noqa: F401
        from pdf2image import convert_from_path  # noqa: F401
        if find_tesseract_path():
            available.append("tesseract")
    except Exception:
        pass
    return available


def load_default_wordlist(config: DoclingProcessingConfig) -> Sequence[str]:
    path = config.dictionary_path
    if not path:
        path = os.path.join(os.path.dirname(__file__), config.default_dictionary_name)
    if not path or not os.path.isfile(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return [line.strip() for line in handle if line.strip() and not line.startswith("#")]
    except Exception as exc:
        LOGGER.warning("Failed to load dictionary word list: %s", exc)
        return []


def prepare_dictionary_words(config: DoclingProcessingConfig) -> Sequence[str]:
    if not config.enable_dictionary_correction:
        return []
    if config.dictionary_words:
        return [word.strip() for word in config.dictionary_words if word and word.strip()]
    words = load_default_wordlist(config)
    if not words:
        LOGGER.warning("Dictionary correction enabled but no wordlist was loaded.")
    return words


def build_spellchecker_for_languages(config: DoclingProcessingConfig, languages: str):
    """
    Build a cross-platform spellchecker adapter with a .spell(word) method.
    Tries:
      1) hunspell (C binding) if available
      2) spylls (pure Python) if available
    Returns an object with .spell(str)->bool, or None if unavailable.
    """
    if not config.enable_hunspell:
        return None
    cache_key = f"{languages}|{config.hunspell_aff_path or ''}|{config.hunspell_dic_path or ''}"
    if cache_key in SPELLCHECKER_CACHE:
        return SPELLCHECKER_CACHE[cache_key]

    # Resolve aff/dic paths (explicit or auto in tools/hunspell)
    def resolve_paths() -> List[Tuple[str, str]]:
        pairs: List[Tuple[str, str]] = []
        aff = config.hunspell_aff_path
        dic = config.hunspell_dic_path
        if aff and dic and os.path.isfile(aff) and os.path.isfile(dic):
            pairs.append((aff, dic))
            return pairs
        base_dir = os.path.join(os.path.dirname(__file__), "hunspell")
        lang = (languages or "").lower()
        try_codes: List[str] = []
        if any(t in lang for t in ("de", "deu", "german", "deutsch")):
            try_codes += ["de_DE", "de_AT", "de_CH"]
        if any(t in lang for t in ("en", "eng", "english")):
            try_codes += ["en_US", "en_GB"]
        if not try_codes:
            try_codes = ["en_US"]
        # Exact matches first
        for code in try_codes:
            aff_path = os.path.join(base_dir, f"{code}.aff")
            dic_path = os.path.join(base_dir, f"{code}.dic")
            if os.path.isfile(aff_path) and os.path.isfile(dic_path):
                pairs.append((aff_path, dic_path))
        if pairs:
            return pairs

        # Flexible matching: accept stems like de_DE_frami.* or en_US-large.* when both files share the same stem
        try:
            names = os.listdir(base_dir)
        except Exception:
            names = []
        stems_with_aff = {n[:-4] for n in names if n.endswith(".aff")}
        stems_with_dic = {n[:-4] for n in names if n.endswith(".dic")}
        common_stems = list(stems_with_aff & stems_with_dic)

        def stem_priority(stem: str, code: str) -> int:
            # Higher number = higher priority
            if stem == code:
                return 3
            if stem.startswith(code + "_"):
                return 2
            if code in stem:
                return 1
            return 0

        for code in try_codes:
            candidates = sorted(
                [s for s in common_stems if stem_priority(s, code) > 0],
                key=lambda s: stem_priority(s, code),
                reverse=True,
            )
            for stem in candidates:
                aff_path = os.path.join(base_dir, f"{stem}.aff")
                dic_path = os.path.join(base_dir, f"{stem}.dic")
                if os.path.isfile(aff_path) and os.path.isfile(dic_path):
                    pairs.append((aff_path, dic_path))
                    break
        return pairs


    pairs = resolve_paths()
    # If no pairs found, try to download on demand
    if not pairs:
        # Map special cases for repo structure
        repo_map = {
            "de_DE": ("de", "de_DE_frami"),
            "de_AT": ("de", "de_AT"),
            "de_CH": ("de", "de_CH"),
            "en_US": ("en", "en_US"),
            "en_GB": ("en", "en_GB"),
            "fr_FR": ("fr_FR", "fr"),
            "es_ES": ("es", "es"),
            "it_IT": ("it_IT", "it_IT"),
            "pl_PL": ("pl_PL", "pl_PL"),
            "pt_PT": ("pt_PT", "pt_PT"),
            "pt_BR": ("pt_BR", "pt_BR"),
            "nl_NL": ("nl_NL", "nl_NL"),
            "sv_SE": ("sv_SE", "sv_SE"),
            "da_DK": ("da_DK", "da_DK"),
            "fi_FI": ("fi_FI", "fi_FI"),
            "ru_RU": ("ru_RU", "ru_RU"),
            "cs_CZ": ("cs_CZ", "cs_CZ"),
            "el_GR": ("el_GR", "el_GR"),
        }
        lang_code = None
        lang = (languages or "").lower()
        if any(t in lang for t in ("de", "deu", "german", "deutsch")):
            lang_code = "de_DE"
        elif any(t in lang for t in ("en", "eng", "english")):
            lang_code = "en_US"
        elif any(t in lang for t in ("fr", "fra", "french", "francais", "fran\xE7ais")):
            lang_code = "fr_FR"
        elif any(t in lang for t in ("es", "spa", "spanish", "espanol", "espa\xF1ol")):
            lang_code = "es_ES"
        elif any(t in lang for t in ("it", "ita", "italian", "italiano")):
            lang_code = "it_IT"
        elif any(t in lang for t in ("pl", "pol", "polish", "polski")):
            lang_code = "pl_PL"
        elif any(t in lang for t in ("pt", "por", "portuguese", "portugu\xEAs", "portugues")):
            lang_code = "pt_PT"
        elif any(t in lang for t in ("nl", "nld", "dut", "dutch", "nederlands")):
            lang_code = "nl_NL"
        elif any(t in lang for t in ("sv", "swe", "swedish", "svenska")):
            lang_code = "sv_SE"
        elif any(t in lang for t in ("da", "dan", "danish", "dansk")):
            lang_code = "da_DK"
        elif any(t in lang for t in ("fi", "fin", "finnish", "suomi")):
            lang_code = "fi_FI"
        elif any(t in lang for t in ("ru", "rus", "russian", "\u0440\u0443\u0441")):
            lang_code = "ru_RU"
        elif any(t in lang for t in ("cs", "ces", "cze", "czech", "\u010De\u0161tina", "\u010Desky", "cesky")):
            lang_code = "cs_CZ"
        elif any(t in lang for t in ("el", "ell", "greek", "\u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC")):
            lang_code = "el_GR"
        if not lang_code:
            lang_code = "en_US"
        folder, prefix = repo_map.get(lang_code, (lang_code, lang_code))
        base_url = f"https://raw.githubusercontent.com/LibreOffice/dictionaries/master/{folder}/"
        aff_name = f"{prefix}.aff"
        dic_name = f"{prefix}.dic"
        aff_url = base_url + aff_name
        dic_url = base_url + dic_name
        out_dir = os.path.join(os.path.dirname(__file__), "hunspell")
        os.makedirs(out_dir, exist_ok=True)
        aff_path = os.path.join(out_dir, f"{lang_code}.aff")
        dic_path = os.path.join(out_dir, f"{lang_code}.dic")
        def download(url, out_path):
            try:
                import urllib.request
                print(f"Downloading {url} -> {out_path}")
                urllib.request.urlretrieve(url, out_path)
                return True
            except Exception as exc:
                print(f"Failed to download {url}: {exc}")
                return False
        ok_aff = download(aff_url, aff_path)
        ok_dic = download(dic_url, dic_path)
        if ok_aff and ok_dic:
            print(f"Successfully downloaded Hunspell dictionary for {lang_code} to {out_dir}")
        # Try to resolve again
        pairs = resolve_paths()

    # Attempt hunspell binding first
    try:
        import hunspell  # type: ignore

        for aff_path, dic_path in pairs:
            try:
                hs = hunspell.HunSpell(dic_path, aff_path)
                LOGGER.info(
                    "Spellchecker: using hunspell binding (%s, %s)",
                    os.path.basename(dic_path),
                    os.path.basename(aff_path),
                )
                try:
                    # Record details for external visibility
                    LAST_SPELLCHECKER_INFO.update({
                        "backend": "hunspell",
                        "dic": dic_path,
                        "aff": aff_path,
                    })
                except Exception:
                    pass
                SPELLCHECKER_CACHE[cache_key] = hs
                return hs
            except Exception:
                continue
    except Exception:
        pass

    # Attempt spylls fallback (pure Python)
    try:
        from spylls.hunspell import Dictionary as SpyllsDictionary  # type: ignore

        class SpyllsWrapper:
            def __init__(self, d):
                self.d = d

            def spell(self, word: str) -> bool:
                # Try common case variants to recognize lowercased nouns etc.
                variants = [word, word.lower(), word.capitalize(), word.title(), word.upper()]
                seen = set()
                for v in variants:
                    if v in seen:
                        continue
                    seen.add(v)
                    try:
                        if hasattr(self.d, "lookup") and self.d.lookup(v):
                            return True
                    except Exception:
                        pass
                    try:
                        sugg = self.d.suggest(v)
                        if isinstance(sugg, (list, tuple)) and v in sugg:
                            return True
                    except Exception:
                        pass
                return False

        for aff_path, dic_path in pairs:
            try:
                d = None
                errors: List[str] = []
                # Variant A: (aff, dic)
                try:
                    d = SpyllsDictionary.from_files(aff_path, dic_path)
                except Exception as eA:
                    errors.append(f"A(aff,dic): {eA}")
                # Variant B: directory containing both
                if d is None:
                    try:
                        d = SpyllsDictionary.from_files(os.path.dirname(dic_path))
                    except Exception as eB:
                        errors.append(f"B(dir): {eB}")
                # Variant C: stem without extension
                if d is None:
                    try:
                        stem = os.path.splitext(dic_path)[0]
                        d = SpyllsDictionary.from_files(stem)
                    except Exception as eC:
                        errors.append(f"C(stem): {eC}")
                # Variant D: single-path dic
                if d is None:
                    try:
                        d = SpyllsDictionary.from_files(dic_path)
                    except Exception as eD:
                        errors.append(f"D(dic): {eD}")
                # Variant E: single-path aff
                if d is None:
                    try:
                        d = SpyllsDictionary.from_files(aff_path)
                    except Exception as eE:
                        errors.append(f"E(aff): {eE}")

                if d is None:
                    raise RuntimeError("spylls load failed: " + "; ".join(errors))

                LOGGER.info(
                    "Spellchecker: using spylls fallback (%s, %s)",
                    os.path.basename(dic_path),
                    os.path.basename(aff_path),
                )
                try:
                    LAST_SPELLCHECKER_INFO.update({
                        "backend": "spylls",
                        "dic": dic_path,
                        "aff": aff_path,
                    })
                except Exception:
                    pass
                wrapper = SpyllsWrapper(d)
                SPELLCHECKER_CACHE[cache_key] = wrapper
                return wrapper
            except Exception:
                continue
    except Exception:
        pass

    # Naive .dic fallback (no affix rules) when hunspell/spylls are unavailable
    try:
        class NaiveDicWrapper:
            def __init__(self, words: Sequence[str]):
                self.words = set(w.lower() for w in words if w)

            def spell(self, word: str) -> bool:
                variants = [word, word.lower(), word.capitalize(), word.title(), word.upper()]
                for v in variants:
                    if v.lower() in self.words:
                        return True
                return False

        def load_naive_dic(path: str) -> Optional[NaiveDicWrapper]:
            try:
                entries: List[str] = []
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    first = True
                    for raw in fh:
                        line = raw.strip().lstrip("\\ufeff")
                        if not line:
                            continue
                        if first and line.isdigit():
                            first = False
                            continue
                        first = False
                        base = line.split("/")[0].strip()
                        if base:
                            entries.append(base)
                if entries:
                    LOGGER.info("Spellchecker: using naive .dic (%s) entries=%d", os.path.basename(path), len(entries))
                    return NaiveDicWrapper(entries)
            except Exception as exc:
                LOGGER.warning("Naive .dic load failed for %s: %s", path, exc)
            return None

        # Prefer .dic paths discovered via resolve_paths(); otherwise scan tools/hunspell
        dic_paths: List[str] = []
        for _aff, _dic in pairs:
            if os.path.isfile(_dic):
                dic_paths.append(_dic)
        if not dic_paths:
            base_dir = os.path.join(os.path.dirname(__file__), "hunspell")
            try:
                candidates = [os.path.join(base_dir, name) for name in os.listdir(base_dir) if name.endswith(".dic")]
            except Exception:
                candidates = []
            lang = (languages or "").lower()
            filtered: List[str] = []
            for p in candidates:
                name = os.path.basename(p).lower()
                if ("en" in lang or "eng" in lang) and (name.startswith("en_") or name.startswith("en")):
                    filtered.append(p)
                if ("de" in lang or "deu" in lang or "german" in lang or "deutsch" in lang) and (name.startswith("de_") or name.startswith("de")):
                    filtered.append(p)
            dic_paths = filtered or candidates

        for dic_path in dic_paths:
            wrapper = load_naive_dic(dic_path)
            if wrapper is not None:
                SPELLCHECKER_CACHE[cache_key] = wrapper
                return wrapper
    except Exception:
        pass

    LOGGER.info("Spellchecker: no hunspell/spylls dictionary available")
    try:
        LAST_SPELLCHECKER_INFO.update({"backend": "none"})
    except Exception:
        pass
    return None


def apply_dictionary_correction(text: str, wordlist: Sequence[str], hs=None) -> str:
    if not wordlist:
        # If Hunspell available, do a minimal pass using it only
        if hs is None:
            return text
        dictionary = set()
    else:
        dictionary = {word.lower() for word in wordlist}
    token_re = re.compile(r"[A-Za-z0-9]+")

    def match_case(candidate: str, original: str) -> str:
        if original.isupper():
            return candidate.upper()
        if original[:1].isupper():
            return candidate.capitalize()
        return candidate

    def generate_candidates(token: str) -> Iterable[str]:
        candidates: List[str] = []
        if any(char.isdigit() for char in token) and any(char.isalpha() for char in token):
            candidates.append(token.replace("0", "o"))
            candidates.append(token.replace("1", "l"))
            candidates.append(token.replace("5", "s"))
        if "rn" in token:
            candidates.append(token.replace("rn", "m"))
        return candidates

    def replace_token(match: re.Match) -> str:
        token = match.group(0)
        lower = token.lower()
        if lower in dictionary or (hs is not None and hs.spell(token)):
            return token
        for candidate in generate_candidates(token):
            cand_lower = candidate.lower()
            if cand_lower in dictionary or (hs is not None and hs.spell(candidate)):
                replaced = match_case(candidate, token)
                try:
                    LOGGER.info("Dict correction: %s -> %s", token, replaced)
                except Exception:
                    pass
                return replaced
        return token

    return token_re.sub(replace_token, text)


def apply_umlaut_corrections(text: str, languages: str, wordlist: Sequence[str], hs=None) -> str:
    """
    Convert ASCII digraphs ae/oe/ue to German umlauts \xE4/\xF6/\xFC more comprehensively.

    Strategy:
    - If a dictionary is provided, prefer candidates that appear in it.
    - Otherwise, use word frequency (wordfreq.zipf_frequency) for German to
      select candidates whose frequency noticeably exceeds the original.
    - Preserve original casing (UPPER, Title, lower).
    - Only operate when language is German.
    - Keep conservative: if no strong signal, leave token unchanged.
    """
    lang = (languages or "").lower()
    if not any(token in lang for token in ("de", "deu", "german", "deutsch")):
        return text

    dictionary = {word.lower() for word in (wordlist or [])}

    try:
        from wordfreq import zipf_frequency as _zipf
    except Exception:
        _zipf = None  # wordfreq optional

    ascii_to_umlaut = (("ae", "\\u00e4"), ("oe", "\\u00f6"), ("ue", "\\u00fc"))

    def case_match(candidate: str, original: str) -> str:
        if original.isupper():
            return candidate.upper()
        if original[:1].isupper() and original[1:].islower():
            return candidate.capitalize()
        return candidate

    def generate_variants(token_lower: str) -> List[str]:
        # Generate all unique variants by replacing any subset of ae/oe/ue occurrences
        indices: List[Tuple[int, str, str]] = []
        for ascii_seq, uml in ascii_to_umlaut:
            start = 0
            while True:
                idx = token_lower.find(ascii_seq, start)
                if idx == -1:
                    break
                # Heuristic: avoid replacing "ue" when preceded by 'e' (e.g., "neue", "Treue")
                if ascii_seq == "ue" and idx > 0 and token_lower[idx - 1] == "e":
                    pass
                else:
                    indices.append((idx, ascii_seq, uml))
                start = idx + 1 if idx != -1 else start

        if not indices:
            return []

        # Build combinations
        variants = {token_lower}
        for idx, ascii_seq, uml in indices:
            new_set = set()
            for base in variants:
                # Replace at the same position if still matching
                if base[idx:idx + len(ascii_seq)] == ascii_seq:
                    new_set.add(base[:idx] + uml + base[idx + len(ascii_seq):])
                new_set.add(base)
            variants = new_set
        return [v for v in variants if v != token_lower]

    def pick_best(token: str) -> str:
        lower = token.lower()
        # Quick path: if already contains umlaut, skip
        if any(ch in lower for ch in ("\xE4", "\xF6", "\xFC")):
            return token

        # Generate candidate variants
        candidates = generate_variants(lower)
        if not candidates:
            return token

        # Score candidates
        best = None
        best_score = float("-inf")
        # Base frequency for original
        base_freq = _zipf(lower, "de") if _zipf else 0.0
        for cand in candidates:
            score = 0.0
            if cand in dictionary or (hs is not None and hs.spell(cand)):
                score += 10.0  # strong signal from dictionary
            if _zipf:
                freq = _zipf(cand, "de")
                # Prefer if notably more frequent than original
                score += (freq - base_freq)
            # Prefer shorter (umlaut variant shortens by 1 char per replacement)
            score += (len(lower) - len(cand)) * 0.05
            if score > best_score:
                best = cand
                best_score = score

        # Acceptance threshold: either in dictionary or frequency improved by >= 0.5
        accept = False
        if best is not None:
            if best in dictionary or (hs is not None and hs.spell(best)):
                accept = True
            elif _zipf:
                if (_zipf(best, "de") - base_freq) >= 0.5:
                    accept = True

        if not accept or not best:
            return token
        replaced = case_match(best, token)
        try:
            LOGGER.info("Umlaut correction: %s -> %s", token, replaced)
        except Exception:
            pass
        return replaced

    # Replace word tokens conservatively (length >= 4 to avoid short codes)
    return re.sub(r"[A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{4,}", lambda m: pick_best(m.group(0)), text)


def restore_missing_spaces(text: str, languages: str, hs=None) -> str:
    """
    Conservatively insert spaces inside overlong tokens when a split yields two
    valid words (by Hunspell/Splylls or by wordfreq Zipf >= 3.0 for target langs).

    Heuristics:
    - Consider tokens of length >= 12 with only letters (incl. German chars).
    - Prefer camelCase boundaries (a\u2026zA\u2026Z) when both sides are valid.
    - Otherwise, try a single split; accept only if BOTH parts look valid.
    - Log accepted splits.
    """
    try:
        from wordfreq import zipf_frequency as _zipf
    except Exception:
        _zipf = None

    lang_codes = select_wordfreq_languages(languages)

    def score_word(w: str) -> Tuple[float, bool]:
        spelled = False
        try:
            if hs is not None and (hs.spell(w) or hs.spell(w.lower())):
                spelled = True
        except Exception:
            pass
        if spelled:
            return 4.0, True
        if _zipf is None:
            return 0.0, False
        try:
            z = max(_zipf(w.lower(), lc) for lc in lang_codes)
        except Exception:
            z = 0.0
        return float(z), False

    token_re = re.compile(r"[A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{12,}")

    def consider_split(tok: str) -> str:
        base_score, base_dict = score_word(tok)
        if base_dict or base_score >= 3.0:
            return tok
        best = None  # type: Optional[Tuple[str, float, bool, str, float, bool]]

        # Try camelCase boundary first: a\u2026zA\u2026Z
        for m in re.finditer(r"([a-z\xE4\xF6\xFC\xDF])([A-Z\xC4\xD6\xDC])", tok):
            i = m.start(2)
            left, right = tok[:i], tok[i:]
            if len(left) < 3 or len(right) < 3:
                continue
            s1, d1 = score_word(left)
            s2, d2 = score_word(right)
            if (d1 or s1 >= 3.0) and (d2 or s2 >= 3.0):
                combined = s1 + s2
                best = (left, s1, d1, right, s2, d2)
                break

        # Otherwise, try single split positions
        if best is None:
            n = len(tok)
            for i in range(3, n - 2):
                left, right = tok[:i], tok[i:]
                if len(left) < 3 or len(right) < 3:
                    continue
                s1, d1 = score_word(left)
                s2, d2 = score_word(right)
                if (d1 or s1 >= 3.0) and (d2 or s2 >= 3.0):
                    combined = s1 + s2
                    if best is None or combined > (best[1] + best[4]):
                        best = (left, s1, d1, right, s2, d2)

        if best is None:
            return tok

        left, s1, d1, right, s2, d2 = best
        replacement = f"{left} {right}"
        try:
            LOGGER.info(
                "Inserted space: %s -> %s (scores=%.2f/%.2f, dict=%s/%s)",
                tok,
                replacement,
                s1,
                s2,
                d1,
                d2,
            )
        except Exception:
            pass
        return replacement

    return token_re.sub(lambda m: consider_split(m.group(0)), text)


def should_apply_llm_correction(text: str, config: DoclingProcessingConfig) -> bool:
    if not config.enable_llm_correction:
        return False
    if not config.llm_correct:
        return False
    if config.llm_correction_max_chars and len(text) > config.llm_correction_max_chars:
        return False
    languages = select_language_set(config.language_hint, "", config)
    quality = estimate_text_quality([{"text": text}], config, languages)
    return quality.confidence_proxy < config.llm_correction_min_quality


def build_llm_cleanup_callback(config: DoclingProcessingConfig) -> Optional[Callable[[str], str]]:
    if not config.enable_llm_correction:
        return None
    if not config.llm_cleanup_base_url or not config.llm_cleanup_model:
        LOGGER.warning("LLM cleanup enabled but base URL or model is missing.")
        return None

    base_url = config.llm_cleanup_base_url.rstrip("/")
    endpoint = f"{base_url}/chat/completions"
    api_key = (config.llm_cleanup_api_key or "").strip()

    def _requires_default_temperature(model_name: str) -> bool:
        name = (model_name or "").lower()
        return "gpt-5" in name or name.startswith("gpt5")

    def _call(text: str) -> str:
        try:
            import requests
        except Exception as exc:
            LOGGER.warning("requests not available for LLM cleanup: %s", exc)
            return text

        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        payload = {
            "model": config.llm_cleanup_model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an OCR cleanup assistant. Fix OCR errors without changing meaning. "
                        "Do not add content. Return corrected text only."
                        "Detect footnote references and definitions and format them in Markdown as [^n] and [^n]: (for the note text). Preserve special characters and formatting. Do not create new footnotes or content; only reformat existing footnote markers/lines."
                    ),
                },
                {"role": "user", "content": text},
            ],
        }
        if not _requires_default_temperature(config.llm_cleanup_model) or config.llm_cleanup_temperature == 1.0:
            payload["temperature"] = config.llm_cleanup_temperature
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=config.llm_cleanup_timeout_sec)
            response.raise_for_status()
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content")
            if content:
                return str(content).strip()
        except Exception as exc:
            LOGGER.warning("LLM cleanup failed: %s", exc)
        return text

    return _call


def postprocess_text(
    text: str,
    config: DoclingProcessingConfig,
    languages: str,
    wordlist: Sequence[str],
    allow_missing_space: bool = True,
    progress_cb: Optional[ProgressCallback] = None,
    progress_label: Optional[str] = None,
) -> str:
    if not text:
        return text
    cleaned = dehyphenate_text(text)
    cleaned = replace_ligatures(cleaned)
    cleaned = normalize_whitespace(cleaned)
    hs = build_spellchecker_for_languages(config, languages) if config.enable_hunspell else None
    try:
        from wordfreq import zipf_frequency as _zipf
    except Exception:
        _zipf = None
    lang_codes = select_wordfreq_languages(languages)

    dictionary = {word.lower() for word in (wordlist or [])}

    def is_valid_word(word: str) -> bool:
        lower = word.lower()
        if lower in dictionary:
            return True
        if hs is not None and (hs.spell(word) or hs.spell(lower)):
            return True
        if _zipf is not None:
            try:
                return max(_zipf(lower, lc) for lc in lang_codes) >= 3.0
            except Exception:
                return False
        return False

    def match_case(candidate: str, original: str) -> str:
        if original.isupper():
            return candidate.upper()
        if original[:1].isupper():
            return candidate.capitalize()
        return candidate

    def merge_broken_words(input_text: str) -> str:
        token_re = re.compile(r"\\b([A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{2,})\\s+([A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{2,})\\b")

        def repl(match: re.Match) -> str:
            w1 = match.group(1)
            w2 = match.group(2)
            combined = w1 + w2
            if len(combined) < 5:
                return match.group(0)
            if not is_valid_word(combined):
                return match.group(0)
            w1_ok = is_valid_word(w1)
            w2_ok = is_valid_word(w2)
            if w1_ok and w2_ok:
                return match.group(0)
            return match_case(combined, w1)

        prev = input_text
        for _ in range(2):
            updated = token_re.sub(repl, prev)
            if updated == prev:
                break
            prev = updated
        return prev
    # Attempt to restore missing spaces before word-level corrections
    if allow_missing_space:
        try:
            restored = restore_missing_spaces(cleaned, languages, hs)
            if restored != cleaned:
                LOGGER.info("Applied missing-space restoration pass")
            cleaned = restored
        except Exception as exc:
            LOGGER.warning("Missing-space restoration failed: %s", exc)

    def split_concatenated_words(input_text: str) -> str:
        token_re = re.compile(r"[A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{6,}")
        has_caps_re = re.compile(r"[a-z\xE4\xF6\xFC\xDF][A-Z\xC4\xD6\xDC]")

        def score_word(word: str) -> Tuple[float, bool]:
            spelled = False
            try:
                if hs is not None and (hs.spell(word) or hs.spell(word.lower())):
                    spelled = True
            except Exception:
                pass
            if spelled:
                return 5.0, True
            if _zipf is None:
                return 0.0, False
            try:
                z = max(_zipf(word.lower(), lc) for lc in lang_codes)
            except Exception:
                z = 0.0
            return float(z), False

        def is_strong_word(word: str) -> bool:
            score, spelled = score_word(word)
            return spelled or score >= 4.0

        def repl(match: re.Match) -> str:
            tok = match.group(0)
            base_score, base_dict = score_word(tok)
            if base_dict or base_score >= 3.0:
                return tok
            if len(tok) < 10 and not has_caps_re.search(tok):
                return tok

            best = None  # type: Optional[Tuple[str, float, str, float]]
            for i in range(3, len(tok) - 2):
                left, right = tok[:i], tok[i:]
                if len(left) < 3 or len(right) < 3:
                    continue
                if not (is_strong_word(left) and is_strong_word(right)):
                    continue
                s1, _ = score_word(left)
                s2, _ = score_word(right)
                combined = s1 + s2
                if best is None or combined > (best[1] + best[3]):
                    best = (left, s1, right, s2)

            if best is None:
                return tok
            left, s1, right, s2 = best
            if _zipf is not None and (s1 + s2) - base_score < 3.0:
                return tok
            try:
                LOGGER.info(
                    "Split concat: %s -> %s %s (scores=%.2f/%.2f base=%.2f)",
                    tok,
                    left,
                    right,
                    s1,
                    s2,
                    base_score,
                )
            except Exception:
                pass
            return f"{left} {right}"

        return token_re.sub(repl, input_text)

    cleaned = split_concatenated_words(cleaned)
    cleaned = merge_broken_words(cleaned)
    if config.enable_dictionary_correction or hs is not None:
        cleaned = apply_dictionary_correction(cleaned, wordlist, hs)
    cleaned = apply_umlaut_corrections(cleaned, languages, wordlist, hs)
    if should_apply_llm_correction(cleaned, config) and config.llm_correct:
        if progress_cb:
            label = f"LLM cleanup ({progress_label})" if progress_label else "LLM cleanup..."
            progress_cb(100, "llm_cleanup", label)
        cleaned = config.llm_correct(cleaned)
    return cleaned

def postprocess_text_light(
    text: str,
    config: DoclingProcessingConfig,
    languages: str,
    wordlist: Sequence[str],
    for_markdown: bool = False,
) -> str:
    if not text:
        return text
    cleaned = dehyphenate_text(text)
    cleaned = replace_ligatures(cleaned)
    cleaned = normalize_display_markdown(cleaned) if for_markdown else normalize_whitespace(cleaned)
    hs = build_spellchecker_for_languages(config, languages) if config.enable_hunspell else None
    if config.enable_dictionary_correction or hs is not None:
        cleaned = apply_dictionary_correction(cleaned, wordlist, hs)
    cleaned = apply_umlaut_corrections(cleaned, languages, wordlist, hs)
    if should_apply_llm_correction(cleaned, config) and config.llm_correct:
        LOGGER.info("LLM cleanup applied (light mode)")
        cleaned = config.llm_correct(cleaned)
    return cleaned

def export_markdown(doc: Any) -> str:
    for method_name in ("export_to_markdown", "to_markdown", "export_to_md"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    for method_name in ("export_to_text", "to_text"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    return str(doc)


def export_text(doc: Any) -> str:
    for method_name in ("export_to_text", "to_text"):
        method = getattr(doc, method_name, None)
        if callable(method):
            return method()
    return str(doc)


def extract_pages(doc: Any) -> List[Dict[str, Any]]:
    pages: List[Dict[str, Any]] = []
    pages_attr = getattr(doc, "pages", None)
    if pages_attr is not None and not isinstance(pages_attr, (str, bytes, dict)):
        try:
            pages_list = list(pages_attr)
        except TypeError:
            pages_list = []
        if pages_list:
            for idx, page in enumerate(pages_list, start=1):
                page_num = getattr(page, "page_number", None) or getattr(page, "number", None) or idx
                text = None
                for attr in ("markdown", "md", "text", "content"):
                    if hasattr(page, attr):
                        value = getattr(page, attr)
                        text = value() if callable(value) else value
                        break
                if text is None and hasattr(page, "export_to_text"):
                    text = page.export_to_text()
                if text is None:
                    text = str(page)
                pages.append({"page_num": int(page_num), "text": str(text)})
            return pages

    full_text = export_text(doc)
    if full_text:
        pages.append({"page_num": 1, "text": full_text})
    return pages


def select_analysis_page_indices(
    total_pages: int,
    max_pages: Optional[int],
    sample_strategy: str,
) -> List[int]:
    if total_pages <= 0:
        return []
    if not max_pages or max_pages <= 0 or total_pages <= max_pages:
        return list(range(1, total_pages + 1))

    strategy = (sample_strategy or "first").lower()
    if strategy == "middle":
        start = max(1, (total_pages - max_pages) // 2 + 1)
        end = min(total_pages, start + max_pages - 1)
        return list(range(start, end + 1))
    return list(range(1, max_pages + 1))


def select_classifier_sample_indices(
    total_pages: int,
    sample_count: int,
    rng: random.Random,
) -> List[int]:
    if total_pages <= 0 or sample_count <= 0:
        return []
    anchors: List[int] = [0]
    if total_pages > 1:
        anchors.append(total_pages - 1)
    if total_pages > 2 and sample_count >= 3:
        mid = (total_pages - 1) // 2
        if mid not in anchors:
            anchors.insert(1, mid)
    if sample_count <= len(anchors):
        return anchors[:sample_count]
    selected = list(anchors)
    remaining = [idx for idx in range(total_pages) if idx not in anchors]
    needed = min(sample_count - len(selected), len(remaining))
    if needed > 0:
        selected.extend(rng.sample(remaining, needed))
    rng.shuffle(selected)
    return selected


def extract_pages_from_pdf(
    pdf_path: str,
    max_pages: Optional[int] = None,
    sample_strategy: str = "first",
) -> List[Dict[str, Any]]:
    try:
        from pypdf import PdfReader
    except Exception as exc:
        eprint(f"pypdf is not available for fallback page extraction: {exc}")
        return []

    pages: List[Dict[str, Any]] = []
    try:
        reader = PdfReader(pdf_path)
        page_indices = select_analysis_page_indices(len(reader.pages), max_pages, sample_strategy)
        for idx in page_indices:
            page = reader.pages[idx - 1]
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""
            image_count = 0
            try:
                resources = page.get("/Resources") or {}
                x_objects = resources.get("/XObject")
                if x_objects:
                    x_objects = x_objects.get_object() if hasattr(x_objects, "get_object") else x_objects
                    for obj in x_objects.values():
                        try:
                            resolved = obj.get_object() if hasattr(obj, "get_object") else obj
                            if resolved.get("/Subtype") == "/Image":
                                image_count += 1
                        except Exception:
                            continue
            except Exception:
                image_count = 0
            pages.append({"page_num": idx, "text": text, "image_count": image_count})
    except Exception as exc:
        eprint(f"Failed to extract pages with pypdf: {exc}")
        return []

    return pages


def split_markdown_sections(markdown: str) -> List[Dict[str, Any]]:
    sections: List[Dict[str, Any]] = []
    current_title = ""
    current_heading = ""
    current_lines: List[str] = []

    def flush() -> None:
        nonlocal current_title, current_heading, current_lines
        if current_title or current_heading or current_lines:
            sections.append({
                "title": current_title.strip(),
                "heading": current_heading.strip(),
                "text": "\\n".join(current_lines).strip(),
            })
        current_title = ""
        current_heading = ""
        current_lines = []

    for line in markdown.splitlines():
        if line.startswith("#"):
            flush()
            current_heading = line.rstrip()
            current_title = line.lstrip("#").strip()
        else:
            current_lines.append(line)

    flush()
    return sections


_MARKDOWN_TABLE_SEP_RE = re.compile(r"^\\s*\\|?\\s*:?-{2,}:?(?:\\s*\\|\\s*:?-{2,}:?)+\\s*\\|?\\s*$")


def extract_markdown_table_blocks(markdown: str) -> List[str]:
    if not markdown:
        return []
    lines = markdown.splitlines()
    blocks: List[str] = []
    idx = 0
    while idx < len(lines) - 1:
        line = lines[idx]
        if line.count("|") >= 2:
            sep_idx: Optional[int] = None
            if idx + 1 < len(lines) and _MARKDOWN_TABLE_SEP_RE.match(lines[idx + 1]):
                sep_idx = idx + 1
            elif (
                idx + 2 < len(lines)
                and not lines[idx + 1].strip()
                and _MARKDOWN_TABLE_SEP_RE.match(lines[idx + 2])
            ):
                sep_idx = idx + 2

            if sep_idx is not None:
                block_lines = [line, lines[sep_idx]]
                idx = sep_idx + 1
                while idx < len(lines):
                    row = lines[idx]
                    if not row.strip():
                        break
                    if row.count("|") < 2:
                        break
                    block_lines.append(row)
                    idx += 1
                blocks.append("\\n".join(block_lines).strip())
                continue

            # Fallback: headerless pipe tables (3+ consecutive pipe rows)
            if idx + 2 < len(lines):
                pipe_run = [line]
                scan = idx + 1
                while scan < len(lines):
                    row = lines[scan]
                    if not row.strip() or row.count("|") < 2:
                        break
                    pipe_run.append(row)
                    scan += 1
                if len(pipe_run) >= 3:
                    blocks.append("\\n".join(pipe_run).strip())
                    idx = scan
                    continue
        idx += 1
    return blocks


def build_page_table_map(
    markdown: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
) -> Dict[int, List[str]]:
    table_blocks = extract_markdown_table_blocks(markdown)
    if not table_blocks:
        return {}
    table_map: Dict[int, List[str]] = {}
    for block in table_blocks:
        page_start, _ = find_page_range(block, pages, config)
        if page_start <= 0:
            continue
        table_map.setdefault(int(page_start), []).append(block)
    return table_map


def inject_markdown_tables(text: str, table_blocks: Sequence[str]) -> str:
    if not text or not table_blocks:
        return text
    if any(line.count("|") >= 2 for line in text.splitlines()):
        return text
    row_regexes: List[re.Pattern[str]] = []
    for block in table_blocks:
        for line in block.splitlines():
            if _MARKDOWN_TABLE_SEP_RE.match(line):
                continue
            if line.count("|") < 2:
                continue
            cells = [cell.strip() for cell in line.split("|") if cell.strip()]
            if len(cells) < 2:
                continue
            pattern = r"\\b" + r"\\b.*\\b".join(re.escape(cell) for cell in cells) + r"\\b"
            row_regexes.append(re.compile(pattern, re.IGNORECASE))
    if row_regexes:
        kept_lines: List[str] = []
        for line in text.splitlines():
            if any(regex.search(line) for regex in row_regexes):
                continue
            kept_lines.append(line)
        text = "\\n".join(kept_lines).strip()
    for block in table_blocks:
        if block and block not in text:
            text = f"{text}\\n\\n{block}".strip()
    return text


_PAGE_RANGE_STOPWORDS_EN = {
    "the", "and", "for", "with", "that", "this", "from", "into", "over",
    "under", "after", "before", "were", "was", "are", "is", "its", "their",
    "then", "than", "than", "which", "when", "where", "have", "has", "had",
    "into", "onto", "upon", "your", "yours", "they", "them", "these", "those",
    "will", "would", "could", "should", "about", "there", "here", "while",
    "what", "why", "how", "not", "but", "you", "your", "our", "ours", "his",
    "her", "she", "him", "she", "him", "its", "also", "such", "been", "being",
    "out", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "more", "most", "some", "many", "few", "each", "per",
}

_PAGE_RANGE_STOPWORDS_DE = {
    "der", "die", "das", "und", "oder", "aber", "nicht", "ist", "sind",
    "war", "waren", "mit", "f\xFCr", "von", "zu", "im", "in", "auf", "an",
    "als", "auch", "wie", "dass", "dem", "den", "des", "ein", "eine",
    "einer", "eines", "einem", "einen", "ich", "du", "er", "sie", "es",
    "wir", "ihr", "ihnen", "sein", "haben", "hat", "hatte", "hatten",
    "wird", "werden", "kann", "k\xF6nnen", "soll", "sollen", "diese",
    "dieser", "dieses", "jeder", "jede", "jedes", "mehr", "weniger",
}

_PAGE_RANGE_STOPWORDS_FR = {
    "le", "la", "les", "de", "des", "du", "un", "une", "et", "ou",
    "mais", "ne", "pas", "est", "sont", "\xE9t\xE9", "\xEAtre", "avec", "pour",
    "par", "sur", "dans", "ce", "ces", "cette", "son", "sa", "ses",
    "leur", "leurs", "comme", "qui", "que", "quoi", "dont", "o\xF9",
    "au", "aux", "plus", "moins", "se", "s", "il", "elle", "ils",
    "elles", "nous", "vous", "je", "tu",
}

_PAGE_RANGE_STOPWORDS_ES = {
    "el", "la", "los", "las", "de", "del", "y", "o", "pero", "no",
    "es", "son", "fue", "fueron", "con", "para", "por", "en", "un",
    "una", "unos", "unas", "su", "sus", "como", "que", "qu\xE9", "quien",
    "qui\xE9n", "donde", "d\xF3nde", "cuando", "cu\xE1ndo", "m\xE1s", "menos",
    "al", "lo", "se", "si", "s\xED", "yo", "t\xFA", "\xE9l", "ella", "ellos",
    "ellas", "nosotros", "vosotros", "usted", "ustedes",
}

_PAGE_RANGE_STOPWORDS_PL = {
    "i", "oraz", "a", "ale", "nie", "jest", "s\u0105", "by\u0142", "by\u0142a",
    "by\u0142o", "byli", "by\u0142y", "z", "ze", "do", "na", "w", "we", "o",
    "od", "po", "przez", "dla", "u", "za", "pod", "nad", "mi\u0119dzy",
    "si\u0119", "to", "ten", "ta", "te", "jego", "jej", "ich", "nas",
    "was", "ja", "ty", "on", "ona", "oni", "one", "\u017Ce", "jak",
    "kiedy", "gdzie", "dlaczego", "kt\xF3ry", "kt\xF3ra", "kt\xF3re", "kt\xF3rych",
    "kt\xF3rym", "mo\u017Ce", "mo\u017Cna", "b\u0119dzie", "b\u0119d\u0105", "by\u0107", "by",
}


def get_page_range_stopwords(languages: str) -> Set[str]:
    stopwordsiso = None
    try:
        import stopwordsiso  # type: ignore
    except Exception:
        stopwordsiso = None

    lang = (languages or "").lower()
    selected: Set[str] = set()
    tokens = [token for token in re.split(r"[+,\\s]+", lang) if token]

    if stopwordsiso is not None:
        available = None
        for attr in ("available_languages", "languages", "available"):
            getter = getattr(stopwordsiso, attr, None)
            if callable(getter):
                try:
                    available = set(getter())
                    break
                except Exception:
                    available = None
        for token in tokens:
            codes: List[str] = []
            try:
                parsed = langcodes.find(token)
                alpha2 = parsed.to_alpha2()
                alpha3 = parsed.to_alpha3()
                if alpha2:
                    codes.append(alpha2)
                if alpha3:
                    codes.append(alpha3)
            except Exception:
                codes.append(token)
            for code in codes:
                if available is not None and code not in available:
                    continue
                try:
                    selected |= set(stopwordsiso.stopwords(code))
                except Exception:
                    continue
        if not selected and (available is None or "en" in available):
            try:
                selected |= set(stopwordsiso.stopwords("en"))
            except Exception:
                pass

    if not selected:
        if any(token in lang for token in ("de", "deu", "german", "deutsch")):
            selected |= _PAGE_RANGE_STOPWORDS_DE
        if any(token in lang for token in ("fr", "fra", "french", "francais", "fran\xE7ais")):
            selected |= _PAGE_RANGE_STOPWORDS_FR
        if any(token in lang for token in ("es", "spa", "spanish", "espanol", "espa\xF1ol")):
            selected |= _PAGE_RANGE_STOPWORDS_ES
        if any(token in lang for token in ("pl", "pol", "polish", "polski")):
            selected |= _PAGE_RANGE_STOPWORDS_PL
        if not selected or any(token in lang for token in ("en", "eng", "english")):
            selected |= _PAGE_RANGE_STOPWORDS_EN

    return selected

def tokenize_for_page_range(text: str, stopwords: Optional[Set[str]] = None) -> List[str]:
    tokens = re.findall(r"[A-Za-z0-9]{3,}", text.lower())
    if not stopwords:
        stopwords = _PAGE_RANGE_STOPWORDS_EN
    return [token for token in tokens if token not in stopwords]


def sample_tokens(tokens: Sequence[str], max_tokens: int) -> List[str]:
    if max_tokens <= 0 or len(tokens) <= max_tokens:
        return list(tokens)
    step = max(1, len(tokens) // max_tokens)
    return list(tokens[::step])


def compute_page_overlap(
    section_text: str,
    pages: List[Dict[str, Any]],
    config: DoclingProcessingConfig,
    languages: Optional[str] = None,
) -> List[Tuple[float, int, int]]:
    stopwords = get_page_range_stopwords(languages or "")
    section_tokens = tokenize_for_page_range(section_text, stopwords)
    if not section_tokens:
        return []
    sample = sample_tokens(section_tokens, config.page_range_sample_tokens)
    sample_set = set(sample)
    total = len(sample_set)
    results: List[Tuple[float, int, int]] = []
    for page in pages:
        page_text = str(page.get("text", ""))
        page_tokens = set(tokenize_for_page_range(page_text, stopwords))
        hits = len(sample_set & page_tokens)
        ratio = hits / max(1, total)
        results.append((ratio, hits, int(page.get("page_num", 0))))
    return results


def select_overlap_cluster(
    overlap_scores: Sequence[Tuple[float, int, int]],
    config: DoclingProcessingConfig,
) -> List[int]:
    if not overlap_scores:
        return []
    max_ratio = max(score[0] for score in overlap_scores)
    max_hits = max(score[1] for score in overlap_scores)
    ratio_cutoff = max(config.page_range_min_overlap, max_ratio * config.page_range_peak_ratio)
    hits_cutoff = max(config.page_range_min_hits, int(max_hits * config.page_range_peak_ratio))
    candidates = [
        (ratio, hits, page_num)
        for ratio, hits, page_num in overlap_scores
        if ratio >= ratio_cutoff or hits >= hits_cutoff
    ]
    if not candidates:
        candidates = sorted(overlap_scores, reverse=True)[: config.page_range_top_k]

    candidates.sort(key=lambda item: item[2])
    clusters: List[List[Tuple[float, int, int]]] = []
    current: List[Tuple[float, int, int]] = []
    for entry in candidates:
        if not current:
            current.append(entry)
            continue
        if entry[2] - current[-1][2] <= config.page_range_cluster_gap:
            current.append(entry)
        else:
            clusters.append(current)
            current = [entry]
    if current:
        clusters.append(current)

    def cluster_score(cluster: Sequence[Tuple[float, int, int]]) -> Tuple[float, float]:
        ratios = [item[0] for item in cluster]
        return (sum(ratios), max(ratios))

    best_cluster = max(clusters, key=cluster_score)
    page_nums = [item[2] for item in best_cluster]
    if len(page_nums) > 1:
        span_ratio = (max(page_nums) - min(page_nums) + 1) / max(1, len(overlap_scores))
        if span_ratio > config.page_range_max_span_ratio:
            trimmed = sorted(best_cluster, reverse=True)[: config.page_range_top_k]
            page_nums = [item[2] for item in trimmed]
    return page_nums


def find_page_range(
    section_text: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
) -> Tuple[int, int]:
    if not pages:
        return 0, 0

    cleaned = normalize_text(section_text)
    if not cleaned:
        return 0, 0

    snippet_start = cleaned[:200]
    snippet_end = cleaned[-200:]

    page_start = 0
    page_end = 0

    for page in pages:
        page_clean = normalize_text(page.get("text", ""))
        if snippet_start and snippet_start in page_clean:
            page_start = page.get("page_num", 0)
            break

    for page in reversed(pages):
        page_clean = normalize_text(page.get("text", ""))
        if snippet_end and snippet_end in page_clean:
            page_end = page.get("page_num", 0)
            break

    if page_start == 0 or page_end == 0:
        config = config or DoclingProcessingConfig()
        languages = select_language_set(config.language_hint, "", config)
        overlap_scores = compute_page_overlap(cleaned, pages, config, languages)
        page_nums = select_overlap_cluster(overlap_scores, config)
        if page_nums:
            if page_start == 0:
                page_start = min(page_nums)
            if page_end == 0:
                page_end = max(page_nums)

    if page_start == 0:
        page_start = pages[0].get("page_num", 0)
    if page_end == 0:
        page_end = pages[-1].get("page_num", 0)

    return int(page_start), int(page_end)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug


def configure_layout_options(pipeline_options: Any) -> None:
    if hasattr(pipeline_options, "layout_mode"):
        pipeline_options.layout_mode = "accurate"
    if hasattr(pipeline_options, "detect_layout"):
        pipeline_options.detect_layout = True
    if hasattr(pipeline_options, "extract_tables"):
        pipeline_options.extract_tables = True
    if hasattr(pipeline_options, "table_structure"):
        pipeline_options.table_structure = True
    layout_options = getattr(pipeline_options, "layout_options", None)
    if layout_options is not None:
        for name, value in (
            ("detect_columns", True),
            ("detect_tables", True),
            ("enable_table_structure", True),
            ("max_columns", 3),
        ):
            if hasattr(layout_options, name):
                setattr(layout_options, name, value)


def build_converter(config: DoclingProcessingConfig, decision: OcrRouteDecision):
    from docling.document_converter import DocumentConverter

    try:
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions, OCRMode
        from docling.document_converter import PdfFormatOption
    except Exception:
        return DocumentConverter()

    pipeline_options = PdfPipelineOptions()
    if not decision.ocr_used:
        if hasattr(pipeline_options, "do_ocr"):
            pipeline_options.do_ocr = False
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.DISABLED
    elif config.ocr_mode == "force":
        if hasattr(pipeline_options, "do_ocr"):
            pipeline_options.do_ocr = True
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.FORCE
    else:
        if hasattr(pipeline_options, "ocr_mode"):
            pipeline_options.ocr_mode = OCRMode.AUTO

    if decision.ocr_used:
        if hasattr(pipeline_options, "ocr_engine"):
            pipeline_options.ocr_engine = decision.ocr_engine
        if hasattr(pipeline_options, "ocr_languages"):
            pipeline_options.ocr_languages = decision.languages
        if hasattr(pipeline_options, "ocr_lang"):
            pipeline_options.ocr_lang = decision.languages

    configure_layout_options(pipeline_options)

    format_options = {InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
    return DocumentConverter(format_options=format_options)


def find_poppler_path() -> Optional[str]:
    env_path = os.environ.get("POPPLER_PATH")
    if env_path and os.path.isfile(os.path.join(env_path, "pdftoppm")):
        return env_path
    pdftoppm = shutil.which("pdftoppm")
    if pdftoppm:
        return os.path.dirname(pdftoppm)
    for candidate in ("/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"):
        if os.path.isfile(os.path.join(candidate, "pdftoppm")):
            return candidate
    return None


POPPLER_LOGGED_ONCE = False


def render_pdf_pages(pdf_path: str, dpi: int) -> List[Any]:
    from pdf2image import convert_from_path

    poppler_path = find_poppler_path()
    if poppler_path:
        global POPPLER_LOGGED_ONCE
        if shutil.which("pdftoppm") is None and not POPPLER_LOGGED_ONCE:
            LOGGER.info("Poppler not on PATH; using %s", poppler_path)
            POPPLER_LOGGED_ONCE = True
        return convert_from_path(pdf_path, dpi=dpi, poppler_path=poppler_path)
    return convert_from_path(pdf_path, dpi=dpi)


def render_pdf_pages_sample(pdf_path: str, dpi: int, max_pages: int) -> List[Any]:
    from pdf2image import convert_from_path

    if max_pages <= 0:
        return []
    poppler_path = find_poppler_path()
    kwargs = {"dpi": dpi, "first_page": 1, "last_page": max_pages}
    if poppler_path:
        global POPPLER_LOGGED_ONCE
        if shutil.which("pdftoppm") is None and not POPPLER_LOGGED_ONCE:
            LOGGER.info("Poppler not on PATH; using %s", poppler_path)
            POPPLER_LOGGED_ONCE = True
        kwargs["poppler_path"] = poppler_path
    return convert_from_path(pdf_path, **kwargs)


def get_pdf_page_count(pdf_path: str) -> int:
    """Return total number of pages using pypdf (fast and light)."""
    try:
        from pypdf import PdfReader  # type: ignore
        reader = PdfReader(pdf_path)
        return int(len(reader.pages))
    except Exception:
        return 0


def select_column_sample_indices(total_pages: int, max_pages: int) -> List[int]:
    """Pick up to max_pages page indices spread across the document (1-based)."""
    if total_pages <= 0:
        return []
    k = max(1, max_pages)
    k = min(k, total_pages)
    if k == 1:
        return [max(1, (total_pages + 1) // 2)]
    if k == 2:
        return [1, total_pages]
    # Spread evenly including first and last
    step = (total_pages - 1) / (k - 1)
    return [int(round(1 + i * step)) for i in range(k)]


def render_pdf_pages_at_indices(pdf_path: str, dpi: int, indices: Sequence[int]) -> List[Any]:
    """Render specific 1-based page indices to images. May call pdf2image multiple times."""
    from pdf2image import convert_from_path
    images: List[Any] = []
    if not indices:
        return images
    poppler_path = find_poppler_path()
    for idx in indices:
        kwargs = {"dpi": dpi, "first_page": int(idx), "last_page": int(idx)}
        if poppler_path:
            global POPPLER_LOGGED_ONCE
            if shutil.which("pdftoppm") is None and not POPPLER_LOGGED_ONCE:
                LOGGER.info("Poppler not on PATH; using %s", poppler_path)
                POPPLER_LOGGED_ONCE = True
            kwargs["poppler_path"] = poppler_path
        try:
            imgs = convert_from_path(pdf_path, **kwargs)
            if imgs:
                images.append(imgs[0])
        except Exception:
            continue
    return images


def compute_column_density(
    image: Any,
    config: DoclingProcessingConfig,
    target_width: int = 300,
) -> List[float]:
    gray = image.convert("L")
    width, height = gray.size
    if width > target_width:
        scale = target_width / max(1, width)
        gray = gray.resize((target_width, max(1, int(height * scale))))
    width, height = gray.size
    crop_top = int(height * config.column_detect_crop_top_ratio)
    crop_bottom = int(height * config.column_detect_crop_bottom_ratio)
    if crop_top + crop_bottom < height - 1:
        gray = gray.crop((0, crop_top, width, height - crop_bottom))

    try:
        import numpy as np
    except Exception:
        pixels = list(gray.getdata())
        w, h = gray.size
        if w == 0 or h == 0:
            return []
        sorted_pixels = sorted(pixels)
        median = sorted_pixels[len(sorted_pixels) // 2]
        mean = sum(pixels) / max(1, len(pixels))
        variance = sum((value - mean) ** 2 for value in pixels) / max(1, len(pixels))
        std = variance ** 0.5
        threshold = median - (std * config.column_detect_threshold_std_mult)
        threshold = min(threshold, config.column_detect_threshold_max)
        threshold = max(threshold, config.column_detect_threshold_min)
        densities = [0] * w
        for y in range(h):
            row = pixels[y * w:(y + 1) * w]
            for x, value in enumerate(row):
                if value < threshold:
                    densities[x] += 1
        return [count / h for count in densities]

    arr = np.asarray(gray)
    if arr.size == 0:
        return []
    # Build a robust binarization threshold: combine median-std rule with Otsu
    median = float(np.median(arr))
    std = float(arr.std())
    thr_a = median - (std * config.column_detect_threshold_std_mult)
    thr_a = min(thr_a, float(config.column_detect_threshold_max))
    thr_a = max(thr_a, float(config.column_detect_threshold_min))

    # Otsu threshold (fast implementation without external deps)
    try:
        hist, _ = np.histogram(arr, bins=256, range=(0, 255))
        hist = hist.astype(np.float64)
        total = hist.sum()
        if total > 0:
            prob = hist / total
            omega = np.cumsum(prob)
            mu = np.cumsum(prob * np.arange(256))
            mu_t = mu[-1]
            sigma_b2 = (mu_t * omega - mu) ** 2 / np.maximum(omega * (1.0 - omega), 1e-9)
            k = int(np.nanargmax(sigma_b2))
            thr_b = float(k)
        else:
            thr_b = thr_a
    except Exception:
        thr_b = thr_a

    threshold = 0.5 * (thr_a + thr_b)
    mask = arr < threshold

    # Focus on the vertical band with the most text-like pixels to avoid full-width pictures at top
    h = mask.shape[0]
    band_h = max(1, int(h * 0.6))  # use central 60% by default (adaptive below)
    if band_h < h:
        step = max(1, int(h * 0.04))
        best_y = 0
        best_score = -1.0
        # Slide a window to find the densest text band
        for y in range(0, h - band_h + 1, step):
            score = mask[y : y + band_h, :].mean()
            if score > best_score:
                best_score = score
                best_y = y
        mask = mask[best_y : best_y + band_h, :]

    return mask.mean(axis=0).tolist()


def smooth_density(density: Sequence[float], window: int) -> List[float]:
    if window <= 1 or not density:
        return list(density)
    size = max(1, int(window))
    half = size // 2
    smoothed: List[float] = []
    for idx in range(len(density)):
        start = max(0, idx - half)
        end = min(len(density), idx + half + 1)
        smoothed.append(sum(density[start:end]) / max(1, end - start))
    return smoothed


def density_percentile(density: Sequence[float], percentile: float) -> float:
    if not density:
        return 0.0
    clamped = max(0.0, min(1.0, percentile))
    sorted_vals = sorted(density)
    idx = int(round(clamped * (len(sorted_vals) - 1)))
    return sorted_vals[idx]


def find_column_gaps(
    density: Sequence[float],
    config: DoclingProcessingConfig,
) -> List[Tuple[int, int]]:
    if not density:
        return []
    total = len(density)
    margin = max(1, int(total * 0.05))
    start = margin
    end = max(start + 1, total - margin)
    core = density[start:end]
    if not core:
        return []
    text_level = density_percentile(core, config.column_detect_text_percentile)
    if text_level < config.column_detect_min_text_density:
        return []
    threshold = max(config.column_detect_min_gap_density, text_level * config.column_detect_gap_threshold_ratio)
    min_gap = max(1, int(len(core) * config.column_detect_min_gap_ratio))

    gaps: List[Tuple[int, int]] = []
    idx = 0
    while idx < len(core):
        if core[idx] < threshold:
            gap_start = idx
            while idx < len(core) and core[idx] < threshold:
                idx += 1
            if idx - gap_start >= min_gap:
                gaps.append((start + gap_start, start + idx))
        else:
            idx += 1
    return gaps


def count_column_gaps(
    density: Sequence[float],
    config: DoclingProcessingConfig,
) -> int:
    return len(find_column_gaps(density, config))


def detect_multicolumn_layout(
    images: Sequence[Any],
    config: DoclingProcessingConfig,
) -> ColumnLayoutDetection:
    if not images:
        return ColumnLayoutDetection(False, 0.0, "No pages available")
    sample = list(images[: config.column_detect_max_pages])
    if not sample:
        return ColumnLayoutDetection(False, 0.0, "No sample pages")

    hits = 0
    for image in sample:
        density = compute_column_density(image, config)
        density = smooth_density(density, config.column_detect_smooth_window)
        gaps = count_column_gaps(density, config)
        if gaps >= 1:
            hits += 1
    ratio = hits / max(1, len(sample))
    detected = ratio >= config.column_detect_min_pages_ratio
    reason = f"{hits}/{len(sample)} pages show column gutters"
    return ColumnLayoutDetection(detected, ratio, reason)


def rasterize_pdf_to_temp(pdf_path: str, dpi: int) -> str:
    from tempfile import NamedTemporaryFile

    images = render_pdf_pages(pdf_path, dpi)
    if not images:
        raise RuntimeError("Failed to render PDF pages for rasterization.")

    temp_file = NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.close()
    first = images[0]
    rest = images[1:]
    first.save(temp_file.name, format="PDF", save_all=True, append_images=rest)
    return temp_file.name


def split_blocks_into_columns(
    blocks: List[Dict[str, Any]], log_label: str = "OCR"
) -> Tuple[List[List[Dict[str, Any]]], float, float]:
    if not blocks:
        return [], 0.0, 0.0
    # Robust grouping by x-center: find one or two big gaps -> 2 or 3 columns
    xs = sorted(b["xc"] for b in blocks)
    x_min, x_max = xs[0], xs[-1]
    span = max(1.0, x_max - x_min)
    widths = sorted((b["x1"] - b["x0"]) for b in blocks)
    w_med = widths[len(widths) // 2] if widths else 1.0
    # Lower threshold than before: helps separate three narrow columns
    gap_thr = max(0.06 * span, 0.5 * w_med)

    # Compute gaps between consecutive x-centers
    diffs: List[Tuple[float, int]] = []
    for i in range(1, len(xs)):
        diffs.append((xs[i] - xs[i - 1], i))  # (gap, split_index)
    gap_values = sorted(gap for gap, _ in diffs)
    median_gap = gap_values[len(gap_values) // 2] if gap_values else 0.0
    # Candidate split positions are those with large gaps
    candidates = [idx for (gap, idx) in diffs if gap >= gap_thr]

    # Build columns by splitting at up to two largest valid gaps ensuring min size per group
    min_lines = max(3, len(blocks) // 20 or 1)
    columns: List[List[Dict[str, Any]]] = []
    blocks_sorted = sorted(blocks, key=lambda b: b["xc"])  # align with xs order
    used_splits: List[int] = []
    if candidates:
        # Prefer two-gap (3-column) split if possible
        cands_sorted = sorted(
            ((xs[i - 1], xs[i], i) for i in candidates), key=lambda t: t[1] - t[0], reverse=True
        )
        # Try all pairs of split indices to form 3 groups
        tried = False
        for _a in range(min(5, len(cands_sorted))):
            for _b in range(_a + 1, min(6, len(cands_sorted))):
                i1 = cands_sorted[_a][2]
                i2 = cands_sorted[_b][2]
                a, b = sorted([i1, i2])
                if a < min_lines or (b - a) < min_lines or (len(blocks) - b) < min_lines:
                    continue
                used_splits = [a, b]
                tried = True
                break
            if tried:
                break
        if not used_splits:
            # Fall back to single split (2 columns)
            # pick the largest valid gap that yields two groups of minimum size
            for _, _, i in cands_sorted:
                if i >= min_lines and (len(blocks) - i) >= min_lines:
                    used_splits = [i]
                    break

    if used_splits:
        used_splits = sorted(set(used_splits))
        start = 0
        for s in used_splits:
            columns.append(blocks_sorted[start:s])
            start = s
        columns.append(blocks_sorted[start:])
    else:
        # Fallback threshold grouping
        cur: List[Dict[str, Any]] = []
        prev_xc: Optional[float] = None
        for b in blocks_sorted:
            if prev_xc is None or abs(b["xc"] - prev_xc) <= gap_thr:
                cur.append(b)
            else:
                if cur:
                    columns.append(cur)
                cur = [b]
            prev_xc = b["xc"]
        if cur:
            columns.append(cur)

    def _kmeans_1d(points: List[float], k: int) -> Optional[Tuple[List[List[int]], List[float]]]:
        if len(points) < k:
            return None
        sorted_points = sorted(points)
        centers = []
        for i in range(k):
            pct = (i + 0.5) / k
            idx = int(pct * (len(sorted_points) - 1))
            centers.append(sorted_points[idx])
        for _ in range(20):
            clusters: List[List[int]] = [[] for _ in range(k)]
            for idx, val in enumerate(points):
                nearest = min(range(k), key=lambda c: abs(val - centers[c]))
                clusters[nearest].append(idx)
            new_centers = []
            for c_idx in range(k):
                if not clusters[c_idx]:
                    return None
                new_centers.append(sum(points[i] for i in clusters[c_idx]) / len(clusters[c_idx]))
            if max(abs(new_centers[i] - centers[i]) for i in range(k)) < 0.5:
                centers = new_centers
                break
            centers = new_centers
        return clusters, centers

    def _kmeans_improvement(points: List[float], clusters: List[List[int]], centers: List[float]) -> float:
        mean = sum(points) / len(points)
        total_var = sum((val - mean) ** 2 for val in points) / max(1, len(points))
        if total_var <= 1e-6:
            return 0.0
        within = 0.0
        for c_idx, cluster in enumerate(clusters):
            center = centers[c_idx]
            for i in cluster:
                within += (points[i] - center) ** 2
        within /= max(1, len(points))
        return (total_var - within) / total_var

    def _boundary_valley_ok(points: List[float], centers: List[float], span_points: float) -> bool:
        ordered = sorted(centers)
        if len(ordered) <= 1:
            return False
        band = max(0.04 * span_points, 1.5 * w_med)
        band = min(band, 0.2 * span_points)
        total = len(points)
        for i in range(len(ordered) - 1):
            boundary = 0.5 * (ordered[i] + ordered[i + 1])
            count = sum(1 for val in points if abs(val - boundary) <= band / 2)
            expected = max(1e-6, band / span_points * total)
            if (count / expected) > 0.85:
                return False
        return True

    if len(columns) <= 1 and len(blocks_sorted) >= 20:
        min_lines = max(3, len(blocks_sorted) // 20 or 1)

        def _try_kmeans(points: List[float], basis: str) -> Optional[Tuple[List[List[Dict[str, Any]]], float, int, str]]:
            span_points = max(1.0, max(points) - min(points))
            best_cols: Optional[List[List[Dict[str, Any]]]] = None
            best_score = 0.0
            best_k = 0
            for k in (2, 3):
                if len(blocks_sorted) < k * min_lines:
                    continue
                result = _kmeans_1d(points, k)
                if not result:
                    continue
                clusters, centers = result
                if min(len(c) for c in clusters) < min_lines:
                    continue
                improvement = _kmeans_improvement(points, clusters, centers)
                if improvement < 0.6:
                    continue
                if not _boundary_valley_ok(points, centers, span_points):
                    continue
                ordered = sorted(range(k), key=lambda i: centers[i])
                ordered_centers = [centers[i] for i in ordered]
                min_gap = min(
                    ordered_centers[i + 1] - ordered_centers[i]
                    for i in range(len(ordered_centers) - 1)
                )
                if min_gap < 0.02 * span_points:
                    continue
                score = improvement + (min_gap / span_points)
                if score > best_score:
                    best_score = score
                    best_k = k
                    best_cols = [[blocks_sorted[i] for i in clusters[idx]] for idx in ordered]
            if best_cols:
                return best_cols, best_score, best_k, basis
            return None

        candidates = [
            _try_kmeans([b["xc"] for b in blocks_sorted], "xc"),
            _try_kmeans([b["x0"] for b in blocks_sorted], "x0"),
        ]
        best = None
        for candidate in candidates:
            if not candidate:
                continue
            if best is None or candidate[1] > best[1]:
                best = candidate
        if best:
            columns, best_score, best_k, basis = best
            try:
                LOGGER.info(
                    "%s column grouping fallback (kmeans-%s): k=%d score=%.2f",
                    log_label,
                    basis,
                    best_k,
                    best_score,
                )
            except Exception:
                pass

    # Sort columns left-to-right by median x center
    def col_key(col: List[Dict[str, Any]]) -> float:
        centers = sorted(b["xc"] for b in col)
        return centers[len(centers) // 2]

    columns = [col for col in columns if col]
    columns.sort(key=col_key)
    try:
        LOGGER.info("%s column grouping: k=%d (gap_thr=%.2f, span=%.1f)", log_label, len(columns), gap_thr, span)
    except Exception:
        pass
    return columns, gap_thr, span


def order_blocks_into_columns(
    blocks: List[Dict[str, Any]],
    log_label: str = "OCR",
    preserve_single_column_order: bool = False,
) -> str:
    columns, _, _ = split_blocks_into_columns(blocks, log_label=log_label)
    if not columns:
        return ""
    # Within each column, sort top-down and join
    col_texts: List[str] = []
    for col in columns:
        if preserve_single_column_order and len(columns) == 1:
            col_sorted = sorted(col, key=lambda b: b.get("line_id", 0))
        else:
            col_sorted = sorted(col, key=lambda b: (b["y0"], b["x0"]))
        lines: List[str] = []
        for block in col_sorted:
            raw = str(block.get("text", "")).strip()
            if not raw:
                continue
            lines.append(raw)
        col_texts.append("\\n".join(lines))
    # Read columns left to right
    return "\\n\\n".join(t for t in col_texts if t)


def ocr_pages_text_chars(pages: Sequence[Dict[str, Any]]) -> int:
    return sum(len(str(page.get("text", "")).strip()) for page in pages)


def has_output_text(markdown: str, pages: Sequence[Dict[str, Any]]) -> bool:
    return bool(markdown.strip()) or ocr_pages_text_chars(pages) > 0


def _external_ocr_helpers() -> Dict[str, Any]:
    return {
        "logger": LOGGER,
        "ocr_pages_text_chars": ocr_pages_text_chars,
        "detect_repeated_line_clusters": detect_repeated_line_clusters,
        "normalize_boilerplate_line": normalize_boilerplate_line,
        "matches_repeated_cluster": matches_repeated_cluster,
        "is_boilerplate_line": is_boilerplate_line,
        "edge_ids_by_y": edge_ids_by_y,
        "select_edge_texts_by_y": select_edge_texts_by_y,
        "order_blocks_into_columns": order_blocks_into_columns,
        "split_blocks_into_columns": split_blocks_into_columns,
    }


def run_external_ocr_pages(
    pdf_path: str,
    engine: str,
    languages: str,
    config: DoclingProcessingConfig,
    dpi: Optional[int] = None,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    effective_dpi = dpi or config.ocr_dpi
    helpers = _external_ocr_helpers()
    helpers["ocr_source_path"] = pdf_path
    helpers["boilerplate_prepass_enabled"] = bool(config.enable_boilerplate_removal)
    if progress_cb and progress_span > 0:
        label = "Paddle OCR" if engine == "paddle" else "Tesseract OCR"
        # Use a neutral initializing message; inner routines will promptly override with page counters
        progress_cb(progress_base, "ocr", f"{label} initializing")
    def _paddle_vl_api_enabled() -> bool:
        if bool(getattr(config, "paddle_vl_api_disable", False)):
            return False
        api_url = getattr(config, "paddle_vl_api_url", None) or os.getenv("PADDLE_VL_API_URL")
        api_token = getattr(config, "paddle_vl_api_token", None) or os.getenv("PADDLE_VL_API_TOKEN")
        return bool(api_url and api_token)
    if engine == "paddle" and config.paddle_use_vl:
        if _paddle_vl_api_enabled():
            helpers["boilerplate_prepass_enabled"] = False
        LOGGER.info(
            "External OCR starting: engine=%s (PaddleOCR-VL), dpi=%d",
            engine,
            effective_dpi,
        )
    elif engine == "paddle" and config.paddle_use_structure_v3:
        LOGGER.info(
            "External OCR starting: engine=%s (PP-Structure), dpi=%d",
            engine,
            effective_dpi,
        )
    else:
        LOGGER.info(
            "External OCR starting: engine=%s, dpi=%d",
            engine,
            effective_dpi,
        )
    if engine == "paddle":
        max_side_points = get_pdf_max_page_points(pdf_path)
        orig_effective_dpi = effective_dpi
        if max_side_points and config.paddle_target_max_side_px > 0:
            target_dpi = int(config.paddle_target_max_side_px * 72 / max_side_points)
            if target_dpi > 0:
                LOGGER.info(
                    "Paddle OCR target DPI: page max side=%.1f pts, limit=%d px -> %d DPI (requested=%d)",
                    max_side_points,
                    config.paddle_target_max_side_px,
                    target_dpi,
                    orig_effective_dpi,
                )
            if target_dpi > 0 and target_dpi < effective_dpi:
                LOGGER.info(
                    "Paddle OCR DPI adjusted for page size: %d -> %d",
                    effective_dpi,
                    target_dpi,
                )
                effective_dpi = target_dpi
        if config.paddle_max_dpi > 0 and effective_dpi > config.paddle_max_dpi:
            LOGGER.info(
                "Paddle OCR DPI capped: %d -> %d",
                effective_dpi,
                config.paddle_max_dpi,
            )
            effective_dpi = config.paddle_max_dpi
    images = render_pdf_pages(pdf_path, effective_dpi)
    LOGGER.info("External OCR rendered pages: %d", len(images))
    if images:
        try:
            sample_w, sample_h = images[0].size  # type: ignore[attr-defined]
        except Exception:
            sample_w = sample_h = 0
        if sample_w and sample_h:
            LOGGER.info(
                "External OCR sample page: %dx%d px @ %d DPI (engine=%s)",
                sample_w,
                sample_h,
                effective_dpi,
                engine,
            )
    if engine == "paddle":
        if config.paddle_use_vl:
            try:
                pages, stats = ocr_pages_with_paddle_vl(
                    images,
                    normalize_languages_for_engine(languages, engine),
                    config,
                    helpers,
                    progress_cb,
                    progress_base,
                    progress_span,
                )
                if ocr_pages_text_chars(pages) == 0:
                    LOGGER.warning(
                        "PaddleOCR-VL returned empty text; falling back to PaddleOCR."
                    )
                    helpers["boilerplate_prepass_enabled"] = bool(config.enable_boilerplate_removal)
                    return ocr_pages_with_paddle(
                        images,
                        normalize_languages_for_engine(languages, engine),
                        config,
                        helpers,
                        progress_cb,
                        progress_base,
                        progress_span,
                    )
                return pages, stats
            except Exception as exc:
                LOGGER.warning("PaddleOCR-VL failed; falling back to PaddleOCR: %s", exc)
                helpers["boilerplate_prepass_enabled"] = bool(config.enable_boilerplate_removal)
        if config.paddle_use_structure_v3:
            try:
                pages, stats = ocr_pages_with_paddle_structure(
                    images,
                    normalize_languages_for_engine(languages, engine),
                    config,
                    helpers,
                    progress_cb,
                    progress_base,
                    progress_span,
                )
                if ocr_pages_text_chars(pages) == 0:
                    LOGGER.warning(
                        "PP-Structure returned empty text; falling back to PaddleOCR."
                    )
                    return ocr_pages_with_paddle(
                        images,
                        normalize_languages_for_engine(languages, engine),
                        config,
                        helpers,
                        progress_cb,
                        progress_base,
                        progress_span,
                    )
                return pages, stats
            except Exception as exc:
                LOGGER.warning("PP-StructureV3 failed; falling back to PaddleOCR: %s", exc)
        return ocr_pages_with_paddle(
            images,
            normalize_languages_for_engine(languages, engine),
            config,
            helpers,
            progress_cb,
            progress_base,
            progress_span,
        )
    if engine == "tesseract":
        return ocr_pages_with_tesseract(
            images,
            normalize_languages_for_engine(languages, engine),
            config,
            helpers,
            progress_cb,
            progress_base,
            progress_span,
        )
    return [], {}


def build_quality_report(pdf_path: str, config: DoclingProcessingConfig) -> Dict[str, Any]:
    analysis_pages = extract_pages_from_pdf(
        pdf_path,
        max_pages=config.analysis_max_pages,
        sample_strategy=config.analysis_sample_strategy,
    )
    has_text_layer = detect_text_layer_from_pages(analysis_pages, config)
    languages = select_language_set(config.language_hint, pdf_path, config)
    quality = estimate_text_quality(analysis_pages, config, languages)
    quality, classifier_info = apply_text_layer_classifier(quality, pdf_path, config)
    low_quality = is_low_quality(quality, config)
    text_layer_overlay = bool(
        has_text_layer
        and (
            (
                quality.ocr_overlay_ratio is not None
                and quality.ocr_overlay_ratio >= config.quality_classifier_decision_ratio
            )
            or (
                quality.image_page_ratio is not None
                and quality.image_page_ratio >= config.quality_image_page_ratio_threshold
            )
        )
    )
    if quality.image_page_ratio is not None:
        LOGGER.info(
            "Text-layer overlay: %s (img_pages=%.2f, threshold=%.2f)",
            text_layer_overlay,
            quality.image_page_ratio,
            config.quality_image_page_ratio_threshold,
        )
    if classifier_info:
        LOGGER.info(
            "Text-layer classifier: %s (ocr_ratio=%.2f, digital_ratio=%.2f, sampled=%d, short_circuit=%s, guardrail=%s)",
            quality.layer_classification or classifier_info.get("decision"),
            quality.ocr_overlay_ratio or 0.0,
            quality.digital_page_ratio or 0.0,
            classifier_info.get("sampled_pages", 0),
            classifier_info.get("short_circuit", False),
            classifier_info.get("guardrail_applied", False),
        )
    return {
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "text_layer_overlay": text_layer_overlay,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "effective_confidence_proxy": quality.effective_confidence_proxy,
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
        "spellchecker_hit_ratio": quality.spellchecker_hit_ratio,
        "image_heavy_ratio": quality.image_heavy_ratio,
        "image_page_ratio": quality.image_page_ratio,
        "ocr_overlay_ratio": quality.ocr_overlay_ratio,
        "digital_page_ratio": quality.digital_page_ratio,
        "classifier_decision": quality.layer_classification,
        "classifier_sampled_pages": classifier_info.get("sampled_pages") if classifier_info else None,
        "classifier_short_circuit": classifier_info.get("short_circuit") if classifier_info else None,
    }


def convert_pdf_with_docling(
    pdf_path: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
) -> DoclingConversionResult:
    emit = progress_cb or (lambda _p, _s, _m: None)
    emit(5, "analysis", "Analyzing text layer")
    analysis_pages = extract_pages_from_pdf(
        pdf_path,
        max_pages=config.analysis_max_pages,
        sample_strategy=config.analysis_sample_strategy,
    )
    has_text_layer = detect_text_layer_from_pages(analysis_pages, config)
    languages = select_language_set(config.language_hint, pdf_path, config)
    quality = estimate_text_quality(analysis_pages, config, languages)
    quality, classifier_info = apply_text_layer_classifier(quality, pdf_path, config)
    low_quality = is_low_quality(quality, config)
    text_layer_overlay = bool(
        has_text_layer
        and (
            (
                quality.ocr_overlay_ratio is not None
                and quality.ocr_overlay_ratio >= config.quality_classifier_decision_ratio
            )
            or (
                quality.image_page_ratio is not None
                and quality.image_page_ratio >= config.quality_image_page_ratio_threshold
            )
        )
    )
    available_engines = detect_available_ocr_engines()
    decision = decide_ocr_route(has_text_layer, quality, available_engines, config, languages)
    emit(15, "route", "Selecting OCR route")
    rasterized_source = False
    rasterized_pdf_path = ""
    rasterize_error: Optional[str] = None
    column_layout: Optional[ColumnLayoutDetection] = None
    if should_rasterize_text_layer(has_text_layer, low_quality, config):
        try:
            rasterized_pdf_path = rasterize_pdf_to_temp(pdf_path, config.ocr_dpi)
            rasterized_source = True
            emit(25, "rasterize", "Rasterized PDF for OCR")
            LOGGER.info("Rasterized low-quality text layer for Docling OCR.")
        except Exception as exc:
            rasterize_error = str(exc)
            LOGGER.warning("Failed to rasterize PDF for OCR: %s", exc)
    if rasterized_source:
        if not config.force_per_page_ocr:
            decision.per_page_ocr = False
            decision.per_page_reason = "Rasterized PDF for Docling OCR"

    if config.column_detect_enable and decision.ocr_used and (rasterized_source or not has_text_layer):
        try:
            # Spread sampling across document to avoid false negatives on front-matter
            total_pages = get_pdf_page_count(pdf_path)
            sample_indices = select_column_sample_indices(total_pages, config.column_detect_max_pages)
            if not sample_indices:
                sample_indices = list(range(1, min(3, total_pages or 3) + 1))
            LOGGER.info("Column layout sample pages: %s", sample_indices)

            sample_images = render_pdf_pages_at_indices(pdf_path, config.column_detect_dpi, sample_indices)
            column_layout = detect_multicolumn_layout(sample_images, config)
            # If not detected, retry at a higher DPI once
            if not column_layout.detected and config.column_detect_dpi < 220:
                hi_dpi = 300
                hi_images = render_pdf_pages_at_indices(pdf_path, hi_dpi, sample_indices)
                hi_layout = detect_multicolumn_layout(hi_images, config)
                if hi_layout.detected:
                    column_layout = hi_layout
                    LOGGER.info("Column layout detection (hi-dpi %d): %s (%s)", hi_dpi, column_layout.detected, column_layout.reason)
            LOGGER.info(
                "Column layout detection: %s (%s)",
                column_layout.detected,
                column_layout.reason,
            )
            emit(30, "layout", "Checked column layout")
            if (
                column_layout.detected
                and decision.use_external_ocr
                and decision.per_page_ocr
                and not config.force_per_page_ocr
            ):
                decision.per_page_ocr = False
                decision.per_page_reason = "Columns detected; keep Docling layout"
        except Exception as exc:
            LOGGER.warning("Column layout detection failed: %s", exc)

    dict_ratio = "n/a" if quality.dictionary_hit_ratio is None else f"{quality.dictionary_hit_ratio:.2f}"
    spell_ratio = "n/a" if quality.spellchecker_hit_ratio is None else f"{quality.spellchecker_hit_ratio:.2f}"
    img_ratio = "n/a" if quality.image_heavy_ratio is None else f"{quality.image_heavy_ratio:.2f}"
    img_pages_ratio = "n/a" if quality.image_page_ratio is None else f"{quality.image_page_ratio:.2f}"
    ocr_ratio = "n/a" if quality.ocr_overlay_ratio is None else f"{quality.ocr_overlay_ratio:.2f}"
    digital_ratio = "n/a" if quality.digital_page_ratio is None else f"{quality.digital_page_ratio:.2f}"
    LOGGER.info(
        "Text-layer check: %s (avg_chars=%.1f, alpha_ratio=%.2f, suspicious=%.2f, dict=%s, spell=%s, img=%s, img_pages=%s, ocr_ratio=%s, digital_ratio=%s)",
        has_text_layer,
        quality.avg_chars_per_page,
        quality.alpha_ratio,
        quality.suspicious_token_ratio,
        dict_ratio,
        spell_ratio,
        img_ratio,
        img_pages_ratio,
        ocr_ratio,
        digital_ratio,
    )
    if classifier_info:
        LOGGER.info(
            "Text-layer classifier: %s (ocr_ratio=%.2f, digital_ratio=%.2f, sampled=%d, short_circuit=%s, guardrail=%s)",
            quality.layer_classification or classifier_info.get("decision"),
            quality.ocr_overlay_ratio or 0.0,
            quality.digital_page_ratio or 0.0,
            classifier_info.get("sampled_pages", 0),
            classifier_info.get("short_circuit", False),
            classifier_info.get("guardrail_applied", False),
        )
    if available_engines:
        LOGGER.info("Available OCR engines: %s", ", ".join(available_engines))
    else:
        LOGGER.info("Available OCR engines: none (external OCR disabled)")

    LOGGER.info(
        "Docling OCR route: %s (engine=%s, languages=%s)",
        decision.route_reason,
        decision.ocr_engine,
        decision.languages,
    )
    LOGGER.info("Per-page OCR: %s (%s)", decision.per_page_ocr, decision.per_page_reason)
    if decision.ocr_used and not decision.use_external_ocr:
        LOGGER.info("External OCR unavailable; relying on Docling OCR.")

    converter = build_converter(config, decision)
    docling_input = rasterized_pdf_path or pdf_path
    emit(40, "docling", "Docling conversion running")
    result = converter.convert(docling_input)
    doc = result.document if hasattr(result, "document") else result
    markdown = export_markdown(doc)
    pages = extract_pages(doc)
    if len(pages) <= 1:
        fallback_pages = extract_pages_from_pdf(pdf_path)
        if len(fallback_pages) > len(pages):
            pages = fallback_pages
    emit(70, "docling", "Docling conversion complete")

    ocr_stats: Dict[str, Any] = {}
    ocr_engine_used = decision.ocr_engine
    external_ocr_used = False
    # Always allow external OCR if selected, even when the PDF was rasterized for Docling,
    # so we can prefer column-aware ordering from Paddle/Tesseract when desired.
    if decision.ocr_used and decision.use_external_ocr:
        ocr_dpi = config.ocr_overlay_dpi if text_layer_overlay else config.ocr_dpi
        if ocr_dpi != config.ocr_dpi:
            LOGGER.info("External OCR DPI bumped for overlay: %d -> %d", config.ocr_dpi, ocr_dpi)
        try:
            ocr_pages, ocr_stats = run_external_ocr_pages(
                pdf_path,
                decision.ocr_engine,
                languages,
                config,
                dpi=ocr_dpi,
                progress_cb=emit,
                progress_base=70,
                progress_span=20,
            )
            if ocr_pages:
                ocr_text_chars = ocr_pages_text_chars(ocr_pages)
                if ocr_text_chars > 0:
                    layout_used = ocr_stats.get("layout_used")
                    layout_model = ocr_stats.get("layout_model")
                    LOGGER.info(
                        "External OCR stats: engine=%s, layout_used=%s, layout_model=%s, text_chars=%d",
                        decision.ocr_engine,
                        layout_used,
                        layout_model,
                        ocr_text_chars,
                    )
                    pages = ocr_pages
                    external_ocr_used = True
                    layout_markdown = ocr_stats.get("layout_markdown")
                    if isinstance(layout_markdown, str) and layout_markdown.strip():
                        markdown = layout_markdown
                    elif config.postprocess_markdown and not markdown.strip():
                        markdown = "\\n\\n".join(page.get("text", "") for page in ocr_pages)
                else:
                    ocr_stats = {}
                    LOGGER.warning(
                        "External OCR returned empty text (%s). Keeping Docling text.",
                        decision.ocr_engine,
                    )
            else:
                ocr_stats = {}
                LOGGER.warning(
                    "External OCR returned empty text (%s). Keeping Docling text.",
                    decision.ocr_engine,
                )
        except Exception as exc:
            LOGGER.warning("External OCR failed (%s): %s", decision.ocr_engine, exc)
            if decision.ocr_engine != "tesseract" and "tesseract" in available_engines:
                try:
                    LOGGER.info("Retrying external OCR with tesseract.")
                    ocr_pages, ocr_stats = run_external_ocr_pages(
                        pdf_path,
                        "tesseract",
                        languages,
                        config,
                        dpi=ocr_dpi,
                        progress_cb=emit,
                        progress_base=70,
                        progress_span=20,
                    )
                    if ocr_pages:
                        ocr_text_chars = ocr_pages_text_chars(ocr_pages)
                        if ocr_text_chars > 0:
                            layout_used = ocr_stats.get("layout_used")
                            layout_model = ocr_stats.get("layout_model")
                            LOGGER.info(
                                "External OCR stats: engine=%s, layout_used=%s, layout_model=%s, text_chars=%d",
                                "tesseract",
                                layout_used,
                                layout_model,
                                ocr_text_chars,
                            )
                            pages = ocr_pages
                            ocr_engine_used = "tesseract"
                            external_ocr_used = True
                            if config.postprocess_markdown and not markdown.strip():
                                markdown = "\\n\\n".join(page.get("text", "") for page in ocr_pages)
                        else:
                            ocr_stats = {}
                            LOGGER.warning(
                                "External OCR returned empty text (tesseract). Keeping Docling text."
                            )
                except Exception as exc2:
                    LOGGER.warning("External OCR failed (tesseract): %s", exc2)
    if rasterized_source and rasterized_pdf_path:
        try:
            os.unlink(rasterized_pdf_path)
        except Exception:
            pass

    fallback_engine: Optional[str] = None
    if not has_output_text(markdown, pages):
        LOGGER.warning("Docling output empty; attempting OCR fallback.")
        fallback_dpi = config.ocr_overlay_dpi if text_layer_overlay else config.ocr_dpi
        fallback_engines: List[str] = []
        if "tesseract" in available_engines and ocr_engine_used != "tesseract":
            fallback_engines.append("tesseract")
        if "paddle" in available_engines and ocr_engine_used != "paddle":
            fallback_engines.append("paddle")
        for engine in fallback_engines:
            try:
                fallback_pages, fallback_stats = run_external_ocr_pages(
                    pdf_path,
                    engine,
                    languages,
                    config,
                    dpi=fallback_dpi,
                )
                if ocr_pages_text_chars(fallback_pages) > 0:
                    pages = fallback_pages
                    markdown = "\\n\\n".join(page.get("text", "") for page in pages)
                    external_ocr_used = True
                    ocr_engine_used = engine
                    ocr_stats = fallback_stats
                    fallback_engine = engine
                    LOGGER.warning("External OCR fallback succeeded with %s.", engine)
                    break
                LOGGER.warning("External OCR fallback returned empty text (%s).", engine)
            except Exception as exc:
                LOGGER.warning("External OCR fallback failed (%s): %s", engine, exc)
        if not has_output_text(markdown, pages):
            fallback_pages = extract_pages_from_pdf(pdf_path)
            if ocr_pages_text_chars(fallback_pages) > 0:
                pages = fallback_pages
                markdown = "\\n\\n".join(page.get("text", "") for page in pages)
                external_ocr_used = False
                ocr_stats = dict(ocr_stats)
                ocr_stats["text_layer_fallback"] = True
                fallback_engine = "text_layer"
                LOGGER.warning("Text-layer fallback succeeded after empty output.")

    if external_ocr_used:
        ocr_confidence = normalize_ocr_confidence(ocr_stats.get("ocr_confidence_avg"))
        if ocr_confidence is not None:
            base_confidence = (
                quality.effective_confidence_proxy
                if quality.effective_confidence_proxy is not None
                else quality.confidence_proxy
            )
            if not has_text_layer:
                ocr_weight = 0.7
            elif low_quality:
                ocr_weight = 0.6
            else:
                ocr_weight = 0.4
            blended = (base_confidence * (1.0 - ocr_weight)) + (ocr_confidence * ocr_weight)
            quality.effective_confidence_proxy = max(0.0, min(1.0, blended))
            ocr_stats = dict(ocr_stats)
            ocr_stats["ocr_confidence_normalized"] = ocr_confidence
            ocr_stats["ocr_confidence_weight"] = ocr_weight

    emit(90, "chunking", "Building chunks")
    metadata = {
        "ocr_used": decision.ocr_used,
        "ocr_engine": ocr_engine_used,
        "external_ocr_used": external_ocr_used,
        "languages": decision.languages,
        "route_reason": decision.route_reason,
        "per_page_reason": decision.per_page_reason,
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "text_layer_overlay": text_layer_overlay,
        "rasterized_source_pdf": rasterized_source,
        "rasterize_failed": bool(rasterize_error),
        "rasterize_error": rasterize_error,
        "column_layout_detected": column_layout.detected if column_layout else None,
        "column_layout_ratio": column_layout.page_ratio if column_layout else None,
        "column_layout_reason": column_layout.reason if column_layout else None,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "effective_confidence_proxy": quality.effective_confidence_proxy,
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
        "spellchecker_hit_ratio": quality.spellchecker_hit_ratio,
        "image_heavy_ratio": quality.image_heavy_ratio,
        "image_page_ratio": quality.image_page_ratio,
        "ocr_overlay_ratio": quality.ocr_overlay_ratio,
        "digital_page_ratio": quality.digital_page_ratio,
        "classifier_decision": quality.layer_classification,
        "classifier_sampled_pages": classifier_info.get("sampled_pages") if classifier_info else None,
        "classifier_short_circuit": classifier_info.get("short_circuit") if classifier_info else None,
        "per_page_ocr": decision.per_page_ocr,
    }
    if fallback_engine:
        metadata["output_fallback"] = fallback_engine
    # Attach spellchecker backend info if available
    if LAST_SPELLCHECKER_INFO:
        try:
            metadata.update({
                "spellchecker_backend": LAST_SPELLCHECKER_INFO.get("backend"),
                "spellchecker_dic": LAST_SPELLCHECKER_INFO.get("dic"),
                "spellchecker_aff": LAST_SPELLCHECKER_INFO.get("aff"),
            })
        except Exception:
            pass
    metadata.update(ocr_stats)
    emit(100, "done", "Extraction complete")
    return DoclingConversionResult(markdown=markdown, pages=pages, metadata=metadata)


def build_page_heading_map(
    markdown: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
) -> Dict[int, List[str]]:
    headings: Dict[int, List[str]] = {}
    if not markdown or not pages:
        return headings
    sections = split_markdown_sections(markdown)
    if not sections:
        return headings
    for section in sections:
        title = str(section.get("title") or "").strip()
        text = str(section.get("text") or "").strip()
        if not title or not text:
            continue
        page_start, _ = find_page_range(text, pages, config)
        if page_start <= 0:
            continue
        headings.setdefault(int(page_start), []).append(title)
    return headings


def inject_headings_inline(text: str, titles: Sequence[str]) -> str:
    if not text or not titles:
        return text
    updated = text
    for title in titles:
        clean_title = str(title or "").strip()
        if not clean_title:
            continue
        pattern = re.escape(clean_title).replace("\\\\ ", r"\\s+")
        heading_line = re.compile(rf"^\\s*#+\\s*{pattern}\\s*$", re.IGNORECASE | re.MULTILINE)
        if heading_line.search(updated):
            continue
        title_re = re.compile(rf"(?<!\\w){pattern}(?!\\w)", re.IGNORECASE)
        matches = list(title_re.finditer(updated))
        if matches:
            match = matches[-1]
            start, end = match.span()
            replacement = f"\\n\\n## {clean_title}\\n\\n"
            updated = updated[:start] + replacement + updated[end:]
    return updated


def build_chunks_page(
    doc_id: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
    postprocess: Optional[Callable[[str, Optional[str]], str]] = None,
    heading_map: Optional[Dict[int, List[str]]] = None,
    table_map: Optional[Dict[int, List[str]]] = None,
    preserve_markdown: bool = False,
) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    total_pages = len(pages)
    for page in pages:
        raw_markdown = page.get("markdown") if preserve_markdown else None
        if isinstance(raw_markdown, str) and raw_markdown.strip():
            raw_text = raw_markdown
            apply_postprocess = False
        else:
            raw_text = str(page.get("text", ""))
            apply_postprocess = True
        page_num = int(page.get("page_num", 0))
        if postprocess and apply_postprocess:
            raw_text = postprocess(raw_text, f"page {page_num}/{total_pages}")
        raw_text = clean_chunk_text(raw_text, config)
        if apply_postprocess:
            if table_map:
                tables = table_map.get(page_num, [])
                if tables:
                    raw_text = inject_markdown_tables(raw_text, tables)
            if heading_map:
                titles = heading_map.get(page_num, [])
                if titles:
                    raw_text = inject_headings_inline(raw_text, titles)
        cleaned = normalize_display_markdown(raw_text)
        if apply_postprocess:
            cleaned = reflow_page_text(cleaned)
        if not cleaned:
            continue
        chunk_id = f"p{page_num}"
        chunks.append({
            "chunk_id": chunk_id,
            "text": cleaned,
            "page_start": page_num,
            "page_end": page_num,
            "section": "",
            "char_count": len(cleaned),
        })
    return chunks


def build_chunks_section(
    doc_id: str,
    markdown: str,
    pages: List[Dict[str, Any]],
    config: Optional[DoclingProcessingConfig] = None,
    postprocess: Optional[Callable[[str, Optional[str]], str]] = None,
    preserve_markdown: bool = False,
) -> List[Dict[str, Any]]:
    sections = split_markdown_sections(markdown)
    chunks: List[Dict[str, Any]] = []
    seen_ids: Dict[str, int] = {}

    if not sections:
        return build_chunks_page(doc_id, pages, config=config, preserve_markdown=preserve_markdown)

    total_sections = len(sections)
    for idx, section in enumerate(sections, start=1):
        title = section.get("title", "")
        heading_line = section.get("heading", "")
        text = section.get("text", "")
        if preserve_markdown and isinstance(heading_line, str) and heading_line.strip():
            display_text = f"{heading_line}\\n\\n{text}".strip() if text else heading_line.strip()
            apply_postprocess = False
        else:
            display_text = text
            apply_postprocess = True
        if postprocess and apply_postprocess:
            display_text = postprocess(display_text, f"section {idx}/{total_sections}")
        display_text = clean_chunk_text(display_text, config)
        if not display_text.strip():
            continue
        base_id = slugify(title) or f"section-{idx}"
        if base_id in seen_ids:
            seen_ids[base_id] += 1
            base_id = f"{base_id}-{seen_ids[base_id]}"
        else:
            seen_ids[base_id] = 1
        max_chars = config.max_chunk_chars if config else 0
        overlap_chars = config.chunk_overlap_chars if config else 0
        segments = split_text_by_size(display_text, max_chars, overlap_chars)
        for seg_idx, segment in enumerate(segments, start=1):
            cleaned = normalize_display_markdown(segment)
            if not cleaned:
                continue
            page_start, page_end = find_page_range(cleaned, pages, config)
            chunk_id = base_id if seg_idx == 1 else f"{base_id}-{seg_idx}"
            chunks.append({
                "chunk_id": chunk_id,
                "text": cleaned,
                "page_start": page_start,
                "page_end": page_end,
                "section": title,
                "char_count": len(cleaned),
            })
    return chunks


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract PDF content with Docling and produce chunks.")
    parser.add_argument("--download-hunspell", metavar="LANG_CODE", type=str, help="Download Hunspell dictionary for given language code (e.g. de_DE, en_US, fr_FR)")
    parser.add_argument("--pdf", required=False, help="Path to PDF")
    parser.add_argument("--doc-id", help="Document identifier")
    parser.add_argument("--out-json", help="Output JSON path")
    parser.add_argument("--out-md", help="Output markdown path")
    parser.add_argument(
        "--image-output-dir",
        help="Directory to write extracted images (defaults to markdown output dir)",
    )
    parser.add_argument("--config-json", help="Optional path to a JSON config file (default: docling_config.json under the cache root)")
    parser.add_argument("--log-file", help="Optional path to write a detailed log file")
    parser.add_argument("--spellchecker-info-out", help="Optional path to write spellchecker backend info JSON")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    parser.add_argument("--language-hint", help="Language hint for OCR/quality (e.g., eng, deu, deu+eng)")
    parser.add_argument(
        "--prefer-ocr-engine",
        choices=["paddle", "tesseract"],
        help="Preferred external OCR engine when available.",
    )
    parser.add_argument(
        "--fallback-ocr-engine",
        choices=["paddle", "tesseract"],
        help="Fallback external OCR engine when the preferred engine is unavailable.",
    )
    parser.add_argument(
        "--paddle-structure-v3",
        dest="paddle_structure_v3",
        action="store_true",
        default=None,
        help="Use PP-StructureV3 layout parsing for Paddle OCR",
    )
    parser.add_argument(
        "--no-paddle-structure-v3",
        dest="paddle_structure_v3",
        action="store_false",
        default=None,
        help="Disable PP-StructureV3 layout parsing for Paddle OCR",
    )
    parser.add_argument(
        "--paddle-structure-version",
        help="Override Paddle PP-Structure version (e.g., PP-StructureV3)",
    )
    parser.add_argument(
        "--paddle-structure-api",
        dest="paddle_structure_api_disable",
        action="store_false",
        default=None,
        help="Enable PP-StructureV3 API (overrides local Paddle structure).",
    )
    parser.add_argument(
        "--no-paddle-structure-api",
        dest="paddle_structure_api_disable",
        action="store_true",
        default=None,
        help="Disable PP-StructureV3 API.",
    )
    parser.add_argument(
        "--paddle-structure-api-url",
        help="PP-StructureV3 API URL.",
    )
    parser.add_argument(
        "--paddle-structure-api-token",
        help="PP-StructureV3 API token.",
    )
    parser.add_argument(
        "--paddle-structure-api-timeout",
        type=int,
        help="PP-StructureV3 API timeout in seconds.",
    )
    parser.add_argument(
        "--paddle-max-dpi",
        type=int,
        help="Max DPI for Paddle OCR rendering (overrides default cap).",
    )
    parser.add_argument(
        "--paddle-target-max-side",
        dest="paddle_target_max_side_px",
        type=int,
        help="Target max side length (px) for Paddle OCR rendering.",
    )
    parser.add_argument(
        "--paddle-use-doc-orientation-classify",
        dest="paddle_use_doc_orientation_classify",
        action="store_true",
        default=None,
        help="Enable Paddle doc orientation classify (affects PaddleOCR-VL payload).",
    )
    parser.add_argument(
        "--no-paddle-use-doc-orientation-classify",
        dest="paddle_use_doc_orientation_classify",
        action="store_false",
        default=None,
        help="Disable Paddle doc orientation classify.",
    )
    parser.add_argument(
        "--paddle-use-doc-unwarping",
        dest="paddle_use_doc_unwarping",
        action="store_true",
        default=None,
        help="Enable Paddle doc unwarping (affects PaddleOCR-VL payload).",
    )
    parser.add_argument(
        "--no-paddle-use-doc-unwarping",
        dest="paddle_use_doc_unwarping",
        action="store_false",
        default=None,
        help="Disable Paddle doc unwarping.",
    )
    parser.add_argument(
        "--paddle-use-paddlex-layout",
        dest="paddle_use_paddlex_layout",
        action="store_true",
        default=None,
        help="Enable PaddleX DocLayout path for Paddle OCR.",
    )
    parser.add_argument(
        "--no-paddle-use-paddlex-layout",
        dest="paddle_use_paddlex_layout",
        action="store_false",
        default=None,
        help="Disable PaddleX DocLayout path for Paddle OCR.",
    )
    parser.add_argument(
        "--paddle-vl",
        dest="paddle_use_vl",
        action="store_true",
        default=None,
        help="Enable PaddleOCR-VL pipeline for Paddle OCR.",
    )
    parser.add_argument(
        "--no-paddle-vl",
        dest="paddle_use_vl",
        action="store_false",
        default=None,
        help="Disable PaddleOCR-VL pipeline for Paddle OCR.",
    )
    parser.add_argument(
        "--paddle-vl-device",
        help="PaddleOCR-VL device (e.g., cpu, gpu:0).",
    )
    parser.add_argument(
        "--paddle-vl-rec-backend",
        help="PaddleOCR-VL recognition backend (e.g., vllm-server).",
    )
    parser.add_argument(
        "--paddle-vl-rec-server-url",
        help="PaddleOCR-VL recognition server URL.",
    )
    parser.add_argument(
        "--paddle-vl-rec-max-concurrency",
        type=int,
        help="PaddleOCR-VL max concurrency for recognition server.",
    )
    parser.add_argument(
        "--paddle-vl-rec-api-key",
        help="PaddleOCR-VL recognition server API key.",
    )
    parser.add_argument(
        "--paddle-vl-use-layout-detection",
        dest="paddle_vl_use_layout_detection",
        action="store_true",
        default=None,
        help="Enable layout detection in PaddleOCR-VL.",
    )
    parser.add_argument(
        "--no-paddle-vl-use-layout-detection",
        dest="paddle_vl_use_layout_detection",
        action="store_false",
        default=None,
        help="Disable layout detection in PaddleOCR-VL.",
    )
    parser.add_argument(
        "--paddle-vl-use-chart-recognition",
        dest="paddle_vl_use_chart_recognition",
        action="store_true",
        default=None,
        help="Enable chart recognition in PaddleOCR-VL.",
    )
    parser.add_argument(
        "--no-paddle-vl-use-chart-recognition",
        dest="paddle_vl_use_chart_recognition",
        action="store_false",
        default=None,
        help="Disable chart recognition in PaddleOCR-VL.",
    )
    parser.add_argument(
        "--paddle-vl-format-block-content",
        dest="paddle_vl_format_block_content",
        action="store_true",
        default=None,
        help="Format PaddleOCR-VL block content as markdown.",
    )
    parser.add_argument(
        "--no-paddle-vl-format-block-content",
        dest="paddle_vl_format_block_content",
        action="store_false",
        default=None,
        help="Disable PaddleOCR-VL markdown formatting.",
    )
    parser.add_argument(
        "--paddle-vl-prompt-label",
        help="PaddleOCR-VL prompt label (ocr, formula, table, chart).",
    )
    parser.add_argument(
        "--paddle-vl-use-queues",
        dest="paddle_vl_use_queues",
        action="store_true",
        default=None,
        help="Enable PaddleOCR-VL internal queues for large inputs.",
    )
    parser.add_argument(
        "--no-paddle-vl-use-queues",
        dest="paddle_vl_use_queues",
        action="store_false",
        default=None,
        help="Disable PaddleOCR-VL internal queues.",
    )
    parser.add_argument(
        "--paddle-vl-layout-threshold",
        type=float,
        help="Layout score threshold for PaddleOCR-VL.",
    )
    parser.add_argument(
        "--paddle-vl-layout-unclip",
        type=float,
        help="Layout unclip ratio for PaddleOCR-VL.",
    )
    parser.add_argument(
        "--paddle-vl-layout-merge",
        help="Layout merge mode for PaddleOCR-VL (small, large, union).",
    )
    parser.add_argument(
        "--paddle-vl-layout-nms",
        dest="paddle_vl_layout_nms",
        action="store_true",
        default=None,
        help="Enable PaddleOCR-VL layout NMS.",
    )
    parser.add_argument(
        "--no-paddle-vl-layout-nms",
        dest="paddle_vl_layout_nms",
        action="store_false",
        default=None,
        help="Disable PaddleOCR-VL layout NMS.",
    )
    parser.add_argument(
        "--paddle-vl-api",
        dest="paddle_vl_api_disable",
        action="store_false",
        default=None,
        help="Enable PaddleOCR-VL API.",
    )
    parser.add_argument(
        "--no-paddle-vl-api",
        dest="paddle_vl_api_disable",
        action="store_true",
        default=None,
        help="Disable PaddleOCR-VL API.",
    )
    parser.add_argument(
        "--paddle-vl-api-url",
        help="PaddleOCR-VL API URL (overrides local PaddleOCR-VL).",
    )
    parser.add_argument(
        "--paddle-vl-api-token",
        help="PaddleOCR-VL API token.",
    )
    parser.add_argument(
        "--paddle-vl-api-timeout",
        type=int,
        help="PaddleOCR-VL API timeout in seconds.",
    )
    parser.add_argument(
        "--paddle-vl-markdown-ignore-labels",
        help="Comma-separated list of layout labels to ignore in API markdown output.",
    )
    parser.add_argument(
        "--paddle-vl-repetition-penalty",
        type=float,
        help="PaddleOCR-VL API repetition penalty.",
    )
    parser.add_argument(
        "--paddle-vl-temperature",
        type=float,
        help="PaddleOCR-VL API temperature.",
    )
    parser.add_argument(
        "--paddle-vl-top-p",
        type=float,
        help="PaddleOCR-VL API top-p.",
    )
    parser.add_argument(
        "--paddle-vl-min-pixels",
        type=int,
        help="PaddleOCR-VL API min pixels.",
    )
    parser.add_argument(
        "--paddle-vl-max-pixels",
        type=int,
        help="PaddleOCR-VL API max pixels.",
    )
    parser.add_argument(
        "--paddle-layout-model",
        help="PaddleX layout model (e.g., PP-DocLayout-L).",
    )
    parser.add_argument(
        "--paddle-layout-threshold",
        type=float,
        help="Confidence threshold for PaddleX layout detections.",
    )
    parser.add_argument(
        "--paddle-layout-img-size",
        type=int,
        help="Input image size for PaddleX layout model.",
    )
    parser.add_argument(
        "--paddle-layout-merge",
        help="PaddleX layout merge mode (e.g., small, large, union).",
    )
    parser.add_argument(
        "--paddle-layout-unclip",
        type=float,
        help="PaddleX layout unclip ratio.",
    )
    parser.add_argument(
        "--paddle-layout-device",
        help="PaddleX layout device (e.g., cpu, gpu:0).",
    )
    parser.add_argument(
        "--paddle-layout-keep-labels",
        help="Comma-separated list of PaddleX layout labels to OCR.",
    )
    parser.add_argument(
        "--paddle-layout-save-crops",
        help="Directory to write Paddle layout crop images for debugging.",
    )
    parser.add_argument(
        "--paddle-layout-md-out",
        help="Path to write raw Paddle layout markdown output for debugging.",
    )
    parser.add_argument(
        "--paddle-layout-recognize-boxes",
        dest="paddle_layout_recognize_boxes",
        action="store_true",
        default=None,
        help="Recognize text inside PaddleX layout boxes.",
    )
    parser.add_argument(
        "--no-paddle-layout-recognize-boxes",
        dest="paddle_layout_recognize_boxes",
        action="store_false",
        default=None,
        help="Skip OCR inside PaddleX layout boxes.",
    )
    parser.add_argument(
        "--paddle-layout-nms",
        dest="paddle_layout_nms",
        action="store_true",
        default=None,
        help="Enable PaddleX layout NMS.",
    )
    parser.add_argument(
        "--no-paddle-layout-nms",
        dest="paddle_layout_nms",
        action="store_false",
        default=None,
        help="Disable PaddleX layout NMS.",
    )
    parser.add_argument(
        "--paddle-layout-fail-on-zero",
        action="store_true",
        help="Fail if PaddleX layout detects zero boxes.",
    )
    parser.add_argument(
        "--paddle-dump",
        action="store_true",
        help="Enable verbose Paddle layout diagnostics (similar to smoke test).",
    )
    parser.add_argument(
        "--max-chunk-chars",
        type=int,
        help="Max chars for section chunks before splitting (section mode only).",
    )
    parser.add_argument(
        "--chunk-overlap-chars",
        type=int,
        help="Overlap chars when splitting large section chunks.",
    )
    parser.add_argument(
        "--force-ocr-low-quality",
        action="store_true",
        help="Force OCR when text layer appears low quality",
    )
    parser.add_argument(
        "--force-per-page-ocr",
        action="store_true",
        help="Force per-page OCR and bypass layout heuristics",
    )
    parser.add_argument(
        "--quality-threshold",
        type=float,
        help="Confidence threshold for treating text as low quality (0-1)",
    )
    parser.add_argument("--quality-only", action="store_true", help="Output text-layer quality JSON and exit")
    parser.add_argument("--enable-llm-cleanup", action="store_true", help="Enable LLM cleanup for low-quality chunks")
    parser.add_argument("--llm-cleanup-base-url", help="OpenAI-compatible base URL for LLM cleanup")
    parser.add_argument("--llm-cleanup-api-key", help="API key for LLM cleanup")
    parser.add_argument("--llm-cleanup-model", help="Model name for LLM cleanup")
    parser.add_argument("--llm-cleanup-temperature", type=float, help="Temperature for LLM cleanup")
    parser.add_argument("--llm-cleanup-max-chars", type=int, help="Max chars per chunk for LLM cleanup")
    parser.add_argument("--llm-cleanup-min-quality", type=float, help="Min quality threshold for LLM cleanup")
    parser.add_argument("--progress", action="store_true", help="Emit JSON progress events to stdout")
    parser.add_argument("--enable-dictionary-correction", action="store_true", help="Enable dictionary-based OCR corrections")
    parser.add_argument("--dictionary-path", help="Path to dictionary wordlist (one word per line)")
    parser.add_argument("--enable-hunspell", action="store_true", help="Enable Hunspell dictionary support if available")
    parser.add_argument("--hunspell-aff", help="Path to Hunspell .aff file")
    parser.add_argument("--hunspell-dic", help="Path to Hunspell .dic file")

    # Parse only known args to allow --download-hunspell to work standalone
    args, _ = parser.parse_known_args()

    if args.download_hunspell:
        lang_code = args.download_hunspell
        # Map special cases for repo structure
        repo_map = {
            "de_DE": ("de", "de_DE_frami"),
            "de_AT": ("de", "de_AT"),
            "de_CH": ("de", "de_CH"),
            "en_US": ("en", "en_US"),
            "en_GB": ("en", "en_GB"),
            "fr_FR": ("fr_FR", "fr"),
        }
        # Default: folder and file prefix are lang_code
        folder, prefix = repo_map.get(lang_code, (lang_code, lang_code))
        base_url = f"https://raw.githubusercontent.com/LibreOffice/dictionaries/master/{folder}/"
        aff_name = f"{prefix}.aff"
        dic_name = f"{prefix}.dic"
        aff_url = base_url + aff_name
        dic_url = base_url + dic_name
        out_dir = os.path.join(os.path.dirname(__file__), "hunspell")
        os.makedirs(out_dir, exist_ok=True)
        aff_path = os.path.join(out_dir, f"{lang_code}.aff")
        dic_path = os.path.join(out_dir, f"{lang_code}.dic")
        def download(url, out_path):
            try:
                import urllib.request
                urllib.request.urlretrieve(url, out_path)
                return True
            except Exception as exc:
                print(f"Failed to download {url}: {exc}")
                return False
        print(f"Downloading {aff_url} -> {aff_path}")
        ok_aff = download(aff_url, aff_path)
        print(f"Downloading {dic_url} -> {dic_path}")
        ok_dic = download(dic_url, dic_path)
        if ok_aff and ok_dic:
            print(f"Successfully downloaded Hunspell dictionary for {lang_code} to {out_dir}")
            return 0
        else:
            print(f"Failed to download Hunspell dictionary for {lang_code}. Check the language code or try manually.")
            return 1

    # Require --pdf for normal operation
    if not args.pdf:
        parser.print_help()
        return 2

    doc_label = os.path.basename(args.pdf) if args.pdf else "-"
    record_factory = logging.getLogRecordFactory()
    def _record_factory(*factory_args, **factory_kwargs):
        record = record_factory(*factory_args, **factory_kwargs)
        if not hasattr(record, "doc_name"):
            record.doc_name = doc_label
        return record
    logging.setLogRecordFactory(_record_factory)
    log_format = "%(asctime)sZ %(levelname)s [pid=%(process)d doc=%(doc_name)s] %(name)s: %(message)s"
    logging.basicConfig(level=logging.INFO, format=log_format)
    # Ensure Docling's internal modules emit INFO logs so the CLI log file captures
    # each pipeline stage (external OCR, layout, etc.).
    for logger_name in [
        "docling",
        "docling.backend",
        "docling.models",
        "docling.pipeline",
        "docling.pipeline.standard_pdf_pipeline",
        "docling_extract",
        "ocr_paddle",
    ]:
        logging.getLogger(logger_name).setLevel(logging.INFO)
    class _PypdfCmapWarningFilter(logging.Filter):
        def __init__(self) -> None:
            super().__init__()
            self.suppressed = 0

        def filter(self, record: logging.LogRecord) -> bool:
            if record.name == "pypdf._cmap":
                message = record.getMessage()
                if "Skipping broken line" in message and "Odd-length string" in message:
                    self.suppressed += 1
                    return False
            return True

    cmap_filter = _PypdfCmapWarningFilter()
    logging.getLogger("pypdf._cmap").addFilter(cmap_filter)

    def _log_cmap_summary() -> None:
        if cmap_filter.suppressed:
            LOGGER.warning(
                "Suppressed %d pypdf CMap warnings (Odd-length string).",
                cmap_filter.suppressed,
            )

    atexit.register(_log_cmap_summary)
    # If a log file was requested, add a file handler
    if args.log_file:
        try:
            fh = logging.FileHandler(args.log_file, encoding="utf-8")
            fh.setLevel(logging.INFO)
            formatter = logging.Formatter(log_format)
            formatter.converter = time.gmtime
            fh.setFormatter(formatter)
            logging.getLogger().addHandler(fh)
            LOGGER.info("Logging to file: %s", args.log_file)
        except Exception as exc:
            eprint(f"Failed to set up log file {args.log_file}: {exc}")
    root_logger = logging.getLogger()
    for handler in root_logger.handlers:
        formatter = handler.formatter
        if formatter is None:
            formatter = logging.Formatter(log_format)
            handler.setFormatter(formatter)
        formatter.converter = time.gmtime

    def _resolve_config_path() -> Optional[str]:
        if args.config_json:
            return args.config_json
        try:
            if args.out_json:
                out_dir = os.path.abspath(os.path.dirname(args.out_json))
                root_dir = os.path.abspath(os.path.join(out_dir, os.pardir))
                return os.path.join(root_dir, "docling_config.json")
        except Exception:
            return None
        return None

    def _load_config_overrides(path: Optional[str]) -> Dict[str, Any]:
        if not path or not os.path.isfile(path):
            return {}
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            if isinstance(data, dict):
                return data
        except Exception as exc:
            LOGGER.warning("Failed to read config file %s: %s", path, exc)
        return {}

    _CONFIG_FIELDS = {f.name for f in fields(DoclingProcessingConfig)}

    def _maybe_write_default_config(path: Optional[str]) -> None:
        if not path:
            return
        if os.path.isfile(path):
            return
        try:
            default_cfg = DoclingProcessingConfig()
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(asdict(default_cfg), fh, indent=2)
            LOGGER.info("Wrote default Docling config to %s", path)
        except Exception as exc:
            LOGGER.warning("Failed to write default config file %s: %s", path, exc)

    def _apply_config_overrides(cfg: DoclingProcessingConfig, overrides: Dict[str, Any], source: Optional[str]) -> None:
        if not overrides:
            return
        applied: List[str] = []
        for key, val in overrides.items():
            if key in _CONFIG_FIELDS:
                setattr(cfg, key, val)
                applied.append(key)
        if applied:
            label = source or "config file"
            LOGGER.info(
                "Applied %d config override(s) from %s: %s",
                len(applied),
                label,
                ", ".join(sorted(applied)),
            )


    config_path = _resolve_config_path()
    _maybe_write_default_config(config_path)
    config_overrides = _load_config_overrides(config_path)

    if not os.path.isfile(args.pdf):
        eprint(f"PDF not found: {args.pdf}")
        return 2

    if args.quality_only:
        config = DoclingProcessingConfig(ocr_mode=args.ocr)
        _apply_config_overrides(config, config_overrides, config_path)
        if args.force_ocr_low_quality:
            config.force_ocr_on_low_quality_text = True
        if args.force_per_page_ocr:
            config.force_per_page_ocr = True
        if args.quality_threshold is not None:
            config.quality_confidence_threshold = args.quality_threshold
        report = build_quality_report(args.pdf, config)
        print(json.dumps(report))
        return 0

    if not args.doc_id or not args.out_json or not args.out_md:
        eprint("Missing required arguments: --doc-id, --out-json, --out-md")
        return 2

    try:
        out_json_dir = os.path.dirname(args.out_json)
        out_md_dir = os.path.dirname(args.out_md)
        if out_json_dir:
            os.makedirs(out_json_dir, exist_ok=True)
        if out_md_dir:
            os.makedirs(out_md_dir, exist_ok=True)
    except Exception as exc:
        eprint(f"Failed to create output directories: {exc}")
        return 2

    config = DoclingProcessingConfig(ocr_mode=args.ocr)
    _apply_config_overrides(config, config_overrides, config_path)
    if args.force_ocr_low_quality:
        config.force_ocr_on_low_quality_text = True
    if args.force_per_page_ocr:
        config.force_per_page_ocr = True
    if args.quality_threshold is not None:
        config.quality_confidence_threshold = args.quality_threshold
    if args.language_hint:
        config.language_hint = args.language_hint
    if args.prefer_ocr_engine:
        config.prefer_ocr_engine = args.prefer_ocr_engine
    if args.fallback_ocr_engine:
        config.fallback_ocr_engine = args.fallback_ocr_engine
    if args.paddle_structure_v3 is not None:
        config.paddle_use_structure_v3 = args.paddle_structure_v3
    if args.paddle_structure_version:
        config.paddle_structure_version = args.paddle_structure_version
    if args.paddle_structure_api_disable is not None:
        config.paddle_structure_api_disable = args.paddle_structure_api_disable
    if args.paddle_structure_api_url:
        config.paddle_structure_api_url = args.paddle_structure_api_url
    if args.paddle_structure_api_token:
        config.paddle_structure_api_token = args.paddle_structure_api_token
    if args.paddle_structure_api_timeout is not None:
        config.paddle_structure_api_timeout_sec = args.paddle_structure_api_timeout
    if args.paddle_max_dpi is not None:
        config.paddle_max_dpi = args.paddle_max_dpi
    if args.paddle_target_max_side_px is not None:
        config.paddle_target_max_side_px = args.paddle_target_max_side_px
    if args.paddle_use_doc_orientation_classify is not None:
        config.paddle_use_doc_orientation_classify = args.paddle_use_doc_orientation_classify
    if args.paddle_use_doc_unwarping is not None:
        config.paddle_use_doc_unwarping = args.paddle_use_doc_unwarping
    if args.paddle_use_paddlex_layout is not None:
        config.paddle_use_paddlex_layout = args.paddle_use_paddlex_layout
    if args.paddle_use_vl is not None:
        config.paddle_use_vl = args.paddle_use_vl
    if args.paddle_vl_device:
        config.paddle_vl_device = args.paddle_vl_device
    if args.paddle_vl_rec_backend:
        config.paddle_vl_rec_backend = args.paddle_vl_rec_backend
    if args.paddle_vl_rec_server_url:
        config.paddle_vl_rec_server_url = args.paddle_vl_rec_server_url
    if args.paddle_vl_rec_max_concurrency is not None:
        config.paddle_vl_rec_max_concurrency = args.paddle_vl_rec_max_concurrency
    if args.paddle_vl_rec_api_key:
        config.paddle_vl_rec_api_key = args.paddle_vl_rec_api_key
    if args.paddle_vl_use_layout_detection is not None:
        config.paddle_vl_use_layout_detection = args.paddle_vl_use_layout_detection
    if args.paddle_vl_use_chart_recognition is not None:
        config.paddle_vl_use_chart_recognition = args.paddle_vl_use_chart_recognition
    if args.paddle_vl_format_block_content is not None:
        config.paddle_vl_format_block_content = args.paddle_vl_format_block_content
    if args.paddle_vl_prompt_label:
        config.paddle_vl_prompt_label = args.paddle_vl_prompt_label
    if args.paddle_vl_use_queues is not None:
        config.paddle_vl_use_queues = args.paddle_vl_use_queues
    if args.paddle_vl_layout_threshold is not None:
        config.paddle_vl_layout_threshold = args.paddle_vl_layout_threshold
    if args.paddle_vl_layout_unclip is not None:
        config.paddle_vl_layout_unclip = args.paddle_vl_layout_unclip
    if args.paddle_vl_layout_merge:
        config.paddle_vl_layout_merge = args.paddle_vl_layout_merge
    if args.paddle_vl_layout_nms is not None:
        config.paddle_vl_layout_nms = args.paddle_vl_layout_nms
    if args.paddle_vl_api_disable is not None:
        config.paddle_vl_api_disable = args.paddle_vl_api_disable
    if args.paddle_vl_api_url:
        config.paddle_vl_api_url = args.paddle_vl_api_url
    if args.paddle_vl_api_token:
        config.paddle_vl_api_token = args.paddle_vl_api_token
    if args.paddle_vl_api_timeout is not None:
        config.paddle_vl_api_timeout_sec = args.paddle_vl_api_timeout
    if args.paddle_vl_markdown_ignore_labels:
        config.paddle_vl_markdown_ignore_labels = args.paddle_vl_markdown_ignore_labels
    if args.paddle_vl_repetition_penalty is not None:
        config.paddle_vl_repetition_penalty = args.paddle_vl_repetition_penalty
    if args.paddle_vl_temperature is not None:
        config.paddle_vl_temperature = args.paddle_vl_temperature
    if args.paddle_vl_top_p is not None:
        config.paddle_vl_top_p = args.paddle_vl_top_p
    if args.paddle_vl_min_pixels is not None:
        config.paddle_vl_min_pixels = args.paddle_vl_min_pixels
    if args.paddle_vl_max_pixels is not None:
        config.paddle_vl_max_pixels = args.paddle_vl_max_pixels
    if args.paddle_layout_model:
        config.paddle_layout_model = args.paddle_layout_model
    if args.paddle_layout_threshold is not None:
        config.paddle_layout_threshold = args.paddle_layout_threshold
    if args.paddle_layout_img_size is not None:
        config.paddle_layout_img_size = args.paddle_layout_img_size
    if args.paddle_layout_merge:
        config.paddle_layout_merge = args.paddle_layout_merge
    if args.paddle_layout_unclip is not None:
        config.paddle_layout_unclip = args.paddle_layout_unclip
    if args.paddle_layout_device:
        config.paddle_layout_device = args.paddle_layout_device
    if args.paddle_layout_keep_labels:
        config.paddle_layout_keep_labels = args.paddle_layout_keep_labels
    paddle_layout_md_out = args.paddle_layout_md_out or os.environ.get("ZRR_PADDLE_LAYOUT_MD_OUT")
    if paddle_layout_md_out:
        config.paddle_layout_markdown_out = paddle_layout_md_out
    if args.paddle_layout_recognize_boxes is not None:
        config.paddle_layout_recognize_boxes = args.paddle_layout_recognize_boxes
    if args.paddle_layout_nms is not None:
        config.paddle_layout_nms = args.paddle_layout_nms
    if args.paddle_layout_fail_on_zero:
        config.paddle_layout_fail_on_zero = True
    paddle_save_crops = args.paddle_layout_save_crops or os.environ.get("ZRR_PADDLE_SAVE_CROPS")
    if paddle_save_crops:
        config.paddle_layout_save_crops = paddle_save_crops
    env_paddle_dump = os.environ.get("ZRR_PADDLE_DUMP")
    if args.paddle_dump or (env_paddle_dump and env_paddle_dump.strip().lower() not in {"", "0", "false", "no"}):
        config.paddle_dump = True
    if args.max_chunk_chars is not None:
        config.max_chunk_chars = args.max_chunk_chars
    if args.chunk_overlap_chars is not None:
        config.chunk_overlap_chars = args.chunk_overlap_chars
    if args.enable_llm_cleanup:
        config.enable_llm_correction = True
    if args.enable_dictionary_correction:
        config.enable_dictionary_correction = True
    if args.dictionary_path:
        config.dictionary_path = args.dictionary_path
    if args.enable_hunspell:
        config.enable_hunspell = True
    if args.hunspell_aff:
        config.hunspell_aff_path = args.hunspell_aff
    if args.hunspell_dic:
        config.hunspell_dic_path = args.hunspell_dic
    if args.llm_cleanup_base_url:
        config.llm_cleanup_base_url = args.llm_cleanup_base_url
    if args.llm_cleanup_api_key:
        config.llm_cleanup_api_key = args.llm_cleanup_api_key
    if args.llm_cleanup_model:
        config.llm_cleanup_model = args.llm_cleanup_model
    if args.llm_cleanup_temperature is not None:
        config.llm_cleanup_temperature = args.llm_cleanup_temperature
    if args.llm_cleanup_max_chars is not None:
        config.llm_correction_max_chars = args.llm_cleanup_max_chars
    if args.llm_cleanup_min_quality is not None:
        config.llm_correction_min_quality = args.llm_cleanup_min_quality

    config.llm_correct = build_llm_cleanup_callback(config)

    if paddle_save_crops:
        reset_debug_directory(config.paddle_layout_save_crops)

    # Proactively build spellchecker once to record backend info; will be reused lazily later
    spell_langs = select_language_set(config.language_hint, args.pdf, config)
    if config.enable_hunspell:
        try:
            _ = build_spellchecker_for_languages(config, spell_langs)
        except Exception:
            pass

    # Optionally write spellchecker backend info to a file
    if args.spellchecker_info_out:
        try:
            info = dict(LAST_SPELLCHECKER_INFO)
            info["languages"] = spell_langs
            out_dir = os.path.dirname(args.spellchecker_info_out)
            if out_dir:
                os.makedirs(out_dir, exist_ok=True)
            with open(args.spellchecker_info_out, "w", encoding="utf-8") as fh:
                json.dump(info, fh, indent=2)
            LOGGER.info("Wrote spellchecker info to %s", args.spellchecker_info_out)
        except Exception as exc:
            LOGGER.warning("Failed to write spellchecker info file: %s", exc)

    progress_cb = make_progress_emitter(bool(args.progress))

    try:
        conversion = convert_pdf_with_docling(args.pdf, config, progress_cb=progress_cb)
    except Exception as exc:
        eprint(f"Docling conversion failed: {exc}")
        return 2

    try:
        pages = conversion.pages
        original_pages = pages
        languages = conversion.metadata.get("languages", config.default_lang_english)
        layout_markdown_value = conversion.metadata.get("layout_markdown")
        external_ocr_used = bool(conversion.metadata.get("external_ocr_used"))
        layout_markdown_available = isinstance(layout_markdown_value, str) and bool(layout_markdown_value.strip())
        if layout_markdown_available and config.paddle_layout_markdown_out:
            layout_md_path = config.paddle_layout_markdown_out
            try:
                out_dir = os.path.dirname(layout_md_path)
                if out_dir:
                    os.makedirs(out_dir, exist_ok=True)
                with open(layout_md_path, "w", encoding="utf-8") as fh:
                    fh.write(str(layout_markdown_value))
                LOGGER.info("Wrote Paddle layout markdown to %s", layout_md_path)
            except Exception as exc:
                LOGGER.warning("Failed to write Paddle layout markdown to %s: %s", layout_md_path, exc)
        prefer_layout_markdown = external_ocr_used and layout_markdown_available
        layout_engine_used = bool(conversion.metadata.get("layout_used")) or bool(conversion.metadata.get("layout_model"))
        layout_engine_configured = bool(
            external_ocr_used
            and (
                getattr(config, "paddle_use_vl", False)
                or getattr(config, "paddle_use_structure_v3", False)
                or getattr(config, "paddle_use_paddlex_layout", False)
            )
        )
        layout_engine_active = layout_markdown_available or layout_engine_used or layout_engine_configured
        postprocess_fn: Optional[Callable[[str, Optional[str]], str]] = None
        ocr_used = bool(conversion.metadata.get("ocr_used"))
        postprocess_mode = "none"
        if config.enable_post_correction:
            if layout_engine_active:
                postprocess_mode = "light"
            elif not prefer_layout_markdown:
                postprocess_mode = "full"
        if config.enable_post_correction and postprocess_mode == "none":
            LOGGER.info("Skipping OCR post-processing to preserve Paddle layout output.")
        elif postprocess_mode == "light":
            LOGGER.info("Using light OCR post-processing for layout output.")
        if postprocess_mode in ("full", "light"):
            wordlist = prepare_dictionary_words(config)
        if postprocess_mode == "full":
            allow_missing_space = ocr_used
            def safe_postprocess(text: str, label: Optional[str]) -> str:
                processed = postprocess_text(
                    text,
                    config,
                    languages,
                    wordlist,
                    allow_missing_space=allow_missing_space,
                    progress_cb=progress_cb,
                    progress_label=label,
                )
                if text.strip() and not processed.strip():
                    LOGGER.warning("Postprocess removed all text for %s; keeping original.", label or "text")
                    return text
                return processed

            postprocess_fn = lambda text, label=None: safe_postprocess(text, label)
        elif postprocess_mode == "light":
            postprocess_fn = lambda text, label=None: postprocess_text_light(
                text,
                config,
                languages,
                wordlist,
                for_markdown=False,
            )

        if postprocess_fn:
            total_pages = len(pages)
            updated_pages: List[Dict[str, Any]] = []
            for idx, page in enumerate(pages, start=1):
                label = f"page {idx}/{total_pages}"
                updated_page = {
                    "page_num": page.get("page_num", idx),
                    "text": postprocess_fn(str(page.get("text", "")), label),
                }
                if isinstance(page, dict) and "markdown" in page:
                    updated_page["markdown"] = page.get("markdown")
                updated_pages.append(updated_page)
            pages = updated_pages
            if ocr_pages_text_chars(pages) == 0 and ocr_pages_text_chars(original_pages) > 0:
                LOGGER.warning("Postprocess removed all page text; keeping original pages.")
                pages = original_pages

        markdown = conversion.markdown
        if external_ocr_used:
            if layout_markdown_available:
                markdown = layout_markdown_value
            else:
                markdown = "\\n\\n".join(page.get("text", "") for page in pages)
        original_markdown = markdown
        if config.enable_post_correction and config.postprocess_markdown and postprocess_mode in ("full", "light"):
            if progress_cb:
                progress_cb(100, "postprocess_markdown", "Postprocess markdown...")
            if postprocess_mode == "full":
                allow_missing_space = ocr_used
                processed_markdown = postprocess_text(
                    markdown,
                    config,
                    languages,
                    wordlist,
                    allow_missing_space=allow_missing_space,
                    progress_cb=progress_cb,
                    progress_label="markdown",
                )
            else:
                processed_markdown = postprocess_text_light(
                    markdown,
                    config,
                    languages,
                    wordlist,
                    for_markdown=True,
                )
            if original_markdown.strip() and not processed_markdown.strip():
                LOGGER.warning("Postprocess removed all markdown; keeping original.")
                markdown = original_markdown
            else:
                markdown = processed_markdown

        repeated_clusters: List[BoilerplateCluster] = []
        if config.enable_boilerplate_removal and not external_ocr_used:
            pre_boilerplate_pages = pages
            pre_boilerplate_markdown = markdown
            pages, repeated_clusters, _ = remove_boilerplate_from_pages(pages, config)
            markdown = remove_boilerplate_from_markdown(markdown, repeated_clusters, config)
            if not has_output_text(markdown, pages) and has_output_text(pre_boilerplate_markdown, pre_boilerplate_pages):
                LOGGER.warning("Boilerplate removal removed all text; keeping original.")
                pages = pre_boilerplate_pages
                markdown = pre_boilerplate_markdown

        if external_ocr_used and not layout_markdown_available:
            markdown = "\\n\\n".join(page.get("text", "") for page in pages)

        if prefer_layout_markdown:
            image_labels = conversion.metadata.get("layout_markdown_image_labels")
            if not isinstance(image_labels, dict):
                image_labels = None
            markdown = convert_html_images_to_obsidian(markdown, image_labels=image_labels)
            if isinstance(pages, list):
                for page in pages:
                    if isinstance(page, dict) and isinstance(page.get("markdown"), str):
                        page["markdown"] = convert_html_images_to_obsidian(
                            page["markdown"],
                            image_labels=image_labels,
                        )
            layout_images = conversion.metadata.get("layout_markdown_images")
            if isinstance(layout_images, dict):
                remapped_images = remap_layout_image_keys(layout_images)
                conversion.metadata["layout_markdown_images"] = remapped_images
                if isinstance(image_labels, dict):
                    remapped_labels: Dict[str, str] = {}
                    for key, label in image_labels.items():
                        if not isinstance(key, str) or not isinstance(label, str):
                            continue
                        filename = _extract_image_filename(key)
                        if filename:
                            remapped_labels.setdefault(filename, label)
                        else:
                            remapped_labels.setdefault(key, label)
                    conversion.metadata["layout_markdown_image_labels"] = remapped_labels

        if not markdown.strip():
            LOGGER.warning("Markdown empty; rebuilding from %d pages", len(pages))
            markdown = "\\n\\n".join(str(page.get("text", "")) for page in pages)

        if not has_output_text(markdown, pages):
            eprint("Extraction produced empty output after fallback attempts.")
            return 2

        LOGGER.info("Docling output: pages=%d, markdown_chars=%d", len(pages), len(markdown))

        layout_images = conversion.metadata.get("layout_markdown_images")
        if isinstance(layout_images, dict):
            conversion.metadata["layout_markdown_image_paths"] = sorted(
                path for path in layout_images.keys() if isinstance(path, str) and path
            )
            conversion.metadata.pop("layout_markdown_images", None)
            image_output_dir = args.image_output_dir
            if image_output_dir:
                image_output_dir = image_output_dir.strip()
                if image_output_dir and not os.path.isabs(image_output_dir):
                    if args.out_md:
                        image_output_dir = os.path.join(os.path.dirname(args.out_md), image_output_dir)
                    else:
                        image_output_dir = os.path.abspath(image_output_dir)
            out_md_dir = os.path.dirname(args.out_md) if args.out_md else ""
            for rel_path, image_obj in layout_images.items():
                if not isinstance(rel_path, str) or not rel_path:
                    continue
                target_path = rel_path
                if not os.path.isabs(rel_path):
                    if image_output_dir:
                        target_path = os.path.join(image_output_dir, rel_path)
                    elif out_md_dir:
                        target_path = os.path.join(out_md_dir, rel_path)
                    else:
                        continue
                    try:
                        target_dir = os.path.dirname(target_path)
                        if target_dir:
                            os.makedirs(target_dir, exist_ok=True)
                        if hasattr(image_obj, "save"):
                            image_obj.save(target_path)
                            continue
                        if isinstance(image_obj, str):
                            image_ref = image_obj.strip()
                            if image_ref.startswith("data:") and "base64," in image_ref:
                                try:
                                    _, encoded = image_ref.split("base64,", 1)
                                    data = base64.b64decode(encoded)
                                    with open(target_path, "wb") as handle:
                                        handle.write(data)
                                    continue
                                except Exception as exc:
                                    LOGGER.warning("Failed to decode data URI for %s: %s", rel_path, exc)
                            if image_ref.startswith(("http://", "https://")):
                                try:
                                    with urllib.request.urlopen(image_ref, timeout=30) as resp:
                                        content = resp.read()
                                    with open(target_path, "wb") as handle:
                                        handle.write(content)
                                    continue
                                except (urllib.error.URLError, ValueError) as exc:
                                    LOGGER.warning("Failed to download layout image %s: %s", rel_path, exc)
                        try:
                            import numpy as _np
                            from PIL import Image as _PILImage

                            if isinstance(image_obj, _np.ndarray):
                                _PILImage.fromarray(image_obj).save(target_path)
                        except Exception:
                            continue
                    except Exception as exc:
                        LOGGER.warning("Failed to save layout image %s: %s", rel_path, exc)

        try:
            with open(args.out_md, "w", encoding="utf-8") as handle:
                handle.write(markdown)
        except Exception as exc:
            eprint(f"Failed to write markdown: {exc}")
            return 2

        preserve_markdown_chunks = prefer_layout_markdown
        if args.chunking == "section":
            chunks = build_chunks_section(
                args.doc_id,
                markdown,
                pages,
                config=config,
                postprocess=postprocess_fn,
                preserve_markdown=preserve_markdown_chunks,
            )
        else:
            heading_map = build_page_heading_map(markdown, pages, config)
            table_map = build_page_table_map(markdown, pages, config)
            chunks = build_chunks_page(
                args.doc_id,
                pages,
                config=config,
                postprocess=postprocess_fn,
                heading_map=heading_map,
                table_map=table_map,
                preserve_markdown=preserve_markdown_chunks,
            )
    except Exception as exc:
        eprint(f"Failed to build chunks: {exc}")
        return 2

    chunks = [chunk for chunk in chunks if chunk.get("text")]

    payload = {
        "doc_id": args.doc_id,
        "source_pdf": args.pdf,
        "chunks": chunks,
        "metadata": conversion.metadata,
    }

    try:
        with open(args.out_json, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
    except Exception as exc:
        eprint(f"Failed to write JSON: {exc}")
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"ocr_paddle.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8
from __future__ import annotations

import json
import logging
import numbers
import os
import re
import tempfile
import time
import warnings
from collections import Counter
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

LOGGER = logging.getLogger("docling_extract")

_INLINE_MATH_RE = re.compile(r"(?<!\\$)\\$(?!\\$)([^$\\n]+?)\\$(?!\\$)")
_CURRENCY_THOUSANDS_RE = re.compile(r"^[+-]?\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?%?$")
_CURRENCY_DECIMAL_RE = re.compile(r"^[+-]?\\d+[.,]\\d+%?$")
_CURRENCY_CODES = {
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CNY",
    "RMB",
    "AUD",
    "CAD",
    "CHF",
    "HKD",
    "NZD",
    "SEK",
    "NOK",
    "DKK",
    "INR",
    "KRW",
    "BRL",
    "MXN",
}
_FRACTION_MAP: Dict[Tuple[int, int], str] = {
    (1, 2): "\xBD",
    (1, 3): "\u2153",
    (2, 3): "\u2154",
    (1, 4): "\xBC",
    (3, 4): "\xBE",
    (1, 5): "\u2155",
    (2, 5): "\u2156",
    (3, 5): "\u2157",
    (4, 5): "\u2158",
    (1, 6): "\u2159",
    (5, 6): "\u215A",
    (1, 8): "\u215B",
    (3, 8): "\u215C",
    (5, 8): "\u215D",
    (7, 8): "\u215E",
}


def _extract_footnote_marker(value: str) -> Optional[str]:
    match = re.fullmatch(r"\\^\\s*\\{?\\s*([^\\s{}]+)\\s*\\}?\\s*", value)
    if not match:
        return None
    marker = match.group(1).strip()
    if marker.startswith("\\\\") and len(marker) == 2:
        marker = marker[1:]
    return marker or None


def _replace_simple_fraction(value: str) -> Optional[str]:
    match = re.fullmatch(r"(\\d+)\\s*/\\s*(\\d+)", value)
    if match:
        return _FRACTION_MAP.get((int(match.group(1)), int(match.group(2))))
    match = re.fullmatch(r"\\\\frac\\{\\s*(\\d+)\\s*\\}\\{\\s*(\\d+)\\s*\\}", value)
    if match:
        return _FRACTION_MAP.get((int(match.group(1)), int(match.group(2))))
    return None


def _find_footnotes_section(lines: List[str]) -> Optional[Tuple[int, int]]:
    for idx, line in enumerate(lines):
        if re.match(r"^#{1,6}\\s+footnotes\\s*$", line.strip(), re.IGNORECASE):
            end = len(lines)
            for jdx in range(idx + 1, len(lines)):
                if re.match(r"^#{1,6}\\s+", lines[jdx]):
                    end = jdx
                    break
            return idx, end
    return None


def _normalize_footnote_definition_line(line: str) -> Optional[str]:
    stripped = line.strip()
    if not stripped.startswith("[^"):
        return None
    match = re.match(r"^\\[\\^\\s*([^\\]\\s]+)\\s*\\]\\s*:?\\s*(.*)$", stripped)
    if not match:
        return None
    marker = match.group(1).strip()
    rest = match.group(2).strip()
    if rest:
        return f"[^{marker}]: {rest}"
    return f"[^{marker}]:"


def _looks_like_currency(value: str) -> bool:
    stripped = value.strip()
    if not stripped:
        return False
    if re.search(r"[\\\\^_{}=<>\\[\\]]", stripped):
        return False
    if re.search(r"[*/]", stripped):
        return False
    if re.search(r"[+\\-]", stripped) and not re.fullmatch(r"[+-]?\\d+(?:[.,]\\d+)?%?", stripped):
        return False
    letters = re.findall(r"[A-Za-z]+", stripped)
    if letters:
        if re.search(r"\\d", stripped):
            codes = {letter.upper() for letter in letters}
            return all(code in _CURRENCY_CODES for code in codes)
        return False
    return bool(_CURRENCY_THOUSANDS_RE.fullmatch(stripped) or _CURRENCY_DECIMAL_RE.fullmatch(stripped))


def _normalize_inline_math_for_obsidian(markdown: str, add_footnote_defs: bool = False) -> str:
    if not markdown:
        return markdown
    footnotes: List[str] = []

    def _replace(match: re.Match[str]) -> str:
        content = match.group(1)
        normalized = content.strip()
        if not normalized:
            return match.group(0)
        marker = _extract_footnote_marker(normalized)
        if marker:
            footnotes.append(marker)
            return f"[^{marker}]"
        fraction = _replace_simple_fraction(normalized)
        if fraction:
            return fraction
        if _looks_like_currency(normalized):
            return f"\\\\\${normalized}\\\\$"
        return f"\${normalized}$"

    updated = _INLINE_MATH_RE.sub(_replace, markdown)
    lines = updated.splitlines()
    normalized_any = False
    for idx, line in enumerate(lines):
        normalized = _normalize_footnote_definition_line(line)
        if normalized is not None:
            lines[idx] = normalized
            normalized_any = True
    if normalized_any:
        updated = "\\n".join(lines)
    if not add_footnote_defs or not footnotes:
        return updated

    footnote_ids = list(dict.fromkeys(footnotes))
    lines = updated.splitlines()
    section = _find_footnotes_section(lines)
    if section:
        start, end = section
        for idx in range(start + 1, end):
            normalized = _normalize_footnote_definition_line(lines[idx])
            if normalized is not None:
                lines[idx] = normalized
            else:
                lines[idx] = lines[idx].rstrip()
        updated = "\\n".join(lines)

    missing = [
        marker
        for marker in footnote_ids
        if not re.search(rf"(?m)^\\[\\^{re.escape(marker)}\\]:", updated)
    ]
    if not missing:
        return updated

    if section:
        insert_at = section[1]
        insertion: List[str] = []
        if insert_at > 0 and lines[insert_at - 1].strip():
            insertion.append("")
        insertion.extend([f"[^{marker}]:" for marker in missing])
        lines[insert_at:insert_at] = insertion
        return "\\n".join(lines)

    suffix_lines = ["", "## Footnotes", ""]
    suffix_lines.extend([f"[^{marker}]:" for marker in missing])
    if updated and not updated.endswith("\\n"):
        updated += "\\n"
    return updated + "\\n".join(suffix_lines)


def _paddlex_layout_ocr_pages(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    ocr_pages_text_chars = helpers["ocr_pages_text_chars"]

    try:
        import numpy as np
        from paddleocr import PaddleOCR
        from PIL import Image as _PILImage, ImageOps, ImageFilter
    except Exception as exc:
        raise RuntimeError(f"PaddleX layout OCR dependencies missing: {exc}") from exc

    layout_model = str(getattr(config, "paddle_layout_model", "PP-DocLayout-L"))
    layout_threshold = getattr(config, "paddle_layout_threshold", 0.5)
    layout_img_size = getattr(config, "paddle_layout_img_size", None)
    layout_merge = getattr(config, "paddle_layout_merge", "small")
    layout_unclip = getattr(config, "paddle_layout_unclip", 1.05)
    crop_padding = int(getattr(config, "paddle_crop_padding", 0))
    crop_vbias = int(getattr(config, "paddle_crop_vbias", 0))
    layout_device = getattr(config, "paddle_layout_device", None)
    layout_nms = bool(getattr(config, "paddle_layout_nms", True))
    layout_keep_labels = str(
        getattr(
            config,
            "paddle_layout_keep_labels",
            "text,paragraph_title,title,heading,caption,header,number,figure_title,body,section,text_block,textbox,textline,paragraph",
        )
    )
    layout_recognize_boxes = bool(getattr(config, "paddle_layout_recognize_boxes", True))
    fail_on_zero_layout = bool(getattr(config, "paddle_layout_fail_on_zero", False))
    max_side_px = int(getattr(config, "paddle_target_max_side_px", 0) or 0)
    use_file_path = bool(getattr(config, "paddle_layout_use_file_path", True))
    save_crops_dir = getattr(config, "paddle_layout_save_crops", None)
    dump = bool(getattr(config, "paddle_dump", False))
    if save_crops_dir:
        LOGGER.info("Paddle layout crop debugging enabled: %s", save_crops_dir)

    def _dump_log(message: str, *args: Any) -> None:
        if not dump:
            return
        LOGGER.info("Paddle dump: " + message, *args)

    _PILImage.MAX_IMAGE_PIXELS = None  # type: ignore[attr-defined]
    if hasattr(_PILImage, "DecompressionBombWarning"):
        warnings.filterwarnings("ignore", category=_PILImage.DecompressionBombWarning)  # type: ignore[attr-defined]

    ocr_kwargs: Dict[str, Any] = {"lang": languages}
    if max_side_px > 0:
        ocr_kwargs["text_det_limit_side_len"] = max_side_px
        ocr_kwargs["text_det_limit_type"] = "max"
    if getattr(config, "paddle_use_doc_orientation_classify", False):
        ocr_kwargs["use_doc_orientation_classify"] = True
    if getattr(config, "paddle_use_doc_unwarping", False):
        ocr_kwargs["use_doc_unwarping"] = True
    if getattr(config, "paddle_use_textline_orientation", None) is not None:
        ocr_kwargs["use_textline_orientation"] = bool(config.paddle_use_textline_orientation)

    def _create_ocr_direct(kwargs: Dict[str, Any]) -> PaddleOCR:
        return PaddleOCR(**kwargs)

    def _try_create_direct(kwargs: Dict[str, Any]) -> Optional[PaddleOCR]:
        try:
            return _create_ocr_direct(kwargs)
        except TypeError:
            return None
        except Exception:
            return None

    reduced_kwargs = dict(ocr_kwargs)
    reduced_kwargs.pop("use_doc_orientation_classify", None)
    reduced_kwargs.pop("use_doc_unwarping", None)

    ctor_candidates: List[Dict[str, Any]] = []
    use_tlo = bool(getattr(config, "paddle_use_textline_orientation", True))
    ctor_candidates.append({**ocr_kwargs, "use_textline_orientation": use_tlo})
    ctor_candidates.append({**reduced_kwargs, "use_textline_orientation": use_tlo})
    ctor_candidates.append({**ocr_kwargs})
    ctor_candidates.append({**reduced_kwargs})
    ctor_candidates.append({**ocr_kwargs, "use_angle_cls": use_tlo})
    ctor_candidates.append({**reduced_kwargs, "use_angle_cls": use_tlo})

    ocr: Optional[PaddleOCR] = None
    for kw in ctor_candidates:
        ocr = _try_create_direct(kw)
        if ocr is not None:
            break

    def _paddle_obj_to_dict(obj: Any) -> Optional[Dict[str, Any]]:
        if obj is None:
            return None
        if isinstance(obj, dict):
            return obj
        to_dict = getattr(obj, "to_dict", None)
        if callable(to_dict):
            try:
                converted = to_dict()
                if isinstance(converted, dict):
                    return converted
            except Exception:
                return None
        rec_texts = getattr(obj, "rec_texts", None)
        dt_polys = getattr(obj, "dt_polys", None)
        if rec_texts is not None or dt_polys is not None:
            return {"rec_texts": rec_texts, "dt_polys": dt_polys, "rec_scores": getattr(obj, "rec_scores", None)}
        return None

    def _extract_from_dict(res: Dict[str, Any]) -> List[str]:
        texts = res.get("rec_texts") or res.get("texts") or res.get("rec_text")
        if not isinstance(texts, list):
            return []
        return [str(text or "").strip() for text in texts if str(text or "").strip()]

    def _extract_texts(res: Any) -> List[str]:
        if isinstance(res, dict):
            return _extract_from_dict(res)
        if isinstance(res, list):
            entries = res
            if len(res) == 1:
                maybe_dict = _paddle_obj_to_dict(res[0])
                if maybe_dict is not None:
                    return _extract_from_dict(maybe_dict)
                if isinstance(res[0], (list, tuple, dict)):
                    entries = res[0]
            if isinstance(entries, dict):
                return _extract_from_dict(entries)
            if isinstance(entries, list) and entries and isinstance(entries[0], dict):
                combined: List[str] = []
                for entry in entries:
                    if isinstance(entry, dict):
                        combined.extend(_extract_from_dict(entry))
                    else:
                        maybe_dict = _paddle_obj_to_dict(entry)
                        if maybe_dict is not None:
                            combined.extend(_extract_from_dict(maybe_dict))
                return combined
            texts: List[str] = []
            for entry in entries:
                if not entry or not isinstance(entry, (list, tuple)) or len(entry) < 2:
                    continue
                text_part = entry[1]
                if isinstance(text_part, (list, tuple)) and text_part:
                    text_val = str(text_part[0] or "").strip()
                else:
                    text_val = str(text_part or "").strip()
                if text_val:
                    texts.append(text_val)
            return texts
        return []

    def _ocr_predict(image: Any, det: Optional[bool] = None, rec: Optional[bool] = None, cls: Optional[bool] = None) -> Any:
        if ocr is None or not hasattr(ocr, "predict"):
            return None
        try:
            if det is None and rec is None and cls is None:
                return ocr.predict(image)  # type: ignore[attr-defined]
            return ocr.predict(image, det=det, rec=rec, cls=cls)  # type: ignore[attr-defined]
        except TypeError:
            try:
                return ocr.predict(image)  # type: ignore[attr-defined]
            except Exception:
                return None
        except Exception:
            return None

    def _ocr_legacy(image: Any, **kwargs: Any) -> Any:
        if ocr is None or not hasattr(ocr, "ocr"):
            return None
        try:
            with warnings.catch_warnings():
                warnings.filterwarnings(
                    "ignore",
                    message="Please use \`predict\` instead.",
                    category=DeprecationWarning,
                )
                return ocr.ocr(image, **kwargs)  # type: ignore[attr-defined]
        except TypeError:
            return None
        except Exception:
            return None

    def _strip_html(text: str) -> str:
        return re.sub(r"<[^>]+>", " ", text)

    def _block_to_dict(block: Any) -> Dict[str, Any]:
        if isinstance(block, dict):
            return block
        to_dict = getattr(block, "to_dict", None)
        if callable(to_dict):
            try:
                converted = to_dict()
                if isinstance(converted, dict):
                    return converted
            except Exception:
                return {}
        return {}

    def _extract_block_lines(block: Dict[str, Any]) -> List[str]:
        res = block.get("res") or block.get("text") or block.get("content")
        if isinstance(res, str):
            cleaned = _strip_html(res).strip()
            return [cleaned] if cleaned else []
        if isinstance(res, dict):
            text_val = res.get("text")
            if isinstance(text_val, str):
                cleaned = text_val.strip()
                return [cleaned] if cleaned else []
            html_val = res.get("html")
            if isinstance(html_val, str):
                cleaned = _strip_html(html_val).strip()
                return [cleaned] if cleaned else []
        if isinstance(res, list):
            lines: List[str] = []
            for item in res:
                if isinstance(item, str):
                    s = item.strip()
                    if s:
                        lines.append(s)
                elif isinstance(item, dict):
                    tv = item.get("text")
                    if isinstance(tv, str):
                        s = tv.strip()
                        if s:
                            lines.append(s)
            return lines
        return []

    crop_seq = 0

    def _paddlex_structure_extract_texts(
        image_obj: Any,
        lang: str,
        src_path: Optional[str] = None,
        page_num: Optional[int] = None,
    ) -> Tuple[List[str], bool, List[List[Dict[str, Any]]], int, int]:
        try:
            from paddlex import create_model
        except Exception as exc:
            LOGGER.warning("PaddleX create_model import failed: %s", exc)
            return [], False, [], 0, 0

        cm_kwargs: Dict[str, Any] = {"model_name": layout_model}
        if layout_device:
            cm_kwargs["device"] = layout_device
        img_size = layout_img_size
        try:
            if img_size:
                model = create_model(**{**cm_kwargs, "img_size": img_size})
            else:
                model = create_model(**cm_kwargs)
        except Exception as exc:
            msg = str(exc)
            LOGGER.warning("PaddleX create_model('%s') failed: %s", layout_model, msg)
            if img_size is not None and ("not supported set input shape" in msg.lower() or "not supported" in msg.lower()):
                LOGGER.info("PaddleX model does not support overriding img_size; retrying with default config.")
                try:
                    model = create_model(**cm_kwargs)
                except Exception as exc2:
                    LOGGER.warning("PaddleX create_model retry without img_size failed: %s", exc2)
                    return [], False, [], 0, 0
            else:
                return [], False, [], 0, 0
        try:
            predict_kwargs: Dict[str, Any] = {"batch_size": 1}
            if layout_threshold is not None:
                predict_kwargs["threshold"] = layout_threshold
            predict_kwargs["layout_nms"] = bool(layout_nms)
            if layout_unclip is not None:
                predict_kwargs["layout_unclip_ratio"] = layout_unclip
            if layout_merge is not None:
                predict_kwargs["layout_merge_bboxes_mode"] = layout_merge
            if src_path and isinstance(src_path, str):
                out_gen = model.predict(src_path, **predict_kwargs)
            else:
                out_gen = model.predict(np.array(image_obj), **predict_kwargs)
            output = list(out_gen)
        except Exception as exc:
            LOGGER.warning("PaddleX layout predict failed: %s", exc)
            return [], False, [], 0, 0

        layout_has_boxes = False
        total = 0
        try:
            if isinstance(output, (list, tuple)):
                for res in output:
                    try:
                        maybe = _paddle_obj_to_dict(res)
                    except Exception:
                        maybe = None
                    if isinstance(maybe, dict):
                        dets = (
                            maybe.get("boxes")
                            or maybe.get("layout")
                            or maybe.get("result")
                            or maybe.get("dt_polys")
                            or maybe.get("predictions")
                            or []
                        )
                        if isinstance(dets, (list, tuple)):
                            total += len(dets)
                            continue
                    res_json = getattr(res, "json", None)
                    if res_json is None and isinstance(res, dict):
                        res_json = res
                    if isinstance(res_json, dict):
                        dets = res_json.get("boxes") or res_json.get("layout") or res_json.get("result") or []
                        total += len(dets) if isinstance(dets, (list, tuple)) else 0
            layout_has_boxes = total > 0
            _dump_log("PaddleX layout detections: %d", total)
            if dump:
                try:
                    _dump_log("PaddleX raw output length: %d", len(output))
                    if output:
                        first = output[0]
                        _dump_log("PaddleX first output type: %s", type(first))
                        try:
                            first_repr = repr(first)
                            if first_repr:
                                _dump_log("PaddleX first output repr: %s", first_repr[:200])
                        except Exception:
                            pass
                        try:
                            maybe = _paddle_obj_to_dict(first)
                        except Exception:
                            maybe = None
                        if isinstance(maybe, dict):
                            try:
                                _dump_log("PaddleX first output dict keys: %s", sorted(maybe.keys()))
                            except Exception:
                                _dump_log("PaddleX first output dict keys: %s", list(maybe.keys()))
                            for field in ("boxes", "dt_polys", "rec_texts", "predictions"):
                                if field in maybe:
                                    try:
                                        _dump_log("  %s length: %d", field, len(maybe[field]))
                                    except Exception:
                                        pass
                except Exception:
                    pass
        except Exception:
            pass
        if total == 0 and fail_on_zero_layout:
            raise RuntimeError("PaddleX layout detected 0 boxes and fail_on_zero_layout is enabled.")

        if not layout_recognize_boxes:
            return [], layout_has_boxes, [], total, 0

        boxes: List[Any] = []
        try:
            first = output[0] if isinstance(output, (list, tuple)) and output else None
            maybe = _paddle_obj_to_dict(first)
            if isinstance(maybe, dict):
                raw_boxes = maybe.get("boxes") or []
                if isinstance(raw_boxes, (list, tuple)):
                    boxes = list(raw_boxes)
        except Exception:
            boxes = []

        if not boxes:
            return [], layout_has_boxes, [], total, 0

        layout_has_boxes = True

        def _iter_ocr_entries(res: Any) -> List[Tuple[Any, str]]:
            out: List[Tuple[Any, str]] = []
            try:
                maybe = _paddle_obj_to_dict(res)
                if isinstance(maybe, dict):
                    texts = maybe.get("rec_texts") or maybe.get("texts") or maybe.get("rec_text")
                    box_list = (
                        maybe.get("dt_polys")
                        or maybe.get("det_polys")
                        or maybe.get("dt_boxes")
                        or maybe.get("boxes")
                    )
                    if isinstance(texts, list):
                        for i, tv in enumerate(texts):
                            s = str(tv or "").strip()
                            if not s:
                                continue
                            quad = None
                            if isinstance(box_list, list) and i < len(box_list):
                                quad = box_list[i]
                            out.append((quad, s))
                        return out
            except Exception:
                pass
            if isinstance(res, dict):
                texts = res.get("rec_texts") or res.get("texts") or res.get("rec_text")
                box_list = (
                    res.get("dt_polys")
                    or res.get("det_polys")
                    or res.get("dt_boxes")
                    or res.get("boxes")
                )
                if isinstance(texts, list):
                    for i, tv in enumerate(texts):
                        s = str(tv or "").strip()
                        if not s:
                            continue
                        quad = None
                        if isinstance(box_list, list) and i < len(box_list):
                            quad = box_list[i]
                        out.append((quad, s))
                return out
            if isinstance(res, list):
                entries = res
                if len(res) == 1:
                    maybe = _paddle_obj_to_dict(res[0])
                    if isinstance(maybe, dict):
                        return _iter_ocr_entries(maybe)
                    if isinstance(res[0], (list, tuple, dict)):
                        entries = res[0]
                if isinstance(entries, dict):
                    return _iter_ocr_entries(entries)
                for entry in entries:
                    if isinstance(entry, str):
                        s = entry.strip()
                        if s:
                            out.append((None, s))
                        continue
                    if not isinstance(entry, (list, tuple)):
                        continue
                    if entry and isinstance(entry[0], str):
                        s = str(entry[0] or "").strip()
                        if s:
                            out.append((None, s))
                        continue
                    quad = entry[0] if len(entry) > 0 else None
                    text_part = entry[1] if len(entry) > 1 else None
                    if isinstance(text_part, (list, tuple)) and text_part:
                        s = str(text_part[0] or "").strip()
                    else:
                        s = str(text_part or "").strip()
                    if s:
                        out.append((quad, s))
                return out
            return out

        def _bbox_from_quad(quad: Any) -> Optional[Tuple[float, float, float, float, float]]:
            try:
                if isinstance(quad, (list, tuple)) and quad and isinstance(quad[0], (list, tuple)):
                    xs = [float(p[0]) for p in quad]
                    ys = [float(p[1]) for p in quad]
                    x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
                    return x0, y0, x1, y1, 0.5 * (x0 + x1)
            except Exception:
                return None
            return None

        def _order_blocks_into_columns(blocks: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
            if not blocks:
                return []

            def _center_y(block: Dict[str, Any]) -> float:
                try:
                    return 0.5 * (float(block.get("y0", 0.0)) + float(block.get("y1", 0.0)))
                except Exception:
                    return 0.0

            def _is_full_width(block: Dict[str, Any]) -> bool:
                page_width = max(1.0, float(w or 1))
                try:
                    width = float(block.get("x1", 0.0)) - float(block.get("x0", 0.0))
                except Exception:
                    width = 0.0
                if width <= 0.0:
                    return False
                ratio = width / page_width
                label = str(block.get("label", "")).strip().lower()
                full_labels = {"title", "heading", "header", "paragraph_title", "figure_title", "caption"}
                if ratio >= 0.85:
                    return True
                if label in full_labels and ratio >= 0.6:
                    return True
                return False

            def _order_columns(col_blocks: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
                if not col_blocks:
                    return []
                xs = sorted(b["xc"] for b in col_blocks)
                span = max(1.0, xs[-1] - xs[0]) if xs else 1.0
                widths = sorted((b["x1"] - b["x0"]) for b in col_blocks)
                w_med = widths[len(widths) // 2] if widths else 1.0
                gap_thr = max(0.06 * span, 0.5 * w_med)

                diffs: List[Tuple[float, int]] = []
                for i in range(1, len(xs)):
                    diffs.append((xs[i] - xs[i - 1], i))
                candidates = [idx for (gap, idx) in diffs if gap >= gap_thr]

                blocks_sorted = sorted(col_blocks, key=lambda b: b["xc"])
                columns: List[List[Dict[str, Any]]] = []
                used_splits: List[int] = []
                min_lines = max(3, len(col_blocks) // 20 or 1)

                if candidates:
                    cands_sorted = sorted(candidates, reverse=True)
                    tried = False
                    for a_idx in range(min(5, len(cands_sorted))):
                        for b_idx in range(a_idx + 1, min(6, len(cands_sorted))):
                            a = cands_sorted[a_idx]
                            b = cands_sorted[b_idx]
                            lo, hi = min(a, b), max(a, b)
                            if lo < min_lines or (hi - lo) < min_lines or (len(col_blocks) - hi) < min_lines:
                                continue
                            used_splits = [lo, hi]
                            tried = True
                            break
                        if tried:
                            break
                    if not used_splits:
                        for _, i in sorted(diffs, key=lambda t: t[0], reverse=True):
                            if i >= min_lines and (len(col_blocks) - i) >= min_lines:
                                used_splits = [i]
                                break

                if used_splits:
                    used_splits = sorted(set(used_splits))
                    start = 0
                    for s in used_splits:
                        columns.append(blocks_sorted[start:s])
                        start = s
                    columns.append(blocks_sorted[start:])
                else:
                    cur: List[Dict[str, Any]] = []
                    prev_xc: Optional[float] = None
                    for b in blocks_sorted:
                        if prev_xc is None or abs(b["xc"] - prev_xc) <= gap_thr:
                            cur.append(b)
                        else:
                            if cur:
                                columns.append(cur)
                            cur = [b]
                        prev_xc = b["xc"]
                    if cur:
                        columns.append(cur)

                def col_key(col: List[Dict[str, Any]]) -> float:
                    left_edges = [b["x0"] for b in col if isinstance(b.get("x0"), (int, float))]
                    if left_edges:
                        return min(left_edges)
                    centers = sorted(b["xc"] for b in col)
                    return centers[len(centers) // 2]

                columns = [col for col in columns if col]
                columns.sort(key=col_key)
                ordered_columns: List[List[Dict[str, Any]]] = []
                for col in columns:
                    col_sorted = sorted(col, key=lambda b: (b["y0"], b["x0"]))
                    if col_sorted:
                        ordered_columns.append(col_sorted)
                return ordered_columns

            full_blocks: List[Dict[str, Any]] = []
            normal_blocks: List[Dict[str, Any]] = []
            for block in blocks:
                if _is_full_width(block):
                    block["full_width"] = True
                    full_blocks.append(block)
                else:
                    normal_blocks.append(block)

            if not full_blocks:
                return _order_columns(blocks)

            full_blocks = sorted(full_blocks, key=lambda b: b.get("y0", 0.0))
            normal_sorted = sorted(normal_blocks, key=_center_y)
            sections: List[Tuple[str, List[Dict[str, Any]]]] = []

            normal_idx = 0
            start_y = float("-inf")

            def _collect_until(y_max: float) -> List[Dict[str, Any]]:
                nonlocal normal_idx, start_y
                seg: List[Dict[str, Any]] = []
                while normal_idx < len(normal_sorted):
                    b = normal_sorted[normal_idx]
                    yc = _center_y(b)
                    if yc < start_y:
                        normal_idx += 1
                        continue
                    if yc >= y_max:
                        break
                    seg.append(b)
                    normal_idx += 1
                return seg

            for fb in full_blocks:
                seg = _collect_until(float(fb.get("y0", 0.0)))
                if seg:
                    sections.append(("columns", seg))
                sections.append(("full", [fb]))
                start_y = float(fb.get("y1", fb.get("y0", 0.0)))

            tail: List[Dict[str, Any]] = []
            while normal_idx < len(normal_sorted):
                b = normal_sorted[normal_idx]
                if _center_y(b) >= start_y:
                    tail.append(b)
                normal_idx += 1
            if tail:
                sections.append(("columns", tail))

            ordered_columns: List[List[Dict[str, Any]]] = []
            for kind, seg in sections:
                if kind == "full":
                    ordered_columns.append(seg)
                else:
                    ordered_columns.extend(_order_columns(seg))
            return ordered_columns

        def _columns_to_text(columns: List[List[Dict[str, Any]]]) -> str:
            if not columns:
                return ""
            out_cols: List[str] = []
            for col in columns:
                lines = [str(b.get("text", "")).strip() for b in col if str(b.get("text", "")).strip()]
                if lines:
                    out_cols.append("\\n".join(lines))
            return "\\n\\n".join([c for c in out_cols if c])

        def _rect_from_box(b: Any) -> Optional[Tuple[float, float, float, float]]:
            try:
                for names in (("x0", "y0", "x1", "y1"), ("xmin", "ymin", "xmax", "ymax"), ("left", "top", "right", "bottom")):
                    if all(hasattr(b, n) for n in names):
                        x0 = float(getattr(b, names[0]))
                        y0 = float(getattr(b, names[1]))
                        x1 = float(getattr(b, names[2]))
                        y1 = float(getattr(b, names[3]))
                        return (x0, y0, x1, y1)
                bb_attr = getattr(b, "bbox", None)
                if bb_attr is not None:
                    return _rect_from_box(bb_attr)
            except Exception:
                pass

            if not isinstance(b, (dict, list, tuple)):
                try:
                    maybe = _paddle_obj_to_dict(b)
                except Exception:
                    maybe = None
                if isinstance(maybe, dict):
                    b = maybe

            if isinstance(b, dict):
                coord = b.get("coordinate")
                if coord is not None:
                    try:
                        import numpy as _np4  # type: ignore

                        if isinstance(coord, _np4.ndarray):
                            if coord.ndim == 2 and coord.shape[1] == 2:
                                coord = coord.reshape(-1, 2).tolist()
                            else:
                                coord = coord.flatten().tolist()
                    except Exception:
                        pass
                    if isinstance(coord, (list, tuple)):
                        if coord and isinstance(coord[0], (list, tuple)) and len(coord[0]) >= 2:
                            try:
                                xs = [float(p[0]) for p in coord]
                                ys = [float(p[1]) for p in coord]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                            except Exception:
                                pass
                        if coord and isinstance(coord[0], dict):
                            try:
                                xs: List[float] = []
                                ys: List[float] = []
                                for entry in coord:
                                    x = entry.get("x") if "x" in entry else entry.get("X")
                                    y = entry.get("y") if "y" in entry else entry.get("Y")
                                    if x is None or y is None:
                                        continue
                                    xs.append(float(x))
                                    ys.append(float(y))
                                if xs and ys:
                                    return (min(xs), min(ys), max(xs), max(ys))
                            except Exception:
                                pass
                        if len(coord) >= 8 and all(isinstance(v, numbers.Real) for v in coord):
                            xs = [float(v) for v in coord[0::2]]
                            ys = [float(v) for v in coord[1::2]]
                            return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                        if len(coord) == 4 and all(isinstance(v, numbers.Real) for v in coord):
                            x0, y0, a, b_val = map(float, coord)
                            if a <= x0 or b_val <= y0:
                                x1 = x0 + a
                                y1 = y0 + b_val
                            else:
                                x1 = a
                                y1 = b_val
                            if x1 > x0 and y1 > y0:
                                return (x0, y0, x1, y1)
                if isinstance(coord, dict):
                    try:
                        for names in (("x0", "y0", "x1", "y1"), ("xmin", "ymin", "xmax", "ymax"), ("left", "top", "right", "bottom")):
                            if all(k in coord for k in names):
                                x0 = float(coord[names[0]])
                                y0 = float(coord[names[1]])
                                x1 = float(coord[names[2]])
                                y1 = float(coord[names[3]])
                                return (x0, y0, x1, y1)
                    except Exception:
                        pass
                    for key in ("points", "poly", "polygon", "coords", "coordinates"):
                        pts = coord.get(key)
                        if pts is None:
                            continue
                        try:
                            import numpy as _np5  # type: ignore

                            if isinstance(pts, _np5.ndarray):
                                if pts.ndim == 2 and pts.shape[1] == 2:
                                    pts = pts.reshape(-1, 2).tolist()
                                else:
                                    pts = pts.flatten().tolist()
                        except Exception:
                            pass
                        if isinstance(pts, (list, tuple)):
                            if pts and isinstance(pts[0], (list, tuple)) and len(pts[0]) >= 2:
                                xs = [float(p[0]) for p in pts]
                                ys = [float(p[1]) for p in pts]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                            if pts and isinstance(pts[0], dict):
                                xs = []
                                ys = []
                                for entry in pts:
                                    x = entry.get("x") if "x" in entry else entry.get("X")
                                    y = entry.get("y") if "y" in entry else entry.get("Y")
                                    if x is None or y is None:
                                        continue
                                    xs.append(float(x))
                                    ys.append(float(y))
                                if xs and ys:
                                    return (min(xs), min(ys), max(xs), max(ys))
                            if len(pts) >= 8 and all(isinstance(v, numbers.Real) for v in pts):
                                xs = [float(v) for v in pts[0::2]]
                                ys = [float(v) for v in pts[1::2]]
                                return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                            if len(pts) == 4 and all(isinstance(v, numbers.Real) for v in pts):
                                x0, y0, a, b_val = map(float, pts[:4])
                                if a <= x0 or b_val <= y0:
                                    x1 = x0 + a
                                    y1 = y0 + b_val
                                else:
                                    x1 = a
                                    y1 = b_val
                                if x1 > x0 and y1 > y0:
                                    return (x0, y0, x1, y1)
                bb = b.get("bbox") or b.get("box") or b.get("points") or b.get("poly")
                if isinstance(bb, dict):
                    try:
                        x0 = float(bb.get("x0", bb.get("left", 0.0)))
                        y0 = float(bb.get("y0", bb.get("top", 0.0)))
                        x1 = float(bb.get("x1", bb.get("right", 0.0)))
                        y1 = float(bb.get("y1", bb.get("bottom", 0.0)))
                        return (x0, y0, x1, y1)
                    except Exception:
                        return None
                try:
                    x0 = b.get("x0") or b.get("xmin") or b.get("left")
                    y0 = b.get("y0") or b.get("ymin") or b.get("top")
                    x1 = b.get("x1") or b.get("xmax") or b.get("right")
                    y1 = b.get("y1") or b.get("ymax") or b.get("bottom")
                    if all(v is not None for v in (x0, y0, x1, y1)):
                        return (float(x0), float(y0), float(x1), float(y1))
                except Exception:
                    pass
                if isinstance(bb, (list, tuple)):
                    if len(bb) == 4 and all(isinstance(v, numbers.Real) for v in bb):
                        return (float(bb[0]), float(bb[1]), float(bb[2]), float(bb[3]))
                    if len(bb) >= 8 and all(isinstance(v, numbers.Real) for v in bb):
                        xs = [float(v) for v in bb[0::2]]
                        ys = [float(v) for v in bb[1::2]]
                        return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None

            if isinstance(b, (list, tuple)):
                if b and isinstance(b[0], (list, tuple)) and len(b[0]) >= 2:
                    try:
                        xs = [float(p[0]) for p in b]
                        ys = [float(p[1]) for p in b]
                        return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                    except Exception:
                        pass
                if len(b) >= 8 and all(isinstance(v, numbers.Real) for v in b):
                    xs = [float(v) for v in b[0::2]]
                    ys = [float(v) for v in b[1::2]]
                    return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                if len(b) >= 4 and all(isinstance(v, numbers.Real) for v in b[:4]):
                    return (float(b[0]), float(b[1]), float(b[2]), float(b[3]))

            try:
                import numpy as _np6  # type: ignore

                if isinstance(b, _np6.ndarray):
                    arr = b.flatten().tolist()
                    if len(arr) >= 8:
                        xs = [float(v) for v in arr[0::2]]
                        ys = [float(v) for v in arr[1::2]]
                        return (min(xs), min(ys), max(xs), max(ys)) if xs and ys else None
                    if len(arr) >= 4:
                        return (float(arr[0]), float(arr[1]), float(arr[2]), float(arr[3]))
            except Exception:
                pass

            return None

        rects: List[Dict[str, Any]] = []
        kept_labels: List[str] = []
        skipped_labels: List[str] = []
        if layout_keep_labels:
            allowed_text_labels = {lbl.strip().lower() for lbl in str(layout_keep_labels).split(",") if lbl.strip()}
        else:
            allowed_text_labels = {
                "text", "paragraph_title", "title", "heading", "caption",
                "header", "number", "figure_title", "body", "section",
                "text_block", "textblock", "paragraph", "textbox", "textline",
            }
        for b in boxes:
            label = None
            if isinstance(b, dict):
                try:
                    label = str(b.get("label") or "").strip().lower() or None
                except Exception:
                    label = None
            else:
                try:
                    label = str(getattr(b, "label") or "").strip().lower() or None
                except Exception:
                    label = None
            take = True
            if label:
                if label not in allowed_text_labels:
                    skipped_labels.append(label)
                    take = False
                else:
                    kept_labels.append(label)
            if not take:
                continue
            r = _rect_from_box(b)
            if r is not None:
                x0, y0, x1, y1 = r
                if x1 > x0 and y1 > y0:
                    rects.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1, "label": label or "text"})

        w, h = image_obj.size if hasattr(image_obj, "size") else (0, 0)
        blocks: List[Dict[str, Any]] = []

        def _save_crop(crop_img: Any, ix0: int, iy0: int, ix1: int, iy1: int) -> None:
            nonlocal crop_seq
            if not save_crops_dir:
                return
            try:
                os.makedirs(save_crops_dir, exist_ok=True)
                crop_seq += 1
                prefix = f"p{page_num}" if page_num is not None else "p0"
                filename = f"{prefix}_crop_{crop_seq:05d}_{ix0}_{iy0}_{ix1}_{iy1}.png"
                crop_img.save(os.path.join(save_crops_dir, filename))
            except Exception as exc:
                if dump:
                    _dump_log("Failed to save crop: %s", exc)

        def _keep_if_text(res: Any) -> Any:
            if not res:
                return None
            try:
                for _, text_val in _iter_ocr_entries(res):
                    if text_val:
                        return res
            except Exception:
                return None
            return None

        def _iter_crop_variants(crop_img: Any):
            base = crop_img.convert("RGB")
            yield "orig", base
            try:
                gray = ImageOps.grayscale(base)
                yield "gray", gray.convert("RGB")
                yield "autocontrast", ImageOps.autocontrast(gray).convert("RGB")
                bw = ImageOps.autocontrast(gray).point(lambda x: 255 if x > 160 else 0, mode="L").convert("RGB")
                yield "bw", bw
            except Exception:
                pass
            try:
                yield "sharp", base.filter(ImageFilter.SHARPEN)
                yield "unsharp", base.filter(ImageFilter.UnsharpMask(radius=1.5, percent=150, threshold=3))
            except Exception:
                pass
            max_upscale_side = 3500
            for scale in (1.5, 2.0):
                try:
                    new_w = max(1, int(base.width * scale))
                    new_h = max(1, int(base.height * scale))
                    if max(new_w, new_h) > max_upscale_side:
                        continue
                    up = base.resize((new_w, new_h), resample=_PILImage.LANCZOS)
                    yield f"up{scale}".replace(".", "p"), up
                    try:
                        up_gray = ImageOps.grayscale(up)
                        yield f"up{scale}".replace(".", "p") + "_gray", up_gray.convert("RGB")
                    except Exception:
                        pass
                except Exception:
                    continue

        def _run_crop_ocr(crop_img: Any) -> Any:
            for variant_name, variant_img in _iter_crop_variants(crop_img):
                crop_arr = np.array(variant_img)
                result = _ocr_predict(
                    crop_arr,
                    det=False,
                    rec=True,
                    cls=bool(getattr(config, "paddle_use_textline_orientation", True)),
                )
                result = _keep_if_text(result)
                if not result:
                    result = _ocr_predict(crop_arr, det=False, rec=True)
                    result = _keep_if_text(result)
                if not result:
                    result = _ocr_predict(crop_arr)
                    result = _keep_if_text(result)
                if not result:
                    result = _ocr_legacy(crop_arr)
                    result = _keep_if_text(result)
                if not result:
                    result = _ocr_legacy(
                        crop_arr,
                        cls=bool(getattr(config, "paddle_use_textline_orientation", True)),
                    )
                    result = _keep_if_text(result)
                if result:
                    _dump_log("Crop OCR succeeded with variant: %s", variant_name)
                    return result
            return None

        if rects:
            if dump:
                try:
                    first_rect = rects[0] if rects else None
                    _dump_log("PaddleX rects parsed: %d; first=%s", len(rects), first_rect)
                    if kept_labels or skipped_labels:
                        kept_counts = dict(Counter(kept_labels)) if kept_labels else {}
                        skipped_counts = dict(Counter(skipped_labels)) if skipped_labels else {}
                        _dump_log("PaddleX labels kept=%s skipped=%s", kept_counts, skipped_counts)
                except Exception:
                    pass
            for rect in rects:
                try:
                    x0 = rect.get("x0"); y0 = rect.get("y0")
                    x1 = rect.get("x1"); y1 = rect.get("y1")
                    label = rect.get("label") or "text"
                    if x0 is None or y0 is None or x1 is None or y1 is None:
                        continue
                    
                    # Strict crop of the box content only (clamped to image)
                    cx0 = max(0, int(x0)); cx1 = min(w, int(x1))
                    cy0 = max(0, int(y0)); cy1 = min(h, int(y1))

                    if cx1 <= cx0 or cy1 <= cy0:
                        continue

                    # Shift crop vertically (vbias>0 moves crop downward) while preserving height
                    box_h = cy1 - cy0
                    if crop_vbias:
                        shifted_cy0 = cy0 + crop_vbias
                        # Clamp start so height fits in image
                        shifted_cy0 = min(max(0, shifted_cy0), max(0, h - box_h))
                        cy0 = shifted_cy0
                        cy1 = min(h, cy0 + box_h)

                    # Asymmetric vertical padding: reduce top / add to bottom when crop_vbias > 0
                    pad_top = max(0, crop_padding - crop_vbias)
                    pad_bottom = max(0, crop_padding + crop_vbias)

                    # Virtual padded coordinates (unclamped)
                    vx0 = int(x0) - crop_padding
                    vx1 = int(x1) + crop_padding
                    vy0 = int(y0) - pad_top
                    vy1 = int(y1) + pad_bottom
                    
                    dst_w = vx1 - vx0
                    dst_h = vy1 - vy0
                    
                    # White canvas (passepartout)
                    canvas = _PILImage.new("RGB", (dst_w, dst_h), (255, 255, 255))
                    
                    # Paste strict content at correct offset
                    dx = cx0 - vx0
                    dy = cy0 - vy0
                    src_crop = image_obj.crop((cx0, cy0, cx1, cy1))
                    canvas.paste(src_crop, (dx, dy))
                    crop = canvas
                    
                    # Use virtual coordinates for saving and OCR mapping
                    ix0, iy0, ix1, iy1 = vx0, vy0, vx1, vy1
                    _save_crop(crop, ix0, iy0, ix1, iy1)
                except Exception:
                    continue
                result_crop = _run_crop_ocr(crop)
                if not result_crop:
                    continue
                line_entries: List[Dict[str, Any]] = []
                seq = 0
                for quad, text_val in _iter_ocr_entries(result_crop):
                    if not text_val:
                        continue
                    seq += 1
                    line_x0 = float(ix0)
                    line_y0 = float(iy0)
                    if quad is not None:
                        bb = _bbox_from_quad(quad)
                        if bb:
                            bx0, by0, _, _, _ = bb
                            line_x0 = bx0 + float(ix0)
                            line_y0 = by0 + float(iy0)
                    line_entries.append({"text": text_val, "y0": line_y0, "x0": line_x0, "seq": seq})
                if not line_entries:
                    continue
                line_entries.sort(key=lambda entry: (entry["y0"], entry["x0"], entry["seq"]))
                block_text = "\\n".join(entry["text"] for entry in line_entries if entry["text"])
                if not block_text.strip():
                    continue
                bx0, by0, bx1, by1 = float(ix0), float(iy0), float(ix1), float(iy1)
                bxc = 0.5 * (bx0 + bx1)
                blocks.append({
                    "x0": bx0,
                    "y0": by0,
                    "x1": bx1,
                    "y1": by1,
                    "xc": bxc,
                    "label": label,
                    "text": block_text,
                })
        else:
            if dump and boxes:
                try:
                    _dump_log(
                        "PaddleX boxes present but no rects parsed; inspecting first %d box(es)",
                        min(len(boxes), 2),
                    )
                    for idx_box, bb in enumerate(boxes[:2]):
                        _dump_log("  Box[%d] type: %s", idx_box, type(bb))
                        for names in (("x0", "y0", "x1", "y1"), ("xmin", "ymin", "xmax", "ymax"), ("left", "top", "right", "bottom")):
                            try:
                                if all(hasattr(bb, n) for n in names):
                                    vals = tuple(float(getattr(bb, n)) for n in names)
                                    _dump_log("  Box[%d] attrs %s: %s", idx_box, names, vals)
                            except Exception:
                                pass
                        maybe_bb = None
                        try:
                            maybe_bb = _paddle_obj_to_dict(bb)
                        except Exception:
                            maybe_bb = None
                        if isinstance(maybe_bb, dict):
                            try:
                                _dump_log("  Box[%d] dict keys: %s", idx_box, sorted(maybe_bb.keys()))
                            except Exception:
                                _dump_log("  Box[%d] dict keys: %s", idx_box, list(maybe_bb.keys()))
                            try:
                                coord = maybe_bb.get("coordinate")
                            except Exception:
                                coord = None
                            if coord is not None:
                                try:
                                    if isinstance(coord, np.ndarray):
                                        _dump_log("    coordinate ndarray shape: %s", getattr(coord, "shape", None))
                                    elif isinstance(coord, (list, tuple)):
                                        preview_vals = coord[:8] if len(coord) > 8 else coord
                                        _dump_log(
                                            "    coordinate list len: %d preview: %s",
                                            len(coord),
                                            preview_vals,
                                        )
                                        if coord and isinstance(coord[0], (list, tuple)):
                                            _dump_log("    coordinate first pair: %s", coord[0])
                                        elif coord and isinstance(coord[0], dict):
                                            _dump_log("    coordinate first dict keys: %s", list(coord[0].keys()))
                                    elif isinstance(coord, dict):
                                        _dump_log("    coordinate dict keys: %s", list(coord.keys()))
                                except Exception:
                                    pass
                        elif isinstance(bb, (list, tuple)):
                            preview = bb[:8] if len(bb) >= 8 else bb
                            _dump_log("  Box[%d] list/tuple preview: %s", idx_box, preview)
                        else:
                            try:
                                if isinstance(bb, np.ndarray):
                                    _dump_log("  Box[%d] ndarray shape: %s", idx_box, bb.shape)
                            except Exception:
                                pass
                except Exception:
                    pass

        if blocks:
            columns = _order_blocks_into_columns(blocks)
            ordered = _columns_to_text(columns)
            if ordered.strip():
                return ordered.splitlines(), True, columns, total, len(blocks)

        if layout_has_boxes:
            _dump_log("Layout boxes detected but crop OCR produced no text; enabling plain OCR fallback.")
            return [], True, [], total, 0
        _dump_log("PaddleX layout produced no boxes; falling back to plain OCR.")
        return [], False, [], total, 0

    def _render_layout_markdown(pages: List[List[List[Dict[str, Any]]]], fallback_text: Optional[str] = None) -> str:
        def _normalize_block_text(text: str) -> str:
            text = text.replace("\\r\\n", "\\n").replace("\\r", "\\n")
            lines = [line.rstrip() for line in text.split("\\n")]
            while lines and not lines[0].strip():
                lines.pop(0)
            while lines and not lines[-1].strip():
                lines.pop()
            return "\\n".join(lines)

        def _single_line(text: str) -> str:
            return " ".join(_normalize_block_text(text).split()).strip()

        out_lines: List[str] = []
        for page_idx, columns in enumerate(pages, start=1):
            page_blocks = [b for col in columns for b in col] if columns else []
            if not page_blocks:
                continue

            out_lines.append(f"## Page {page_idx}")
            non_full_columns = [
                col for col in columns
                if not all(bool(block.get("full_width")) for block in col)
            ]
            col_num = 0
            for col in columns:
                is_full = all(bool(block.get("full_width")) for block in col)
                if not is_full:
                    col_num += 1
                    if len(non_full_columns) > 1:
                        out_lines.append(f"### Column {col_num}")

                for block in col:
                    text_val = _normalize_block_text(str(block.get("text", "") or ""))
                    if not text_val:
                        continue
                    label_val = str(block.get("label", "") or "").strip().lower()

                    if label_val in {"paragraph_title", "title", "heading", "section", "header"}:
                        heading = _single_line(text_val)
                        if heading:
                            out_lines.append(f"### {heading}")
                        out_lines.append("")
                        continue

                    if label_val in {"figure_title", "caption", "figure", "figure_caption"}:
                        caption = _single_line(text_val)
                        if caption:
                            out_lines.append(f"**figure caption:** {caption}")
                        out_lines.append("")
                        continue

                    out_lines.append("")
                    out_lines.append(text_val)

            out_lines.append("")

        if not out_lines and fallback_text:
            fb = _normalize_block_text(fallback_text)
            if fb:
                return f"## Page 1\\n\\n{fb}\\n"

        return ("\\n".join(out_lines).rstrip() + "\\n") if out_lines else ""

    pages: List[Dict[str, Any]] = []
    layout_pages: List[List[List[Dict[str, Any]]]] = []
    all_lines: List[str] = []
    total_boxes = 0
    total_blocks = 0
    pages_with_boxes = 0
    pages_with_blocks = 0
    fullpage_fallback_pages = 0
    total = max(1, len(images))
    if progress_cb and progress_span > 0:
        progress_cb(progress_base, "layout", f"Paddle layout page 1/{total}")

    for idx, image in enumerate(images, start=1):
        page_img = image.convert("RGB")
        if max_side_px > 0:
            max_side = max(page_img.width, page_img.height)
            if max_side > max_side_px:
                scale = max_side_px / max_side
                new_size = (max(1, int(page_img.width * scale)), max(1, int(page_img.height * scale)))
                page_img = page_img.resize(new_size, resample=_PILImage.LANCZOS)
        src_path = None
        if use_file_path:
            try:
                fd, src_path = tempfile.mkstemp(prefix="paddlex_layout_", suffix=".png")
                os.close(fd)
                page_img.save(src_path)
            except Exception:
                src_path = None
        try:
            page_lines, layout_boxes, page_columns, box_count, block_count = _paddlex_structure_extract_texts(
                page_img,
                languages,
                src_path=src_path,
                page_num=idx,
            )
        finally:
            if src_path:
                try:
                    os.unlink(src_path)
                except Exception:
                    pass
        layout_pages.append(page_columns)
        if layout_boxes:
            pages_with_boxes += 1
            total_boxes += int(box_count or 0)
        if page_columns:
            pages_with_blocks += 1
            total_blocks += int(block_count or 0)

        if not page_lines:
            if layout_boxes:
                _dump_log("Page %d: layout boxes detected but no text lines produced; skipping plain OCR fallback.", idx)
                page_lines = []
            else:
                _dump_log("Page %d: layout produced no boxes; running plain OCR fallback.", idx)
                fullpage_fallback_pages += 1
                if ocr is None:
                    for kw in ctor_candidates:
                        ocr = _try_create_direct(kw)
                        if ocr is not None:
                            break
                    if ocr is None:
                        raise RuntimeError("Failed to create PaddleOCR for plain OCR fallback.")
                result = None
                try:
                    img_np = np.array(page_img)
                    result = _ocr_predict(img_np)
                    if result is None:
                        result = _ocr_legacy(img_np)
                    if result is None:
                        result = _ocr_legacy(
                            img_np,
                            cls=bool(getattr(config, "paddle_use_textline_orientation", True)),
                        )
                except Exception as exc:
                    raise RuntimeError(f"PaddleOCR failed: {exc}") from exc
                page_lines = _extract_texts(result) if result else []

        if page_lines:
            all_lines.extend(page_lines)
        page_text = "\\n".join(page_lines).strip()
        pages.append({"page_num": idx, "text": page_text})

        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "layout", f"Paddle layout page {idx}/{total}")

    text = "\\n".join(all_lines).strip()
    LOGGER.info(
        "PaddleX layout OCR complete: pages=%d, text_chars=%d",
        len(pages),
        ocr_pages_text_chars(pages),
    )
    layout_markdown = _render_layout_markdown(layout_pages, fallback_text=text)
    return pages, {
        "layout_used": True,
        "layout_model": layout_model,
        "layout_boxes_total": total_boxes,
        "layout_blocks_total": total_blocks,
        "layout_pages_with_boxes": pages_with_boxes,
        "layout_pages_with_blocks": pages_with_blocks,
        "layout_pages_fullpage_fallback": fullpage_fallback_pages,
        "layout_markdown": layout_markdown,
    }

def ocr_pages_with_paddle_structure(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    structure_api_disabled = bool(getattr(config, "paddle_structure_api_disable", False))
    structure_api_url = getattr(config, "paddle_structure_api_url", None) or os.getenv("PADDLE_STRUCTURE_API_URL")
    structure_api_token = getattr(config, "paddle_structure_api_token", None) or os.getenv("PADDLE_STRUCTURE_API_TOKEN")
    structure_api_timeout = getattr(config, "paddle_structure_api_timeout_sec", 120)
    if structure_api_url and structure_api_token and not structure_api_disabled:
        orig_url = getattr(config, "paddle_vl_api_url", None)
        orig_token = getattr(config, "paddle_vl_api_token", None)
        orig_timeout = getattr(config, "paddle_vl_api_timeout_sec", None)
        orig_disable = getattr(config, "paddle_vl_api_disable", None)
        setattr(config, "paddle_vl_api_url", structure_api_url)
        setattr(config, "paddle_vl_api_token", structure_api_token)
        setattr(config, "paddle_vl_api_timeout_sec", structure_api_timeout)
        setattr(config, "paddle_vl_api_disable", False)
        try:
            pages, stats = ocr_pages_with_paddle_vl(
                images,
                languages,
                config,
                helpers,
                progress_cb,
                progress_base,
                progress_span,
            )
        finally:
            setattr(config, "paddle_vl_api_url", orig_url)
            setattr(config, "paddle_vl_api_token", orig_token)
            setattr(config, "paddle_vl_api_timeout_sec", orig_timeout)
            setattr(config, "paddle_vl_api_disable", orig_disable)
        if isinstance(stats, dict):
            stats["layout_model"] = "PP-StructureV3 API"
        return pages, stats
    if bool(getattr(config, "paddle_use_paddlex_layout", True)):
        try:
            return _paddlex_layout_ocr_pages(
                images,
                languages,
                config,
                helpers,
                progress_cb,
                progress_base,
                progress_span,
            )
        except Exception as exc:
            LOGGER.warning("PaddleX layout OCR failed; falling back to PaddleOCR: %s", exc)
    return ocr_pages_with_paddle(
        images,
        languages,
        config,
        helpers,
        progress_cb,
        progress_base,
        progress_span,
    )


def ocr_pages_with_paddle_vl(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    ocr_pages_text_chars = helpers["ocr_pages_text_chars"]

    api_url = getattr(config, "paddle_vl_api_url", None) or os.getenv("PADDLE_VL_API_URL")
    api_token = getattr(config, "paddle_vl_api_token", None) or os.getenv("PADDLE_VL_API_TOKEN")
    api_timeout = getattr(config, "paddle_vl_api_timeout_sec", 120)
    source_path = helpers.get("ocr_source_path")

    api_disabled = bool(getattr(config, "paddle_vl_api_disable", False))
    if api_url and api_token and not api_disabled:
        api_max_pages = int(getattr(config, "paddle_vl_api_max_pages", 100) or 100)
        if api_max_pages <= 0:
            api_max_pages = 100
        api_max_chunk_bytes = int(getattr(config, "paddle_vl_api_max_chunk_bytes", 0) or 0)
        if api_max_chunk_bytes <= 0:
            try:
                env_value = os.getenv("PADDLE_VL_API_MAX_CHUNK_BYTES", "")
                if env_value:
                    api_max_chunk_bytes = int(env_value)
            except Exception:
                api_max_chunk_bytes = 0
        api_images = list(images) if images else []
        source_page_count = None
        source_reader = None
        PdfWriter = None
        if isinstance(source_path, str) and source_path.lower().endswith(".pdf") and os.path.isfile(source_path):
            try:
                from pypdf import PdfReader, PdfWriter  # type: ignore
                source_reader = PdfReader(source_path)
                source_page_count = len(source_reader.pages)
            except Exception:
                source_page_count = None
                source_reader = None
                PdfWriter = None
        original_count = source_page_count if source_page_count else (len(api_images) if api_images else None)
        if api_max_chunk_bytes > 0:
            LOGGER.info(
                "PaddleOCR-VL API payload cap: %d bytes (max pages per chunk: %d).",
                api_max_chunk_bytes,
                api_max_pages,
            )
        elif original_count and original_count > api_max_pages:
            LOGGER.info(
                "PaddleOCR-VL API batch size %d; splitting %d pages into chunks.",
                api_max_pages,
                original_count,
            )
        try:
            import base64
            import io
            import requests
        except Exception as exc:
            raise RuntimeError(f"PaddleOCR-VL API dependencies missing: {exc}") from exc

        headers = {
            "Authorization": f"token {api_token}",
            "Content-Type": "application/json",
        }

        def _normalize_ignore_labels(value: Any) -> Optional[List[str]]:
            if not value:
                return None
            if isinstance(value, str):
                labels = [item.strip() for item in value.split(",") if item.strip()]
            elif isinstance(value, (list, tuple, set)):
                labels = [str(item).strip() for item in value if str(item).strip()]
            else:
                labels = [str(value).strip()] if str(value).strip() else []
            return labels or None

        optional_payload: Dict[str, Any] = {}
        ignore_labels = _normalize_ignore_labels(getattr(config, "paddle_vl_markdown_ignore_labels", None))
        if ignore_labels:
            optional_payload["markdownIgnoreLabels"] = ignore_labels
        if getattr(config, "paddle_use_doc_orientation_classify", None) is not None:
            optional_payload["useDocOrientationClassify"] = bool(config.paddle_use_doc_orientation_classify)
        if getattr(config, "paddle_use_doc_unwarping", None) is not None:
            optional_payload["useDocUnwarping"] = bool(config.paddle_use_doc_unwarping)
        use_layout_detection = getattr(config, "paddle_vl_use_layout_detection", None)
        if use_layout_detection is not None:
            optional_payload["useLayoutDetection"] = bool(use_layout_detection)
        if getattr(config, "paddle_vl_use_chart_recognition", None) is not None:
            optional_payload["useChartRecognition"] = bool(config.paddle_vl_use_chart_recognition)
        if getattr(config, "paddle_vl_prompt_label", None):
            optional_payload["promptLabel"] = str(config.paddle_vl_prompt_label)
        layout_nms = getattr(config, "paddle_vl_layout_nms", None)
        if layout_nms is None:
            layout_nms = getattr(config, "paddle_layout_nms", None)
        if layout_nms is not None:
            optional_payload["layoutNms"] = bool(layout_nms)
        if getattr(config, "paddle_vl_repetition_penalty", None) is not None:
            optional_payload["repetitionPenalty"] = getattr(config, "paddle_vl_repetition_penalty")
        if getattr(config, "paddle_vl_temperature", None) is not None:
            optional_payload["temperature"] = getattr(config, "paddle_vl_temperature")
        if getattr(config, "paddle_vl_top_p", None) is not None:
            optional_payload["topP"] = getattr(config, "paddle_vl_top_p")
        if getattr(config, "paddle_vl_min_pixels", None) is not None:
            optional_payload["minPixels"] = int(getattr(config, "paddle_vl_min_pixels"))
        if getattr(config, "paddle_vl_max_pixels", None) is not None:
            optional_payload["maxPixels"] = int(getattr(config, "paddle_vl_max_pixels"))

        def _strip_markup(text: str) -> str:
            text = re.sub(r"<[^>]+>", " ", text)
            text = re.sub(r"!\\[[^\\]]*]\\([^)]+\\)", " ", text)
            text = re.sub(r"\\s+", " ", text)
            return text.strip()

        def _estimate_payload_bytes(file_bytes: bytes) -> int:
            if not file_bytes:
                return 0
            b64_len = 4 * ((len(file_bytes) + 2) // 3)
            return b64_len + 200

        def _build_pdf_bytes(page_list: Sequence[Any]) -> bytes:
            if PdfWriter is None:
                raise RuntimeError("PDF chunking requires pypdf.")
            writer = PdfWriter()
            for page in page_list:
                writer.add_page(page)
            buffer = io.BytesIO()
            writer.write(buffer)
            buffer.seek(0)
            return buffer.read()

        def _build_payload(file_bytes: bytes, file_type: int) -> Dict[str, Any]:
            payload: Dict[str, Any] = {
                "file": base64.b64encode(file_bytes).decode("ascii"),
                "fileType": file_type,
            }
            payload.update(optional_payload)
            return payload

        def _shorten_text(value: str, limit: int = 240) -> str:
            if len(value) <= limit:
                return value
            return f"{value[:limit]}...<truncated {len(value) - limit} chars>"

        def _keys_preview(value: Dict[str, Any], limit: int = 12) -> List[str]:
            keys = [str(k) for k in value.keys()]
            keys.sort()
            return keys[:limit]

        def _collect_block_labels_summary(value: Any, counts: Dict[str, int], limit: int = 24) -> None:
            if len(counts) >= limit:
                return
            if isinstance(value, dict):
                for key, item in value.items():
                    key_str = str(key)
                    if key_str in {
                        "block_label",
                        "blockLabel",
                        "block_label_name",
                        "blockLabelName",
                        "block_label_type",
                        "blockLabelType",
                    }:
                        if isinstance(item, str):
                            label = item.strip()
                            if label:
                                counts[label] = counts.get(label, 0) + 1
                        continue
                    _collect_block_labels_summary(item, counts, limit)
            elif isinstance(value, list):
                for item in value:
                    _collect_block_labels_summary(item, counts, limit)

        def _summarize_layout_entry(entry: Any) -> Any:
            if not isinstance(entry, dict):
                return {"type": type(entry).__name__}
            summary: Dict[str, Any] = {"keys": _keys_preview(entry)}
            label_counts: Dict[str, int] = {}
            _collect_block_labels_summary(entry, label_counts)
            if label_counts:
                summary["block_label_count"] = sum(label_counts.values())
                top = sorted(label_counts.items(), key=lambda item: (-item[1], item[0]))
                summary["block_label_values"] = [label for label, _ in top[:12]]
            markdown = entry.get("markdown")
            if isinstance(markdown, dict):
                md_text = markdown.get("text") or markdown.get("markdown") or markdown.get("content")
                if isinstance(md_text, str):
                    summary["markdown_len"] = len(md_text)
                    summary["markdown_preview"] = _shorten_text(md_text)
                md_images = markdown.get("images") or markdown.get("markdown_images") or markdown.get("markdownImages")
                if isinstance(md_images, dict):
                    summary["markdown_images_count"] = len(md_images)
                    summary["markdown_images_keys"] = _keys_preview(md_images, limit=6)
            elif isinstance(markdown, str):
                summary["markdown_len"] = len(markdown)
                summary["markdown_preview"] = _shorten_text(markdown)
            output_images = entry.get("outputImages")
            if isinstance(output_images, dict):
                summary["output_images_count"] = len(output_images)
                summary["output_images_keys"] = _keys_preview(output_images, limit=6)
            pruned = entry.get("prunedResult")
            if isinstance(pruned, list):
                summary["pruned_result_count"] = len(pruned)
                preview: List[Dict[str, Any]] = []
                for block in pruned[:5]:
                    if not isinstance(block, dict):
                        preview.append({"type": type(block).__name__})
                        continue
                    preview.append(_summarize_pruned_block(block))
                summary["pruned_result_preview"] = preview
            elif isinstance(pruned, dict):
                summary["pruned_result_count"] = 1
                preview: Dict[str, Any] = {"keys": _keys_preview(pruned, limit=12)}
                parsing_list = pruned.get("parsing_res_list") if isinstance(pruned, dict) else None
                if isinstance(parsing_list, list):
                    preview["parsing_res_count"] = len(parsing_list)
                    parsing_preview: List[Dict[str, Any]] = []
                    for block in parsing_list[:5]:
                        if not isinstance(block, dict):
                            parsing_preview.append({"type": type(block).__name__})
                            continue
                        parsing_preview.append(_summarize_pruned_block(block))
                    preview["parsing_res_preview"] = parsing_preview
                summary["pruned_result_preview"] = preview
            return summary

        def _summarize_pruned_block(block: Dict[str, Any]) -> Dict[str, Any]:
            def _find_string_by_keys(value: Any, keys: Set[str], depth: int = 0, limit: int = 3) -> Optional[str]:
                if depth > limit:
                    return None
                if isinstance(value, dict):
                    for key, item in value.items():
                        if key in keys and isinstance(item, str) and item.strip():
                            return item.strip()
                    for item in value.values():
                        found = _find_string_by_keys(item, keys, depth + 1, limit)
                        if found:
                            return found
                elif isinstance(value, list):
                    for item in value[:5]:
                        found = _find_string_by_keys(item, keys, depth + 1, limit)
                        if found:
                            return found
                return None

            def _find_bbox(value: Any, depth: int = 0, limit: int = 3) -> Optional[List[float]]:
                if depth > limit:
                    return None
                if isinstance(value, (list, tuple)) and len(value) >= 4:
                    try:
                        return [round(float(x), 2) for x in value[:4]]
                    except Exception:
                        return None
                if isinstance(value, dict):
                    if all(k in value for k in ("x0", "y0", "x1", "y1")):
                        try:
                            return [
                                round(float(value["x0"]), 2),
                                round(float(value["y0"]), 2),
                                round(float(value["x1"]), 2),
                                round(float(value["y1"]), 2),
                            ]
                        except Exception:
                            return None
                    if all(k in value for k in ("left", "top", "width", "height")):
                        try:
                            left = float(value["left"])
                            top = float(value["top"])
                            return [
                                round(left, 2),
                                round(top, 2),
                                round(left + float(value["width"]), 2),
                                round(top + float(value["height"]), 2),
                            ]
                        except Exception:
                            return None
                    for item in value.values():
                        found = _find_bbox(item, depth + 1, limit)
                        if found:
                            return found
                if isinstance(value, list):
                    for item in value[:5]:
                        found = _find_bbox(item, depth + 1, limit)
                        if found:
                            return found
                return None

            preview: Dict[str, Any] = {}
            for key in ("block_label", "blockLabel", "label", "type", "block_type", "blockType"):
                val = block.get(key)
                if isinstance(val, str) and val.strip():
                    preview["block_label"] = val.strip()
                    break
            for key in ("id", "block_id", "blockId", "uuid", "uid"):
                val = block.get(key)
                if isinstance(val, (int, str)) and str(val).strip():
                    preview[key] = str(val).strip()
                    break
            for key in ("parent_id", "parentId", "group_id", "groupId", "layout_id", "layoutId"):
                val = block.get(key)
                if isinstance(val, (int, str)) and str(val).strip():
                    preview[key] = str(val).strip()
            for key in ("image_id", "imageId", "img_id", "imgId", "image_index", "img_idx"):
                val = block.get(key)
                if isinstance(val, (int, str)) and str(val).strip():
                    preview[key] = str(val).strip()
                    break
            image_keys = {
                "image",
                "img",
                "image_path",
                "imagePath",
                "img_path",
                "src",
                "url",
                "path",
                "file",
                "file_path",
                "filePath",
            }
            image_ref = _find_string_by_keys(block, image_keys)
            if image_ref:
                preview["image_ref"] = image_ref
            text_keys = {
                "text",
                "content",
                "ocr_text",
                "ocrText",
                "caption",
                "figure_caption",
                "footnote",
                "note",
                "value",
            }
            text_val = _find_string_by_keys(block, text_keys)
            if text_val:
                preview["text_preview"] = _shorten_text(text_val, limit=160)
            bbox_val = _find_bbox(block)
            if bbox_val:
                preview["bbox"] = bbox_val
            preview["keys"] = _keys_preview(block, limit=12)
            return preview

        def _summarize_result(value: Any) -> Any:
            if isinstance(value, dict):
                summary: Dict[str, Any] = {"keys": _keys_preview(value)}
                layout_key = None
                layout_val = None
                for key in (
                    "layoutParsingResults",
                    "layout_parsing_results",
                    "layoutParsingResult",
                    "layout_parsing_result",
                ):
                    if key in value:
                        layout_key = key
                        layout_val = value.get(key)
                        break
                if layout_key is not None:
                    summary["layout_key"] = layout_key
                    if isinstance(layout_val, list):
                        summary["layout_count"] = len(layout_val)
                        if layout_val:
                            summary["layout_preview"] = _summarize_layout_entry(layout_val[0])
                    elif layout_val is not None:
                        summary["layout_count"] = 1
                        summary["layout_preview"] = _summarize_layout_entry(layout_val)
                return summary
            if isinstance(value, list):
                preview: Dict[str, Any] = {"list_len": len(value)}
                if value:
                    preview["first_item_type"] = type(value[0]).__name__
                    if isinstance(value[0], dict):
                        preview["first_item_keys"] = _keys_preview(value[0])
                return preview
            if isinstance(value, str):
                return {"text_preview": _shorten_text(value)}
            return {"type": type(value).__name__}

        def _summarize_api_response(value: Any) -> Dict[str, Any]:
            summary: Dict[str, Any] = {}
            if isinstance(value, dict):
                for key in ("code", "status", "message", "msg", "error", "error_msg", "errorMsg"):
                    if key in value:
                        summary[key] = _shorten_text(str(value.get(key)))
                if "result" in value:
                    summary["result"] = _summarize_result(value.get("result"))
                else:
                    summary["result"] = _summarize_result(value)
                summary["keys"] = _keys_preview(value)
                return summary
            summary["result"] = _summarize_result(value)
            return summary

        def _is_timeout_error(exc: Exception) -> bool:
            try:
                if isinstance(exc, requests.exceptions.Timeout):
                    return True
                if isinstance(exc, requests.exceptions.ConnectionError):
                    message = str(exc).lower()
                    if "timed out" in message or "timeout" in message:
                        return True
            except Exception:
                pass
            if isinstance(exc, TimeoutError):
                return True
            message = str(exc).lower()
            return "timed out" in message or "timeout" in message

        def _is_http_500_error(exc: Exception) -> bool:
            message = str(exc).lower()
            if "status=500" in message:
                return True
            if "errorcode\\":500" in message or "errorcode':500" in message:
                return True
            if "internal server error" in message:
                return True
            return False

        def _request_api(file_bytes: bytes, file_type: int, label: str) -> Dict[str, Any]:
            payload = _build_payload(file_bytes, file_type)
            max_attempts = 3
            delay_sec = 2
            response = None
            for attempt in range(1, max_attempts + 1):
                try:
                    response = requests.post(api_url, json=payload, headers=headers, timeout=api_timeout)
                    break
                except Exception as exc:
                    if _is_timeout_error(exc) and attempt < max_attempts:
                        LOGGER.warning(
                            "PaddleOCR-VL API timeout (%s). Retrying %d/%d in %ds.",
                            label,
                            attempt,
                            max_attempts,
                            delay_sec,
                        )
                        time.sleep(delay_sec)
                        delay_sec *= 2
                        continue
                    raise RuntimeError(f"PaddleOCR-VL API request failed ({label}): {exc}") from exc
            if response is None:
                raise RuntimeError(f"PaddleOCR-VL API request failed ({label}): no response")
            if response.status_code != 200:
                if response.status_code == 429:
                    retry_after = response.headers.get("Retry-After")
                    message = (
                        "PaddleOCR-VL API rate limited (429): daily 3000-page limit reached. "
                        "Wait for the quota reset or request whitelist access."
                    )
                    if retry_after:
                        message = f"{message} Retry-After: {retry_after}"
                    raise RuntimeError(message)
                body = ""
                try:
                    body = response.text.strip()
                except Exception:
                    body = ""
                raise RuntimeError(
                    f"PaddleOCR-VL API request failed ({label}): status={response.status_code} {body}"
                )
            try:
                data = response.json()
            except Exception as exc:
                raise RuntimeError(f"PaddleOCR-VL API response parse failed ({label}): {exc}") from exc
            summary = _summarize_api_response(data)
            try:
                LOGGER.info("PaddleOCR-VL API response (%s): %s", label, json.dumps(summary, ensure_ascii=True))
            except Exception:
                LOGGER.info("PaddleOCR-VL API response (%s): %r", label, summary)
            return data

        def _extract_layout_results(data: Any) -> List[Dict[str, Any]]:
            if isinstance(data, dict):
                def _is_success_message(value: Any) -> bool:
                    if value is None:
                        return False
                    text = str(value).strip().lower()
                    return text in {"success", "ok", "ok."}

                error_code = data.get("errorCode")
                if error_code is None:
                    error_code = data.get("error_code")
                error_msg = data.get("error_msg") or data.get("errorMsg")
                error_field = data.get("error")
                if error_msg is None and isinstance(error_field, dict):
                    error_msg = error_field.get("message") or error_field.get("msg")
                if error_code is not None:
                    try:
                        code_int = int(error_code)
                    except Exception:
                        code_int = None
                    if code_int is not None and code_int != 0:
                        err = error_msg or error_field or error_code
                        raise RuntimeError(f"PaddleOCR-VL API error: {err}")
                    if code_int is None and error_msg and not _is_success_message(error_msg):
                        raise RuntimeError(f"PaddleOCR-VL API error: {error_msg}")
                else:
                    if isinstance(error_field, bool):
                        if error_field and not _is_success_message(error_msg):
                            err = error_msg or error_field
                            raise RuntimeError(f"PaddleOCR-VL API error: {err}")
                    elif error_msg and not _is_success_message(error_msg):
                        raise RuntimeError(f"PaddleOCR-VL API error: {error_msg}")
                result = data.get("result") if "result" in data else data
            else:
                result = data
            if isinstance(result, dict):
                for key in (
                    "layoutParsingResults",
                    "layout_parsing_results",
                    "layoutParsingResult",
                    "layout_parsing_result",
                ):
                    val = result.get(key)
                    if isinstance(val, list):
                        return val
                    if isinstance(val, dict):
                        return [val]
            if isinstance(result, list):
                return [r for r in result if isinstance(r, dict)]
            return []

        def _extract_markdown_text(entry: Dict[str, Any]) -> Optional[str]:
            md_info = entry.get("markdown")
            if isinstance(md_info, dict):
                for key in ("text", "markdown", "content"):
                    val = md_info.get(key)
                    if isinstance(val, str) and val.strip():
                        return val.strip()
            if isinstance(md_info, str) and md_info.strip():
                return md_info.strip()
            for key in ("markdown", "markdown_text", "text", "content"):
                val = entry.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()
            return None

        def _extract_markdown_images(entry: Dict[str, Any]) -> Dict[str, Any]:
            images: Dict[str, Any] = {}
            md_info = entry.get("markdown")
            if isinstance(md_info, dict):
                candidate = md_info.get("images") or md_info.get("markdown_images") or md_info.get("markdownImages")
                if isinstance(candidate, dict):
                    images.update(candidate)
            for key in ("markdown_images", "markdownImages"):
                candidate = entry.get(key)
                if isinstance(candidate, dict):
                    images.update(candidate)
            return images

        def _extract_page_text(entry: Dict[str, Any], md_text: Optional[str]) -> str:
            for key in ("text", "ocrText", "ocr_text", "content"):
                val = entry.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()
            if md_text:
                return _strip_markup(md_text)
            return ""

        def _image_to_bytes(image: Any) -> bytes:
            if isinstance(image, (bytes, bytearray)):
                return bytes(image)
            if isinstance(image, str) and os.path.isfile(image):
                with open(image, "rb") as handle:
                    return handle.read()
            if hasattr(image, "save"):
                img = image
                if hasattr(img, "convert"):
                    try:
                        img = img.convert("RGB")
                    except Exception:
                        img = image
                buffer = io.BytesIO()
                try:
                    img.save(buffer, format="PNG")
                except Exception:
                    buffer = io.BytesIO()
                    img.save(buffer, format="JPEG")
                return buffer.getvalue()
            try:
                import numpy as np
                from PIL import Image as _PILImage
            except Exception:
                raise RuntimeError("Unsupported image type for PaddleOCR-VL API.")
            if isinstance(image, np.ndarray):
                buffer = io.BytesIO()
                _PILImage.fromarray(image).save(buffer, format="PNG")
                return buffer.getvalue()
            raise RuntimeError("Unsupported image type for PaddleOCR-VL API.")

        pages: List[Dict[str, Any]] = []
        markdown_items: List[str] = []
        markdown_images: Dict[str, Any] = {}
        markdown_image_labels: Dict[str, str] = {}
        page_counter = 0
        if progress_cb and progress_span > 0:
            progress_cb(progress_base, "ocr", "Paddle OCR-VL API initializing")

        def _normalize_image_ref(value: Any) -> Optional[str]:
            if isinstance(value, str):
                return value.strip() or None
            if isinstance(value, dict):
                for key in ("image", "img", "src", "url", "path", "file", "file_path", "filePath"):
                    cand = value.get(key)
                    if isinstance(cand, str) and cand.strip():
                        return cand.strip()
            return None

        def _merge_label(existing: Optional[str], incoming: str) -> str:
            if not existing:
                return incoming
            if incoming.lower() in existing.lower():
                return existing
            if existing.lower() in incoming.lower():
                return incoming
            return f"{existing}; {incoming}"

        def _store_image_label(ref: str, label: str) -> None:
            if not ref or not label:
                return
            label = label.strip()
            if not label:
                return
            markdown_image_labels[ref] = _merge_label(markdown_image_labels.get(ref), label)
            filename = os.path.basename(ref)
            if filename:
                markdown_image_labels[filename] = _merge_label(markdown_image_labels.get(filename), label)

        def _extract_block_bbox(block: Dict[str, Any]) -> Optional[List[float]]:
            for key in ("block_bbox", "bbox", "box", "rect", "xyxy"):
                val = block.get(key)
                if isinstance(val, (list, tuple)) and len(val) >= 4:
                    try:
                        return [float(val[0]), float(val[1]), float(val[2]), float(val[3])]
                    except Exception:
                        continue
                if isinstance(val, dict):
                    if all(k in val for k in ("x0", "y0", "x1", "y1")):
                        try:
                            return [float(val["x0"]), float(val["y0"]), float(val["x1"]), float(val["y1"])]
                        except Exception:
                            continue
                    if all(k in val for k in ("left", "top", "width", "height")):
                        try:
                            left = float(val["left"])
                            top = float(val["top"])
                            return [left, top, left + float(val["width"]), top + float(val["height"])]
                        except Exception:
                            continue
            return None

        def _extract_block_text(block: Dict[str, Any]) -> Optional[str]:
            text_keys = {
                "block_content",
                "text",
                "content",
                "ocr_text",
                "ocrText",
                "caption",
                "figure_caption",
                "footnote",
                "note",
                "value",
            }
            fragments: List[str] = []

            def walk(value: Any, depth: int = 0) -> None:
                if depth > 4 or len(fragments) >= 8:
                    return
                if isinstance(value, str):
                    chunk = value.strip()
                    if chunk:
                        fragments.append(chunk)
                    return
                if isinstance(value, dict):
                    for key in text_keys:
                        if key in value:
                            walk(value[key], depth + 1)
                    for item in value.values():
                        walk(item, depth + 1)
                elif isinstance(value, list):
                    for item in value[:8]:
                        walk(item, depth + 1)

            walk(block)
            if not fragments:
                return None
            deduped: List[str] = []
            seen: Set[str] = set()
            for frag in fragments:
                if frag in seen:
                    continue
                seen.add(frag)
                deduped.append(frag)
            return " ".join(deduped).strip() or None

        def _parse_bbox_from_image_key(key: str) -> Optional[List[float]]:
            match = re.search(r"_(\\d+(?:\\.\\d+)?)_(\\d+(?:\\.\\d+)?)_(\\d+(?:\\.\\d+)?)_(\\d+(?:\\.\\d+)?)\\.(?:png|jpg|jpeg|webp)$", key, re.IGNORECASE)
            if not match:
                return None
            try:
                return [float(match.group(1)), float(match.group(2)), float(match.group(3)), float(match.group(4))]
            except Exception:
                return None

        def _bbox_overlap_x(a: List[float], b: List[float]) -> float:
            overlap = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
            width = max(1.0, min(a[2] - a[0], b[2] - b[0]))
            return overlap / width if width > 0 else 0.0

        def _attach_vision_footnotes(entry: Dict[str, Any], md_images: Dict[str, Any]) -> None:
            if not md_images:
                return
            pruned = entry.get("prunedResult")
            parsing_list = None
            if isinstance(pruned, dict):
                parsing_list = pruned.get("parsing_res_list")
            elif isinstance(pruned, list):
                parsing_list = pruned
            if not isinstance(parsing_list, list):
                return
            image_blocks: List[Dict[str, Any]] = []
            footnote_blocks: List[Dict[str, Any]] = []
            for block in parsing_list:
                if not isinstance(block, dict):
                    continue
                label = (
                    block.get("block_label")
                    or block.get("blockLabel")
                    or block.get("label")
                    or block.get("type")
                    or ""
                )
                label = str(label).strip().lower()
                bbox = _extract_block_bbox(block)
                if label == "image" and bbox:
                    image_blocks.append({"bbox": bbox})
                elif label == "vision_footnote" and bbox:
                    text = _extract_block_text(block)
                    if text:
                        footnote_blocks.append({"bbox": bbox, "text": text})
            if not image_blocks or not footnote_blocks:
                return
            image_keys = [key for key in md_images.keys() if isinstance(key, str)]
            image_key_bboxes: List[Tuple[str, List[float]]] = []
            for key in image_keys:
                bbox = _parse_bbox_from_image_key(key)
                if bbox:
                    image_key_bboxes.append((key, bbox))
            image_block_to_key: Dict[int, str] = {}
            if image_key_bboxes:
                for idx, block in enumerate(image_blocks):
                    best_key = None
                    best_score = None
                    for key, bbox in image_key_bboxes:
                        score = sum(abs(a - b) for a, b in zip(block["bbox"], bbox))
                        if best_score is None or score < best_score:
                            best_score = score
                            best_key = key
                    if best_key:
                        image_block_to_key[idx] = best_key
            if not image_block_to_key and len(image_blocks) == 1 and len(image_keys) == 1:
                image_block_to_key[0] = image_keys[0]

            for footnote in footnote_blocks:
                best_idx = None
                best_gap = None
                for idx, image_block in enumerate(image_blocks):
                    img_bbox = image_block["bbox"]
                    foot_bbox = footnote["bbox"]
                    overlap_ratio = _bbox_overlap_x(img_bbox, foot_bbox)
                    if overlap_ratio < 0.2:
                        continue
                    vertical_gap = foot_bbox[1] - img_bbox[3]
                    if vertical_gap < -10:
                        continue
                    gap_score = max(0.0, vertical_gap)
                    if best_gap is None or gap_score < best_gap:
                        best_gap = gap_score
                        best_idx = idx
                if best_idx is None:
                    continue
                key = image_block_to_key.get(best_idx)
                if key:
                    _store_image_label(key, footnote["text"])

        def _collect_block_labels(value: Any) -> None:
            if isinstance(value, dict):
                label = (
                    value.get("block_label")
                    or value.get("blockLabel")
                    or value.get("label")
                    or value.get("blockLabelName")
                )
                image_ref = _normalize_image_ref(
                    value.get("image")
                    or value.get("img")
                    or value.get("image_path")
                    or value.get("imagePath")
                    or value.get("img_path")
                    or value.get("src")
                )
                if isinstance(label, str) and image_ref:
                    _store_image_label(image_ref, label)
                for item in value.values():
                    _collect_block_labels(item)
            elif isinstance(value, list):
                for item in value:
                    _collect_block_labels(item)

        def _append_page(entry: Dict[str, Any]) -> None:
            nonlocal page_counter
            md_text = _extract_markdown_text(entry)
            if md_text:
                markdown_items.append(md_text)
            md_images = _extract_markdown_images(entry)
            if md_images:
                markdown_images.update(md_images)
                _attach_vision_footnotes(entry, md_images)
            _collect_block_labels(entry)
            page_counter += 1
            text = _extract_page_text(entry, md_text)
            page_entry = {"page_num": page_counter, "text": (text or "").strip()}
            if isinstance(md_text, str) and md_text.strip():
                page_entry["markdown"] = md_text.strip()
            pages.append(page_entry)

        def _run_api_for_images(
            image_list: Optional[List[Any]] = None,
            overall_total: Optional[int] = None,
            page_offset: int = 0,
        ) -> None:
            images_to_process = image_list if image_list is not None else api_images
            total = max(1, len(images_to_process))
            for idx, image in enumerate(images_to_process, start=1):
                if progress_cb and progress_span > 0:
                    if overall_total:
                        current_idx = page_offset + idx
                        percent = progress_base + int(max(0, current_idx - 1) / overall_total * progress_span)
                        progress_cb(percent, "ocr", f"Paddle OCR-VL API page {current_idx}/{overall_total}")
                    else:
                        percent = progress_base + int((idx - 1) / total * progress_span)
                        progress_cb(percent, "ocr", f"Paddle OCR-VL API page {idx}/{total}")
                file_bytes = _image_to_bytes(image)
                data = _request_api(file_bytes, 1, f"page {idx}/{total}")
                layout_results = _extract_layout_results(data)
                if not layout_results:
                    _append_page({})
                else:
                    for entry in layout_results:
                        _append_page(entry)
                if progress_cb and progress_span > 0:
                    if overall_total:
                        current_idx = page_offset + idx
                        percent = progress_base + int(current_idx / overall_total * progress_span)
                        progress_cb(percent, "ocr", f"Paddle OCR-VL API page {current_idx}/{overall_total}")
                    else:
                        percent = progress_base + int(idx / total * progress_span)
                        progress_cb(percent, "ocr", f"Paddle OCR-VL API page {idx}/{total}")

        if isinstance(source_path, str) and os.path.isfile(source_path):
            file_type = 0 if source_path.lower().endswith(".pdf") else 1
            chunked = False
            needs_chunking = file_type == 0 and (
                api_max_chunk_bytes > 0
                or (source_page_count and source_page_count > api_max_pages)
            )
            if needs_chunking and source_reader is not None:
                total_pages = source_page_count or len(source_reader.pages)
                start = 0
                processed_any = False

                def _process_pdf_chunk(page_start: int, page_list: Sequence[Any]) -> None:
                    if not page_list:
                        return
                    chunk_len = len(page_list)
                    label = f"{os.path.basename(source_path)} p{page_start + 1}-{page_start + chunk_len}"
                    try:
                        file_bytes = _build_pdf_bytes(page_list)
                    except Exception as exc:
                        LOGGER.warning("Failed to build PDF chunk: %s", exc)
                        if api_images:
                            image_slice = api_images[page_start : page_start + chunk_len]
                            _run_api_for_images(image_slice, total_pages, page_start)
                        return
                    try:
                        data = _request_api(file_bytes, file_type, label)
                    except Exception as exc:
                        if _is_http_500_error(exc) and chunk_len > 1:
                            mid = chunk_len // 2
                            LOGGER.warning(
                                "PaddleOCR-VL API 500 for pages %d-%d; splitting and retrying.",
                                page_start + 1,
                                page_start + chunk_len,
                            )
                            _process_pdf_chunk(page_start, page_list[:mid])
                            _process_pdf_chunk(page_start + mid, page_list[mid:])
                            return
                        if _is_http_500_error(exc) and api_images:
                            LOGGER.warning(
                                "PaddleOCR-VL API 500 for pages %d-%d; retrying per-page images.",
                                page_start + 1,
                                page_start + chunk_len,
                            )
                            image_slice = api_images[page_start : page_start + chunk_len]
                            _run_api_for_images(image_slice, total_pages, page_start)
                            return
                        raise
                    layout_results = _extract_layout_results(data)
                    if not layout_results and api_images:
                        LOGGER.warning(
                            "PaddleOCR-VL API returned no layout results for pages %d-%d; retrying per-page images.",
                            page_start + 1,
                            page_start + chunk_len,
                        )
                        image_slice = api_images[page_start : page_start + chunk_len]
                        _run_api_for_images(image_slice, total_pages, page_start)
                    else:
                        for entry in layout_results:
                            _append_page(entry)
                            if progress_cb and progress_span > 0:
                                percent = progress_base + int(page_counter / total_pages * progress_span)
                                progress_cb(percent, "ocr", f"Paddle OCR-VL API page {page_counter}/{total_pages}")
                        if not layout_results:
                            for _ in range(max(1, chunk_len)):
                                _append_page({})

                while start < total_pages:
                    chunk_pages: List[Any] = []
                    chunk_bytes = b""
                    page_idx = start
                    while page_idx < total_pages and len(chunk_pages) < api_max_pages:
                        chunk_pages.append(source_reader.pages[page_idx])
                        page_idx += 1
                        if api_max_chunk_bytes > 0:
                            try:
                                chunk_bytes = _build_pdf_bytes(chunk_pages)
                            except Exception as exc:
                                LOGGER.warning("Failed to build PDF chunk: %s", exc)
                                chunk_pages.pop()
                                break
                            if _estimate_payload_bytes(chunk_bytes) > api_max_chunk_bytes:
                                if len(chunk_pages) == 1:
                                    LOGGER.warning(
                                        "Single-page PDF chunk exceeds payload cap (%d bytes).",
                                        api_max_chunk_bytes,
                                    )
                                else:
                                    chunk_pages.pop()
                                    try:
                                        chunk_bytes = _build_pdf_bytes(chunk_pages)
                                    except Exception as exc:
                                        LOGGER.warning("Failed to build PDF chunk: %s", exc)
                                        chunk_pages = []
                                break
                    if not chunk_pages:
                        break
                    if api_max_chunk_bytes <= 0:
                        try:
                            chunk_bytes = _build_pdf_bytes(chunk_pages)
                        except Exception as exc:
                            LOGGER.warning("Failed to build PDF chunk: %s", exc)
                            break
                    chunk_len = len(chunk_pages)
                    _process_pdf_chunk(start, chunk_pages)
                    processed_any = True
                    start += chunk_len
                if start < total_pages and api_images:
                    LOGGER.warning(
                        "PaddleOCR-VL API chunking incomplete; retrying remaining pages per-image.",
                    )
                    image_slice = api_images[start:total_pages]
                    _run_api_for_images(image_slice, total_pages, start)
                    processed_any = True
                    start = total_pages
                chunked = processed_any and start >= total_pages
            if not chunked:
                if needs_chunking and file_type == 0 and api_images:
                    LOGGER.warning(
                        "PaddleOCR-VL API chunking unavailable; using per-page images instead.",
                    )
                    _run_api_for_images(api_images, source_page_count or len(api_images))
                else:
                    with open(source_path, "rb") as handle:
                        file_bytes = handle.read()
                    data = _request_api(file_bytes, file_type, os.path.basename(source_path))
                    layout_results = _extract_layout_results(data)
                    if not layout_results and file_type == 0 and api_images:
                        LOGGER.warning("PaddleOCR-VL API returned no layout results for PDF; retrying per-page images.")
                        _run_api_for_images(api_images, source_page_count)
                    else:
                        total_pages = len(layout_results) or max(1, len(api_images))
                        for entry in layout_results:
                            _append_page(entry)
                            if progress_cb and progress_span > 0:
                                percent = progress_base + int(page_counter / total_pages * progress_span)
                                progress_cb(percent, "ocr", f"Paddle OCR-VL API page {page_counter}/{total_pages}")
                        if not layout_results:
                            for _ in range(max(1, len(api_images))):
                                _append_page({})
        else:
            _run_api_for_images()

        layout_markdown = "\\n\\n".join(markdown_items) if markdown_items else None
        if isinstance(layout_markdown, str) and layout_markdown.strip():
            layout_markdown = _normalize_inline_math_for_obsidian(
                layout_markdown,
                add_footnote_defs=True,
            )
        for page in pages:
            md_value = page.get("markdown")
            if isinstance(md_value, str) and md_value.strip():
                page["markdown"] = _normalize_inline_math_for_obsidian(md_value)
        text_chars = ocr_pages_text_chars(pages)
        if text_chars == 0 and isinstance(layout_markdown, str) and layout_markdown.strip():
            fallback_text = _strip_markup(layout_markdown)
            if fallback_text:
                if pages:
                    pages[0]["text"] = fallback_text
                else:
                    pages = [{"page_num": 1, "text": fallback_text}]
                text_chars = ocr_pages_text_chars(pages)
        LOGGER.info(
            "PaddleOCR-VL API OCR complete: pages=%d, text_chars=%d",
            len(pages),
            text_chars,
        )
        stats: Dict[str, Any] = {
            "layout_used": True,
            "layout_model": "PaddleOCR-VL API",
        }
        if isinstance(layout_markdown, str) and layout_markdown.strip():
            stats["layout_markdown"] = layout_markdown
        if markdown_images:
            stats["layout_markdown_images"] = markdown_images
        if markdown_image_labels:
            stats["layout_markdown_image_labels"] = markdown_image_labels
        return pages, stats

    try:
        import numpy as np
        from paddleocr import PaddleOCRVL
    except Exception as exc:
        raise RuntimeError(f"PaddleOCR-VL dependencies missing (install paddleocr[doc-parser]): {exc}") from exc

    pipeline_kwargs: Dict[str, Any] = {}
    if getattr(config, "paddle_use_doc_orientation_classify", None) is not None:
        pipeline_kwargs["use_doc_orientation_classify"] = bool(config.paddle_use_doc_orientation_classify)
    if getattr(config, "paddle_use_doc_unwarping", None) is not None:
        pipeline_kwargs["use_doc_unwarping"] = bool(config.paddle_use_doc_unwarping)
    use_layout_detection = getattr(config, "paddle_vl_use_layout_detection", None)
    if use_layout_detection is not None:
        pipeline_kwargs["use_layout_detection"] = bool(use_layout_detection)
    if getattr(config, "paddle_vl_use_chart_recognition", None) is not None:
        pipeline_kwargs["use_chart_recognition"] = bool(config.paddle_vl_use_chart_recognition)
    if getattr(config, "paddle_vl_format_block_content", None) is not None:
        pipeline_kwargs["format_block_content"] = bool(config.paddle_vl_format_block_content)
    if getattr(config, "paddle_vl_device", None):
        pipeline_kwargs["device"] = str(config.paddle_vl_device)
    if getattr(config, "paddle_vl_rec_backend", None):
        pipeline_kwargs["vl_rec_backend"] = str(config.paddle_vl_rec_backend)
    if getattr(config, "paddle_vl_rec_server_url", None):
        pipeline_kwargs["vl_rec_server_url"] = str(config.paddle_vl_rec_server_url)
    if getattr(config, "paddle_vl_rec_max_concurrency", None) is not None:
        pipeline_kwargs["vl_rec_max_concurrency"] = int(config.paddle_vl_rec_max_concurrency)
    if getattr(config, "paddle_vl_rec_api_key", None):
        pipeline_kwargs["vl_rec_api_key"] = str(config.paddle_vl_rec_api_key)

    predict_kwargs: Dict[str, Any] = {}
    if getattr(config, "paddle_use_doc_orientation_classify", None) is not None:
        predict_kwargs["use_doc_orientation_classify"] = bool(config.paddle_use_doc_orientation_classify)
    if getattr(config, "paddle_use_doc_unwarping", None) is not None:
        predict_kwargs["use_doc_unwarping"] = bool(config.paddle_use_doc_unwarping)
    if use_layout_detection is not None:
        predict_kwargs["use_layout_detection"] = bool(use_layout_detection)
    if getattr(config, "paddle_vl_use_chart_recognition", None) is not None:
        predict_kwargs["use_chart_recognition"] = bool(config.paddle_vl_use_chart_recognition)
    if getattr(config, "paddle_vl_format_block_content", None) is not None:
        predict_kwargs["format_block_content"] = bool(config.paddle_vl_format_block_content)
    layout_threshold = getattr(config, "paddle_vl_layout_threshold", None)
    if layout_threshold is None:
        layout_threshold = getattr(config, "paddle_layout_threshold", None)
    if layout_threshold is not None:
        predict_kwargs["layout_threshold"] = layout_threshold
    layout_nms = getattr(config, "paddle_vl_layout_nms", None)
    if layout_nms is None:
        layout_nms = getattr(config, "paddle_layout_nms", None)
    if layout_nms is not None:
        predict_kwargs["layout_nms"] = bool(layout_nms)
    layout_unclip = getattr(config, "paddle_vl_layout_unclip", None)
    if layout_unclip is None:
        layout_unclip = getattr(config, "paddle_layout_unclip", None)
    if layout_unclip is not None:
        predict_kwargs["layout_unclip_ratio"] = layout_unclip
    layout_merge = getattr(config, "paddle_vl_layout_merge", None)
    if layout_merge is None:
        layout_merge = getattr(config, "paddle_layout_merge", None)
    if layout_merge:
        predict_kwargs["layout_merge_bboxes_mode"] = layout_merge
    if getattr(config, "paddle_vl_prompt_label", None) and use_layout_detection is False:
        predict_kwargs["prompt_label"] = str(config.paddle_vl_prompt_label)
    if getattr(config, "paddle_vl_use_queues", None) is not None:
        predict_kwargs["use_queues"] = bool(config.paddle_vl_use_queues)

    pipeline = PaddleOCRVL(**pipeline_kwargs)

    def _as_dict(obj: Any) -> Optional[Dict[str, Any]]:
        if isinstance(obj, dict):
            return obj
        to_dict = getattr(obj, "to_dict", None)
        if callable(to_dict):
            try:
                converted = to_dict()
                if isinstance(converted, dict):
                    return converted
            except Exception:
                return None
        return None

    def _result_to_dict(res: Any) -> Optional[Dict[str, Any]]:
        direct = _as_dict(res)
        if direct is not None:
            return direct
        for attr in ("json", "res", "result"):
            val = getattr(res, attr, None)
            val_dict = _as_dict(val)
            if val_dict is not None:
                return val_dict
        return None

    def _extract_markdown_text(md_info: Any, md_dict: Optional[Dict[str, Any]]) -> Optional[str]:
        if isinstance(md_dict, dict):
            for key in ("markdown", "markdown_text", "text", "content"):
                val = md_dict.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()
        if isinstance(md_info, str) and md_info.strip():
            return md_info.strip()
        if md_info is not None:
            for attr in ("markdown", "markdown_text", "text", "content"):
                val = getattr(md_info, attr, None)
                if isinstance(val, str) and val.strip():
                    return val.strip()
        return None

    def _extract_markdown(
        res: Any,
        res_dict: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Optional[str], Optional[Any], Optional[Dict[str, Any]]]:
        md_info = getattr(res, "markdown", None)
        if md_info is None and isinstance(res_dict, dict):
            md_info = res_dict.get("markdown") or res_dict.get("layout_markdown")
        md_dict = _as_dict(md_info)
        md_text = _extract_markdown_text(md_info, md_dict)
        if not md_text and isinstance(res_dict, dict):
            for key in ("markdown", "layout_markdown", "markdown_text", "text"):
                val = res_dict.get(key)
                if isinstance(val, str) and val.strip():
                    md_text = val.strip()
                    break
        return md_text, md_info, md_dict

    def _extract_markdown_images(
        md_info: Any,
        md_dict: Optional[Dict[str, Any]],
        res_dict: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        images: Dict[str, Any] = {}
        for source in (md_dict, res_dict):
            if not isinstance(source, dict):
                continue
            candidate = source.get("markdown_images") or source.get("images")
            if isinstance(candidate, dict):
                images.update(candidate)
        if md_info is not None:
            for attr in ("markdown_images", "images"):
                candidate = getattr(md_info, attr, None)
                if isinstance(candidate, dict):
                    images.update(candidate)
        return images

    def _extract_block_text(res: Any, res_dict: Optional[Dict[str, Any]] = None) -> str:
        candidates: List[Any] = []
        if isinstance(res_dict, dict):
            candidates.append(res_dict)
            if "res" in res_dict:
                candidates.append(res_dict.get("res"))
        inner_res = getattr(res, "res", None)
        if inner_res is not None:
            candidates.append(inner_res)
        candidates.append(res)
        for candidate in candidates:
            if candidate is None:
                continue
            if isinstance(candidate, dict):
                blocks = candidate.get("parsing_res_list") or candidate.get("layout_parsing_res")
            else:
                blocks = getattr(candidate, "parsing_res_list", None) or getattr(candidate, "layout_parsing_res", None)
            if not isinstance(blocks, list) or not blocks:
                continue
            lines: List[str] = []
            for block in blocks:
                if isinstance(block, dict):
                    text_val = block.get("block_content") or block.get("content") or block.get("text")
                else:
                    text_val = getattr(block, "block_content", None)
                    if text_val is None:
                        text_val = getattr(block, "content", None)
                    if text_val is None:
                        text_val = getattr(block, "text", None)
                if isinstance(text_val, str) and text_val.strip():
                    lines.append(text_val.strip())
            if lines:
                return "\\n".join(lines).strip()
        return ""

    def _strip_markup(text: str) -> str:
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"!\\[[^\\]]*]\\([^)]+\\)", " ", text)
        text = re.sub(r"\\s+", " ", text)
        return text.strip()

    pages: List[Dict[str, Any]] = []
    markdown_items: List[Any] = []
    markdown_images: Dict[str, Any] = {}
    total = max(1, len(images))
    if progress_cb and progress_span > 0:
        progress_cb(progress_base, "ocr", "Paddle OCR-VL initializing")

    for idx, image in enumerate(images, start=1):
        if progress_cb and progress_span > 0:
            percent = progress_base + int((idx - 1) / total * progress_span)
            progress_cb(percent, "ocr", f"Paddle OCR-VL page {idx}/{total}")
        try:
            img = image.convert("RGB") if hasattr(image, "convert") else image
        except Exception:
            img = image
        img_arr = np.array(img)
        results = pipeline.predict(img_arr, **predict_kwargs)
        if not results:
            pages.append({"page_num": idx, "text": ""})
            continue
        res = results[0]
        res_dict = _result_to_dict(res)
        md_text, md_info, md_dict = _extract_markdown(res, res_dict)
        md_images = _extract_markdown_images(md_info, md_dict, res_dict)
        if md_info is not None:
            if isinstance(md_info, str) and md_info.strip():
                markdown_items.append({"markdown": md_info.strip()})
            else:
                markdown_items.append(md_dict if md_dict is not None else md_info)
        elif md_text:
            markdown_items.append({"markdown": md_text})
        if md_images:
            markdown_images.update(md_images)
        text = _extract_block_text(res, res_dict)
        if not text and md_text:
            text = _strip_markup(md_text)
        pages.append({"page_num": idx, "text": (text or "").strip()})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"Paddle OCR-VL page {idx}/{total}")

    layout_markdown = None
    if markdown_items:
        concat = getattr(pipeline, "concatenate_markdown_pages", None)
        if callable(concat):
            try:
                layout_markdown = concat(markdown_items)
            except Exception:
                layout_markdown = None
        if layout_markdown is None:
            page_texts: List[str] = []
            for md in markdown_items:
                text_val = _extract_markdown_text(md, _as_dict(md))
                if isinstance(text_val, str) and text_val.strip():
                    page_texts.append(text_val.strip())
            if page_texts:
                layout_markdown = "\\n\\n".join(page_texts)

    text_chars = ocr_pages_text_chars(pages)
    if text_chars == 0 and isinstance(layout_markdown, str) and layout_markdown.strip():
        fallback_text = _strip_markup(layout_markdown)
        if fallback_text:
            if pages:
                pages[0]["text"] = fallback_text
            else:
                pages = [{"page_num": 1, "text": fallback_text}]
            text_chars = ocr_pages_text_chars(pages)
    LOGGER.info(
        "PaddleOCR-VL OCR complete: pages=%d, text_chars=%d",
        len(pages),
        text_chars,
    )
    stats: Dict[str, Any] = {
        "layout_used": True,
        "layout_model": "PaddleOCR-VL",
    }
    if isinstance(layout_markdown, str) and layout_markdown.strip():
        stats["layout_markdown"] = layout_markdown
    if markdown_images:
        stats["layout_markdown_images"] = markdown_images
    return pages, stats


def ocr_pages_with_paddle(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    ocr_pages_text_chars = helpers["ocr_pages_text_chars"]
    detect_repeated_line_clusters = helpers["detect_repeated_line_clusters"]
    normalize_boilerplate_line = helpers["normalize_boilerplate_line"]
    matches_repeated_cluster = helpers["matches_repeated_cluster"]
    is_boilerplate_line = helpers["is_boilerplate_line"]
    edge_ids_by_y = helpers["edge_ids_by_y"]
    select_edge_texts_by_y = helpers["select_edge_texts_by_y"]
    order_blocks_into_columns = helpers["order_blocks_into_columns"]

    from paddleocr import PaddleOCR

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PaddleOCR: {exc}") from exc

    # PaddleOCR orientation classification uses use_textline_orientation
    ocr_kwargs: Dict[str, Any] = {"lang": languages}
    if config.paddle_target_max_side_px > 0:
        ocr_kwargs["text_det_limit_side_len"] = config.paddle_target_max_side_px
        ocr_kwargs["text_det_limit_type"] = "max"
    if config.paddle_use_doc_orientation_classify:
        ocr_kwargs["use_doc_orientation_classify"] = True
    if config.paddle_use_doc_unwarping:
        ocr_kwargs["use_doc_unwarping"] = True

    # Robust PaddleOCR construction to handle API differences across versions
    def _create_ocr_direct(kwargs: Dict[str, Any]) -> PaddleOCR:
        return PaddleOCR(**kwargs)

    def _try_create_direct(kwargs: Dict[str, Any]) -> Optional[PaddleOCR]:
        try:
            return _create_ocr_direct(kwargs)
        except TypeError:
            return None
        except Exception:
            return None

    reduced_kwargs = dict(ocr_kwargs)
    reduced_kwargs.pop("use_doc_orientation_classify", None)
    reduced_kwargs.pop("use_doc_unwarping", None)

    ctor_candidates: List[Dict[str, Any]] = []
    use_tlo = bool(getattr(config, "paddle_use_textline_orientation", False))
    # Prefer explicit textline orientation when supported
    ctor_candidates.append({**ocr_kwargs, "use_textline_orientation": use_tlo})
    ctor_candidates.append({**reduced_kwargs, "use_textline_orientation": use_tlo})
    # Without textline flag
    ctor_candidates.append({**ocr_kwargs})
    ctor_candidates.append({**reduced_kwargs})
    # Legacy angle classifier flag
    ctor_candidates.append({**ocr_kwargs, "use_angle_cls": use_tlo})
    ctor_candidates.append({**reduced_kwargs, "use_angle_cls": use_tlo})

    ocr: Optional[PaddleOCR] = None
    for kw in ctor_candidates:
        ocr = _try_create_direct(kw)
        if ocr is not None:
            break
    if ocr is None:
        # Final hard attempt to surface a meaningful error
        ocr = _create_ocr_direct(ocr_kwargs)
    pages: List[Dict[str, Any]] = []
    confidences: List[float] = []

    def _bbox_from_quad(quad: Sequence[Sequence[float]]) -> Tuple[float, float, float, float, float]:
        xs = [p[0] for p in quad]
        ys = [p[1] for p in quad]
        x0, y0, x1, y1 = float(min(xs)), float(min(ys)), float(max(xs)), float(max(ys))
        xc = 0.5 * (x0 + x1)
        return x0, y0, x1, y1, xc

    def _image_to_array(img: Any) -> Any:
        if hasattr(img, "convert"):
            try:
                img = img.convert("RGB")
            except Exception:
                pass
        return np.array(img)

    def _paddle_obj_to_dict(obj: Any) -> Optional[Dict[str, Any]]:
        if obj is None:
            return None
        if isinstance(obj, dict):
            return obj
        to_dict = getattr(obj, "to_dict", None)
        if callable(to_dict):
            try:
                converted = to_dict()
                if isinstance(converted, dict):
                    return converted
            except Exception:
                return None
        rec_texts = getattr(obj, "rec_texts", None)
        dt_polys = getattr(obj, "dt_polys", None)
        if rec_texts is not None or dt_polys is not None:
            return {"rec_texts": rec_texts, "dt_polys": dt_polys, "rec_scores": getattr(obj, "rec_scores", None)}
        return None

    def _extract_from_paddle_dict(result: Dict[str, Any]) -> List[Tuple[Any, str, Optional[float]]]:
        texts = result.get("rec_texts") or result.get("texts") or result.get("rec_text")
        if not isinstance(texts, list):
            return []
        boxes = (
            result.get("dt_polys")
            or result.get("det_polys")
            or result.get("dt_boxes")
            or result.get("boxes")
        )
        scores = result.get("rec_scores") or result.get("scores") or result.get("rec_score")
        entries: List[Tuple[Any, str, Optional[float]]] = []
        for idx, text_val in enumerate(texts):
            text_str = str(text_val or "").strip()
            if not text_str:
                continue
            quad = None
            if isinstance(boxes, list) and idx < len(boxes):
                quad = boxes[idx]
            conf_val = None
            if isinstance(scores, list) and idx < len(scores):
                try:
                    conf_val = float(scores[idx])
                except Exception:
                    conf_val = None
            entries.append((quad, text_str, conf_val))
        return entries

    def _iter_paddle_entries(result: Any) -> List[Tuple[Any, str, Optional[float]]]:
        if isinstance(result, dict):
            return _extract_from_paddle_dict(result)
        if isinstance(result, list):
            entries = result
            if len(result) == 1:
                maybe_dict = _paddle_obj_to_dict(result[0])
                if maybe_dict is not None:
                    return _extract_from_paddle_dict(maybe_dict)
                if isinstance(result[0], (list, tuple, dict)):
                    entries = result[0]
            if isinstance(entries, dict):
                return _extract_from_paddle_dict(entries)
            if isinstance(entries, list) and entries and isinstance(entries[0], dict):
                combined: List[Tuple[Any, str, Optional[float]]] = []
                for entry in entries:
                    if isinstance(entry, dict):
                        combined.extend(_extract_from_paddle_dict(entry))
                    else:
                        maybe_dict = _paddle_obj_to_dict(entry)
                        if maybe_dict is not None:
                            combined.extend(_extract_from_paddle_dict(maybe_dict))
                return combined
            extracted: List[Tuple[Any, str, Optional[float]]] = []
            for entry in entries:
                if not entry or not isinstance(entry, (list, tuple)):
                    continue
                quad = entry[0] if len(entry) > 0 else None
                text_part = entry[1] if len(entry) > 1 else None
                if text_part is None:
                    continue
                text_str = ""
                conf_val = None
                if isinstance(text_part, (list, tuple)) and text_part:
                    text_str = str(text_part[0] or "").strip()
                    if len(text_part) > 1 and isinstance(text_part[1], (float, int)):
                        conf_val = float(text_part[1])
                else:
                    text_str = str(text_part or "").strip()
                if text_str:
                    extracted.append((quad, text_str, conf_val))
            return extracted
        return []

    total = max(1, len(images))
    # Emit an immediate progress update so the UI replaces the initial 'initializing' label
    if progress_cb and progress_span > 0:
        progress_cb(progress_base, "ocr", f"Paddle OCR page 1/{total} (running)")
    total_pages = len(images)
    boilerplate_enabled = bool(
        config.enable_boilerplate_removal and helpers.get("boilerplate_prepass_enabled", True)
    )
    repeat_threshold = 0
    repeated_clusters: List[Any] = []
    page_edge_candidates: List[List[str]] = []
    source_path = helpers.get("ocr_source_path")
    doc_label = os.path.basename(source_path) if isinstance(source_path, str) and source_path else ""
    doc_suffix = f" ({doc_label})" if doc_label else ""

    for idx, image in enumerate(images, start=1):
        if boilerplate_enabled:
            LOGGER.info("Paddle OCR prepass %d/%d%s: start", idx, total_pages, doc_suffix)
        t_start = time.perf_counter()
        edge_lines: List[Tuple[str, float]] = []
        result = None
        image_arr = _image_to_array(image)
        # Try inference with multiple APIs for compatibility
        def _run_ocr_inference(img_arr: Any) -> Any:
            res = None
            # Try modern API first
            if hasattr(ocr, "predict"):
                try:
                    res = ocr.predict(img_arr)  # type: ignore[attr-defined]
                except TypeError:
                    res = None
                except Exception:
                    res = None
            # Legacy API without cls
            if res is None and hasattr(ocr, "ocr"):
                try:
                    res = ocr.ocr(img_arr)  # type: ignore[attr-defined]
                except TypeError:
                    res = None
                except Exception:
                    res = None
            # Legacy API with cls flag
            if res is None and hasattr(ocr, "ocr"):
                try:
                    res = ocr.ocr(img_arr, cls=use_tlo)  # type: ignore[attr-defined]
                except Exception:
                    res = None
            return res

        try:
            result = _run_ocr_inference(image_arr)
        except Exception as exc:
            LOGGER.debug("PaddleOCR inference failed: %s", exc)
            result = None

        if result is not None:
            for quad, text_val, _ in _iter_paddle_entries(result):
                if not text_val:
                    continue
                if quad is None:
                    continue
                try:
                    _, y0_val, _, _, _ = _bbox_from_quad(quad)
                except Exception:
                    y0_val = 0.0
                edge_lines.append((text_val, y0_val))
        if boilerplate_enabled and edge_lines:
            page_edge_candidates.append(
                select_edge_texts_by_y(edge_lines, config.boilerplate_edge_lines)
            )
        if boilerplate_enabled:
            elapsed = time.perf_counter() - t_start
            LOGGER.info(
                "Paddle OCR prepass %d/%d%s: done in %.2fs (edge_lines=%d)",
                idx,
                total_pages,
                doc_suffix,
                elapsed,
                len(edge_lines),
            )

    if boilerplate_enabled and total_pages >= config.boilerplate_min_pages:
        repeated_clusters, repeat_threshold = detect_repeated_line_clusters(
            page_edge_candidates,
            total_pages,
            config,
        )
    removed_total = 0

    for idx, image in enumerate(images, start=1):
        if progress_cb and progress_span > 0:
            percent = progress_base + int((idx - 1) / total * progress_span)
            progress_cb(percent, "ocr", f"Paddle OCR page {idx}/{total} (running)")
        LOGGER.info("Paddle OCR page %d/%d: start", idx, total)
        t_start = time.perf_counter()
        # Prefer new API: predict(); fall back to ocr() with/without cls
        image_arr = _image_to_array(image)
        # Prefer new API, but fall back as needed
        try:
            result = _run_ocr_inference(image_arr)
        except Exception:
            result = None
        blocks: List[Dict[str, Any]] = []
        fallback_lines: List[str] = []
        if result:
            for quad, text_val, conf_val in _iter_paddle_entries(result):
                if conf_val is not None:
                    confidences.append(conf_val)
                if not text_val:
                    continue
                if quad is None:
                    fallback_lines.append(text_val)
                    continue
                try:
                    x0, y0, x1, y1, xc = _bbox_from_quad(quad)
                except Exception:
                    fallback_lines.append(text_val)
                    continue
                blocks.append({
                    "x0": x0,
                    "y0": y0,
                    "x1": x1,
                    "y1": y1,
                    "xc": xc,
                    "text": text_val,
                    "line_id": len(blocks),
                })
        edge_ids: Set[int] = set()
        if boilerplate_enabled and blocks:
            edge_ids = edge_ids_by_y(
                [(b["line_id"], b["y0"]) for b in blocks],
                config.boilerplate_edge_lines,
            )
        if edge_ids:
            filtered_blocks: List[Dict[str, Any]] = []
            for b in blocks:
                normalized = normalize_boilerplate_line(str(b.get("text", "")).strip())
                is_edge = b.get("line_id") in edge_ids
                if is_edge and (
                    matches_repeated_cluster(str(b.get("text", "")), repeated_clusters, config)
                    or is_boilerplate_line(normalized)
                ):
                    removed_total += 1
                    continue
                filtered_blocks.append(b)
            blocks = filtered_blocks
        if blocks:
            ordered_text = order_blocks_into_columns(
                blocks,
                log_label="Paddle",
                preserve_single_column_order=True,
            )
        else:
            ordered_text = "\\n".join(fallback_lines)
        pages.append({"page_num": idx, "text": ordered_text})
        elapsed = time.perf_counter() - t_start
        LOGGER.info(
            "Paddle OCR page %d/%d: done in %.2fs (text_chars=%d, blocks=%d)",
            idx,
            total,
            elapsed,
            len(ordered_text),
            len(blocks),
        )
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"Paddle OCR page {idx}/{total}")

    if removed_total and boilerplate_enabled:
        LOGGER.info(
            "Boilerplate removal (OCR lines): removed %s lines (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            repeat_threshold,
            len(repeated_clusters),
        )

    avg_conf = sum(confidences) / len(confidences) if confidences else None
    LOGGER.info(
        "Paddle OCR complete: pages=%d, text_chars=%d",
        len(pages),
        ocr_pages_text_chars(pages),
    )
    return pages, {"ocr_confidence_avg": avg_conf}
`,"ocr_tesseract.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8
from __future__ import annotations

import logging
import os
import shutil
import time
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

LOGGER = logging.getLogger("docling_extract")
TESSERACT_LOGGED_ONCE = False


def find_tesseract_path() -> Optional[str]:
    env_cmd = os.environ.get("TESSERACT_CMD") or os.environ.get("TESSERACT_PATH")
    if env_cmd and os.path.isfile(env_cmd):
        return env_cmd
    tesseract_cmd = shutil.which("tesseract")
    if tesseract_cmd:
        return tesseract_cmd
    for candidate in ("/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract"):
        if os.path.isfile(candidate):
            return candidate
    return None


def ocr_pages_with_tesseract(
    images: Sequence[Any],
    languages: str,
    config: Any,
    helpers: Dict[str, Any],
    progress_cb: Optional[Any] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    global LOGGER
    LOGGER = helpers.get("logger", LOGGER)
    ocr_pages_text_chars = helpers["ocr_pages_text_chars"]
    detect_repeated_line_clusters = helpers["detect_repeated_line_clusters"]
    normalize_boilerplate_line = helpers["normalize_boilerplate_line"]
    matches_repeated_cluster = helpers["matches_repeated_cluster"]
    is_boilerplate_line = helpers["is_boilerplate_line"]
    edge_ids_by_y = helpers["edge_ids_by_y"]
    select_edge_texts_by_y = helpers["select_edge_texts_by_y"]
    split_blocks_into_columns = helpers["split_blocks_into_columns"]

    import pytesseract
    tesseract_cmd = find_tesseract_path()
    if tesseract_cmd:
        global TESSERACT_LOGGED_ONCE
        if shutil.which("tesseract") is None and not TESSERACT_LOGGED_ONCE:
            LOGGER.info("Tesseract not on PATH; using %s", tesseract_cmd)
            TESSERACT_LOGGED_ONCE = True
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    else:
        raise RuntimeError("Tesseract not found on PATH; set TESSERACT_CMD or install tesseract.")

    def _safe_float(values: Any, idx: int) -> float:
        if isinstance(values, list) and idx < len(values):
            try:
                return float(values[idx])
            except Exception:
                return 0.0
        return 0.0

    def _group_words_into_lines(words: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        if not words:
            return []
        heights = sorted((w["y1"] - w["y0"]) for w in words)
        h_med = heights[len(heights) // 2] if heights else 1.0
        y_thr = max(4.0, 0.6 * h_med)
        words_sorted = sorted(words, key=lambda w: (w["yc"], w["x0"]))
        lines: List[List[Dict[str, Any]]] = []
        current: List[Dict[str, Any]] = []
        current_y: Optional[float] = None
        for w in words_sorted:
            if current_y is None or abs(w["yc"] - current_y) <= y_thr:
                current.append(w)
            else:
                lines.append(current)
                current = [w]
            current_y = w["yc"]
        if current:
            lines.append(current)
        return lines

    pages: List[Dict[str, Any]] = []
    confidences: List[float] = []
    total = max(1, len(images))
    repeat_threshold = 0
    repeated_clusters: List[Any] = []
    removed_total = 0
    if config.enable_boilerplate_removal and total >= config.boilerplate_min_pages:
        page_edge_candidates: List[List[str]] = []
        for idx, image in enumerate(images, start=1):
            LOGGER.info("Tesseract OCR prepass %d/%d: start", idx, total)
            t_start = time.perf_counter()
            line_items: List[Tuple[str, float]] = []
            try:
                data = pytesseract.image_to_data(
                    image, lang=languages, output_type=pytesseract.Output.DICT
                )
                items = len(data.get("text", []))
                words: List[Dict[str, Any]] = []
                for i in range(items):
                    raw_text = str(data["text"][i] or "").strip()
                    if not raw_text:
                        continue
                    x0 = _safe_float(data.get("left"), i)
                    y0 = _safe_float(data.get("top"), i)
                    x1 = x0 + _safe_float(data.get("width"), i)
                    y1 = y0 + _safe_float(data.get("height"), i)
                    yc = 0.5 * (y0 + y1)
                    words.append(
                        {
                            "x0": x0,
                            "y0": y0,
                            "x1": x1,
                            "y1": y1,
                            "yc": yc,
                            "text": raw_text,
                        }
                    )
                for line_words in _group_words_into_lines(words):
                    line_sorted = sorted(line_words, key=lambda w: w["x0"])
                    line_text = " ".join(w["text"] for w in line_sorted if w["text"]).strip()
                    if not line_text:
                        continue
                    line_y0 = min(w["y0"] for w in line_sorted)
                    line_items.append((line_text, line_y0))
            except Exception:
                line_items = []
            elapsed = time.perf_counter() - t_start
            LOGGER.info(
                "Tesseract OCR prepass %d/%d: done in %.2fs (edge_lines=%d)",
                idx,
                total,
                elapsed,
                len(line_items),
            )
            if line_items:
                page_edge_candidates.append(
                    select_edge_texts_by_y(line_items, config.boilerplate_edge_lines)
                )
        repeated_clusters, repeat_threshold = detect_repeated_line_clusters(
            page_edge_candidates,
            total,
            config,
        )
    for idx, image in enumerate(images, start=1):
        if progress_cb and progress_span > 0:
            percent = progress_base + int((idx - 1) / total * progress_span)
            progress_cb(percent, "ocr", f"Tesseract OCR page {idx}/{total} (running)")
        LOGGER.info("Tesseract OCR page %d/%d: start", idx, total)
        t_start = time.perf_counter()
        text = ""
        words: List[Dict[str, Any]] = []
        try:
            data = pytesseract.image_to_data(
                image, lang=languages, output_type=pytesseract.Output.DICT
            )
            items = len(data.get("text", []))
            for i in range(items):
                raw_text = str(data["text"][i] or "").strip()
                if not raw_text:
                    continue
                x0 = _safe_float(data.get("left"), i)
                y0 = _safe_float(data.get("top"), i)
                x1 = x0 + _safe_float(data.get("width"), i)
                y1 = y0 + _safe_float(data.get("height"), i)
                xc = 0.5 * (x0 + x1)
                yc = 0.5 * (y0 + y1)
                words.append(
                    {
                        "x0": x0,
                        "y0": y0,
                        "x1": x1,
                        "y1": y1,
                        "xc": xc,
                        "yc": yc,
                        "text": raw_text,
                    }
                )

                conf_raw = data.get("conf", [None])[i]
                try:
                    conf_val = float(conf_raw)
                except Exception:
                    conf_val = None
                if conf_val is not None and conf_val >= 0:
                    confidences.append(conf_val)

            if words:
                columns, _, _ = split_blocks_into_columns(words, log_label="Tesseract")
                column_lines: List[List[Dict[str, Any]]] = []
                line_id_counter = 0
                for col in columns:
                    lines: List[Dict[str, Any]] = []
                    for line_words in _group_words_into_lines(col):
                        line_sorted = sorted(line_words, key=lambda w: w["x0"])
                        line_text = " ".join(w["text"] for w in line_sorted if w["text"])
                        if not line_text:
                            continue
                        line_y0 = min(w["y0"] for w in line_sorted)
                        line_y1 = max(w["y1"] for w in line_sorted)
                        line_x0 = min(w["x0"] for w in line_sorted)
                        lines.append(
                            {
                                "text": line_text,
                                "y0": line_y0,
                                "y1": line_y1,
                                "x0": line_x0,
                                "line_id": line_id_counter,
                            }
                        )
                        line_id_counter += 1
                    lines.sort(key=lambda l: (l["y0"], l["x0"]))
                    column_lines.append(lines)
                edge_ids: Set[int] = set()
                if config.enable_boilerplate_removal and column_lines:
                    all_lines = [line for col_lines in column_lines for line in col_lines]
                    edge_ids = edge_ids_by_y(
                        [(line["line_id"], line["y0"]) for line in all_lines],
                        config.boilerplate_edge_lines,
                    )
                if edge_ids:
                    filtered_columns: List[List[Dict[str, Any]]] = []
                    for lines in column_lines:
                        filtered_lines: List[Dict[str, Any]] = []
                        for line in lines:
                            normalized = normalize_boilerplate_line(str(line.get("text", "")).strip())
                            is_edge = line.get("line_id") in edge_ids
                            if is_edge and (
                                matches_repeated_cluster(str(line.get("text", "")), repeated_clusters, config)
                                or is_boilerplate_line(normalized)
                            ):
                                removed_total += 1
                                continue
                            filtered_lines.append(line)
                        filtered_columns.append(filtered_lines)
                    column_lines = filtered_columns
                def _join_lines(lines: List[Dict[str, Any]]) -> str:
                    heights = [line["y1"] - line["y0"] for line in lines if line.get("y1") is not None]
                    heights = sorted(h for h in heights if h > 0)
                    h_med = heights[len(heights) // 2] if heights else 10.0
                    gap_thr = max(6.0, 1.6 * h_med)
                    paragraphs: List[str] = []
                    current = ""
                    prev_y1: Optional[float] = None
                    for line in lines:
                        line_text = str(line.get("text", "")).strip()
                        if not line_text:
                            continue
                        y0 = float(line.get("y0") or 0.0)
                        y1 = float(line.get("y1") or y0)
                        if current and prev_y1 is not None and (y0 - prev_y1) > gap_thr:
                            paragraphs.append(current.strip())
                            current = ""
                        if not current:
                            current = line_text
                        else:
                            if current.endswith("-"):
                                current = current[:-1] + line_text.lstrip()
                            else:
                                current = current.rstrip() + " " + line_text.lstrip()
                        prev_y1 = y1
                    if current:
                        paragraphs.append(current.strip())
                    return "\\n\\n".join(paragraphs)

                col_texts = [_join_lines(lines) for lines in column_lines if lines]
                text = "\\n\\n".join(t for t in col_texts if t)
        except Exception:
            text = ""

        if not text:
            text = pytesseract.image_to_string(image, lang=languages)
        pages.append({"page_num": idx, "text": text})
        elapsed = time.perf_counter() - t_start
        LOGGER.info(
            "Tesseract OCR page %d/%d: done in %.2fs (text_chars=%d, words=%d)",
            idx,
            total,
            elapsed,
            len(text),
            len(words),
        )
        if progress_cb and progress_span > 0:
            percent = progress_base + int(idx / total * progress_span)
            progress_cb(percent, "ocr", f"Tesseract OCR page {idx}/{total}")
    if removed_total and config.enable_boilerplate_removal:
        LOGGER.info(
            "Boilerplate removal (OCR lines): removed %s lines (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            repeat_threshold,
            len(repeated_clusters),
        )
    avg_conf = sum(confidences) / len(confidences) if confidences else None
    LOGGER.info(
        "Tesseract OCR complete: pages=%d, text_chars=%d",
        len(pages),
        ocr_pages_text_chars(pages),
    )
    return pages, {"ocr_confidence_avg": avg_conf}
`,"index_redisearch.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8
import argparse
import html
import json
import os
import re
import sys
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple

from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


EMBED_MAX_CHARS = 12000
EMBED_MAX_CHARS_NON_ASCII = 8000
EMBED_SUBCHUNK_CHARS_DEFAULT = 3500
EMBED_SUBCHUNK_OVERLAP_DEFAULT = 200
EMBED_CONTEXT_WINDOW_DEFAULT = 0
EMBED_CONTEXT_CHARS_DEFAULT = 220


def truncate_for_embedding(text: str) -> Tuple[str, bool]:
    if not text:
        return text, False
    max_chars = EMBED_MAX_CHARS
    non_ascii = sum(1 for ch in text if ord(ch) > 127)
    if non_ascii / max(1, len(text)) > 0.2:
        max_chars = EMBED_MAX_CHARS_NON_ASCII
    if len(text) <= max_chars:
        return text, False
    sep = "\\n...\\n"
    head_len = max(0, (max_chars - len(sep)) // 2)
    tail_len = max_chars - len(sep) - head_len
    trimmed = f"{text[:head_len]}{sep}{text[-tail_len:]}" if tail_len > 0 else text[:max_chars]
    return trimmed, True


def _list_to_dict(items: Sequence[Any]) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    for i in range(0, len(items) - 1, 2):
        key = items[i]
        value = items[i + 1]
        if isinstance(key, bytes):
            key = key.decode("utf-8", "ignore")
        if isinstance(value, bytes):
            value = value.decode("utf-8", "ignore")
        data[str(key)] = value
    return data


def _iter_attributes(info_value: Any) -> Iterable[Dict[str, Any]]:
    if not isinstance(info_value, list):
        return []
    for entry in info_value:
        if isinstance(entry, list):
            yield _list_to_dict(entry)


def get_index_vector_dim(
    client: redis.Redis, index_name: str, field_name: str = "embedding"
) -> Optional[int]:
    try:
        info = client.execute_command("FT.INFO", index_name)
    except Exception:
        return None
    info_dict = _list_to_dict(info if isinstance(info, list) else [])
    attrs = info_dict.get("attributes")
    for attr in _iter_attributes(attrs):
        attr_name = attr.get("attribute") or attr.get("identifier")
        if attr_name != field_name:
            continue
        if str(attr.get("type", "")).upper() != "VECTOR":
            continue
        dim_value = attr.get("dimension") or attr.get("dim")
        try:
            return int(dim_value)
        except Exception:
            return None
    return None


def ensure_index(client: redis.Redis, index_name: str, prefix: str, embedding_dim: int) -> None:
    try:
        client.execute_command("FT.INFO", index_name)
        existing_dim = get_index_vector_dim(client, index_name)
        if existing_dim and existing_dim != embedding_dim:
            raise RuntimeError(
                f"Embedding dim mismatch: index={existing_dim} model={embedding_dim}"
            )
        ensure_schema_fields(client, index_name)
        return
    except redis.exceptions.ResponseError as exc:
        message = str(exc).lower()
        if "unknown index name" not in message:
            raise

    client.execute_command(
        "FT.CREATE",
        index_name,
        "ON",
        "HASH",
        "PREFIX",
        "1",
        prefix,
        "SCHEMA",
        "doc_id",
        "TAG",
        "chunk_id",
        "TAG",
        "attachment_key",
        "TAG",
        "title",
        "TEXT",
        "authors",
        "TAG",
        "SEPARATOR",
        "|",
        "tags",
        "TAG",
        "SEPARATOR",
        "|",
        "chunk_tags",
        "TAG",
        "SEPARATOR",
        "|",
        "year",
        "NUMERIC",
        "item_type",
        "TAG",
        "SEPARATOR",
        "|",
        "source_pdf",
        "TEXT",
        "page_start",
        "NUMERIC",
        "page_end",
        "NUMERIC",
        "section",
        "TEXT",
        "text",
        "TEXT",
        "embedding",
        "VECTOR",
        "HNSW",
        "6",
        "TYPE",
        "FLOAT32",
        "DIM",
        str(embedding_dim),
        "DISTANCE_METRIC",
        "COSINE",
    )


def ensure_schema_fields(client: redis.Redis, index_name: str) -> None:
    fields: List[Tuple[str, List[str]]] = [
        ("attachment_key", ["TAG"]),
        ("title", ["TEXT"]),
        ("authors", ["TAG", "SEPARATOR", "|"]),
        ("tags", ["TAG", "SEPARATOR", "|"]),
        ("chunk_tags", ["TAG", "SEPARATOR", "|"]),
        ("year", ["NUMERIC"]),
        ("item_type", ["TAG", "SEPARATOR", "|"]),
    ]
    for name, spec in fields:
        try:
            client.execute_command("FT.ALTER", index_name, "SCHEMA", "ADD", name, *spec)
        except redis.exceptions.ResponseError as exc:
            message = str(exc).lower()
            if "duplicate" in message or "already exists" in message:
                continue
            raise


def infer_item_json_path(chunks_json: str, doc_id: str) -> Optional[str]:
    base_name = f"{doc_id}.json"
    chunks_dir = os.path.dirname(chunks_json)
    candidates: List[str] = []
    if os.path.basename(chunks_dir) == "chunks":
        candidates.append(os.path.join(os.path.dirname(chunks_dir), "items", base_name))
    marker = f"{os.sep}chunks{os.sep}"
    if marker in chunks_json:
        candidates.append(chunks_json.replace(marker, f"{os.sep}items{os.sep}"))
    candidates.append(os.path.join(chunks_dir, base_name))
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    return None


def parse_item_metadata(item_payload: Dict[str, Any]) -> Dict[str, Any]:
    data = item_payload.get("data") if isinstance(item_payload.get("data"), dict) else item_payload
    title = str(data.get("title", "")).strip()
    item_type = str(data.get("itemType", "")).strip()
    tags: List[str] = []
    for tag in data.get("tags", []) or []:
        if isinstance(tag, dict):
            value = str(tag.get("tag", "")).strip()
        else:
            value = str(tag).strip()
        if value:
            tags.append(value)

    creators = data.get("creators", []) or []
    authors: List[str] = []
    for creator in creators:
        if not isinstance(creator, dict):
            continue
        name = ""
        if creator.get("name"):
            name = str(creator.get("name", "")).strip()
        else:
            first = str(creator.get("firstName", "")).strip()
            last = str(creator.get("lastName", "")).strip()
            name = " ".join(part for part in (first, last) if part)
        if name:
            authors.append(name)

    year = 0
    date_field = str(data.get("date", "")).strip()
    match = None
    if date_field:
        match = next(iter(__import__("re").findall(r"(1[5-9]\\d{2}|20\\d{2})", date_field)), None)
    if match:
        try:
            year = int(match)
        except ValueError:
            year = 0
    elif isinstance(data.get("year"), (int, float)):
        year = int(data.get("year"))

    return {
        "title": title,
        "authors": "|".join(authors),
        "tags": "|".join(tags),
        "year": year,
        "item_type": item_type,
    }


def parse_chunk_id_list(raw: Optional[str], doc_id: str) -> List[str]:
    if not raw:
        return []
    items: List[str] = []
    for part in raw.split(","):
        cleaned = part.strip()
        if not cleaned:
            continue
        if doc_id and cleaned.startswith(f"{doc_id}:"):
            cleaned = cleaned.split(":", 1)[1]
        items.append(cleaned)
    return items


def delete_existing_chunk_keys(
    client: redis.Redis,
    prefix: str,
    doc_id: str,
    chunk_id: str,
) -> int:
    deleted = 0
    base = f"{prefix}{doc_id}:{chunk_id}"
    try:
        if client.exists(base):
            client.delete(base)
            deleted += 1
    except Exception:
        pass
    pattern = f"{base}#*"
    batch: List[bytes] = []
    for key in client.scan_iter(match=pattern, count=500):
        batch.append(key)
        if len(batch) >= 500:
            client.delete(*batch)
            deleted += len(batch)
            batch = []
    if batch:
        client.delete(*batch)
        deleted += len(batch)
    return deleted


def markdown_to_text(text: str) -> str:
    if not text:
        return ""
    text = strip_image_references(text)
    try:
        import markdown as md
    except Exception:
        return text
    try:
        html_text = md.markdown(text, extensions=["extra", "sane_lists"])
    except Exception:
        return text
    html_text = re.sub(r"<br\\s*/?>", "\\n", html_text, flags=re.IGNORECASE)
    stripped = re.sub(r"<[^>]+>", " ", html_text)
    stripped = html.unescape(stripped)
    stripped = re.sub(r"[ \\t]+", " ", stripped)
    stripped = re.sub(r"\\s*\\n\\s*", "\\n", stripped)
    return stripped.strip()


_OBSIDIAN_IMAGE_RE = re.compile(r"!\\[\\[(?P<target>[^\\]|]+)(?:\\|(?P<label>[^\\]]+))?\\]\\]")
_MARKDOWN_IMAGE_RE = re.compile(r"!\\[(?P<label>[^\\]]*)]\\([^)]+\\)")
_HTML_IMAGE_RE = re.compile(r"<img[^>]*>", re.IGNORECASE)


def strip_image_references(text: str) -> str:
    if not text:
        return ""
    def _image_marker(label: str) -> str:
        label = label.strip()
        if label:
            return f" Image caption: {label} "
        return " Image "

    def obsidian_repl(match: re.Match[str]) -> str:
        label = (match.group("label") or "").strip()
        return _image_marker(label)

    def markdown_repl(match: re.Match[str]) -> str:
        label = (match.group("label") or "").strip()
        return _image_marker(label)

    def html_repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        alt_match = re.search(r"\\balt=(['\\"])(?P<alt>[^'\\"]*)\\1", tag, re.IGNORECASE)
        if alt_match:
            alt = (alt_match.group("alt") or "").strip()
            return _image_marker(alt)
        return _image_marker("")

    text = _OBSIDIAN_IMAGE_RE.sub(obsidian_repl, text)
    text = _MARKDOWN_IMAGE_RE.sub(markdown_repl, text)
    text = _HTML_IMAGE_RE.sub(html_repl, text)
    return text


def split_paragraphs(text: str) -> List[str]:
    paragraphs = re.split(r"\\n\\s*\\n", text)
    return [para.strip() for para in paragraphs if para.strip()]


def split_long_text(text: str, max_chars: int) -> List[str]:
    if max_chars <= 0 or len(text) <= max_chars:
        return [text]
    sentences = re.split(r"(?<=[.!?])\\s+", text.strip())
    if len(sentences) <= 1:
        return [text[i:i + max_chars] for i in range(0, len(text), max_chars)]
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0
    for sentence in sentences:
        sent = sentence.strip()
        if not sent:
            continue
        if current_len + len(sent) + 1 > max_chars and current:
            chunks.append(" ".join(current).strip())
            current = [sent]
            current_len = len(sent)
        else:
            current.append(sent)
            current_len += len(sent) + 1
    if current:
        chunks.append(" ".join(current).strip())
    return chunks


def split_text_by_size(text: str, max_chars: int, overlap_chars: int) -> List[str]:
    if max_chars <= 0 or len(text) <= max_chars:
        return [text]
    paragraphs = split_paragraphs(text) or [text]
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    def flush() -> None:
        nonlocal current, current_len
        if not current:
            return
        chunk = "\\n\\n".join(current).strip()
        if chunk:
            chunks.append(chunk)
        current = []
        current_len = 0

    for para in paragraphs:
        for piece in split_long_text(para, max_chars):
            piece_len = len(piece)
            if current_len + piece_len + 2 > max_chars and current:
                flush()
            current.append(piece)
            current_len += piece_len + 2

    flush()

    if overlap_chars <= 0 or len(chunks) <= 1:
        return chunks

    overlapped: List[str] = []
    previous = ""
    for chunk in chunks:
        if previous:
            overlap = previous[-overlap_chars:]
            combined = f"{overlap}\\n{chunk}".strip()
        else:
            combined = chunk
        overlapped.append(combined)
        previous = chunk
    return overlapped


def split_for_embedding(text: str, max_chars: int, overlap_chars: int) -> List[str]:
    if not text:
        return []
    max_chars = int(max_chars or 0)
    overlap_chars = max(0, int(overlap_chars or 0))
    if max_chars <= 0:
        return [text]
    chunks = split_text_by_size(text, max_chars, overlap_chars)
    return chunks or [text]


def markdown_to_index_text(text: str) -> str:
    if not text:
        return ""
    text = strip_image_references(text)
    try:
        from markdown_it import MarkdownIt
    except Exception:
        return markdown_to_text(text)

    def inline_text(token: Any) -> str:
        if not getattr(token, "children", None):
            return str(getattr(token, "content", "") or "")
        parts: List[str] = []
        for child in token.children:
            t = getattr(child, "type", "")
            if t in ("text", "code_inline"):
                parts.append(str(child.content or ""))
            elif t == "softbreak":
                parts.append(" ")
            elif t == "hardbreak":
                parts.append("\\n")
        return "".join(parts)

    def extract_table(tokens: Sequence[Any], start: int) -> Tuple[List[str], int]:
        headers: List[str] = []
        rows: List[List[str]] = []
        current: List[str] = []
        in_header = False
        i = start + 1
        while i < len(tokens):
            token = tokens[i]
            ttype = token.type
            if ttype == "thead_open":
                in_header = True
            elif ttype == "tbody_open":
                in_header = False
            elif ttype == "tr_open":
                current = []
            elif ttype in ("th_open", "td_open"):
                cell = ""
                if i + 1 < len(tokens) and tokens[i + 1].type == "inline":
                    cell = inline_text(tokens[i + 1]).strip()
                current.append(cell)
            elif ttype == "tr_close":
                if in_header and not headers:
                    headers = current
                else:
                    rows.append(current)
            elif ttype == "table_close":
                break
            i += 1

        lines: List[str] = []
        for row in rows:
            if headers:
                pairs: List[str] = []
                for idx, cell in enumerate(row):
                    if not cell:
                        continue
                    header = headers[idx] if idx < len(headers) and headers[idx] else f"Column {idx + 1}"
                    pairs.append(f"{header}: {cell}")
                if pairs:
                    lines.append("; ".join(pairs))
            else:
                row_line = " | ".join([cell for cell in row if cell])
                if row_line:
                    lines.append(row_line)
        return lines, i

    md = MarkdownIt("commonmark", {"html": False})
    try:
        md.enable("table")
    except Exception:
        pass
    tokens = md.parse(text)

    lines: List[str] = []
    list_depth = 0
    in_list_item = False
    list_item_parts: List[str] = []
    i = 0
    while i < len(tokens):
        token = tokens[i]
        ttype = token.type

        if ttype == "table_open":
            table_lines, i = extract_table(tokens, i)
            lines.extend(table_lines)
            i += 1
            continue

        if ttype in ("bullet_list_open", "ordered_list_open"):
            list_depth += 1
        elif ttype in ("bullet_list_close", "ordered_list_close"):
            list_depth = max(0, list_depth - 1)
        elif ttype == "list_item_open":
            in_list_item = True
            list_item_parts = []
        elif ttype == "list_item_close":
            content = " ".join(list_item_parts).strip()
            if content:
                indent = "  " * max(0, list_depth - 1)
                lines.append(f"{indent}- {content}")
            in_list_item = False
        elif ttype == "heading_open":
            if i + 1 < len(tokens) and tokens[i + 1].type == "inline":
                heading = inline_text(tokens[i + 1]).strip()
                if heading:
                    lines.append(heading)
            while i < len(tokens) and tokens[i].type != "heading_close":
                i += 1
        elif ttype == "inline":
            text_val = inline_text(token).strip()
            if text_val:
                if in_list_item:
                    list_item_parts.append(text_val)
                else:
                    lines.append(text_val)
        elif ttype in ("fence", "code_block"):
            content = str(token.content or "").strip()
            if content:
                lines.append(content)

        i += 1

    return "\\n".join(lines).strip()


def normalize_index_text(text: str) -> str:
    text = text.replace("\\r\\n", "\\n").replace("\\r", "\\n")
    text = re.sub(r"[ \\t]+", " ", text)
    text = re.sub(r"\\n{3,}", "\\n\\n", text)
    text = re.sub(r"[ \\t]*\\n[ \\t]*", "\\n", text)
    return text.strip()


def normalize_meta_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return ", ".join(cleaned)
    text = str(value).strip()
    if not text:
        return ""
    return text.replace("|", ", ")


def is_chunk_excluded(chunk: Dict[str, Any]) -> bool:
    value = chunk.get("excluded")
    if value is None:
        value = chunk.get("exclude")
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "exclude", "excluded"}
    return False


def build_embedding_text(
    text: str,
    chunk: Dict[str, Any],
    item_metadata: Dict[str, Any],
) -> str:
    parts: List[str] = []
    title = normalize_meta_value(item_metadata.get("title", ""))
    if title:
        parts.append(f"Title: {title}")
    authors = normalize_meta_value(item_metadata.get("authors", ""))
    if authors:
        parts.append(f"Authors: {authors}")
    tags = normalize_meta_value(item_metadata.get("tags", ""))
    if tags:
        parts.append(f"Tags: {tags}")
    year = item_metadata.get("year")
    if isinstance(year, (int, float)) and int(year) > 0:
        parts.append(f"Year: {int(year)}")
    item_type = normalize_meta_value(item_metadata.get("item_type", ""))
    if item_type:
        parts.append(f"Item type: {item_type}")
    section = normalize_meta_value(chunk.get("section", ""))
    if section:
        parts.append(f"Section: {section}")
    chunk_tags = normalize_meta_value(chunk.get("chunk_tags", ""))
    if chunk_tags:
        parts.append(f"Chunk tags: {chunk_tags}")
    page_start = chunk.get("page_start")
    page_end = chunk.get("page_end")
    if isinstance(page_start, (int, float)) and isinstance(page_end, (int, float)):
        parts.append(f"Pages: {int(page_start)}-{int(page_end)}")
    if not parts:
        return text
    return "\\n".join(parts) + "\\n\\n" + text


def truncate_context_text(text: str, limit: int) -> str:
    if limit <= 0:
        return ""
    cleaned = text.strip()
    if not cleaned:
        return ""
    if len(cleaned) <= limit:
        return cleaned
    trimmed = cleaned[:limit]
    last_space = trimmed.rfind(" ")
    if last_space > 0:
        trimmed = trimmed[:last_space]
    return trimmed.rstrip() + "..."


def build_context_text(
    focus_text: str,
    prev_snippets: Sequence[str],
    next_snippets: Sequence[str],
) -> str:
    parts: List[str] = []
    if prev_snippets:
        parts.append("Previous context:\\n" + "\\n".join(prev_snippets))
    parts.append(focus_text)
    if next_snippets:
        parts.append("Next context:\\n" + "\\n".join(next_snippets))
    return "\\n\\n".join(parts)


def normalize_tag(tag: str) -> str:
    cleaned = tag.strip()
    cleaned = cleaned.strip("-,;:\u2022")
    cleaned = re.sub(r"\\s+", " ", cleaned)
    return cleaned.strip()


def parse_tag_payload(content: str) -> List[str]:
    if not content:
        return []
    raw = content.strip()
    if raw.startswith("[") and raw.endswith("]"):
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [normalize_tag(str(item)) for item in parsed if normalize_tag(str(item))]
        except Exception:
            pass
    parts = re.split(r"[,;\\n]+", raw)
    tags: List[str] = []
    for part in parts:
        cleaned = normalize_tag(part)
        if cleaned:
            tags.append(cleaned)
    return tags


def request_chunk_tags(
    base_url: str,
    api_key: str,
    model: str,
    text: str,
    max_tags: int,
    temperature: float,
) -> List[str]:
    if not base_url or not model:
        return []
    snippet = text.strip()
    if len(snippet) > 2000:
        snippet = snippet[:2000]
    if not snippet:
        return []
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    system_prompt = (
        "Return 3 to {max_tags} high-signal, concrete noun-phrase tags. "
        "Avoid generic terms (study, paper, method), verbs, and filler. "
        "Prefer specific entities, methods, datasets, and named concepts. "
        "Output comma-separated tags only. No extra text."
    ).format(max_tags=max_tags)
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": snippet},
        ],
    }
    model_name = (model or "").lower()
    requires_default_temp = "gpt-5" in model_name or model_name.startswith("gpt5")
    if not requires_default_temp or temperature == 1.0:
        payload["temperature"] = temperature
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    if response.status_code >= 400:
        raise RuntimeError(f"Tag request failed: {response.status_code} {response.text}")
    data = response.json()
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )
    tags = parse_tag_payload(str(content))
    deduped: List[str] = []
    seen = set()
    for tag in tags:
        key = tag.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(tag)
        if len(deduped) >= max_tags:
            break
    return deduped


def tags_to_pipe(tags: Sequence[str]) -> str:
    cleaned = [normalize_tag(tag) for tag in tags if normalize_tag(tag)]
    return "|".join(cleaned)


def main() -> int:
    parser = argparse.ArgumentParser(description="Index Docling chunks into RedisSearch.")
    parser.add_argument("--chunks-json", required=True)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--item-json")
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument(
        "--embed-subchunk-chars",
        type=int,
        default=EMBED_SUBCHUNK_CHARS_DEFAULT,
        help="Max chars per embedding subchunk (0 disables splitting).",
    )
    parser.add_argument(
        "--embed-subchunk-overlap",
        type=int,
        default=EMBED_SUBCHUNK_OVERLAP_DEFAULT,
        help="Overlap chars between embedding subchunks.",
    )
    parser.add_argument(
        "--embed-context-window",
        type=int,
        default=EMBED_CONTEXT_WINDOW_DEFAULT,
        help="Neighboring chunk count to include around each chunk in embeddings (0 disables).",
    )
    parser.add_argument(
        "--embed-context-chars",
        type=int,
        default=EMBED_CONTEXT_CHARS_DEFAULT,
        help="Max chars per neighboring chunk included in embeddings.",
    )
    parser.add_argument(
        "--embed-include-metadata",
        action="store_true",
        help="Include title/authors/tags/section metadata in the embedding text",
    )
    parser.add_argument(
        "--generate-chunk-tags",
        action="store_true",
        help="Generate short tags per chunk using the LLM cleanup model",
    )
    parser.add_argument("--tag-base-url", default="")
    parser.add_argument("--tag-api-key", default="")
    parser.add_argument("--tag-model", default="")
    parser.add_argument("--tag-temperature", type=float, default=0.2)
    parser.add_argument("--tag-max", type=int, default=5)
    parser.add_argument("--upsert", action="store_true")
    parser.add_argument("--progress", action="store_true")
    parser.add_argument("--chunk-ids", help="Comma-separated chunk IDs to index")
    parser.add_argument("--delete-chunk-ids", help="Comma-separated chunk IDs to delete")
    args = parser.parse_args()

    if not os.path.isfile(args.chunks_json):
        eprint(f"Chunks JSON not found: {args.chunks_json}")
        return 2

    try:
        with open(args.chunks_json, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except Exception as exc:
        eprint(f"Failed to read chunks JSON: {exc}")
        return 2


    doc_id = payload.get("doc_id")
    chunks = payload.get("chunks")
    if not doc_id or not isinstance(chunks, list):
        eprint("Invalid chunks JSON schema")
        return 2
    doc_id = str(doc_id)

    chunk_id_filter = set(parse_chunk_id_list(args.chunk_ids, doc_id))
    delete_ids = set(parse_chunk_id_list(args.delete_chunk_ids, doc_id))
    excluded_ids: Set[str] = set()
    for chunk in chunks:
        chunk_id = chunk.get("chunk_id")
        if not chunk_id:
            continue
        chunk_id = str(chunk_id)
        if doc_id and chunk_id.startswith(f"{doc_id}:"):
            chunk_id = chunk_id.split(":", 1)[1]
        if is_chunk_excluded(chunk):
            excluded_ids.add(chunk_id)
    if excluded_ids:
        delete_ids |= excluded_ids
    incremental = bool(chunk_id_filter or delete_ids)

    attachment_key = None
    try:
        meta = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
        key_val = meta.get("attachment_key") if isinstance(meta, dict) else None
        if isinstance(key_val, str) and key_val.strip():
            attachment_key = key_val.strip()
    except Exception:
        attachment_key = None

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)

    if not incremental:
        # Delete all existing chunk keys for this doc_id before indexing
        pattern = f"{args.prefix}{doc_id}:*"
        deleted = 0
        try:
            batch: List[bytes] = []
            for key in client.scan_iter(match=pattern, count=500):
                batch.append(key)
                if len(batch) >= 500:
                    client.delete(*batch)
                    deleted += len(batch)
                    batch = []
            if batch:
                client.delete(*batch)
                deleted += len(batch)
            if deleted:
                eprint(f"Deleted {deleted} existing chunk keys for doc_id {doc_id}")
        except Exception as exc:
            eprint(f"Failed to delete old chunk keys for doc_id {doc_id}: {exc}")

    item_metadata: Dict[str, Any] = {}
    item_json_path = args.item_json or infer_item_json_path(args.chunks_json, str(doc_id))
    if item_json_path and os.path.isfile(item_json_path):
        try:
            with open(item_json_path, "r", encoding="utf-8") as handle:
                item_payload = json.load(handle)
            item_metadata = parse_item_metadata(item_payload)
        except Exception as exc:
            eprint(f"Failed to read item JSON metadata: {exc}")

    if delete_ids or chunk_id_filter:
        try:
            to_clear = set(delete_ids) | set(chunk_id_filter)
            deleted = 0
            for chunk_id in to_clear:
                deleted += delete_existing_chunk_keys(client, args.prefix, doc_id, chunk_id)
            if deleted:
                eprint(f"Deleted {deleted} existing chunk keys for doc_id {doc_id}")
        except Exception as exc:
            eprint(f"Failed to delete chunk keys for doc_id {doc_id}: {exc}")

    embed_subchunk_chars = int(args.embed_subchunk_chars or 0)
    embed_subchunk_overlap = max(0, int(args.embed_subchunk_overlap or 0))
    context_window = max(0, int(args.embed_context_window or 0))
    context_chars = max(0, int(args.embed_context_chars or 0))

    prepared_chunks: List[Dict[str, Any]] = []
    for chunk in chunks:
        if is_chunk_excluded(chunk):
            continue
        raw_text = str(chunk.get("text", ""))
        text = normalize_index_text(markdown_to_index_text(raw_text))
        if not text.strip():
            continue
        chunk_id = chunk.get("chunk_id")
        if not chunk_id:
            continue
        chunk_id = str(chunk_id)
        if chunk_id_filter and chunk_id not in chunk_id_filter:
            continue
        if chunk_id in delete_ids:
            continue
        sub_texts = split_for_embedding(text, embed_subchunk_chars, embed_subchunk_overlap)
        if not sub_texts:
            sub_texts = [text]
        prepared_chunks.append({
            "chunk": chunk,
            "chunk_id": chunk_id,
            "text": text,
            "sub_texts": sub_texts,
        })

    if not prepared_chunks:
        return 0

    if context_window > 0 and context_chars > 0:
        for idx, entry in enumerate(prepared_chunks):
            prev_snippets: List[str] = []
            next_snippets: List[str] = []
            for offset in range(1, context_window + 1):
                prev_idx = idx - offset
                if prev_idx < 0:
                    break
                snippet = truncate_context_text(prepared_chunks[prev_idx]["text"], context_chars)
                if snippet:
                    prev_snippets.append(snippet)
            for offset in range(1, context_window + 1):
                next_idx = idx + offset
                if next_idx >= len(prepared_chunks):
                    break
                snippet = truncate_context_text(prepared_chunks[next_idx]["text"], context_chars)
                if snippet:
                    next_snippets.append(snippet)
            entry["context_prev"] = prev_snippets
            entry["context_next"] = next_snippets

    first_chunk = prepared_chunks[0]["chunk"]
    first_entry = prepared_chunks[0]
    first_text = first_entry["sub_texts"][0]
    first_context_text = first_text
    if context_window > 0 and context_chars > 0:
        first_context_text = build_context_text(
            first_text,
            first_entry.get("context_prev", []),
            first_entry.get("context_next", []),
        )
    first_embedding_text = (
        build_embedding_text(first_context_text, first_chunk, item_metadata)
        if args.embed_include_metadata
        else first_context_text
    )
    first_len = len(first_embedding_text)
    first_embedding_text, truncated = truncate_for_embedding(first_embedding_text)
    if truncated:
        eprint(
            "Embedding input truncated for chunk %s:%s (chars=%d->%d)"
            % (doc_id, first_chunk.get("chunk_id"), first_len, len(first_embedding_text))
        )
    try:
        sample_embedding = request_embedding(
            args.embed_base_url,
            args.embed_api_key,
            args.embed_model,
            first_embedding_text,
        )
    except Exception as exc:
        eprint(f"Embedding failed for chunk {doc_id}:{first_chunk.get('chunk_id')}: {exc}")
        return 2

    embedding_dim = len(sample_embedding)
    if embedding_dim <= 0:
        eprint("Embedding dim mismatch: empty embedding returned")
        return 2

    try:
        ensure_index(client, args.index, args.prefix, embedding_dim)
    except Exception as exc:
        eprint(f"Failed to ensure index: {exc}")
        return 2

    sample_embedding = normalize_vector(sample_embedding)

    total = sum(len(entry["sub_texts"]) for entry in prepared_chunks)
    current = 0
    updated_chunks = False

    for entry in prepared_chunks:
        chunk = entry["chunk"]
        text = entry["text"]
        chunk_id = entry["chunk_id"]
        sub_texts = entry["sub_texts"]
        chunk_tags_value = ""
        existing_tags = chunk.get("chunk_tags")
        has_existing_tags = False
        if isinstance(existing_tags, (list, tuple)):
            cleaned = [normalize_tag(str(tag)) for tag in existing_tags if normalize_tag(str(tag))]
            if cleaned:
                chunk_tags_value = tags_to_pipe(cleaned)
                has_existing_tags = True
        elif isinstance(existing_tags, str) and existing_tags.strip():
            chunk_tags_value = existing_tags.strip()
            has_existing_tags = True
        if args.generate_chunk_tags and args.tag_base_url and args.tag_model and not has_existing_tags:
            try:
                tags = request_chunk_tags(
                    args.tag_base_url,
                    args.tag_api_key,
                    args.tag_model,
                    text,
                    args.tag_max,
                    args.tag_temperature,
                )
                if tags:
                    chunk_tags_value = tags_to_pipe(tags)
                    if chunk.get("chunk_tags") != tags:
                        chunk["chunk_tags"] = tags
                        updated_chunks = True
            except Exception as exc:
                eprint(f"Tagging failed for chunk {chunk_id}: {exc}")

        stable_parent_id = f"{doc_id}:{chunk_id}"
        sub_total = len(sub_texts)
        for sub_idx, sub_text in enumerate(sub_texts, start=1):
            current += 1
            stable_chunk_id = (
                stable_parent_id if sub_total <= 1 else f"{stable_parent_id}#s{sub_idx}"
            )
            key = f"{args.prefix}{stable_chunk_id}"

            if not args.upsert and client.exists(key):
                continue

            try:
                if args.progress:
                    print(
                        json.dumps(
                            {
                                "type": "progress",
                                "stage": "embedding",
                                "current": current,
                                "total": total,
                                "message": f"Embedding {stable_chunk_id} ({current}/{total})",
                            }
                        ),
                        flush=True,
                    )
                if chunk is first_chunk and sub_idx == 1:
                    embedding = sample_embedding
                else:
                    context_text = sub_text
                    if context_window > 0 and context_chars > 0:
                        context_text = build_context_text(
                            sub_text,
                            entry.get("context_prev", []),
                            entry.get("context_next", []),
                        )
                    embedding_text = (
                        build_embedding_text(context_text, chunk, item_metadata)
                        if args.embed_include_metadata
                        else context_text
                    )
                    embed_len = len(embedding_text)
                    embedding_text, truncated = truncate_for_embedding(embedding_text)
                    if truncated:
                        eprint(
                            "Embedding input truncated for chunk %s (chars=%d->%d)"
                            % (stable_chunk_id, embed_len, len(embedding_text))
                        )
                    embedding = request_embedding(
                        args.embed_base_url,
                        args.embed_api_key,
                        args.embed_model,
                        embedding_text,
                    )
                    if len(embedding) != embedding_dim:
                        raise RuntimeError(
                            f"Embedding dim mismatch: expected {embedding_dim} got {len(embedding)}"
                        )
                    embedding = normalize_vector(embedding)
            except Exception as exc:
                eprint(f"Embedding failed for chunk {stable_chunk_id}: {exc}")
                return 2

            fields: Dict[str, Any] = {
                "doc_id": str(doc_id),
                "chunk_id": stable_parent_id,
                "attachment_key": str(attachment_key or ""),
                "title": str(item_metadata.get("title", "")),
                "authors": str(item_metadata.get("authors", "")),
                "tags": str(item_metadata.get("tags", "")),
                "chunk_tags": str(chunk_tags_value),
                "year": int(item_metadata.get("year", 0)),
                "item_type": str(item_metadata.get("item_type", "")),
                "source_pdf": str(payload.get("source_pdf", "")),
                "page_start": int(chunk.get("page_start", 0)),
                "page_end": int(chunk.get("page_end", 0)),
                "section": str(chunk.get("section", "")),
                "text": sub_text,
                "embedding": vector_to_bytes(embedding),
            }

            if sub_total > 1:
                fields["chunk_sub_id"] = stable_chunk_id

            try:
                client.hset(key, mapping=fields)
            except Exception as exc:
                eprint(f"Failed to index chunk {stable_chunk_id}: {exc}")
                return 2

            if args.progress:
                print(
                    json.dumps(
                        {
                            "type": "progress",
                            "stage": "index",
                            "current": current,
                            "total": total,
                            "message": f"Indexing {stable_chunk_id} ({current}/{total})",
                        }
                    ),
                    flush=True,
                )

    if updated_chunks:
        try:
            with open(args.chunks_json, "w", encoding="utf-8") as handle:
                json.dump(payload, handle, indent=2)
        except Exception as exc:
            eprint(f"Failed to write updated chunks JSON: {exc}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"drop_redis_index.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8
import argparse
import sys

import redis


def main() -> int:
    parser = argparse.ArgumentParser(description="Drop a RedisSearch index.")
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--drop-docs", action="store_true", help="Drop indexed documents too (DD).")
    args = parser.parse_args()

    try:
        client = redis.Redis.from_url(args.redis_url, decode_responses=True)
    except Exception as exc:
        print(f"Failed to connect to Redis: {exc}", file=sys.stderr)
        return 2

    try:
        if args.drop_docs:
            client.execute_command("FT.DROPINDEX", args.index, "DD")
        else:
            client.execute_command("FT.DROPINDEX", args.index)
    except Exception as exc:
        message = str(exc)
        if "Unknown Index name" in message or "Unknown index name" in message:
            print(f"Index {args.index} did not exist; continuing.", file=sys.stderr)
            return 0
        print(f"Failed to drop index {args.index}: {exc}", file=sys.stderr)
        return 2

    print(f"Dropped index {args.index}{' (DD)' if args.drop_docs else ''}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"ocr_layered_pdf.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8
import argparse
import io
import json
import os
import shutil
import sys

from typing import Optional

from pdf2image import convert_from_path
from pypdf import PdfReader, PdfWriter
import pytesseract


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


def emit_progress(current: int, total: int) -> None:
    print(json.dumps({"type": "progress", "current": current, "total": total}), flush=True)


def resolve_poppler_path(explicit: Optional[str]) -> Optional[str]:
    if explicit:
        return explicit
    if shutil.which("pdfinfo") or shutil.which("pdftoppm"):
        return None
    for candidate in ("/opt/homebrew/bin", "/usr/local/bin"):
        if os.path.isfile(os.path.join(candidate, "pdfinfo")) or os.path.isfile(
            os.path.join(candidate, "pdftoppm")
        ):
            return candidate
    return None


def resolve_tesseract_path(explicit: Optional[str]) -> Optional[str]:
    if explicit:
        return explicit
    found = shutil.which("tesseract")
    if found:
        return found
    for candidate in ("/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract"):
        if os.path.isfile(candidate):
            return candidate
    return None


def get_page_count(pdf_path: str) -> int:
    try:
        reader = PdfReader(pdf_path)
        return len(reader.pages)
    except Exception:
        return 0


def ocr_page_to_pdf(image, language: str) -> Optional[bytes]:
    try:
        return pytesseract.image_to_pdf_or_hocr(image, extension="pdf", lang=language)
    except Exception as exc:
        eprint(f"Tesseract OCR failed: {exc}")
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a PDF with an OCR text layer via Tesseract.")
    parser.add_argument("--pdf", required=True, help="Input PDF path")
    parser.add_argument("--out-pdf", required=True, help="Output PDF path")
    parser.add_argument("--language", default="eng", help="Tesseract language code, e.g. eng, deu+eng")
    parser.add_argument("--dpi", type=int, default=300, help="Rasterization DPI")
    parser.add_argument("--poppler-path", help="Optional poppler bin path (pdfinfo/pdftoppm)")
    parser.add_argument("--tesseract-path", help="Optional tesseract binary path")
    parser.add_argument("--progress", action="store_true", help="Emit JSON progress events")
    args = parser.parse_args()

    if not os.path.isfile(args.pdf):
        eprint(f"PDF not found: {args.pdf}")
        return 2

    out_dir = os.path.dirname(args.out_pdf)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    poppler_path = resolve_poppler_path(args.poppler_path)
    if poppler_path:
        eprint(f"Poppler not on PATH; using {poppler_path}")
    tesseract_path = resolve_tesseract_path(args.tesseract_path)
    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        if not shutil.which("tesseract"):
            eprint(f"Tesseract not on PATH; using {tesseract_path}")

    total_pages = get_page_count(args.pdf)
    if total_pages <= 0:
        try:
            images = convert_from_path(args.pdf, dpi=args.dpi, poppler_path=poppler_path)
        except Exception as exc:
            eprint(f"Failed to rasterize PDF: {exc}")
            return 2
        total_pages = len(images)
        images_by_index = {idx + 1: img for idx, img in enumerate(images)}
    else:
        images_by_index = {}

    if total_pages == 0:
        eprint("No pages detected in PDF.")
        return 2

    writer = PdfWriter()
    language = (args.language or "eng").strip() or "eng"

    for page_idx in range(1, total_pages + 1):
        if page_idx in images_by_index:
            image = images_by_index[page_idx]
        else:
            try:
                images = convert_from_path(
                    args.pdf,
                    dpi=args.dpi,
                    first_page=page_idx,
                    last_page=page_idx,
                    poppler_path=poppler_path,
                )
            except Exception as exc:
                eprint(f"Failed to rasterize page {page_idx}: {exc}")
                return 2
            if not images:
                continue
            image = images[0]

        pdf_bytes = ocr_page_to_pdf(image, language)
        if not pdf_bytes:
            return 2
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            if reader.pages:
                writer.add_page(reader.pages[0])
        except Exception as exc:
            eprint(f"Failed to parse OCR page {page_idx}: {exc}")
            return 2

        if args.progress:
            emit_progress(page_idx, total_pages)

    try:
        with open(args.out_pdf, "wb") as handle:
            writer.write(handle)
    except Exception as exc:
        eprint(f"Failed to write output PDF: {exc}")
        return 2

    if args.progress:
        print(json.dumps({"type": "final", "output_pdf": args.out_pdf, "pages": total_pages}), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"rag_query_redisearch.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8

import argparse
import json
import math
from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
import re
import struct
import sys
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

import redis
import requests


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")

def is_temperature_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "temperature" in lowered and (
        "not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered
    )


def is_stream_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "stream" in lowered and ("not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered)


def request_chat(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    data = response.json()
    choices = data.get("choices")
    if not choices:
        raise RuntimeError("Chat response missing choices")
    message = choices[0].get("message") or {}
    content = message.get("content")
    if not content:
        raise RuntimeError("Chat response missing content")
    return content


def request_chat_stream(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    on_delta,
) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": True,
    }
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120, stream=True)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    content_parts: List[str] = []
    for raw_line in response.iter_lines(decode_unicode=True):
        if not raw_line:
            continue
        line = raw_line.strip()
        if not line.startswith("data:"):
            continue
        data = line[5:].strip()
        if data == "[DONE]":
            break
        try:
            payload = json.loads(data)
        except Exception:
            continue
        choices = payload.get("choices") or []
        if not choices:
            continue
        delta = choices[0].get("delta") or {}
        piece = delta.get("content")
        if not piece:
            continue
        content_parts.append(piece)
        on_delta(piece)

    return "".join(content_parts)


def parse_json_list(raw: str) -> List[str]:
    if not raw:
        return []
    text = raw.strip()
    try:
        data = json.loads(text)
    except Exception:
        data = None
    if isinstance(data, dict):
        for key in ("queries", "expanded", "expansions", "items"):
            if isinstance(data.get(key), list):
                data = data.get(key)
                break
    if isinstance(data, list):
        cleaned: List[str] = []
        for item in data:
            if isinstance(item, str):
                value = item.strip()
                if value:
                    cleaned.append(value)
        return cleaned
    # Fallback: split lines or bullets
    lines = [line.strip(" -\\t") for line in text.splitlines()]
    return [line for line in lines if line]


def expand_query(
    base_url: str,
    api_key: str,
    model: str,
    query: str,
    count: int,
) -> List[str]:
    if not base_url or not model or not query or count <= 0:
        return []
    system_prompt = (
        "You expand search queries for retrieval. "
        "Return only a JSON array of strings with concise alternative queries. "
        "Do not include the original query."
    )
    user_prompt = (
        f"Original query: {query}\\n"
        f"Return {count} expanded queries as a JSON array of strings."
    )
    try:
        response = request_chat(base_url, api_key, model, 0.0, system_prompt, user_prompt)
        expanded = parse_json_list(response)
    except Exception as exc:
        eprint(f"Query expansion failed: {exc}")
        return []
    cleaned: List[str] = []
    seen: Set[str] = set()
    for item in expanded:
        value = item.strip()
        if not value:
            continue
        key = value.lower()
        if key in seen or key == query.lower():
            continue
        seen.add(key)
        cleaned.append(value)
        if len(cleaned) >= count:
            break
    return cleaned


def load_reranker(model_name: str):
    try:
        from sentence_transformers import CrossEncoder  # type: ignore
    except Exception as exc:
        eprint(f"Reranker unavailable (sentence-transformers not installed): {exc}")
        return None
    try:
        return CrossEncoder(model_name)
    except Exception as exc:
        eprint(f"Failed to load reranker model '{model_name}': {exc}")
        return None


def truncate_rerank_text(text: str, max_chars: int) -> str:
    if max_chars <= 0:
        return text
    cleaned = text.strip()
    if len(cleaned) <= max_chars:
        return cleaned
    trimmed = cleaned[:max_chars]
    last_space = trimmed.rfind(" ")
    if last_space > 0:
        trimmed = trimmed[:last_space]
    return trimmed.rstrip() + "..."


def rerank_candidates(
    reranker,
    query: str,
    candidates: List[Dict[str, Any]],
    max_chars: int,
) -> List[Dict[str, Any]]:
    if reranker is None:
        return candidates
    pairs: List[List[str]] = []
    items: List[Dict[str, Any]] = []
    for item in candidates:
        text = str(item.get("text", "") or "").strip()
        if not text:
            continue
        trimmed = truncate_rerank_text(text, max_chars)
        pairs.append([query, trimmed])
        items.append(item)
    if not pairs:
        return candidates
    try:
        scores = reranker.predict(pairs)
    except Exception as exc:
        eprint(f"Reranking failed: {exc}")
        return candidates
    scored: List[Tuple[float, int, Dict[str, Any]]] = []
    for idx, item in enumerate(items):
        try:
            score = float(scores[idx])
        except Exception:
            score = 0.0
        item["rerank_score"] = score
        scored.append((score, idx, item))
    scored.sort(key=lambda row: (-row[0], row[1]))
    return [row[2] for row in scored]


def decode_value(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value


def parse_results(raw: List[Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    if not raw or len(raw) < 2:
        return results

    for idx in range(1, len(raw), 2):
        if idx + 1 >= len(raw):
            break
        fields_raw = raw[idx + 1]
        if not isinstance(fields_raw, list):
            continue
        field_map: Dict[str, Any] = {}
        for i in range(0, len(fields_raw), 2):
            key = decode_value(fields_raw[i])
            value = decode_value(fields_raw[i + 1]) if i + 1 < len(fields_raw) else ""
            field_map[str(key)] = value
        results.append(field_map)
    return results


FIELD_TYPE_CACHE: Dict[str, Dict[str, str]] = {}


def parse_info_map(info: Any) -> Dict[str, Any]:
    if not isinstance(info, (list, tuple)):
        return {}
    it = iter(info)
    result: Dict[str, Any] = {}
    for key in it:
        value = next(it, None)
        result[str(decode_value(key))] = value
    return result


def get_field_types(client: redis.Redis, index: str) -> Dict[str, str]:
    if index in FIELD_TYPE_CACHE:
        return FIELD_TYPE_CACHE[index]
    try:
        info = client.execute_command("FT.INFO", index)
    except Exception:
        return {}
    info_map = parse_info_map(info)
    attributes = info_map.get("attributes") or info_map.get("fields") or []
    field_types: Dict[str, str] = {}
    if isinstance(attributes, (list, tuple)):
        for attr in attributes:
            if not isinstance(attr, (list, tuple)):
                continue
            attr_map: Dict[str, Any] = {}
            for i in range(0, len(attr) - 1, 2):
                attr_map[str(decode_value(attr[i]))] = decode_value(attr[i + 1])
            name = attr_map.get("identifier") or attr_map.get("attribute") or attr_map.get("name")
            ftype = attr_map.get("type")
            if name and ftype:
                field_types[str(name)] = str(ftype).upper()
    FIELD_TYPE_CACHE[index] = field_types
    return field_types


def get_index_vector_dim(
    client: redis.Redis, index_name: str, field_name: str = "embedding"
) -> Optional[int]:
    try:
        info = client.execute_command("FT.INFO", index_name)
    except Exception:
        return None
    info_map = parse_info_map(info)
    attributes = info_map.get("attributes") or info_map.get("fields") or []
    if not isinstance(attributes, (list, tuple)):
        return None
    for attr in attributes:
        if not isinstance(attr, (list, tuple)):
            continue
        attr_map: Dict[str, Any] = {}
        for i in range(0, len(attr) - 1, 2):
            attr_map[str(decode_value(attr[i]))] = decode_value(attr[i + 1])
        name = attr_map.get("attribute") or attr_map.get("identifier") or attr_map.get("name")
        if name != field_name:
            continue
        if str(attr_map.get("type", "")).upper() != "VECTOR":
            continue
        dim_value = attr_map.get("dimension") or attr_map.get("dim")
        try:
            return int(dim_value)
        except Exception:
            return None
    return None


_QUERY_STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "over",
    "under", "after", "before", "were", "was", "are", "is", "its", "their",
    "then", "than", "which", "when", "where", "have", "has", "had", "onto",
    "upon", "your", "yours", "they", "them", "these", "those", "will", "would",
    "could", "should", "about", "there", "here", "while", "what", "why", "how",
    "not", "but", "you", "your", "our", "ours", "his", "her", "she", "him",
    "also", "such", "been", "being", "out", "one", "two", "three", "four",
    "five", "six", "seven", "eight", "nine", "ten", "more", "most", "some",
    "many", "few", "each", "per", "was", "were", "did", "does", "do",
}


def extract_keywords(query: str) -> List[str]:
    raw_tokens = re.findall(r"[\\\\w'\\\\-\\u2011]{2,}", query, flags=re.UNICODE)
    keywords: List[str] = []
    def add_keyword(token: str, raw: str) -> None:
        if not token:
            return
        lower = token.lower()
        if lower in _QUERY_STOPWORDS:
            return
        keywords.append(lower)
        raw_lower = raw.lower()
        if raw_lower.endswith(("'s", "\\u2019s")) and len(lower) > 3:
            stem = lower[:-1]
            if stem and stem not in _QUERY_STOPWORDS:
                keywords.append(stem)

    for token in raw_tokens:
        cleaned = "".join(ch for ch in token if ch.isalnum())
        if not cleaned:
            continue
        if token[:1].isupper() or len(cleaned) >= 5:
            add_keyword(cleaned, token)
        if "-" in token or "\\u2011" in token:
            for part in re.split(r"[-\\u2011]+", token):
                part_clean = "".join(ch for ch in part if ch.isalnum())
                if not part_clean:
                    continue
                if part[:1].isupper() or len(part_clean) >= 4:
                    add_keyword(part_clean, part)
    seen = set()
    ordered: List[str] = []
    for token in keywords:
        if token in seen:
            continue
        seen.add(token)
        ordered.append(token)
    return ordered


def normalize_tag_token(tag: str) -> str:
    cleaned = tag.strip().lower()
    cleaned = cleaned.strip("-_,;:\u2022")
    cleaned = re.sub(r"\\s+", " ", cleaned)
    return cleaned.strip()


def parse_tag_field(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        parts = [str(item) for item in value]
    else:
        parts = re.split(r"[|,;]", str(value))
    cleaned: List[str] = []
    for part in parts:
        token = normalize_tag_token(str(part))
        if token:
            cleaned.append(token)
    return cleaned


def tag_tokens_from_tags(tags: Sequence[str]) -> Set[str]:
    tokens: Set[str] = set()
    for tag in tags:
        cleaned = normalize_tag_token(tag)
        if not cleaned:
            continue
        tokens.add(cleaned)
        tokens.update(re.findall(r"[A-Za-z0-9]+", cleaned))
    return tokens


def apply_tag_boosting(
    results: List[Dict[str, Any]],
    keywords: Sequence[str],
) -> List[Dict[str, Any]]:
    if not results or not keywords:
        return results
    keyword_set = {token.lower() for token in keywords if token}
    if not keyword_set:
        return results

    scored: List[Tuple[int, int, Dict[str, Any]]] = []
    max_score = 0
    for idx, chunk in enumerate(results):
        chunk_tags = parse_tag_field(chunk.get("chunk_tags", ""))
        item_tags = parse_tag_field(chunk.get("tags", ""))
        chunk_tokens = tag_tokens_from_tags(chunk_tags)
        item_tokens = tag_tokens_from_tags(item_tags)
        chunk_hits = len(keyword_set & chunk_tokens)
        item_hits = len(keyword_set & item_tokens)
        score = (chunk_hits * 2) + item_hits
        max_score = max(max_score, score)
        scored.append((score, idx, chunk))

    if max_score <= 0:
        return results
    scored.sort(key=lambda item: (-item[0], item[1]))
    return [item[2] for item in scored]


def search_redis_knn(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
) -> List[Dict[str, Any]]:
    raw = client.execute_command(
        "FT.SEARCH",
        index,
        f"*=>[KNN {k} @embedding $vec AS score]",
        "PARAMS",
        "2",
        "vec",
        vec,
        "SORTBY",
        "score",
        "RETURN",
        "11",
        "doc_id",
        "chunk_id",
        "attachment_key",
        "source_pdf",
        "page_start",
        "page_end",
        "section",
        "text",
        "tags",
        "chunk_tags",
        "score",
        "DIALECT",
        "2",
    )
    return parse_results(raw)


def chunk_key(item: Dict[str, Any]) -> str:
    value = item.get("chunk_id")
    if value is None:
        return ""
    return str(value)


def dedupe_by_chunk_id(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: Set[str] = set()
    deduped: List[Dict[str, Any]] = []
    for item in items:
        key = chunk_key(item)
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


_MIN_CONTEXT_CHUNKS = 3
_MIN_CONTEXT_CHARS = 1500
_MAX_ACCEPTABLE_SCORE = 0.4
_MIN_NARRATIVE_RATIO = 0.5
_MIN_CONTENT_FOR_RATIO = 4
_RERANK_MAX_CHARS_DEFAULT = 2000
_RRF_K = 60


def retrieve_chunks(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
    keywords: List[str],
    strict: bool = True,
    rrf_k: int = _RRF_K,
    rrf_log_top: int = 0,
    max_per_doc: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    vector_results = search_redis_knn(client, index, vec, k)
    retrieved = vector_results

    lexical_limit = max(k, 5)
    lexical_results = run_lexical_search(client, index, keywords, lexical_limit)
    lexical_ids: Set[str] = set()
    if lexical_results:
        for item in lexical_results:
            key = chunk_key(item)
            if key:
                lexical_ids.add(key)

        max_total = k + lexical_limit
        combined = lexical_results + retrieved
        if len(combined) > max_total:
            combined = combined[:max_total]
        retrieved = dedupe_by_chunk_id(combined)
    else:
        retrieved = dedupe_by_chunk_id(retrieved)

    if strict:
        filtered = [
            c for c in retrieved
            if is_content_chunk(c) and looks_narrative(c.get("text", ""))
        ]
        if not filtered:
            filtered = [c for c in retrieved if is_content_chunk(c)]
    else:
        filtered = [c for c in retrieved if is_content_chunk(c)]
        if not filtered:
            filtered = retrieved

    if lexical_ids:
        seen_ids = {chunk_key(item) for item in filtered if chunk_key(item)}
        for item in lexical_results:
            key = chunk_key(item)
            if not key:
                continue
            if key in seen_ids:
                continue
            text = str(item.get("text", "") or "").strip()
            if not text:
                continue
            filtered.append(item)
            seen_ids.add(key)

    metrics = compute_retrieval_metrics(retrieved, filtered)
    rrf_scores = build_rrf_scores(vector_results, lexical_results, rrf_k=rrf_k)
    ordered = order_by_rrf(filtered, rrf_scores)
    if rrf_log_top > 0:
        log_rrf_top(ordered, rrf_scores, rrf_log_top)
    ordered = apply_tag_boosting(ordered, keywords)
    ordered = apply_doc_cap(ordered, max_per_doc)
    return ordered, metrics


def run_lexical_search(
    client: redis.Redis,
    index: str,
    keywords: List[str],
    limit: int,
) -> List[Dict[str, Any]]:
    if not keywords or limit <= 0:
        return []
    tokens = ["".join(ch for ch in token if ch.isalnum()) for token in keywords]
    tokens = [token for token in tokens if token]
    if not tokens:
        return []
    text_terms = "|".join(tokens)
    tag_terms = "|".join(tokens)
    field_types = get_field_types(client, index)

    def should_include(name: str, required: bool = False) -> bool:
        if field_types:
            return required or name in field_types
        return required

    def field_is_tag(name: str) -> bool:
        return field_types.get(name, "").upper() == "TAG"

    def format_term(name: str) -> str:
        field = f"@{name}"
        if field_is_tag(name):
            return f"{field}:{{{tag_terms}}}"
        return f"{field}:({text_terms})"

    parts: List[Tuple[str, str]] = []
    if should_include("text", required=True):
        parts.append(("text", format_term("text")))
    if should_include("title"):
        parts.append(("title", format_term("title")))
    if should_include("authors"):
        parts.append(("authors", format_term("authors")))
    if should_include("tags"):
        parts.append(("tags", format_term("tags")))
    if should_include("chunk_tags"):
        parts.append(("chunk_tags", format_term("chunk_tags")))
    if should_include("doc_id"):
        parts.append(("doc_id", format_term("doc_id")))
    if not parts:
        return []
    query = "(" + " OR ".join(clause for _name, clause in parts) + ")"

    def run_search(query_text: str) -> Tuple[List[Dict[str, Any]], int]:
        raw = client.execute_command(
            "FT.SEARCH",
            index,
            query_text,
            "LIMIT",
            "0",
            str(limit),
            "RETURN",
            "11",
            "doc_id",
            "chunk_id",
            "attachment_key",
            "source_pdf",
            "page_start",
            "page_end",
            "section",
            "text",
            "tags",
            "chunk_tags",
            "score",
            "DIALECT",
            "2",
        )
        total = 0
        if isinstance(raw, list) and raw:
            try:
                total = int(raw[0])
            except Exception:
                total = 0
        return parse_results(raw), total

    def dedupe_results(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen: Set[str] = set()
        merged: List[Dict[str, Any]] = []
        for item in results:
            chunk_id = item.get("chunk_id")
            if not chunk_id:
                continue
            cid = str(chunk_id)
            if cid in seen:
                continue
            seen.add(cid)
            merged.append(item)
            if limit > 0 and len(merged) >= limit:
                break
        return merged

    try:
        results, total = run_search(query)
        if total == 0:
            fallback_results: List[Dict[str, Any]] = []
            for _name, clause in parts:
                try:
                    field_results, _ = run_search(clause)
                    fallback_results.extend(field_results)
                except Exception:
                    continue
            merged = dedupe_results(fallback_results)
            if merged:
                return merged
        return results
    except Exception:
        fallback_results = []
        for _name, clause in parts:
            try:
                field_results, _ = run_search(clause)
                fallback_results.extend(field_results)
            except Exception:
                continue
        return dedupe_results(fallback_results)

def is_content_chunk(chunk: Dict[str, Any]) -> bool:
    text = chunk.get("text", "")
    if not text:
        return False

    # 1. Minimum length (filters title pages, citations)
    if len(text) < 500:
        return False

    # 2. Must contain narrative sentences
    # (bibliographies rarely have multiple full sentences)
    if text.count(". ") < 3:
        return False

    return True

def looks_narrative(text: str) -> bool:
    if not text:
        return False

    # Must contain several complete sentences
    if text.count(". ") < 4:
        return False

    # Optional: avoid list-like text
    if text.count("\\n") > len(text) / 80:
        return False

    return True

def parse_score(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def compute_retrieval_metrics(
    raw: List[Dict[str, Any]],
    filtered: List[Dict[str, Any]],
) -> Dict[str, Any]:
    content_chunks = [chunk for chunk in raw if is_content_chunk(chunk)]
    narrative_chunks = [
        chunk for chunk in content_chunks if looks_narrative(chunk.get("text", ""))
    ]
    scores = [parse_score(chunk.get("score")) for chunk in raw]
    scores = [score for score in scores if score is not None]
    return {
        "raw_total": len(raw),
        "content_total": len(content_chunks),
        "narrative_total": len(narrative_chunks),
        "filtered_total": len(filtered),
        "filtered_chars": sum(len(str(chunk.get("text", ""))) for chunk in filtered),
        "best_score": min(scores) if scores else None,
    }

def is_short_query(query: str) -> bool:
    tokens = re.findall(r"[\\\\w]+", query, flags=re.UNICODE)
    tokens = [token for token in tokens if token]
    return len(tokens) <= 3


def should_broaden_retrieval(metrics: Dict[str, Any], k: int) -> Tuple[bool, List[str]]:
    reasons: List[str] = []
    min_chunks = min(_MIN_CONTEXT_CHUNKS, max(1, k))
    if metrics.get("filtered_total", 0) < min_chunks:
        reasons.append("few_chunks")
    if metrics.get("filtered_chars", 0) < _MIN_CONTEXT_CHARS:
        reasons.append("short_context")
    best_score = metrics.get("best_score")
    if best_score is not None and best_score > _MAX_ACCEPTABLE_SCORE:
        reasons.append("weak_scores")
    content_total = metrics.get("content_total", 0)
    filtered_total = metrics.get("filtered_total", 0)
    if content_total >= _MIN_CONTENT_FOR_RATIO:
        ratio = filtered_total / max(1, content_total)
        if ratio < _MIN_NARRATIVE_RATIO:
            reasons.append("narrative_filtered")
    return bool(reasons), reasons


def build_rrf_scores(
    vector_results: Sequence[Dict[str, Any]],
    lexical_results: Sequence[Dict[str, Any]],
    rrf_k: int = _RRF_K,
) -> Dict[str, float]:
    rrf_k = max(1, int(rrf_k))
    scores: Dict[str, float] = {}
    for rank, item in enumerate(vector_results, start=1):
        key = chunk_key(item)
        if not key:
            continue
        scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
    for rank, item in enumerate(lexical_results, start=1):
        key = chunk_key(item)
        if not key:
            continue
        scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank)
    return scores


def order_by_rrf(
    candidates: List[Dict[str, Any]],
    rrf_scores: Dict[str, float],
) -> List[Dict[str, Any]]:
    if not candidates or not rrf_scores:
        return candidates
    scored: List[Tuple[float, int, Dict[str, Any]]] = []
    for idx, item in enumerate(candidates):
        key = chunk_key(item)
        score = rrf_scores.get(key, 0.0) if key else 0.0
        scored.append((score, idx, item))
    scored.sort(key=lambda row: (-row[0], row[1]))
    return [row[2] for row in scored]


def apply_doc_cap(
    results: List[Dict[str, Any]],
    max_per_doc: int,
) -> List[Dict[str, Any]]:
    if max_per_doc <= 0 or not results:
        return results
    capped: List[Dict[str, Any]] = []
    counts: Dict[str, int] = {}
    for item in results:
        doc_id = str(item.get("doc_id", "") or "")
        if not doc_id:
            capped.append(item)
            continue
        count = counts.get(doc_id, 0)
        if count >= max_per_doc:
            continue
        counts[doc_id] = count + 1
        capped.append(item)
    return capped


def log_rrf_top(
    ordered: Sequence[Dict[str, Any]],
    rrf_scores: Dict[str, float],
    top_n: int,
) -> None:
    if top_n <= 0 or not ordered:
        return
    limit = min(top_n, len(ordered))
    eprint(f"RRF top {limit}:")
    for idx, item in enumerate(ordered[:limit], start=1):
        key = chunk_key(item)
        score = rrf_scores.get(key, 0.0) if key else 0.0
        doc_id = item.get("doc_id", "")
        chunk_id = item.get("chunk_id", "")
        vector_score = item.get("score", "")
        eprint(
            f"  {idx}. rrf={score:.6f} doc_id={doc_id} chunk_id={chunk_id} score={vector_score}"
        )


def retrieve_with_broadening(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
    keywords: List[str],
    rrf_k: int = _RRF_K,
    rrf_log_top: int = 0,
    max_per_doc: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    retrieved, metrics = retrieve_chunks(
        client,
        index,
        vec,
        k,
        keywords,
        strict=True,
        rrf_k=rrf_k,
        rrf_log_top=rrf_log_top,
        max_per_doc=max_per_doc,
    )
    broaden, _ = should_broaden_retrieval(metrics, k)
    if broaden:
        fallback_k = max(k * 2, 12)
        try:
            retrieved, _ = retrieve_chunks(
                client,
                index,
                vec,
                fallback_k,
                keywords,
                strict=False,
                rrf_k=rrf_k,
                rrf_log_top=rrf_log_top,
                max_per_doc=max_per_doc,
            )
        except Exception as exc:
            eprint(f"Fallback retrieval failed: {exc}")
    return retrieved, metrics

def build_context(retrieved: List[Dict[str, Any]]) -> str:
    blocks = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        chunk_id = chunk.get("chunk_id", "")
        source_pdf = chunk.get("source_pdf", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        score = chunk.get("score", "")
        text = chunk.get("text", "")
        pages = f"{page_start}-{page_end}"
        block = (
            f"<Document source='{source_pdf}' pages='{pages}' doc_id='{doc_id}' "
            f"chunk_id='{chunk_id}' score='{score}'>\\n{text}\\n</Document>"
        )
        blocks.append(block)
    return "\\n\\n".join(blocks)


def load_history_messages(path: str) -> List[Dict[str, Any]]:
    if not path:
        return []
    try:
        with open(path, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
    except Exception:
        return []
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    messages = payload.get("messages") if isinstance(payload, dict) else None
    if isinstance(messages, list):
        return [item for item in messages if isinstance(item, dict)]
    return []


def format_history_block(messages: List[Dict[str, Any]]) -> str:
    lines: List[str] = []
    for message in messages:
        role = str(message.get("role", "")).strip().lower()
        content = str(message.get("content", "")).strip()
        if not content:
            continue
        if role not in ("user", "assistant"):
            role = "user"
        label = "User" if role == "user" else "Assistant"
        lines.append(f"{label}: {content}")
    return "\\n".join(lines)


def extract_annotation_key(chunk_id: str) -> str:
    if not chunk_id:
        return ""
    if ":" in chunk_id:
        chunk_id = chunk_id.split(":", 1)[1]
    candidate = chunk_id.strip().upper()
    if re.fullmatch(r"[A-Z0-9]{8}", candidate):
        return candidate
    return ""


def build_citations(retrieved: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    citations: List[Dict[str, Any]] = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        chunk_id = chunk.get("chunk_id", "")
        attachment_key = chunk.get("attachment_key", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        source_pdf = chunk.get("source_pdf", "")
        key = (doc_id, attachment_key, page_start, page_end, source_pdf)
        if key in seen:
            continue
        seen.add(key)
        annotation_key = extract_annotation_key(str(chunk_id))
        citations.append({
            "doc_id": doc_id,
            "chunk_id": chunk_id,
            "attachment_key": attachment_key,
            "annotation_key": annotation_key or None,
            "page_start": page_start,
            "page_end": page_end,
            "pages": f"{page_start}-{page_end}",
            "source_pdf": source_pdf,
        })
    return citations


def main() -> int:
    parser = argparse.ArgumentParser(description="Query RedisSearch and answer with RAG.")
    parser.add_argument("--query", required=True)
    parser.add_argument("--k", type=int, default=10)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--chat-base-url", required=True)
    parser.add_argument("--chat-api-key", default="")
    parser.add_argument("--chat-model", required=True)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--stream", action="store_true")
    parser.add_argument("--history-file", help="Optional JSON file with recent chat history")
    parser.add_argument("--expand-query", action="store_true")
    parser.add_argument("--expand-count", type=int, default=3)
    parser.add_argument("--rerank", action="store_true")
    parser.add_argument("--rerank-model", default="BAAI/bge-reranker-v2-m3")
    parser.add_argument("--rerank-candidates", type=int, default=4)
    parser.add_argument("--rerank-max-chars", type=int, default=_RERANK_MAX_CHARS_DEFAULT)
    parser.add_argument("--rrf-k", type=int, default=_RRF_K)
    parser.add_argument("--rrf-log-top", type=int, default=0)
    parser.add_argument("--max-per-doc", type=int, default=0)
    args = parser.parse_args()

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)
    use_combo = bool(args.expand_query or args.rerank)
    expanded_queries: List[str] = []
    raw_query = args.query
    query_for_display = raw_query
    index_dim_cache: Optional[int] = None
    rrf_k = max(1, int(args.rrf_k or _RRF_K))
    rrf_log_top = max(0, int(args.rrf_log_top or 0))
    max_per_doc = max(0, int(args.max_per_doc or 0))

    def embed_query(query_text: str) -> bytes:
        nonlocal client, index_dim_cache
        embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, query_text)
        embedding_dim = len(embedding)
        if index_dim_cache is None:
            index_dim_cache = get_index_vector_dim(client, args.index)
        if index_dim_cache and index_dim_cache != embedding_dim:
            raise RuntimeError(f"Embedding dim mismatch: index={index_dim_cache} model={embedding_dim}")
        embedding = normalize_vector(embedding)
        return vector_to_bytes(embedding)

    if use_combo:
        if args.expand_query:
            expanded_queries = expand_query(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                raw_query,
                max(1, int(args.expand_count or 0)),
            )
        if expanded_queries:
            query_for_display = expanded_queries[0]
        candidate_multiplier = max(1, int(args.rerank_candidates or 1))
        base_k = max(1, int(args.k))
        if is_short_query(raw_query):
            base_k = max(base_k, 12)
        candidate_k = max(base_k * candidate_multiplier, base_k)
        query_variants = [raw_query] + expanded_queries
        candidates_map: Dict[str, Dict[str, Any]] = {}
        try:
            for variant in query_variants:
                vec = embed_query(variant)
                keywords = extract_keywords(variant)
                retrieved_variant, _ = retrieve_with_broadening(
                    client,
                    args.index,
                    vec,
                    candidate_k,
                    keywords,
                    rrf_k=rrf_k,
                    rrf_log_top=rrf_log_top,
                    max_per_doc=0,
                )
                for item in retrieved_variant:
                    key = chunk_key(item)
                    if not key:
                        continue
                    existing = candidates_map.get(key)
                    if not existing:
                        candidates_map[key] = item
                        continue
                    score_new = parse_score(item.get("score"))
                    score_old = parse_score(existing.get("score"))
                    if score_new is not None and (score_old is None or score_new < score_old):
                        candidates_map[key] = item
        except Exception as exc:
            eprint(f"RedisSearch query failed: {exc}")
            return 2

        candidates = list(candidates_map.values())
        if args.rerank:
            rerank_query = query_for_display or raw_query
            reranker = load_reranker(args.rerank_model)
            reranked = rerank_candidates(
                reranker,
                rerank_query,
                candidates,
                max(200, int(args.rerank_max_chars or _RERANK_MAX_CHARS_DEFAULT)),
            )
            retrieved = apply_doc_cap(reranked, max_per_doc)[:base_k]
        else:
            ordered = apply_tag_boosting(candidates, extract_keywords(raw_query))
            retrieved = apply_doc_cap(ordered, max_per_doc)[:base_k]
    else:
        try:
            vec = embed_query(raw_query)
        except Exception as exc:
            eprint(f"Failed to embed query: {exc}")
            return 2
        keywords = extract_keywords(raw_query)
        base_k = args.k
        if is_short_query(raw_query):
            base_k = max(base_k, 12)
        try:
            retrieved, _ = retrieve_with_broadening(
                client,
                args.index,
                vec,
                base_k,
                keywords,
                rrf_k=rrf_k,
                rrf_log_top=rrf_log_top,
                max_per_doc=max_per_doc,
            )
        except Exception as exc:
            eprint(f"RedisSearch query failed: {exc}")
            return 2

    context = build_context(retrieved)

    system_prompt = (
        "Use ONLY the provided context for factual claims. If insufficient, say you do not know. "
        "Chat history is only for conversational continuity or for providing concepts to be retrieved. "
        "Add inline citations using this exact format: [[cite:DOC_ID:PAGE_START-PAGE_END]]. "
        "Example: ... [[cite:ABC123:12-13]]."
    )
    history_messages = load_history_messages(args.history_file) if args.history_file else []
    history_block = format_history_block(history_messages)
    if history_block:
        history_block = f"Chat history (for reference only):\\n{history_block}\\n\\n"
    def build_user_prompt(context_block: str) -> str:
        return f"{history_block}Question: {args.query}\\n\\nContext:\\n{context_block}"

    user_prompt = build_user_prompt(context)

    citations = build_citations(retrieved)

    answer = ""
    streamed = False
    if args.stream:
        def emit(obj: Dict[str, Any]) -> None:
            print(json.dumps(obj, ensure_ascii=False), flush=True)

        try:
            answer = request_chat_stream(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
                lambda chunk: emit({"type": "delta", "content": chunk}),
            )
            streamed = True
        except Exception as exc:
            if is_stream_unsupported(str(exc)):
                streamed = False
            else:
                eprint(f"Chat request failed: {exc}")
                return 2

    if not streamed:
        try:
            answer = request_chat(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
            )
        except Exception as exc:
            eprint(f"Chat request failed: {exc}")
            return 2

    output = {
        "query": query_for_display,
        "raw_query": raw_query if expanded_queries else "",
        "expanded_queries": expanded_queries,
        "rerank_used": bool(args.rerank),
        "rerank_model": args.rerank_model if args.rerank else "",
        "answer": answer,
        "citations": citations,
        "retrieved": retrieved,
    }

    if args.stream and streamed:
        print(json.dumps({"type": "final", **output}, ensure_ascii=False), flush=True)
    else:
        print(json.dumps(output, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"search_redis.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8

import argparse
import json
import re
import sys
from typing import Any, Dict, List, Tuple

import redis


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


def decode_value(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value


def parse_results(raw: List[Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []
    if not raw or len(raw) < 2:
        return results
    for idx in range(1, len(raw), 2):
        if idx + 1 >= len(raw):
            break
        fields_raw = raw[idx + 1]
        if not isinstance(fields_raw, list):
            continue
        field_map: Dict[str, Any] = {}
        for i in range(0, len(fields_raw), 2):
            key = decode_value(fields_raw[i])
            value = decode_value(fields_raw[i + 1]) if i + 1 < len(fields_raw) else ""
            field_map[str(key)] = value
        results.append(field_map)
    return results


FIELD_TYPE_CACHE: Dict[str, Dict[str, str]] = {}


def parse_info_map(info: Any) -> Dict[str, Any]:
    if not isinstance(info, (list, tuple)):
        return {}
    it = iter(info)
    result: Dict[str, Any] = {}
    for key in it:
        value = next(it, None)
        result[str(decode_value(key))] = value
    return result


def get_field_types(client: redis.Redis, index: str) -> Dict[str, str]:
    if index in FIELD_TYPE_CACHE:
        return FIELD_TYPE_CACHE[index]
    try:
        info = client.execute_command("FT.INFO", index)
    except Exception:
        return {}
    info_map = parse_info_map(info)
    attributes = info_map.get("attributes") or info_map.get("fields") or []
    field_types: Dict[str, str] = {}
    if isinstance(attributes, (list, tuple)):
        for attr in attributes:
            if not isinstance(attr, (list, tuple)):
                continue
            attr_map: Dict[str, Any] = {}
            for i in range(0, len(attr) - 1, 2):
                attr_map[str(decode_value(attr[i]))] = decode_value(attr[i + 1])
            name = attr_map.get("identifier") or attr_map.get("attribute") or attr_map.get("name")
            ftype = attr_map.get("type")
            if name and ftype:
                field_types[str(name)] = str(ftype).upper()
    FIELD_TYPE_CACHE[index] = field_types
    return field_types


def format_field_types(field_types: Dict[str, str]) -> str:
    if not field_types:
        return "{}"
    ordered = ", ".join(f"{key}:{field_types[key]}" for key in sorted(field_types.keys()))
    return "{" + ordered + "}"


def build_query_parts(tokens: List[str], field_types: Dict[str, str]) -> List[Tuple[str, str]]:
    text_terms = "|".join(tokens)
    tag_terms = "|".join(tokens)

    def field_is_tag(name: str) -> bool:
        return field_types.get(name, "").upper() == "TAG"

    def should_include(name: str, required: bool = False) -> bool:
        if field_types:
            return required or name in field_types
        return required

    def format_term(name: str) -> str:
        field = f"@{name}"
        if field_is_tag(name):
            return f"{field}:{{{tag_terms}}}"
        return f"{field}:({text_terms})"

    parts: List[Tuple[str, str]] = []
    if should_include("text", required=True):
        parts.append(("text", format_term("text")))
    if should_include("title"):
        parts.append(("title", format_term("title")))
    if should_include("authors"):
        parts.append(("authors", format_term("authors")))
    if should_include("tags"):
        parts.append(("tags", format_term("tags")))
    if should_include("chunk_tags"):
        parts.append(("chunk_tags", format_term("chunk_tags")))
    if should_include("doc_id"):
        parts.append(("doc_id", format_term("doc_id")))
    return parts


def build_query(term: str, raw: bool, field_types: Dict[str, str]) -> Tuple[str, List[Tuple[str, str]]]:
    term = term.strip()
    if not term:
        return "", []
    if raw:
        return term, []
    raw_tokens = re.findall(r"[\\w'\\-]{2,}", term, flags=re.UNICODE)
    tokens: List[str] = []
    for token in raw_tokens:
        cleaned = "".join(ch for ch in token if ch.isalnum())
        if not cleaned:
            continue
        tokens.append(cleaned)
        if token.lower().endswith(("'s", "\\u2019s")) and len(cleaned) > 3:
            stem = cleaned[:-1]
            if stem:
                tokens.append(stem)
    tokens = [token for token in tokens if token]
    if not tokens:
        return "", []
    parts = build_query_parts(tokens, field_types)
    if not parts:
        return "", []
    return "(" + " OR ".join(term for _name, term in parts) + ")", parts


def run_search(
    client: redis.Redis,
    index: str,
    query: str,
    offset: int,
    limit: int,
) -> List[Any]:
    return client.execute_command(
        "FT.SEARCH",
        index,
        query,
        "LIMIT",
        str(max(0, offset)),
        str(max(1, limit)),
        "RETURN",
        "15",
        "doc_id",
        "chunk_id",
        "attachment_key",
        "title",
        "authors",
        "tags",
        "chunk_tags",
        "item_type",
        "year",
        "page_start",
        "page_end",
        "section",
        "source_pdf",
        "text",
        "score",
        "DIALECT",
        "2",
    )


def dedupe_results(results: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
    seen: set = set()
    merged: List[Dict[str, Any]] = []
    for item in results:
        key = item.get("chunk_id") or item.get("doc_id")
        if key is None:
            continue
        key = str(key)
        if key in seen:
            continue
        seen.add(key)
        merged.append(item)
        if limit > 0 and len(merged) >= limit:
            break
    return merged


def main() -> int:
    parser = argparse.ArgumentParser(description="Search Redis index for a term.")
    parser.add_argument("--query", required=True, help="Search term or raw RedisSearch query")
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--raw", action="store_true")
    args = parser.parse_args()

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)
    field_types = get_field_types(client, args.index)
    query, parts = build_query(args.query, args.raw, field_types)
    if not query:
        eprint("Query produced no tokens.")
        return 2
    raw = None
    try:
        raw = run_search(client, args.index, query, args.offset, args.limit)
        results = parse_results(raw)
        total = 0
        if isinstance(raw, list) and raw:
            try:
                total = int(raw[0])
            except Exception:
                total = 0
        if total == 0 and parts:
            fallback_results: List[Dict[str, Any]] = []
            for _name, clause in parts:
                try:
                    fallback_raw = run_search(client, args.index, clause, args.offset, args.limit)
                    fallback_results.extend(parse_results(fallback_raw))
                except Exception:
                    continue
            merged = dedupe_results(fallback_results, args.limit)
            if merged:
                payload = {
                    "query": query,
                    "raw_query": args.query,
                    "total": len(merged),
                    "results": merged,
                    "fallback_used": True,
                    "fallback_reason": "empty_combined_query",
                    "fallback_queries": [clause for _name, clause in parts],
                }
            else:
                payload = {
                    "query": query,
                    "raw_query": args.query,
                    "total": total,
                    "results": results,
                }
        else:
            payload = {
                "query": query,
                "raw_query": args.query,
                "total": total,
                "results": results,
            }
    except Exception as exc:
        eprint(f"RedisSearch query failed: {exc}")
        eprint(f"Search diagnostics: index={args.index} raw={args.raw} raw_query={args.query!r}")
        eprint(f"Search diagnostics: parsed_query={query!r}")
        eprint(f"Search diagnostics: field_types={format_field_types(field_types)}")
        fallback_results: List[Dict[str, Any]] = []
        failed_fields: List[str] = []
        for name, clause in parts:
            try:
                fallback_raw = run_search(client, args.index, clause, args.offset, args.limit)
                fallback_results.extend(parse_results(fallback_raw))
            except Exception as field_exc:
                failed_fields.append(name)
                eprint(f"Search diagnostics: field_query_failed field={name} query={clause!r} error={field_exc}")
        merged = dedupe_results(fallback_results, args.limit)
        payload = {
            "query": query,
            "raw_query": args.query,
            "total": len(merged),
            "results": merged,
            "fallback_queries": [clause for _name, clause in parts],
            "fallback_failed_fields": failed_fields,
        }
    payload.setdefault("field_types", field_types)
    payload.setdefault("fallback_used", False)
    payload.setdefault("fallback_reason", "")
    payload.setdefault("fallback_queries", [])
    payload.setdefault("fallback_failed_fields", [])
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"redis_diagnostics.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8

import argparse
import json
import sys
from typing import Any, Dict, Tuple

import redis


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


def decode_value(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    return value


def parse_info_map(info: Any) -> Dict[str, Any]:
    if not isinstance(info, (list, tuple)):
        return {}
    it = iter(info)
    result: Dict[str, Any] = {}
    for key in it:
        value = next(it, None)
        result[str(decode_value(key))] = value
    return result


def extract_summary(info_map: Dict[str, Any]) -> Dict[str, Any]:
    summary: Dict[str, Any] = {}
    for key in (
        "index_name",
        "num_docs",
        "num_terms",
        "max_doc_id",
        "hash_indexing_failures",
        "percent_indexed",
        "gc_stats",
    ):
        if key in info_map:
            summary[key] = decode_value(info_map[key])
    return summary


def make_json_safe(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="ignore")
    if isinstance(value, dict):
        return {str(k): make_json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [make_json_safe(item) for item in value]
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect Redis/RediSearch diagnostics.")
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    args = parser.parse_args()

    payload: Dict[str, Any] = {
        "redis_url": args.redis_url,
        "index": args.index,
    }

    try:
        client = redis.Redis.from_url(args.redis_url, decode_responses=False)
        pong = client.ping()
        payload["ping"] = bool(pong)
        try:
            info = client.execute_command("FT.INFO", args.index)
            info_map = parse_info_map(info)
            payload["ft_info"] = extract_summary(info_map)
            payload["ft_info_raw"] = {
                key: decode_value(value) for key, value in info_map.items()
            }
        except Exception as exc:
            payload["ft_info_error"] = str(exc)
    except Exception as exc:
        payload["error"] = str(exc)

    print(json.dumps(make_json_safe(payload), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"purge_redis_orphans.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8

import argparse
import json
import os
import sys
from typing import Dict, Optional, Set

import redis


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


def extract_doc_id(key: str, prefix: str) -> Optional[str]:
    if not key.startswith(prefix):
        return None
    remainder = key[len(prefix) :]
    if not remainder:
        return None
    return remainder.split(":", 1)[0] or None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Delete Redis chunk keys that have no matching cached item/chunk JSON."
    )
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--key-prefix", required=True)
    parser.add_argument("--chunk-dir", required=True)
    parser.add_argument("--item-dir", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sample", type=int, default=10)
    args = parser.parse_args()

    payload = {
        "redis_url": args.redis_url,
        "key_prefix": args.key_prefix,
        "chunk_dir": args.chunk_dir,
        "item_dir": args.item_dir,
        "dry_run": bool(args.dry_run),
    }

    try:
        client = redis.Redis.from_url(args.redis_url, decode_responses=True)
    except Exception as exc:
        eprint(f"Failed to connect to Redis: {exc}")
        return 2

    pattern = f"{args.key_prefix}*"
    doc_cache: Dict[str, bool] = {}
    orphan_doc_ids: Set[str] = set()
    keys_scanned = 0
    keys_deleted = 0
    docs_checked = 0

    pipeline = None
    if not args.dry_run:
        pipeline = client.pipeline(transaction=False)

    def doc_missing_cache(doc_id: str) -> bool:
        nonlocal docs_checked
        if doc_id in doc_cache:
            return doc_cache[doc_id]
        docs_checked += 1
        chunk_path = os.path.join(args.chunk_dir, f"{doc_id}.json")
        item_path = os.path.join(args.item_dir, f"{doc_id}.json")
        missing = not os.path.isfile(chunk_path) and not os.path.isfile(item_path)
        doc_cache[doc_id] = missing
        return missing

    try:
        for key in client.scan_iter(match=pattern, count=500):
            keys_scanned += 1
            doc_id = client.hget(key, "doc_id")
            if not doc_id:
                doc_id = extract_doc_id(key, args.key_prefix)
            if not doc_id:
                continue
            if doc_missing_cache(doc_id):
                orphan_doc_ids.add(doc_id)
                if pipeline is not None:
                    pipeline.delete(key)
                    keys_deleted += 1
                    if keys_deleted % 500 == 0:
                        pipeline.execute()
        if pipeline is not None:
            pipeline.execute()
    except Exception as exc:
        eprint(f"Failed to purge orphaned keys: {exc}")
        return 2

    payload.update(
        {
            "keys_scanned": keys_scanned,
            "keys_deleted": keys_deleted,
            "docs_checked": docs_checked,
            "orphan_doc_count": len(orphan_doc_ids),
            "sample_orphan_doc_ids": sorted(orphan_doc_ids)[: max(0, args.sample)],
        }
    )
    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"batch_index_pyzotero.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Set

from pyzotero import zotero
from tqdm import tqdm


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def load_checkpoint(path: Path) -> Set[str]:
    if not path.exists():
        return set()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        items = data.get("processed", [])
        return set(str(x) for x in items)
    except Exception:
        return set()


def save_checkpoint(path: Path, processed: Set[str]) -> None:
    payload = {"processed": sorted(processed)}
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def run_script(script: Path, args: List[str]) -> None:
    command = [sys.executable, str(script)] + args
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"Command failed: {' '.join(command)}")


def fetch_parent_item(client: zotero.Zotero, parent_key: str) -> Dict[str, Any]:
    try:
        item = client.item(parent_key)
        if isinstance(item, list):
            return item[0] if item else {}
        return item
    except Exception:
        return {}


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch index a Zotero library with Docling and RedisSearch.")
    parser.add_argument("--library-id", required=True)
    parser.add_argument("--library-type", choices=["user", "group"], required=True)
    parser.add_argument("--api-key", required=True)
    parser.add_argument("--redis-url", required=True)
    parser.add_argument("--index", required=True)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--embed-base-url", required=True)
    parser.add_argument("--embed-api-key", default="")
    parser.add_argument("--embed-model", required=True)
    parser.add_argument("--embed-include-metadata", action="store_true")
    parser.add_argument("--out-dir", default="./data")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--since", type=int)
    parser.add_argument("--reindex", action="store_true")
    args = parser.parse_args()

    out_dir = Path(args.out_dir).resolve()
    pdf_dir = out_dir / "pdfs"
    item_dir = out_dir / "items"
    doc_dir = out_dir / "docs"
    chunk_dir = out_dir / "chunks"
    checkpoint_path = out_dir / "checkpoint.json"

    for folder in (pdf_dir, item_dir, doc_dir, chunk_dir):
        ensure_dir(folder)

    processed = set() if args.reindex else load_checkpoint(checkpoint_path)

    client = zotero.Zotero(args.library_id, args.library_type, args.api_key)

    params: Dict[str, Any] = {"itemType": "attachment"}
    if args.limit:
        params["limit"] = args.limit
    if args.since:
        params["since"] = args.since

    try:
        attachments = client.everything(client.items(**params))
    except Exception as exc:
        eprint(f"Failed to fetch Zotero items: {exc}")
        return 2

    pdf_items = []
    for item in attachments:
        data = item.get("data", {})
        content_type = data.get("contentType", "") or ""
        if content_type.startswith("application/pdf"):
            pdf_items.append(item)

    script_dir = Path(__file__).resolve().parent
    docling_script = script_dir / "docling_extract.py"
    index_script = script_dir / "index_redisearch.py"

    errors: List[str] = []

    for item in tqdm(pdf_items, desc="Indexing PDFs"):
        attachment_key = item.get("key")
        if not attachment_key:
            continue
        parent_key = item.get("data", {}).get("parentItem")
        doc_id = parent_key or attachment_key

        if doc_id in processed:
            continue

        pdf_path = pdf_dir / f"{attachment_key}.pdf"
        item_path = item_dir / f"{doc_id}.json"
        doc_path = doc_dir / f"{doc_id}.md"
        chunk_path = chunk_dir / f"{doc_id}.json"

        try:
            content = client.file(attachment_key)
            if not content:
                raise RuntimeError("Empty PDF content")
            pdf_path.write_bytes(content)
        except Exception as exc:
            errors.append(f"{doc_id}: download failed ({exc})")
            continue

        try:
            metadata = fetch_parent_item(client, parent_key) if parent_key else item
            item_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
        except Exception as exc:
            errors.append(f"{doc_id}: metadata write failed ({exc})")
            continue

        try:
            run_script(
                docling_script,
                [
                    "--pdf",
                    str(pdf_path),
                    "--doc-id",
                    doc_id,
                    "--out-json",
                    str(chunk_path),
                    "--out-md",
                    str(doc_path),
                    "--chunking",
                    args.chunking,
                    "--ocr",
                    args.ocr,
                ],
            )
        except Exception as exc:
            errors.append(f"{doc_id}: docling failed ({exc})")
            continue

        try:
            index_args = [
                "--chunks-json",
                str(chunk_path),
                "--redis-url",
                args.redis_url,
                "--index",
                args.index,
                "--prefix",
                args.prefix,
                "--embed-base-url",
                args.embed_base_url,
                "--embed-api-key",
                args.embed_api_key,
                "--embed-model",
                args.embed_model,
            ]
            if args.embed_include_metadata:
                index_args.append("--embed-include-metadata")
            run_script(index_script, index_args)
        except Exception as exc:
            errors.append(f"{doc_id}: redis index failed ({exc})")
            continue

        processed.add(doc_id)
        save_checkpoint(checkpoint_path, processed)

    if errors:
        eprint("Failures:")
        for entry in errors:
            eprint(f"- {entry}")

    eprint(f"Processed {len(processed)} items. Errors: {len(errors)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"utils_embedding.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.4.8
import math
import struct
import requests
from typing import List

def normalize_vector(values: List[float]) -> List[float]:
    norm = math.sqrt(sum(v * v for v in values))
    if norm == 0:
        return values
    return [v / norm for v in values]

def vector_to_bytes(values: List[float]) -> bytes:
    return struct.pack("<" + "f" * len(values), *values)

def request_embedding(base_url: str, api_key: str, model: str, text: str) -> List[float]:
    url = base_url.rstrip("/") + "/embeddings"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    response = requests.post(url, json={"input": text, "model": model}, headers=headers, timeout=120)
    if response.status_code >= 400:
        raise RuntimeError(f"Embedding request failed: {response.status_code} {response.text}")
    payload = response.json()
    data = payload.get("data")
    if not data:
        raise RuntimeError("Embedding response missing data field")
    embedding = data[0].get("embedding")
    if not embedding:
        raise RuntimeError("Embedding response missing embedding")
    return [float(x) for x in embedding]
`,"ocr_wordlist.txt":`# zotero-redisearch-rag tool version: 0.4.8
aai
aam
abb
abge
abr
absol
abteilungs
acad
acc
acco
accu
ackley
acn
acp
actu
addie
adolphus
adress
af
afew
aff
afton
agarwal
agonized
agonizing
agrar
agt
agu
ahh
ahram
aicha
aigner
aip
aire
aj
ake
aken
ala
alanus
albeck
albers
albornoz
ald
alda
aleksandra
alfaro
alibaba
alittle
alla
allard
alli
allin
allman
allright
alongwith
alonso
ame
amelie
ameri
amg
amityville
amr
ams
analyze
analyzed
analyzing
anan
anc
anca
ance
ande
ander
andersonville
andr
andra
andrae
andrus
ands
andthe
ane
anent
ange
angelis
ani
ania
anish
anneke
anni
annis
antone
antti
anz
ao
apac
apel
aph
apl
apologize
appl
applegate
aq
arbei
arbeits
archeological
archi
ari
aris
armando
armor
arri
arrowsmith
artem
artes
arti
arvid
arxiv
asan
aschauer
ase
asi
askin
aspx
assis
asso
assoc
astro
aswell
ater
atk
atla
atlan
atleast
atmos
ats
att
atta
atten
atthe
aubry
aufge
aufl
aul
aun
aurore
ausge
auskunfts
auss
authorization
authorized
authorizing
avas
avg
avo
aw
aways
awi
ax
ay
ayres
az
azhar
bab
badgley
bagwell
baily
bains
bal
balaji
ballston
bama
banerjee
banz
barger
barnaby
baro
barret
bascom
batchelor
bayless
bayne
baynes
bayo
bbe
beall
beaty
beca
beckedahl
beetz
befor
begleit
behavior
behavioral
behaviors
beit
bek
belcher
bellum
belter
beltran
bemis
bene
bengt
benj
bepreisung
bera
beratungs
bergemann
bernal
bero
berr
berryman
berthier
bertin
bertuch
besse
bestof
beteiligungs
betz
beuth
bewertungs
bge
biblio
bibliotheks
bice
bie
bil
bildungs
bina
bir
birney
birte
bisbee
bischoff
bissell
biswas
bitkom
bitt
bjorn
bj\xF6rk
blacklight
blackwall
blaisdell
blakeley
blakely
ble
bles
blinn
blogspot
blowed
blu
bmi
bmwi
boe
boehm
boggs
bogue
boj
bol
boland
boldt
boller
boney
bonino
borchers
boren
borrego
borrmann
bos
bosman
boulanger
boult
bourdieu
boysen
bpa
brabeck
bracher
brammer
brashear
breck
breuning
breyer
bridgeman
bridgette
brien
brin
brinker
briony
bris
briscoe
brockmann
brok
brost
brubaker
brunner
bruns
bsi
bu
buchner
budrich
bui
buildin
buildup
buisson
bul
bungen
bunn
burchardt
burdett
burks
burling
busi
b\xF6hmer
b\xF6ker
b\xFChren
b\xFCr
b\xFCttner
cabeza
cade
cady
cai
cali
calif
callender
callie
cally
campania
canan
candor
caney
cantrell
cao
capi
caplan
capt
caput
carell
caribe
carmack
caron
carondelet
carpathia
carrasco
carrillo
cassel
cassell
castell
castellanos
castelli
castleman
catalog
cataloging
catalogs
cate
categorization
categorize
categorized
cates
cau
caus
cavalli
cavanaugh
cci
cco
cdi
cec
cecilie
ced
cedrik
cele
celo
centered
centering
centerline
centern
centerpiece
centimeters
centralized
cept
cera
cerf
chai
champollion
chancellorsville
chantel
chao
chapelle
chappell
characterize
characterized
characterizes
characterizing
chas
chawla
ched
chien
chil
childs
chim
chiseled
christof
christophe
chua
chul
chun
cil
cin
cio
cios
cip
cit
civ
civilized
cked
cken
clamor
clarins
claussen
cle
clearinghouse
clemons
cler
clu
cof
coinbase
colla
colo
colonized
color
colored
colorful
colors
colvin
colwell
com
commis
commu
commun
communi
compl
conant
conceptualization
condi
conf
confed
conn
consilium
const
constans
contro
cookson
coons
coord
cordis
cormack
corp
corrado
corre
corte
cortez
costas
couldn
coun
cour
courant
cov
cowles
crain
cre
crea
cremer
crippen
cris
criticize
criticized
croom
cros
crue
cta
cullum
culp
cunard
cuno
cupp
curr
curtin
cus
cutoff
dae
dage
dai
dailey
dak
dalit
dalla
dani
darko
darlin
darrow
dau
davey
dayal
ddi
decentralized
deepwater
defense
defenses
defi
delisle
delt
demeanor
demobilization
democratization
democratizing
dende
dene
denney
dennison
deppe
dept
desy
deve
devel
dhar
diarrhea
dickel
didi
didn
dier
dierkes
dietze
dif
digi
digitalization
digitization
digitize
digitized
dil
diller
dinan
dinh
dini
dipl
direc
diw
dle
doa
doan
docent
docu
doesn
dois
dol
dominika
donatella
donelson
dor
dorman
dors
dorsett
doty
dou
dowell
downtown
doz
dra
dragan
drago
dred
dren
drescher
dressler
dreyer
dri
drumm
drydock
dsgvo
dte
dto
duce
duquesne
durin
durkin
eac
ead
eadie
eam
earle
earnshaw
eastport
ebd
ebe
ebel
eberl
ebi
ebru
ecl
eco
econ
eda
edc
edi
edu
eep
eer
eero
eet
ef
effi
efl
eggenstein
egovernment
ehem
ehr
eickhoff
einge
eini
eir
ek
eldridge
ele
elearning
elec
electrolytic
elek
elevator
eley
elihu
elina
elkin
eln
els
eman
emelia
emer
emerick
emilie
emmons
emp
emphasize
emphasized
emphasizes
emphasizing
ena
enb
ence
endeavor
endeavored
endeavoring
endeavors
ene
enes
engelhardt
engi
engl
engle
engr
enke
enos
enrollment
ent
ents
entstehungs
entwicklungs
enwg
eos
epi
epicenter
epub
equaled
erc
erd
erfahrungs
erick
ern
ert
ertl
erw
ery
eso
esq
ess
esta
estab
etc
ete
etl
etta
ette
europ
europaea
europeana
evi
evtl
ew
ewr
exc
expe
exper
experi
ey
ez
eze
fabienne
fabio
fabricius
fabrizio
faelle
fairbank
fal
fam
fami
fannie
farb
farida
farrar
farris
faruk
fau
favor
favorable
favorably
favored
favorite
favorites
favors
fechner
fect
fel
fellner
fennell
fiberglass
fid
fidler
fied
fif
filippo
filson
finalized
finke
finkle
fiz
fla
flaherty
flam
flavor
fo
foltz
fom
fon
forde
formalized
fors
forschungs
forthe
fos
fournier
frac
frantz
franzen
frasier
fre
frede
fsu
fte
fue
fueled
fueling
fuer
ful
fulfill
fulfillment
fung
furth
fyfe
f\xE4
f\xF6r
f\xFCh
gabbert
gah
galler
galvanized
gan
gangen
gannon
gant
garay
garber
gart
gass
gassmann
gaynor
gebauer
gebhart
geddy
geert
gehostet
gend
gener
generalize
generalized
gennady
geoportal
georgen
georgy
gerdes
gerstner
getz
gfa
ghosh
gia
gie
gien
giga
gillam
gillen
gini
ginn
givens
glaeser
glamor
glaucus
gle
glei
gleim
glenwood
goble
goll
gonzalo
goodell
goodspeed
gorman
gov
gove
gover
govt
gow
goyal
gra
gradl
grandy
gra\xDFhoff
gree
greenlee
gress
grethe
griebel
gris
gro
groessten
groth
grubbs
grueling
gsi
guage
guid
gundlach
gung
guo
gustin
gutach
gutknecht
gvo
g\xF6tting
g\xFCnzel
haa
hadad
hadn
haight
halleck
halliday
hamblin
hammonds
handlungs
hanlon
hanni
hanser
hao
har
harari
harbors
haren
harland
harmonia
harpercollins
harrassowitz
hartig
hartung
haslinger
hasn
hatteras
hausers
hav
havard
havemann
hawken
hayashi
hayman
hazzard
hedlund
hedrick
hee
heesen
heidrich
heinke
heinzel
heise
heit
hel
helbig
helbing
hennessy
henrich
henrike
herchen
hermione
herron
hewes
heyde
hickox
hig
hight
hildreth
hillmann
hinde
hinman
hinze
hippel
hippler
hir
hirt
histo
histor
hite
hoffmeister
hoge
hogrefe
hollenbeck
holliday
holston
holzer
hom
homan
homeoffice
hon
honor
honorably
honored
honoring
honors
hoppe
hoppin
hor
horan
hori
hornbostel
horstmann
hoskins
hospitalization
hospitalized
houten
howards
hre
hu
hua
hubbell
hulbert
huma
humm
hungen
hup
hur
husted
hvac
h\xF6ck
h\xFCbner
h\xFClsmann
iai
iam
iana
iat
ib
ibero
ibi
ibs
ica
ican
ico
icr
ics
ict
ident
idf
idi
idl
idlewild
iel
ife
ifyou
igd
ight
igi
ign
ih
ihave
ihe
ij
ik
ikt
il
ilene
ilie
ille
illi
illus
ils
ime
imma
immortalized
impor
impro
imt
inan
incase
incl
includ
indi
industrialization
infact
infor
informa
ingen
ingraham
inhouse
init
injun
inkl
inl
innis
inno
innova
insbes
inslee
inso
insp
instill
inte
interagency
interes
interhyp
inthe
ione
ior
ious
ipcc
ipp
iro
irt
isadore
isc
isin
isla
ismay
isn
ison
isu
ita
ite
ithink
itis
ity
iven
iwas
iwill
ized
jaap
jabez
jahnke
jama
jamison
janna
janney
jano
jantzen
jarrett
jas
jayne
jenn
jeopardize
jeopardized
jesper
jessika
jewell
jewelry
jewett
ji
jian
jie
jif
jillian
jin
jobe
jochum
johne
jol
jolley
joost
jopp
jordon
jos
jour
jourdan
jugg
justi
juventa
jyoti
j\xF6rn
kad
kaden
kag
kalman
kaminsky
kan
kannt
karan
karina
karolin
karsch
kas
katarzyna
kaupp
kawa
keeble
kees
kei
keiser
keit
keiten
kelli
keo
ket
ketcham
khalsa
khanna
ki
kii
kiley
kilometers
kimber
kirstie
kis
kiva
klei
kli
kmu
kno
knopp
knowl
koeln
kok
kom
kommer
kommis
kommunikations
kon
konstantinos
konstanze
kontroll
konzentrations
koo
koon
koontz
koordinations
kor
kosel
kpi
krahn
kramm
krems
kretz
kreutzer
krogh
kr\xF6ger
kr\xF6ner
kuehn
kug
kuk
kul
kun
kura
kwon
kyiv
k\xE4mper
k\xF6n
k\xF6nigshausen
k\xF6nn
k\xF6ster
laban
labeled
labeling
labored
laborers
laboring
lada
laf
lafferty
lai
laidlaw
lal
lamartine
lames
lamy
landi
landin
lapointe
lar
lastig
latif
lauber
laughlin
laun
lda
leaderboard
lechler
leclair
leed
leggett
legrand
lehnert
leit
leitch
leitungs
lem
lemaire
lemay
lemuel
lenka
leopoldina
ler
lern
letty
leuze
leveled
leveln
levent
lewandowski
lhe
libri
libris
lic
lich
liche
lier
ligue
lile
lim
lindell
linne
lis
lite
litera
liv
lle
lmu
loa
loc
localized
lod
loewe
lofton
loh
loi
lon
lond
longtime
lor
loran
lorena
loring
loui
lous
lovis
lowden
lowenthal
lowrey
lsa
lse
lta
luc
lucke
lue
luella
luiz
lum
lus
lusk
luttrell
lytle
l\xE4n
l\xF6
l\xF6ser
maass
machin
madita
maes
magni
maher
mahmood
maitland
maj
mak
makin
malin
mals
mam
manas
mand
mander
maneuver
maneuverability
maneuverable
maneuvered
mans
marah
marginalized
mari
marjan
marleen
martialed
martius
martyn
marveled
marvelous
maryann
masi
massie
masur
matchen
mateus
mathers
matias
matth
mattison
maximize
mayr
maysville
mbi
mbo
mcadoo
mcclanahan
mcclelland
mccown
mccurdy
mccutcheon
mcfall
mcginnis
mcginty
mcgrady
mckeen
mckelvey
mckenney
mclaurin
mclellan
mcloughlin
mcmillen
mcnabb
mcneal
mcnulty
mcphail
mcvey
meager
meas
mechanicsburg
medi
mei
meinel
meisel
mell
memorialize
memorialized
mende
mense
ment
ments
merc
merce
merrifield
merriman
metcalf
meuser
mex
mga
michener
michi
mie
mil
mili
militar
militarization
millar
millersville
milliken
mindest
minimize
minimized
minimizing
minn
mio
mip
mis
mitscherlich
mittermaier
mobilit\xE4ts
modeler
modelers
modeling
modernization
moglich
mohican
mohler
molded
molloy
mom
moma
monopolize
montauk
mony
mooc
moocs
mor
mowry
moxley
mpi
msa
muenchen
munday
munsey
musser
m\xF6g
m\xFCnch
nace
nachdr
nad
nade
nadeau
nahme
nal
nang
napo
napp
nath
nati
natio
natu
naujoks
nauvoo
naveen
ncbi
nce
neb
nederlandse
neer
neff
neher
neighbor
neighborhood
neighboring
nel
nelles
neto
nevins
newhouse
newyork
nex
ney
nger
nickerson
nida
nien
nijmegen
nikolay
nikos
nin
nir
nis
nisha
nisse
noe
nom
nomos
noncompliance
nonexistent
normalized
northrup
nos
nott
notz
noy
nse
num
nung
nutt
nuttig
nutz
nutzungs
nuys
nwo
obj
obs
oc
occ
occurence
oclock
octo
odebrecht
odo
odr
odum
oellers
ofa
ofcourse
offe
offense
offi
offnen
offs
ofhis
ofi
oftentimes
ofthe
ofthis
ogc
ohi
ohn
ois
okey
ol
oli
olmstead
ome
ona
ond
onetime
onl
ons
onthe
oo
ood
oor
opac
opensource
openstack
opi
opr
optimized
oram
orde
orga
organi
organization
organizational
organizations
organize
organized
organizer
organizers
organizing
ori
origi
ork
orl
orn
ors
osf
osm
osswald
othe
ou
ould
oup
ous
ouse
ov
owers
owncloud
ows
oxley
oya
o\xDFwald
paal
pagano
parkhurst
parkman
parlors
parrish
parte
pasquale
patronized
patsey
patta
pau
pauer
pauley
paulina
pauly
pavillion
pawlik
pekka
pembina
penalize
pendergast
peo
peop
pepe
pepin
pernambuco
perrys
perso
persson
pers\xF6nlichkeits
petsch
pez
phe
phila
philippa
philo
phineas
phong
pietsch
pii
pil
pinus
pis
pitts
pizarro
pla
plagiarized
plaine
planungs
ple
pleasants
ples
pling
plos
plow
plowed
plowing
plows
plugins
pnas
poc
poindexter
poli
polit
politi
pom
pon
popularizing
por
posi
posix
potomac
potosi
potthoff
powe
pra
prabhakar
prac
practica
practiced
practicing
praeger
prather
presi
pressurized
prewar
pri
prin
prioritize
prized
prob
problema
proc
profesional
proj
pron
proquest
prot
proto
prov
pruitt
pryor
publ
publicized
pubmed
purdue
puschmann
puttin
p\xF6schl
qian
qu
quali
qualit\xE4ts
quan
que
quel
ques
quitman
raddatz
rade
radhakrishnan
radke
radtke
ragan
raghavan
ragsdale
raju
ral
rall
rapha
rapp
rass
rauber
ravenswood
rawlins
rda
realization
realize
realized
realizing
rebekah
reco
recognize
recognized
recognizing
redaktionsteam
redman
redstone
refueled
refueling
regener
regi
regner
reichmann
reimer
reits
rekt
rela
reli
rell
remodeled
renz
repl
resi
reso
resourcen
ressources
reto
retz
revista
revo
revolutionized
ria
ric
ridgely
rieck
rien
righ
rigor
rijksmuseum
rin
ris
risi
riv
riviere
ro
rocca
roddy
rodolphe
rohit
rohrer
rol
roo
roommate
roon
ror
rosanne
rosenblum
rowboat
rse
rubenstein
rud
rumors
rumsey
rungen
ruppert
rylan
ryman
r\xF6sch
r\xF6ttgen
r\xFCck
r\xFClke
r\xFCmelin
saas
sach
sachverst\xE4ndigenrates
sacri
safford
sager
sahr
sall
saml
sammen
samu
sandiego
sandro
sandt
sani
sanju
sanna
sanz
saro
saur
savin
savior
saylor
sbe
schachtner
schaffer
sche
schefer
schen
schenck
schland
schlitzer
schnepf
scholze
schoolcraft
schrade
schu
schul
schultes
schulungs
schwandt
sch\xE4ffler
sch\xF6nberger
sci
scientifique
scopus
scrutinized
seco
seits
seize
seized
seizing
sel
sella
seng
senger
sengupta
sens
seq
seria
sert
serv
servi
sess
sev
seve
severa
sey
shal
shalini
shan
shar
shaul
sheed
shel
shen
sheng
sher
sherrod
shing
sho
shoaib
shotwell
shoup
shreve
shu
shukla
shuler
shultz
sibel
siche
sicherheits
sidewalk
siebeck
siebold
sightlines
signa
signaled
signaling
sil
siler
simonds
sinha
siri
sizable
skaggs
skepticism
skeptics
skillful
slaven
slaw
sle
sma
smashwords
sme
smit
smits
smok
snelling
sobre
soc
soep
softwares
som
sommerville
soren
sota
soto
southwesterly
sowell
sozio
spaulding
speci
specialization
specialize
specialized
specialty
spect
spei
spiekermann
spiers
splendor
sprech
spurlock
sru
sta
staden
standardization
standardized
stanek
stansbury
starck
starnes
stata
statista
staton
stavros
stegemann
steinke
stel
stellv
stephane
ster
steyer
stillman
stimson
sto
stoll
stoppin
stor
stra
straightaway
strate
streck
streeter
strother
struct
stu
stuckey
sturges
sturtevant
sua
suc
succor
suf
sug
sugimoto
suhr
sui
sul
suleman
summarization
summarize
summarized
summarizes
summarizing
supe
supp
supt
sur
sus
sut
suzanna
swantje
sympathize
sympathizers
systematized
s\xF6llner
s\xF6nke
taggart
tak
takano
takeda
taliaferro
talmadge
tamir
tamu
tana
tann
tant
tappan
tarver
tas
tasso
taubert
tbe
teague
techn
tei
teichert
telekommunikations
tenn
tera
tert
testi
tha
thacker
thanos
ther
thetis
thi
thia
thibodeau
thie
thiel
thiemann
tho
thoma
thomaston
thornburg
thos
thueringen
thurber
tice
tidwell
tiefergehende
tien
tig
tige
tigt
til
tilson
tion
tions
tis
tite
titty
tivo
tiwari
tke
tla
tle
tna
tober
toda
tol
tolbert
tomasz
totaled
totaling
tothe
totten
toussaint
towa
towson
tra
tradeoffs
tral
traumatized
trav
traveled
traveler
travelers
traveling
tre
tremont
tren
tri
trib
trinh
tro
tru
trum
tr\xF6ger
tsukuba
tte
tubbs
tudo
tung
ture
turen
tuscarora
twen
twente
twigg
tylers
t\xE4t
ua
ual
ub
ubc
uber
uc
ucd
ueber
uel
uhl
uia
uld
uli
ull
umb
ume
umg
underhill
underrepresented
unfavorable
univ
universidad
universitaet
universit\xE4ts
unterneh
unterst\xFCtzungs
usin
usu
usw
utilization
utilize
utilized
utilizing
uu
va
vaca
vadis
valdes
valor
vania
vann
vapor
vapors
var
vari
vas
vauban
veen
velden
veritas
verma
vernet
verschie
verschiede
verwaltungs
vey
viale
vicks
vide
vidya
vierkant
vieweg
vigor
vin
vinh
vir
virg
visser
visualization
visualizations
visualizing
vive
viz
vo
voight
vorder
vorge
vorgehensmodell
vos
vossen
vox
voy
waa
wageningen
wah
wak
wallin
warrenton
wasa
washroom
wasn
wasson
wat
watercolor
watkinson
waverly
wayman
webinare
wech
wef
wegener
wei
weichert
weigel
weils
weingart
wel
wellcome
werf
wescott
wezel
wga
whe
wher
whi
whic
whitepaper
whitten
wieviel
wifi
wik
willful
willson
windeck
wis
wisc
wiss
wissenschafts
withthe
wittenburg
wmo
wofford
woll
wom
wooldridge
woolf
wor
wou
woul
wouldn
wulf
wur
wusst
wuttke
w\xE4h
w\xFCr
w\xFCthrich
xia
xiao
yager
yannis
yare
yasemin
yi
yoon
youn
yu
yumi
yun
yuval
za
zachariah
zalando
zeich
zeidler
zeng
zent
zi
zon
zung
zusam
zwi
\xF6ffent
\xF6pnv
\xFCberarb
`,"requirements.txt":`# zotero-redisearch-rag tool version: 0.4.8
docling
langcodes[data]
markdown
markdown-it-py
numpy
paddleocr[doc-parser]
paddlepaddle==3.2.2
pdf2image
pillow
pypdf
pytesseract
pyzotero
redis
requests
sentence-transformers
stopwordsiso
tqdm
wordfreq

# Optional for language normalization and spellchecking
# hunspell  # Disabled: fails to build on macOS/Python 3.13, use spylls fallback
spylls
`,"docker-compose.yml":`# zotero-redisearch-rag tool version: 0.4.8
services:
  redis-stack:
    image: redis/redis-stack-server:latest
    command: ["redis-stack-server", "/redis-stack.conf", "--dir", "/data"]
    environment:
      - REDIS_ARGS=
    ports:
      - "\${ZRR_PORT:-6379}:6379"
    volumes:
      - "\${ZRR_DATA_DIR:-./.zotero-redisearch-rag/redis-data}:/data"
      - "./redis-stack.conf:/redis-stack.conf:ro"
`,"redis-stack.conf":`# zotero-redisearch-rag tool version: 0.4.8
# Redis Stack persistence config for local RAG index
appendonly yes
appendfsync everysec

dir /data
`};var en=require("url"),Ge=async(u,p,e)=>{let n=at(u);if(n)return n;try{let t=await e.fetchZoteroChildren(p);for(let i of t){let r=In(i);if(r)return r}}catch(t){console.error("Failed to fetch Zotero children",t)}return null},at=u=>{let p=st(u);for(let e of p){let n=In(e);if(n)return n}return null},st=u=>{let p=[u.attachments,u.children,u.items,u.attachment,u.allAttachments],e=[];for(let n of p)n&&(Array.isArray(n)?e.push(...n):typeof n=="object"&&e.push(n));return e},In=u=>{var t,i,r,s,a,o;if(((r=(t=u==null?void 0:u.contentType)!=null?t:u==null?void 0:u.mimeType)!=null?r:(i=u==null?void 0:u.data)==null?void 0:i.contentType)!=="application/pdf")return null;let e=(o=(s=u==null?void 0:u.key)!=null?s:u==null?void 0:u.attachmentKey)!=null?o:(a=u==null?void 0:u.data)==null?void 0:a.key;if(!e)return null;let n=ot(u);return n?{key:e,filePath:n}:{key:e}},ot=u=>{var e,n,t,i,r,s,a,o;let p=(o=(i=(n=(e=u==null?void 0:u.links)==null?void 0:e.enclosure)==null?void 0:n.href)!=null?i:(t=u==null?void 0:u.enclosure)==null?void 0:t.href)!=null?o:(a=(s=(r=u==null?void 0:u.data)==null?void 0:r.links)==null?void 0:s.enclosure)==null?void 0:a.href;if(typeof p=="string"&&p.startsWith("file://"))try{return(0,en.fileURLToPath)(p)}catch(l){return null}return null},On=async(u,p)=>{if(u.statusCode<300||u.statusCode>=400)return null;let e=u.headers.location,n=Array.isArray(e)?e[0]:e;if(!n||typeof n!="string")return null;if(n.startsWith("file://")){let t=(0,en.fileURLToPath)(n);return p.readFile(t)}return n.startsWith("http://")||n.startsWith("https://")?p.requestLocalApi(n):null},Ue=async(u,p)=>{let e=p.buildZoteroUrl(`/${p.getZoteroLibraryPath()}/items/${u}/file`);try{let n=await p.requestLocalApiRaw(e),t=await On(n,p);if(t)return t;if(n.statusCode>=300)throw new Error(`Request failed, status ${n.statusCode}`);return n.body}catch(n){if(console.warn("Failed to download PDF from local API",n),!p.canUseWebApi())throw n;let t=p.buildWebApiUrl(`/${p.getWebApiLibraryPath()}/items/${u}/file`),i=await p.requestWebApiRaw(t),r=await On(i,p);if(r)return r;if(i.statusCode>=300)throw new Error(`Web API request failed, status ${i.statusCode}`);return i.body}};var B=require("obsidian"),be="zotero-redisearch-rag-chat",we=class extends B.ItemView{constructor(e,n){super(e);this.messages=[];this.activeSessionId="default";this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=n}getViewType(){return be}getDisplayText(){return"Zotero RAG Chat"}getIcon(){return"zrr-chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let n=e.createEl("div",{cls:"zrr-chat-header"});n.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"});let t=n.createEl("div",{cls:"zrr-chat-controls"}),i=t.createEl("div",{cls:"zrr-chat-controls-row"});this.sessionSelect=i.createEl("select",{cls:"zrr-chat-session"}),this.sessionSelect.addEventListener("change",async()=>{await this.switchSession(this.sessionSelect.value)});let r=t.createEl("div",{cls:"zrr-chat-controls-row zrr-chat-controls-actions"});this.renameButton=r.createEl("button",{cls:"zrr-chat-rename",text:"Rename",attr:{title:"Rename the current chat"}}),this.renameButton.addEventListener("click",async()=>{await this.promptRenameSession()}),this.copyButton=r.createEl("button",{cls:"zrr-chat-copy",text:"Copy",attr:{title:"Copy this chat to a new note"}}),this.copyButton.addEventListener("click",async()=>{await this.copyChatToNote()}),this.deleteButton=r.createEl("button",{cls:"zrr-chat-delete",text:"Delete",attr:{title:"Delete this chat"}}),this.deleteButton.addEventListener("click",async()=>{await this.deleteChat()}),this.newButton=r.createEl("button",{cls:"zrr-chat-new",text:"New chat",attr:{title:"Start a new chat session"}}),this.newButton.addEventListener("click",async()=>{await this.startNewChat()}),this.messagesEl=e.createEl("div",{cls:"zrr-chat-messages"});let s=e.createEl("div",{cls:"zrr-chat-input"});this.inputEl=s.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=s.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this.handleSend())}),await this.loadSessions(),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistoryForSession(this.activeSessionId)}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages),await this.loadSessions()}catch(e){console.error(e)}}async loadSessions(){let e=await this.plugin.listChatSessions();this.activeSessionId=await this.plugin.getActiveChatSessionId(),this.sessionSelect.empty();for(let n of e){let t=this.sessionSelect.createEl("option",{text:n.name});t.value=n.id,n.id===this.activeSessionId&&(t.selected=!0)}!e.some(n=>n.id===this.activeSessionId)&&e.length>0&&(this.activeSessionId=e[0].id,await this.plugin.setActiveChatSessionId(this.activeSessionId),this.sessionSelect.value=this.activeSessionId)}async promptRenameSession(){var i;let n=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId);new nn(this.app,(i=n==null?void 0:n.name)!=null?i:"New chat",async r=>{await this.plugin.renameChatSession(this.activeSessionId,r),await this.loadSessions()}).open()}async startNewChat(){await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages,{force:!0});let e=await this.plugin.createChatSession("New chat");await this.switchSession(e,{skipSave:!0})}async deleteChat(){let e=await this.plugin.listChatSessions();if(e.length<=1){new B.Notice("You must keep at least one chat.");return}let n=e.find(i=>i.id===this.activeSessionId);if(!n)return;new tn(this.app,n.name,async()=>{await this.plugin.deleteChatSession(this.activeSessionId);let i=await this.plugin.getActiveChatSessionId();await this.switchSession(i,{skipSave:!0})}).open()}async switchSession(e,n={}){!e||e===this.activeSessionId||(n.skipSave||await this.saveHistory(),this.activeSessionId=e,await this.plugin.setActiveChatSessionId(e),await this.loadSessions(),await this.loadHistory(),await this.renderAll())}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let e of this.messages)await this.renderMessage(e);this.scrollToBottom()}async renderMessage(e){let n=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${e.role}`}),t=n.createEl("div",{cls:"zrr-chat-meta-row"});t.createEl("div",{cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Zotero Assistant");let r=t.createEl("div",{cls:"zrr-chat-message-actions"}),s=r.createEl("button",{cls:"zrr-chat-message-copy zrr-chat-icon-button",attr:{title:"Copy this message","aria-label":"Copy this message"}});(0,B.setIcon)(s,"copy"),s.addEventListener("click",async d=>{d.preventDefault(),d.stopPropagation(),await this.copyMessage(e)});let a=r.createEl("button",{cls:"zrr-chat-message-delete zrr-chat-icon-button",attr:{title:"Delete this message","aria-label":"Delete this message"}});(0,B.setIcon)(a,"trash-2"),a.addEventListener("click",async d=>{d.preventDefault(),d.stopPropagation(),await this.deleteMessage(e.id)});let o=n.createEl("div",{cls:"zrr-chat-content"}),l=n.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:n,content:o,citations:l}),await this.renderMessageContent(e)}async copyMessage(e){var i,r,s;let t=(await this.plugin.formatInlineCitations(e.content||"",(i=e.citations)!=null?i:[],(r=e.retrieved)!=null?r:[])||"").trim();if(!t){new B.Notice("Nothing to copy.");return}if(!((s=navigator.clipboard)!=null&&s.writeText)){new B.Notice("Clipboard API unavailable. Select text to copy.");return}try{await navigator.clipboard.writeText(t),new B.Notice("Message copied to clipboard.")}catch(a){console.error("Failed to copy message",a),new B.Notice("Failed to copy message.")}}async deleteMessage(e){let n=this.messages.findIndex(s=>s.id===e);if(n===-1||!window.confirm("Delete this message? This cannot be undone."))return;this.messages.splice(n,1);let i=this.messageEls.get(e);i&&i.wrapper.remove(),this.messageEls.delete(e);let r=this.pendingRender.get(e);r!==void 0&&(window.clearTimeout(r),this.pendingRender.delete(e)),await this.saveHistory()}scheduleRender(e){if(this.pendingRender.has(e.id))return;let n=window.setTimeout(async()=>{this.pendingRender.delete(e.id),await this.renderMessageContent(e),this.scrollToBottom()},80);this.pendingRender.set(e.id,n)}async renderMessageContent(e){var i,r,s;let n=this.messageEls.get(e.id);if(!n)return;let t=await this.plugin.formatInlineCitations(e.content||"",(i=e.citations)!=null?i:[],(r=e.retrieved)!=null?r:[]);n.content.dataset.lastRendered!==t&&(n.content.empty(),await B.MarkdownRenderer.renderMarkdown(t,n.content,"",this.plugin),this.hookInternalLinks(n.content),n.content.dataset.lastRendered=t),n.citations.empty(),await this.renderCitations(n.citations,(s=e.citations)!=null?s:[])}hookInternalLinks(e){let n=e.querySelectorAll("a.internal-link");for(let t of Array.from(n))t.dataset.zrrBound!=="1"&&(t.dataset.zrrBound="1",this.registerDomEvent(t,"click",i=>{i.preventDefault();let r=t.getAttribute("data-href")||t.getAttribute("href")||"";r&&this.plugin.openInternalLinkInMain(r)}))}async renderCitations(e,n){if(e.empty(),!n.length)return;let t=e.createEl("details",{cls:"zrr-chat-citations-details"});t.createEl("summary",{text:`Relevant context sources (${n.length})`,cls:"zrr-chat-citations-summary"});let i=t.createEl("ul",{cls:"zrr-chat-citation-list"});for(let r of n){let s=await this.plugin.resolveCitationDisplay(r),a=i.createEl("li"),o=`${s.noteTitle} p. ${s.pageLabel}`;a.createEl("a",{text:o,href:"#"}).addEventListener("click",d=>{d.preventDefault(),this.plugin.openCitationTarget(r,s)})}}async copyChatToNote(){var i;let n=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId),t=(i=n==null?void 0:n.name)!=null?i:"New chat";await this.plugin.createChatNoteFromSession(this.activeSessionId,t,this.messages)}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new B.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new B.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let n={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(n),await this.renderMessage(n),this.scrollToBottom(),await this.saveHistory();let t={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom();let i=!1,r=this.plugin.getRecentChatHistory(this.messages.slice(0,-2));try{await this.plugin.runRagQueryStreaming(e,s=>{i=!0,t.content+=s,this.scheduleRender(t)},s=>{(!i&&(s!=null&&s.answer)||s!=null&&s.answer)&&(t.content=s.answer),Array.isArray(s==null?void 0:s.citations)&&(t.citations=s.citations),Array.isArray(s==null?void 0:s.retrieved)&&(t.retrieved=s.retrieved),this.scheduleRender(t)},r)}catch(s){console.error(s),t.content="Failed to fetch answer. See console for details.",this.scheduleRender(t)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}},nn=class extends B.Modal{constructor(p,e,n){super(p),this.initialValue=e,this.onSubmit=n}onOpen(){let{contentEl:p}=this;p.empty(),p.addClass("zrr-chat-rename-modal"),p.createEl("h3",{text:"Rename chat"});let e=this.initialValue;new B.Setting(p).setName("Name").addText(r=>{r.setValue(e),r.onChange(s=>{e=s})});let n=p.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="1rem",n.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),n.createEl("button",{text:"Save"}).addEventListener("click",()=>{let r=e.trim();if(!r){new B.Notice("Name cannot be empty.");return}this.close(),this.onSubmit(r)})}},tn=class extends B.Modal{constructor(p,e,n){super(p),this.chatName=e,this.onConfirm=n}onOpen(){let{contentEl:p}=this;p.empty(),p.createEl("h3",{text:"Delete chat"}),p.createEl("p",{text:`Delete "${this.chatName}"? This cannot be undone.`});let e=p.createEl("div");e.style.display="flex",e.style.gap="0.5rem",e.style.marginTop="1rem",e.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),e.createEl("button",{text:"Delete"}).addEventListener("click",()=>{this.close(),this.onConfirm()})}};var Fn={en:"eng",de:"deu",fr:"fra",es:"spa",it:"ita",nl:"nld",pt:"por",pl:"pol",sv:"swe"},lt=Ne["zrr-picker"],dt=Ne["zrr-chat"],zn=Ne["zrr-pdf"],Mn=80,qn=["doc_id","zotero_key","zotero_link","item_link","item_key","citekey","title","short_title","date","year","year_number","authors","editors","aliases","tags","collection_title","collection_titles","collections","collections_links","item_type","creator_summary","publication_title","book_title","journal_abbrev","volume","issue","pages","date_added","date_modified","doi","isbn","issn","publisher","place","url","language","abstract","pdf_link","item_json"],Ze=class extends m.Plugin{constructor(){super(...arguments);this.docIndex=null;this.metadataSnapshotCache=null;this.lastPythonEnvNotice=null;this.lastContainerNotice=null;this.lastZoteroApiNotice=null;this.lastRedisNotice=null;this.noteSyncTimers=new Map;this.noteSyncInFlight=new Set;this.noteSyncPending=new Set;this.noteSyncPendingDeletes=new Map;this.noteSyncSuppressed=new Set;this.noteMetadataSyncTimers=new Map;this.noteMetadataSyncInFlight=new Set;this.noteMetadataSyncPending=new Set;this.noteMetadataSyncSuppressed=new Set;this.missingDocIdWarned=new Set;this.collectionTitleCache=new Map;this.recreateMissingNotesActive=!1;this.recreateMissingNotesAbort=!1;this.recreateMissingNotesProcess=null;this.reindexCacheActive=!1;this.lastReindexFailure=null;this.lastRedisSearchTerm=""}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new Ee(this.app,this)),this.pdfSidebar=new Re({app:this.app,iconSvg:zn,resolveDocIdForNote:this.resolveDocIdForNote.bind(this),getDocIndexEntry:this.getDocIndexEntry.bind(this),hydrateDocIndexFromCache:this.hydrateDocIndexFromCache.bind(this),toVaultRelativePath:this.toVaultRelativePath.bind(this),normalizeChunkIdForNote:this.normalizeChunkIdForNote.bind(this),readChunkPayload:this.readChunkPayload.bind(this)},{extractDocIdFromDoc:Ae,findChunkStartLineInDoc:Je,parseChunkMarkerLine:Ke,extractFirstChunkMarkerFromContent:dn}),this.registerRibbonIcons(),this.registerView(be,e=>new we(e,this)),this.setupStatusBar(),this.registerNoteRenameHandler(),this.registerNoteSyncHandler(),this.registerNoteOpenHandler(),this.registerPreviewScrollSyncHandlers(),this.registerNoteDeleteMenu(),this.registerEditorExtension(fn(this)),this.registerEditorExtension(gn()),this.registerEditorExtension(this.pdfSidebar.createSyncExtension());try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.autoDetectRedisOnLoad(),this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()}),this.addCommand({id:"rebuild-doc-index-cache",name:"Rebuild doc index from cache",callback:()=>this.rebuildDocIndexFromCache()}),this.addCommand({id:"recreate-missing-notes-cache",name:"Recreate missing notes from cache (Docling + RedisSearch)",callback:()=>this.recreateMissingNotesFromCache()}),this.addCommand({id:"reindex-redis-from-cache",name:"Reindex Redis from cached chunks",callback:()=>this.reindexRedisFromCache()}),this.addCommand({id:"reindex-current-note",name:"Reindex current note from cache",callback:()=>this.reindexCurrentNoteFromCache()}),this.addCommand({id:"drop-rebuild-redis-index",name:"Drop & rebuild Redis index",callback:()=>this.dropAndRebuildRedisIndex()}),this.addCommand({id:"start-redis-stack",name:"Start Redis Stack (Docker/Podman Compose)",callback:()=>this.startRedisStack()}),this.addCommand({id:"open-docling-log",name:"Open log file",callback:()=>this.openLogFile()}),this.addCommand({id:"clear-docling-log",name:"Clear log file",callback:()=>this.clearLogFile()}),this.addCommand({id:"toggle-zrr-chunk-delete",name:"Toggle ZRR chunk exclude at cursor",editorCallback:e=>this.toggleChunkExclude(e)}),this.addCommand({id:"delete-zotero-note-cache",name:"Delete Zotero note and cached data",callback:()=>this.deleteZoteroNoteAndCache()}),this.addCommand({id:"search-redis-index",name:"Search Redis index for term",callback:()=>this.searchRedisIndex()}),this.addCommand({id:"redis-diagnostics",name:"Show Redis diagnostics",callback:()=>this.showRedisDiagnostics()}),this.addCommand({id:"purge-redis-orphans",name:"Purge Redis orphaned chunks (missing cache files)",callback:()=>this.purgeRedisOrphanedKeys()}),this.autoDetectContainerCliOnLoad(),this.settings.autoStartRedis&&this.startRedisStack(!0)}async loadSettings(){var t;let e=(t=await this.loadData())!=null?t:{},n=Object.assign({},hn,e);n.preferObsidianNoteForCitations===void 0&&typeof e.preferVaultPdfForCitations=="boolean"&&(n.preferObsidianNoteForCitations=e.preferVaultPdfForCitations),this.settings=n}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var D,I,z;try{await this.ensureBundledTools()}catch(N){new m.Notice("Failed to sync bundled tools. See console for details."),console.error(N);return}if(!await this.warnIfZoteroLocalApiUnavailable("import")&&!this.canUseWebApi())return;let n;try{n=await this.promptZoteroItem()}catch(N){new m.Notice("Zotero search failed. See console for details."),console.error(N);return}if(!n){new m.Notice("No Zotero item selected.");return}let t=(D=n.data)!=null?D:n;!t.key&&n.key&&(t.key=n.key);let i=xn(t);if(!i){new m.Notice("Could not resolve a stable doc_id from Zotero item.");return}let r=await this.resolveLanguageHint(t,(I=n.key)!=null?I:t.key),s=this.buildDoclingLanguageHint(r!=null?r:void 0),a=await Ge(t,i,{fetchZoteroChildren:this.fetchZoteroChildren.bind(this)});if(!a){new m.Notice("No PDF attachment found for item.");return}if(this.showStatusProgress("Preparing...",5),!await this.ensureRedisAvailable("import")){this.clearStatusProgress();return}let o=typeof t.title=="string"?t.title:"",l=await this.getDocIndexEntry(i);l&&new m.Notice("Item already indexed. Updating cached files and index.");let d=this.sanitizeFileName(o)||i;if(l!=null&&l.note_path)d=A.default.basename(l.note_path,".md")||d;else if(l!=null&&l.pdf_path){let N=this.toVaultRelativePath(l.pdf_path);N&&N.startsWith((0,m.normalizePath)(this.settings.outputPdfDir))&&(d=A.default.basename(N,".pdf")||d)}let c=l?d:await this.resolveUniqueBaseName(d,i),_=(0,m.normalizePath)(`${this.settings.outputPdfDir}/${c}.pdf`),g=(0,m.normalizePath)(`${Y}/${i}.json`),y=(0,m.normalizePath)(`${U}/${i}.json`),b=this.app.vault.adapter,L=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${c}.md`);if(l!=null&&l.note_path&&await b.exists(l.note_path)&&(L=(0,m.normalizePath)(l.note_path)),await b.exists(L)&&!await this.confirmOverwrite(L)){new m.Notice("Import canceled.");return}try{if(await this.ensureFolder(Y),await this.ensureFolder(U),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let N=this.getLogFileRelativePath(),F=(0,m.normalizePath)(A.default.dirname(N));F&&await this.ensureFolder(F),await this.deleteLogFileIfExists();let O=this.getSpellcheckerInfoRelativePath(),V=(0,m.normalizePath)(A.default.dirname(O));V&&await this.ensureFolder(V)}}catch(N){new m.Notice("Failed to create output folders."),console.error(N),this.clearStatusProgress();return}let f="",h="";try{if(this.settings.copyPdfToVault){let N=a.filePath?await $.promises.readFile(a.filePath):await Ue(a.key,{buildZoteroUrl:this.buildZoteroUrl.bind(this),getZoteroLibraryPath:this.getZoteroLibraryPath.bind(this),canUseWebApi:this.canUseWebApi.bind(this),buildWebApiUrl:this.buildWebApiUrl.bind(this),getWebApiLibraryPath:this.getWebApiLibraryPath.bind(this),requestLocalApiRaw:this.requestLocalApiRaw.bind(this),requestWebApiRaw:this.requestWebApiRaw.bind(this),requestLocalApi:this.requestLocalApi.bind(this),readFile:$.promises.readFile});await this.app.vault.adapter.writeBinary(_,this.bufferToArrayBuffer(N)),f=this.getAbsoluteVaultPath(_)}else if(a.filePath)f=a.filePath;else{await this.ensureFolder(this.settings.outputPdfDir);let N=await Ue(a.key,{buildZoteroUrl:this.buildZoteroUrl.bind(this),getZoteroLibraryPath:this.getZoteroLibraryPath.bind(this),canUseWebApi:this.canUseWebApi.bind(this),buildWebApiUrl:this.buildWebApiUrl.bind(this),getWebApiLibraryPath:this.getWebApiLibraryPath.bind(this),requestLocalApiRaw:this.requestLocalApiRaw.bind(this),requestWebApiRaw:this.requestWebApiRaw.bind(this),requestLocalApi:this.requestLocalApi.bind(this),readFile:$.promises.readFile});await this.app.vault.adapter.writeBinary(_,this.bufferToArrayBuffer(N)),f=this.getAbsoluteVaultPath(_),new m.Notice("Local PDF path unavailable; copied PDF into vault for processing.")}h=this.buildPdfLinkForNote(f,a.key,i)}catch(N){new m.Notice("Failed to download PDF attachment."),console.error(N),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(g,JSON.stringify(n,null,2))}catch(N){new m.Notice("Failed to write Zotero item JSON."),console.error(N),this.clearStatusProgress();return}let C=this.getPluginDir(),k=A.default.join(C,"tools","docling_extract.py"),E=A.default.join(C,"tools","index_redisearch.py"),P=null;try{P=await this.readDoclingQualityLabelFromPdf(f,s),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",P),0);let N=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;await this.runPythonStreaming(k,await this.buildDoclingArgs(f,i,y,L,s,!0),V=>this.handleDoclingProgress(V,P),()=>{},N),P=await this.readDoclingQualityLabel(y),await this.annotateChunkJsonWithAttachmentKey(y,a.key);let F=await this.readDoclingMetadata(y),O=await this.maybeCreateOcrLayeredPdf(f,F,s);O&&(f=O,h=this.buildPdfLinkFromSourcePath(O),await this.updateChunkJsonSourcePdf(y,O))}catch(N){new m.Notice("Docling extraction failed. See console for details."),console.error(N),this.clearStatusProgress();return}let w=!1;try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",P),0);let N=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null,F=["--chunks-json",this.getAbsoluteVaultPath(y),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"];this.appendEmbedSubchunkArgs(F),this.appendEmbedContextArgs(F),this.settings.embedIncludeMetadata&&F.push("--embed-include-metadata"),this.appendChunkTaggingArgs(F),await this.runPythonStreaming(E,F,O=>{if((O==null?void 0:O.type)==="progress"&&O.total){let V=Math.round(O.current/O.total*100),X=typeof O.message=="string"&&O.message.trim()?O.message:`Indexing chunks ${O.current}/${O.total}`,T=this.formatStatusLabel(X,P);this.showStatusProgress(T,V)}},()=>{})}catch(N){let F=this.getPythonErrorMessage(N),O=this.classifyIndexingError(F);if(console.error(N),O==="embed_dim_mismatch")if(await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema. Switch to a model with matching dimensions, or drop/rebuild the index."))try{if(await this.dropRedisIndex(!0),!await this.reindexRedisFromCache()){this.clearStatusProgress(),this.lastReindexFailure==="embed_failure"?new m.Notice("Embedding provider error detected while rebuilding the Redis index. Fix the provider/model settings and retry import."):new m.Notice("Redis index rebuild did not complete. Import stopped.");return}new m.Notice("Redis index rebuilt; resuming import."),w=!0}catch(X){this.clearStatusProgress(),new m.Notice("Failed to drop/rebuild the Redis index. See console for details."),console.error(X);return}else{this.clearStatusProgress(),new m.Notice("Indexing aborted due to embedding dimension mismatch. Switch models or drop/rebuild the index.");return}if(!w){if(O==="embed_failure"){this.clearStatusProgress(),new m.Notice("Embedding provider error detected. Fix the provider/model settings and rerun.");return}this.clearStatusProgress(),new m.Notice("RedisSearch indexing failed. See console for details.");return}}try{let N=await this.app.vault.adapter.read(L),F=await this.readChunkPayload(y),O=this.buildSyncedDoclingContent(i,F,N),V=await this.buildNoteMarkdown(t,(z=n.meta)!=null?z:{},i,h,a.key,g,O);await this.writeNoteWithSyncSuppressed(L,V)}catch(N){new m.Notice("Failed to finalize note markdown."),console.error(N),this.clearStatusProgress();return}try{let N=he(t);await this.updateDocIndex({doc_id:i,note_path:L,note_title:c,zotero_title:o,short_title:N||void 0,pdf_path:f,attachment_key:a.key})}catch(N){console.error("Failed to update doc index",N)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new m.Notice(`Indexed Zotero item ${i}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var n;let e=this.app.workspace.getLeavesOfType(be);return e.length>0?e[0]:this.settings.chatPaneLocation==="right"?(n=this.app.workspace.getRightLeaf(!1))!=null?n:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let n=this.getChatLeaf();await n.setViewState({type:be,active:!0}),this.app.workspace.revealLeaf(n);let t=n.view;return t instanceof we&&e&&t.focusInput(),t}async loadChatHistory(){let e=await this.getActiveChatSessionId();return this.loadChatHistoryForSession(e)}async saveChatHistory(e){let n=await this.getActiveChatSessionId();await this.saveChatHistoryForSession(n,e)}getChatSessionsDir(){return(0,m.normalizePath)(`${J}/chats`)}getChatExportDir(){let e=(this.settings.chatOutputDir||"").trim();return e?(0,m.normalizePath)(e):(0,m.normalizePath)("zotero/chats")}getChatSessionsIndexPath(){return(0,m.normalizePath)(`${this.getChatSessionsDir()}/index.json`)}getChatSessionPath(e){return(0,m.normalizePath)(`${this.getChatSessionsDir()}/${e}.json`)}async listChatSessions(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath();if(!await e.exists(n)){let t=new Date().toISOString(),i=[{id:"default",name:"New chat",createdAt:t,updatedAt:t}];return await this.writeChatSessionsIndex({version:1,active:"default",sessions:i}),i}try{let t=await e.read(n),i=JSON.parse(t);return(Array.isArray(i==null?void 0:i.sessions)?i.sessions:[]).filter(s=>s&&typeof s.id=="string").map(s=>({id:String(s.id),name:typeof s.name=="string"&&s.name.trim()?s.name.trim():String(s.id),createdAt:typeof s.createdAt=="string"?s.createdAt:new Date().toISOString(),updatedAt:typeof s.updatedAt=="string"?s.updatedAt:new Date().toISOString()}))}catch(t){return console.warn("Failed to read chat sessions index",t),[]}}async getActiveChatSessionId(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath();if(!await e.exists(n))return"default";try{let t=await e.read(n),i=JSON.parse(t);return(typeof(i==null?void 0:i.active)=="string"?i.active:"default")||"default"}catch(t){return"default"}}async setActiveChatSessionId(e){var s,a;await this.migrateLegacyChatHistory();let n=await this.readChatSessionsIndex(),t=((s=n.sessions)!=null?s:[]).some(o=>o.id===e),i=new Date().toISOString(),r=t?n.sessions:[...(a=n.sessions)!=null?a:[],{id:e,name:e,createdAt:i,updatedAt:i}];await this.writeChatSessionsIndex({version:1,active:e,sessions:r})}async createChatSession(e){var a;await this.migrateLegacyChatHistory();let n=this.generateChatId(),t=new Date().toISOString(),i=(e||"").trim()||"New chat",s=[...(a=(await this.readChatSessionsIndex()).sessions)!=null?a:[],{id:n,name:i,createdAt:t,updatedAt:t}];return await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionPath(n),JSON.stringify({version:1,messages:[]},null,2)),await this.writeChatSessionsIndex({version:1,active:n,sessions:s}),n}async renameChatSession(e,n){var s,a;await this.migrateLegacyChatHistory();let t=(n||"").trim();if(!t)return;let i=await this.readChatSessionsIndex(),r=((s=i.sessions)!=null?s:[]).map(o=>o.id===e?{...o,name:t}:o);await this.writeChatSessionsIndex({version:1,active:(a=i.active)!=null?a:"default",sessions:r})}async deleteChatSession(e){var a;if(await this.migrateLegacyChatHistory(),!e)return;let n=this.app.vault.adapter,t=await this.readChatSessionsIndex(),i=(a=t.sessions)!=null?a:[];if(i.length<=1)return;let r=i.filter(o=>o.id!==e);if(!r.length)return;let s=t.active===e?r[0].id:t.active;try{await n.remove(this.getChatSessionPath(e))}catch(o){console.warn("Failed to delete chat session file",o)}await this.writeChatSessionsIndex({version:1,active:s,sessions:r})}async loadChatHistoryForSession(e){await this.migrateLegacyChatHistory();let n=this.app.vault.adapter,t=this.getChatSessionPath(e||"default");if(!await n.exists(t))return[];let i=await n.read(t),r;try{r=JSON.parse(i)}catch(a){return[]}let s=Array.isArray(r)?r:r==null?void 0:r.messages;return Array.isArray(s)?s.filter(a=>a&&typeof a.content=="string").map(a=>({id:a.id||this.generateChatId(),role:a.role==="assistant"?"assistant":"user",content:a.content,citations:Array.isArray(a.citations)?a.citations:[],retrieved:Array.isArray(a.retrieved)?a.retrieved:[],createdAt:a.createdAt||new Date().toISOString()})):[]}async saveChatHistoryForSession(e,n){var l,d;await this.migrateLegacyChatHistory(),await this.ensureFolder(this.getChatSessionsDir());let t=this.app.vault.adapter,i=this.getChatSessionPath(e||"default"),r={version:1,messages:n};await t.write(i,JSON.stringify(r,null,2));let s=await this.readChatSessionsIndex(),a=new Date().toISOString(),o=((l=s.sessions)!=null?l:[]).map(c=>c.id===e?{...c,updatedAt:a}:c);await this.writeChatSessionsIndex({version:1,active:(d=s.active)!=null?d:e,sessions:o})}getRecentChatHistory(e){let n=Math.max(0,this.settings.chatHistoryMessages||0);return n?e.filter(i=>{var r;return i&&((r=i.content)==null?void 0:r.trim())}).slice(-n):[]}async readChatSessionsIndex(){let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath(),t=new Date().toISOString();if(!await e.exists(n))return{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:t,updatedAt:t}]};try{let i=await e.read(n),r=JSON.parse(i),s=Array.isArray(r==null?void 0:r.sessions)?r.sessions:[];return{version:1,active:typeof(r==null?void 0:r.active)=="string"?r.active:"default",sessions:s.map(a=>({id:String(a.id),name:typeof a.name=="string"&&a.name.trim()?a.name.trim():String(a.id),createdAt:typeof a.createdAt=="string"?a.createdAt:t,updatedAt:typeof a.updatedAt=="string"?a.updatedAt:t}))}}catch(i){return console.warn("Failed to parse chat sessions index",i),{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:t,updatedAt:t}]}}}async writeChatSessionsIndex(e){await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionsIndexPath(),JSON.stringify(e,null,2))}async migrateLegacyChatHistory(){let e=this.app.vault.adapter,n=(0,m.normalizePath)(`${J}/chat.json`),t=this.getChatSessionsDir(),i=this.getChatSessionsIndexPath(),r=this.getChatSessionPath("default"),s=await e.exists(n),a=await e.exists(r),o=await e.exists(i);if(!s&&o)return;let l=new Date().toISOString();if(await this.ensureFolder(t),s&&!a)try{await e.rename(n,r)}catch(d){try{let c=await e.read(n);await e.write(r,c),await e.remove(n)}catch(c){console.warn("Failed to migrate legacy chat history",c)}}if(!o){let d=[{id:"default",name:"New chat",createdAt:l,updatedAt:l}];await this.writeChatSessionsIndex({version:1,active:"default",sessions:d})}if(o)try{let d=await e.read(i),c=JSON.parse(d),_=Array.isArray(c==null?void 0:c.sessions)?c.sessions:[],g=_.some(b=>(b==null?void 0:b.id)==="default"),y=_.map(b=>(b==null?void 0:b.id)==="default"&&typeof(b==null?void 0:b.name)=="string"&&b.name.trim().toLowerCase()==="default"?{...b,name:"New chat"}:b);g&&JSON.stringify(y)!==JSON.stringify(_)&&await this.writeChatSessionsIndex({version:1,active:typeof(c==null?void 0:c.active)=="string"?c.active:"default",sessions:y.map(b=>({id:String(b.id),name:typeof b.name=="string"?b.name:"New chat",createdAt:typeof b.createdAt=="string"?b.createdAt:l,updatedAt:typeof b.updatedAt=="string"?b.updatedAt:l}))})}catch(d){}}isPlaceholderChatName(e){let n=(e||"").trim().toLowerCase();return n==="new chat"||n==="default"}normalizeChatTitle(e){let n=(e||"").replace(/\s+/g," ").trim();return n.length>60?`${n.slice(0,57)}...`:n}guessTitleFromMessages(e){let n=e.find(i=>i.role==="user"&&i.content.trim());if(!n)return"New chat";let t=n.content.replace(/\s+/g," ").trim().split(" ").slice(0,8).join(" ");return this.normalizeChatTitle(t||"New chat")}async suggestChatTitleWithLlm(e){var s,a,o;let n=(this.settings.chatBaseUrl||"").trim(),t=(this.settings.chatModel||"").trim();if(!n||!t)return null;let i=n.replace(/\/$/,"");if(i.toLowerCase().includes("api.openai.com")&&(!this.settings.chatApiKey||t.includes("/")))return null;try{let l=`${i}/chat/completions`,d={"Content-Type":"application/json"};this.settings.chatApiKey&&(d.Authorization=`Bearer ${this.settings.chatApiKey}`);let c=e.slice(-8).map(L=>`${L.role.toUpperCase()}: ${L.content}`).join(`
`).slice(0,4e3),g=await fetch(l,{method:"POST",headers:d,body:JSON.stringify({model:t,temperature:.2,messages:[{role:"system",content:"Generate a short, specific title (3-7 words) for the chat. No quotes, no punctuation at the end."},{role:"user",content:c}]})});if(!g.ok)return null;let y=await g.json(),b=(o=(a=(s=y==null?void 0:y.choices)==null?void 0:s[0])==null?void 0:a.message)==null?void 0:o.content;return typeof b!="string"?null:this.normalizeChatTitle(b.replace(/^\"|\"$/g,"").trim())}catch(l){return console.warn("Chat title suggestion failed",l),null}}async finalizeChatSessionNameIfNeeded(e,n,t={}){var d;if(!e)return;let i=n||[];if(!i.some(c=>c.role==="user"&&c.content.trim())||!t.force&&i.length<4)return;let a=((d=(await this.readChatSessionsIndex()).sessions)!=null?d:[]).find(c=>c.id===e);if(!a||!this.isPlaceholderChatName(a.name))return;let l=await this.suggestChatTitleWithLlm(i)||this.guessTitleFromMessages(i);!l||this.isPlaceholderChatName(l)||await this.renameChatSession(e,l)}async runRagQueryStreaming(e,n,t,i=[]){if(await this.ensureBundledTools(),!await this.ensureRedisAvailable("chat query")){t({answer:"Redis is not reachable. Please start Redis Stack and try again."});return}let r=this.getPluginDir(),s=A.default.join(r,"tools","rag_query_redisearch.py"),a=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"];if(this.settings.enableQueryExpansion&&(a.push("--expand-query"),a.push("--expand-count",String(Math.max(1,Math.trunc(this.settings.queryExpansionCount))))),this.settings.enableCrossEncoderRerank){a.push("--rerank");let d=(this.settings.rerankModel||"").trim();d&&a.push("--rerank-model",d)}Number.isFinite(this.settings.rerankCandidateMultiplier)&&a.push("--rerank-candidates",String(Math.max(1,Math.trunc(this.settings.rerankCandidateMultiplier)))),Number.isFinite(this.settings.rrfK)&&a.push("--rrf-k",String(Math.max(1,Math.trunc(this.settings.rrfK)))),Number.isFinite(this.settings.rrfLogTop)&&this.settings.rrfLogTop>0&&a.push("--rrf-log-top",String(Math.max(1,Math.trunc(this.settings.rrfLogTop)))),Number.isFinite(this.settings.maxChunksPerDoc)&&this.settings.maxChunksPerDoc>0&&a.push("--max-per-doc",String(Math.max(1,Math.trunc(this.settings.maxChunksPerDoc))));let o=this.buildChatHistoryPayload(i),l=await this.writeChatHistoryTemp(o);l!=null&&l.absolutePath&&a.push("--history-file",l.absolutePath);try{let d=async()=>{await this.runPythonStreaming(s,a,_=>{if((_==null?void 0:_.type)==="delta"&&typeof _.content=="string"){n(_.content);return}if((_==null?void 0:_.type)==="final"){t(_);return}_!=null&&_.answer&&t(_)},t)},c=!1;for(;;)try{await d();break}catch(_){let g=this.getPythonErrorMessage(_),y=this.classifyIndexingError(g);if(y==="embed_dim_mismatch"){if(c){t({answer:"Embedding dimension mismatch persists after rebuild. Check the embedding model settings."});return}if(!await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema.")){t({answer:"Embedding dimension mismatch. Switch models or drop/rebuild the Redis index."});return}try{if(await this.dropRedisIndex(!0),!await this.reindexRedisFromCache()){let f=this.lastReindexFailure==="embed_failure"?"Embedding provider error detected while rebuilding the index. Fix settings and retry.":"Redis index rebuild did not complete. Chat query stopped.";t({answer:f});return}}catch(L){console.error(L),t({answer:"Failed to drop/rebuild the Redis index. See console for details."});return}c=!0;continue}if(y==="embed_failure"){t({answer:"Embedding provider error detected. Fix the provider/model settings and retry."});return}throw _}}finally{if(l!=null&&l.relativePath)try{await this.app.vault.adapter.remove(l.relativePath)}catch(d){console.warn("Failed to remove chat history temp file",d)}}}buildChatHistoryPayload(e){return this.getRecentChatHistory(e).map(t=>({role:t.role,content:t.content}))}async writeChatHistoryTemp(e){if(!e.length)return null;let n=(0,m.normalizePath)(`${J}/tmp`);await this.ensureFolder(n);let t=`chat_history_${Date.now()}_${Math.random().toString(36).slice(2,8)}.json`,i=(0,m.normalizePath)(`${n}/${t}`),r={version:1,messages:e};return await this.app.vault.adapter.write(i,JSON.stringify(r,null,2)),{relativePath:i,absolutePath:this.getAbsoluteVaultPath(i)}}async resolveCitationDisplay(e){let n=await this.getDocIndexEntry(e.doc_id);(!n||!n.note_title||!n.zotero_title||!n.note_path||!n.pdf_path||n.short_title===void 0)&&(n=await this.hydrateDocIndexFromCache(e.doc_id));let t=e.doc_id?await this.resolveNotePathForDocId(e.doc_id):n==null?void 0:n.note_path,i=this.resolveCitationTitle(n,t,e.doc_id),r=this.formatCitationPageLabel(e),s=e.page_start?String(e.page_start):"",a=(n==null?void 0:n.pdf_path)||e.source_pdf||"",o=e.attachment_key||(n==null?void 0:n.attachment_key),l=e.annotation_key||this.extractAnnotationKey(e.chunk_id),d=e.doc_id?this.buildZoteroDeepLink(e.doc_id,o,s,l):void 0;return{noteTitle:i,pageLabel:r,notePath:t||void 0,pdfPath:a||void 0,zoteroUrl:d,pageStart:s||void 0}}resolveCitationTitle(e,n,t){let i=t||"?",r=(e==null?void 0:e.short_title)||(e==null?void 0:e.zotero_title)||(e==null?void 0:e.note_title)||(n?A.default.basename(n,".md"):"")||i;return this.shortenCitationTitle(r)}shortenCitationTitle(e){let n=String(e||"").trim();if(!n)return"?";if(n.length<=Mn)return n;let t=Math.max(0,Mn-3);return`${n.slice(0,t).trim()}...`}formatCitationLabel(e,n){let t=e.trim()||"?",i=(n||"").trim();return i?`${t}, p. ${i}`:t}async formatInlineCitations(e,n,t=[]){var d,c;if(!e)return e;let i=/\[\[?cite:([A-Za-z0-9]+):([^\]\n]+?)\]?\]/g,r=Array.from(e.matchAll(i));if(r.length===0)return e;let s=new Map;for(let _ of r){let g=_[0];if(s.has(g))continue;let y=_[1],b=_[2].trim(),L=b.match(/^(\d+)-(\d+)(?::([A-Za-z0-9]+))?$/),f="",h="",C,k;L?(f=L[1],h=L[2],C=L[3]):k=b;let E=k?t.find(N=>{let F=typeof N.doc_id=="string"?N.doc_id:"";if(F&&F!==y)return!1;let O=typeof N.chunk_id=="string"?N.chunk_id:"";return O?O===k||O===`${y}:${k}`||O.endsWith(`:${k}`):!1}):void 0;E&&(!f&&E.page_start!==void 0&&(f=String(E.page_start)),!h&&E.page_end!==void 0&&(h=String(E.page_end)),!C&&typeof E.chunk_id=="string"&&(C=this.extractAnnotationKey(E.chunk_id)));let P={doc_id:y,chunk_id:E==null?void 0:E.chunk_id,annotation_key:C};(f||h)&&(P.page_start=f||h,P.page_end=h||f,P.pages=`${P.page_start}-${P.page_end}`),E!=null&&E.source_pdf&&(P.source_pdf=String(E.source_pdf));let w=(f||h?n.find(N=>{var F,O;return N.doc_id===y&&String((F=N.page_start)!=null?F:"")===f&&String((O=N.page_end)!=null?O:"")===h}):void 0)||n.find(N=>N.doc_id===y)||P;!w.annotation_key&&C&&(w={...w,annotation_key:C});let D=await this.resolveCitationDisplay(w),I=this.formatCitationLabel(D.noteTitle,D.pageLabel),z=this.normalizeChunkIdForNote(w.chunk_id,y);if(this.settings.preferObsidianNoteForCitations&&D.notePath&&z)s.set(g,this.buildNoteChunkLink(D.notePath,z,I));else if(D.zoteroUrl)s.set(g,`[${I}](${D.zoteroUrl})`);else{let N=this.formatCitationLabel(y,D.pageLabel);s.set(g,`(${N})`)}}let a=[],o=0;for(let _ of r){let g=_[0],y=(d=_.index)!=null?d:0;if(y<o)continue;a.push(e.slice(o,y));let b=(c=s.get(g))!=null?c:g,L=y>0?e[y-1]:"";L&&!/\s/.test(L)&&!/[\(\[\{!]/.test(L)&&a.push(" "),a.push(b),o=y+g.length}a.push(e.slice(o));let l=a.join("");return this.repairTruncatedWikilinks(l)}repairTruncatedWikilinks(e){if(!e||typeof e!="string")return e;let n=e;return n=n.replace(/\[\[([^\]\n#]+#zrr-chunk:[^\]\n|]+)(?=\n|$)/g,"[[$1]]"),n=n.replace(/\[\[([^\]\n#]+#zrr-chunk:([^\]\n|]+))\]\]/g,(t,i,r)=>{let s=this.escapeWikiLabel(this.buildDefaultChunkLabel(String(r||"").trim()));return`[[${i}\\|${s}]]`}),n}buildDefaultChunkLabel(e){let n=(e||"").trim(),t=n.match(/^p(\d+)$/i);return t?`p. ${t[1]}`:n||"source"}handleDoclingProgress(e,n){if(!e||e.type!=="progress")return;let t=Number(e.percent);if(!Number.isFinite(t))return;let i=typeof e.message=="string"&&e.message.trim()?e.message:"Docling extraction...";this.showStatusProgress(this.formatStatusLabel(i,n),Math.round(t))}async createChatNoteFromSession(e,n,t){let i=this.getChatExportDir();await this.ensureFolder(i),await this.getDocIndex();let r=this.sanitizeFileName(n)||"Zotero Chat",s=this.formatTimestamp(new Date),a=(0,m.normalizePath)(`${i}/${r}.md`),o=await this.resolveUniqueNotePath(a,`${r}-${s}.md`),l=await this.buildChatTranscript(n,t);await this.app.vault.adapter.write(o,l),await this.openNoteInNewTab(o),new m.Notice(`Chat copied to ${o}`)}async buildChatTranscript(e,n){var i,r,s;let t=[];t.push(`# ${e||"Zotero Chat"}`),t.push(""),t.push(`Created: ${new Date().toISOString()}`),t.push("");for(let a of n){let o=a.role==="user"?"## You":"## Assistant";t.push(o),t.push("");let l=a.role==="assistant"?await this.formatInlineCitations(a.content||"",(i=a.citations)!=null?i:[],(r=a.retrieved)!=null?r:[]):a.content||"";if(t.push(l.trim()),t.push(""),a.role==="assistant"&&((s=a.citations)!=null&&s.length)){t.push("### Relevant context sources");let d=this.formatCitationsMarkdown(a.citations);d&&(t.push(d),t.push(""))}}return t.join(`
`).trim()+`
`}async resolveUniqueNotePath(e,n){let t=this.app.vault.adapter;if(!await t.exists(e))return e;let i=A.default.dirname(e),r=(0,m.normalizePath)(A.default.join(i,n));if(!await t.exists(r))return r;let s=2;for(;s<1e3;){let a=(0,m.normalizePath)(A.default.join(i,`${A.default.basename(n,".md")}-${s}.md`));if(!await t.exists(a))return a;s+=1}return r}formatTimestamp(e){let n=t=>String(t).padStart(2,"0");return[e.getFullYear(),n(e.getMonth()+1),n(e.getDate()),"-",n(e.getHours()),n(e.getMinutes())].join("")}async openCitationTarget(e,n){let t=n!=null?n:await this.resolveCitationDisplay(e),i=this.normalizeChunkIdForNote(e.chunk_id,e.doc_id),r=this.settings.preferObsidianNoteForCitations;if(!(r&&t.notePath&&i&&await this.openNoteAtChunk(t.notePath,i))){if(r&&t.notePath){await this.openNoteInMain(t.notePath);return}if(!r&&t.zoteroUrl){this.openExternalUrl(t.zoteroUrl);return}if(!(t.pdfPath&&await this.openPdfInMain(t.pdfPath,t.pageStart))){if(t.zoteroUrl){this.openExternalUrl(t.zoteroUrl);return}new m.Notice("Unable to open citation target.")}}}async rebuildNoteFromCache(){let e=await this.promptDocId();if(!e){new m.Notice("No doc_id provided.");return}await this.rebuildNoteFromCacheForDocId(e,!0)&&new m.Notice(`Rebuilt Zotero note for ${e}.`)}async reindexCurrentNoteFromCache(){let e=this.app.workspace.getActiveFile();if(!e){new m.Notice("No active note to reindex.");return}await this.reindexNoteFromCacheForFile(e,!0)}async reindexNoteFromCacheForFile(e,n){try{let t=await this.app.vault.read(e),i=await this.resolveDocIdForNote(e,t);if(!i){n&&new m.Notice("No doc_id found for this note.");return}await this.reindexDocIdFromCache(i,n)&&n&&new m.Notice(`Reindexed ${i}.`)}catch(t){n&&new m.Notice("Failed to reindex note."),console.error("Failed to reindex note",t)}}async rebuildDocIndexFromCache(){var d,c,_;let e=this.app.vault.adapter,n=await this.listDocIds(Y),t=await this.listDocIds(U),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(i),s=Array.from(new Set([...n,...t,...r]));if(s.length===0){new m.Notice("No cached items found.");return}this.showStatusProgress("Rebuilding doc index...",0);let a=await this.getDocIndex(),o=0;for(let g of s){o+=1;let y={},b=i[g];b&&(y.note_path=b.note_path,y.note_title=b.note_title);let L=(0,m.normalizePath)(`${Y}/${g}.json`);if(await e.exists(L))try{let C=await e.read(L),k=JSON.parse(C),E=(c=(d=k==null?void 0:k.data)!=null?d:k)!=null?c:{},P=typeof E.title=="string"?E.title:"";P&&(y.zotero_title=P);let w=he(E);w&&(y.short_title=w);let D=this.sanitizeFileName(P)||g,I=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${D}.md`),z=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${D}-${g}.md`);await e.exists(I)?(y.note_path=I,y.note_title=A.default.basename(I,".md")):await e.exists(z)&&(y.note_path=z,y.note_title=A.default.basename(z,".md"))}catch(C){console.error("Failed to read cached item JSON",C)}let f=(0,m.normalizePath)(`${U}/${g}.json`);if(await e.exists(f))try{let C=await e.read(f),k=JSON.parse(C);typeof(k==null?void 0:k.source_pdf)=="string"&&(y.pdf_path=k.source_pdf)}catch(C){console.error("Failed to read cached chunks JSON",C)}if(Object.keys(y).length>0){let k={...(_=a[g])!=null?_:{doc_id:g},...y,doc_id:g,updated_at:new Date().toISOString()};!k.note_title&&k.note_path&&(k.note_title=A.default.basename(k.note_path,".md")),typeof k.pdf_path=="string"&&(k.pdf_path=this.normalizeDocIndexPdfPath(k.pdf_path)),a[g]=k}let h=Math.round(o/s.length*100);this.showStatusProgress(`Rebuilding doc index ${o}/${s.length}`,h)}await this.saveDocIndex(a);let l=await this.pruneDocIndexOrphans();this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),l.removed>0?new m.Notice(`Rebuilt doc index for ${s.length} items; pruned ${l.removed} stale entries.`):new m.Notice(`Rebuilt doc index for ${s.length} items.`)}async recreateMissingNotesFromCache(){if(this.recreateMissingNotesActive){new m.Notice("Recreate missing notes is already running.");return}this.recreateMissingNotesActive=!0,this.recreateMissingNotesAbort=!1,this.recreateMissingNotesProcess=null;try{let e=this.app.vault.adapter,n=await this.listDocIds(Y),t=await this.listDocIds(U),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(i),s=Array.from(new Set([...n,...t,...r]));if(s.length===0){new m.Notice("No cached items found.");return}let a=[];for(let d of s){if(i[d])continue;let c=await this.getDocIndexEntry(d);if(c!=null&&c.note_path&&await e.exists(c.note_path))continue;let _=await this.inferNotePathFromCache(d);_&&await e.exists(_)||a.push(d)}if(a.length===0){new m.Notice("No missing notes detected.");return}this.showStatusProgress("Recreating missing notes...",0);let o=0,l=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;for(let d=0;d<a.length&&!this.recreateMissingNotesAbort;d+=1){let c=a[d],_=Math.round((d+1)/a.length*100);this.showStatusProgress(`Recreating ${d+1}/${a.length}`,_),l&&this.appendToLogFile(l,`Recreate missing note doc_id ${c} (${d+1}/${a.length})`,"recreate_missing_notes","INFO"),await this.rebuildNoteFromCacheForDocId(c,!1)&&(o+=1)}this.recreateMissingNotesAbort?(this.showStatusProgress("Canceled",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new m.Notice(`Canceled after ${o}/${a.length} notes.`)):(this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new m.Notice(`Recreated ${o}/${a.length} missing notes.`))}finally{this.recreateMissingNotesActive=!1,this.recreateMissingNotesProcess=null}}cancelRecreateMissingNotesFromCache(){if(!this.recreateMissingNotesActive){new m.Notice("No recreate job is running.");return}this.recreateMissingNotesAbort=!0;let e=this.recreateMissingNotesProcess;if(e&&!e.killed){try{e.kill("SIGTERM")}catch(n){console.warn("Failed to terminate recreate process",n)}window.setTimeout(()=>{if(e&&!e.killed)try{e.kill("SIGKILL")}catch(n){console.warn("Failed to force-kill recreate process",n)}},2e3)}new m.Notice("Canceling recreate missing notes...")}buildRedisCommand(e){let n=[`*${e.length}\r
`];for(let t of e){let i=String(t);n.push(`$${Buffer.byteLength(i)}\r
${i}\r
`)}return n.join("")}async checkRedisConnectionWithUrl(e,n=2e3){let t=(e||"").trim();if(!t)return{ok:!1,message:"Redis URL is not configured."};let i;try{i=new URL(t)}catch(d){return{ok:!1,message:"Redis URL is invalid."}}let r=i.hostname||"127.0.0.1",s=Number(i.port)||(i.protocol==="rediss:"||i.protocol==="redis+tls:"?6380:6379),a=decodeURIComponent(i.username||""),o=decodeURIComponent(i.password||""),l=i.protocol==="rediss:"||i.protocol==="redis+tls:";return new Promise(d=>{let c=l?Gn.default.connect({host:r,port:s,timeout:n,rejectUnauthorized:!1}):Pe.default.createConnection({host:r,port:s,timeout:n}),_="",g=o||a?"auth":"ping",y=!1,b=(f,h)=>{if(!y){y=!0;try{c.end(),c.destroy()}catch(C){}d({ok:f,message:h})}},L=f=>{let h=f.trim();if(h){if(h.startsWith("-NOAUTH")){b(!1,"Redis requires authentication. Check your Redis URL credentials.");return}if(h.startsWith("-WRONGPASS")||h.toLowerCase().includes("invalid password")){b(!1,"Redis authentication failed. Check your Redis URL credentials.");return}if(h.startsWith("-ERR")){b(!1,`Redis error: ${h}`);return}if(g==="auth"){if(h.startsWith("+OK")){g="ping",_="",c.write(this.buildRedisCommand(["PING"]));return}b(!1,`Redis auth failed: ${h}`);return}h.startsWith("+PONG")&&b(!0)}};c.on("connect",()=>{if(g==="auth"){let f=a?["AUTH",a,o]:["AUTH",o];c.write(this.buildRedisCommand(f))}else c.write(this.buildRedisCommand(["PING"]))}),c.on("data",f=>{var C;_+=f.toString();let h=_.split(/\r?\n/);_=(C=h.pop())!=null?C:"";for(let k of h)L(k)}),c.on("timeout",()=>{b(!1,"Timed out connecting to Redis.")}),c.on("error",f=>{b(!1,`Redis connection failed: ${f.message}`)}),c.on("close",()=>{y||b(!1,"Redis connection closed unexpectedly.")})})}async checkRedisConnection(e=2e3){return this.checkRedisConnectionWithUrl(this.settings.redisUrl,e)}async ensureRedisAvailable(e){let n=await this.checkRedisConnection();if(n.ok)return!0;let t=n.message?`Redis unavailable for ${e}: ${n.message}`:`Redis unavailable for ${e}.`;return this.notifyContainerOnce(t),!1}getPythonErrorMessage(e){if(e instanceof Error)return e.message||String(e);if(typeof e=="string")return e;try{return JSON.stringify(e)}catch(n){return String(e)}}classifyIndexingError(e){let n=e.toLowerCase();return n.includes("embedding dim mismatch")||n.includes("dim mismatch")?"embed_dim_mismatch":n.includes("chunks json not found")?"chunks_missing":n.includes("embedding failed")||n.includes("embedding request failed")||n.includes("unloaded")||n.includes("crashed")||n.includes("model does not exist")||n.includes("failed to load model")||n.includes("connection refused")||n.includes("econnrefused")||n.includes("max retries exceeded")||n.includes("failed to establish a new connection")||n.includes("failed to fetch models")?"embed_failure":"unknown"}async confirmRebuildIndex(e){return new Promise(n=>{new ze(this.app,e,n).open()})}async confirmPurgeRedisOrphans(){return new Promise(e=>{new Me(this.app,e).open()})}async dropRedisIndex(e=!1){await this.ensureBundledTools();let n=this.getPluginDir(),t=A.default.join(n,"tools","drop_redis_index.py"),i=["--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName()];e&&i.push("--drop-docs"),await this.runPython(t,i)}async dropAndRebuildRedisIndex(){if(this.reindexCacheActive){new m.Notice("Reindex already running.");return}if(!(!await this.ensureRedisAvailable("drop/rebuild")||!await this.confirmRebuildIndex("This will remove the current RedisSearch index and rebuild it from cached chunks."))){try{await this.dropRedisIndex(!0)}catch(n){let t=n instanceof Error?n.message:String(n);if(t.includes("Unknown Index name")||t.includes("Unknown index name"))console.warn("Redis index missing; skipping drop step.");else{console.error("Failed to drop Redis index",n),new m.Notice("Failed to drop Redis index. See console for details.");return}}await this.reindexRedisFromCache()}}async purgeRedisOrphanedKeys(){var r,s,a,o,l;if(!await this.ensureRedisAvailable("purge orphans")||!await this.confirmPurgeRedisOrphans())return;try{await this.ensureBundledTools()}catch(d){new m.Notice("Failed to sync bundled tools. See console for details."),console.error(d);return}let n=this.getPluginDir(),t=A.default.join(n,"tools","purge_redis_orphans.py"),i=["--redis-url",this.settings.redisUrl,"--key-prefix",this.getRedisKeyPrefix(),"--chunk-dir",this.getAbsoluteVaultPath(U),"--item-dir",this.getAbsoluteVaultPath(Y)];try{let d=await this.runPythonWithOutput(t,i),c=null;try{c=d?JSON.parse(d):null}catch(b){console.warn("Failed to parse purge output",b)}if(!c){new m.Notice("Purge completed. See console for details.");return}let _=[`Keys scanned: ${(r=c.keys_scanned)!=null?r:0}`,`Keys deleted: ${(s=c.keys_deleted)!=null?s:0}`,`Docs checked: ${(a=c.docs_checked)!=null?a:0}`,`Orphan docs: ${(o=c.orphan_doc_count)!=null?o:0}`],g=await this.pruneDocIndexOrphans();_.push(`Doc index entries removed: ${g.removed}`),g.updated>0&&_.push(`Doc index entries updated: ${g.updated}`);let y=Array.isArray(c.sample_orphan_doc_ids)?c.sample_orphan_doc_ids.filter(Boolean):[];y.length&&_.push("","Sample doc_ids:",...y.map(b=>`- ${b}`)),new ye(this.app,"Redis orphan purge",_.join(`
`)).open(),((l=c.keys_deleted)!=null?l:0)===0?new m.Notice("No orphaned Redis keys found."):new m.Notice(`Deleted ${c.keys_deleted} Redis keys.`)}catch(d){console.error("Failed to purge Redis orphans",d),new m.Notice("Failed to purge Redis orphans. See console for details.")}}async reindexRedisFromCache(){if(this.lastReindexFailure=null,this.reindexCacheActive)return new m.Notice("Reindex already running."),this.lastReindexFailure="busy",!1;this.reindexCacheActive=!0;let e=null,n=0;try{await this.ensureBundledTools()}catch(o){return new m.Notice("Failed to sync bundled tools. See console for details."),console.error(o),this.reindexCacheActive=!1,this.lastReindexFailure="tools_error",!1}if(!await this.ensureRedisAvailable("reindex"))return this.reindexCacheActive=!1,this.lastReindexFailure="redis_unavailable",!1;let t=await this.listDocIds(U);if(t.length===0)return new m.Notice("No cached chunks found."),this.reindexCacheActive=!1,this.lastReindexFailure="no_cache",!1;let i=this.getPluginDir(),r=A.default.join(i,"tools","index_redisearch.py"),s=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null,a=0;this.showStatusProgress("Reindexing cached chunks...",0),s&&this.appendToLogFile(s,`Reindex started: ${t.length} cached items`,"index_redisearch","INFO");for(let o of t){a+=1;let l=Math.round(a/t.length*100);this.showStatusProgress(`Reindexing ${a}/${t.length}`,l);let d=(0,m.normalizePath)(`${U}/${o}.json`);try{let c=["--chunks-json",this.getAbsoluteVaultPath(d),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"];this.appendEmbedSubchunkArgs(c),this.appendEmbedContextArgs(c),this.settings.embedIncludeMetadata&&c.push("--embed-include-metadata"),this.appendChunkTaggingArgs(c,{allowRegenerate:!1}),s&&this.appendToLogFile(s,`Reindexing doc_id ${o}`,"index_redisearch","INFO"),await this.runPythonStreaming(r,c,_=>{!s||!_||(_==null?void 0:_.type)==="progress"&&_.message&&this.appendToLogFile(s,String(_.message),"index_redisearch","INFO")},()=>{},s,"index_redisearch")}catch(c){n+=1;let _=this.getPythonErrorMessage(c),g=this.classifyIndexingError(_);if(console.error(`Failed to reindex ${o}`,c),g==="chunks_missing"){new m.Notice(`Chunks cache missing for ${o}. Reimport or rebuild this note.`);continue}if(g==="embed_dim_mismatch"){e={kind:"embed_dim_mismatch",message:_};break}if(g==="embed_failure"){e={kind:"embed_failure",message:_};break}}}if(e){if(this.showStatusProgress("Aborted",100),window.setTimeout(()=>this.clearStatusProgress(),1200),this.reindexCacheActive=!1,e.kind==="embed_dim_mismatch"){if(await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema."))try{return await this.dropRedisIndex(!0),await this.reindexRedisFromCache()}catch(l){return new m.Notice("Failed to drop/rebuild the Redis index. See console for details."),console.error(l),this.lastReindexFailure="unknown",!1}this.lastReindexFailure="embed_dim_mismatch"}else new m.Notice("Embedding provider error detected. Fix the provider/model settings and rerun reindexing."),this.lastReindexFailure="embed_failure";return!1}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),n===0?new m.Notice(`Reindexed ${t.length} cached items.`):new m.Notice(`Reindexed ${t.length-n}/${t.length} items (see console).`);try{await this.pruneDocIndexOrphans()}catch(o){console.warn("Failed to prune doc index orphans",o)}return this.reindexCacheActive=!1,this.lastReindexFailure=null,!0}async reindexDocIdFromCache(e,n){if(this.lastReindexFailure=null,this.reindexCacheActive)return n&&new m.Notice("Reindex already running."),this.lastReindexFailure="busy",!1;this.reindexCacheActive=!0;try{await this.ensureBundledTools()}catch(o){return n&&new m.Notice("Failed to sync bundled tools. See console for details."),console.error(o),this.reindexCacheActive=!1,this.lastReindexFailure="tools_error",!1}if(!await this.ensureRedisAvailable("reindex"))return this.reindexCacheActive=!1,this.lastReindexFailure="redis_unavailable",!1;let t=(0,m.normalizePath)(`${U}/${e}.json`);if(!await this.app.vault.adapter.exists(t))return n&&new m.Notice(`Chunks cache missing for ${e}.`),this.reindexCacheActive=!1,this.lastReindexFailure="no_cache",!1;let r=this.getPluginDir(),s=A.default.join(r,"tools","index_redisearch.py"),a=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;this.showStatusProgress(`Reindexing ${e}...`,0),a&&this.appendToLogFile(a,`Reindexing doc_id ${e}`,"index_redisearch","INFO");try{let o=["--chunks-json",this.getAbsoluteVaultPath(t),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"];this.appendEmbedSubchunkArgs(o),this.appendEmbedContextArgs(o),this.settings.embedIncludeMetadata&&o.push("--embed-include-metadata"),this.appendChunkTaggingArgs(o,{allowRegenerate:!1}),await this.runPythonStreaming(s,o,l=>{if((l==null?void 0:l.type)==="progress"&&l.total){let d=Math.round(l.current/l.total*100),c=typeof l.message=="string"&&l.message.trim()?l.message:`Indexing chunks ${l.current}/${l.total}`;this.showStatusProgress(this.formatStatusLabel(c),d)}},()=>{},a,"index_redisearch")}catch(o){let l=this.getPythonErrorMessage(o),d=this.classifyIndexingError(l);if(console.error(`Failed to reindex ${e}`,o),d==="embed_dim_mismatch"){if(this.lastReindexFailure="embed_dim_mismatch",n&&await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema."))try{return await this.dropRedisIndex(!0),this.reindexCacheActive=!1,await this.reindexRedisFromCache()}catch(_){new m.Notice("Failed to drop/rebuild the Redis index. See console for details."),console.error(_),this.lastReindexFailure="unknown"}}else d==="embed_failure"?(this.lastReindexFailure="embed_failure",n&&new m.Notice("Embedding provider error detected. Fix the provider/model settings and rerun reindexing.")):n&&new m.Notice(`Failed to reindex ${e}. See console for details.`);return this.showStatusProgress("Failed",100),window.setTimeout(()=>this.clearStatusProgress(),1200),this.reindexCacheActive=!1,!1}return this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),this.reindexCacheActive=!1,!0}async reindexChunkUpdates(e,n,t,i){if(!t.length&&!i.length||!await this.ensureRedisAvailable("reindex updates"))return;let r=this.getPluginDir(),s=A.default.join(r,"tools","index_redisearch.py"),a=["--chunks-json",this.getAbsoluteVaultPath(n),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"];this.appendEmbedSubchunkArgs(a),this.appendEmbedContextArgs(a),this.settings.embedIncludeMetadata&&a.push("--embed-include-metadata"),this.appendChunkTaggingArgs(a,{allowRegenerate:!1}),t.length&&a.push("--chunk-ids",t.join(",")),i.length&&a.push("--delete-chunk-ids",i.join(","));try{await this.runPython(s,a)}catch(o){let l=this.getPythonErrorMessage(o),d=this.classifyIndexingError(l);if(console.error(`Failed to reindex updated chunks for ${e}`,o),d==="embed_dim_mismatch"){if(await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema."))try{await this.dropRedisIndex(!0),await this.reindexRedisFromCache()}catch(_){new m.Notice("Failed to drop/rebuild the Redis index. See console for details."),console.error(_)}return}d==="embed_failure"&&new m.Notice("Embedding provider error detected. Fix the provider/model settings and rerun.")}}async promptZoteroItem(){return new Promise(e=>{new Ve(this.app,this,e).open()})}async listDocIds(e){let n=this.app.vault.adapter,t=(0,m.normalizePath)(e);return await n.exists(t)?(await n.list(t)).files.filter(r=>r.endsWith(".json")).map(r=>A.default.basename(r,".json")):[]}async listMarkdownFiles(e){let n=this.app.vault.adapter,t=(0,m.normalizePath)(e);if(!await n.exists(t))return[];let i=[t],r=[];for(;i.length>0;){let s=i.pop();if(!s)continue;let a=await n.list(s);for(let o of a.files)o.endsWith(".md")&&r.push(o);for(let o of a.folders)i.push(o)}return r}getZoteroFrontmatterKeyVariants(e){let n=e.replace(/_/g," "),t=new Set([n,e,e.replace(/_/g,"-")]);if(e.includes("_")){let i=e.split("_"),r=i[0]+i.slice(1).map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join("");t.add(r)}return Array.from(t)}getFrontmatterValue(e,n){if(!e)return;let t=this.getZoteroFrontmatterKeyVariants(n);for(let i of t)if(Object.prototype.hasOwnProperty.call(e,i))return e[i]}normalizeZoteroFrontmatterKeys(e){let n=!1;for(let t of qn){let i=t.replace(/_/g," "),r=this.getZoteroFrontmatterKeyVariants(t),s=Object.prototype.hasOwnProperty.call(e,i),a=s?e[i]:void 0;if(!s){for(let o of r)if(o!==i&&Object.prototype.hasOwnProperty.call(e,o)){a=e[o];break}}if(a!==void 0){s||(e[i]=a,n=!0);for(let o of r)o!==i&&Object.prototype.hasOwnProperty.call(e,o)&&(delete e[o],n=!0)}}return n}async normalizeZoteroFrontmatterKeysInFile(e){let n=this.app.metadataCache.getFileCache(e),t=n==null?void 0:n.frontmatter;if(!t)return;let i=this.getFrontmatterValue(t,"doc_id"),r=this.getFrontmatterValue(t,"zotero_key");if(!i&&!r)return;let s={...t};if(!this.normalizeZoteroFrontmatterKeys(s))return;let a=e.path;this.noteSyncSuppressed.add(a),this.noteMetadataSyncSuppressed.add(a);try{await this.app.fileManager.processFrontMatter(e,o=>{this.normalizeZoteroFrontmatterKeys(o)})}catch(o){console.warn("Failed to normalize Zotero frontmatter keys",o)}finally{window.setTimeout(()=>{this.noteSyncSuppressed.delete(a),this.noteMetadataSyncSuppressed.delete(a)},1500)}}normalizeFrontmatterKeySpacing(e){return e.trim()?e.split(/\r?\n/).map(i=>{var l,d;if(/^\s+-\s+/.test(i)||!i.includes(":")||((d=(l=i.match(/^\s*/))==null?void 0:l[0])!=null?d:""))return i;let s=i.indexOf(":");if(s<=0)return i;let a=i.slice(0,s).trim(),o=i.slice(s);for(let c of qn){let _=c.replace(/_/g," ");if(this.getZoteroFrontmatterKeyVariants(c).includes(a))return`${_}${o}`}return i}).join(`
`):e}extractDocIdFromFrontmatter(e){let n=e.match(/^---\s*\n([\s\S]*?)\n---/);if(!n)return null;let i=n[1].split(/\r?\n/);for(let r of i){let s=r.trim();if(!s||s.startsWith("#"))continue;let a=s.split(":");if(a.length<2)continue;let o=a[0].trim().toLowerCase();if(o!=="doc_id"&&o!=="doc id"&&o!=="doc-id"&&o!=="zotero_key"&&o!=="zotero key"&&o!=="zotero-key")continue;let d=s.slice(s.indexOf(":")+1).trim().replace(/^["']|["']$/g,"").trim();if(d)return d}return null}hasDocIdFieldInFrontmatter(e){let n=e.match(/^---\s*\n([\s\S]*?)\n---/);return n?/^\s*doc(?:[_\s-]?id)\s*:/im.test(n[1]):!1}ensureDocIdInFrontmatter(e,n){let t=e.trim(),i=`doc id: ${this.escapeYamlString(n)}`;return t?/^\s*doc(?:[_\s-]?id)\s*:/im.test(t)?t:`${i}
${t}`:i}ensureDocIdInNoteContent(e,n){var g,y;let t=e.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/),i=`doc id: ${this.escapeYamlString(n)}`;if(!t)return`---
${i}
---

${e.trimStart()}`;let s=((g=t[1])!=null?g:"").split(/\r?\n/),a=!1,o=s.map(b=>/^\s*doc(?:[_\s-]?id)\s*:/i.test(b)?(a=!0,i):b);a||o.unshift(i);let l=o.join(`
`).trim(),d=(y=t.index)!=null?y:0,c=e.slice(0,d),_=e.slice(d+t[0].length).replace(/^\n+/,"");return`${c}---
${l}
---
${_}`}async findDocIdByNotePath(e){let n=(0,m.normalizePath)(e),t=await this.getDocIndex();for(let[i,r]of Object.entries(t))if(r!=null&&r.note_path&&(0,m.normalizePath)(r.note_path)===n)return i;return null}async resolveDocIdForNote(e,n){let t=this.extractDocIdFromFrontmatter(n),i=this.hasDocIdFieldInFrontmatter(n);if(t&&i)return t;let r=this.extractDocIdFromSyncMarker(n),s=await this.findDocIdByNotePath(e.path),a=t||r||s;if(!a)return de.test(n)&&!this.missingDocIdWarned.has(e.path)&&(new m.Notice("This Zotero note is missing a doc_id in frontmatter. Reimport or add doc_id manually."),this.missingDocIdWarned.add(e.path)),null;if(!i||!t){let o=this.ensureDocIdInNoteContent(n,a);o!==n&&await this.writeNoteWithSyncSuppressed(e.path,o)}return a}async scanNotesForDocIds(e){var r;let n=this.app.vault.adapter,t=await this.listMarkdownFiles(e),i={};for(let s of t)try{let a=await n.read(s),o=(r=this.extractDocIdFromFrontmatter(a))!=null?r:this.extractDocIdFromSyncMarker(a);if(!o)continue;i[o]={doc_id:o,note_path:s,note_title:A.default.basename(s,".md"),updated_at:new Date().toISOString()}}catch(a){console.error("Failed to read note for doc_id scan",a)}return i}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.addClass("status-bar-item-segment"),e.style.display="none";let n=e.createEl("span",{text:"Idle"});n.addClass("zrr-status-label");let i=e.createEl("div",{cls:"zrr-status-bar"}).createEl("div",{cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=n,this.statusBarInnerEl=i}showStatusProgress(e,n){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.style.display="flex",this.statusLabelEl.setText(e),n===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.style.width="40%";else{this.statusBarInnerEl.removeClass("indeterminate");let t=Math.max(0,Math.min(100,n));this.statusBarInnerEl.style.width=`${t}%`}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.style.display="none",this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.style.width="0%")}formatStatusLabel(e,n){return n?`${e} (Text layer quality ${n})`:e}async readDoclingQualityLabel(e){var n,t,i;try{let r=await this.app.vault.adapter.read(e),s=JSON.parse(r),a=(i=(n=s==null?void 0:s.metadata)==null?void 0:n.effective_confidence_proxy)!=null?i:(t=s==null?void 0:s.metadata)==null?void 0:t.confidence_proxy;if(typeof a=="number")return a.toFixed(2)}catch(r){console.warn("Failed to read Docling quality metadata",r)}return null}async readDoclingMetadata(e){try{let n=await this.app.vault.adapter.read(e),t=JSON.parse(n),i=t==null?void 0:t.metadata;if(i&&typeof i=="object")return i}catch(n){console.warn("Failed to read Docling metadata",n)}return null}async readDoclingQualityLabelFromPdf(e,n){var t;try{let i=this.getPluginDir(),r=A.default.join(i,"tools","docling_extract.py"),s=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,a=["--quality-only","--pdf",e,"--ocr",s],o=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;o&&a.push("--log-file",o),this.settings.ocrMode==="force_low_quality"&&a.push("--force-ocr-low-quality"),a.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),n&&a.push("--language-hint",n);let l=await this.runPythonWithOutput(r,a,o),d=JSON.parse(l),c=(t=d==null?void 0:d.effective_confidence_proxy)!=null?t:d==null?void 0:d.confidence_proxy;if(typeof c=="number")return c.toFixed(2)}catch(i){console.warn("Failed to read Docling quality from PDF",i)}return null}async promptDocId(){return new Promise(e=>{new ve(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",n=>e(n),"Doc ID cannot be empty.").open()})}async promptLanguageHint(){return new Promise(e=>{new $e(this.app,e).open()})}registerRibbonIcons(){(0,m.addIcon)("zrr-picker",lt),(0,m.addIcon)("zrr-chat",dt),(0,m.addIcon)("zrr-pdf",zn),this.addRibbonIcon("zrr-picker","Import Zotero item and index",()=>this.importZoteroItem()).addClass("zrr-ribbon-picker"),this.addRibbonIcon("zrr-chat","Open Zotero RAG chat",()=>this.openChatView(!0)).addClass("zrr-ribbon-chat")}async confirmOverwrite(e){return new Promise(n=>{new Ie(this.app,e,n).open()})}async resolveLanguageHint(e,n){let t=typeof e.language=="string"?e.language:"",i=this.normalizeZoteroLanguage(t);if(i)return i;let r=await this.promptLanguageHint();if(r===null)return console.info("Language selection canceled."),null;let s=this.normalizeZoteroLanguage(r);if(!s)return console.info("Language selection empty; skipping Zotero update."),"";if(e.language=s,console.info("Language selected",{language:s,itemKey:n}),n)try{await this.updateZoteroItemLanguage(n,e,s),new m.Notice("Saved language to Zotero.")}catch(a){new m.Notice("Failed to write language back to Zotero."),console.error(a)}else console.warn("Language selected but itemKey is missing; skipping Zotero update.");return s}normalizeZoteroLanguage(e){return(e||"").trim().toLowerCase()}buildDoclingLanguageHint(e){let n=this.normalizeZoteroLanguage(e!=null?e:"");if(!n)return null;let t=n.split(/[^a-z]+/).filter(Boolean),i=t.some(s=>["de","deu","ger","german"].includes(s)),r=t.some(s=>["en","eng","english"].includes(s));return i&&r?"deu+eng":i?"deu":r?"eng":t.length===1&&Fn[t[0]]?Fn[t[0]]:n}async fetchZoteroItem(e){try{let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),t=await this.requestLocalApi(n,`Zotero item fetch failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(n){return console.warn("Failed to fetch Zotero item from local API",n),this.canUseWebApi()?this.fetchZoteroItemWeb(e):null}}async fetchZoteroItemCsl(e){try{let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}?format=csljson`),t=await this.requestLocalApi(n,`Zotero CSL fetch failed for ${n}`);return this.parseCslPayload(t)}catch(n){return console.warn("Failed to fetch Zotero CSL from local API",n),this.canUseWebApi()?this.fetchZoteroItemCslWeb(e):null}}async fetchZoteroCollectionTitle(e){var r,s,a,o,l,d;let n=(e||"").trim();if(!n)return"";let t=this.collectionTitleCache.get(n);if(t!==void 0)return t;let i=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/collections/${n}`);try{let c=await this.requestLocalApi(i,`Zotero collection fetch failed for ${i}`),_=JSON.parse(c.toString("utf8")),g=String((a=(s=(r=_==null?void 0:_.data)==null?void 0:r.name)!=null?s:_==null?void 0:_.name)!=null?a:"").trim();return this.collectionTitleCache.set(n,g),g}catch(c){if(!this.canUseWebApi())return this.collectionTitleCache.set(n,""),"";try{let _=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/collections/${n}`),g=await this.requestWebApi(_,`Zotero Web API collection fetch failed for ${_}`),y=JSON.parse(g.toString("utf8")),b=String((d=(l=(o=y==null?void 0:y.data)==null?void 0:o.name)!=null?l:y==null?void 0:y.name)!=null?d:"").trim();return this.collectionTitleCache.set(n,b),b}catch(_){return console.warn("Failed to fetch Zotero collection title",_),this.collectionTitleCache.set(n,""),""}}}async resolveCollectionTitles(e){let t=(Array.isArray(e.collections)?e.collections:[]).map(r=>String(r||"").trim()).filter(Boolean);if(!t.length)return[];let i=[];for(let r of t){let s=await this.fetchZoteroCollectionTitle(r);s&&i.push(s)}return i}async fetchZoteroItemWeb(e){try{let n=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}`),t=await this.requestWebApi(n,`Zotero Web API fetch failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(n){return console.warn("Failed to fetch Zotero item from Web API",n),null}}async fetchZoteroItemCslWeb(e){try{let n=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}?format=csljson`),t=await this.requestWebApi(n,`Zotero Web API CSL fetch failed for ${n}`);return this.parseCslPayload(t)}catch(n){return console.warn("Failed to fetch Zotero CSL from Web API",n),null}}parseCslPayload(e){try{let n=JSON.parse(e.toString("utf8"));return Array.isArray(n)?typeof n[0]=="object"&&n[0]?n[0]:null:typeof n=="object"&&n?n:null}catch(n){return console.warn("Failed to parse CSL payload",n),null}}async searchZoteroItemsWeb(e){let n=["data,meta,children","data,meta"];for(let t of n){let i=new URLSearchParams;i.set("itemType","-attachment"),i.set("limit","25"),i.set("include",t),e.trim()&&i.set("q",e.trim());let r=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items?${i.toString()}`);try{let s=await this.requestWebApi(r,`Zotero Web API search failed for ${r}`),a=JSON.parse(s.toString("utf8"));return Array.isArray(a)?a.map(o=>{var l,d,c,_;return{key:(d=o.key)!=null?d:(l=o.data)==null?void 0:l.key,data:(c=o.data)!=null?c:{},meta:(_=o.meta)!=null?_:{}}}).filter(o=>typeof o.key=="string"&&o.key.trim().length>0):[]}catch(s){console.warn("Failed to search Zotero via web API",s)}}return[]}async updateZoteroItemLanguage(e,n,t){try{await this.updateZoteroItemLanguageLocal(e,n,t);return}catch(i){if(!this.canUseWebApi())throw i;let r=i instanceof Error?i.message:String(i);console.info("Local Zotero write failed; trying Web API",{itemKey:e,reason:r}),await this.updateZoteroItemLanguageWeb(e,n,t)}}async updateZoteroItemLanguageLocal(e,n,t){var f,h,C,k,E,P;let i=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),r={...n,language:t},s={"Content-Type":"application/json","Zotero-API-Version":"3"},a=typeof r.version=="number"?r.version:Number(r.version);Number.isNaN(a)||(s["If-Unmodified-Since-Version"]=String(a)),console.info("Zotero language PUT",{url:i,itemKey:e,language:t});try{let w=await this.requestLocalApiWithBody(i,"PUT",r,s,`Zotero update failed for ${i}`);console.info("Zotero language PUT response",{status:w.statusCode})}catch(w){if(!(w instanceof Error?w.message:String(w)).includes("status 501"))throw w;let I=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.info("Zotero language PUT unsupported; trying POST",{postUrl:I});let z=await this.requestLocalApiWithBody(I,"POST",[r],s,`Zotero update failed for ${I}`);console.info("Zotero language POST response",{status:z.statusCode})}let o=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((f=o==null?void 0:o.data)==null?void 0:f.language)=="string"?o.data.language:"")===this.normalizeZoteroLanguage(t))return;let d={...(h=o==null?void 0:o.data)!=null?h:n,language:t},c={key:e,version:(E=(k=(C=o==null?void 0:o.data)==null?void 0:C.version)!=null?k:o==null?void 0:o.version)!=null?E:a,data:d},_={...s},g=typeof c.version=="number"?c.version:Number(c.version);Number.isNaN(g)?delete _["If-Unmodified-Since-Version"]:_["If-Unmodified-Since-Version"]=String(g);let y=await this.requestLocalApiWithBody(i,"PUT",c,_,`Zotero update failed for ${i}`);console.info("Zotero language PUT retry response",{status:y.statusCode});let b=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((P=b==null?void 0:b.data)==null?void 0:P.language)=="string"?b.data.language:"")!==this.normalizeZoteroLanguage(t))throw new Error("Language update did not persist in Zotero.")}async updateZoteroItemLanguageWeb(e,n,t){var y,b,L,f,h;let i=this.getWebApiLibraryPath();if(!i)throw new Error("Web API library path is not configured.");let r=this.buildWebApiUrl(`/${i}/items/${e}`),s=await this.fetchZoteroItemWeb(e),a={...(y=s==null?void 0:s.data)!=null?y:n,language:t},o={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},l=(f=(L=(b=s==null?void 0:s.data)==null?void 0:b.version)!=null?L:s==null?void 0:s.version)!=null?f:n==null?void 0:n.version,d=typeof l=="number"?l:Number(l);Number.isNaN(d)||(o["If-Unmodified-Since-Version"]=String(d)),console.info("Zotero Web API language PUT",{url:r,itemKey:e,language:t});let c=await this.requestWebApiWithBody(r,"PUT",a,o,`Zotero Web API update failed for ${r}`);console.info("Zotero Web API language PUT response",{status:c.statusCode});let _=await this.fetchZoteroItemWeb(e);if(this.normalizeZoteroLanguage(typeof((h=_==null?void 0:_.data)==null?void 0:h.language)=="string"?_.data.language:"")!==this.normalizeZoteroLanguage(t))throw new Error("Language update did not persist in Zotero Web API.")}async updateZoteroItemFields(e,n,t){try{await this.updateZoteroItemFieldsLocal(e,n,t);return}catch(i){if(!this.canUseWebApi())throw i;let r=i instanceof Error?i.message:String(i);console.info("Local Zotero write failed; trying Web API",{itemKey:e,reason:r}),await this.updateZoteroItemFieldsWeb(e,n,t)}}async updateZoteroItemFieldsLocal(e,n,t){let i=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),r={...n,...t},s={"Content-Type":"application/json","Zotero-API-Version":"3"},a=typeof r.version=="number"?r.version:Number(r.version);Number.isNaN(a)||(s["If-Unmodified-Since-Version"]=String(a)),console.info("Zotero metadata PUT",{url:i,itemKey:e});try{let o=await this.requestLocalApiWithBody(i,"PUT",r,s,`Zotero update failed for ${i}`);console.info("Zotero metadata PUT response",{status:o.statusCode})}catch(o){if(!(o instanceof Error?o.message:String(o)).includes("status 501"))throw o;let d=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.info("Zotero metadata PUT unsupported; trying POST",{postUrl:d});let c=await this.requestLocalApiWithBody(d,"POST",[r],s,`Zotero update failed for ${d}`);console.info("Zotero metadata POST response",{status:c.statusCode})}}async updateZoteroItemFieldsWeb(e,n,t){var _,g,y,b;let i=this.getWebApiLibraryPath();if(!i)throw new Error("Web API library path is not configured.");let r=this.buildWebApiUrl(`/${i}/items/${e}`),s=await this.fetchZoteroItemWeb(e),a={...(_=s==null?void 0:s.data)!=null?_:n,...t},o={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},l=(b=(y=(g=s==null?void 0:s.data)==null?void 0:g.version)!=null?y:s==null?void 0:s.version)!=null?b:n==null?void 0:n.version,d=typeof l=="number"?l:Number(l);Number.isNaN(d)||(o["If-Unmodified-Since-Version"]=String(d)),console.info("Zotero Web API metadata PUT",{url:r,itemKey:e});let c=await this.requestWebApiWithBody(r,"PUT",a,o,`Zotero Web API update failed for ${r}`);console.info("Zotero Web API metadata PUT response",{status:c.statusCode})}sanitizeFileName(e){let n=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return n?n.replace(/[.]+$/g,"").trim().slice(0,120):""}registerNoteRenameHandler(){this.registerEvent(this.app.vault.on("rename",async e=>{var n;if(!(!(e instanceof m.TFile)||e.extension!=="md"))try{let t=await this.app.vault.read(e),i=(n=this.extractDocIdFromFrontmatter(t))!=null?n:this.extractDocIdFromSyncMarker(t);if(!i)return;await this.updateDocIndex({doc_id:i,note_path:e.path,note_title:A.default.basename(e.path,".md")})}catch(t){console.warn("Failed to update doc index for renamed note",t)}}))}registerNoteSyncHandler(){this.registerEvent(this.app.vault.on("modify",e=>{if(!(!(e instanceof m.TFile)||e.extension!=="md")){if(this.noteMetadataSyncSuppressed.has(e.path)){this.noteSyncSuppressed.has(e.path)&&this.scheduleNoteSync(e,2500);return}if(this.noteSyncSuppressed.has(e.path)){this.scheduleNoteSync(e,2500),this.scheduleNoteMetadataSync(e,2500,"save");return}this.scheduleNoteSync(e),this.scheduleNoteMetadataSync(e,1200,"save")}}))}registerNoteOpenHandler(){this.registerEvent(this.app.workspace.on("file-open",e=>{!(e instanceof m.TFile)||e.extension!=="md"||(this.pdfSidebar.syncPdfSidebarForFile(e),this.pdfSidebar.updatePreviewScrollHandler(),this.scheduleNoteMetadataSync(e,600,"open"),this.normalizeZoteroFrontmatterKeysInFile(e))}))}registerPreviewScrollSyncHandlers(){this.registerEvent(this.app.workspace.on("active-leaf-change",()=>{this.pdfSidebar.updatePreviewScrollHandler(),this.pdfSidebar.maybeSyncPendingPdf()})),this.registerEvent(this.app.workspace.on("layout-change",()=>{this.pdfSidebar.updatePreviewScrollHandler(),this.pdfSidebar.maybeSyncPendingPdf()})),this.pdfSidebar.updatePreviewScrollHandler()}registerNoteDeleteMenu(){this.registerEvent(this.app.workspace.on("file-menu",(e,n)=>{if(!(n instanceof m.TFile)||n.extension!=="md")return;let t=(0,m.normalizePath)(this.settings.outputNoteDir),i=(0,m.normalizePath)(n.path);!(t&&(i===t||i.startsWith(`${t}/`)))&&!this.isZoteroNoteFile(n)||(e.addItem(s=>{s.setTitle("Reindex note from cache").onClick(()=>this.reindexNoteFromCacheForFile(n,!0))}),e.addItem(s=>{s.setTitle("Delete Zotero note and cached data").onClick(()=>this.deleteZoteroNoteAndCacheForFile(n))}))}))}findChunkStartLine(e,n){let t=n!=null?n:e.getCursor().line;for(;t>=0;t-=1){let i=e.getLine(t);if(se.test(i))return{line:t,text:i};if(de.test(i)||fe.test(i))break}return null}findChunkEndLine(e,n){for(let t=n;t<e.lineCount();t+=1){let i=e.getLine(t);if(Se.test(i))return t;if(fe.test(i))break}return null}findChunkAtCursor(e,n){let t=n!=null?n:e.getCursor().line,i=this.findChunkStartLine(e,t);if(!i)return null;let r=this.findChunkEndLine(e,i.line+1);return r===null||t<i.line||t>r?null:{startLine:i.line,endLine:r,text:i.text}}toggleChunkExclude(e,n){var c;let t=this.findChunkAtCursor(e,n);if(!t){new m.Notice("No synced chunk found at cursor.");return}let i=t.text.match(se);if(!i){new m.Notice("Invalid chunk marker.");return}let r=((c=i[1])!=null?c:"").trim(),s=t.endLine,a=!1;if(s!==null){for(let _=t.startLine+1;_<s;_+=1)if(ke.test(e.getLine(_))){a=!0;break}}let l=/\bexclude\b/i.test(r)||/\bdelete\b/i.test(r)||a;l?r=r.replace(/\b(delete|exclude)\b/gi,"").replace(/\s{2,}/g," ").trim():r=r?`${r} exclude`:"exclude";let d=`<!-- zrr:chunk${r?" "+r:""} -->`;if(d!==t.text&&e.replaceRange(d,{line:t.startLine,ch:0},{line:t.startLine,ch:t.text.length}),l&&s!==null){let _=[];for(let g=t.startLine+1;g<s;g+=1)ke.test(e.getLine(g))&&_.push(g);for(let g=_.length-1;g>=0;g-=1){let y=_[g],b=e.lineCount();y<b-1?e.replaceRange("",{line:y,ch:0},{line:y+1,ch:0}):e.replaceRange("",{line:y,ch:0},{line:y,ch:e.getLine(y).length})}}new m.Notice(l?"Chunk included.":"Chunk excluded from index.")}toggleChunkExcludeFromToolbar(e){let n=this.app.workspace.getActiveViewOfType(m.MarkdownView);if(!n){new m.Notice("No active editor found.");return}let t=Math.max(0,e-1);this.toggleChunkExclude(n.editor,t)}async openChunkTagEditor(e,n){var c,_;let t=(0,m.normalizePath)(`${U}/${e}.json`),i=this.app.vault.adapter;if(!await i.exists(t)){new m.Notice("Chunk cache not found for this document.");return}let r=await this.readChunkPayload(t);if(!r){new m.Notice("Failed to read chunk cache.");return}let s=Array.isArray(r.chunks)?r.chunks:[],a=this.resolveChunkFromPayload(s,n,e);if(!a){new m.Notice(`Chunk ${n} not found in cache.`);return}let o=(c=a.chunk_tags)!=null?c:[],l=Array.isArray(o)?o.map(g=>String(g).trim()).filter(g=>g):String(o).split(/[|,;\n]+/).map(g=>g.trim()).filter(g=>g),d=typeof a.text=="string"?a.text:String((_=a.text)!=null?_:"");new De(this.app,n,l,async g=>{g.length>0?a.chunk_tags=g:delete a.chunk_tags,await i.write(t,JSON.stringify(r,null,2)),await this.reindexChunkUpdates(e,t,[String(a.chunk_id||n)],[]),new m.Notice("Chunk tags updated.")},async()=>{if(!d.trim())return new m.Notice("Chunk has no text to tag."),null;let g=await this.renderMarkdownToIndexText(d);return this.requestChunkTags(g)}).open()}async openChunkIndexedTextPreview(e,n){var c;let t=(0,m.normalizePath)(`${U}/${e}.json`);if(!await this.app.vault.adapter.exists(t)){new m.Notice("Chunk cache not found for this document.");return}let r=await this.readChunkPayload(t);if(!r){new m.Notice("Failed to read chunk cache.");return}let s=Array.isArray(r.chunks)?r.chunks:[],a=this.resolveChunkFromPayload(s,n,e);if(!a){new m.Notice(`Chunk ${n} not found in cache.`);return}let o=typeof a.text=="string"?a.text:String((c=a.text)!=null?c:""),l=await this.renderMarkdownToIndexText(o),d=this.settings.embedIncludeMetadata?"Note: when \u201CInclude metadata in embeddings\u201D is enabled, the indexer prepends title/authors/tags/section info before embedding. The preview below shows only the chunk text.":"";new Te(this.app,`Indexed text for ${n}`,l,d).open()}async openChunkInZotero(e,n){var _,g,y,b,L,f;let t=(0,m.normalizePath)(`${U}/${e}.json`),i=this.app.vault.adapter,r=null;await i.exists(t)&&(r=await this.readChunkPayload(t));let s=Array.isArray(r==null?void 0:r.chunks)?r==null?void 0:r.chunks:[],a=this.resolveChunkFromPayload(s,n,e),o=(_=a==null?void 0:a.page_start)!=null?_:a==null?void 0:a.pageStart,l=(L=(b=(g=r==null?void 0:r.metadata)==null?void 0:g.attachment_key)!=null?b:(y=r==null?void 0:r.metadata)==null?void 0:y.attachmentKey)!=null?L:"";if(!l){let h=await this.getDocIndexEntry(e);l=(f=h==null?void 0:h.attachment_key)!=null?f:""}if(!l){new m.Notice("Attachment key not found for Zotero deeplink.");return}let d=typeof o=="number"?String(o):"",c=this.buildZoteroDeepLink(e,l,d);this.openExternalUrl(c)}async cleanChunkFromToolbar(e){let n=this.app.workspace.getActiveViewOfType(m.MarkdownView);if(!n){new m.Notice("No active editor found.");return}let t=n.editor,i=Math.max(0,e-1),r=this.findChunkAtCursor(t,i);if(!r){new m.Notice("No synced chunk found at cursor.");return}let s=[];for(let d=r.startLine+1;d<r.endLine;d+=1)s.push(t.getLine(d));let a=s.join(`
`).trim();if(!a){new m.Notice("Chunk has no text to clean.");return}this.showStatusProgress("Cleaning chunk...",null);let o=null;try{o=await this.requestOcrCleanup(a)}finally{o||this.clearStatusProgress()}if(!o)return;if(o.trim()===a.trim()){new m.Notice("Cleanup produced no changes."),this.clearStatusProgress();return}let l=`${o.trim()}
`;t.replaceRange(l,{line:r.startLine+1,ch:0},{line:r.endLine,ch:0}),this.showStatusProgress("Chunk cleaned.",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new m.Notice("Chunk cleaned.")}async requestOcrCleanup(e){var l,d,c,_,g,y,b,L,f;let n=(this.settings.llmCleanupBaseUrl||"").trim().replace(/\/$/,""),t=(this.settings.llmCleanupModel||"").trim();if(!n||!t)return new m.Notice("OCR cleanup model is not configured."),this.openPluginSettings(),null;let i=Number(this.settings.llmCleanupMaxChars||0);if(i>0&&e.length>i)return new m.Notice("Chunk exceeds OCR cleanup max length. Adjust settings to clean it."),this.openPluginSettings(),null;let r=`${n}/chat/completions`,s={"Content-Type":"application/json"},a=(this.settings.llmCleanupApiKey||"").trim();a&&(s.Authorization=`Bearer ${a}`);let o={model:t,temperature:Number((l=this.settings.llmCleanupTemperature)!=null?l:0),messages:[{role:"system",content:"You are an OCR cleanup assistant. Fix OCR errors without changing meaning. Do not add content. Return corrected text only. Detect footnote references and definitions and format them in Markdown as [^n] and [^n]: (for the note text). Preserve special characters and formatting. Do not create new footnotes or content; only reformat existing footnote markers/lines."},{role:"user",content:e}]};try{let h=await this.requestLocalApiRaw(r,{method:"POST",headers:s,body:JSON.stringify(o)});if(h.statusCode>=400){let P=h.body.toString("utf8");throw new Error(`Cleanup request failed (${h.statusCode}): ${P||"no response body"}`)}let C=JSON.parse(h.body.toString("utf8")),k=(f=(L=(b=(_=(c=(d=C==null?void 0:C.choices)==null?void 0:d[0])==null?void 0:c.message)==null?void 0:_.content)!=null?b:(y=(g=C==null?void 0:C.choices)==null?void 0:g[0])==null?void 0:y.text)!=null?L:C==null?void 0:C.output_text)!=null?f:"",E=String(k||"").trim();return E||(new m.Notice("Cleanup returned empty text."),null)}catch(h){return console.error("OCR cleanup failed",h),new m.Notice("OCR cleanup failed. Check the cleanup model settings."),null}}parseChunkTags(e,n){if(!e)return[];let t=e.trim(),i=[];if(t.startsWith("[")&&t.endsWith("]"))try{let a=JSON.parse(t);Array.isArray(a)&&(i=a.map(o=>String(o)))}catch(a){i=[]}i.length===0&&(i=t.split(/[,;\n]+/));let r=new Set,s=[];for(let a of i){let o=a.trim();if(o=o.replace(/^[-•\d.\)\s]+/,""),o=o.replace(/\s+/g," ").trim(),!o||o.length<2)continue;let l=o.toLowerCase();if(!r.has(l)&&(r.add(l),s.push(o),s.length>=n))break}return s}async requestChunkTags(e){var _,g,y,b,L,f,h,C,k;let n=(this.settings.llmCleanupBaseUrl||"").trim().replace(/\/$/,""),t=(this.settings.llmCleanupModel||"").trim();if(!n||!t)return new m.Notice("OCR cleanup model is not configured."),this.openPluginSettings(),null;let i=e.trim().slice(0,2e3);if(!i)return[];let r=`${n}/chat/completions`,s={"Content-Type":"application/json"},a=(this.settings.llmCleanupApiKey||"").trim();a&&(s.Authorization=`Bearer ${a}`);let o=5,l="Return 3 to 5 high-signal, concrete noun-phrase tags. Avoid generic terms (study, paper, method), verbs, and filler. Prefer specific entities, methods, datasets, and named concepts. Output comma-separated tags only. No extra text.",d=Number((_=this.settings.llmCleanupTemperature)!=null?_:0),c={model:t,messages:[{role:"system",content:l},{role:"user",content:i}]};Number.isFinite(d)&&(c.temperature=d),this.showStatusProgress("Generating tags...",null);try{let E=async z=>{let N=await this.requestLocalApiRaw(r,{method:"POST",headers:s,body:JSON.stringify(z)});if(N.statusCode>=400){let F=N.body.toString("utf8");throw new Error(`Tag request failed (${N.statusCode}): ${F||"no response body"}`)}return N.body},P;try{P=await E(c)}catch(z){let N=z instanceof Error?z.message:String(z);if("temperature"in c&&/temperature/i.test(N)&&/unsupported|default/i.test(N)){let F={...c};delete F.temperature,P=await E(F)}else throw z}let w=JSON.parse(P.toString("utf8")),D=(k=(C=(h=(b=(y=(g=w==null?void 0:w.choices)==null?void 0:g[0])==null?void 0:y.message)==null?void 0:b.content)!=null?h:(f=(L=w==null?void 0:w.choices)==null?void 0:L[0])==null?void 0:f.text)!=null?C:w==null?void 0:w.output_text)!=null?k:"",I=this.parseChunkTags(String(D||""),o);return I.length||new m.Notice("Tag generation returned no tags."),I}catch(E){return console.error("Tag generation failed",E),new m.Notice("Tag generation failed. Check the cleanup model settings."),null}finally{this.clearStatusProgress()}}async renderMarkdownToIndexText(e){if(!e)return"";let n=this.replaceImageMarkersForIndexPreview(e),t=document.createElement("div");try{await m.MarkdownRenderer.renderMarkdown(n,t,"",this)}catch(l){return console.warn("Failed to render markdown for index preview",l),this.normalizeIndexPreviewText(n)}let s=(t.innerHTML||"").replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g," "),a=document.createElement("textarea");a.innerHTML=s;let o=a.value||s;return this.normalizeIndexPreviewText(o)}replaceImageMarkersForIndexPreview(e){if(!e)return"";let n=i=>{let r=i.trim();return r?`Image caption: ${r}`:"Image"},t=e.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(i,r,s)=>n(s||""));return t=t.replace(/!\[([^\]]*)]\([^)]+\)/g,(i,r)=>n(r||"")),t=t.replace(/<img[^>]*>/gi,i=>{let r=i.match(/\balt=(['"])([^'"]*)\1/i);return n(r?r[2]:"")}),t}normalizeIndexPreviewText(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).replace(/[ \t]+/g," ").replace(/\n{3,}/g,`

`).replace(/[ \t]*\n[ \t]*/g,`
`).trim()}scheduleNoteSync(e,n=1200){let t=this.noteSyncTimers.get(e.path);t!==void 0&&window.clearTimeout(t);let i=window.setTimeout(()=>{this.noteSyncTimers.delete(e.path),this.syncNoteToRedis(e)},n);this.noteSyncTimers.set(e.path,i)}scheduleNoteMetadataSync(e,n=1200,t="save"){let i=this.noteMetadataSyncTimers.get(e.path);i!==void 0&&window.clearTimeout(i);let r=window.setTimeout(()=>{this.noteMetadataSyncTimers.delete(e.path),this.syncNoteMetadataWithZotero(e,t)},n);this.noteMetadataSyncTimers.set(e.path,r)}escapeRegExp(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}formatCitationPageLabel(e){let n=e.page_start?String(e.page_start):"",t=e.page_end?String(e.page_end):"";if(n&&(!t||n===t))return n;if(n&&t)return`${n} - ${t}`;let i=(e.pages||"").trim();if(!i)return"?";let r=i.match(/^(\d+)\s*-\s*(\d+)$/);return r?r[1]===r[2]?r[1]:`${r[1]} - ${r[2]}`:i.replace("-"," - ")}normalizeChunkIdForNote(e,n){if(!e)return null;let t=String(e);if(n&&t.startsWith(`${n}:`))return t.slice(n.length+1);if(t.includes(":")){let i=t.split(":");if(i.length>1&&n&&i[0]===n)return i.slice(1).join(":")}return t}async syncNoteToRedis(e){var n,t,i;if(this.noteSyncInFlight.has(e.path)){this.noteSyncPending.add(e.path);return}if(this.noteSyncSuppressed.has(e.path)){this.scheduleNoteSync(e,2e3);return}this.noteSyncInFlight.add(e.path);try{let r=await this.app.vault.read(e),s=this.extractSyncSection(r);if(!s)return;let a=await this.resolveDocIdForNote(e,r);if(!a)return;let o=this.parseSyncedChunkBlocks(s);if(!o.length)return;let l=(0,m.normalizePath)(`${U}/${a}.json`),d=this.app.vault.adapter;if(!await d.exists(l))return;let c=await this.readChunkPayload(l);if(!c)return;let _=Array.isArray(c.chunks)?c.chunks:[],g=new Map;for(let k of _){let E=typeof(k==null?void 0:k.chunk_id)=="string"?k.chunk_id:String((n=k==null?void 0:k.chunk_id)!=null?n:"");E&&g.set(E,k)}let y=new Set,b=new Set,L=new Set,f=new Set,h=!1;for(let k of o){let E=k.chunkId;if(!E)continue;y.add(E);let P=g.get(E);if(!P){console.warn(`Sync note: chunk id not found in cache (${E})`);continue}if(k.excludeFlag){P.excluded!==!0&&(P.excluded=!0,h=!0);let I=this.normalizeChunkText(k.text);I&&I!==String((t=P.text)!=null?t:"")&&(P.text=I,P.char_count=I.length,h=!0),L.add(E);continue}if(P.excluded&&(P.excluded=!1,h=!0,b.add(E)),!k.text.trim()){L.add(E),f.add(E);continue}let w=this.normalizeChunkText(k.text);if(!w){L.add(E),f.add(E);continue}let D=typeof P.text=="string"?P.text:String((i=P.text)!=null?i:"");w!==D&&(P.text=w,P.char_count=w.length,b.add(E),h=!0)}for(let k of g.keys())y.has(k)||(L.add(k),f.add(k));let C=new Set([...L,...f]);if(C.size){let k=Array.from(C).sort().join("|");if(this.noteSyncPendingDeletes.get(e.path)!==k){this.noteSyncPendingDeletes.set(e.path,k),this.scheduleNoteSync(e,1500);return}}else this.noteSyncPendingDeletes.has(e.path)&&this.noteSyncPendingDeletes.delete(e.path);if(!b.size&&!L.size&&!f.size&&!h)return;f.size&&(c.chunks=_.filter(k=>{var P;let E=typeof(k==null?void 0:k.chunk_id)=="string"?k.chunk_id:String((P=k==null?void 0:k.chunk_id)!=null?P:"");return E&&!f.has(E)}),h=!0),(h||f.size)&&await d.write(l,JSON.stringify(c,null,2)),await this.reindexChunkUpdates(a,l,Array.from(b),Array.from(L)),(L.size||f.size)&&this.noteSyncPendingDeletes.delete(e.path)}catch(r){console.warn("Failed to sync note edits to Redis",r)}finally{this.noteSyncInFlight.delete(e.path),this.noteSyncPending.delete(e.path)&&this.scheduleNoteSync(e,400)}}async syncNoteMetadataWithZotero(e,n){var t,i,r,s;if(this.noteMetadataSyncInFlight.has(e.path)){this.noteMetadataSyncPending.add(e.path);return}if(this.noteMetadataSyncSuppressed.has(e.path)){this.scheduleNoteMetadataSync(e,2e3,n);return}this.noteMetadataSyncInFlight.add(e.path);try{let a=await this.app.vault.read(e),o=await this.resolveDocIdForNote(e,a);if(!o)return;let l=(i=(t=this.app.metadataCache.getFileCache(e))==null?void 0:t.frontmatter)!=null?i:{},d=this.resolveZoteroItemKey(l,o);if(!d)return;let c=await this.fetchZoteroItem(d),_=(r=c==null?void 0:c.data)!=null?r:c;if(!_||typeof _!="object")return;let g=this.extractNoteMetadata(l),y=this.extractZoteroMetadata(_),b=await this.getMetadataSnapshot(o,l,e),L={},f={},h={},C=[],k=["title","short_title","date","abstract","doi","publisher","place","issue","volume","pages","item_type","tags","authors","editors"],E={title:"Title",short_title:"Short title",date:"Date",abstract:"Abstract",doi:"DOI",publisher:"Publisher",place:"Place",issue:"Issue",volume:"Volume",pages:"Pages",item_type:"Item type",tags:"Tags",authors:"Authors",editors:"Editors"};for(let P of k){let w=g[P],D=y[P];if(this.metadataValuesEqual(P,w,D))continue;let I=b==null?void 0:b[P];if(I!==void 0){let N=!this.metadataValuesEqual(P,w,I),F=!this.metadataValuesEqual(P,D,I);if(N&&!F){h[P]="note",this.assignMetadataUpdate(f,P,w);continue}if(!N&&F){h[P]="zotero",this.assignMetadataUpdate(L,P,D);continue}}let z=this.getMetadataDecisionLabels(P,w,D,E);C.push({field:P,fieldLabel:E[P],noteLabel:z.noteLabel,zoteroLabel:z.zoteroLabel,noteValue:this.formatMetadataValue(w),zoteroValue:this.formatMetadataValue(D)})}if(C.length>0){let P=await this.promptMetadataBatchDecision(C);for(let w of C){let D=(s=P[w.field])!=null?s:"skip";h[w.field]=D,D==="note"?this.assignMetadataUpdate(f,w.field,g[w.field]):D==="zotero"&&this.assignMetadataUpdate(L,w.field,y[w.field])}}Object.keys(L).length>0&&await this.applyNoteMetadataUpdates(e,L),Object.keys(f).length>0&&await this.applyZoteroMetadataUpdates(d,_,g,y,f),await this.updateMetadataSnapshot(e,o,g,y,b,h,k)}catch(a){console.warn("Failed to sync note metadata with Zotero",a)}finally{this.noteMetadataSyncInFlight.delete(e.path),this.noteMetadataSyncPending.delete(e.path)&&this.scheduleNoteMetadataSync(e,500,n)}}resolveZoteroItemKey(e,n){let t=[this.getFrontmatterValue(e,"zotero_key"),this.getFrontmatterValue(e,"item_key"),this.getFrontmatterValue(e,"doc_id"),n];for(let i of t){let r=M(i);if(r)return r}return""}extractNoteMetadata(e){var L,f,h,C,k,E,P,w,D;let n=this.normalizeMetadataString(e==null?void 0:e.title),t=this.normalizeMetadataString((C=(h=(f=(L=e==null?void 0:e["short title"])!=null?L:e==null?void 0:e.short_title)!=null?f:e==null?void 0:e.shortTitle)!=null?h:e==null?void 0:e["short-title"])!=null?C:e==null?void 0:e["title-short"]),i=this.normalizeMetadataString(e==null?void 0:e.date),r=this.normalizeMetadataString((k=e==null?void 0:e.abstract)!=null?k:e==null?void 0:e.abstractNote),s=this.normalizeMetadataString((E=e==null?void 0:e.doi)!=null?E:e==null?void 0:e.DOI),a=this.normalizeMetadataString(e==null?void 0:e.publisher),o=this.normalizeMetadataString(e==null?void 0:e.place),l=this.normalizeMetadataString(e==null?void 0:e.issue),d=this.normalizeMetadataString(e==null?void 0:e.volume),c=this.normalizeMetadataString(e==null?void 0:e.pages),_=this.normalizeMetadataString((D=(w=(P=e==null?void 0:e["item type"])!=null?P:e==null?void 0:e.item_type)!=null?w:e==null?void 0:e.itemType)!=null?D:e==null?void 0:e["item-type"]),g=this.normalizeMetadataList(e==null?void 0:e.tags),y=this.normalizeMetadataList(e==null?void 0:e.authors),b=this.normalizeMetadataList(e==null?void 0:e.editors);return{title:n,short_title:t,date:i,abstract:r,doi:s,publisher:a,place:o,issue:l,volume:d,pages:c,item_type:_,tags:this.sanitizeObsidianTags(g),authors:y,editors:b}}extractZoteroMetadata(e){var f,h,C;let n=this.normalizeMetadataString(e==null?void 0:e.title),t=this.normalizeMetadataString(he(e)),i=this.normalizeMetadataString(e==null?void 0:e.date),r=this.normalizeMetadataString(e==null?void 0:e.abstractNote),s=this.normalizeMetadataString((f=e==null?void 0:e.DOI)!=null?f:e==null?void 0:e.doi),a=this.normalizeMetadataString(e==null?void 0:e.publisher),o=this.normalizeMetadataString(e==null?void 0:e.place),l=this.normalizeMetadataString(e==null?void 0:e.issue),d=this.normalizeMetadataString(e==null?void 0:e.volume),c=this.normalizeMetadataString(e==null?void 0:e.pages),_=this.normalizeMetadataString((C=(h=e==null?void 0:e.itemType)!=null?h:e==null?void 0:e.item_type)!=null?C:e==null?void 0:e["item-type"]),g=Array.isArray(e==null?void 0:e.creators)?e.creators:[],y=g.filter(k=>(k==null?void 0:k.creatorType)==="author").map(k=>me(k)).filter(Boolean),b=g.filter(k=>(k==null?void 0:k.creatorType)==="editor"||(k==null?void 0:k.creatorType)==="seriesEditor").map(k=>me(k)).filter(Boolean),L=Array.isArray(e==null?void 0:e.tags)?e.tags.map(k=>typeof k=="string"?k:k==null?void 0:k.tag).filter(k=>typeof k=="string"):[];return{title:n,short_title:t,date:i,abstract:r,doi:s,publisher:a,place:o,issue:l,volume:d,pages:c,item_type:_,tags:this.sanitizeObsidianTags(L),authors:this.normalizeMetadataList(y),editors:this.normalizeMetadataList(b)}}normalizeMetadataString(e){return typeof e=="string"?e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).trim():typeof e=="number"&&Number.isFinite(e)?String(e):""}normalizeMetadataList(e){return Array.isArray(e)?e.map(n=>this.normalizeMetadataString(n)).filter(n=>n.length>0):typeof e=="string"?e.split(/[,;\n]+/).map(n=>n.trim()).filter(n=>n.length>0):[]}coerceMetadataStringValue(e){return Array.isArray(e)?e.join("; ").trim():this.normalizeMetadataString(e)}assignMetadataUpdate(e,n,t){if(n==="tags"||n==="authors"||n==="editors"){e[n]=Array.isArray(t)?t:this.normalizeMetadataList(t);return}e[n]=this.coerceMetadataStringValue(t)}metadataValuesEqual(e,n,t){if(Array.isArray(n)||Array.isArray(t)){let i=Array.isArray(n)?n:this.normalizeMetadataList(n),r=Array.isArray(t)?t:this.normalizeMetadataList(t),s=e==="tags";return this.compareMetadataLists(i,r,s)}return this.normalizeMetadataString(n)===this.normalizeMetadataString(t)}compareMetadataLists(e,n,t){let i=a=>a.replace(/\s+/g," ").trim(),r=e.map(i).filter(Boolean),s=n.map(i).filter(Boolean);if(t&&(r.sort(),s.sort()),r.length!==s.length)return!1;for(let a=0;a<r.length;a+=1)if(r[a]!==s[a])return!1;return!0}isMetadataValueEmpty(e){return Array.isArray(e)?e.length===0:this.normalizeMetadataString(e).length===0}formatMetadataValue(e){return Array.isArray(e)?e.join(`
`):this.normalizeMetadataString(e)}getMetadataDecisionLabels(e,n,t,i){let r=this.isMetadataValueEmpty(n),s=this.isMetadataValueEmpty(t),a="Keep note",o="Keep Zotero";return r&&!s?(a="Delete in Zotero",o="Use Zotero value"):!r&&s&&(a="Update Zotero from note",o="Clear note"),{fieldLabel:i[e],noteLabel:a,zoteroLabel:o}}async promptMetadataDecision(e,n,t){let i={title:"Title",short_title:"Short title",date:"Date",abstract:"Abstract",doi:"DOI",publisher:"Publisher",place:"Place",issue:"Issue",volume:"Volume",pages:"Pages",item_type:"Item type",tags:"Tags",authors:"Authors",editors:"Editors"},r=this.getMetadataDecisionLabels(e,n,t,i);return new Promise(s=>{new qe(this.app,r.fieldLabel,r.noteLabel,r.zoteroLabel,this.formatMetadataValue(n),this.formatMetadataValue(t),s).open()})}async promptMetadataBatchDecision(e){return new Promise(n=>{new je(this.app,e.map(t=>({field:t.field,fieldLabel:t.fieldLabel,noteLabel:t.noteLabel,zoteroLabel:t.zoteroLabel,noteValue:t.noteValue,zoteroValue:t.zoteroValue})),t=>n(t)).open()})}normalizeSnapshotValue(e,n){if(Array.isArray(n)){let i=this.normalizeMetadataList(n);return e==="tags"?[...i].sort():i}return this.normalizeMetadataString(n)}getMetadataSnapshotCachePath(){return(0,m.normalizePath)(mn)}normalizeMetadataSnapshotRecord(e){if(!e)return null;let n=e;if(typeof e=="string")try{n=JSON.parse(e)}catch(r){return null}if(!n||typeof n!="object")return null;let t={},i=["title","short_title","date","abstract","doi","publisher","place","issue","volume","pages","item_type","tags","authors","editors"];for(let r of i)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=this.normalizeSnapshotValue(r,n[r]));return Object.keys(t).length>0?t:null}parseLegacyMetadataSnapshot(e){var t;if(!e)return null;let n=(t=e.zrr_metadata_snapshot)!=null?t:e["zrr metadata snapshot"];return n?this.normalizeMetadataSnapshotRecord(n):null}async loadMetadataSnapshotCache(){var t;let e=this.app.vault.adapter,n=this.getMetadataSnapshotCachePath();if(!await e.exists(n))return{};try{let i=await e.read(n),r=JSON.parse(i),s=(t=r==null?void 0:r.entries)!=null?t:r;if(!s||typeof s!="object"||Array.isArray(s))return{};let a={};for(let[o,l]of Object.entries(s)){let d=this.normalizeMetadataSnapshotRecord(l);d&&(a[String(o)]=d)}return a}catch(i){return console.error("Failed to read metadata snapshot cache",i),{}}}async getMetadataSnapshotCache(){return this.metadataSnapshotCache?this.metadataSnapshotCache:(this.metadataSnapshotCache=await this.loadMetadataSnapshotCache(),this.metadataSnapshotCache)}async saveMetadataSnapshotCache(e){await this.ensureFolder(J);let n=this.app.vault.adapter,t=this.getMetadataSnapshotCachePath(),i={version:1,entries:e};await n.write(t,JSON.stringify(i,null,2)),this.metadataSnapshotCache=e}async removeLegacyMetadataSnapshotFrontmatter(e,n){if(!!!(n&&(Object.prototype.hasOwnProperty.call(n,"zrr_metadata_snapshot")||Object.prototype.hasOwnProperty.call(n,"zrr metadata snapshot"))))return;let i=e.path;this.noteSyncSuppressed.add(i),this.noteMetadataSyncSuppressed.add(i);try{await this.app.fileManager.processFrontMatter(e,r=>{delete r.zrr_metadata_snapshot,delete r["zrr metadata snapshot"]})}catch(r){console.warn("Failed to remove legacy metadata snapshot",r)}finally{window.setTimeout(()=>{this.noteSyncSuppressed.delete(i),this.noteMetadataSyncSuppressed.delete(i)},1500)}}async getMetadataSnapshot(e,n,t){if(!e)return null;let i=await this.getMetadataSnapshotCache(),r=i[e];if(r)return r;let s=n?this.parseLegacyMetadataSnapshot(n):null;return s?(i[e]=s,await this.saveMetadataSnapshotCache(i),await this.removeLegacyMetadataSnapshotFrontmatter(t,n),s):null}serializeMetadataSnapshot(e,n){let t={};for(let i of n)e[i]!==void 0&&(t[i]=e[i]);return JSON.stringify(t)}async updateMetadataSnapshot(e,n,t,i,r,s,a){var g,y;if(!n)return;let o=r?{...r}:{};for(let b of a){let L=t[b],f=i[b];if(this.metadataValuesEqual(b,L,f)){o[b]=this.normalizeSnapshotValue(b,L);continue}let h=s[b];h==="note"?o[b]=this.normalizeSnapshotValue(b,L):h==="zotero"&&(o[b]=this.normalizeSnapshotValue(b,f))}let l=this.serializeMetadataSnapshot(o,a),d=await this.getMetadataSnapshotCache(),c=d[n],_=c?this.serializeMetadataSnapshot(c,a):"";if(l!==_){d[n]=o;try{await this.saveMetadataSnapshotCache(d)}catch(b){console.warn("Failed to update metadata snapshot cache",b)}await this.removeLegacyMetadataSnapshotFrontmatter(e,(y=(g=this.app.metadataCache.getFileCache(e))==null?void 0:g.frontmatter)!=null?y:null)}}async removeMetadataSnapshot(e){if(!e)return;let n=await this.getMetadataSnapshotCache();if(n[e]){delete n[e];try{await this.saveMetadataSnapshotCache(n)}catch(t){console.warn("Failed to remove metadata snapshot",t)}}}async applyNoteMetadataUpdates(e,n){if(!Object.keys(n).length)return;let t=e.path;this.noteSyncSuppressed.add(t),this.noteMetadataSyncSuppressed.add(t);try{await this.app.fileManager.processFrontMatter(e,i=>{var r,s,a,o,l,d,c,_,g,y,b;"title"in n&&(i.title=(r=n.title)!=null?r:""),"short_title"in n&&(i["short title"]=(s=n.short_title)!=null?s:"",delete i.short_title,delete i.shortTitle,delete i["title-short"]),"date"in n&&(i.date=(a=n.date)!=null?a:""),"abstract"in n&&(i.abstract=(o=n.abstract)!=null?o:""),"doi"in n&&(i.doi=(l=n.doi)!=null?l:""),"publisher"in n&&(i.publisher=(d=n.publisher)!=null?d:""),"place"in n&&(i.place=(c=n.place)!=null?c:""),"issue"in n&&(i.issue=(_=n.issue)!=null?_:""),"volume"in n&&(i.volume=(g=n.volume)!=null?g:""),"pages"in n&&(i.pages=(y=n.pages)!=null?y:""),"item_type"in n&&(i["item type"]=(b=n.item_type)!=null?b:"",delete i.item_type,delete i.itemType,delete i["item-type"]),"tags"in n&&(i.tags=Array.isArray(n.tags)?n.tags:[]),"authors"in n&&(i.authors=Array.isArray(n.authors)?n.authors:[]),"editors"in n&&(i.editors=Array.isArray(n.editors)?n.editors:[])})}catch(i){console.warn("Failed to update note frontmatter from Zotero",i)}finally{window.setTimeout(()=>{this.noteSyncSuppressed.delete(t),this.noteMetadataSyncSuppressed.delete(t)},1500)}}async applyZoteroMetadataUpdates(e,n,t,i,r){var a,o,l,d,c,_,g,y,b,L,f;if(!Object.keys(r).length)return;let s={};if("title"in r&&(s.title=(a=r.title)!=null?a:""),"short_title"in r&&(s.shortTitle=(o=r.short_title)!=null?o:""),"date"in r&&(s.date=(l=r.date)!=null?l:""),"abstract"in r&&(s.abstractNote=(d=r.abstract)!=null?d:""),"doi"in r&&(s.DOI=(c=r.doi)!=null?c:""),"publisher"in r&&(s.publisher=(_=r.publisher)!=null?_:""),"place"in r&&(s.place=(g=r.place)!=null?g:""),"issue"in r&&(s.issue=(y=r.issue)!=null?y:""),"volume"in r&&(s.volume=(b=r.volume)!=null?b:""),"pages"in r&&(s.pages=(L=r.pages)!=null?L:""),"item_type"in r&&(s.itemType=(f=r.item_type)!=null?f:""),"tags"in r&&(s.tags=this.buildZoteroTags(t.tags,n==null?void 0:n.tags)),"authors"in r||"editors"in r){let h="authors"in r?t.authors:i.authors,C="editors"in r?t.editors:i.editors;s.creators=this.buildZoteroCreators(h,C,Array.isArray(n==null?void 0:n.creators)?n.creators:[])}await this.updateZoteroItemFields(e,n,s)}buildZoteroTags(e,n){let t=this.sanitizeObsidianTags(e),i=Array.from(new Set(t)),r=i.map(l=>({tag:l,type:0})),s=new Set(i),o=(Array.isArray(n)?n.filter(l=>l&&typeof l=="object"&&Number(l.type)===1).filter(l=>typeof l.tag=="string"):[]).filter(l=>!s.has(String(l.tag)));return[...r,...o]}buildZoteroCreators(e,n,t){let i=new Map;for(let o of t){if((o==null?void 0:o.creatorType)!=="editor"&&(o==null?void 0:o.creatorType)!=="seriesEditor")continue;let l=me(o);l&&i.set(l.trim().toLowerCase(),o.creatorType)}let r=t.filter(o=>(o==null?void 0:o.creatorType)!=="author"&&(o==null?void 0:o.creatorType)!=="editor"&&(o==null?void 0:o.creatorType)!=="seriesEditor"),s=e.map(o=>o.trim()).filter(Boolean).map(o=>({creatorType:"author",...this.parseCreatorName(o)})),a=n.map(o=>o.trim()).filter(Boolean).map(o=>{var l;return{creatorType:(l=i.get(o.trim().toLowerCase()))!=null?l:"editor",...this.parseCreatorName(o)}});return[...s,...a,...r]}parseCreatorName(e){var s;let n=String(e||"").trim();if(!n)return{name:""};if(n.includes(",")){let[a,o]=n.split(",",2).map(l=>l.trim());if(a&&o)return{firstName:o,lastName:a};if(a)return{lastName:a}}let t=n.split(/\s+/).filter(Boolean);if(t.length===1)return{name:n};let i=(s=t.pop())!=null?s:"";return{firstName:t.join(" ").trim(),lastName:i}}extractSyncSection(e){let n=de.exec(e);if(!n)return null;let t=e.slice(n.index+n[0].length),i=fe.exec(t);return i?t.slice(0,i.index):null}extractDocIdFromSyncMarker(e){var r;let n=de.exec(e);if(!n)return null;let i=((r=n[0])!=null?r:"").match(/doc_id=([\"']?)([^\"'\s]+)\1/i);return i?i[2].trim():null}parseSyncedChunkBlocks(e){var o;let n=e.split(/\r?\n/),t=[],i="",r=!1,s=[],a=()=>{i&&(t.push({chunkId:i,text:s.join(`
`).trim(),excludeFlag:r}),i="",r=!1,s=[])};for(let l of n){let d=l.match(se);if(d){a();let c=(o=d[1])!=null?o:"",_=c.match(/id=([\"']?)([^\"'\s]+)\1/i),g=_?_[2].trim():"";if(!g)continue;i=g,r=/\bexclude\b/i.test(c)||/\bdelete\b/i.test(c),s=[];continue}if(Se.test(l)){a();continue}if(i){if(ke.test(l)){r=!0;continue}s.push(l)}}return a(),t}normalizeChunkText(e){return e.split(/\r?\n/).map(n=>n.replace(/\s+/g," ").trim()).filter((n,t,i)=>!(n===""&&i[t-1]==="")).join(`
`).trim()}buildSyncedDoclingContent(e,n,t){var a;let i=Array.isArray(n==null?void 0:n.chunks)?n==null?void 0:n.chunks:[];if(!i.length)return`<!-- zrr:sync-start doc_id=${e} -->
${t}
<!-- zrr:sync-end -->`;let r=i.some(o=>{if(typeof(o==null?void 0:o.section)=="string"?o.section.trim():"")return!0;let d=typeof(o==null?void 0:o.chunk_id)=="string"?o.chunk_id.trim():"";return!!(d&&!/^p\d+$/i.test(d))}),s=[`<!-- zrr:sync-start doc_id=${e} -->`];for(let o of i){let l=typeof(o==null?void 0:o.chunk_id)=="string"?o.chunk_id.trim():"";if(!l)continue;let d=Number.isFinite((a=o==null?void 0:o.page_start)!=null?a:NaN)?Number(o.page_start):null,c=!!(o!=null&&o.excluded||o!=null&&o.exclude),g=typeof(o==null?void 0:o.text)=="string"?o.text.trim():"";if(r){let f=typeof(o==null?void 0:o.section)=="string"?o.section.trim():"",h=f?`## ${f}`:"";h&&!g.startsWith("#")&&(g=g?`${h}

${g}`:h)}let y=d!==null?r?` (${d})`:` page=${d}`:"",L=` id=${l}${r?" section":""}${y}${c?" exclude":""}`;s.push(`<!-- zrr:chunk${L} -->`),g&&s.push(g),s.push("<!-- zrr:chunk end -->"),s.push("")}return s[s.length-1]===""&&s.pop(),s.push("<!-- zrr:sync-end -->"),s.join(`
`)}async readChunkPayload(e){try{let n=await this.app.vault.adapter.read(e);return JSON.parse(n)}catch(n){return console.warn("Failed to read cached chunks JSON",n),null}}resolveChunkFromPayload(e,n,t){var s;let i=this.normalizeChunkIdForNote(n,t)||n,r=new Set([n,i,`${t}:${n}`]);for(let a of e){let o=typeof(a==null?void 0:a.chunk_id)=="string"?a.chunk_id:String((s=a==null?void 0:a.chunk_id)!=null?s:"");if(o&&r.has(o))return a}return null}async writeNoteWithSyncSuppressed(e,n){this.noteSyncSuppressed.add(e);try{await this.app.vault.adapter.write(e,n)}finally{window.setTimeout(()=>{this.noteSyncSuppressed.delete(e)},1500)}}async resolveNotePathForDocId(e){if(!e)return null;let n=this.app.vault.adapter,t=await this.getDocIndexEntry(e);if(t!=null&&t.note_path&&await n.exists(t.note_path))return t.note_path;let r=(await this.scanNotesForDocIds(this.settings.outputNoteDir))[e];return r!=null&&r.note_path?(await this.updateDocIndex({doc_id:e,note_path:r.note_path,note_title:r.note_title}),r.note_path):null}isZoteroNoteFile(e){let n=this.app.metadataCache.getFileCache(e),t=n==null?void 0:n.frontmatter;return!!(this.getFrontmatterValue(t,"doc_id")||this.getFrontmatterValue(t,"zotero_key"))}async deleteZoteroNoteAndCacheForFile(e){var d;let n=e.path,t=await this.app.vault.read(e),i=(d=this.extractDocIdFromFrontmatter(t))!=null?d:this.extractDocIdFromSyncMarker(t);if(!i){new m.Notice("No doc_id found in this note.");return}if(!await new Promise(c=>{new Fe(this.app,n,i,c).open()}))return;let s=this.app.vault.adapter,a=(0,m.normalizePath)(`${U}/${i}.json`),o=(0,m.normalizePath)(`${Y}/${i}.json`),l=[];if(await s.exists(a)){let c=await this.readChunkPayload(a);l=(Array.isArray(c==null?void 0:c.chunks)?c==null?void 0:c.chunks:[]).map(g=>{var y;return String((y=g==null?void 0:g.chunk_id)!=null?y:"")}).map(g=>g.startsWith(`${i}:`)?g.slice(i.length+1):g).filter(g=>g)}l.length>0&&await this.reindexChunkUpdates(i,a,[],l);try{await s.exists(a)&&await s.remove(a),await s.exists(o)&&await s.remove(o),await this.removeDocIndexEntry(i),await this.app.vault.delete(e,!0),new m.Notice(`Deleted note and cache for ${i}.`)}catch(c){console.error("Failed to delete note and cached data",c),new m.Notice("Failed to delete note or cached data. See console for details.")}}async deleteZoteroNoteAndCache(){let e=this.app.workspace.getActiveViewOfType(m.MarkdownView);if(!e||!e.file){new m.Notice("No active Zotero note found.");return}await this.deleteZoteroNoteAndCacheForFile(e.file)}formatRedisSearchResults(e){let n=typeof(e==null?void 0:e.total)=="number"?e.total:0,t=typeof(e==null?void 0:e.query)=="string"?e.query:"",i=typeof(e==null?void 0:e.raw_query)=="string"?e.raw_query:"",r=e!=null&&e.field_types&&typeof e.field_types=="object"?e.field_types:null,s=!!(e!=null&&e.fallback_used),a=typeof(e==null?void 0:e.fallback_reason)=="string"?e.fallback_reason:"",o=Array.isArray(e==null?void 0:e.fallback_queries)?e.fallback_queries:[],l=Array.isArray(e==null?void 0:e.fallback_failed_fields)?e.fallback_failed_fields:[],d=Array.isArray(e==null?void 0:e.results)?e.results:[],c=[];if(c.push(`Query: ${i||t}`),t&&i&&t!==i&&c.push(`Expanded: ${t}`),c.push(`Total matches: ${n}`),r&&Object.keys(r).length>0){let _=Object.keys(r).sort().map(g=>`${g}:${r[g]}`);c.push(`Field types: {${_.join(", ")}}`)}if(s&&c.push(`Fallback: ${a||"true"}`),o.length){c.push("Fallback queries:");for(let _ of o)c.push(`  - ${_}`)}if(l.length&&c.push(`Fallback failed fields: ${l.join(", ")}`),c.push(""),!d.length)return c.push("(no results)"),c.join(`
`);for(let _ of d){let g=String(_.doc_id||"").trim(),y=String(_.chunk_id||"").trim(),b=String(_.page_start||"").trim(),L=String(_.page_end||"").trim(),f=String(_.title||"").trim(),h=String(_.section||"").trim(),C=String(_.score||"").trim(),k=String(_.authors||"").trim(),E=String(_.item_type||"").trim(),P=String(_.year||"").trim(),w=String(_.tags||"").trim(),D=String(_.chunk_tags||"").trim(),I=String(_.attachment_key||"").trim(),z=String(_.source_pdf||"").trim(),N=String(_.text||"").replace(/\s+/g," ").trim(),F=N.length>220?`${N.slice(0,220)}\u2026`:N,O=[g];y&&O.push(y),(b||L)&&O.push(`p.${b||"?"}-${L||"?"}`),c.push(O.filter(Boolean).join(" \u2022 ")),C&&c.push(`  score: ${C}`),f&&c.push(`  title: ${f}`),k&&c.push(`  authors: ${k}`),P&&c.push(`  year: ${P}`),E&&c.push(`  item_type: ${E}`),w&&c.push(`  tags: ${w}`),D&&c.push(`  chunk_tags: ${D}`),I&&c.push(`  attachment_key: ${I}`),h&&c.push(`  section: ${h}`),z&&c.push(`  source_pdf: ${z}`),F&&c.push(`  ${F}`),c.push("")}return c.join(`
`)}async searchRedisIndex(){new Oe(this.app,this,this.lastRedisSearchTerm).open()}async runRedisSearch(e){let n=e.trim();if(!n)return"(no query)";if(this.lastRedisSearchTerm=n,!await this.ensureRedisAvailable("index search"))return"Redis is not reachable. Please start Redis Stack and try again.";let t=this.getPluginDir(),i=A.default.join(t,"tools","search_redis.py"),r=["--query",n,"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--limit","10"];try{await this.ensureBundledTools();let s=await this.runPythonWithOutput(i,r),a=JSON.parse(s||"{}");return this.formatRedisSearchResults(a)||"(no results)"}catch(s){return console.error("Redis search failed",s),"Redis search failed. See console for details."}}async showRedisDiagnostics(){if(!await this.ensureRedisAvailable("diagnostics"))return;let e=this.getPluginDir(),n=A.default.join(e,"tools","redis_diagnostics.py"),t=["--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName()];try{await this.ensureBundledTools();let i=await this.runPythonWithOutput(n,t),r=JSON.parse(i||"{}"),s=`\`\`\`json
${JSON.stringify(r,null,2)}
\`\`\``;new ye(this.app,"Redis diagnostics",s||"(empty)").open()}catch(i){console.error("Redis diagnostics failed",i),new m.Notice("Redis diagnostics failed. See console for details.")}}async resolveUniqueBaseName(e,n){let t=this.app.vault.adapter,i=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),r=(0,m.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),s=await t.exists(i),a=this.settings.copyPdfToVault?await t.exists(r):!1;return s||a?`${e}-${n}`:e}async searchZoteroItems(e){let n=["data,meta,children","data,meta"];for(let t of n){let i=new URLSearchParams;i.set("itemType","-attachment"),i.set("limit","25"),i.set("include",t),e.trim()&&i.set("q",e.trim());let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${i.toString()}`);try{let s=await this.requestLocalApi(r,`Zotero search failed for ${r}`),a=JSON.parse(s.toString("utf8"));return Array.isArray(a)?a.map(o=>{var l,d,c,_;return{key:(d=o.key)!=null?d:(l=o.data)==null?void 0:l.key,data:(c=o.data)!=null?c:{},meta:(_=o.meta)!=null?_:{}}}).filter(o=>typeof o.key=="string"&&o.key.trim().length>0):[]}catch(s){console.warn("Failed to search Zotero via local API",s)}}if(!this.canUseWebApi())throw new Error("Zotero search failed for all include modes.");return this.searchZoteroItemsWeb(e)}async hasProcessableAttachment(e){var r;let n=(r=e.data)!=null?r:e,t=typeof e.key=="string"?e.key:M(n.key);return t?!!await Ge(n,t,{fetchZoteroChildren:this.fetchZoteroChildren.bind(this)}):!1}async fetchZoteroChildren(e){let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`);try{let t=await this.requestLocalApi(n,`Zotero children request failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(t){if(console.warn("Failed to fetch Zotero children from local API",t),!this.canUseWebApi())throw t;let i=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/children`),r=await this.requestWebApi(i,`Zotero Web API children request failed for ${i}`);return JSON.parse(r.toString("utf8"))}}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}canUseWebApi(){return!!((this.settings.webApiBaseUrl||"").trim()&&this.settings.webApiKey&&this.settings.webApiLibraryId)}getWebApiLibraryPath(){let e=(this.settings.webApiLibraryId||"").trim();return e?`${this.settings.webApiLibraryType==="group"?"groups":"users"}/${e}`:""}buildWebApiUrl(e){return`${this.settings.webApiBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e,n={}){return new Promise((t,i)=>{var c,_;let r=new URL(e),s=r.protocol==="https:"?$n.default:jn.default,a=(c=n.method)!=null?c:"GET",o={Accept:"*/*",...(_=n.headers)!=null?_:{}},l=n.body;if(l!==void 0&&o["Content-Length"]===void 0){let g=Buffer.isBuffer(l)?l.length:Buffer.byteLength(l);o["Content-Length"]=String(g)}let d=s.request({method:a,hostname:r.hostname,port:r.port||void 0,path:`${r.pathname}${r.search}`,headers:o},g=>{let y=[];g.on("data",b=>y.push(Buffer.from(b))),g.on("end",()=>{var L;let b=Buffer.concat(y);t({statusCode:(L=g.statusCode)!=null?L:0,headers:g.headers,body:b})})});d.on("error",i),l!==void 0&&d.write(l),d.end()})}async requestLocalApi(e,n){let t=await this.requestLocalApiRaw(e);if(t.statusCode>=400){let i=t.body.toString("utf8");throw new Error(`${n!=null?n:"Request failed"}, status ${t.statusCode}: ${i||"no response body"}`)}if(t.statusCode>=300)throw new Error(`${n!=null?n:"Request failed"}, status ${t.statusCode}`);return t.body}async requestLocalApiWithBody(e,n,t,i,r){let s=JSON.stringify(t),a=await this.requestLocalApiRaw(e,{method:n,headers:i,body:s});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async requestWebApi(e,n){let t={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},i=await this.requestLocalApiRaw(e,{headers:t});if(i.statusCode>=400){let r=i.body.toString("utf8");throw new Error(`${n!=null?n:"Request failed"}, status ${i.statusCode}: ${r||"no response body"}`)}if(i.statusCode>=300)throw new Error(`${n!=null?n:"Request failed"}, status ${i.statusCode}`);return i.body}requestWebApiRaw(e,n={}){var i;let t={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey,...(i=n.headers)!=null?i:{}};return this.requestLocalApiRaw(e,{...n,headers:t})}async requestWebApiWithBody(e,n,t,i,r){let s=JSON.stringify(t),a=await this.requestLocalApiRaw(e,{method:n,headers:i,body:s});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}async annotateChunkJsonWithAttachmentKey(e,n){if(n)try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t);if(!i||typeof i!="object")return;let r=i.metadata&&typeof i.metadata=="object"?i.metadata:{};r.attachment_key=n,i.metadata=r,await this.app.vault.adapter.write(e,JSON.stringify(i,null,2))}catch(t){console.warn("Failed to annotate chunks JSON with attachment key",t)}}async updateChunkJsonSourcePdf(e,n){if(n)try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t);if(!i||typeof i!="object")return;i.source_pdf=n,await this.app.vault.adapter.write(e,JSON.stringify(i,null,2))}catch(t){console.warn("Failed to update chunks JSON source_pdf",t)}}buildPdfLinkFromSourcePath(e){if(!e)return"";if(!A.default.isAbsolute(e)&&!/^[A-Za-z]+:\/\//.test(e))return`[[${(0,m.normalizePath)(e)}]]`;let n=A.default.normalize(this.getVaultBasePath()),t=A.default.normalize(e),i=n.endsWith(A.default.sep)?n:`${n}${A.default.sep}`;return t.startsWith(i)?`[[${(0,m.normalizePath)(A.default.relative(n,t))}]]`:`[PDF](${(0,rn.pathToFileURL)(e).toString()})`}toVaultRelativePath(e){if(!e)return"";if(!A.default.isAbsolute(e)&&!/^[A-Za-z]+:\/\//.test(e))return(0,m.normalizePath)(e);let n=A.default.normalize(this.getVaultBasePath()),t=A.default.normalize(e),i=n.endsWith(A.default.sep)?n:`${n}${A.default.sep}`;return t.startsWith(i)?(0,m.normalizePath)(A.default.relative(n,t)):""}normalizeDocIndexPdfPath(e){return e&&(this.toVaultRelativePath(e)||e)}async isFileAccessible(e){if(!e)return!1;try{return await $.promises.access(e),!0}catch(n){return!1}}deriveVaultPdfRelativePath(e,n,t){let i=this.toVaultRelativePath(e);if(i&&i.startsWith((0,m.normalizePath)(this.settings.outputPdfDir)))return i;let r=this.sanitizeFileName(n)||t;return(0,m.normalizePath)(`${this.settings.outputPdfDir}/${r}.pdf`)}async recoverMissingPdfFromAttachment(e,n,t,i,r,s,a){let o=await Ge(n,t,{fetchZoteroChildren:this.fetchZoteroChildren.bind(this)});if(!o&&r&&(o={key:r}),!o)return null;let l=o.key||r,d=o.filePath;if(!this.settings.copyPdfToVault&&d&&await this.isFileAccessible(d))return{sourcePdf:d,attachmentKey:l};try{await this.ensureFolder(this.settings.outputPdfDir)}catch(y){return console.error("Failed to create PDF output folder",y),null}let c=this.deriveVaultPdfRelativePath(e,s,i),_;try{if(d&&await this.isFileAccessible(d))_=await $.promises.readFile(d);else if(l)_=await Ue(l,{buildZoteroUrl:this.buildZoteroUrl.bind(this),getZoteroLibraryPath:this.getZoteroLibraryPath.bind(this),canUseWebApi:this.canUseWebApi.bind(this),buildWebApiUrl:this.buildWebApiUrl.bind(this),getWebApiLibraryPath:this.getWebApiLibraryPath.bind(this),requestLocalApiRaw:this.requestLocalApiRaw.bind(this),requestWebApiRaw:this.requestWebApiRaw.bind(this),requestLocalApi:this.requestLocalApi.bind(this),readFile:$.promises.readFile}),!this.settings.copyPdfToVault&&a&&new m.Notice("Local PDF path unavailable; copied PDF into vault for processing.");else return null}catch(y){return console.error("Failed to read or download PDF attachment",y),null}try{await this.app.vault.adapter.writeBinary(c,this.bufferToArrayBuffer(_))}catch(y){return console.error("Failed to write recovered PDF into vault",y),null}return{sourcePdf:this.getAbsoluteVaultPath(c),attachmentKey:l}}buildPdfLinkForNote(e,n,t){return!e&&!n?"":!this.settings.copyPdfToVault&&n?`[PDF](${this.buildZoteroDeepLink(t!=null?t:"",n)})`:this.buildPdfLinkFromSourcePath(e)}buildVaultPdfCitationLink(e,n,t){if(!e)return"";let i=this.toVaultRelativePath(e);if(!i)return"";let r=n?`#page=${n}`:"";return`[[${i}${r}|${t||i}]]`}async maybeCreateOcrLayeredPdf(e,n,t){if(!this.settings.createOcrLayeredPdf||!this.settings.copyPdfToVault||!e||!((n==null?void 0:n.ocr_used)===!0))return null;if(!this.toVaultRelativePath(e))return console.warn("OCR layered PDF requires a vault-local PDF"),null;try{await this.ensureFolder(this.settings.outputPdfDir)}catch(l){return console.warn("Failed to create OCR PDF output folder",l),null}let r=`${e}.ocr.tmp`,s=(t||(n==null?void 0:n.languages)||"eng").toString(),a=this.getPluginDir(),o=A.default.join(a,"tools","ocr_layered_pdf.py");try{return this.showStatusProgress("Creating OCR PDF...",0),await this.runPythonStreaming(o,["--pdf",e,"--out-pdf",r,"--language",s,"--progress"],l=>{if((l==null?void 0:l.type)==="progress"&&l.total){let d=Math.round(l.current/l.total*100);this.showStatusProgress(`Creating OCR PDF ${l.current}/${l.total}`,d)}},()=>{}),await $.promises.rename(r,e),e}catch(l){return console.warn("OCR layered PDF creation failed",l),null}}getMainLeaf(){let e=new Set(this.app.workspace.getLeavesOfType(be)),n=this.app.workspace.getLeavesOfType("markdown").find(i=>!e.has(i));if(n)return n;let t=this.app.workspace.getLeaf(!1);return t&&!e.has(t)?t:this.app.workspace.getLeaf("tab")}async openNoteInMain(e){let n=(0,m.normalizePath)(e),t=this.app.vault.getAbstractFileByPath(n),i=this.getMainLeaf();if(t instanceof m.TFile){await i.openFile(t,{active:!0});return}await this.app.workspace.openLinkText(n,"",!1)}findChunkLineInText(e,n){if(!e||!n)return null;let t=this.escapeRegExp(n),i=new RegExp(`<!--\\s*zrr:chunk\\b[^>]*\\bid=(["']?)${t}\\1[^>]*-->`,"i"),r=e.split(`
`);for(let s=0;s<r.length;s+=1)if(i.test(r[s]))return s;return null}async openNoteAtChunk(e,n){if(!e||!n)return!1;await this.openNoteInMain(e);let i=this.getMainLeaf().view;if(!(i instanceof m.MarkdownView))return!1;let r=i.editor,s=this.normalizeChunkIdForNote(n)||n,a=this.findChunkLineInText(r.getValue(),s);return a===null?(new m.Notice(`Chunk ${s} not found in note.`),!1):(r.setCursor({line:a,ch:0}),r.scrollIntoView({from:{line:a,ch:0},to:{line:a,ch:0}},!0),!0)}async openInternalLinkInMain(e){let n=this.getMainLeaf(),[t,i]=e.split("#"),r=(t||"").trim(),s=(i||"").trim(),a="zrr-chunk:",o=r?this.app.metadataCache.getFirstLinkpathDest(r,""):null;if(o instanceof m.TFile){let l=s.startsWith(a)?s.slice(a.length).trim():"";if(l&&await this.openNoteAtChunk(o.path,l))return;await n.openFile(o,{active:!0}),e.includes("#")&&!l&&(this.app.workspace.setActiveLeaf(n,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1));return}this.app.workspace.setActiveLeaf(n,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1)}async openNoteInNewTab(e){let n=(0,m.normalizePath)(e);await this.app.workspace.openLinkText(n,"","tab")}async openPdfInMain(e,n){if(!e)return!1;if(!A.default.isAbsolute(e)&&!/^[A-Za-z]+:\/\//.test(e)){let s=(0,m.normalizePath)(e),a=n?`#page=${n}`:"";return await this.app.workspace.openLinkText(`${s}${a}`,"","tab"),!0}let t=A.default.normalize(this.getVaultBasePath()),i=A.default.normalize(e),r=t.endsWith(A.default.sep)?t:`${t}${A.default.sep}`;if(i.startsWith(r)){let s=(0,m.normalizePath)(A.default.relative(t,i)),a=n?`#page=${n}`:"";return await this.app.workspace.openLinkText(`${s}${a}`,"","tab"),!0}try{return window.open((0,rn.pathToFileURL)(e).toString()),!0}catch(s){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,n,t,i){if(n){let r=new URLSearchParams;t&&r.set("page",t),i&&r.set("annotation",i);let s=r.toString()?`?${r.toString()}`:"";return`zotero://open-pdf/library/items/${n}${s}`}return`zotero://select/library/items/${e}`}extractAnnotationKey(e){if(!e)return;let t=(e.includes(":")?e.split(":").slice(1).join(":"):e).trim().toUpperCase();if(/^[A-Z0-9]{8}$/.test(t))return t}formatCitationsMarkdown(e){return e.length?e.map(t=>this.formatCitationMarkdown(t)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var c,_,g,y,b;let n=e.doc_id||"?",t=this.formatCitationPageLabel(e),i=e.annotation_key||this.extractAnnotationKey(e.chunk_id),r=e.attachment_key||((_=(c=this.docIndex)==null?void 0:c[e.doc_id||""])==null?void 0:_.attachment_key),s=e.page_start?String(e.page_start):"",a=(y=(g=this.docIndex)==null?void 0:g[e.doc_id||""])!=null?y:null,o=this.resolveCitationTitle(a,(b=a==null?void 0:a.note_path)!=null?b:null,e.doc_id),l=this.formatCitationLabel(o,t),d=this.normalizeChunkIdForNote(e.chunk_id,e.doc_id);if(this.settings.preferObsidianNoteForCitations&&d&&(a!=null&&a.note_path))return`- ${this.buildNoteChunkLink(a.note_path,d,l)}`;if(r){let L=this.buildZoteroDeepLink(n,r,s,i);return`- [${l}](${L})`}return`- ${l}`}buildNoteChunkLink(e,n,t){let i=(0,m.normalizePath)(e).replace(/\.md$/i,""),r=`zrr-chunk:${n}`,s=this.escapeWikiLabel(t);return`[[${i}#${r}\\|${s}]]`}escapeWikiLabel(e){return e?e.replace(/\|/g,"\\|"):""}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,m.normalizePath)(`${J}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var t;let e=this.app.vault.adapter,n=this.getDocIndexPath();if(!await e.exists(n))return{};try{let i=await e.read(n),r=JSON.parse(i);if(r&&typeof r=="object"){let s=(t=r.entries)!=null?t:r;if(Array.isArray(s)){let a={};for(let l of s)l!=null&&l.doc_id&&(a[String(l.doc_id)]=l);let o=!1;for(let l of Object.values(a))if(l&&typeof l.pdf_path=="string"){let d=this.normalizeDocIndexPdfPath(l.pdf_path);d!==l.pdf_path&&(l.pdf_path=d,o=!0)}return o&&await this.saveDocIndex(a),a}if(s&&typeof s=="object"){let a=s,o=!1;for(let l of Object.values(a))if(l&&typeof l.pdf_path=="string"){let d=this.normalizeDocIndexPdfPath(l.pdf_path);d!==l.pdf_path&&(l.pdf_path=d,o=!0)}return o&&await this.saveDocIndex(a),a}}}catch(i){console.error("Failed to read doc index",i)}return{}}async saveDocIndex(e){await this.ensureFolder(J);let n=this.app.vault.adapter,t=this.getDocIndexPath(),i={version:1,entries:e};await n.write(t,JSON.stringify(i,null,2)),this.docIndex=e}async pruneDocIndexOrphans(){var d;let e=this.app.vault.adapter,n=await this.getDocIndex(),t=new Set(await this.listDocIds(Y)),i=new Set(await this.listDocIds(U)),r=await this.scanNotesForDocIds(this.settings.outputNoteDir),s=0,a=0,o=!1,l=new Date().toISOString();for(let c of Object.keys(n)){let _=n[c],g=!1,y=_!=null&&_.note_path?_.note_path.trim():"";if(y&&await e.exists(y))g=!0;else if((d=r[c])!=null&&d.note_path){g=!0;let L=r[c];L.note_path&&L.note_path!==_.note_path&&(_.note_path=L.note_path,a+=1,o=!0),L.note_title&&L.note_title!==_.note_title&&(_.note_title=L.note_title,a+=1,o=!0),a>0&&(_.updated_at=l)}let b=t.has(c)||i.has(c);!g&&!b&&(delete n[c],s+=1,o=!0)}return o&&await this.saveDocIndex(n),{removed:s,updated:a}}async updateDocIndex(e){var r;let n=await this.getDocIndex(),t=(r=n[e.doc_id])!=null?r:{doc_id:e.doc_id},i={...t,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&t.note_path&&(i.note_path=t.note_path),e.note_title===void 0&&t.note_title&&(i.note_title=t.note_title),e.zotero_title===void 0&&t.zotero_title&&(i.zotero_title=t.zotero_title),e.short_title===void 0&&t.short_title&&(i.short_title=t.short_title),e.pdf_path===void 0&&t.pdf_path&&(i.pdf_path=t.pdf_path),e.attachment_key===void 0&&t.attachment_key&&(i.attachment_key=t.attachment_key),typeof i.pdf_path=="string"&&(i.pdf_path=this.normalizeDocIndexPdfPath(i.pdf_path)),n[e.doc_id]=i,await this.saveDocIndex(n)}async removeDocIndexEntry(e){let n=await this.getDocIndex();if(!n[e]){await this.removeMetadataSnapshot(e);return}delete n[e],await this.saveDocIndex(n),await this.removeMetadataSnapshot(e)}async hydrateDocIndexFromCache(e){var a,o;if(!e)return null;let n=this.app.vault.adapter,t=await this.getDocIndexEntry(e),i={},r=(0,m.normalizePath)(`${Y}/${e}.json`);if(await n.exists(r))try{let l=await n.read(r),d=JSON.parse(l),c=(o=(a=d==null?void 0:d.data)!=null?a:d)!=null?o:{},_=typeof c.title=="string"?c.title:"";_&&(i.zotero_title=_);let g=he(c);if(g&&(i.short_title=g),!i.note_title||!i.note_path){let y=this.sanitizeFileName(_)||e,b=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${y}.md`),L=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${y}-${e}.md`),f="";await n.exists(b)?f=b:await n.exists(L)&&(f=L),f&&(i.note_path=f,i.note_title=A.default.basename(f,".md"))}}catch(l){console.error("Failed to read cached item JSON",l)}!i.note_title&&(t!=null&&t.note_path)&&(i.note_title=A.default.basename(t.note_path,".md"));let s=(0,m.normalizePath)(`${U}/${e}.json`);if(await n.exists(s))try{let l=await n.read(s),d=JSON.parse(l);typeof(d==null?void 0:d.source_pdf)=="string"&&(i.pdf_path=d.source_pdf)}catch(l){console.error("Failed to read cached chunks JSON",l)}return Object.keys(i).length>0&&await this.updateDocIndex({doc_id:e,...i}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var t;return e&&(t=(await this.getDocIndex())[e])!=null?t:null}async inferNotePathFromCache(e){var i,r;let n=this.app.vault.adapter,t=(0,m.normalizePath)(`${Y}/${e}.json`);if(!await n.exists(t))return"";try{let s=await n.read(t),a=JSON.parse(s),o=(r=(i=a==null?void 0:a.data)!=null?i:a)!=null?r:{},l=typeof o.title=="string"?o.title:"",d=this.sanitizeFileName(l)||e,c=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${d}.md`),_=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${d}-${e}.md`);if(await n.exists(c))return c;if(await n.exists(_))return _}catch(s){console.error("Failed to infer note path from cache",s)}return""}async rebuildNoteFromCacheForDocId(e,n){var N,F,O,V,X;try{await this.ensureBundledTools()}catch(T){return n&&new m.Notice("Failed to sync bundled tools. See console for details."),console.error(T),!1}let t=this.app.vault.adapter,i=(0,m.normalizePath)(`${Y}/${e}.json`),r=(0,m.normalizePath)(`${U}/${e}.json`);if(!await t.exists(i)||!await t.exists(r))return n&&new m.Notice("Cached item or chunks JSON not found."),!1;this.showStatusProgress("Preparing...",5);let s;try{let T=await t.read(i);s=JSON.parse(T)}catch(T){return n&&new m.Notice("Failed to read cached item JSON."),console.error(T),this.clearStatusProgress(),!1}let a;try{let T=await t.read(r);a=JSON.parse(T)}catch(T){return n&&new m.Notice("Failed to read cached chunks JSON."),console.error(T),this.clearStatusProgress(),!1}let o=(N=s.data)!=null?N:s,l=typeof o.title=="string"?o.title:"",d=((O=(F=s.key)!=null?F:o.key)!=null?O:e).toString(),c=await this.getDocIndexEntry(e),_=typeof((V=a==null?void 0:a.metadata)==null?void 0:V.attachment_key)=="string"?a.metadata.attachment_key:c==null?void 0:c.attachment_key,g=typeof a.source_pdf=="string"?a.source_pdf:"";if(!g||!await this.isFileAccessible(g)){let T=await this.recoverMissingPdfFromAttachment(g,o,d,e,_,l,n);if(!T)return n&&new m.Notice("Cached source PDF is missing and could not be recovered."),this.clearStatusProgress(),!1;g=T.sourcePdf,T.attachmentKey&&(_=T.attachmentKey),await this.updateChunkJsonSourcePdf(r,g)}let y=await this.resolveLanguageHint(o,d),b=this.buildDoclingLanguageHint(y!=null?y:void 0),L="";if(c!=null&&c.note_path&&await t.exists(c.note_path)&&(L=(0,m.normalizePath)(c.note_path)),!L){let T=this.sanitizeFileName(l)||e,q=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${T}.md`),H=await t.exists(q)?T:await this.resolveUniqueBaseName(T,e);L=(0,m.normalizePath)(`${this.settings.outputNoteDir}/${H}.md`)}try{if(await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let T=this.getLogFileRelativePath(),q=(0,m.normalizePath)(A.default.dirname(T));q&&await this.ensureFolder(q);let H=this.getSpellcheckerInfoRelativePath(),Z=(0,m.normalizePath)(A.default.dirname(H));Z&&await this.ensureFolder(Z)}}catch(T){return n&&new m.Notice("Failed to create notes folder."),console.error(T),this.clearStatusProgress(),!1}let f=this.getPluginDir(),h=A.default.join(f,"tools","docling_extract.py"),C=A.default.join(f,"tools","index_redisearch.py"),k=null,E=null,P=T=>{this.recreateMissingNotesActive&&(this.recreateMissingNotesProcess=T)};try{k=await this.readDoclingQualityLabelFromPdf(g,b),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",k),0);let T=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;await this.runPythonStreaming(h,await this.buildDoclingArgs(g,e,r,L,b,!0),Z=>this.handleDoclingProgress(Z,k),()=>{},T,"docling_extract",P),this.recreateMissingNotesProcess=null,k=await this.readDoclingQualityLabel(r),_&&await this.annotateChunkJsonWithAttachmentKey(r,_);let q=await this.readDoclingMetadata(r),H=await this.maybeCreateOcrLayeredPdf(g,q,b);H&&(g=H,E=H,await this.updateChunkJsonSourcePdf(r,H))}catch(T){return this.recreateMissingNotesAbort?(this.recreateMissingNotesProcess=null,this.clearStatusProgress(),!1):(n&&new m.Notice("Docling extraction failed. See console for details."),console.error(T),this.clearStatusProgress(),!1)}let w=!1,D=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;if(!await this.ensureRedisAvailable("rebuild"))w=!0,n&&new m.Notice("Redis is unavailable; skipping indexing for this note.");else try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",k),0);let T=["--chunks-json",this.getAbsoluteVaultPath(r),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"];this.appendEmbedSubchunkArgs(T),this.appendEmbedContextArgs(T),this.settings.embedIncludeMetadata&&T.push("--embed-include-metadata"),this.appendChunkTaggingArgs(T,{allowRegenerate:!1}),await this.runPythonStreaming(C,T,q=>{if((q==null?void 0:q.type)==="progress"&&q.total){let H=Math.round(q.current/q.total*100),Z=typeof q.message=="string"&&q.message.trim()?q.message:`Indexing chunks ${q.current}/${q.total}`,K=this.formatStatusLabel(Z,k);this.showStatusProgress(K,H)}},()=>{},D,"index_redisearch",P),this.recreateMissingNotesProcess=null}catch(T){if(this.recreateMissingNotesAbort)return this.recreateMissingNotesProcess=null,this.clearStatusProgress(),!1;n&&new m.Notice("RedisSearch indexing failed; note will still be rebuilt."),console.error(T),w=!0}let z=E?this.buildPdfLinkFromSourcePath(E):this.buildPdfLinkForNote(g,c==null?void 0:c.attachment_key,e);try{let T=await this.app.vault.adapter.read(L),q=await this.readChunkPayload(r),H=this.buildSyncedDoclingContent(e,q,T),Z=await this.buildNoteMarkdown(o,(X=s.meta)!=null?X:{},e,z,_,i,H);await this.writeNoteWithSyncSuppressed(L,Z)}catch(T){return n&&new m.Notice("Failed to finalize note markdown."),console.error(T),this.clearStatusProgress(),!1}try{let T=he(o);await this.updateDocIndex({doc_id:e,note_path:L,note_title:A.default.basename(L,".md"),zotero_title:l,short_title:T||void 0,pdf_path:g})}catch(T){console.error("Failed to update doc index",T)}return!0}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async fetchZoteroLibraryOptions(){let e=[{value:"0",label:"My Library (local)"}],n=await this.fetchZoteroGroupOptions();return n.length&&e.push(...n),e}async fetchEmbeddingModelOptions(){let e=(this.settings.embedModel||"").trim(),n=[],t=(this.settings.embedBaseUrl||"").trim().replace(/\/$/,"");if(!t)return e&&n.push({value:e,label:e}),n;let i=(this.settings.embedApiKey||"").trim(),r=await this.fetchModelIds(t,i);if(r.length){let s=r.filter(o=>/embed/i.test(o)),a=s.length?s:r;n.push(...a.map(o=>({value:o,label:o})))}return!n.length&&e&&n.push({value:e,label:e}),n.sort((s,a)=>s.label.localeCompare(a.label))}async fetchChatModelOptions(){return this.fetchLlmModelOptions(this.settings.chatBaseUrl,this.settings.chatApiKey,"chat")}async fetchCleanupModelOptions(){return this.fetchLlmModelOptions(this.settings.llmCleanupBaseUrl,this.settings.llmCleanupApiKey,"cleanup")}async fetchLlmModelOptions(e,n,t){let i=t==="cleanup"?(this.settings.llmCleanupModel||"").trim():(this.settings.chatModel||"").trim(),r=[],s=(e||"").trim().replace(/\/$/,"");if(!s)return i&&r.push({value:i,label:i}),r;let a=(n||"").trim(),o=await this.fetchModelIds(s,a);if(o.length){let l=o.filter(c=>!/embed/i.test(c)),d=l.length?l:o;r.push(...d.map(c=>({value:c,label:c})))}return!r.length&&i&&r.push({value:i,label:i}),r.sort((l,d)=>l.label.localeCompare(d.label))}detectEmbeddingProvider(e){let n=e.toLowerCase();return n.includes("anthropic")?"anthropic":n.includes("openrouter")?"openrouter":n.includes("ollama")||n.includes(":11434")?"ollama":n.includes("openai")?"openai":"generic"}async fetchModelIds(e,n){let t=this.detectEmbeddingProvider(e);try{if(t==="anthropic")return await this.fetchAnthropicModels(e,n);let i=await this.fetchOpenAiCompatibleModels(e,n);return!i.length&&t==="ollama"?await this.fetchOllamaModels(e):i}catch(i){return console.warn("Failed to fetch models",i),[]}}async fetchOpenAiCompatibleModels(e,n){let t=`${e}/models`,i={};n&&(i.Authorization=`Bearer ${n}`);let r=await this.requestLocalApiRaw(t,{headers:i});if(r.statusCode>=400)throw new Error(`Model list request failed (${r.statusCode})`);let s=JSON.parse(r.body.toString("utf8"));return this.extractModelIds(s)}async fetchOllamaModels(e){let t=`${e.replace(/\/v1\/?$/,"")}/api/tags`,i=await this.requestLocalApiRaw(t);if(i.statusCode>=400)throw new Error(`Ollama tags request failed (${i.statusCode})`);let r;try{r=JSON.parse(i.body.toString("utf8"))}catch(a){return console.warn("Failed to parse Ollama tags response",a),[]}if(!r||typeof r!="object")return[];let s=r.models;return Array.isArray(s)?s.map(a=>this.extractModelId(a)).filter(a=>!!a):[]}async fetchAnthropicModels(e,n){if(!n)return[];let t=`${e}/models`,i={"x-api-key":n,"anthropic-version":"2023-06-01"},r=await this.requestLocalApiRaw(t,{headers:i});if(r.statusCode>=400)throw new Error(`Anthropic model list request failed (${r.statusCode})`);let s=JSON.parse(r.body.toString("utf8"));return this.extractModelIds(s)}extractModelIds(e){var i,r,s;if(Array.isArray(e))return e.map(a=>this.extractModelId(a)).filter(a=>!!a);if(!e||typeof e!="object")return[];let n=e,t=(s=(r=(i=n.data)!=null?i:n.models)!=null?r:n.model)!=null?s:n.items;return Array.isArray(t)?t.map(a=>this.extractModelId(a)).filter(a=>!!a):[]}extractModelId(e){var r,s,a;if(!e||typeof e!="object")return null;let n=e,t=(a=(s=(r=n.id)!=null?r:n.name)!=null?s:n.model)!=null?a:n.identifier;return typeof t!="string"?null:t.trim()||null}async fetchZoteroGroupOptions(){let e=new Map,n=i=>{for(let r of i)e.has(r.value)||e.set(r.value,r.label)};if(await this.warnIfZoteroLocalApiUnavailable("Zotero groups"))try{let i=this.buildZoteroUrl("/users/0/groups"),r=await this.requestLocalApi(i,`Zotero groups fetch failed for ${i}`);n(this.parseZoteroGroupOptions(r))}catch(i){console.warn("Failed to fetch Zotero groups from local API",i)}if(this.canUseWebApi()&&this.settings.webApiLibraryType==="user"){let i=(this.settings.webApiLibraryId||"").trim();if(i)try{let r=this.buildWebApiUrl(`/users/${i}/groups`),s=await this.requestWebApi(r,`Zotero Web API groups fetch failed for ${r}`);n(this.parseZoteroGroupOptions(s))}catch(r){console.warn("Failed to fetch Zotero groups from Web API",r)}}return Array.from(e.entries()).map(([i,r])=>({value:i,label:r})).sort((i,r)=>i.label.localeCompare(r.label))}parseZoteroGroupOptions(e){var i,r,s,a,o;let n;try{n=JSON.parse(e.toString("utf8"))}catch(l){return console.warn("Failed to parse Zotero group payload",l),[]}if(!Array.isArray(n))return[];let t=[];for(let l of n){if(!l||typeof l!="object")continue;let d=(i=l.data)!=null?i:l,c=(s=(r=d.id)!=null?r:l.id)!=null?s:d.key;if(!c)continue;let _=String(c).trim();if(!_)continue;let g=(o=(a=d.name)!=null?a:l.name)!=null?o:_,y=String(g||_).trim()||_;t.push({value:`groups/${_}`,label:`Group: ${y}`})}return t}async ensureFolder(e){let n=this.app.vault.adapter,t=(0,m.normalizePath)(e).split("/").filter(Boolean),i="";for(let r of t)i=i?`${i}/${r}`:r,await n.exists(i)||await n.mkdir(i)}async buildNoteMarkdown(e,n,t,i,r,s,a){let o=`[[${s}]]`,l=this.settings.copyPdfToVault&&i.startsWith("[["),d=r?this.buildZoteroDeepLink(t,r):"",c=d||i,_=l?i:d||i,g=_?l?`PDF: !${_}`:`PDF: ${_}`:"",y=g?`${g}

`:"",b=await this.buildTemplateVars(e,n,t,c,o);b.pdf_block=y,b.pdf_line=g,b.docling_markdown=a;let L=this.ensureDocIdInFrontmatter(await this.renderFrontmatter(e,n,t,c,o,b),t),f=L?`---
${L}
---

`:"",h=(this.settings.noteBodyTemplate||"").trim(),C=`${y}${a}`,k=h?this.renderTemplate(h,b,C,{appendDocling:!0}):C;return`${f}${k}`}async renderFrontmatter(e,n,t,i,r,s){var c;let a=(c=this.settings.frontmatterTemplate)!=null?c:"";if(!a.trim())return"";let o=s!=null?s:await this.buildTemplateVars(e,n,t,i,r),l=this.renderTemplate(a,o,"",{appendDocling:!1}).trim(),d=this.stripEmptyFrontmatterFields(l);return this.normalizeFrontmatterKeySpacing(d)}stripEmptyFrontmatterFields(e){if(!e.trim())return"";let n=e.split(/\r?\n/),t=[],i=/^([A-Za-z0-9][A-Za-z0-9 _-]*)\s*:\s*(.*)$/,r=/^[ \t]+-\s*(.*)$/,s=new Set(["abstract"]),a=l=>l===""||l==='""'||l==="''",o=0;for(;o<n.length;){let l=n[o],d=l.match(i);if(!d){t.push(l),o+=1;continue}let c=d[1].trim(),_=d[2].trim();if(s.has(c)){t.push(l),o+=1;continue}if(!a(_)){t.push(l),o+=1;continue}let g=o+1,y=[];for(;g<n.length&&n[g].match(r);)y.push(n[g]),g+=1;if(y.length===0){for(o=g;o<n.length&&n[o].trim()==="";)o+=1;continue}let b=y.filter(L=>{let f=L.match(r);if(!f)return!1;let h=f[1].trim();return!a(h)});if(b.length>0&&t.push(l,...b),o=g,b.length===0)for(;o<n.length&&n[o].trim()==="";)o+=1}for(;t.length>0&&t[t.length-1].trim()==="";)t.pop();return t.join(`
`).trim()}renderTemplate(e,n,t,i={}){let r=e.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(s,a)=>{var o;return(o=n[a])!=null?o:""});return i.appendDocling&&!e.includes("{{docling_markdown}}")&&n.docling_markdown&&(r=`${r}

${n.docling_markdown}`),r.trim()?r:t}async buildTemplateVars(e,n,t,i,r){let s=M(e.title),a=M(e.shortTitle),o=M(e.date),l=typeof(n==null?void 0:n.parsedDate)=="string"?n.parsedDate:"",d=Qe(l||o),c=/^\d{4}$/.test(d)?d:"",_=Array.isArray(e.creators)?e.creators:[],g=_.filter(S=>S.creatorType==="author").map(S=>me(S)),y=g.join("; "),b=_.filter(S=>S.creatorType==="editor"||S.creatorType==="seriesEditor").map(S=>me(S)),L=b.join("; "),f=Array.isArray(e.tags)?e.tags.map(S=>typeof S=="string"?S:S==null?void 0:S.tag).filter(Boolean):[],h=this.sanitizeObsidianTags(f),C=h.join("; "),k=await this.resolveCollectionTitles(e),E=k.join("; "),P=this.toObsidianLinks(k),w=P.join("; "),D=M(e.itemType),I=typeof(n==null?void 0:n.creatorSummary)=="string"?n.creatorSummary:"",z=M(e.publicationTitle),N=M(e.bookTitle),F=M(e.journalAbbreviation),O=M(e.volume),V=M(e.issue),X=M(e.pages),T=M(e.dateAdded),q=M(e.dateModified),H=typeof e.key=="string"?e.key:t,Z=M(e.DOI);Z||(Z=Ln(e));let K=wn(e,n),pe=null;(!Z||!a||!K)&&(pe=await this.fetchZoteroItemCsl(H)),Z||(Z=Sn(pe)),a||(a=Cn(pe)),K||(K=Pn(pe));let oe=M(e.ISBN),ie=M(e.ISSN),ue=M(e.publisher),_e=M(e.place),He=M(e.url),We=M(e.language),Ce=M(e.abstractNote),ne=this.buildZoteroDeepLink(H),xe=Array.from(new Set([K,a,Z].map(S=>String(S||"").trim()).filter(S=>S.length>0))),v=xe.join("; "),x={doc_id:t,zotero_key:typeof e.key=="string"?e.key:t,item_link:ne,citekey:K,title:s,short_title:a,date:o,year:d,year_number:c,authors:y,editors:L,aliases:v,tags:C,collection_title:E,collection_titles:E,collections_links:w,item_type:D,creator_summary:I,publication_title:z,book_title:N,journal_abbrev:F,volume:O,issue:V,pages:X,date_added:T,date_modified:q,doi:Z,isbn:oe,issn:ie,publisher:ue,place:_e,url:He,language:We,abstract:Ce,pdf_link:i,item_json:r};for(let[S,G]of Object.entries(x)){let re=this.escapeYamlString(G);x[`${S}_yaml`]=re,x[`${S}_quoted`]=re,x[`${S}_text`]=re}return x.authors_yaml_list=this.toYamlList(g),x.editors_yaml_list=this.toYamlList(b),x.tags_yaml_list=h.length>0?this.toYamlList(h):"",x.aliases_yaml_list=xe.length>0?this.toYamlList(xe):"",x.collections_yaml_list=this.toYamlList(k),x.collections_links_yaml_list=this.toYamlList(P),x.tags_raw=f.join("; "),x.tags_raw_yaml=this.escapeYamlString(x.tags_raw),x.tags_raw_yaml_list=f.length>0?this.toYamlList(f):"",x.authors_list=x.authors_yaml_list,x.editors_list=x.editors_yaml_list,x.tags_list=x.tags_yaml_list,x.aliases_list=x.aliases_yaml_list,x.collections_list=x.collections_yaml_list,x.collections_links_list=x.collections_links_yaml_list,x}escapeYamlString(e){return`"${String(e).replace(/\r\n/g,`
`).replace(/\r/g,`
`).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n")}"`}toYamlList(e){return e.length?e.map(n=>`  - ${this.escapeYamlString(n)}`).join(`
`):'  - ""'}sanitizeObsidianTags(e){let n=this.settings.tagSanitizeMode||"kebab",t=n==="replace"?"kebab":n;return e.map(i=>this.sanitizeObsidianTag(i,t)).filter(i=>i.length>0)}sanitizeObsidianTag(e,n){let t=String(e||"").trim();if(!t)return"";let i=t.replace(/^#+/,"");if(n==="none")return i;let r=o=>!/^\d+$/.test(o),a=(o=>i.split("/").map(c=>{let g=c.replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).filter(Boolean);if(!g.length)return"";if(o==="camel"||o==="pascal"){let[b,...L]=g;return[o==="pascal"?b.charAt(0).toUpperCase()+b.slice(1):b.charAt(0).toLowerCase()+b.slice(1),...L.map(h=>h.charAt(0).toUpperCase()+h.slice(1))].join("")}let y=o==="snake"?"_":"-";return g.join(y)}).filter(Boolean).join("/").replace(/\/{2,}/g,"/").replace(/^\/+|\/+$/g,""))(n);return a&&r(a)?a:""}toObsidianLinks(e){return e.map(n=>String(n||"").trim()).filter(n=>n.length>0).map(n=>n.startsWith("[[")&&n.endsWith("]]")?n:`[[${n}]]`)}getVaultBasePath(){var t;let e=this.app.vault.adapter;if(e instanceof m.FileSystemAdapter)return e.getBasePath();let n=(t=e.getBasePath)==null?void 0:t.call(e);if(n)return n;throw new Error("Vault base path is unavailable.")}getPluginDir(){var i;let e=this.getVaultBasePath(),n=(i=this.manifest.dir)!=null?i:this.manifest.id;if(!n)throw new Error("Plugin directory is unavailable.");let t=A.default.isAbsolute(n)?n:A.default.join(e,n);return A.default.normalize(t)}async ensureBundledTools(){let e=this.getPluginDir(),n=A.default.join(e,"tools");await $.promises.mkdir(n,{recursive:!0});for(let[t,i]of Object.entries(Tn)){let r=A.default.join(n,t),s=!0;try{await $.promises.readFile(r,"utf8")===i&&(s=!1)}catch(a){}s&&await $.promises.writeFile(r,i,"utf8")}}async migrateCachePaths(){let e="zotero/items",n="zotero/chunks",t=Y,i=U,r=this.app.vault.adapter,s=(0,m.normalizePath)(e),a=(0,m.normalizePath)(n),o=(0,m.normalizePath)(t),l=(0,m.normalizePath)(i),d=o.split("/").slice(0,-1).join("/"),c=l.split("/").slice(0,-1).join("/");d&&await this.ensureFolder(d),c&&await this.ensureFolder(c);let _=await r.exists(s),g=await r.exists(a),y=await r.exists(o),b=await r.exists(l);_&&!y&&await r.rename(s,o),g&&!b&&await r.rename(a,l)}getAbsoluteVaultPath(e){let n=this.getVaultBasePath(),t=A.default.isAbsolute(e)?e:A.default.join(n,e);return A.default.normalize(t)}async resolveAttachmentOutputDir(e){let n=e?A.default.isAbsolute(e)?this.toVaultRelativePath(e):(0,m.normalizePath)(e):"";if(!n)return null;let t=this.app.fileManager;if(!(t!=null&&t.getAvailablePathForAttachment))return null;try{let i=`zrr-image-${Date.now()}.png`,r=await t.getAvailablePathForAttachment(i,n);if(!r)return null;let s=A.default.isAbsolute(r)?r:this.getAbsoluteVaultPath(r),a=A.default.normalize(A.default.dirname(s)),o=A.default.normalize(this.getVaultBasePath()),l=this.toVaultRelativePath(a);return!l&&a!==o?null:{absolute:a,relative:l}}catch(i){return console.warn("Failed to resolve attachment output dir",i),null}}async buildDoclingArgs(e,n,t,i,r,s=!1){let a=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,o=["--pdf",e,"--doc-id",n,"--out-json",this.getAbsoluteVaultPath(t),"--out-md",this.getAbsoluteVaultPath(i),"--chunking",this.settings.chunkingMode,"--ocr",a];s&&o.push("--progress"),this.settings.ocrMode==="force_low_quality"&&o.push("--force-ocr-low-quality"),this.settings.forcePerPageOcr&&o.push("--force-per-page-ocr"),o.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),r&&o.push("--language-hint",r),this.settings.enableLlmCleanup&&(o.push("--enable-llm-cleanup"),this.settings.llmCleanupBaseUrl&&o.push("--llm-cleanup-base-url",this.settings.llmCleanupBaseUrl),this.settings.llmCleanupApiKey&&o.push("--llm-cleanup-api-key",this.settings.llmCleanupApiKey),this.settings.llmCleanupModel&&o.push("--llm-cleanup-model",this.settings.llmCleanupModel),o.push("--llm-cleanup-temperature",String(this.settings.llmCleanupTemperature)),o.push("--llm-cleanup-min-quality",String(this.settings.llmCleanupMinQuality)),o.push("--llm-cleanup-max-chars",String(this.settings.llmCleanupMaxChars)));let l=this.getPluginDir(),d=A.default.join(l,"tools","ocr_wordlist.txt");if((0,$.existsSync)(d)&&o.push("--enable-dictionary-correction","--dictionary-path",d),this.settings.enableFileLogging){let _=this.getLogFileAbsolutePath();_&&o.push("--log-file",_);let g=this.getAbsoluteVaultPath(this.getSpellcheckerInfoRelativePath());g&&o.push("--spellchecker-info-out",g)}let c=await this.resolveAttachmentOutputDir(i);return c&&(c.relative&&await this.ensureFolder(c.relative),o.push("--image-output-dir",c.absolute)),this.appendOcrEngineArgs(o),o}appendOcrEngineArgs(e){let n=this.settings.ocrEngine,t=(this.settings.paddleApiKey||"").trim(),i=(this.settings.paddleVlApiUrl||"").trim(),r=(this.settings.paddleStructureApiUrl||"").trim(),s=o=>{e.push("--prefer-ocr-engine",o,"--fallback-ocr-engine",o)},a=()=>{e.push("--no-paddle-vl-api","--no-paddle-structure-api")};switch(n){case"tesseract":s("tesseract"),e.push("--no-paddle-vl","--no-paddle-structure-v3"),a();break;case"paddle_structure_local":s("paddle"),e.push("--paddle-structure-v3","--no-paddle-vl"),a();break;case"paddle_vl_local":s("paddle"),e.push("--paddle-vl","--no-paddle-structure-v3"),a();break;case"paddle_structure_api":s("paddle"),e.push("--paddle-structure-v3","--no-paddle-vl","--no-paddle-vl-api"),t?(e.push("--paddle-structure-api","--paddle-structure-api-token",t),r&&e.push("--paddle-structure-api-url",r)):e.push("--no-paddle-structure-api");break;case"paddle_vl_api":s("paddle"),e.push("--paddle-vl","--no-paddle-structure-v3","--no-paddle-structure-api"),t?(e.push("--paddle-vl-api","--paddle-vl-api-token",t),i&&e.push("--paddle-vl-api-url",i)):e.push("--no-paddle-vl-api");break;default:a();break}}appendEmbedSubchunkArgs(e){let n=this.settings.embedSubchunkChars;Number.isFinite(n)&&e.push("--embed-subchunk-chars",String(Math.max(0,Math.trunc(n))));let t=this.settings.embedSubchunkOverlap;Number.isFinite(t)&&e.push("--embed-subchunk-overlap",String(Math.max(0,Math.trunc(t))))}appendEmbedContextArgs(e){let n=this.settings.embedContextWindow;Number.isFinite(n)&&e.push("--embed-context-window",String(Math.max(0,Math.trunc(n))));let t=this.settings.embedContextChars;Number.isFinite(t)&&e.push("--embed-context-chars",String(Math.max(0,Math.trunc(t))))}appendChunkTaggingArgs(e,n){if((n==null?void 0:n.allowRegenerate)===!1||!this.settings.enableChunkTagging)return;let t=(this.settings.llmCleanupBaseUrl||"").trim(),i=(this.settings.llmCleanupModel||"").trim();if(!t||!i)return;e.push("--generate-chunk-tags","--tag-base-url",t,"--tag-model",i);let r=(this.settings.llmCleanupApiKey||"").trim();r&&e.push("--tag-api-key",r),e.push("--tag-temperature",String(this.settings.llmCleanupTemperature))}getRedisDataDir(){let e=(process.env.ZRR_DATA_DIR||"").trim();if(e)return e;let n=(this.settings.redisDataDirOverride||"").trim();return!this.settings.autoAssignRedisPort&&n?A.default.isAbsolute(n)?n:A.default.join(this.getVaultBasePath(),n):A.default.join(this.getVaultBasePath(),J,"redis-data")}getDockerComposePath(){let e=this.getPluginDir();return A.default.join(e,"tools","docker-compose.yml")}async resolveDockerPath(){var l;let e=(l=this.settings.dockerPath)==null?void 0:l.trim(),n=["/opt/homebrew/bin/docker","/usr/local/bin/docker","/usr/bin/docker","/Applications/Docker.app/Contents/Resources/bin/docker"],t=["/opt/homebrew/bin/podman","/usr/local/bin/podman","/usr/bin/podman"],i=["/opt/homebrew/bin/podman-compose","/usr/local/bin/podman-compose","/usr/bin/podman-compose"],r=[];e&&r.push(e);let s=e?this.getContainerCliKind(e):"docker",a=s==="podman-compose"?[i,t,n]:s==="podman"?[t,i,n]:[n,t,i];if(!e||e==="docker"||e==="podman"||e==="podman-compose")for(let d of a)r.push(...d);for(let d of r)if(A.default.isAbsolute(d))try{if(await this.isContainerCliAvailable(d))return d}catch(c){}let o=[e,s==="podman"?"podman":"docker",s==="podman"?"docker":"podman","podman-compose"].filter(d=>!!(d&&d.trim()));for(let d of o)if(await this.isContainerCliAvailable(d))return d;return e||"docker"}async isContainerCliAvailable(e){return new Promise(n=>{let t=(0,Q.spawn)(e,["--version"]);t.on("error",()=>n(!1)),t.on("close",i=>n(i===0))})}getContainerCliKind(e){let n=A.default.basename(e);return n==="podman-compose"?"podman-compose":n.includes("podman")?"podman":"docker"}async isContainerDaemonRunning(e){let n=this.getContainerCliKind(e),t=e,i=["info"];if(n==="podman-compose"){let r=await this.resolvePodmanBin();if(!r)return!1;t=r}return new Promise(r=>{let s=(0,Q.spawn)(t,i),a=!1,o=d=>{a||(a=!0,r(d))},l=setTimeout(()=>{s.kill(),o(!1)},2e3);s.on("error",()=>{clearTimeout(l),o(!1)}),s.on("close",d=>{clearTimeout(l),o(d===0)})})}getContainerDaemonHint(e){let n=this.getContainerCliKind(e);return n==="podman"||n==="podman-compose"?"Podman machine not running. Run `podman machine start`.":"Docker Desktop is not running. Start Docker Desktop."}async supportsComposeSubcommand(e){return new Promise(n=>{let t=(0,Q.spawn)(e,["compose","version"]);t.on("error",()=>n(!1)),t.on("close",i=>n(i===0))})}async findPodmanComposePath(){let e=["/opt/homebrew/bin/podman-compose","/usr/local/bin/podman-compose","/usr/bin/podman-compose"];for(let n of e)try{return await $.promises.access(n),n}catch(t){}return await this.isContainerCliAvailable("podman-compose")?"podman-compose":null}async resolvePodmanBin(){let e=["/opt/homebrew/bin/podman","/usr/local/bin/podman","/usr/bin/podman"];for(let n of e)if(await this.isContainerCliAvailable(n))return n;return await this.isContainerCliAvailable("podman")?"podman":null}async resolveComposeCommand(e){let n=A.default.basename(e);if(n==="podman-compose")return{command:e,argsPrefix:[]};if(n==="podman"){let t=await this.findPodmanComposePath();return t?{command:t,argsPrefix:[]}:await this.supportsComposeSubcommand(e)?{command:e,argsPrefix:["compose"]}:null}return await this.supportsComposeSubcommand(e)?{command:e,argsPrefix:["compose"]}:null}async autoDetectContainerCliOnLoad(){var s;let e=await this.resolveDockerPath();if(!await this.isContainerCliAvailable(e)){this.notifyContainerOnce("Docker or Podman not found. Install Docker Desktop or Podman and set Docker/Podman path in settings.");return}let n=((s=this.settings.dockerPath)==null?void 0:s.trim())||"docker";(!await this.isContainerCliAvailable(n)||n==="docker"||n==="podman"||n==="podman-compose")&&e&&e!==n&&(this.settings.dockerPath=e,await this.saveSettings());let r=a=>new Promise(o=>setTimeout(o,a));if(!await this.isContainerDaemonRunning(e)){for(let a of[5e3,1e4])if(await r(a),await this.isContainerDaemonRunning(e))return;this.notifyContainerOnce(this.getContainerDaemonHint(e))}}getDockerProjectName(){let e=a=>a.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,32),n=(process.env.ZRR_PROJECT_NAME||"").trim();if(n&&!this.settings.autoAssignRedisPort)return e(n)||"zrr";let t=(this.settings.redisProjectName||"").trim();if(t&&!this.settings.autoAssignRedisPort)return e(t)||"zrr";let i=this.getVaultBasePath(),r=A.default.basename(i).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,18),s=(0,Be.createHash)("sha1").update(i).digest("hex").slice(0,8);return`zrr-${r||"vault"}-${s}`}getRedisPortFromUrl(){try{let e=new URL(this.settings.redisUrl),n=e.port?Number(e.port):6379;return Number.isFinite(n)&&n>0?n:6379}catch(e){return 6379}}getVaultPreferredRedisPort(){let e=(0,Be.createHash)("sha1").update(this.getVaultBasePath()).digest("hex");return 6400+Number.parseInt(e.slice(0,4),16)%2e3}getRedisHostFromUrl(){try{return new URL(this.settings.redisUrl).hostname||"127.0.0.1"}catch(e){return"127.0.0.1"}}isLocalRedisHost(e){let n=e.trim().toLowerCase();return n?n==="localhost"||n==="0.0.0.0"||n==="::1"?!0:n.startsWith("127."):!1}getPortCheckHost(e){return this.isLocalRedisHost(e)?"127.0.0.1":e}async isPortFree(e,n){return new Promise(t=>{let i=Pe.default.createServer();i.once("error",()=>t(!1)),i.once("listening",()=>{i.close(()=>t(!0))}),i.listen(n,e)})}async findAvailablePort(e,n){for(let i=0;i<25;i+=1){let r=n+i;if(await this.isPortFree(e,r))return r}return null}updateRedisUrlPort(e,n){try{let t=new URL(e);return t.port=String(n),t.toString()}catch(t){return`redis://127.0.0.1:${n}`}}async isRedisReachable(e){let n="127.0.0.1",t=6379;try{let i=new URL(e);n=i.hostname||n,t=i.port?Number(i.port):t}catch(i){return!1}return n=this.getPortCheckHost(n),new Promise(i=>{let r=new Pe.default.Socket,s=!1,a=o=>{s||(s=!0,r.destroy(),i(o))};r.setTimeout(500),r.once("connect",()=>a(!0)),r.once("timeout",()=>a(!1)),r.once("error",()=>a(!1)),r.connect(t,n)})}async isZoteroLocalApiReachable(){let e=(this.settings.zoteroBaseUrl||"").trim();if(!e)return!1;let n="127.0.0.1",t=23119;try{let i=new URL(e);if(n=i.hostname||n,i.port){let r=Number(i.port);Number.isFinite(r)&&r>0&&(t=r)}else i.protocol==="https:"?t=443:t=80}catch(i){return!1}return new Promise(i=>{let r=new Pe.default.Socket,s=!1,a=o=>{s||(s=!0,r.destroy(),i(o))};r.setTimeout(500),r.once("connect",()=>a(!0)),r.once("timeout",()=>a(!1)),r.once("error",()=>a(!1)),r.connect(t,n)})}getRedisNamespace(){let e=this.getVaultBasePath(),n=A.default.basename(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,24),t=(0,Be.createHash)("sha1").update(e).digest("hex").slice(0,8);return`${n||"vault"}-${t}`}getRedisIndexName(){return`${(this.settings.redisIndex||"idx:zotero").trim()||"idx:zotero"}:${this.getRedisNamespace()}`}getRedisKeyPrefix(){let e=(this.settings.redisPrefix||"zotero:chunk:").trim()||"zotero:chunk:";return`${e.endsWith(":")?e:`${e}:`}${this.getRedisNamespace()}:`}async isComposeProjectRunning(e,n,t,i,r){return new Promise(s=>{let a=(0,Q.spawn)(e,[...n,"-p",i,"-f",t,"ps","-q"],{cwd:A.default.dirname(t),env:r}),o="";a.stdout.on("data",l=>{o+=l.toString()}),a.on("error",l=>{console.warn("Redis Stack status check failed",l),s(!1)}),a.on("close",l=>{if(l!==0){s(!1);return}s(o.trim().length>0)})})}async startRedisStack(e){var n;try{await this.ensureBundledTools();let t=this.getDockerComposePath(),i=this.getRedisDataDir();await $.promises.mkdir(i,{recursive:!0});let r=await this.resolveDockerPath(),s=((n=this.settings.dockerPath)==null?void 0:n.trim())||"docker";if((!await this.isContainerCliAvailable(s)||!s||s==="docker"||s==="podman"||s==="podman-compose")&&r&&r!==s&&(this.settings.dockerPath=r,await this.saveSettings(),e||new m.Notice(`Docker/Podman path set to ${r}.`)),!await this.isContainerCliAvailable(r)){e||new m.Notice('Docker or Podman not found. Install Docker Desktop or Podman and set "Docker/Podman path" in settings.');return}if(!await this.isContainerDaemonRunning(r)){e||new m.Notice(this.getContainerDaemonHint(r));return}let o=await this.resolveComposeCommand(r);if(!o){e||new m.Notice("Compose support not found. Install Docker Desktop or Podman with podman-compose.");return}let l={...process.env};if(A.default.basename(o.command)==="podman-compose"){let h=await this.resolvePodmanBin();if(h&&(l.PODMAN_BIN=h,A.default.isAbsolute(h))){let C=A.default.dirname(h),k=l.PATH||"";k.split(A.default.delimiter).includes(C)||(l.PATH=`${C}${A.default.delimiter}${k}`)}}let d=this.getDockerProjectName();if(await this.isComposeProjectRunning(o.command,o.argsPrefix,t,d,l)){e||new m.Notice("Redis Stack already running for this vault.");return}let c=this.getRedisPortFromUrl(),_=this.getRedisHostFromUrl(),g=this.getPortCheckHost(_),y=this.settings.autoAssignRedisPort&&this.isLocalRedisHost(_),b=this.settings.redisUrl,L=c,f=()=>{if(!e){if(!this.settings.autoAssignRedisPort){new m.Notice("Redis already running. If you share Redis across vaults, disable Auto-start Redis in this vault.");return}new m.Notice(`Redis already running at ${b}.`)}};if(y){let h=c===6379?this.getVaultPreferredRedisPort():c,C=await this.findAvailablePort(g,h);if(!C)throw new Error(`No available Redis port found starting at ${h}.`);C!==c&&(L=C,b=this.updateRedisUrlPort(b,L),this.settings.redisUrl=b,await this.saveSettings(),e||new m.Notice(`Using Redis port ${L} for this vault.`))}else{if(this.isLocalRedisHost(_)&&!await this.isPortFree(g,L)){await this.isRedisReachable(b)?f():e||new m.Notice(`Port ${L} is already in use and Redis is not reachable at ${b}. Update the Redis URL or enable auto-assign.`);return}if(await this.isRedisReachable(b)){f();return}}l.ZRR_DATA_DIR=i,l.ZRR_PORT=String(L);try{await this.runCommand(o.command,[...o.argsPrefix,"-p",d,"-f",t,"down"],{cwd:A.default.dirname(t),env:l})}catch(h){console.warn("Redis Stack stop before restart failed",h)}await this.runCommand(o.command,[...o.argsPrefix,"-p",d,"-f",t,"up","-d"],{cwd:A.default.dirname(t),env:l}),e||new m.Notice("Redis Stack started.")}catch(t){e||new m.Notice("Failed to start Redis Stack. Check Docker/Podman and file sharing."),console.error("Failed to start Redis Stack",t)}}async setupPythonEnv(){let e=this.getPluginDir(),n=this.getPythonVenvDir(),t=this.getVenvPythonPath(n);await this.ensureBundledTools();let i=this.resolveRequirementsPath(e);if(!i)throw new Error(`requirements.txt not found in ${e}`);try{new m.Notice("Setting up Python environment..."),this.showStatusProgress("Setting up Python environment...",null),console.log(`Python env: using plugin dir ${e}`),console.log(`Python env: venv path ${n}`),await $.promises.mkdir(A.default.dirname(n),{recursive:!0});let r=null,s=async()=>(r||(r=await this.resolveBootstrapPython()),r);if((0,$.existsSync)(t)){let a=await this.getPythonVersion(t,[]);if(a&&this.isUnsupportedPythonVersion(a)){let o=await s();console.log(`Python env: existing venv uses Python ${a.major}.${a.minor}; rebuilding with ${o.command} ${o.args.join(" ")}`),this.showStatusProgress("Rebuilding Python environment...",null),await $.promises.rm(n,{recursive:!0,force:!0})}}if(!(0,$.existsSync)(t)){let a=await s();console.log(`Python env: creating venv with ${a.command} ${a.args.join(" ")}`),await this.runCommand(a.command,[...a.args,"-m","venv",n],{cwd:e})}await this.runCommandStreaming(t,["-m","pip","install","-r",i],{cwd:e},a=>{let o=a.trim();if(!o)return;let l=o.match(/^Collecting\s+([^\s]+)/);if(l){this.showStatusProgress(`Installing ${l[1]}...`,null);return}if(o.startsWith("Installing collected packages")){this.showStatusProgress("Installing packages...",null);return}o.startsWith("Successfully installed")&&this.showStatusProgress("Python environment ready.",100)}),this.settings.pythonPath=t,await this.saveSettings(),this.clearStatusProgress(),new m.Notice("Python environment ready.")}catch(r){this.clearStatusProgress(),new m.Notice("Failed to set up Python environment. See console for details."),console.error("Python env setup failed",r)}}async detectOcrEngines(){let e=await this.canRunCommand("tesseract",[]),n=(this.settings.pythonPath||"").trim(),t=[];if(!n)try{let l=await this.resolveBootstrapPython();n=l.command,t=l.args}catch(l){return{tesseract:e,paddleStructureLocal:!1,paddleVlLocal:!1}}let i=["import importlib.util, json","def has_module(name):","    return importlib.util.find_spec(name) is not None","has_paddle = has_module('paddle')","has_paddleocr = has_module('paddleocr')","has_paddlex = has_module('paddlex')","has_vl = False","if has_paddleocr:","    try:","        from paddleocr import PaddleOCRVL","        has_vl = True","    except Exception:","        has_vl = False","print(json.dumps({'paddle': has_paddle, 'paddleocr': has_paddleocr, 'paddlex': has_paddlex, 'paddle_vl': has_vl}))"].join(`
`),r=await new Promise(l=>{let d=(0,Q.spawn)(n,[...t,"-c",i],{env:this.buildPythonEnv()}),c="";d.stdout.on("data",_=>{c+=_.toString()}),d.on("error",()=>l({ok:!1})),d.on("close",_=>{if(_!==0){l({ok:!1});return}try{let g=JSON.parse(c.trim());l({ok:!0,data:g})}catch(g){l({ok:!1})}})});if(!r.ok||!r.data)return{tesseract:e,paddleStructureLocal:!1,paddleVlLocal:!1};let s=r.data,a=!!s.paddle,o=!!s.paddleocr;return{tesseract:e,paddleStructureLocal:a&&o&&!!s.paddlex,paddleVlLocal:a&&o&&!!s.paddle_vl}}getSharedPythonEnvRoot(){let e=Vn.default.homedir();if(process.platform==="win32"){let t=process.env.LOCALAPPDATA||process.env.APPDATA||A.default.join(e,"AppData","Local");return A.default.join(t,"zotero-redisearch-rag")}let n=process.env.XDG_CACHE_HOME||A.default.join(e,".cache");return A.default.join(n,"zotero-redisearch-rag")}getPythonVenvDir(){return this.settings.pythonEnvLocation==="plugin"?A.default.join(this.getPluginDir(),".venv"):A.default.join(this.getSharedPythonEnvRoot(),"venv")}getVenvPythonPath(e){return process.platform==="win32"?A.default.join(e,"Scripts","python.exe"):A.default.join(e,"bin","python")}resolveRequirementsPath(e){var t;return(t=[A.default.join(e,"requirements.txt"),A.default.join(e,"tools","requirements.txt")].find(i=>(0,$.existsSync)(i)))!=null?t:null}async resolveBootstrapPython(){let e=(this.settings.pythonPath||"").trim();if(e&&await this.canRunCommand(e,[])){let t=await this.getPythonVersion(e,[]);if(t&&this.isUnsupportedPythonVersion(t))throw new Error(`Configured Python ${t.major}.${t.minor} is not supported. Install Python 3.11\u20133.13 and update the Python path.`);return{command:e,args:[]}}let n=process.platform==="win32"?[{command:"py",args:["-3.13"]},{command:"py",args:["-3.12"]},{command:"py",args:["-3.11"]},{command:"py",args:["-3.10"]},{command:"py",args:["-3"]},{command:"python",args:[]}]:[{command:"python3.13",args:[]},{command:"python3.12",args:[]},{command:"python3.11",args:[]},{command:"python3.10",args:[]},{command:"python3",args:[]},{command:"python",args:[]}];for(let t of n)if(await this.canRunCommand(t.command,t.args)){let i=await this.getPythonVersion(t.command,t.args);if(i&&this.isUnsupportedPythonVersion(i)){console.log(`Python env: skipping ${t.command} ${t.args.join(" ")} (Python ${i.major}.${i.minor} unsupported)`);continue}return t}throw new Error("No usable Python 3.11\u20133.13 interpreter found on PATH.")}isUnsupportedPythonVersion(e){return e.major>3||e.major===3&&e.minor>=14}async getPythonVersion(e,n){return new Promise(t=>{let i=(0,Q.spawn)(e,[...n,"-c","import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"]),r="";i.stdout.on("data",s=>{r+=s.toString()}),i.on("error",()=>t(null)),i.on("close",s=>{if(s!==0){t(null);return}let a=r.trim().match(/(\d+)\.(\d+)/);if(!a){t(null);return}t({major:Number(a[1]),minor:Number(a[2])})})})}async canRunCommand(e,n){return new Promise(t=>{let i=(0,Q.spawn)(e,[...n,"--version"],{env:this.buildPythonEnv()});i.on("error",()=>t(!1)),i.on("close",r=>t(r===0))})}buildPythonEnv(){let e={...process.env},n=A.default.delimiter,t=e.PATH||"",r=[...process.platform==="win32"?[]:["/opt/homebrew/bin","/usr/local/bin"],t].filter(Boolean).join(n);return e.PATH=r,e.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK||(e.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK="True"),e.DISABLE_MODEL_SOURCE_CHECK||(e.DISABLE_MODEL_SOURCE_CHECK="True"),e}runPython(e,n){return new Promise((t,i)=>{let r=(0,Q.spawn)(this.settings.pythonPath,[e,...n],{cwd:A.default.dirname(e),env:this.buildPythonEnv()}),s="",a="";r.stdout.on("data",o=>{s+=o.toString()}),r.stderr.on("data",o=>{a+=o.toString()}),r.on("error",o=>{this.handlePythonProcessError(String(o)),i(o)}),r.on("close",o=>{if(o===0)t();else{let l=a.trim()?a:s;this.handlePythonProcessError(l),i(new Error(a||`Process exited with code ${o}`))}})})}runCommand(e,n,t){return new Promise((i,r)=>{var o;let s=(0,Q.spawn)(e,n,{cwd:t==null?void 0:t.cwd,env:(o=t==null?void 0:t.env)!=null?o:this.buildPythonEnv()}),a="";s.stderr.on("data",l=>{a+=l.toString()}),s.on("error",l=>{r(l)}),s.on("close",l=>{l===0?i():r(new Error(a||`Process exited with code ${l}`))})})}runPythonStreaming(e,n,t,i,r,s="docling_extract",a){return new Promise((o,l)=>{let d=(0,Q.spawn)(this.settings.pythonPath,[e,...n],{cwd:A.default.dirname(e),env:this.buildPythonEnv()});a&&a(d);let c="",_="",g="",y=null,b=!1,L=f=>{if(f.trim())try{let h=JSON.parse(f);y=h,((h==null?void 0:h.type)==="final"||h!=null&&h.answer)&&(b=!0),t(h)}catch(h){g+=`${f}
`}};d.stdout.on("data",f=>{var C;c+=f.toString();let h=c.split(/\r?\n/);c=(C=h.pop())!=null?C:"";for(let k of h)L(k)}),d.stderr.on("data",f=>{_+=f.toString()}),d.on("error",f=>{this.handlePythonProcessError(String(f)),l(f)}),d.on("close",f=>{if(c.trim()&&L(c),!b&&y&&i(y),r&&this.appendToLogFile(r,_,s,"STDERR"),f===0)o();else{let h=_.trim()?_:g;this.handlePythonProcessError(h),l(new Error(_||`Process exited with code ${f}`))}})})}runCommandStreaming(e,n,t,i){return new Promise((r,s)=>{var d;let a=(0,Q.spawn)(e,n,{cwd:t==null?void 0:t.cwd,env:(d=t==null?void 0:t.env)!=null?d:this.buildPythonEnv()}),o=c=>{c.toString().split(/\r?\n/).forEach(g=>{g.trim()&&i(g)})},l="";a.stdout.on("data",o),a.stderr.on("data",c=>{l+=c.toString(),o(c)}),a.on("error",c=>{s(c)}),a.on("close",c=>{c===0?r():s(new Error(l||`Process exited with code ${c}`))})})}handlePythonProcessError(e){if(!e)return;let n=e.match(/ModuleNotFoundError:\s+No module named ['"]([^'"]+)['"]/);if(n){let t=`Python env missing module '${n[1]}'. Open Settings > Python environment > Create/Update.`;this.notifyPythonEnvOnce(t,!0);return}if(/No module named ['"]|ImportError: No module named/i.test(e)){this.notifyPythonEnvOnce("Python env missing required modules. Open Settings > Python environment > Create/Update.",!0);return}/ENOENT|No such file or directory|not found|command not found|spawn .* ENOENT/i.test(e)&&this.notifyPythonEnvOnce("Python not found. Configure the Python path or use Settings > Python environment > Create/Update.",!0)}notifyPythonEnvOnce(e,n=!1){this.lastPythonEnvNotice!==e&&(this.lastPythonEnvNotice=e,new m.Notice(e),n&&this.openPluginSettings())}notifyContainerOnce(e){this.lastContainerNotice!==e&&(this.lastContainerNotice=e,new m.Notice(e))}notifyRedisOnce(e){this.lastRedisNotice!==e&&(this.lastRedisNotice=e,new m.Notice(e))}async autoDetectRedisOnLoad(){if(this.settings.autoStartRedis)return;let e=(this.settings.redisUrl||"").trim(),t=e||"redis://127.0.0.1:6379";(await this.checkRedisConnectionWithUrl(t,500)).ok&&(e||(this.settings.redisUrl=t,await this.saveSettings()),this.notifyRedisOnce(`Redis detected at ${t}. This instance will be used.`))}notifyZoteroApiOnce(e){this.lastZoteroApiNotice!==e&&(this.lastZoteroApiNotice=e,new m.Notice(e))}async warnIfZoteroLocalApiUnavailable(e){if(await this.isZoteroLocalApiReachable())return this.lastZoteroApiNotice=null,!0;let i=`Zotero Local API is not reachable for ${e?`${e}`:"this action"}. Start Zotero or update the Local API URL in settings.`;return this.notifyZoteroApiOnce(i),!1}openPluginSettings(){let e=this.app.setting;e!=null&&e.open&&e.open(),e!=null&&e.openTabById&&e.openTabById(this.manifest.id)}getLogsDirRelative(){return(0,m.normalizePath)(`${J}/logs`)}getLogFileRelativePath(){let e=(this.settings.logFilePath||"").trim();return(0,m.normalizePath)(e||`${this.getLogsDirRelative()}/docling_extract.log`)}getLogFileAbsolutePath(){return this.getAbsoluteVaultPath(this.getLogFileRelativePath())}getSpellcheckerInfoRelativePath(){return(0,m.normalizePath)(`${this.getLogsDirRelative()}/spellchecker_info.json`)}async openLogFile(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;if(!await n.exists(e)){new m.Notice("Log file not found.");return}try{let t=async()=>{try{return await n.read(e)||"(empty)"}catch(r){return"(empty)"}},i=await t();new ye(this.app,"Log file",i||"(empty)",{autoRefresh:!0,refreshIntervalMs:2e3,onRefresh:t,onClear:async()=>{await this.clearLogFile()}}).open()}catch(t){new m.Notice("Failed to open log file."),console.error(t)}}async clearLogFile(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;try{let t=(0,m.normalizePath)(A.default.dirname(e));t&&await this.ensureFolder(t),await n.write(e,""),new m.Notice("Log file cleared.")}catch(t){new m.Notice("Failed to clear log file."),console.error(t)}}async deleteLogFileIfExists(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;try{await n.exists(e)&&await n.remove(e)}catch(t){console.warn("Failed to delete log file before import",t)}}formatLogLines(e,n,t){let i=e.split(/\r?\n/).map(s=>s.trimEnd()).filter(s=>!!s.trim());if(!i.length)return"";let r=new Date().toISOString().replace("T"," ").replace(".",",");return i.map(s=>`${r} ${t} ${n}: ${s}`).join(`
`)+`
`}async appendToLogFile(e,n,t="docling_extract",i="STDERR"){if(!n||!n.trim())return;let r=this.formatLogLines(n,t,i);if(r)try{await $.promises.mkdir(A.default.dirname(e),{recursive:!0}),await $.promises.appendFile(e,r)}catch(s){console.warn("Failed to append stderr to log file",s)}}runPythonWithOutput(e,n,t,i="docling_extract"){return new Promise((r,s)=>{let a=(0,Q.spawn)(this.settings.pythonPath,[e,...n],{cwd:A.default.dirname(e),env:this.buildPythonEnv()}),o="",l="";a.stdout.on("data",d=>{o+=d.toString()}),a.stderr.on("data",d=>{l+=d.toString()}),a.on("error",d=>{this.handlePythonProcessError(String(d)),s(d)}),a.on("close",d=>{if(t&&this.appendToLogFile(t,l,i,"STDERR"),d===0)r(o.trim());else{let c=l.trim()?l:o;this.handlePythonProcessError(c),s(new Error(l||`Process exited with code ${d}`))}})})}};
