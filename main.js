"use strict";var wn=Object.create;var Be=Object.defineProperty;var vn=Object.getOwnPropertyDescriptor;var Pn=Object.getOwnPropertyNames;var Cn=Object.getPrototypeOf,An=Object.prototype.hasOwnProperty;var Sn=(y,u)=>{for(var e in u)Be(y,e,{get:u[e],enumerable:!0})},Nt=(y,u,e,t)=>{if(u&&typeof u=="object"||typeof u=="function")for(let n of Pn(u))!An.call(y,n)&&n!==e&&Be(y,n,{get:()=>u[n],enumerable:!(t=vn(u,n))||t.enumerable});return y};var ke=(y,u,e)=>(e=y!=null?wn(Cn(y)):{},Nt(u||!y||!y.__esModule?Be(e,"default",{value:y,enumerable:!0}):e,y)),Rn=y=>Nt(Be({},"__esModule",{value:!0}),y);var sr={};Sn(sr,{default:()=>_t});module.exports=Rn(sr);var h=require("obsidian");var qt=require("@codemirror/state"),ae=require("@codemirror/view"),zt=require("obsidian");var we=/<!--\s*zrr:sync-start[^>]*-->/i,Ae=/<!--\s*zrr:sync-end\s*-->/i,be=/<!--\s*zrr:chunk\b([^>]*)-->/i,Ze=/<!--\s*zrr:chunk\s+end\s*-->/i,Te=/<!--\s*zrr:(?:exclude|delete)\s*-->/i,Tt=y=>{let u=y.trim();if(!u.toLowerCase().startsWith("zrr:"))return null;if(/^zrr:sync-start\b/i.test(u)){let _=u.match(/\bdoc_id=(["']?)([^"'\s]+)\1/i);return{type:"sync-start",docId:_?_[2]:void 0}}if(/^zrr:sync-end\b/i.test(u))return{type:"sync-end"};if(/^zrr:annotations-start\b/i.test(u)){let _=u.match(/\bdoc_id=(["']?)([^"'\s]+)\1/i),g=u.match(/\battachment_key=(["']?)([^"'\s]+)\1/i);return{type:"annotations-start",docId:_?_[2]:void 0,attachmentKey:g?g[2]:void 0}}if(/^zrr:annotations-end\b/i.test(u))return{type:"annotations-end"};if(/^zrr:chunk\s+end\b/i.test(u))return{type:"chunk-end"};let e=u.match(/^zrr:chunk\b(.*)$/i);if(!e)return null;let t=e[1]||"",n=t.match(/\bid=(["']?)([^"'\s]+)\1/i),r=n?n[2]:"",i=t.match(/\bpage(?:_start)?=(["']?)(\d+)\1/i),a=i?null:t.match(/\(\s*(\d+)\s*\)/),s=i?Number.parseInt(i[2],10):a?Number.parseInt(a[1],10):void 0,o=r.match(/^p(\d+)$/i),l=o?Number.parseInt(o[1],10):void 0,c=Number.isFinite(s!=null?s:NaN)?s:l,d=/\bexclude\b/i.test(t)||/\bdelete\b/i.test(t),p=/\bsection\b/i.test(t);return{type:"chunk-start",chunkId:r||void 0,excluded:d,pageNumber:Number.isFinite(c!=null?c:NaN)?c:void 0,chunkKind:p?"section":c?"page":"section"}},Ge=y=>{var l;if(!y)return null;let u=y.match(be);if(!u)return null;let e=u[1]||"",t=e.match(/\bid=(["']?)([^"'\s]+)\1/i),n=t?t[2].trim():void 0,r=e.match(/\bpage(?:_start)?=(["']?)(\d+)\1/i),i=r?null:e.match(/\(\s*(\d+)\s*\)/),a=r?Number.parseInt(r[2],10):i?Number.parseInt(i[1],10):void 0,s=n&&(l=mt(n))!=null?l:void 0,o=Number.isFinite(a!=null?a:NaN)?a:s;return{chunkId:n,pageNumber:Number.isFinite(o!=null?o:NaN)?Number(o):void 0}},We=y=>{for(let u=1;u<=y.lines;u+=1){let e=y.line(u).text;if(we.test(e)){let t=e.match(/doc_id=(["']?)([^"'\s]+)\1/i);return t?t[2].trim():null}}return null},gt=(y,u)=>{let e=u;for(;e>=1;e-=1){let t=y.line(e).text;if(be.test(t))return{line:e,text:t};if(we.test(t)||Ae.test(t))break}return null},En=(y,u)=>{for(let e=u;e<=y.lines;e+=1){let t=y.line(e).text;if(Ze.test(t))return e;if(Ae.test(t))break}return null},Dt=(y,u)=>{let e=gt(y,u);if(!e)return null;let t=En(y,e.line+1);return t===null||u<e.line||u>t?null:{startLine:e.line,endLine:t,text:e.text}},Ot=(y,u,e)=>{if(u>e)return!1;for(let t=u;t<=e;t+=1){let n=y.line(t).text;if(Te.test(n))return!0}return!1},mt=y=>{var n;if(!y)return null;let e=(y.includes(":")&&(n=y.split(":").pop())!=null?n:y).match(/^p(\d+)$/i);if(!e)return null;let t=Number.parseInt(e[1],10);return Number.isFinite(t)?t:null};var It=y=>{if(!y)return null;let u=y.match(/<!--\s*zrr:chunk\b[^>]*-->/i);return u?Ge(u[0]):null};var Ln=(y,u)=>{let e=createDiv();if(e.classList.add("zrr-sync-badge"),y.type==="sync-start"||y.type==="sync-end")return e.classList.add("zrr-sync-badge--sync"),e.classList.add(y.type==="sync-start"?"zrr-sync-badge--sync-start":"zrr-sync-badge--sync-end"),y.type==="sync-start"?e.textContent=y.docId?`Redis Index Sync start - ${y.docId}`:"Redis Index Sync start":e.textContent="Redis index sync end",e;if(y.type==="annotations-start"||y.type==="annotations-end"){if(e.classList.add("zrr-sync-badge--annotations"),y.type==="annotations-start"){let t=y.docId?` - ${y.docId}`:"";e.textContent=`Zotero annotations start${t}`}else e.textContent="Zotero annotations end";return e}if(y.type==="chunk-end")return e.classList.add("zrr-sync-badge--chunk-end"),e.textContent=y.chunkKind==="page"?"Page end":"Section end",y.chunkKind&&e.classList.add(`zrr-sync-badge--${y.chunkKind}`),e;if(y.type!=="chunk-start")return null;if(e.classList.add("zrr-sync-badge--chunk"),y.chunkKind&&e.classList.add(`zrr-sync-badge--${y.chunkKind}`),y.excluded&&e.classList.add("is-excluded"),y.pageNumber&&u>0)if(y.chunkKind==="section"){let t=y.chunkId?`Section ${y.chunkId}`:"Section";e.textContent=`${t} (p${y.pageNumber}/${u})`}else e.textContent=`Page ${y.pageNumber}/${u}`;else if(y.pageNumber)if(y.chunkKind==="section"){let t=y.chunkId?`Section ${y.chunkId}`:"Section";e.textContent=`${t} (p${y.pageNumber})`}else e.textContent=`Page ${y.pageNumber}`;else y.chunkId?e.textContent=`Section ${y.chunkId}`:e.textContent="Section";return y.excluded&&(e.textContent=`${e.textContent} - excluded`),e},ht=class extends ae.WidgetType{constructor(u,e,t,n,r){super(),this.plugin=u,this.docId=e,this.chunkId=t,this.startLine=n,this.excluded=r}eq(u){return this.docId===u.docId&&this.chunkId===u.chunkId&&this.startLine===u.startLine&&this.excluded===u.excluded}toDOM(){let u=createSpan();u.className="zrr-chunk-toolbar",u.setAttribute("data-chunk-id",this.chunkId);let e=(c,d)=>{c.setAttribute("title",d),c.setAttribute("aria-label",d),c.setAttribute("data-tooltip-position","top")},t=(c,d,p)=>{let _=createSpan();_.className="zrr-chunk-button-icon",(0,zt.setIcon)(_,d);let g=createSpan();g.className="zrr-chunk-button-label",g.textContent=p,c.appendChild(_),c.appendChild(g)},n=createEl("button");n.type="button",n.className="zrr-chunk-button",t(n,"sparkles","Clean"),e(n,"Clean this chunk with the OCR cleanup model"),n.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.plugin.cleanChunkFromToolbar(this.startLine)}),u.appendChild(n);let r=createEl("button");r.type="button",r.className="zrr-chunk-button",t(r,"tag","Tags"),e(r,"Edit chunk tags"),r.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.plugin.openChunkTagEditor(this.docId,this.chunkId)}),u.appendChild(r);let i=createEl("button");i.type="button",i.className="zrr-chunk-button",t(i,"search","Indexed"),e(i,"Preview indexed chunk text"),i.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.plugin.openChunkIndexedTextPreview(this.docId,this.chunkId)}),u.appendChild(i);let a=createEl("button");a.type="button",a.className="zrr-chunk-button",t(a,"external-link","Zotero"),e(a,"Open this page in Zotero"),a.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.plugin.openChunkInZotero(this.docId,this.chunkId)}),u.appendChild(a);let s=createEl("button");s.type="button",s.className="zrr-chunk-button";let o=this.excluded?"Include":"Exclude",l=this.excluded?"check":"ban";return t(s,l,o),e(s,this.excluded?"Include this chunk in the index":"Exclude this chunk from the index"),s.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.plugin.toggleChunkExcludeFromToolbar(this.startLine)}),u.appendChild(s),u}ignoreEvent(){return!0}},Ft=(y,u)=>{var f;let e=y.state.doc,t=We(e);if(!t)return ae.Decoration.none;let n=y.state.selection.main.head,r=e.lineAt(n).number,i=Dt(e,r);if(!i)return ae.Decoration.none;let a=i.text.match(be);if(!a)return ae.Decoration.none;let s=((f=a[1])!=null?f:"").trim(),o=s.match(/id=(["']?)([^"'\s]+)\1/i);if(!o)return ae.Decoration.none;let l=o[2].trim();if(!l)return ae.Decoration.none;let c=/\bexclude\b/i.test(s)||/\bdelete\b/i.test(s),d=Ot(e,i.startLine+1,i.endLine-1),p=c||d,_=e.line(i.startLine),g=ae.Decoration.widget({widget:new ht(u,t,l,i.startLine,p),side:1});return ae.Decoration.set([g.range(_.to)])},ft=class extends ae.WidgetType{constructor(u,e){super(),this.info=u,this.totalPages=e}toDOM(){var u;return(u=Ln(this.info,this.totalPages))!=null?u:createSpan()}},Mt=y=>{var o,l;let u=y.dom.closest(".markdown-source-view");if(!u||!u.classList.contains("is-live-preview"))return ae.Decoration.none;let e=y.state.doc,t=new qt.RangeSetBuilder,n=[],r=[],i=!1,a=!1;for(let c=1;c<=e.lines;c+=1){let d=e.line(c),p=d.text.match(/<!--\s*([^>]*)\s*-->/);if(!p)continue;let _=Tt(p[1]);_&&(_.type==="chunk-start"?(_.chunkKind=(o=_.chunkKind)!=null?o:_.pageNumber?"page":"section",_.pageNumber&&(i=!0),_.chunkKind==="section"&&(a=!0)):_.type==="chunk-end"&&(_.chunkKind=(l=_.chunkKind)!=null?l:"section"),n.push({line:c,from:d.from,to:d.to,info:_}),_.pageNumber&&r.push(_.pageNumber))}if(!n.length)return ae.Decoration.none;if(i&&!a)for(let c of n)c.info.type==="chunk-end"&&(c.info.chunkKind="page");let s=r.length?Math.max(...r):0;for(let c of n){let d=ae.Decoration.replace({widget:new ft(c.info,s)});t.add(c.from,c.to,d)}return t.finish()},jt=()=>ae.ViewPlugin.fromClass(class{constructor(y){this.decorations=Mt(y)}update(y){(y.docChanged||y.viewportChanged)&&(this.decorations=Mt(y.view))}},{decorations:y=>y.decorations}),$t=y=>ae.ViewPlugin.fromClass(class{constructor(u){this.decorations=Ft(u,y)}update(u){(u.docChanged||u.selectionSet||u.viewportChanged)&&(this.decorations=Ft(u.view,y))}},{decorations:u=>u.decorations}),Nn=(y,u)=>{var t,n,r;if(!y||u<0)return null;let e=/\[\[([^\]\n]+)\]\]/g;for(let i of y.matchAll(e)){let a=(t=i[0])!=null?t:"",s=(n=i[1])!=null?n:"",o=(r=i.index)!=null?r:-1;if(o<0)continue;let l=o+a.length;if(u<o||u>l)continue;let c=s.indexOf("|");return(c>=0?s.slice(0,c):s).trim()||null}return null},Ut=y=>ae.ViewPlugin.fromClass(class{},{eventHandlers:{click(u,e){if(u.defaultPrevented||u.button!==0)return!1;let t=e.dom.closest(".markdown-source-view");if(!t||!t.classList.contains("is-live-preview"))return!1;let n=e.posAtCoords({x:u.clientX,y:u.clientY});if(n===null)return!1;let r=e.state.doc.lineAt(n),i=n-r.from,a=Nn(r.text,i);return!a||!a.includes("#zrr-chunk:")?!1:(u.preventDefault(),u.stopPropagation(),y.openInternalLinkInMain(a,y.getLivePreviewSourcePath()),!0)}}});var de=require("child_process"),ne=require("fs"),St=ke(require("http")),yn=ke(require("https")),je=ke(require("net")),$e=ke(require("os")),bn=ke(require("tls")),E=ke(require("path")),Rt=require("url"),Ue=require("crypto");var L=require("obsidian"),Bt=require("crypto"),He=require("fs"),yt=ke(require("path")),se=".zotero-redisearch-rag",ce=`${se}/items`,te=`${se}/chunks`,Zt=`${se}/metadata_snapshots.json`,Gt=`${se}/annotation_snapshots.json`,Tn="https://raw.githubusercontent.com/jmiba/zotero-redisearch-rag/main/zotero-companion/zrr-companion.xpi",Se="cross-encoder/mmarco-mMiniLMv2-L12-H384-v1",De="__custom__",Vt=[{value:"cross-encoder/mmarco-mMiniLMv2-L12-H384-v1",label:"cross-encoder/mmarco-mMiniLMv2-L12-H384-v1 (Fast multilingual)"},{value:"BAAI/bge-reranker-v2-m3",label:"BAAI/bge-reranker-v2-m3 (Best quality, heaviest)"},{value:"jinaai/jina-reranker-v2-base-multilingual",label:"jinaai/jina-reranker-v2-base-multilingual (Balanced multilingual)"}],Je={pythonRuntime:"worker",pythonRuntimeMigrationV1Done:!1,showAdvancedPythonRuntimeOptions:!1,pythonPath:"",pythonEnvLocation:"shared",dockerPath:"docker",redisUrl:"redis://127.0.0.1:6379",autoAssignRedisPort:!1,redisDataDirOverride:"",redisProjectName:"",autoStartRedis:!0,firstContainerStartupNoticeShown:!1,zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",webApiBaseUrl:"https://api.zotero.org",webApiLibraryType:"user",webApiLibraryId:"",webApiKey:"",outputPdfDir:"Zotero/PDFs",outputNoteDir:"Zotero/Notes",frontmatterTemplate:`doc_id: {{doc_id}}
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
item_json: {{item_json_yaml}}`,tagSanitizeMode:"kebab",noteBodyTemplate:"{{annotation_block}}{{docling_markdown}}",annotationPageLabel:"Seite",annotationColorMap:{yellow:{heading:"Questions",callout:"question"},red:{heading:"Problems/Critique",callout:"bug"},green:{heading:"Main Ideas",callout:"idea"},blue:{heading:"Facts",callout:"fact"},purple:{heading:"Arguments/Solutions",callout:"argument"},magenta:{heading:"Opinions",callout:"opinion"},orange:{heading:"Follow Up",callout:"pursue"},gray:{heading:"Citable Passages",callout:"cite"}},includeAnnotationImages:!0,zoteroCompanionEnabled:!1,zoteroCompanionBaseUrl:"http://127.0.0.1:23120",zoteroCompanionToken:"",llmProviderProfiles:[{id:"lm-studio",name:"LM Studio",baseUrl:"http://localhost:1234/v1",apiKey:"lm-studio"},{id:"ollama",name:"Ollama",baseUrl:"http://localhost:11434/v1",apiKey:""},{id:"openrouter",name:"OpenRouter",baseUrl:"https://openrouter.ai/api/v1",apiKey:""},{id:"openai",name:"OpenAI",baseUrl:"https://api.openai.com/v1",apiKey:""}],chatOutputDir:"Zotero/Chats",chatExportTemplatePath:"",chatExportPostCreateCommandId:"",copyPdfToVault:!0,createOcrLayeredPdf:!1,preferObsidianNoteForCitations:!0,ocrMode:"auto",ocrQualityThreshold:.5,chunkingMode:"page",ocrEngine:"auto",forcePerPageOcr:!1,paddleApiKey:"",paddleVlApiUrl:"",paddleStructureApiUrl:"",enableLlmCleanup:!1,llmCleanupProviderProfileId:"lm-studio",llmCleanupBaseUrl:"http://127.0.0.1:1234/v1",llmCleanupApiKey:"",llmCleanupModel:"openai/gpt-oss-20b",llmCleanupTemperature:0,llmCleanupMinQuality:.35,llmCleanupMaxChars:2e3,llmCleanupReasoningMode:"auto",llmCleanupModeMemory:{},embedProviderProfileId:"lm-studio",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",embedIncludeMetadata:!0,embedSubchunkChars:3500,embedSubchunkOverlap:200,embedContextWindow:1,embedContextChars:220,enableChunkTagging:!1,chatProviderProfileId:"lm-studio",chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,chatHistoryMessages:6,lastSeenReleaseNotesVersion:"",chatPaneLocation:"right",enableAgenticRag:!1,agenticMaxIters:2,enableFollowUpRewrite:!1,enableQueryExpansion:!1,queryExpansionCount:3,enableCrossEncoderRerank:!1,rerankModel:Se,rerankCandidateMultiplier:4,rrfK:60,rrfLogTop:0,maxChunksPerDoc:0,enableFileLogging:!1,logFilePath:`${se}/logs/docling_extract.log`,redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:"},Ke=class extends L.PluginSettingTab{constructor(e,t){super(e,t);this.activeTab="prerequisites";this.companionTokenInput=null;this.plugin=t}display(){let{containerEl:e}=this;e.empty();let t=()=>Array.isArray(this.plugin.settings.llmProviderProfiles)?this.plugin.settings.llmProviderProfiles:[],n=async m=>{this.plugin.settings.llmProviderProfiles=m,await this.plugin.saveSettings()},r=m=>{m.inputEl.type="password",m.inputEl.autocomplete="off",m.inputEl.spellcheck=!1},d=[{id:"prerequisites",label:"Prerequisites",render:m=>{new L.Setting(m).setName("Prerequisites").setHeading();let x=null,w=null,S=null,R=null,P=null,A=null,N=null,O=null,q=null,j=(F,M)=>{F&&(F.settingEl.classList.toggle("is-disabled",M),F.settingEl.classList.toggle("zrr-setting-disabled",M))},V=(F,M)=>{F&&F.settingEl.classList.toggle("zrr-setting-hidden",!M)},z=()=>{let F=!!this.plugin.settings.showAdvancedPythonRuntimeOptions,M=this.plugin.settings.pythonRuntime==="local",J=F&&M;w==null||w.setDisabled(!F),j(x,!F),V(S,F),V(R,F),V(P,F),A==null||A.setDisabled(!J),N==null||N.setDisabled(!J),q==null||q.setDisabled(!J),O&&(O.disabled=!J),j(S,!J),j(R,!J),j(P,!J)};new L.Setting(m).setName("Docker/podman path").setDesc("CLI path for Docker or Podman (used to start Redis Stack and the Python worker). Leave as 'docker'/'podman' to auto-detect via PATH and common locations without saving an absolute path (keeps cross-OS sync). Supports ~. Relative paths with separators resolve from your home dir.").addText(F=>F.setPlaceholder("Docker").setValue(this.plugin.settings.dockerPath).onChange(async M=>{this.plugin.settings.dockerPath=M.trim()||"docker",await this.plugin.saveSettings()})),new L.Setting(m).setName("Advanced python runtime options").setDesc("Show legacy local interpreter/venv controls. Recommended to keep this disabled.").addToggle(F=>F.setValue(this.plugin.settings.showAdvancedPythonRuntimeOptions).onChange(async M=>{this.plugin.settings.showAdvancedPythonRuntimeOptions=M,!M&&this.plugin.settings.pythonRuntime==="local"&&(this.plugin.settings.pythonRuntime="worker",new L.Notice("Switched python runtime to worker mode.")),await this.plugin.saveSettings(),z()})),x=new L.Setting(m).setName("Python runtime").setDesc("Worker runtime is recommended. Enable advanced options to expose local interpreter/venv mode.").addDropdown(F=>{w=F,F.addOption("worker","Python worker container (recommended)"),F.addOption("local","Local interpreter/venv"),F.setValue(this.plugin.settings.pythonRuntime).onChange(async M=>{M!=="worker"&&M!=="local"||(this.plugin.settings.pythonRuntime=M,await this.plugin.saveSettings(),z())})}),S=new L.Setting(m).setName("Python path").setDesc("Local mode only: optional path to the Python interpreter used to create or run the plugin env. Leave blank to auto-detect (python3.13/3.12/3.11/3.10/python3/python, or py on Windows). Supports ~. Relative paths with separators resolve from your home dir.").addText(F=>(A=F,F.setPlaceholder("Auto-detect").setValue(this.plugin.settings.pythonPath).onChange(async M=>{this.plugin.settings.pythonPath=M.trim(),await this.plugin.saveSettings()}))),R=new L.Setting(m).setName("Python environment").setDesc("Local mode: create or update the plugin's python env. Worker mode: managed by docker startup.").addButton(F=>{q=F,O=F.buttonEl,F.setButtonText("Create/update").setCta(),F.onClick(async()=>{F.setDisabled(!0);try{await this.plugin.setupPythonEnv()}finally{F.setDisabled(this.plugin.settings.pythonRuntime!=="local")}})}),P=new L.Setting(m).setName("Python env location").setDesc("Local mode only: shared user cache can be reused across vaults; plugin folder keeps a per-vault env.").addDropdown(F=>{N=F,F.addOption("shared","Shared user cache"),F.addOption("plugin","Plugin folder (.venv)"),F.setValue(this.plugin.settings.pythonEnvLocation).onChange(async M=>{M!=="shared"&&M!=="plugin"||(this.plugin.settings.pythonEnvLocation=M,await this.plugin.saveSettings())})}),z(),new L.Setting(m).setName("Redis URL").addText(F=>F.setPlaceholder("Redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async M=>{this.plugin.settings.redisUrl=M.trim(),await this.plugin.saveSettings()}));let Z=null,T=null,G=null,$=null,H=()=>{let F=this.plugin.settings.autoAssignRedisPort;G==null||G.setDisabled(F),$==null||$.setDisabled(F),Z==null||Z.settingEl.classList.toggle("is-disabled",F),T==null||T.settingEl.classList.toggle("is-disabled",F)};new L.Setting(m).setName("Auto-assign redis port").setDesc("When starting redis stack, pick a free local port and update the redis URL.").addToggle(F=>F.setValue(this.plugin.settings.autoAssignRedisPort).onChange(async M=>{this.plugin.settings.autoAssignRedisPort=M,await this.plugin.saveSettings(),H()})),Z=new L.Setting(m).setName("Redis data directory override").setDesc("Optional path to store Redis persistence when auto-assign is off. Supports ~. Relative paths with separators resolve from your home dir; use ./ to keep it vault-relative.").addText(F=>(G=F,F.setPlaceholder("~/redis/zrr-data").setValue(this.plugin.settings.redisDataDirOverride).onChange(async M=>{this.plugin.settings.redisDataDirOverride=M.trim(),await this.plugin.saveSettings()}))),Z.settingEl.addClass("zrr-redis-override-setting"),T=new L.Setting(m).setName("Redis project name override").setDesc("Optional docker/podman compose project name when auto-assign is off.").addText(F=>($=F,F.setPlaceholder("Zrr-shared").setValue(this.plugin.settings.redisProjectName).onChange(async M=>{this.plugin.settings.redisProjectName=M.trim(),await this.plugin.saveSettings()}))),T.settingEl.addClass("zrr-redis-override-setting"),H(),new L.Setting(m).setName("Auto-start redis stack (docker/podman compose)").setDesc("Requires Docker Desktop running and your vault path shared with Docker. Starts Redis and, in worker mode, the Python worker container.").addToggle(F=>F.setValue(this.plugin.settings.autoStartRedis).onChange(async M=>{this.plugin.settings.autoStartRedis=M,await this.plugin.saveSettings()})),new L.Setting(m).setName("Start redis stack now").setDesc("Starts or restarts redis stack (and python worker in worker mode).").addButton(F=>F.setButtonText("Start").onClick(async()=>{await this.plugin.startRedisStack()}))}},{id:"zotero-import",label:"Zotero import",render:m=>{new L.Setting(m).setName("Zotero local API").setHeading(),new L.Setting(m).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. HTTP://127.0.0.1:23119/API").addText(P=>P.setPlaceholder("HTTP://127.0.0.1:23119/API").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async A=>{this.plugin.settings.zoteroBaseUrl=A.trim(),await this.plugin.saveSettings()}));let x=new L.Setting(m).setName("Zotero library").setDesc("Select your local library or a Zotero group library."),w=null,S=P=>{if(!w)return;let A=(this.plugin.settings.zoteroUserId||"0").trim()||"0";new Set(P.map(O=>O.value)).has(A)||(P=P.concat([{value:A,label:`Custom (${A})`}])),w.selectEl.options.length=0;for(let O of P)w.addOption(O.value,O.label);w.setValue(A)},R=async()=>{if(w){w.setDisabled(!0);try{let P=await this.plugin.fetchZoteroLibraryOptions();S(P)}finally{w.setDisabled(!1)}}};x.addDropdown(P=>{w=P;let A=(this.plugin.settings.zoteroUserId||"0").trim()||"0";P.addOption(A,"Loading..."),P.setValue(A),P.onChange(async N=>{this.plugin.settings.zoteroUserId=N.trim(),await this.plugin.saveSettings()})}),x.addButton(P=>{P.setButtonText("Refresh").onClick(async()=>{await R()})}),R(),new L.Setting(m).setName("Zotero web API").setHeading(),new L.Setting(m).setName("Web API base URL").setDesc("Zotero Web API base URL for write fallback, e.g. https://api.zotero.org").addText(P=>P.setPlaceholder("https://api.zotero.org").setValue(this.plugin.settings.webApiBaseUrl).onChange(async A=>{this.plugin.settings.webApiBaseUrl=A.trim(),await this.plugin.saveSettings()})),new L.Setting(m).setName("Web API library type").setDesc("Library type for web API writes.").addDropdown(P=>P.addOption("user","User").addOption("group","Group").setValue(this.plugin.settings.webApiLibraryType).onChange(async A=>{this.plugin.settings.webApiLibraryType=A,await this.plugin.saveSettings()})),new L.Setting(m).setName("Web API library ID").setDesc("Numeric Zotero user/group ID for web API writes.").addText(P=>P.setPlaceholder("15218").setValue(this.plugin.settings.webApiLibraryId).onChange(async A=>{this.plugin.settings.webApiLibraryId=A.trim(),await this.plugin.saveSettings()})),new L.Setting(m).setName("Web API key").setDesc("Zotero API key for write fallback (from Zotero.org).").addText(P=>{r(P),P.setPlaceholder("Your-api-key").setValue(this.plugin.settings.webApiKey).onChange(async A=>{this.plugin.settings.webApiKey=A.trim(),await this.plugin.saveSettings()})}),new L.Setting(m).setName("Output").setHeading(),new L.Setting(m).setName("PDF folder").addText(P=>P.setPlaceholder("Zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async A=>{this.plugin.settings.outputPdfDir=A.trim(),await this.plugin.saveSettings()})),new L.Setting(m).setName("Notes folder").addText(P=>P.setPlaceholder("Zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async A=>{this.plugin.settings.outputNoteDir=A.trim(),await this.plugin.saveSettings()})),new L.Setting(m).setName("Frontmatter template").setDesc("Template for note YAML frontmatter. Use {{var}} placeholders; leave blank to omit.").addTextArea(P=>{P.setValue(this.plugin.settings.frontmatterTemplate).onChange(async A=>{this.plugin.settings.frontmatterTemplate=A,await this.plugin.saveSettings()}),P.inputEl.rows=10,P.inputEl.addClass("zrr-u-width-100")}),new L.Setting(m).setName("Tag sanitization").setDesc("Normalize Zotero tags for Obsidian (no spaces, punctuation trimmed).").addDropdown(P=>P.addOption("none","No change").addOption("camel","Camelcase").addOption("pascal","Pascalcase").addOption("snake","Snake_case").addOption("kebab","Kebab-case").setValue(this.plugin.settings.tagSanitizeMode==="replace"?"kebab":this.plugin.settings.tagSanitizeMode).onChange(async A=>{this.plugin.settings.tagSanitizeMode=A,await this.plugin.saveSettings()})),new L.Setting(m).setName("Note body template").setDesc("Template for the note body after frontmatter. Use {{pdf_block}}, {{annotation_block}}, and {{docling_markdown}} placeholders.").addTextArea(P=>{P.setValue(this.plugin.settings.noteBodyTemplate).onChange(async A=>{this.plugin.settings.noteBodyTemplate=A,await this.plugin.saveSettings()}),P.inputEl.rows=8,P.inputEl.addClass("zrr-u-width-100")}),new L.Setting(m).setName("Saved chats folder").setDesc("Where exported chat notes are stored (vault-relative).").addText(P=>P.setPlaceholder("Zotero/chats").setValue(this.plugin.settings.chatOutputDir).onChange(async A=>{this.plugin.settings.chatOutputDir=A.trim()||"zotero/chats",await this.plugin.saveSettings()})),new L.Setting(m).setName("Chat export template").setDesc("Optional vault-relative template file for copied chat notes. Use {{chat_body}} to control where the transcript is inserted (otherwise template text is appended after the transcript).").addText(P=>P.setPlaceholder("Path to chat export template note").setValue(this.plugin.settings.chatExportTemplatePath).onChange(async A=>{this.plugin.settings.chatExportTemplatePath=A.trim(),await this.plugin.saveSettings()})),new L.Setting(m).setName("Chat export post-create command").setDesc("Optional command ID to run after the chat note is created and opened. Useful for templater workflows that need the full note body already present.").addText(P=>P.setPlaceholder("Command ID to run after note creation").setValue(this.plugin.settings.chatExportPostCreateCommandId).onChange(async A=>{this.plugin.settings.chatExportPostCreateCommandId=A.trim(),await this.plugin.saveSettings()})),new L.Setting(m).setName("Copy pdfs into vault").setDesc("Disable to use Zotero storage paths directly. If a local file path is unavailable, the plugin temporarily copies the PDF into the vault for processing.").addToggle(P=>P.setValue(this.plugin.settings.copyPdfToVault).onChange(async A=>{this.plugin.settings.copyPdfToVault=A,!A&&this.plugin.settings.createOcrLayeredPdf&&(this.plugin.settings.createOcrLayeredPdf=!1),await this.plugin.saveSettings(),this.display()})),new L.Setting(m).setName("Create ocr-layered PDF copy").setDesc("When ocr is used, replace the vault PDF with a tesseract text layer (requires copy pdfs into vault).").addToggle(P=>{let A=this.plugin.settings.copyPdfToVault;P.setValue(A?this.plugin.settings.createOcrLayeredPdf:!1).setDisabled(!A).onChange(async N=>{if(!this.plugin.settings.copyPdfToVault){this.plugin.settings.createOcrLayeredPdf=!1,await this.plugin.saveSettings();return}this.plugin.settings.createOcrLayeredPdf=N,await this.plugin.saveSettings()})}),new L.Setting(m).setName("Prefer Obsidian note for citations").setDesc("Link citations to the Obsidian note when available; otherwise use Zotero deep links.").addToggle(P=>P.setValue(this.plugin.settings.preferObsidianNoteForCitations).onChange(async A=>{this.plugin.settings.preferObsidianNoteForCitations=A,await this.plugin.saveSettings()}))}},{id:"annotations",label:"Annotations",render:m=>{new L.Setting(m).setName("Annotations").setHeading(),new L.Setting(m).setName("Annotation page label").setDesc("Label shown before the page link in annotation callouts.").addText(R=>R.setPlaceholder("Page").setValue(this.plugin.settings.annotationPageLabel).onChange(async P=>{this.plugin.settings.annotationPageLabel=P.trim()||"Page",await this.plugin.saveSettings()})),new L.Setting(m).setName("Include annotation images").setDesc("Embed image/rect annotations as images in callouts when available.").addToggle(R=>R.setValue(this.plugin.settings.includeAnnotationImages).onChange(async P=>{this.plugin.settings.includeAnnotationImages=P,await this.plugin.saveSettings()})),new L.Setting(m).setName("Zotero companion").setHeading(),m.createEl("p",{text:"Install the Zotero companion add-on to enable cached image/rect annotations. See tab Maintenance for instructions."}),new L.Setting(m).setName("Use Zotero companion for annotation images").setDesc("Fetch cached annotation images from a local Zotero companion plugin.").addToggle(R=>R.setValue(this.plugin.settings.zoteroCompanionEnabled).onChange(async P=>{this.plugin.settings.zoteroCompanionEnabled=P,await this.plugin.saveSettings()})),new L.Setting(m).setName("Zotero companion base URL").setDesc("Local URL for the Zotero companion plugin (loopback only).").addText(R=>R.setPlaceholder("HTTP://127.0.0.1:23120").setValue(this.plugin.settings.zoteroCompanionBaseUrl).onChange(async P=>{this.plugin.settings.zoteroCompanionBaseUrl=P.trim(),await this.plugin.saveSettings()})),new L.Setting(m).setName("Zotero companion token").setDesc("Optional shared token for the companion endpoint.").addText(R=>{r(R),this.companionTokenInput=R,R.setPlaceholder("Optional-token").setValue(this.plugin.settings.zoteroCompanionToken).onChange(async P=>{this.plugin.settings.zoteroCompanionToken=P.trim(),await this.plugin.saveSettings()})}),new L.Setting(m).setName("Generate companion token").setDesc("Create and paste a secure token. The generated token is copied to your clipboard. In Zotero, set your Zotero companion plugin token to this value.").addButton(R=>R.setButtonText("Generate token").onClick(async()=>{let P=(0,Bt.randomBytes)(32).toString("base64url");this.plugin.settings.zoteroCompanionToken=P,await this.plugin.saveSettings(),this.companionTokenInput&&this.companionTokenInput.setValue(P);try{await navigator.clipboard.writeText(P),new L.Notice("Generated and copied companion token.")}catch(A){new L.Notice("Generated token, but failed to copy to clipboard."),console.warn("Failed to copy generated companion token",A)}})),new L.Setting(m).setName("Annotation color map").setHeading(),m.createEl("p",{text:"Map Zotero highlight colors to section headings and callout types."});let x=m.createDiv({cls:"zrr-annotation-map"}),w=async R=>{this.plugin.settings.annotationColorMap=R,await this.plugin.saveSettings()},S=()=>{var q,j;x.empty();let R=this.plugin.settings.annotationColorMap||{},P=Object.entries(R);if(P.length||x.createEl("p",{text:"No color mappings configured."}),P.length){let V=x.createDiv({cls:"zrr-annotation-map-row-header"});V.createSpan({text:"Color"}),V.createSpan({text:"Heading"}),V.createSpan({text:"Callout"}),V.createSpan()}for(let[V,z]of P){let T=x.createDiv({cls:"zrr-annotation-map-row"}).createDiv({cls:"zrr-annotation-map-row-body"}),G=T.createEl("input",{type:"text",value:V,cls:"zrr-annotation-map-input"}),$=T.createEl("input",{type:"text",value:(q=z.heading)!=null?q:"",cls:"zrr-annotation-map-input"}),H=T.createEl("input",{type:"text",value:(j=z.callout)!=null?j:"",cls:"zrr-annotation-map-input"}),F=T.createEl("button",{text:"Delete",cls:"zrr-annotation-map-delete"});F.type="button",G.addEventListener("change",()=>{(async()=>{let M=G.value.trim().toLowerCase();if(!M){G.value=V;return}let J={...this.plugin.settings.annotationColorMap||{}};if(M!==V&&J[M]){new L.Notice(`Annotation color '${M}' already exists.`),G.value=V;return}let W=J[V];delete J[V],J[M]=W!=null?W:{heading:"",callout:""},await w(J),S()})()}),$.addEventListener("change",()=>{(async()=>{var W;let M={...this.plugin.settings.annotationColorMap||{}},J=(W=M[V])!=null?W:{heading:"",callout:""};J.heading=$.value.trim(),M[V]=J,await w(M)})()}),H.addEventListener("change",()=>{(async()=>{var W;let M={...this.plugin.settings.annotationColorMap||{}},J=(W=M[V])!=null?W:{heading:"",callout:""};J.callout=H.value.trim(),M[V]=J,await w(M)})()}),F.addEventListener("click",()=>{(async()=>{let M={...this.plugin.settings.annotationColorMap||{}};delete M[V],await w(M),S()})()})}let A=x.createDiv({cls:"zrr-annotation-map-actions"}),N=A.createEl("button",{text:"Add mapping"});N.type="button",N.addEventListener("click",()=>{(async()=>{let V={...this.plugin.settings.annotationColorMap||{}},z="new-color",Z=1;for(;V[z];)z=`new-color-${Z}`,Z+=1;V[z]={heading:"",callout:""},await w(V),S()})()});let O=A.createEl("button",{text:"Reset to defaults"});O.type="button",O.addEventListener("click",()=>{(async()=>(await w({...Je.annotationColorMap}),S()))()})};S()}},{id:"ocr",label:"OCR",render:m=>{new L.Setting(m).setName("Docling").setHeading();let x=null,w=A=>{if(!x)return;let N=this.plugin.settings.ocrEngine;new Set(A.map(q=>q.value)).has(N)||(A=A.concat([{value:N,label:`Current (unavailable): ${N}`}])),x.selectEl.options.length=0;for(let q of A)x.addOption(q.value,q.label);x.setValue(N)},S=async()=>{if(!x)return;x.setDisabled(!0);let A={tesseract:!1,paddleStructureLocal:!1,paddleVlLocal:!1};if(this.plugin.detectOcrEngines)try{A=await this.plugin.detectOcrEngines()}catch(q){A={tesseract:!1,paddleStructureLocal:!1,paddleVlLocal:!1}}let N=[{value:"auto",label:"Auto (default)"}];A.tesseract&&N.push({value:"tesseract",label:"Tesseract (local)"}),A.paddleStructureLocal&&N.push({value:"paddle_structure_local",label:"Paddle PP-StructureV3 (local)"}),A.paddleVlLocal&&N.push({value:"paddle_vl_local",label:"PaddleOCR-VL (local)"}),(this.plugin.settings.paddleApiKey||"").trim()&&(N.push({value:"paddle_structure_api",label:"PP-StructureV3 API"}),N.push({value:"paddle_vl_api",label:"PaddleOCR-VL API"})),w(N),x.setDisabled(!1)},R=new L.Setting(m).setName("Paddle ocr API key").setDesc("API token for paddleocr-vl / pp-structurev3 endpoints. Get a free API key at "),P=createEl("a");P.href="https://aistudio.baidu.com/paddleocr",P.textContent="HTTPS://aistudio.baidu.com/paddleocr",P.target="_blank",P.rel="noopener noreferrer",R.descEl.appendChild(P),R.descEl.append("."),R.addText(A=>{r(A),A.setPlaceholder("Your-api-token").setValue(this.plugin.settings.paddleApiKey).onChange(async N=>{this.plugin.settings.paddleApiKey=N.trim(),await this.plugin.saveSettings(),await S()})}),new L.Setting(m).setName("Paddleocr-vl API URL").setDesc("Optional override for the paddleocr-vl API endpoint.").addText(A=>A.setPlaceholder("HTTPS://.../layout-parsing").setValue(this.plugin.settings.paddleVlApiUrl).onChange(async N=>{this.plugin.settings.paddleVlApiUrl=N.trim(),await this.plugin.saveSettings()})),new L.Setting(m).setName("Pp-structurev3 API URL").setDesc("API endpoint for pp-structurev3 (see baidu AI studio docs).").addText(A=>A.setPlaceholder("HTTPS://.../pp-structure").setValue(this.plugin.settings.paddleStructureApiUrl).onChange(async N=>{this.plugin.settings.paddleStructureApiUrl=N.trim(),await this.plugin.saveSettings(),await S()})),new L.Setting(m).setName("Ocr engine").setDesc("Select the ocr engine to use when ocr is required.").addDropdown(A=>{x=A,A.addOption("auto","Auto (default)"),A.setValue(this.plugin.settings.ocrEngine),A.onChange(async N=>{this.plugin.settings.ocrEngine=N,await this.plugin.saveSettings()})}),new L.Setting(m).setName("Ocr decision (when to ocr)").setDesc("Controls when ocr runs; per-page behavior is configured separately below.").addDropdown(A=>A.addOption("auto","Auto: use text layer when reliable").addOption("force_low_quality","Ocr only if text is poor").addOption("force","Prefer ocr for full document").setValue(this.plugin.settings.ocrMode).onChange(async N=>{this.plugin.settings.ocrMode=N,await this.plugin.saveSettings()})),new L.Setting(m).setName("Ocr layout override (per-page)").setDesc("Force per-page ocr when ocr runs, bypassing layout heuristics; can be slower for multi-column pdfs.").addToggle(A=>A.setValue(this.plugin.settings.forcePerPageOcr).onChange(async N=>{this.plugin.settings.forcePerPageOcr=N,await this.plugin.saveSettings()})),new L.Setting(m).setName("Text quality threshold").setDesc("Lower values are stricter; below this threshold the text is treated as low quality.").addSlider(A=>{A.setLimits(0,1,.05).setValue(this.plugin.settings.ocrQualityThreshold).setDynamicTooltip().onChange(async N=>{this.plugin.settings.ocrQualityThreshold=N,await this.plugin.saveSettings()})}),new L.Setting(m).setName("Chunking").setDesc("Page or section").addDropdown(A=>A.addOption("page","Page").addOption("section","Section").setValue(this.plugin.settings.chunkingMode).onChange(async N=>{this.plugin.settings.chunkingMode=N,await this.plugin.saveSettings()})),S()}},{id:"llms",label:"LLMs",render:m=>{new L.Setting(m).setName("Model provider profiles").setHeading();let x=m.createDiv({cls:"zrr-llm-profiles"}),w=()=>{x.empty();let C=t();C.length||x.createEl("p",{text:"No profiles yet. Add one below."});for(let v of C){let D=x.createEl("details",{cls:"zrr-profile"});C.length===1&&(D.open=!0);let re=D.createEl("summary",{text:v.name||v.id||"Profile"});re.addClass("zrr-profile-title");let Ve=D.createDiv({cls:"zrr-profile-body"});new L.Setting(Ve).setName("Profile name").addText(ye=>ye.setPlaceholder("My provider").setValue(v.name||"").onChange(async xe=>{v.name=xe.trim(),re.textContent=v.name||v.id||"Profile",await n(t())})),new L.Setting(Ve).setName("Base URL").addText(ye=>ye.setPlaceholder("HTTP://localhost:1234/v1").setValue(v.baseUrl||"").onChange(async xe=>{v.baseUrl=xe.trim(),await n(t())})),new L.Setting(Ve).setName("API key").setDesc("Stored in settings (not encrypted).").addText(ye=>{r(ye),ye.setPlaceholder("Sk-...").setValue(v.apiKey||"").onChange(async xe=>{v.apiKey=xe.trim(),await n(t())})}),new L.Setting(Ve).setName("Remove profile").setDesc("Deletes this saved profile.").addButton(ye=>ye.setButtonText("Delete profile").onClick(async()=>{let xe=t().filter(kn=>kn.id!==v.id);this.plugin.settings.embedProviderProfileId=this.plugin.settings.embedProviderProfileId===v.id?"":this.plugin.settings.embedProviderProfileId,this.plugin.settings.chatProviderProfileId=this.plugin.settings.chatProviderProfileId===v.id?"":this.plugin.settings.chatProviderProfileId,this.plugin.settings.llmCleanupProviderProfileId=this.plugin.settings.llmCleanupProviderProfileId===v.id?"":this.plugin.settings.llmCleanupProviderProfileId,await n(xe),w()}))}new L.Setting(x).addButton(v=>v.setButtonText("Add profile").onClick(async()=>{let D=`profile-${Date.now().toString(36)}`,re=t().concat([{id:D,name:"Custom",baseUrl:"",apiKey:""}]);await n(re),w()}))};w(),new L.Setting(m).setName("Ocr cleanup").setHeading(),new L.Setting(m).setName("Model cleanup for low-quality chunks").setDesc("Automatic AI cleanup for poor ocr at import. Can be slow/costly.").addToggle(C=>C.setValue(this.plugin.settings.enableLlmCleanup).onChange(async v=>{this.plugin.settings.enableLlmCleanup=v,await this.plugin.saveSettings()}));let S=null,R=null,P=null,A=()=>Promise.resolve(),N=async(C,v=!0)=>{let D=C.trim();this.plugin.settings.llmCleanupBaseUrl=D,v&&(this.plugin.settings.llmCleanupProviderProfileId="",S&&S.setValue("custom")),R&&R.setValue(D),await this.plugin.saveSettings()},O=async C=>{let v=t().find(D=>D.id===C);this.plugin.settings.llmCleanupProviderProfileId=C,v&&(this.plugin.settings.llmCleanupBaseUrl=v.baseUrl,this.plugin.settings.llmCleanupApiKey=v.apiKey,R==null||R.setValue(v.baseUrl),P==null||P.setValue(v.apiKey)),await this.plugin.saveSettings(),await A()};new L.Setting(m).setName("Cleanup provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(C=>{S=C,C.addOption("custom","Custom (manual)");for(let D of t())C.addOption(D.id,D.name||D.id);let v=this.plugin.settings.llmCleanupProviderProfileId;C.setValue(v&&t().some(D=>D.id===v)?v:"custom"),C.onChange(async D=>{if(D==="custom"){this.plugin.settings.llmCleanupProviderProfileId="",await this.plugin.saveSettings();return}await O(D)})}),new L.Setting(m).setName("Cleanup base URL").setDesc("OpenAI-compatible endpoint, e.g. HTTP://127.0.0.1:1234/v1").addText(C=>{R=C,C.setPlaceholder("HTTP://127.0.0.1:1234/v1").setValue(this.plugin.settings.llmCleanupBaseUrl).onChange(async v=>{await N(v)})}),new L.Setting(m).setName("Cleanup API key").setDesc("Optional API key for the cleanup endpoint.").addText(C=>{P=C,r(C),C.setPlaceholder("Sk-...").setValue(this.plugin.settings.llmCleanupApiKey).onChange(async v=>{this.plugin.settings.llmCleanupApiKey=v.trim(),this.plugin.settings.llmCleanupProviderProfileId="",S&&S.setValue("custom"),await this.plugin.saveSettings()})});let q=new L.Setting(m).setName("Cleanup model").setDesc("Select a cleanup-capable model from the provider."),j=null,V=C=>{if(!j)return;let v=(this.plugin.settings.llmCleanupModel||"").trim(),D=new Set(C.map(re=>re.value));v&&!D.has(v)&&(C=C.concat([{value:v,label:`Custom (${v})`}])),j.selectEl.options.length=0;for(let re of C)j.addOption(re.value,re.label);v&&j.setValue(v)};A=async()=>{if(j){j.setDisabled(!0);try{let C=await this.plugin.fetchCleanupModelOptions();V(C)}finally{j.setDisabled(!1)}}},q.addDropdown(C=>{j=C;let v=(this.plugin.settings.llmCleanupModel||"").trim();C.addOption(v||"loading","Loading..."),C.setValue(v||"loading"),C.onChange(async D=>{this.plugin.settings.llmCleanupModel=D.trim(),await this.plugin.saveSettings()})}),q.addButton(C=>{C.setButtonText("Refresh").onClick(async()=>{await A()})}),A(),new L.Setting(m).setName("Cleanup temperature").setDesc("Lower is more conservative.").addText(C=>C.setPlaceholder("0.0").setValue(String(this.plugin.settings.llmCleanupTemperature)).onChange(async v=>{let D=Number.parseFloat(v);this.plugin.settings.llmCleanupTemperature=Number.isFinite(D)?D:0,await this.plugin.saveSettings()})),new L.Setting(m).setName("Cleanup reasoning mode").setDesc("Automatically learn the best cleanup mode for the selected provider and model, and reprobe reasoning every 30 days.").addDropdown(C=>C.addOption("auto","Automatic").addOption("on","Reasoning on").addOption("off","Reasoning off").setValue(this.plugin.settings.llmCleanupReasoningMode).onChange(async v=>{this.plugin.settings.llmCleanupReasoningMode=v==="on"||v==="off"?v:"auto",await this.plugin.saveSettings()})),new L.Setting(m).setName("Cleanup minimum quality").setDesc("Only run cleanup when chunk quality is below this threshold (0-1).").addSlider(C=>C.setLimits(0,1,.05).setValue(this.plugin.settings.llmCleanupMinQuality).setDynamicTooltip().onChange(async v=>{this.plugin.settings.llmCleanupMinQuality=v,await this.plugin.saveSettings()})),new L.Setting(m).setName("Cleanup maximum chars").setDesc("Skip cleanup for chunks longer than this limit.").addText(C=>C.setPlaceholder("2000").setValue(String(this.plugin.settings.llmCleanupMaxChars)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.llmCleanupMaxChars=Number.isFinite(D)?D:2e3,await this.plugin.saveSettings()})),new L.Setting(m).setName("Text embedding").setHeading();let z=null,Z=null,T=null,G=()=>Promise.resolve(),$=async(C,v=!0)=>{let D=C.trim();this.plugin.settings.embedBaseUrl=D,v&&(this.plugin.settings.embedProviderProfileId="",z&&z.setValue("custom")),Z&&Z.setValue(D),await this.plugin.saveSettings()},H=async C=>{let v=t().find(D=>D.id===C);this.plugin.settings.embedProviderProfileId=C,v&&(this.plugin.settings.embedBaseUrl=v.baseUrl,this.plugin.settings.embedApiKey=v.apiKey,Z==null||Z.setValue(v.baseUrl),T==null||T.setValue(v.apiKey)),await this.plugin.saveSettings(),await G()};new L.Setting(m).setName("Embeddings provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(C=>{z=C,C.addOption("custom","Custom (manual)");for(let D of t())C.addOption(D.id,D.name||D.id);let v=this.plugin.settings.embedProviderProfileId;C.setValue(v&&t().some(D=>D.id===v)?v:"custom"),C.onChange(async D=>{if(D==="custom"){this.plugin.settings.embedProviderProfileId="",await this.plugin.saveSettings();return}await H(D)})}),new L.Setting(m).setName("Embeddings base URL").addText(C=>{Z=C,C.setPlaceholder("HTTP://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async v=>{await $(v)})}),new L.Setting(m).setName("Embeddings API key").addText(C=>{T=C,r(C),C.setPlaceholder("Lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async v=>{this.plugin.settings.embedApiKey=v.trim(),this.plugin.settings.embedProviderProfileId="",z&&z.setValue("custom"),await this.plugin.saveSettings()})});let F=new L.Setting(m).setName("Embeddings model").setDesc("Select an embeddings model from the provider."),M=null,J=C=>{if(!M)return;let v=(this.plugin.settings.embedModel||"").trim(),D=new Set(C.map(re=>re.value));v&&!D.has(v)&&(C=C.concat([{value:v,label:`Custom (${v})`}])),M.selectEl.options.length=0;for(let re of C)M.addOption(re.value,re.label);v&&M.setValue(v)};G=async()=>{if(M){M.setDisabled(!0);try{let C=await this.plugin.fetchEmbeddingModelOptions();J(C)}finally{M.setDisabled(!1)}}},F.addDropdown(C=>{M=C;let v=(this.plugin.settings.embedModel||"").trim();C.addOption(v||"loading","Loading..."),C.setValue(v||"loading"),C.onChange(async D=>{this.plugin.settings.embedModel=D.trim(),await this.plugin.saveSettings()})}),F.addButton(C=>{C.setButtonText("Refresh").onClick(async()=>{await G()})}),G(),new L.Setting(m).setName("Include metadata in embeddings").setDesc("Prepend title/authors/tags/section info before embedding chunks.").addToggle(C=>C.setValue(this.plugin.settings.embedIncludeMetadata).onChange(async v=>{this.plugin.settings.embedIncludeMetadata=v,await this.plugin.saveSettings()})),new L.Setting(m).setName("Embedding context window (chunks)").setDesc("Include neighboring chunk text around each chunk when embedding (0 disables).").addText(C=>C.setPlaceholder("1").setValue(String(this.plugin.settings.embedContextWindow)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.embedContextWindow=Number.isFinite(D)?Math.max(0,D):1,await this.plugin.saveSettings()})),new L.Setting(m).setName("Embedding context snippet size (chars)").setDesc("Max chars per neighboring chunk included in embeddings.").addText(C=>C.setPlaceholder("220").setValue(String(this.plugin.settings.embedContextChars)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.embedContextChars=Number.isFinite(D)?Math.max(0,D):220,await this.plugin.saveSettings()})),new L.Setting(m).setName("Embedding subchunk size (chars)").setDesc("Split long chunks into smaller subchunks for embedding only (0 disables).").addText(C=>C.setPlaceholder("1800").setValue(String(this.plugin.settings.embedSubchunkChars)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.embedSubchunkChars=Number.isFinite(D)?Math.max(0,D):3500,await this.plugin.saveSettings()})),new L.Setting(m).setName("Embedding subchunk overlap (chars)").setDesc("Overlap between embedding subchunks to keep context intact.").addText(C=>C.setPlaceholder("200").setValue(String(this.plugin.settings.embedSubchunkOverlap)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.embedSubchunkOverlap=Number.isFinite(D)?Math.max(0,D):200,await this.plugin.saveSettings()})),new L.Setting(m).setName("Generate model tags for chunks").setDesc("Use the ocr cleanup model to tag chunks before indexing.").addToggle(C=>C.setValue(this.plugin.settings.enableChunkTagging).onChange(async v=>{this.plugin.settings.enableChunkTagging=v,await this.plugin.saveSettings()})),new L.Setting(m).setName("Chat model").setHeading();let W=null,I=null,B=null,K=()=>Promise.resolve(),ie=async(C,v=!0)=>{let D=C.trim();this.plugin.settings.chatBaseUrl=D,v&&(this.plugin.settings.chatProviderProfileId="",W&&W.setValue("custom")),I&&I.setValue(D),await this.plugin.saveSettings()},ue=async C=>{let v=t().find(D=>D.id===C);this.plugin.settings.chatProviderProfileId=C,v&&(this.plugin.settings.chatBaseUrl=v.baseUrl,this.plugin.settings.chatApiKey=v.apiKey,I==null||I.setValue(v.baseUrl),B==null||B.setValue(v.apiKey)),await this.plugin.saveSettings(),await K()};new L.Setting(m).setName("Chat provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(C=>{W=C,C.addOption("custom","Custom (manual)");for(let D of t())C.addOption(D.id,D.name||D.id);let v=this.plugin.settings.chatProviderProfileId;C.setValue(v&&t().some(D=>D.id===v)?v:"custom"),C.onChange(async D=>{if(D==="custom"){this.plugin.settings.chatProviderProfileId="",await this.plugin.saveSettings();return}await ue(D)})}),new L.Setting(m).setName("Chat base URL").setDesc("Compatible endpoint for chat requests.").addText(C=>{I=C,C.setPlaceholder("HTTP://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async v=>{await ie(v)})}),new L.Setting(m).setName("Chat API key").addText(C=>{B=C,r(C),C.setPlaceholder("Lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async v=>{this.plugin.settings.chatApiKey=v.trim(),this.plugin.settings.chatProviderProfileId="",W&&W.setValue("custom"),await this.plugin.saveSettings()})});let fe=new L.Setting(m).setName("Chat model").setDesc("Select a chat-capable model from the provider."),oe=null,Ne=C=>{if(!oe)return;let v=(this.plugin.settings.chatModel||"").trim(),D=new Set(C.map(re=>re.value));v&&!D.has(v)&&(C=C.concat([{value:v,label:`Custom (${v})`}])),oe.selectEl.options.length=0;for(let re of C)oe.addOption(re.value,re.label);v&&oe.setValue(v)};K=async()=>{if(oe){oe.setDisabled(!0);try{let C=await this.plugin.fetchChatModelOptions();Ne(C)}finally{oe.setDisabled(!1)}}},fe.addDropdown(C=>{oe=C;let v=(this.plugin.settings.chatModel||"").trim();C.addOption(v||"loading","Loading..."),C.setValue(v||"loading"),C.onChange(async D=>{this.plugin.settings.chatModel=D.trim(),await this.plugin.saveSettings()})}),fe.addButton(C=>{C.setButtonText("Refresh").onClick(async()=>{await K()})}),K(),new L.Setting(m).setName("Temperature").addText(C=>C.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async v=>{let D=Number.parseFloat(v);this.plugin.settings.chatTemperature=Number.isFinite(D)?D:.2,await this.plugin.saveSettings()})),new L.Setting(m).setName("Chat history messages").setDesc("Number of recent messages to include for conversational continuity (0 disables).").addText(C=>C.setPlaceholder("6").setValue(String(this.plugin.settings.chatHistoryMessages)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.chatHistoryMessages=Number.isFinite(D)?Math.max(0,D):6,await this.plugin.saveSettings()})),new L.Setting(m).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(C=>C.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async v=>{this.plugin.settings.chatPaneLocation=v,await this.plugin.saveSettings()})),new L.Setting(m).setName("Retrieval").setHeading(),new L.Setting(m).setName("Enable agentic retrieval").setDesc("Use a small planner step that can trigger expansion retry or full-document retrieval before answering.").addToggle(C=>C.setValue(this.plugin.settings.enableAgenticRag).onChange(async v=>{this.plugin.settings.enableAgenticRag=v,await this.plugin.saveSettings()})),new L.Setting(m).setName("Agentic max iterations").setDesc("Maximum number of planner steps per query.").addText(C=>C.setPlaceholder("2").setValue(String(this.plugin.settings.agenticMaxIters)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.agenticMaxIters=Number.isFinite(D)?Math.max(1,D):2,await this.plugin.saveSettings()})),new L.Setting(m).setName("Enable query expansion").setDesc("Use the chat model to expand queries before retrieval.").addToggle(C=>C.setValue(this.plugin.settings.enableQueryExpansion).onChange(async v=>{this.plugin.settings.enableQueryExpansion=v,await this.plugin.saveSettings()})),new L.Setting(m).setName("Rewrite follow-up queries").setDesc("Rewrite chat queries into standalone retrieval queries using recent chat history.").addToggle(C=>C.setValue(this.plugin.settings.enableFollowUpRewrite).onChange(async v=>{this.plugin.settings.enableFollowUpRewrite=v,await this.plugin.saveSettings()})),new L.Setting(m).setName("Query expansion count").setDesc("Number of expansion variants to request.").addText(C=>C.setPlaceholder("3").setValue(String(this.plugin.settings.queryExpansionCount)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.queryExpansionCount=Number.isFinite(D)?Math.max(1,D):3,await this.plugin.saveSettings()})),new L.Setting(m).setName("Enable cross-encoder reranking").setDesc("Rerank candidates locally with sentence-transformers (downloads model on first use).").addToggle(C=>C.setValue(this.plugin.settings.enableCrossEncoderRerank).onChange(async v=>{this.plugin.settings.enableCrossEncoderRerank=v,await this.plugin.saveSettings()}));let Q=new Set(Vt.map(C=>C.value)),ee=(this.plugin.settings.rerankModel||"").trim()||Se,ge=Q.has(ee)?ee:De,le=null,Et=()=>{if(!le)return;let v=!(ge===De);le.setDisabled(v),le.inputEl.disabled=v,le.inputEl.readOnly=v,le.inputEl.classList.toggle("is-disabled",v),le.inputEl.setAttribute("aria-disabled",String(v))},Lt=new L.Setting(m).setName("Cross-encoder model").setDesc("Choose a multilingual preset, or select custom to edit the model ID.");Lt.addDropdown(C=>{for(let v of Vt)C.addOption(v.value,v.label);C.addOption(De,"Custom"),C.setValue(ge),C.onChange(async v=>{ge=v,v!==De?this.plugin.settings.rerankModel=v:(this.plugin.settings.rerankModel||"").trim()||(this.plugin.settings.rerankModel=Se),await this.plugin.saveSettings(),le==null||le.setValue(this.plugin.settings.rerankModel||Se),Et()})}),Lt.addText(C=>{le=C,C.setPlaceholder(Se).setValue(ee).onChange(async v=>{ge===De&&(this.plugin.settings.rerankModel=v.trim()||Se,await this.plugin.saveSettings())}),Et()}),new L.Setting(m).setName("Rerank candidate multiplier").setDesc("Retrieve k \xD7 n candidates before reranking.").addText(C=>C.setPlaceholder("4").setValue(String(this.plugin.settings.rerankCandidateMultiplier)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.rerankCandidateMultiplier=Number.isFinite(D)?Math.max(1,D):4,await this.plugin.saveSettings()})),new L.Setting(m).setName("Rrf k").setDesc("Rank fusion constant for blending lexical and vector results.").addText(C=>C.setPlaceholder("60").setValue(String(this.plugin.settings.rrfK)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.rrfK=Number.isFinite(D)?Math.max(1,D):60,await this.plugin.saveSettings()})),new L.Setting(m).setName("Rrf log top n").setDesc("Log the top n rrf-ranked chunks to stderr (0 disables).").addText(C=>C.setPlaceholder("0").setValue(String(this.plugin.settings.rrfLogTop)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.rrfLogTop=Number.isFinite(D)?Math.max(0,D):0,await this.plugin.saveSettings()})),new L.Setting(m).setName("Max chunks per document").setDesc("Limit how many chunks from a single document can appear in retrieval (0 disables).").addText(C=>C.setPlaceholder("0").setValue(String(this.plugin.settings.maxChunksPerDoc)).onChange(async v=>{let D=Number.parseInt(v,10);this.plugin.settings.maxChunksPerDoc=Number.isFinite(D)?Math.max(0,D):0,await this.plugin.saveSettings()}))}},{id:"maintenance",label:"Maintenance",render:m=>{new L.Setting(m).setName("Python runtime").setHeading(),new L.Setting(m).setName("Use local runtime (legacy)").setDesc("Switch to local interpreter/venv mode and enable advanced runtime settings.").addButton(x=>x.setButtonText("Switch").onClick(async()=>{await this.plugin.switchPythonRuntimeToLocalLegacy()})),new L.Setting(m).setName("Logging").setHeading(),new L.Setting(m).setName("Enable logging to file").setDesc("Write plugin logs to a file.").addToggle(x=>x.setValue(this.plugin.settings.enableFileLogging).onChange(async w=>{this.plugin.settings.enableFileLogging=w,await this.plugin.saveSettings()})),new L.Setting(m).setName("Log file path (vault-relative)").setDesc("Where to write the log file. Keep inside the vault.").addText(x=>x.setPlaceholder(`${se}/logs/docling_extract.log`).setValue(this.plugin.settings.logFilePath).onChange(async w=>{this.plugin.settings.logFilePath=w.trim()||`${se}/logs/docling_extract.log`,await this.plugin.saveSettings()})),new L.Setting(m).setName("View or clear log").setDesc("Open the log file or clear it.").addButton(x=>x.setButtonText("Open log").onClick(async()=>{var w,S;await((S=(w=this.plugin).openLogFile)==null?void 0:S.call(w))})).addButton(x=>x.setButtonText("Clear log").onClick(async()=>{var w,S;await((S=(w=this.plugin).clearLogFile)==null?void 0:S.call(w))})),new L.Setting(m).setName("Zotero companion plugin").setHeading(),m.createEl("p",{text:"Download the xpi, then in Zotero go to tools \u2192 add-ons \u2192 install from file and restart."}),new L.Setting(m).setName("Download companion add-on").setDesc("Downloads the companion xpi to this plugin folder.").addButton(x=>x.setButtonText("Download xpi").onClick(async()=>{let w=this.getCompanionXpiPath();if(!w){new L.Notice("Unable to resolve this plugin folder.");return}if(await this.companionXpiExists(w)){new L.Notice(`Companion XPI already exists: ${w}`);return}new L.Notice("Downloading companion xpi..."),await this.downloadCompanionXpi(w)})),new L.Setting(m).setName("Open Zotero").setDesc("Launch Zotero and open the add-ons window (tools \u2192 add-ons).").addButton(x=>x.setButtonText("Open Zotero").onClick(async()=>{await this.plugin.openZoteroAddons()})),new L.Setting(m).setName("Check companion status").setDesc("Ping the companion /health endpoint.").addButton(x=>x.setButtonText("Check status").onClick(async()=>{await this.plugin.checkZoteroCompanionHealth()})),new L.Setting(m).setName("Redis indexing").setHeading(),new L.Setting(m).setName("Reindex redis from cached chunks").setDesc("Rebuild the redis index from cached chunk JSON files.").addButton(x=>x.setButtonText("Reindex").onClick(async()=>{await this.plugin.reindexRedisFromCache()})),new L.Setting(m).setName("Recreate redis stack").setDesc("Pulls the configured redis image and force-recreates the redis-stack service.").addButton(x=>x.setButtonText("Recreate").onClick(async()=>{await this.plugin.recreateRedisStack()})),new L.Setting(m).setName("Recreate missing notes from cache").setDesc("Rebuild missing notes using cached Zotero items and chunks.").addButton(x=>x.setButtonText("Recreate").onClick(async()=>{await this.plugin.recreateMissingNotesFromCache()})).addButton(x=>x.setButtonText("Cancel").onClick(()=>{this.plugin.cancelRecreateMissingNotesFromCache()})),new L.Setting(m).setName("Release notes").setHeading(),new L.Setting(m).setName("Show release notes").setDesc("Open the current version splash screen.").addButton(x=>x.setButtonText("Show").onClick(()=>{this.plugin.openReleaseNotesModal()}))}}],p=new Map,_=new Map,g=m=>{this.activeTab=m;for(let[x,w]of p){let S=x===m;w.classList.toggle("is-active",S),w.setAttribute("aria-selected",S?"true":"false"),w.setAttribute("tabindex",S?"0":"-1")}for(let[x,w]of _){let S=x===m;w.classList.toggle("is-active",S),w.hidden=!S}},f=e.createDiv({cls:"zrr-settings-tabs"});f.setAttribute("role","tablist");let b=e.createDiv({cls:"zrr-settings-tabs-panels"});for(let m of d){let x=f.createEl("button",{text:m.label,cls:"zrr-settings-tab-button"}),w=`zrr-settings-tab-${m.id}`,S=`zrr-settings-panel-${m.id}`;x.type="button",x.id=w,x.setAttribute("role","tab"),x.setAttribute("aria-controls",S),x.setAttribute("aria-selected","false"),x.addEventListener("click",()=>g(m.id));let R=b.createDiv({cls:"zrr-settings-tab-panel"});R.id=S,R.setAttribute("role","tabpanel"),R.setAttribute("aria-labelledby",w),R.hidden=!0,m.render(R),p.set(m.id,x),_.set(m.id,R)}let k=d.some(m=>m.id===this.activeTab)?this.activeTab:d[0].id;g(k)}getCompanionXpiPath(){let e=this.app.vault.adapter;if(!(e instanceof L.FileSystemAdapter))return null;let t=this.plugin.manifest.dir||"zotero-redisearch-rag";return yt.default.join(e.getBasePath(),t,"zrr-companion.xpi")}async companionXpiExists(e){try{return await He.promises.access(e),!0}catch(t){return!1}}async downloadCompanionXpi(e){try{await He.promises.mkdir(yt.default.dirname(e),{recursive:!0});let t=await(0,L.requestUrl)({url:Tn,method:"GET"});if(t.status!==200){new L.Notice(`Failed to download companion XPI (HTTP ${t.status}).`);return}let n=Buffer.from(t.arrayBuffer);await He.promises.writeFile(e,n),new L.Notice(`Downloaded companion XPI: ${e}`)}catch(t){new L.Notice("Failed to download companion xpi. See console for details."),console.warn("Failed to download companion XPI",t)}}};var Wt=require("@codemirror/state"),Ht=require("@codemirror/view"),_e=require("obsidian");var Dn=y=>{let u=y.scrollDOM.getBoundingClientRect(),e=y.posAtCoords({x:u.left+8,y:+u.height*.25});return e===null?null:y.state.doc.lineAt(e).number},Oe=y=>!y||typeof y!="object"?null:y,Xe=class{constructor(u,e){this.pdfSidebarLeaf=null;this.pdfSidebarDocId=null;this.pdfSidebarPdfPath=null;this.pdfSidebarPage=null;this.pendingPdfSync=null;this.chunkPageCache=new Map;this.previewScrollEl=null;this.previewScrollHandler=null;this.previewScrollFrame=null;this.pdfSyncInFlight=!1;this.queuedPdfSync=null;this.deps=u,this.helpers=e}createSyncExtension(){let u=this.helpers,e=this.syncPdfSidebarForDoc.bind(this);return Ht.ViewPlugin.fromClass(class{constructor(t){this.docId=null;this.lastPage=null;this.lastChunkId=null;this.scrollFrame=null;this.view=t,this.docId=u.extractDocIdFromDoc(t.state.doc),this.onScroll=()=>this.scheduleSync(!1),t.scrollDOM.addEventListener("scroll",this.onScroll,{passive:!0}),this.scheduleSync(!0)}update(t){t.docChanged&&(this.docId=u.extractDocIdFromDoc(t.view.state.doc),this.lastPage=null,this.lastChunkId=null),(t.docChanged||t.viewportChanged)&&this.scheduleSync(!1)}destroy(){this.view.scrollDOM.removeEventListener("scroll",this.onScroll),this.scrollFrame!==null&&(window.cancelAnimationFrame(this.scrollFrame),this.scrollFrame=null)}scheduleSync(t){this.scrollFrame===null&&(this.scrollFrame=window.requestAnimationFrame(()=>{this.scrollFrame=null,this.syncPdfSidebar(this.view,t)}))}syncPdfSidebar(t,n){var p,_;let r=this.docId;if(!r)return;let i=Dn(t);if(i===null)return;let a=u.findChunkStartLineInDoc(t.state.doc,i);if(!a)return;let s=u.parseChunkMarkerLine(a.text),o=(p=s==null?void 0:s.pageNumber)!=null?p:null,l=(_=s==null?void 0:s.chunkId)!=null?_:null;if(!o&&!l)return;let c=o!==null&&this.lastPage===o,d=o===null&&l!==null&&this.lastChunkId===l;!n&&(c||d)||(this.lastPage=o,this.lastChunkId=l,e(r,o!=null?o:void 0,l!=null?l:void 0))}})}async maybeSyncPendingPdf(u={}){if(!this.pendingPdfSync||!this.isPdfSidebarLeaf(this.pdfSidebarLeaf)&&!await this.getPdfSidebarLeaf(!!u.allowCreateLeaf)||!this.pdfSidebarLeaf||!this.isLeafTabActive(this.pdfSidebarLeaf))return;let e=this.pendingPdfSync;this.pendingPdfSync=null,await this.syncPdfSidebarForDoc(e.docId,e.pageNumber,e.chunkId)}async revealPdfSidebar(u={}){let e=await this.getPdfSidebarLeaf(!!u.allowCreateLeaf);if(e)try{await this.deps.app.workspace.revealLeaf(e)}catch(t){console.warn("Failed to reveal PDF sidebar leaf",t)}}updatePreviewScrollHandler(){var n;let u=this.deps.app.workspace.getActiveViewOfType(_e.MarkdownView);if(!u||u.getMode()!=="preview"){this.detachPreviewScrollHandler();return}let e=(n=u.previewMode)==null?void 0:n.containerEl;if(!e){this.detachPreviewScrollHandler();return}if(this.previewScrollEl===e)return;this.detachPreviewScrollHandler();let t=()=>this.schedulePreviewSync(u);e.addEventListener("scroll",t,{passive:!0}),this.previewScrollEl=e,this.previewScrollHandler=t,this.schedulePreviewSync(u)}async syncPdfSidebarForFile(u,e={}){try{let t=await this.deps.app.vault.read(u),n=await this.deps.resolveDocIdForNote(u,t);if(!n)return;let r=this.helpers.extractFirstChunkMarkerFromContent(t);await this.syncPdfSidebarForDoc(n,r==null?void 0:r.pageNumber,r==null?void 0:r.chunkId,e)}catch(t){console.warn("Failed to sync PDF sidebar for opened note",t)}}async syncPdfSidebarForDoc(u,e,t,n={}){if(u){if(this.pdfSyncInFlight){this.queuedPdfSync={docId:u,pageNumber:e,chunkId:t};return}this.pdfSyncInFlight=!0;try{let r=await this.deps.getDocIndexEntry(u);r||(r=await this.deps.hydrateDocIndexFromCache(u));let i=r!=null&&r.pdf_path?String(r.pdf_path):"";if(!i)return;let a=this.deps.toVaultRelativePath(i);if(!a){let p=(0,_e.normalizePath)(i);this.deps.app.vault.getAbstractFileByPath(p)instanceof _e.TFile&&(a=p)}if(!a)return;let s=this.deps.app.vault.getAbstractFileByPath(a);if(!(s instanceof _e.TFile)||s.extension.toLowerCase()!=="pdf")return;let o=await this.getPdfSidebarLeaf(!!n.allowCreateLeaf);if(!o){this.pendingPdfSync={docId:u,pageNumber:e,chunkId:t};return}if(!this.isLeafTabActive(o)&&!n.allowCreateLeaf){this.pendingPdfSync={docId:u,pageNumber:e,chunkId:t};return}let l=Number.isFinite(e!=null?e:NaN)?Number(e):null;if(l===null&&t&&(l=await this.resolvePageNumberForChunk(u,t)),l===null||this.isPdfSidebarLeaf(o)&&this.pdfSidebarLeaf===o&&this.pdfSidebarDocId===u&&this.pdfSidebarPdfPath===s.path&&this.pdfSidebarPage===l)return;let c=a,d=l!==null?`${c}#page=${l}`:c;if(await this.openPdfLinkInLeaf(o,s,d),this.pdfSidebarLeaf=o,this.pdfSidebarDocId=u,this.pdfSidebarPdfPath=s.path,this.pdfSidebarPage=l,this.updatePdfSidebarIcon(o),n.allowCreateLeaf&&!this.isLeafTabActive(o))try{await this.deps.app.workspace.revealLeaf(o)}catch(p){console.warn("Failed to reveal PDF sidebar leaf",p)}}finally{this.pdfSyncInFlight=!1;let r=this.queuedPdfSync;this.queuedPdfSync=null,r&&this.syncPdfSidebarForDoc(r.docId,r.pageNumber,r.chunkId)}}}detachPreviewScrollHandler(){this.previewScrollEl&&this.previewScrollHandler&&this.previewScrollEl.removeEventListener("scroll",this.previewScrollHandler),this.previewScrollEl=null,this.previewScrollHandler=null,this.previewScrollFrame!==null&&(window.cancelAnimationFrame(this.previewScrollFrame),this.previewScrollFrame=null)}schedulePreviewSync(u){this.previewScrollFrame===null&&(this.previewScrollFrame=window.requestAnimationFrame(()=>{this.previewScrollFrame=null,this.syncPdfSidebarForPreview(u)}))}syncPdfSidebarForPreview(u){let e=this.previewScrollEl;if(!e)return;let t=u.getViewData();if(!t)return;let n=Wt.Text.of(t.split(/\r?\n/)),r=this.helpers.extractDocIdFromDoc(n);if(!r)return;let i=this.getPreviewTopLineNumber(e);if(i===null)return;let a=this.helpers.findChunkStartLineInDoc(n,i+1);if(!a)return;let s=this.helpers.parseChunkMarkerLine(a.text);!(s!=null&&s.pageNumber)&&!(s!=null&&s.chunkId)||this.syncPdfSidebarForDoc(r,s==null?void 0:s.pageNumber,s==null?void 0:s.chunkId)}getPreviewTopLineNumber(u){var n;let e=u.getBoundingClientRect().top,t=u.querySelectorAll("[data-line]");for(let r of Array.from(t))if(r.getBoundingClientRect().bottom>=e+2){let a=(n=r.getAttribute("data-line"))!=null?n:"",s=Number.parseInt(a,10);if(Number.isFinite(s))return s}return null}async getPdfSidebarLeaf(u=!1){if(this.pdfSidebarLeaf&&this.isUsableRightSidebarLeaf(this.pdfSidebarLeaf)&&this.isPdfSidebarLeaf(this.pdfSidebarLeaf))return this.pdfSidebarLeaf;this.resetPdfSidebarLeaf();let e=this.findRightSidebarPdfLeaf();if(e)return this.pdfSidebarLeaf=e,this.updatePdfSidebarIcon(e),e;if(u){let t=this.deps.app.workspace;if(typeof t.ensureSideLeaf=="function")try{let r=await t.ensureSideLeaf("pdf","right",{active:!1,split:!1,reveal:!1});if(this.isUsableRightSidebarLeaf(r))return this.pdfSidebarLeaf=r,r.isDeferred&&await r.loadIfDeferred(),this.updatePdfSidebarIcon(r),r}catch(r){console.warn("Failed to ensure PDF side leaf",r)}let n=this.deps.app.workspace.getRightLeaf(!1);if(this.isUsableRightSidebarLeaf(n))return this.pdfSidebarLeaf=n,n}return null}findRightSidebarPdfLeaf(){let u=this.deps.app.workspace;if(typeof u.iterateAllLeaves!="function")return null;let e=null;return u.iterateAllLeaves(t=>{if(!(!this.isUsableRightSidebarLeaf(t)||!this.isPdfSidebarLeaf(t))){if(this.isLeafTabActive(t)){e=t;return}e||(e=t)}}),e}resetPdfSidebarLeaf(){this.pdfSidebarLeaf=null,this.pdfSidebarDocId=null,this.pdfSidebarPdfPath=null,this.pdfSidebarPage=null}isUsableRightSidebarLeaf(u){var t;return this.isRightSidebarLeaf(u)?!!((t=u.containerEl)!=null&&t.isConnected):!1}getLeafViewType(u){var t,n;if(!u)return"";try{let r=u.getViewState();if(typeof(r==null?void 0:r.type)=="string"&&r.type)return r.type}catch(r){console.debug("Failed to read leaf view state",r)}let e=(n=(t=u.view)==null?void 0:t.getViewType)==null?void 0:n.call(t);return typeof e=="string"?e:""}isPdfSidebarLeaf(u){return this.getLeafViewType(u)==="pdf"}isRightSidebarLeaf(u){if(!u)return!1;let t=u.containerEl;return t?!!t.closest(".workspace-split.mod-right-split, .mod-right-split"):!1}updatePdfSidebarIcon(u){if(!u||!this.isRightSidebarLeaf(u)||!this.isPdfSidebarLeaf(u))return;let t=u.containerEl,n=[];t&&n.push(...Array.from(t.querySelectorAll(".view-header-icon")));let r=u;if(r.tabHeaderEl&&n.push(...Array.from(r.tabHeaderEl.querySelectorAll(".workspace-tab-header-inner-icon, .view-header-icon"))),r.tabHeaderInnerIconEl&&n.push(r.tabHeaderInnerIconEl),n.length===0)return;let i=new Set;for(let s of n)i.has(s)||(i.add(s),s.replaceChildren(),(0,_e.setIcon)(s,"zrr-pdf"),s.dataset&&(s.dataset.zrrIcon="zrr-pdf"));let a=u.view;a.icon="zrr-pdf",typeof a.getIcon=="function"&&(a.getIcon=()=>"zrr-pdf")}async openPdfLinkInLeaf(u,e,t){var l;if(!await this.ensurePdfLeafReady(u,e)){await u.openFile(e,{active:!1});return}let r=Oe((l=this.getPluginsRegistry())==null?void 0:l["pdf-plus"]),i=Oe(r==null?void 0:r.lib),a=Oe(i==null?void 0:i.workspace),s=typeof(a==null?void 0:a.openPDFLinkTextInLeaf)=="function"?a.openPDFLinkTextInLeaf:null;if(typeof s=="function")try{await s.call(a,u,t,"",{active:!1});return}catch(c){if(!this.isPdfAnnotationRaceError(c))throw c;await this.delay(150)}let o=u;if(typeof o.openLinkText=="function"){try{await o.openLinkText(t,"",{active:!1})}catch(c){if(!this.isPdfAnnotationRaceError(c))throw c;await this.delay(150),await o.openLinkText(t,"",{active:!1})}return}await u.openFile(e,{active:!1})}async ensurePdfLeafReady(u,e){if(this.isPdfSidebarLeaf(u))return!0;try{await u.setViewState({type:"pdf",active:!1})}catch(t){console.debug("Failed to set PDF view state on sidebar leaf",t)}if(u.isDeferred)try{await u.loadIfDeferred()}catch(t){console.debug("Failed to load deferred PDF sidebar leaf",t)}if(this.isPdfSidebarLeaf(u))return!0;try{await u.openFile(e,{active:!1})}catch(t){return console.warn("Failed to open PDF file in sidebar leaf",t),!1}return this.isPdfSidebarLeaf(u)}isPdfAnnotationRaceError(u){let e=u instanceof Error?u.message:typeof u=="string"?u:"";return e?/injectLinkAnnotations/i.test(e)||/render method must be called before/i.test(e):!1}delay(u){return new Promise(e=>activeWindow.setTimeout(e,u))}getPluginsRegistry(){var e;return(e=this.deps.app.plugins)==null?void 0:e.plugins}isLeafTabActive(u){var r;let e=u;if((r=e.parent)!=null&&r.activeLeaf)return e.parent.activeLeaf===u;let t=e.containerEl;if(t!=null&&t.classList.contains("is-active")||t!=null&&t.classList.contains("mod-active"))return!0;let n=e.tabHeaderEl;return!!(n!=null&&n.classList.contains("is-active")||n!=null&&n.classList.contains("mod-active"))}async resolvePageNumberForChunk(u,e){var l,c,d,p,_;if(!u||!e)return null;let t=this.deps.normalizeChunkIdForNote(e,u)||e,n=this.chunkPageCache.get(u);if(n&&n.has(t))return(l=n.get(t))!=null?l:null;let r=(0,_e.normalizePath)(`${te}/${u}.json`);if(!await this.deps.app.vault.adapter.exists(r))return null;let a=Oe(await this.deps.readChunkPayload(r)),s=Array.isArray(a==null?void 0:a.chunks)?a.chunks:[],o=new Map;for(let g of s){let f=Oe(g),b=typeof(f==null?void 0:f.chunk_id)=="string"?f.chunk_id.trim():"";if(!b)continue;let k=Number.isFinite((c=f==null?void 0:f.page_start)!=null?c:NaN)?Number(f==null?void 0:f.page_start):null,m=Number.isFinite((d=f==null?void 0:f.page_end)!=null?d:NaN)?Number(f==null?void 0:f.page_end):null,x=k!=null?k:m;x!==null&&(o.set(b,x),o.set(`${u}:${b}`,x))}return this.chunkPageCache.set(u,o),(_=(p=o.get(t))!=null?p:o.get(e))!=null?_:null}};var Qe={"zrr-picker":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
`};var Ce=require("@codemirror/state"),pe=require("@codemirror/view"),X=require("obsidian");var bt=y=>!y||typeof y!="object"?null:y,On=y=>Array.isArray(y),U=y=>{if(typeof y=="string")return y.trim();if(typeof y=="number"&&Number.isFinite(y))return String(y);if(Array.isArray(y))for(let u of y){if(typeof u=="string"&&u.trim())return u.trim();if(typeof u=="number"&&Number.isFinite(u))return String(u)}if(y&&typeof y=="object"){let u=y[0];if(typeof u=="string"&&u.trim())return u.trim();if(typeof u=="number"&&Number.isFinite(u))return String(u)}return""},Kt=y=>{let u=[y.key,y.itemKey,y.id,y.citationKey];for(let e of u)if(typeof e=="string"&&e.trim())return e.trim();return null},Re=y=>{var e,t,n;let u=(n=(t=y.key)!=null?t:(e=y.data)==null?void 0:e.key)!=null?n:"";return typeof u=="string"?u:""},Ye=y=>{if(!y)return"";let u=y.match(/\b(\d{4})\b/);return u?u[1]:""},Jt=y=>{var e,t,n,r;let u=(r=(n=(e=y.meta)==null?void 0:e.parsedDate)!=null?n:(t=y.data)==null?void 0:t.date)!=null?r:"";return typeof u!="string"?"":Ye(u)},ve=y=>{let u=bt(y);if(!u)return"";let e=U(u.name);if(e)return e;let t=U(u.firstName),n=U(u.lastName);return[n,t].filter(Boolean).join(", ")||`${t} ${n}`.trim()},Ie=(y,u)=>{let e=[y.citationKey,y["citation-key"],y.citation_key,u==null?void 0:u.citationKey,u==null?void 0:u["citation-key"],u==null?void 0:u.citation_key,y.citationkey,y.citekey,y.citeKey,y.betterBibtexKey,y.betterbibtexkey,u==null?void 0:u.citationkey,u==null?void 0:u.citekey,u==null?void 0:u.citeKey,u==null?void 0:u.betterBibtexKey,u==null?void 0:u.betterbibtexkey];for(let r of e){let i=U(r);if(i)return i}let t=typeof y.extra=="string"?y.extra:"";if(!t)return"";let n=t.split(/\r?\n/);for(let r of n){let i=r.match(/^\s*biblatexcitekey\s*\[([^\]]+)\]\s*$/i);if(i&&i[1])return i[1].trim();let a=r.match(/^\s*(citation key|citationkey|citekey|citation-key|bibtex key|bibtexkey|bibtex)\s*:\s*(.+)\s*$/i);if(a&&a[2])return a[2].trim()}return""},xt=y=>{if(!y)return"";let u=[y["citation-key"],y.citationKey,y.citationkey,y.citekey,y.citation_key];for(let e of u){let t=U(e);if(t)return t}return""},Xt=y=>{var e,t;if(!y)return"";let u=(t=(e=y["title-short"])!=null?e:y.shortTitle)!=null?t:y.short_title;return typeof u=="string"?u.trim():""},Pe=y=>{let u=U(y.shortTitle);if(u)return u;let e=U(y.short_title);if(e)return e;let t=U(y["title-short"]);return t||""},Qt=y=>{let u=typeof y.extra=="string"?y.extra:"";if(!u)return"";let e=u.split(/\r?\n/);for(let n of e){let r=n.match(/^\s*doi\s*:\s*(.+)\s*$/i);if(r&&r[1])return r[1].trim().replace(/[.,;]+$/,"")}let t=u.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i);return t?t[0].replace(/[.,;]+$/,""):""},Yt=y=>{var e;if(!y)return"";let u=(e=y.DOI)!=null?e:y.doi;return typeof u=="string"?u.trim().replace(/[.,;]+$/,""):""},In=y=>{if(!y)return[];let u=[y.attachments,y.children,y.items,y.attachment,y.allAttachments],e=[];for(let t of u)t&&(On(t)?e.push(...t):typeof t=="object"&&e.push(t));return e},kt=y=>{var r,i,a,s,o,l,c,d,p,_;let u=bt(y),e=bt(u==null?void 0:u.data);if(((s=(a=(i=(r=u==null?void 0:u.contentType)!=null?r:u==null?void 0:u.mimeType)!=null?i:e==null?void 0:e.contentType)!=null?a:e==null?void 0:e.mimeType)!=null?s:"")==="application/pdf")return!0;let n=(_=(p=(d=(c=(l=(o=u==null?void 0:u.filename)!=null?o:u==null?void 0:u.fileName)!=null?l:e==null?void 0:e.filename)!=null?c:e==null?void 0:e.fileName)!=null?d:u==null?void 0:u.path)!=null?p:e==null?void 0:e.path)!=null?_:"";return!!(typeof n=="string"&&n.toLowerCase().endsWith(".pdf"))},en=y=>{var t;let u=In(y.data);if(u.length>0)return u.some(r=>kt(r))?"yes":"no";let e=(t=y.meta)==null?void 0:t.numChildren;return typeof e=="number"&&e===0?"no":"unknown"};var Fn={artwork:"image",audioRecording:"music",bill:"file-text",blogPost:"globe",book:"book",bookSection:"book-open",case:"scale",computerProgram:"code",conferencePaper:"file-text",dataset:"database",dictionaryEntry:"book",document:"file-text",email:"mail",encyclopediaArticle:"book",film:"film",forumPost:"message-circle",hearing:"file-text",interview:"mic",journalArticle:"file-text",letter:"mail",magazineArticle:"file-text",manuscript:"file-text",map:"map",newspaperArticle:"file-text",patent:"award",podcast:"mic",preprint:"file-text",presentation:"file-text",radioBroadcast:"music",report:"file-text",statute:"scale",thesis:"graduation-cap",tvBroadcast:"film",videoRecording:"film",webpage:"globe"},tn=[{label:"Auto (no hint)",value:""},{label:"English (en)",value:"en"},{label:"German (de)",value:"de"},{label:"German + English (de,en)",value:"de,en"},{label:"French (fr)",value:"fr"},{label:"Spanish (es)",value:"es"},{label:"Italian (it)",value:"it"},{label:"Dutch (nl)",value:"nl"},{label:"Portuguese (pt)",value:"pt"},{label:"Polish (pl)",value:"pl"},{label:"Swedish (sv)",value:"sv"},{label:"Other (custom ISO code)",value:"__custom__"}],Mn="https://github.com/jmiba/zotero-redisearch-rag/blob/main/CHANGELOG.md",qn=y=>y.includes("STDERR")?"zrr-log-stderr":y.includes("ERROR")?"zrr-log-error":y.includes("WARNING")||y.includes("WARN")?"zrr-log-warning":y.includes("INFO")?"zrr-log-info":null,nn=y=>{let u=new Ce.RangeSetBuilder;for(let{from:e,to:t}of y.visibleRanges){let n=e;for(;n<=t;){let r=y.state.doc.lineAt(n),i=qn(r.text);i&&u.add(r.from,r.from,pe.Decoration.line({class:i})),n=r.to+1}}return u.finish()},rn=pe.EditorView.theme({".cm-editor":{height:"100%",display:"flex",flexDirection:"column",minHeight:"0"},".cm-scroller":{fontFamily:"var(--font-monospace)",fontSize:"0.85rem",flex:"1",height:"100%",maxHeight:"100%",overflow:"auto"},".zrr-log-error":{color:"var(--text-error)"},".zrr-log-warning":{color:"var(--text-accent)"},".zrr-log-info":{color:"var(--text-muted)"},".zrr-log-stderr":{color:"var(--text-accent)"}}),an=pe.ViewPlugin.fromClass(class{constructor(y){this.decorations=nn(y)}update(y){(y.docChanged||y.viewportChanged)&&(this.decorations=nn(y.view))}},{decorations:y=>y.decorations}),Fe=class extends X.Modal{constructor(u,e,t,n,r="Value cannot be empty."){super(u),this.titleText=e,this.placeholder=t,this.onSubmit=n,this.emptyMessage=r}onOpen(){let{contentEl:u}=this;u.empty(),u.createEl("h3",{text:this.titleText});let e=u.createEl("input",{type:"text",placeholder:this.placeholder});e.addClass("zrr-u-width-100"),e.focus();let t=u.createEl("button",{text:"Submit"});t.addClass("zrr-u-margin-top-0-75rem");let n=()=>{let r=e.value.trim();if(!r){new X.Notice(this.emptyMessage);return}this.close(),this.onSubmit(r)};t.addEventListener("click",n),e.addEventListener("keydown",r=>{r.key==="Enter"&&n()})}},Me=class extends X.Modal{constructor(e,t,n){super(e);this.markdownComponent=null;this.version=t,this.markdown=n}onOpen(){var a;let{contentEl:e}=this;e.empty(),e.addClass("zrr-release-notes-modal"),e.createEl("h3",{text:"What's new"}),(a=this.markdownComponent)==null||a.unload(),this.markdownComponent=new X.Component,this.markdownComponent.load();let t=String(this.markdown||"").trim();if(t){let s=e.createDiv({cls:"zrr-release-notes-body"});X.MarkdownRenderer.render(this.app,t,s,"",this.markdownComponent)}else e.createEl("p",{text:"This version includes improvements and fixes."});let n=e.createDiv({cls:"zrr-release-notes-body"});X.MarkdownRenderer.render(this.app,`[Full changelog](${Mn})`,n,"",this.markdownComponent),e.createDiv({cls:"zrr-release-notes-actions"}).createEl("button",{text:"Close"}).addEventListener("click",()=>this.close())}onClose(){var e;(e=this.markdownComponent)==null||e.unload(),this.markdownComponent=null,this.contentEl.empty()}},et=class extends X.Modal{constructor(u,e,t,n,r){super(u),this.chunkId=e,this.initialTags=t,this.onSubmit=n,this.onRegenerate=r}onOpen(){let{contentEl:u}=this;u.empty(),u.createEl("h3",{text:`Edit tags for ${this.chunkId}`});let e=u.createEl("textarea",{attr:{rows:"3"}});e.addClass("zrr-u-width-100"),e.placeholder="Tag1, tag2, tag3",e.value=this.initialTags.join(", "),e.focus();let t=u.createDiv();t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-gap-0-5rem"),t.addClass("zrr-u-margin-top-0-75rem");let n=t.createEl("button",{text:"Save tags"}),r=async()=>{let a=(e.value||"").split(/[,;\n]+/).map(o=>o.trim()).filter(o=>o.length>0),s=Array.from(new Set(a));this.close(),await Promise.resolve(this.onSubmit(s))};if(this.onRegenerate){let i=t.createEl("button",{text:"Regenerate"});i.addEventListener("click",()=>{(async()=>{var a;i.setAttribute("disabled","true"),n.setAttribute("disabled","true");try{let s=await((a=this.onRegenerate)==null?void 0:a.call(this));s&&s.length>0?(e.value=s.join(", "),await Promise.resolve(this.onSubmit(s))):s&&new X.Notice("No tags were generated.")}finally{i.removeAttribute("disabled"),n.removeAttribute("disabled")}})()})}n.addEventListener("click",()=>{r()}),e.addEventListener("keydown",i=>{i.key==="Enter"&&(i.metaKey||i.ctrlKey)&&r()})}},tt=class extends X.Modal{constructor(u,e,t,n=""){super(u),this.titleText=e,this.content=t,this.noteText=n}onOpen(){let{contentEl:u}=this;if(u.empty(),u.createEl("h3",{text:this.titleText}),this.noteText){let t=u.createDiv({text:this.noteText});t.className="zrr-indexed-note"}let e=u.createEl("textarea",{attr:{rows:"12",readonly:"true"}});e.addClass("zrr-u-width-100"),e.value=this.content}},nt=class extends X.Modal{constructor(e,t,n=""){super(e);this.bodyText="";this.plugin=t,this.initialTerm=n}onOpen(){let{contentEl:e}=this;e.empty(),this.modalEl&&(this.modalEl.addClass("zrr-u-width-80vw"),this.modalEl.addClass("zrr-u-max-width-1200px"),this.modalEl.addClass("zrr-u-height-80vh"),this.modalEl.addClass("zrr-u-max-height-90vh"),this.modalEl.addClass("zrr-u-resize-both"),this.modalEl.addClass("zrr-u-overflow-hidden")),e.addClass("zrr-u-display-flex"),e.addClass("zrr-u-flex-direction-column"),e.addClass("zrr-u-height-100"),e.addClass("zrr-u-overflow-hidden"),e.addClass("zrr-u-min-height-0");let t=e.createDiv();t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-align-items-center"),t.addClass("zrr-u-justify-content-space-between"),t.addClass("zrr-u-gap-0-5rem"),t.createEl("h3",{text:"Redis index search"});let n=t.createEl("button",{text:"Copy all"});n.addClass("zrr-u-margin-left-auto"),n.addEventListener("click",()=>{this.copyResultsToClipboard()});let r=e.createDiv();r.addClass("zrr-u-display-flex"),r.addClass("zrr-u-align-items-center"),r.addClass("zrr-u-gap-0-5rem"),r.addClass("zrr-u-margin-0-5rem-0");let i=r.createEl("input");i.type="text",i.placeholder="Search term",i.value=this.initialTerm,i.addClass("zrr-u-flex-1"),i.addClass("zrr-u-min-width-0"),this.inputEl=i,r.createEl("button",{text:"Search"}).addEventListener("click",()=>{this.runSearch()}),i.addEventListener("keydown",c=>{c.key==="Enter"&&(c.preventDefault(),this.runSearch())});let s=e.createDiv();s.addClass("zrr-u-color-var-text-muted"),s.addClass("zrr-u-margin-bottom-0-5rem"),this.statusEl=s;let o=e.createDiv();o.addClass("zrr-u-flex-1-1-0"),o.addClass("zrr-u-min-height-0"),o.addClass("zrr-u-border-1px-solid-var-background-modifier-border"),o.addClass("zrr-u-border-radius-6px"),o.addClass("zrr-u-display-flex"),o.addClass("zrr-u-flex-direction-column"),o.addClass("zrr-u-overflow-auto");let l=Ce.EditorState.create({doc:this.bodyText,extensions:[rn,an,pe.EditorView.editable.of(!1),Ce.EditorState.readOnly.of(!0),pe.EditorView.lineWrapping]});this.editorView=new pe.EditorView({state:l,parent:o}),this.initialTerm&&this.runSearch()}onClose(){var e;(e=this.editorView)==null||e.destroy(),this.editorView=void 0}async runSearch(){var n;let e=(((n=this.inputEl)==null?void 0:n.value)||"").trim();if(!e){this.statusEl&&(this.statusEl.textContent="Enter a search term.");return}this.statusEl&&(this.statusEl.textContent="Searching...");let t=await this.plugin.runRedisSearch(e);this.updateEditor(t),this.statusEl&&(this.statusEl.textContent=`Results for "${e}"`)}updateEditor(e){if(!this.editorView)return;let t=this.editorView,n=t.scrollDOM.scrollTop,r=t.state.selection.main,i=e.length,a=Math.min(r.anchor,i),s=Math.min(r.head,i);t.dispatch({changes:{from:0,to:t.state.doc.length,insert:e},selection:{anchor:a,head:s}}),t.scrollDOM.scrollTop=n,this.bodyText=e}copyResultsToClipboard(){let e=this.bodyText||"";if(!e){new X.Notice("Nothing to copy.");return}navigator.clipboard.writeText(e).then(()=>new X.Notice("Results copied to clipboard.")).catch(()=>new X.Notice("Failed to copy results."))}},Ee=class extends X.Modal{constructor(u,e,t,n){super(u),this.titleText=e,this.bodyText=t,this.options=n}onOpen(){var i,a,s,o;let{contentEl:u}=this;u.empty(),this.modalEl&&(this.modalEl.addClass("zrr-u-width-80vw"),this.modalEl.addClass("zrr-u-max-width-1200px"),this.modalEl.addClass("zrr-u-height-80vh"),this.modalEl.addClass("zrr-u-max-height-90vh"),this.modalEl.addClass("zrr-u-resize-both"),this.modalEl.addClass("zrr-u-overflow-hidden")),u.addClass("zrr-u-display-flex"),u.addClass("zrr-u-flex-direction-column"),u.addClass("zrr-u-height-100"),u.addClass("zrr-u-overflow-hidden"),u.addClass("zrr-u-min-height-0");let e=u.createDiv();e.addClass("zrr-u-display-flex"),e.addClass("zrr-u-align-items-center"),e.addClass("zrr-u-justify-content-space-between"),e.addClass("zrr-u-gap-0-5rem"),e.createEl("h3",{text:this.titleText});let t=e.createDiv();if(t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-gap-0-5rem"),(i=this.options)!=null&&i.onClear){let l=(a=this.options.clearLabel)!=null?a:"Clear log";t.createEl("button",{text:l}).addEventListener("click",()=>{(async()=>{var d,p;try{await((p=(d=this.options)==null?void 0:d.onClear)==null?void 0:p.call(d))}finally{await this.refreshFromSource()}})()})}let n=u.createDiv();n.addClass("zrr-u-flex-1-1-0"),n.addClass("zrr-u-min-height-0"),n.addClass("zrr-u-border-1px-solid-var-background-modifier-border"),n.addClass("zrr-u-border-radius-6px"),n.addClass("zrr-u-display-flex"),n.addClass("zrr-u-flex-direction-column"),n.addClass("zrr-u-overflow-auto");let r=Ce.EditorState.create({doc:this.bodyText,extensions:[rn,an,pe.EditorView.editable.of(!0),Ce.EditorState.readOnly.of(!1),pe.EditorView.lineWrapping]});if(this.editorView=new pe.EditorView({state:r,parent:n}),this.refreshFromSource(),(s=this.options)!=null&&s.autoRefresh&&this.options.onRefresh){let l=(o=this.options.refreshIntervalMs)!=null?o:2e3;this.refreshTimer=window.setInterval(()=>{this.refreshFromSource()},l)}}onClose(){var u;this.refreshTimer!==void 0&&(window.clearInterval(this.refreshTimer),this.refreshTimer=void 0),(u=this.editorView)==null||u.destroy(),this.editorView=void 0}async refreshFromSource(){var s;if(!((s=this.options)!=null&&s.onRefresh)||!this.editorView)return;let u="";try{u=await this.options.onRefresh()||""}catch(o){return}if(u===this.bodyText)return;let e=this.editorView,t=e.scrollDOM.scrollTop,n=e.state.selection.main,r=u.length,i=Math.min(n.anchor,r),a=Math.min(n.head,r);e.dispatch({changes:{from:0,to:e.state.doc.length,insert:u},selection:{anchor:i,head:a}}),e.scrollDOM.scrollTop=t,this.bodyText=u}},rt=class extends X.Modal{constructor(e,t,n){super(e);this.resolved=!1;this.filePath=t,this.onResolve=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Overwrite existing note?"}),e.createEl("p",{text:`This will overwrite: ${this.filePath}`});let t=e.createDiv();t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-gap-0-5rem"),t.addClass("zrr-u-margin-top-0-75rem");let n=t.createEl("button",{text:"Cancel"}),r=t.createEl("button",{text:"Overwrite"});n.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),r.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},it=class extends X.Modal{constructor(e,t,n,r){super(e);this.resolved=!1;this.notePath=t,this.docId=n,this.onResolve=r}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Delete note and cached data?"}),e.createEl("p",{text:`This will delete the note and cached chunks/items for doc_id ${this.docId}.`}),e.createEl("p",{text:`Note: ${this.notePath}`});let t=e.createDiv();t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-gap-0-5rem"),t.addClass("zrr-u-margin-top-0-75rem");let n=t.createEl("button",{text:"Cancel"}),r=t.createEl("button",{text:"Delete"});n.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),r.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},at=class extends X.Modal{constructor(e,t,n){super(e);this.resolved=!1;this.reason=t,this.onResolve=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Rebuild redis index?"}),e.createEl("p",{text:this.reason}),e.createEl("p",{text:"This will drop the redissearch index (and embeddings) and rebuild it from cached chunks."});let t=e.createDiv();t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-gap-0-5rem"),t.addClass("zrr-u-margin-top-0-75rem");let n=t.createEl("button",{text:"Cancel"}),r=t.createEl("button",{text:"Drop & rebuild"});n.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),r.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},st=class extends X.Modal{constructor(e,t){super(e);this.resolved=!1;this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Purge redis orphaned chunks?"}),e.createEl("p",{text:"This removes redis chunk keys that have no cached item.json or chunk files on disk."}),e.createEl("p",{text:"Cache files are not deleted. Use this to clean up stale redis data."});let t=e.createDiv();t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-gap-0-5rem"),t.addClass("zrr-u-margin-top-0-75rem");let n=t.createEl("button",{text:"Cancel"}),r=t.createEl("button",{text:"Purge orphans"});n.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),r.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},ot=class extends X.Modal{constructor(e,t,n){super(e);this.resolved=!1;this.selects=new Map;this.conflicts=t,this.onResolve=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Resolve metadata conflicts"}),e.createEl("p",{text:"Choose which values to keep for each field."});let t=e.createDiv();t.addClass("zrr-u-display-grid"),t.addClass("zrr-u-gap-0-75rem");for(let l of this.conflicts){let c=t.createDiv();c.addClass("zrr-u-display-grid"),c.addClass("zrr-u-gap-0-4rem"),c.addClass("zrr-u-border-1px-solid-var-background-modifier-border"),c.addClass("zrr-u-border-radius-6px"),c.addClass("zrr-u-padding-0-6rem"),c.createDiv({text:l.fieldLabel,cls:"zrr-font-semibold"});let d=c.createDiv();d.addClass("zrr-u-display-grid"),d.addClass("zrr-u-grid-template-columns-1fr-1fr"),d.addClass("zrr-u-gap-0-5rem");let p=d.createEl("textarea",{attr:{readonly:"true",rows:"3"}});p.addClass("zrr-u-width-100"),p.value=l.noteValue||"(empty)";let _=d.createEl("textarea",{attr:{readonly:"true",rows:"3"}});_.addClass("zrr-u-width-100"),_.value=l.zoteroValue||"(empty)";let g=c.createDiv();g.addClass("zrr-u-display-flex"),g.addClass("zrr-u-gap-0-5rem"),g.addClass("zrr-u-align-items-center"),g.createSpan({text:"Decision:"});let f=g.createEl("select");f.add(new Option(l.noteLabel,"note")),f.add(new Option(l.zoteroLabel,"zotero")),f.add(new Option("Skip","skip")),f.value="skip",this.selects.set(l.field,f)}let n=e.createDiv();n.addClass("zrr-u-display-flex"),n.addClass("zrr-u-flex-wrap-wrap"),n.addClass("zrr-u-gap-0-5rem"),n.addClass("zrr-u-margin-top-0-75rem");let r=l=>{for(let c of this.selects.values())c.value=l},i=n.createEl("button",{text:"Use note for all"}),a=n.createEl("button",{text:"Use Zotero for all"}),s=n.createEl("button",{text:"Skip all"}),o=n.createEl("button",{text:"Apply"});i.addEventListener("click",()=>r("note")),a.addEventListener("click",()=>r("zotero")),s.addEventListener("click",()=>r("skip")),o.addEventListener("click",()=>{let l={};for(let[c,d]of this.selects.entries())l[c]=d.value||"skip";this.resolved=!0,this.close(),this.onResolve(l)})}onClose(){if(!this.resolved){let e={};for(let[t,n]of this.selects.entries())e[t]=n.value||"skip";this.onResolve(e)}}},lt=class extends X.Modal{constructor(e,t,n){super(e);this.resolved=!1;this.selects=new Map;this.conflicts=t,this.onResolve=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Resolve annotation conflicts"}),e.createEl("p",{text:"Choose which version to keep for each annotation."});let t=e.createDiv();t.addClass("zrr-u-display-grid"),t.addClass("zrr-u-gap-0-75rem");for(let l of this.conflicts){let c=t.createDiv();c.addClass("zrr-u-display-grid"),c.addClass("zrr-u-gap-0-4rem"),c.addClass("zrr-u-border-1px-solid-var-background-modifier-border"),c.addClass("zrr-u-border-radius-6px"),c.addClass("zrr-u-padding-0-6rem"),c.createDiv({text:l.title,cls:"zrr-font-semibold"});let d=c.createDiv();d.addClass("zrr-u-display-grid"),d.addClass("zrr-u-grid-template-columns-1fr-1fr"),d.addClass("zrr-u-gap-0-5rem");let p=d.createEl("textarea",{attr:{readonly:"true",rows:"4"}});p.addClass("zrr-u-width-100"),p.value=l.noteValue||"(empty)";let _=d.createEl("textarea",{attr:{readonly:"true",rows:"4"}});_.addClass("zrr-u-width-100"),_.value=l.zoteroValue||"(empty)";let g=c.createDiv();g.addClass("zrr-u-display-flex"),g.addClass("zrr-u-gap-0-5rem"),g.addClass("zrr-u-align-items-center"),g.createSpan({text:"Decision:"});let f=g.createEl("select");f.add(new Option("Use note","note")),f.add(new Option("Use Zotero","zotero")),f.add(new Option("Skip","skip")),f.value="skip",this.selects.set(l.key,f)}let n=e.createDiv();n.addClass("zrr-u-display-flex"),n.addClass("zrr-u-flex-wrap-wrap"),n.addClass("zrr-u-gap-0-5rem"),n.addClass("zrr-u-margin-top-0-75rem");let r=l=>{for(let c of this.selects.values())c.value=l},i=n.createEl("button",{text:"Use note for all"}),a=n.createEl("button",{text:"Use Zotero for all"}),s=n.createEl("button",{text:"Skip all"}),o=n.createEl("button",{text:"Apply"});i.addEventListener("click",()=>r("note")),a.addEventListener("click",()=>r("zotero")),s.addEventListener("click",()=>r("skip")),o.addEventListener("click",()=>{let l={};for(let[c,d]of this.selects.entries())l[c]=d.value||"skip";this.resolved=!0,this.close(),this.onResolve(l)})}onClose(){if(!this.resolved){let e={};for(let[t,n]of this.selects.entries())e[t]=n.value||"skip";this.onResolve(e)}}},ct=class extends X.SuggestModal{constructor(e,t){super(e);this.resolved=!1;this.resolveSelection=t,this.setPlaceholder("Select a language for ocr/quality...")}getSuggestions(e){let t=e.trim().toLowerCase();return t?tn.filter(n=>n.label.toLowerCase().includes(t)||n.value.toLowerCase().includes(t)):tn}renderSuggestion(e,t){t.setText(e.label),t.addEventListener("click",()=>this.handleSelection(e))}onChooseSuggestion(e){this.handleSelection(e)}onClose(){this.resolved||this.resolveSelection(null)}handleSelection(e){if(!this.resolved){if(this.resolved=!0,e.value==="__custom__"){this.close(),new Fe(this.app,"Custom language hint","e.g., en, de, fr, de,en",t=>this.resolveSelection(t.trim()),"Language hint cannot be empty.").open();return}this.resolveSelection(e.value),this.close()}}},dt=class extends X.SuggestModal{constructor(e,t,n,r){var i,a;super(e);this.includeOnlyIndexed=!1;this.lastError=null;this.indexedDocIds=null;this.querySequence=0;this.queryDebounceMs=200;this.minQueryLength=2;this.maxQueryCacheEntries=100;this.queryCache=new Map;this.plugin=t,this.resolveSelection=n,this.initialQuery=(a=(i=r==null?void 0:r.initialQuery)==null?void 0:i.trim())!=null?a:"",this.includeOnlyIndexed=(r==null?void 0:r.includeOnlyIndexed)===!0,typeof(r==null?void 0:r.minQueryLength)=="number"&&(this.minQueryLength=Math.max(1,Math.floor(r.minQueryLength))),this.setPlaceholder((r==null?void 0:r.placeholder)||"Search Zotero items...")}onOpen(){var t;if(super.onOpen(),!this.initialQuery)return;let e=this;e.inputEl&&(e.inputEl.value=this.initialQuery,(t=e.onInputChanged)==null||t.call(e))}async getSuggestions(e){let t=e.trim();if(t.length>0&&t.length<this.minQueryLength)return[];let n=t.toLowerCase(),r=this.queryCache.get(n);if(r)return r;let i=++this.querySequence;try{if(await new Promise(o=>{activeWindow.setTimeout(o,this.queryDebounceMs)}),i!==this.querySequence)return[];if(!this.indexedDocIds){let o=await this.plugin.getDocIndex();this.indexedDocIds=new Set(Object.keys(o))}let a=await this.plugin.searchZoteroItems(t);if(i!==this.querySequence)return[];let s=this.includeOnlyIndexed?a.filter(o=>{var c;let l=Re(o);return!!(l&&((c=this.indexedDocIds)!=null&&c.has(l)))}):a;if(this.queryCache.set(n,s),this.queryCache.size>this.maxQueryCacheEntries){let o=this.queryCache.keys().next().value;o!==void 0&&this.queryCache.delete(o)}return s}catch(a){let s=a instanceof Error?a.message:String(a);return this.lastError!==s&&(this.lastError=s,new X.Notice(s)),console.error("Zotero search failed",a),[]}}renderSuggestion(e,t){var k,m,x,w;let n=(k=e.data)==null?void 0:k.title,r=typeof n=="string"&&n.trim()?n:"[No title]",i=Jt(e),a=Re(e),s=a?(m=this.indexedDocIds)==null?void 0:m.has(a):!1,o=en(e),l=typeof((x=e.data)==null?void 0:x.itemType)=="string"?e.data.itemType.trim():"";s&&t.addClass("zrr-indexed-item"),o==="no"&&t.addClass("zrr-no-pdf-item");let c=t.createDiv({cls:"zrr-zotero-suggest-row"}),d=c.createSpan({cls:"zrr-zotero-item-icon"}),p=(w=Fn[l])!=null?w:"file-text";(0,X.setIcon)(d,p);let _=c.createDiv({cls:"zrr-zotero-suggest-text"});_.createDiv({text:r,cls:"zrr-zotero-suggest-title"});let g=_.createEl("small",{cls:"zrr-zotero-suggest-meta"}),f=!1,b=()=>{f&&g.createSpan({text:" - "})};i&&(g.createSpan({text:i}),f=!0),s&&(b(),g.createSpan({text:"Indexed",cls:"zrr-indexed-flag"}),f=!0),o==="no"&&(b(),g.createSpan({text:"No PDF attachment",cls:"zrr-no-pdf-flag"}),f=!0),t.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,t){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}};var sn={"docling_extract.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.10.1
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
import tempfile
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


def get_hunspell_bundle_dir() -> str:
    return os.path.join(os.path.dirname(__file__), "hunspell")


def get_hunspell_cache_dir() -> str:
    return os.path.join(tempfile.gettempdir(), "zrr-hunspell")


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
    llm_cleanup_max_total_sec: int = 120
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


DOCLING_CONFIG_FILE_EXCLUDED_FIELDS: Set[str] = {
    # Internal/callable/runtime-only fields.
    "dictionary_words",
    "llm_correct",
    # Controlled by the plugin GUI / CLI args rather than docling_config.json.
    "enable_llm_correction",
    "fallback_ocr_engine",
    "force_ocr_on_low_quality_text",
    "force_per_page_ocr",
    "llm_cleanup_api_key",
    "llm_cleanup_base_url",
    "llm_cleanup_model",
    "llm_cleanup_temperature",
    "llm_correction_max_chars",
    "llm_correction_min_quality",
    "ocr_mode",
    "paddle_structure_api_disable",
    "paddle_structure_api_token",
    "paddle_structure_api_url",
    "paddle_use_paddlex_layout",
    "paddle_use_structure_v3",
    "paddle_use_vl",
    "paddle_vl_api_disable",
    "paddle_vl_api_token",
    "paddle_vl_api_url",
    "prefer_ocr_engine",
    "quality_confidence_threshold",
}


def filter_docling_config_overrides(values: Dict[str, Any]) -> Dict[str, Any]:
    return {
        key: value
        for key, value in values.items()
        if key not in DOCLING_CONFIG_FILE_EXCLUDED_FIELDS
    }


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


def is_born_digital_text_layer(
    has_text_layer: bool,
    quality: TextQuality,
    ocr_used: bool,
    config: DoclingProcessingConfig,
) -> bool:
    if not has_text_layer or ocr_used:
        return False
    effective_confidence = (
        quality.effective_confidence_proxy
        if quality.effective_confidence_proxy is not None
        else quality.confidence_proxy
    )
    lexicon_ratio = max(
        float(quality.dictionary_hit_ratio or 0.0),
        float(quality.spellchecker_hit_ratio or 0.0),
    )
    digital_ratio = float(quality.digital_page_ratio or 0.0)
    image_page_ratio = float(quality.image_page_ratio or 0.0)
    strong_text_layer = bool(
        effective_confidence >= max(float(config.quality_confidence_threshold), 0.75)
        and quality.alpha_ratio >= float(config.quality_alpha_ratio_threshold)
        and quality.suspicious_token_ratio <= float(config.quality_suspicious_token_threshold)
        and quality.avg_chars_per_page >= max(float(config.quality_min_avg_chars_per_page), 500.0)
        and lexicon_ratio >= 0.75
        and image_page_ratio < float(config.quality_image_page_ratio_threshold)
    )
    classifier_digital = (
        (quality.layer_classification or "").lower() == "digital"
        and digital_ratio >= max(float(config.quality_classifier_decision_ratio), 0.7)
    )
    return bool(classifier_digital or strong_text_layer)


def determine_postprocess_mode(
    config: DoclingProcessingConfig,
    *,
    layout_engine_active: bool,
    prefer_layout_markdown: bool,
    born_digital_text_layer: bool,
) -> str:
    if not config.enable_post_correction:
        return "none"
    if born_digital_text_layer:
        return "none"
    if layout_engine_active:
        return "light"
    if not prefer_layout_markdown:
        return "full"
    return "none"


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
        base_dirs = [get_hunspell_bundle_dir(), get_hunspell_cache_dir()]
        lang = (languages or "").lower()
        try_codes: List[str] = []
        if any(t in lang for t in ("de", "deu", "german", "deutsch")):
            try_codes += ["de_DE", "de_AT", "de_CH"]
        if any(t in lang for t in ("en", "eng", "english")):
            try_codes += ["en_US", "en_GB"]
        if not try_codes:
            try_codes = ["en_US"]
        # Exact matches first
        for base_dir in base_dirs:
            for code in try_codes:
                aff_path = os.path.join(base_dir, f"{code}.aff")
                dic_path = os.path.join(base_dir, f"{code}.dic")
                if os.path.isfile(aff_path) and os.path.isfile(dic_path):
                    pairs.append((aff_path, dic_path))
        if pairs:
            return pairs

        # Flexible matching: accept stems like de_DE_frami.* or en_US-large.* when both files share the same stem
        common_stems: List[Tuple[str, str]] = []
        for base_dir in base_dirs:
            try:
                names = os.listdir(base_dir)
            except Exception:
                names = []
            stems_with_aff = {n[:-4] for n in names if n.endswith(".aff")}
            stems_with_dic = {n[:-4] for n in names if n.endswith(".dic")}
            common_stems.extend((base_dir, stem) for stem in (stems_with_aff & stems_with_dic))

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
                [(base_dir, stem) for base_dir, stem in common_stems if stem_priority(stem, code) > 0],
                key=lambda item: stem_priority(item[1], code),
                reverse=True,
            )
            for base_dir, stem in candidates:
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
        out_dir = get_hunspell_cache_dir()
        try:
            os.makedirs(out_dir, exist_ok=True)
        except OSError as exc:
            LOGGER.warning(
                "Spellchecker: cannot create hunspell cache dir %s (%s); skipping dictionary download",
                out_dir,
                exc,
            )
            out_dir = ""
        aff_path = os.path.join(out_dir, f"{lang_code}.aff") if out_dir else ""
        dic_path = os.path.join(out_dir, f"{lang_code}.dic") if out_dir else ""
        def download(url, out_path):
            try:
                import urllib.request
                print(f"Downloading {url} -> {out_path}")
                urllib.request.urlretrieve(url, out_path)
                return True
            except Exception as exc:
                print(f"Failed to download {url}: {exc}")
                return False
        ok_aff = download(aff_url, aff_path) if aff_path else False
        ok_dic = download(dic_url, dic_path) if dic_path else False
        if ok_aff and ok_dic and out_dir:
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

        # Prefer .dic paths discovered via resolve_paths(); otherwise scan bundled/cache hunspell dirs
        dic_paths: List[str] = []
        for _aff, _dic in pairs:
            if os.path.isfile(_dic):
                dic_paths.append(_dic)
        if not dic_paths:
            candidates: List[str] = []
            for base_dir in [get_hunspell_bundle_dir(), get_hunspell_cache_dir()]:
                try:
                    candidates.extend(
                        os.path.join(base_dir, name) for name in os.listdir(base_dir) if name.endswith(".dic")
                    )
                except Exception:
                    continue
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


def escape_gender_stars(text: str) -> str:
    """
    Escape placeholder asterisks used in German gender forms so Markdown does not
    interpret them as emphasis.

    Examples:
    - Leser*in -> Leser\\\\*in
    - Pirat*innen -> Pirat\\\\*innen

    Keep this narrow on purpose: do not touch ordinary Markdown emphasis,
    bullets, multiplication, or arbitrary star-separated tokens.
    """
    if not text:
        return text

    pattern = re.compile(
        r"(?<!\\\\)\\b([A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]{2,})\\*(in(?:nen)?|r|n|m|s)\\b"
    )
    return pattern.sub(r"\\1\\\\*\\2", text)


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


def build_ocr_cleanup_system_prompt() -> str:
    return " ".join(
        [
            "You clean OCR text into Markdown.",
            "Correct OCR errors only when the intended text is clear.",
            "Do not add, remove, or invent content.",
            "Preserve wording, punctuation, and special characters.",
            "Return only the corrected text.",
            "Reformat existing footnote references as [^n].",
            "Reformat existing footnote definitions as [^n]: ....",
            "Do not create new footnotes; only reformat footnotes that already exist.",
            "If paragraph breaks are completely missing, insert them only where the sentence structure clearly supports them."
        ]
    )


def build_llm_cleanup_callback(config: DoclingProcessingConfig) -> Optional[Callable[[str], str]]:
    if not config.enable_llm_correction:
        return None
    if not config.llm_cleanup_base_url or not config.llm_cleanup_model:
        LOGGER.warning("LLM cleanup enabled but base URL or model is missing.")
        return None

    base_url = config.llm_cleanup_base_url.rstrip("/")
    endpoint = f"{base_url}/chat/completions"
    api_key = (config.llm_cleanup_api_key or "").strip()
    cleanup_budget_sec = max(0, int(config.llm_cleanup_max_total_sec or 0))
    cleanup_elapsed_sec = 0.0
    cleanup_disabled = False

    def _requires_default_temperature(model_name: str) -> bool:
        name = (model_name or "").lower()
        return "gpt-5" in name or name.startswith("gpt5")

    def _disable_cleanup(reason: str) -> None:
        nonlocal cleanup_disabled
        if cleanup_disabled:
            return
        cleanup_disabled = True
        LOGGER.warning("Disabling LLM cleanup for remaining chunks: %s", reason)

    def _call(text: str) -> str:
        nonlocal cleanup_elapsed_sec
        if cleanup_disabled:
            return text
        remaining_budget = None
        if cleanup_budget_sec > 0:
            remaining_budget = cleanup_budget_sec - cleanup_elapsed_sec
            if remaining_budget <= 0:
                _disable_cleanup(
                    f"cleanup budget exhausted ({cleanup_elapsed_sec:.1f}s/{cleanup_budget_sec}s)"
                )
                return text
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
                    "content": build_ocr_cleanup_system_prompt(),
                },
                {"role": "user", "content": text},
            ],
        }
        if not _requires_default_temperature(config.llm_cleanup_model) or config.llm_cleanup_temperature == 1.0:
            payload["temperature"] = config.llm_cleanup_temperature
        effective_timeout = max(1, int(config.llm_cleanup_timeout_sec or 1))
        if remaining_budget is not None:
            effective_timeout = min(effective_timeout, max(1, int(math.ceil(remaining_budget))))
        started_at = time.perf_counter()
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=effective_timeout)
            response.raise_for_status()
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content")
            if content:
                return str(content).strip()
        except requests.exceptions.Timeout as exc:
            LOGGER.warning("LLM cleanup failed: %s", exc)
            _disable_cleanup(f"request timed out after {effective_timeout}s")
        except Exception as exc:
            LOGGER.warning("LLM cleanup failed: %s", exc)
        finally:
            cleanup_elapsed_sec += time.perf_counter() - started_at
            if cleanup_budget_sec > 0 and cleanup_elapsed_sec >= cleanup_budget_sec:
                _disable_cleanup(
                    f"cleanup budget exhausted ({cleanup_elapsed_sec:.1f}s/{cleanup_budget_sec}s)"
                )
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
    cleaned = escape_gender_stars(cleaned)
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
    cleaned = escape_gender_stars(cleaned)
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
        api_url = getattr(config, "paddle_vl_api_url", None)
        api_token = getattr(config, "paddle_vl_api_token", None)
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
    born_digital_text_layer = is_born_digital_text_layer(has_text_layer, quality, False, config)
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
        "born_digital_text_layer": born_digital_text_layer,
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
    born_digital_text_layer = is_born_digital_text_layer(has_text_layer, quality, decision.ocr_used, config)
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
    LOGGER.info("Born-digital text layer: %s", born_digital_text_layer)
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
        "born_digital_text_layer": born_digital_text_layer,
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
    parser.add_argument("--no-llm-cleanup", action="store_true", help="Disable LLM cleanup even if config file enables it")
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
        out_dir = get_hunspell_cache_dir()
        try:
            os.makedirs(out_dir, exist_ok=True)
        except OSError as exc:
            print(f"Failed to create Hunspell output directory {out_dir}: {exc}")
            return 1
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
                filtered = filter_docling_config_overrides(data)
                removed = sorted(set(data.keys()) - set(filtered.keys()))
                if removed:
                    try:
                        with open(path, "w", encoding="utf-8") as fh:
                            json.dump(filtered, fh, indent=2)
                            fh.write("\\n")
                        LOGGER.info(
                            "Removed %d GUI/runtime-managed config key(s) from %s: %s",
                            len(removed),
                            path,
                            ", ".join(removed),
                        )
                    except Exception as write_exc:
                        LOGGER.warning("Failed to rewrite filtered config file %s: %s", path, write_exc)
                return filtered
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
            default_payload = filter_docling_config_overrides(asdict(default_cfg))
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(default_payload, fh, indent=2)
                fh.write("\\n")
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
    paddle_layout_md_out = args.paddle_layout_md_out
    if paddle_layout_md_out:
        config.paddle_layout_markdown_out = paddle_layout_md_out
    if args.paddle_layout_recognize_boxes is not None:
        config.paddle_layout_recognize_boxes = args.paddle_layout_recognize_boxes
    if args.paddle_layout_nms is not None:
        config.paddle_layout_nms = args.paddle_layout_nms
    if args.paddle_layout_fail_on_zero:
        config.paddle_layout_fail_on_zero = True
    paddle_save_crops = args.paddle_layout_save_crops
    if paddle_save_crops:
        config.paddle_layout_save_crops = paddle_save_crops
    if args.paddle_dump:
        config.paddle_dump = True
    if args.max_chunk_chars is not None:
        config.max_chunk_chars = args.max_chunk_chars
    if args.chunk_overlap_chars is not None:
        config.chunk_overlap_chars = args.chunk_overlap_chars
    if args.enable_llm_cleanup:
        config.enable_llm_correction = True
    if args.no_llm_cleanup:
        config.enable_llm_correction = False
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
        born_digital_text_layer = bool(conversion.metadata.get("born_digital_text_layer"))
        postprocess_mode = determine_postprocess_mode(
            config,
            layout_engine_active=layout_engine_active,
            prefer_layout_markdown=prefer_layout_markdown,
            born_digital_text_layer=born_digital_text_layer,
        )
        if config.enable_post_correction and postprocess_mode == "none":
            if born_digital_text_layer:
                LOGGER.info("Skipping OCR post-processing for born-digital text layer.")
            else:
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
# zotero-redisearch-rag tool version: 0.10.1
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
    structure_api_url = getattr(config, "paddle_structure_api_url", None)
    structure_api_token = getattr(config, "paddle_structure_api_token", None)
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

    api_url = getattr(config, "paddle_vl_api_url", None)
    api_token = getattr(config, "paddle_vl_api_token", None)
    api_timeout = getattr(config, "paddle_vl_api_timeout_sec", 120)
    source_path = helpers.get("ocr_source_path")

    api_disabled = bool(getattr(config, "paddle_vl_api_disable", False))
    if api_url and api_token and not api_disabled:
        api_max_pages = int(getattr(config, "paddle_vl_api_max_pages", 100) or 100)
        if api_max_pages <= 0:
            api_max_pages = 100
        api_max_chunk_bytes = int(getattr(config, "paddle_vl_api_max_chunk_bytes", 0) or 0)
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
# zotero-redisearch-rag tool version: 0.10.1
from __future__ import annotations

import logging
import os
import shutil
import time
from typing import Any, Dict, List, Optional, Sequence, Set, Tuple

LOGGER = logging.getLogger("docling_extract")
TESSERACT_LOGGED_ONCE = False


def find_tesseract_path() -> Optional[str]:
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
        raise RuntimeError("Tesseract not found on PATH or common install locations.")

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
# zotero-redisearch-rag tool version: 0.10.1
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
        "is_annotation",
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
        "annotation_page_label",
        "TEXT",
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
        ("is_annotation", ["TAG"]),
        ("attachment_key", ["TAG"]),
        ("title", ["TEXT"]),
        ("authors", ["TAG", "SEPARATOR", "|"]),
        ("tags", ["TAG", "SEPARATOR", "|"]),
        ("chunk_tags", ["TAG", "SEPARATOR", "|"]),
        ("year", ["NUMERIC"]),
        ("item_type", ["TAG", "SEPARATOR", "|"]),
        ("annotation_page_label", ["TEXT"]),
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
                "is_annotation": "1" if bool(chunk.get("is_annotation") or chunk.get("annotation")) else "0",
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
                "annotation_page_label": str(chunk.get("annotation_page_label", "")),
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
# zotero-redisearch-rag tool version: 0.10.1
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
# zotero-redisearch-rag tool version: 0.10.1
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
# zotero-redisearch-rag tool version: 0.10.1

import argparse
import json
import math
from utils_embedding import normalize_vector, vector_to_bytes, request_embedding
import re
import struct
import sys
import threading
import time
from typing import Any, Callable, Dict, List, Optional, Sequence, Set, Tuple
from urllib.parse import urlparse, urlunparse

import redis
import requests

_LM_STUDIO_APPROX_CHARS_PER_TOKEN = 3
_LM_STUDIO_CONTEXT_OVERHEAD_TOKENS = 128
_LM_STUDIO_MIN_OUTPUT_TOKENS = 256
_LM_STUDIO_MAX_OUTPUT_TOKENS = 2048


def eprint(message: str) -> None:
    sys.stderr.write(message + "\\n")


class AbortRequested(RuntimeError):
    pass


def is_temperature_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "temperature" in lowered and (
        "not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered
    )


def is_stream_unsupported(message: str) -> bool:
    lowered = message.lower()
    return "stream" in lowered and ("not supported" in lowered or "unsupported" in lowered or "unknown parameter" in lowered)


def is_responses_endpoint_unsupported(message: str) -> bool:
    lowered = message.lower()
    return (
        "404" in lowered
        or "not found" in lowered
        or "unknown endpoint" in lowered
        or "responses response missing content" in lowered
    )


def is_lm_studio_provider(base_url: str) -> bool:
    try:
        parsed = urlparse((base_url or "").strip())
    except Exception:
        return False
    host = (parsed.hostname or "").lower()
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    return host in {"127.0.0.1", "localhost"} and port == 1234


def build_lm_studio_models_url(base_url: str) -> Optional[str]:
    try:
        parsed = urlparse((base_url or "").strip())
    except Exception:
        return None
    path = re.sub(r"/+$", "", parsed.path or "")
    base_path = path[:-3] if path.endswith("/v1") else path
    model_path = re.sub(r"/{2,}", "/", f"{base_path}/api/v1/models")
    return urlunparse((parsed.scheme, parsed.netloc, model_path, "", "", ""))


def estimate_text_tokens(text: str) -> int:
    if not text:
        return 0
    return max(1, math.ceil(len(text) / _LM_STUDIO_APPROX_CHARS_PER_TOKEN))


def trim_text_to_token_budget(text: str, max_tokens: int) -> str:
    safe_tokens = max(0, int(max_tokens))
    if safe_tokens <= 0 or not text:
        return ""
    max_chars = safe_tokens * _LM_STUDIO_APPROX_CHARS_PER_TOKEN
    if len(text) <= max_chars:
        return text
    trimmed = text[:max_chars]
    paragraph_break = trimmed.rfind("\\n\\n")
    line_break = trimmed.rfind("\\n")
    sentence_break = max(trimmed.rfind(". "), trimmed.rfind("? "), trimmed.rfind("! "))
    breakpoint = max(paragraph_break, line_break, sentence_break)
    if breakpoint >= int(max_chars * 0.7):
        trimmed = trimmed[:breakpoint].rstrip()
    else:
        trimmed = trimmed.rstrip()
    return trimmed


def get_lm_studio_context_budget(base_url: str, api_key: str, model: str, prompt_hint: str = "") -> Optional[Dict[str, int]]:
    if not is_lm_studio_provider(base_url):
        return None
    url = build_lm_studio_models_url(base_url)
    if not url:
        return None
    headers: Dict[str, str] = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.encoding = "utf-8"
        if response.status_code >= 400:
            return None
        data = response.json()
    except Exception:
        return None
    if not isinstance(data, dict):
        return None
    models = data.get("models")
    if not isinstance(models, list):
        return None
    for candidate in models:
        if not isinstance(candidate, dict):
            continue
        if str(candidate.get("key", "") or "").strip() != model:
            continue
        loaded_instances = candidate.get("loaded_instances")
        context_length = 0
        if isinstance(loaded_instances, list):
            for instance in loaded_instances:
                if not isinstance(instance, dict):
                    continue
                loaded_id = str(instance.get("id", "") or "").strip()
                if loaded_id and loaded_id != model:
                    continue
                config = instance.get("config")
                if isinstance(config, dict):
                    value = config.get("context_length")
                    if isinstance(value, (int, float)) and value > 0:
                        context_length = int(value)
                        break
        max_context_value = candidate.get("max_context_length")
        max_context_length = int(max_context_value) if isinstance(max_context_value, (int, float)) and max_context_value > 0 else 0
        if context_length <= 0:
            context_length = max_context_length
        if context_length <= 0:
            return None
        prompt_hint_tokens = estimate_text_tokens(prompt_hint)
        desired_output_tokens = max(
            _LM_STUDIO_MIN_OUTPUT_TOKENS,
            min(
                _LM_STUDIO_MAX_OUTPUT_TOKENS,
                max(math.ceil(prompt_hint_tokens * 0.5), math.floor(context_length * 0.2)),
            ),
        )
        max_output_tokens = max(64, min(desired_output_tokens, max(64, context_length - 256)))
        return {
            "context_length": context_length,
            "max_context_length": max_context_length,
            "max_output_tokens": int(max_output_tokens),
        }
    return None


def extract_text_segments(value: Any) -> List[str]:
    segments: List[str] = []
    if isinstance(value, str):
        if value:
            segments.append(value)
        return segments
    if isinstance(value, list):
        for item in value:
            segments.extend(extract_text_segments(item))
        return segments
    if not isinstance(value, dict):
        return segments

    item_type = str(value.get("type", "") or "").strip().lower()
    if item_type in {"reasoning", "reasoning_content", "thinking"}:
        return segments

    for key in ("text", "output_text", "content", "value"):
        nested = value.get(key)
        if isinstance(nested, str) and nested:
            segments.append(nested)
        elif isinstance(nested, (list, dict)):
            segments.extend(extract_text_segments(nested))
    return segments


def extract_text_from_chat_payload(data: Dict[str, Any], preserve_whitespace: bool = False) -> str:
    parts: List[str] = []
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0] if isinstance(choices[0], dict) else {}
        message = first.get("message") if isinstance(first.get("message"), dict) else {}
        parts.extend(extract_text_segments(message.get("content")))
        parts.extend(extract_text_segments(first.get("text")))
    parts.extend(extract_text_segments(data.get("output_text")))
    content = "".join(parts)
    return content if preserve_whitespace else content.strip()


def extract_text_from_responses_payload(data: Dict[str, Any], preserve_whitespace: bool = False) -> str:
    parts: List[str] = []
    parts.extend(extract_text_segments(data.get("output_text")))
    output = data.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, dict):
                continue
            item_type = str(item.get("type", "") or "").strip().lower()
            if item_type == "message":
                parts.extend(extract_text_segments(item.get("content")))
                continue
            parts.extend(extract_text_segments(item))
    response = data.get("response")
    if isinstance(response, dict):
        parts.extend(extract_text_segments(response.get("output_text")))
        nested_output = response.get("output")
        if isinstance(nested_output, list):
            for item in nested_output:
                if isinstance(item, dict):
                    parts.extend(extract_text_segments(item))
    content = "".join(parts)
    return content if preserve_whitespace else content.strip()


def extract_error_message(payload: Any) -> str:
    if isinstance(payload, dict):
        error = payload.get("error")
        if isinstance(error, dict):
            message = error.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()
            return json.dumps(error, ensure_ascii=False)
        if payload.get("type") == "error":
            message = payload.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()
    return ""


def request_responses(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    max_output_tokens: Optional[int] = None,
    timing: Optional[Dict[str, Any]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
) -> str:
    started_at = time.perf_counter()
    if should_abort is not None and should_abort():
        raise AbortRequested("Request aborted before non-stream responses request.")
    url = base_url.rstrip("/") + "/responses"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "instructions": system_prompt,
        "input": user_prompt,
    }
    if max_output_tokens is not None and max_output_tokens > 0:
        base_payload["max_output_tokens"] = int(max_output_tokens)
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response_open_ms = int((time.perf_counter() - started_at) * 1000)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            if should_abort is not None and should_abort():
                raise AbortRequested("Request aborted before non-stream responses retry.")
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
            response_open_ms = int((time.perf_counter() - started_at) * 1000)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Responses request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Responses request failed: {response.status_code} {error_text}")

    data = response.json()
    error_message = extract_error_message(data)
    if error_message:
        raise RuntimeError(f"Responses request failed: {error_message}")
    content = extract_text_from_responses_payload(data if isinstance(data, dict) else {})
    if not content:
        raise RuntimeError("Responses response missing content")
    if timing is not None:
        timing["chat_mode"] = "responses_non_stream"
        timing["chat_response_open_ms"] = response_open_ms
        timing["chat_first_token_ms"] = response_open_ms
        timing["chat_total_ms"] = int((time.perf_counter() - started_at) * 1000)
        timing["chat_fallback_to_non_stream"] = bool(timing.get("chat_fallback_to_non_stream", False))
    return content


def request_responses_stream(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    on_delta,
    max_output_tokens: Optional[int] = None,
    timing: Optional[Dict[str, Any]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
) -> str:
    started_at = time.perf_counter()
    if should_abort is not None and should_abort():
        raise AbortRequested("Request aborted before stream responses request.")
    url = base_url.rstrip("/") + "/responses"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    base_payload = {
        "model": model,
        "instructions": system_prompt,
        "input": user_prompt,
        "stream": True,
    }
    if max_output_tokens is not None and max_output_tokens > 0:
        base_payload["max_output_tokens"] = int(max_output_tokens)
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120, stream=True)
    response_open_ms = int((time.perf_counter() - started_at) * 1000)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            if should_abort is not None and should_abort():
                raise AbortRequested("Request aborted before stream responses retry.")
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
            response_open_ms = int((time.perf_counter() - started_at) * 1000)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Responses request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Responses request failed: {response.status_code} {error_text}")

    content_parts: List[str] = []
    first_token_ms: Optional[int] = None
    current_event: Optional[str] = None
    current_data: List[str] = []
    completed_payload: Optional[Dict[str, Any]] = None
    stream_error_message: Optional[str] = None

    def flush_event() -> bool:
        nonlocal current_event, current_data, first_token_ms, completed_payload, stream_error_message
        if not current_event and not current_data:
            return False
        data_text = "\\n".join(current_data).strip()
        event_name = current_event or ""
        current_event = None
        current_data = []
        if not data_text:
          return False
        if data_text == "[DONE]":
            return True
        try:
            payload_data = json.loads(data_text)
        except Exception:
            return False
        if not isinstance(payload_data, dict):
            return False
        error_message = extract_error_message(payload_data)
        if error_message:
            stream_error_message = error_message
            return True
        if event_name == "response.output_text.delta":
            piece = payload_data.get("delta")
            if isinstance(piece, str) and piece:
                if first_token_ms is None:
                    first_token_ms = int((time.perf_counter() - started_at) * 1000)
                content_parts.append(piece)
                on_delta(piece)
            return False
        if event_name == "response.completed":
            completed_payload = payload_data
            return False
        if not content_parts:
            piece = extract_text_from_responses_payload(payload_data, preserve_whitespace=True)
            if piece:
                if first_token_ms is None:
                    first_token_ms = int((time.perf_counter() - started_at) * 1000)
                content_parts.append(piece)
                on_delta(piece)
        return False

    for raw_line in response.iter_lines(decode_unicode=True):
        if should_abort is not None and should_abort():
            raise AbortRequested("Request aborted while waiting for responses stream tokens.")
        if raw_line is None:
            continue
        line = raw_line.rstrip("\\r")
        if not line:
            if flush_event():
                break
            continue
        if line.startswith("event:"):
            current_event = line[6:].strip()
            continue
        if line.startswith("data:"):
            current_data.append(line[5:].strip())
            continue

    flush_event()
    if stream_error_message:
        raise RuntimeError(f"Responses request failed: {stream_error_message}")
    if not content_parts and completed_payload:
        completed_error = extract_error_message(completed_payload)
        if completed_error:
            raise RuntimeError(f"Responses request failed: {completed_error}")
        fallback = extract_text_from_responses_payload(completed_payload, preserve_whitespace=True)
        if fallback:
            content_parts.append(fallback)

    if timing is not None:
        timing["chat_mode"] = "responses_stream"
        timing["chat_response_open_ms"] = response_open_ms
        timing["chat_first_token_ms"] = first_token_ms
        timing["chat_total_ms"] = int((time.perf_counter() - started_at) * 1000)
        timing["chat_fallback_to_non_stream"] = False
    return "".join(content_parts)


def request_chat(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    max_output_tokens: Optional[int] = None,
    timing: Optional[Dict[str, Any]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
    endpoint_mode: str = "chat",
) -> str:
    if endpoint_mode == "responses":
        try:
            return request_responses(
                base_url,
                api_key,
                model,
                temperature,
                system_prompt,
                user_prompt,
                max_output_tokens=max_output_tokens,
                timing=timing,
                should_abort=should_abort,
            )
        except Exception as exc:
            if not is_responses_endpoint_unsupported(str(exc)):
                raise
    started_at = time.perf_counter()
    if should_abort is not None and should_abort():
        raise AbortRequested("Request aborted before non-stream chat request.")
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
    if max_output_tokens is not None and max_output_tokens > 0:
        base_payload["max_tokens"] = int(max_output_tokens)
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response_open_ms = int((time.perf_counter() - started_at) * 1000)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            if should_abort is not None and should_abort():
                raise AbortRequested("Request aborted before non-stream retry.")
            response = requests.post(url, json=base_payload, headers=headers, timeout=120)
            response_open_ms = int((time.perf_counter() - started_at) * 1000)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    data = response.json()
    error_message = extract_error_message(data)
    if error_message:
        raise RuntimeError(f"Chat request failed: {error_message}")
    choices = data.get("choices")
    if not choices:
        raise RuntimeError("Chat response missing choices")
    content = extract_text_from_chat_payload(data if isinstance(data, dict) else {})
    if not content:
        raise RuntimeError("Chat response missing content")
    if timing is not None:
        timing["chat_mode"] = "non_stream"
        timing["chat_response_open_ms"] = response_open_ms
        timing["chat_first_token_ms"] = response_open_ms
        timing["chat_total_ms"] = int((time.perf_counter() - started_at) * 1000)
        timing["chat_fallback_to_non_stream"] = bool(timing.get("chat_fallback_to_non_stream", False))
    return content


def request_chat_stream(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    system_prompt: str,
    user_prompt: str,
    on_delta,
    max_output_tokens: Optional[int] = None,
    timing: Optional[Dict[str, Any]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
    endpoint_mode: str = "chat",
) -> str:
    if endpoint_mode == "responses":
        try:
            return request_responses_stream(
                base_url,
                api_key,
                model,
                temperature,
                system_prompt,
                user_prompt,
                on_delta,
                max_output_tokens=max_output_tokens,
                timing=timing,
                should_abort=should_abort,
            )
        except Exception as exc:
            if not is_responses_endpoint_unsupported(str(exc)):
                raise
    started_at = time.perf_counter()
    if should_abort is not None and should_abort():
        raise AbortRequested("Request aborted before stream chat request.")
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
    if max_output_tokens is not None and max_output_tokens > 0:
        base_payload["max_tokens"] = int(max_output_tokens)
    payload = dict(base_payload)
    payload["temperature"] = temperature

    response = requests.post(url, json=payload, headers=headers, timeout=120, stream=True)
    response_open_ms = int((time.perf_counter() - started_at) * 1000)
    response.encoding = "utf-8"
    if response.status_code >= 400:
        error_text = response.text
        if is_temperature_unsupported(error_text):
            if should_abort is not None and should_abort():
                raise AbortRequested("Request aborted before stream retry.")
            response = requests.post(url, json=base_payload, headers=headers, timeout=120, stream=True)
            response_open_ms = int((time.perf_counter() - started_at) * 1000)
            response.encoding = "utf-8"
            if response.status_code >= 400:
                raise RuntimeError(f"Chat request failed: {response.status_code} {response.text}")
        else:
            raise RuntimeError(f"Chat request failed: {response.status_code} {error_text}")

    content_parts: List[str] = []
    first_token_ms: Optional[int] = None
    last_payload: Optional[Dict[str, Any]] = None
    for raw_line in response.iter_lines(decode_unicode=True):
        if should_abort is not None and should_abort():
            raise AbortRequested("Request aborted while waiting for stream tokens.")
        if not raw_line:
            continue
        line = raw_line.rstrip("\\r")
        if not line.startswith("data:"):
            continue
        data = line[5:]
        if data.startswith(" "):
            data = data[1:]
        if data == "[DONE]":
            break
        try:
            payload = json.loads(data)
        except Exception:
            continue
        if isinstance(payload, dict):
            last_payload = payload
            error_message = extract_error_message(payload)
            if error_message:
                raise RuntimeError(f"Chat request failed: {error_message}")
        choices = payload.get("choices") or []
        if not choices:
            continue
        delta = choices[0].get("delta") or {}
        piece = extract_text_from_chat_payload(
            {"choices": [{"message": {"content": delta.get("content")}}]},
            preserve_whitespace=True,
        )
        if not piece:
            piece = extract_text_segments(delta.get("content"))
            piece = "".join(piece)
        if not piece:
            piece = "".join(extract_text_segments(delta))
        if not piece:
            piece = "".join(extract_text_segments(choices[0].get("text")))
        if not piece:
            continue
        if first_token_ms is None:
            first_token_ms = int((time.perf_counter() - started_at) * 1000)
        content_parts.append(piece)
        on_delta(piece)

    if not content_parts and last_payload:
        last_error = extract_error_message(last_payload)
        if last_error:
            raise RuntimeError(f"Chat request failed: {last_error}")
        fallback = extract_text_from_chat_payload(last_payload)
        if fallback:
            content_parts.append(fallback)

    if timing is not None:
        timing["chat_mode"] = "stream"
        timing["chat_response_open_ms"] = response_open_ms
        timing["chat_first_token_ms"] = first_token_ms
        timing["chat_total_ms"] = int((time.perf_counter() - started_at) * 1000)
        timing["chat_fallback_to_non_stream"] = False
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


def parse_single_text_value(raw: str) -> str:
    if not raw:
        return ""
    text = raw.strip()
    try:
        data = json.loads(text)
    except Exception:
        data = None
    if isinstance(data, dict):
        for key in ("query", "rewritten_query", "rewrite", "text", "output"):
            value = data.get(key)
            if isinstance(value, str) and value.strip():
                text = value.strip()
                break
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, str) and item.strip():
                text = item.strip()
                break
    lines = [line.strip(" \`\\"'\\t") for line in text.splitlines() if line.strip()]
    if not lines:
        return ""
    return lines[0].strip(" \`\\"'")


def rewrite_follow_up_query(
    base_url: str,
    api_key: str,
    model: str,
    query: str,
    history_messages: List[Dict[str, Any]],
    should_abort: Optional[Callable[[], bool]] = None,
    endpoint_mode: str = "chat",
) -> str:
    if not base_url or not model or not query or not history_messages:
        return query
    history_block = format_history_block(history_messages)
    if not history_block:
        return query
    system_prompt = (
        "Rewrite the user's latest message into a standalone retrieval query. "
        "Resolve pronouns and omitted subjects using the chat history. "
        "Do not answer the question. Output only the rewritten query as a single line. "
        "If the latest message is already standalone, repeat it."
    )
    user_prompt = (
        f"Chat history:\\n{history_block}\\n\\n"
        f"Latest user message: {query}\\n\\n"
        "Standalone retrieval query:"
    )
    try:
        response = request_chat(
            base_url,
            api_key,
            model,
            0.0,
            system_prompt,
            user_prompt,
            should_abort=should_abort,
            endpoint_mode=endpoint_mode,
        )
    except Exception as exc:
        eprint(f"Follow-up rewrite failed: {exc}")
        return query
    rewritten = parse_single_text_value(response)
    if not rewritten:
        return query
    return rewritten


def expand_query(
    base_url: str,
    api_key: str,
    model: str,
    query: str,
    count: int,
    should_abort: Optional[Callable[[], bool]] = None,
    endpoint_mode: str = "chat",
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
        response = request_chat(
            base_url,
            api_key,
            model,
            0.0,
            system_prompt,
            user_prompt,
            should_abort=should_abort,
            endpoint_mode=endpoint_mode,
        )
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
    key = str(model_name or "").strip()
    if not key:
        return None
    cached = _RERANKER_CACHE.get(key, _RERANKER_NOT_SET)
    if cached is not _RERANKER_NOT_SET:
        return cached
    with _RERANKER_CACHE_LOCK:
        cached_locked = _RERANKER_CACHE.get(key, _RERANKER_NOT_SET)
        if cached_locked is not _RERANKER_NOT_SET:
            return cached_locked
        reranker = _load_reranker_uncached(key)
        _RERANKER_CACHE[key] = reranker
        return reranker


_RERANKER_NOT_SET = object()
_RERANKER_CACHE: Dict[str, Any] = {}
_RERANKER_CACHE_LOCK = threading.Lock()


def _load_reranker_uncached(model_name: str):
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
    filter_query: str = "*",
) -> List[Dict[str, Any]]:
    if filter_query and filter_query != "*":
        query = f"({filter_query})=>[KNN {k} @embedding $vec AS score]"
    else:
        query = f"*=>[KNN {k} @embedding $vec AS score]"
    raw = client.execute_command(
        "FT.SEARCH",
        index,
        query,
        "PARAMS",
        "2",
        "vec",
        vec,
        "SORTBY",
        "score",
        "RETURN",
        "13",
        "doc_id",
        "chunk_id",
        "is_annotation",
        "attachment_key",
        "source_pdf",
        "page_start",
        "page_end",
        "annotation_page_label",
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
_ANNOTATION_K_DEFAULT = 3
_AGENTIC_FULL_DOC_MAX_CHUNKS_DEFAULT = 48
_AGENTIC_FULL_DOC_MAX_CHARS_DEFAULT = 32000
_AGENTIC_DOC_SUMMARY_TOP_N = 6


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
    annotation_k: int = 0,
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
    if annotation_k > 0:
        annotations = retrieve_annotation_chunks(client, index, vec, annotation_k, keywords)
        ordered = merge_annotation_chunks(ordered, annotations, annotation_k)
    return ordered, metrics


def run_lexical_search(
    client: redis.Redis,
    index: str,
    keywords: List[str],
    limit: int,
    filter_query: str = "",
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
    if filter_query:
        query = f"({filter_query}) {query}"

    def run_search(query_text: str) -> Tuple[List[Dict[str, Any]], int]:
        raw = client.execute_command(
            "FT.SEARCH",
            index,
            query_text,
            "LIMIT",
            "0",
            str(limit),
            "RETURN",
            "13",
            "doc_id",
            "chunk_id",
            "is_annotation",
            "attachment_key",
            "source_pdf",
            "page_start",
            "page_end",
            "annotation_page_label",
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

def is_annotation_chunk(chunk: Dict[str, Any]) -> bool:
    value = chunk.get("is_annotation")
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    value = str(value).strip().lower()
    return value in ("1", "true", "yes", "y")

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


def retrieve_annotation_chunks(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
    keywords: List[str],
) -> List[Dict[str, Any]]:
    if k <= 0:
        return []
    try:
        vector_results = search_redis_knn(
            client,
            index,
            vec,
            max(1, k),
            filter_query="@is_annotation:{1}",
        )
    except Exception:
        vector_results = []
    lexical_results = run_lexical_search(
        client,
        index,
        keywords,
        max(k, 5),
        filter_query="@is_annotation:{1}",
    )
    combined = vector_results + lexical_results
    combined = dedupe_by_chunk_id(combined)
    return combined[:k]


def merge_annotation_chunks(
    results: List[Dict[str, Any]],
    annotations: List[Dict[str, Any]],
    k: int,
) -> List[Dict[str, Any]]:
    if not annotations or k <= 0:
        return results
    seen = {chunk_key(item) for item in results if chunk_key(item)}
    picked: List[Dict[str, Any]] = []
    for item in annotations:
        key = chunk_key(item)
        if not key or key in seen:
            continue
        picked.append(item)
        seen.add(key)
        if len(picked) >= k:
            break
    if not picked:
        return results
    return picked + results

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
    annotation_k: int = 0,
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
        annotation_k=annotation_k,
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
                annotation_k=annotation_k,
            )
        except Exception as exc:
            eprint(f"Fallback retrieval failed: {exc}")
    return retrieved, metrics


def sum_retrieved_chars(retrieved: Sequence[Dict[str, Any]]) -> int:
    return sum(len(str(chunk.get("text", "") or "")) for chunk in retrieved)


def escape_tag_value(value: str) -> str:
    text = str(value or "")
    return re.sub(r'([,\\.<>{}\\[\\]"\\'\\:;!@#$%^&*()\\-+=~\\\\/| ])', r'\\\\\\1', text)


def parse_json_object(raw: str) -> Dict[str, Any]:
    if not raw:
        return {}
    text = raw.strip()
    if text.startswith("\`\`\`"):
        text = re.sub(r"^\`\`\`[a-zA-Z0-9_-]*\\n", "", text)
        text = re.sub(r"\\n\`\`\`$", "", text)
        text = text.strip()
    try:
        payload = json.loads(text)
    except Exception:
        payload = None
    if isinstance(payload, dict):
        return payload
    match = re.search(r"\\{.*\\}", text, flags=re.DOTALL)
    if not match:
        return {}
    try:
        parsed = json.loads(match.group(0))
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def summarize_retrieved_docs(
    retrieved: Sequence[Dict[str, Any]],
    top_n: int = _AGENTIC_DOC_SUMMARY_TOP_N,
) -> List[Dict[str, Any]]:
    grouped: Dict[str, Dict[str, Any]] = {}
    for chunk in retrieved:
        doc_id = str(chunk.get("doc_id", "") or "").strip()
        if not doc_id:
            continue
        entry = grouped.get(doc_id)
        if not entry:
            entry = {
                "doc_id": doc_id,
                "source_pdf": str(chunk.get("source_pdf", "") or ""),
                "chunk_count": 0,
                "page_min": None,
                "page_max": None,
            }
            grouped[doc_id] = entry
        entry["chunk_count"] = int(entry["chunk_count"]) + 1
        page_start = chunk.get("page_start")
        page_end = chunk.get("page_end")
        try:
            p_start = int(page_start)
            entry["page_min"] = p_start if entry["page_min"] is None else min(int(entry["page_min"]), p_start)
        except Exception:
            pass
        try:
            p_end = int(page_end)
            entry["page_max"] = p_end if entry["page_max"] is None else max(int(entry["page_max"]), p_end)
        except Exception:
            pass

    docs = list(grouped.values())
    docs.sort(key=lambda item: (-int(item.get("chunk_count", 0)), str(item.get("doc_id", ""))))
    if top_n > 0:
        docs = docs[:top_n]
    return docs


def choose_top_doc_id(retrieved: Sequence[Dict[str, Any]]) -> str:
    docs = summarize_retrieved_docs(retrieved, top_n=1)
    if not docs:
        return ""
    return str(docs[0].get("doc_id", "") or "")


def dedupe_by_doc_and_chunk(items: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: Set[Tuple[str, str]] = set()
    deduped: List[Dict[str, Any]] = []
    for item in items:
        key = (str(item.get("doc_id", "") or ""), str(item.get("chunk_id", "") or ""))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped


def retrieval_signature(
    chunks: Sequence[Dict[str, Any]],
    limit: int = 24,
) -> Tuple[Tuple[str, str], ...]:
    rows: List[Tuple[str, str]] = []
    for chunk in chunks[:max(1, limit)]:
        rows.append((
            str(chunk.get("doc_id", "") or ""),
            str(chunk.get("chunk_id", "") or ""),
        ))
    return tuple(rows)


def trim_chunks_to_char_budget(
    chunks: Sequence[Dict[str, Any]],
    max_chars: int,
) -> List[Dict[str, Any]]:
    if max_chars <= 0:
        return list(chunks)
    kept: List[Dict[str, Any]] = []
    used = 0
    for chunk in chunks:
        text = str(chunk.get("text", "") or "")
        text_len = len(text)
        if kept and used + text_len > max_chars:
            break
        kept.append(chunk)
        used += text_len
    return kept


def retrieve_full_document_chunks(
    client: redis.Redis,
    index: str,
    doc_id: str,
    max_chunks: int,
) -> List[Dict[str, Any]]:
    clean_doc_id = str(doc_id or "").strip()
    if not clean_doc_id:
        return []
    query = f"@doc_id:{{{escape_tag_value(clean_doc_id)}}}"
    raw = client.execute_command(
        "FT.SEARCH",
        index,
        query,
        "SORTBY",
        "page_start",
        "ASC",
        "LIMIT",
        "0",
        str(max(1, max_chunks)),
        "RETURN",
        "12",
        "doc_id",
        "chunk_id",
        "is_annotation",
        "attachment_key",
        "source_pdf",
        "page_start",
        "page_end",
        "annotation_page_label",
        "section",
        "text",
        "tags",
        "chunk_tags",
        "DIALECT",
        "2",
    )
    chunks = parse_results(raw)
    return [chunk for chunk in chunks if str(chunk.get("text", "") or "").strip()]


def plan_agentic_action(
    base_url: str,
    api_key: str,
    model: str,
    query: str,
    retrieved: Sequence[Dict[str, Any]],
    step: int,
    max_steps: int,
) -> Dict[str, Any]:
    if not base_url or not model:
        return {"action": "answer_with_current_context", "reason": "planner_unavailable"}
    chars = sum_retrieved_chars(retrieved)
    docs = summarize_retrieved_docs(retrieved, top_n=_AGENTIC_DOC_SUMMARY_TOP_N)
    planner_input = {
        "query": query,
        "step": step,
        "max_steps": max_steps,
        "retrieved_chunk_count": len(retrieved),
        "retrieved_chars": chars,
        "candidate_docs": docs,
    }
    system_prompt = (
        "You are a retrieval planner for RAG. "
        "Choose exactly one action: answer_with_current_context, expand_retry, or full_document. "
        "Use full_document only when the user likely asks for whole-document synthesis/comparison "
        "or when retrieved context is clearly too sparse. "
        "Return only JSON object: "
        "{\\"action\\":\\"...\\",\\"doc_id\\":\\"optional\\",\\"reason\\":\\"short reason\\"}."
    )
    user_prompt = "Planner input JSON:\\n" + json.dumps(planner_input, ensure_ascii=False)
    try:
        raw = request_chat(base_url, api_key, model, 0.0, system_prompt, user_prompt)
    except Exception as exc:
        eprint(f"Agentic planner failed: {exc}")
        return {"action": "answer_with_current_context", "reason": "planner_error"}
    plan = parse_json_object(raw)
    action = str(plan.get("action", "")).strip().lower()
    if action not in {"answer_with_current_context", "expand_retry", "full_document"}:
        return {"action": "answer_with_current_context", "reason": "planner_invalid_action"}
    output = {"action": action, "reason": str(plan.get("reason", "") or "").strip()}
    doc_id = str(plan.get("doc_id", "") or "").strip()
    if doc_id:
        output["doc_id"] = doc_id
    return output

def build_context(retrieved: List[Dict[str, Any]]) -> str:
    blocks = []
    for chunk in retrieved:
        doc_id = chunk.get("doc_id", "")
        chunk_id = chunk.get("chunk_id", "")
        source_pdf = chunk.get("source_pdf", "")
        page_start = chunk.get("page_start", "")
        page_end = chunk.get("page_end", "")
        score = chunk.get("score", "")
        annotation_flag = "true" if is_annotation_chunk(chunk) else "false"
        text = chunk.get("text", "")
        pages = f"{page_start}-{page_end}"
        block = (
            f"<Document source='{source_pdf}' pages='{pages}' doc_id='{doc_id}' "
            f"chunk_id='{chunk_id}' score='{score}' annotation='{annotation_flag}'>\\n{text}\\n</Document>"
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
        annotation_page_label = chunk.get("annotation_page_label", "")
        source_pdf = chunk.get("source_pdf", "")
        key = (doc_id, attachment_key, page_start, page_end, source_pdf)
        if key in seen:
            continue
        seen.add(key)
        annotation_key = extract_annotation_key(str(chunk_id))
        pages = f"{page_start}-{page_end}"
        if annotation_page_label:
            pages = str(annotation_page_label)
        citations.append({
            "doc_id": doc_id,
            "chunk_id": chunk_id,
            "attachment_key": attachment_key,
            "annotation_key": annotation_key or None,
            "annotation_page_label": annotation_page_label or None,
            "page_start": page_start,
            "page_end": page_end,
            "pages": pages,
            "source_pdf": source_pdf,
        })
    return citations


def build_arg_parser() -> argparse.ArgumentParser:
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
    parser.add_argument("--chat-endpoint-mode", choices=["chat", "responses"], default="chat")
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--stream", action="store_true")
    parser.add_argument("--history-file", help="Optional JSON file with recent chat history")
    parser.add_argument("--rewrite-followups", action="store_true")
    parser.add_argument("--expand-query", action="store_true")
    parser.add_argument("--expand-count", type=int, default=3)
    parser.add_argument("--rerank", action="store_true")
    parser.add_argument("--rerank-model", default="BAAI/bge-reranker-v2-m3")
    parser.add_argument("--rerank-candidates", type=int, default=4)
    parser.add_argument("--rerank-max-chars", type=int, default=_RERANK_MAX_CHARS_DEFAULT)
    parser.add_argument("--rrf-k", type=int, default=_RRF_K)
    parser.add_argument("--rrf-log-top", type=int, default=0)
    parser.add_argument("--max-per-doc", type=int, default=0)
    parser.add_argument("--annotation-k", type=int, default=_ANNOTATION_K_DEFAULT)
    parser.add_argument("--agentic", choices=["off", "basic"], default="off")
    parser.add_argument("--agentic-max-iters", type=int, default=2)
    parser.add_argument("--agentic-full-doc-chunks", type=int, default=_AGENTIC_FULL_DOC_MAX_CHUNKS_DEFAULT)
    parser.add_argument("--agentic-full-doc-max-chars", type=int, default=_AGENTIC_FULL_DOC_MAX_CHARS_DEFAULT)
    return parser


def run_with_args(
    args: argparse.Namespace,
    emit_json: Optional[Callable[[Dict[str, Any]], None]] = None,
    should_abort: Optional[Callable[[], bool]] = None,
) -> int:
    run_started_at = time.perf_counter()
    phase_ms: Dict[str, int] = {}
    phase_counts: Dict[str, int] = {}
    chat_timing: Dict[str, Any] = {}

    def record_phase(name: str, started_at: float) -> None:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        phase_ms[name] = phase_ms.get(name, 0) + elapsed_ms
        phase_counts[name] = phase_counts.get(name, 0) + 1

    def check_abort(stage: str) -> None:
        if should_abort is not None and should_abort():
            raise AbortRequested(f"Request aborted at stage '{stage}'.")

    def emit_phase(name: str, status: str, **extra: Any) -> None:
        payload: Dict[str, Any] = {
            "type": "phase",
            "name": name,
            "status": status,
            "t_ms": int((time.perf_counter() - run_started_at) * 1000),
        }
        if extra:
            payload.update(extra)
        if emit_json is not None:
            emit_json(payload)

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)
    use_combo = bool(args.expand_query or args.rerank)
    expanded_queries: List[str] = []
    raw_query = args.query
    query_for_display = raw_query
    retrieval_query = raw_query
    query_rewritten = False
    index_dim_cache: Optional[int] = None
    rrf_k = max(1, int(args.rrf_k or _RRF_K))
    rrf_log_top = max(0, int(args.rrf_log_top or 0))
    max_per_doc = max(0, int(args.max_per_doc or 0))
    annotation_k = max(0, int(args.annotation_k or 0))
    base_k = max(1, int(args.k))
    if is_short_query(raw_query):
        base_k = max(base_k, 12)
    agentic_mode = str(args.agentic or "off").strip().lower()
    agentic_max_iters = max(1, int(args.agentic_max_iters or 1))
    agentic_full_doc_chunks = max(1, int(args.agentic_full_doc_chunks or _AGENTIC_FULL_DOC_MAX_CHUNKS_DEFAULT))
    agentic_full_doc_max_chars = max(0, int(args.agentic_full_doc_max_chars or _AGENTIC_FULL_DOC_MAX_CHARS_DEFAULT))
    strategy_trace: List[Dict[str, Any]] = []

    if args.history_file:
        check_abort("load_history")
        emit_phase("load_history", "start")
        phase_started_at = time.perf_counter()
        history_messages = load_history_messages(args.history_file)
        record_phase("load_history", phase_started_at)
        emit_phase("load_history", "done", messages=len(history_messages))
    else:
        history_messages = []

    if args.rewrite_followups and history_messages:
        check_abort("rewrite_followup")
        emit_phase("rewrite_followup", "start", query=raw_query)
        phase_started_at = time.perf_counter()
        rewritten_query = rewrite_follow_up_query(
            args.chat_base_url,
            args.chat_api_key,
            args.chat_model,
            raw_query,
            history_messages,
            should_abort=should_abort,
            endpoint_mode=args.chat_endpoint_mode,
        )
        record_phase("rewrite_followup", phase_started_at)
        if rewritten_query and rewritten_query.strip() and rewritten_query.strip().lower() != raw_query.strip().lower():
            retrieval_query = rewritten_query.strip()
            query_for_display = retrieval_query
            query_rewritten = True
        emit_phase("rewrite_followup", "done", rewritten=query_rewritten, retrieval_query=retrieval_query)

    def embed_query(query_text: str) -> bytes:
        nonlocal client, index_dim_cache
        phase_started_at = time.perf_counter()
        try:
            check_abort("embed_query")
            embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, query_text)
            embedding_dim = len(embedding)
            if index_dim_cache is None:
                index_dim_cache = get_index_vector_dim(client, args.index)
            if index_dim_cache and index_dim_cache != embedding_dim:
                raise RuntimeError(f"Embedding dim mismatch: index={index_dim_cache} model={embedding_dim}")
            embedding = normalize_vector(embedding)
            return vector_to_bytes(embedding)
        finally:
            record_phase("embed_query", phase_started_at)

    if use_combo:
        if args.expand_query:
            check_abort("expand_query")
            emit_phase("expand_query", "start", query=retrieval_query)
            phase_started_at = time.perf_counter()
            expanded_queries = expand_query(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                retrieval_query,
                max(1, int(args.expand_count or 0)),
                should_abort=should_abort,
                endpoint_mode=args.chat_endpoint_mode,
            )
            record_phase("expand_query", phase_started_at)
            emit_phase("expand_query", "done", count=len(expanded_queries))
        if expanded_queries:
            query_for_display = expanded_queries[0]
        candidate_multiplier = max(1, int(args.rerank_candidates or 1))
        candidate_k = max(base_k * candidate_multiplier, base_k)
        query_variants = [retrieval_query] + expanded_queries
        candidates_map: Dict[str, Dict[str, Any]] = {}
        try:
            emit_phase("retrieve_candidates", "start", variants=len(query_variants), k=candidate_k)
            for variant in query_variants:
                check_abort("retrieve_candidates")
                vec = embed_query(variant)
                keywords = extract_keywords(variant)
                phase_started_at = time.perf_counter()
                retrieved_variant, _ = retrieve_with_broadening(
                    client,
                    args.index,
                    vec,
                    candidate_k,
                    keywords,
                    rrf_k=rrf_k,
                    rrf_log_top=rrf_log_top,
                    max_per_doc=0,
                    annotation_k=0,
                )
                record_phase("retrieve_with_broadening", phase_started_at)
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
            emit_phase("retrieve_candidates", "done", unique_candidates=len(candidates_map))
        except Exception as exc:
            eprint(f"RedisSearch query failed: {exc}")
            return 2

        candidates = list(candidates_map.values())
        if args.rerank:
            rerank_query = query_for_display or retrieval_query
            check_abort("reranker_load")
            emit_phase("reranker_load", "start", model=args.rerank_model)
            phase_started_at = time.perf_counter()
            reranker = load_reranker(args.rerank_model)
            record_phase("reranker_load", phase_started_at)
            emit_phase("reranker_load", "done", loaded=reranker is not None)
            check_abort("rerank_score")
            emit_phase("rerank_score", "start", candidates=len(candidates))
            phase_started_at = time.perf_counter()
            reranked = rerank_candidates(
                reranker,
                rerank_query,
                candidates,
                max(200, int(args.rerank_max_chars or _RERANK_MAX_CHARS_DEFAULT)),
            )
            record_phase("rerank_score", phase_started_at)
            emit_phase("rerank_score", "done", reranked=len(reranked))
            retrieved = apply_doc_cap(reranked, max_per_doc)[:base_k]
        else:
            ordered = apply_tag_boosting(candidates, extract_keywords(retrieval_query))
            retrieved = apply_doc_cap(ordered, max_per_doc)[:base_k]
        if annotation_k > 0:
            try:
                check_abort("retrieve_annotations")
                emit_phase("retrieve_annotations", "start", k=annotation_k)
                vec = embed_query(retrieval_query)
                keywords = extract_keywords(retrieval_query)
                phase_started_at = time.perf_counter()
                annotations = retrieve_annotation_chunks(
                    client,
                    args.index,
                    vec,
                    annotation_k,
                    keywords,
                )
                record_phase("retrieve_annotations", phase_started_at)
                emit_phase("retrieve_annotations", "done", count=len(annotations))
                retrieved = merge_annotation_chunks(retrieved, annotations, annotation_k)
            except Exception as exc:
                eprint(f"Annotation retrieval failed: {exc}")
    else:
        check_abort("retrieve_primary")
        emit_phase("retrieve_primary", "start", k=base_k)
        try:
            vec = embed_query(retrieval_query)
        except Exception as exc:
            eprint(f"Failed to embed query: {exc}")
            return 2
        keywords = extract_keywords(retrieval_query)
        try:
            phase_started_at = time.perf_counter()
            retrieved, _ = retrieve_with_broadening(
                client,
                args.index,
                vec,
                base_k,
                keywords,
                rrf_k=rrf_k,
                rrf_log_top=rrf_log_top,
                max_per_doc=max_per_doc,
                annotation_k=0,
            )
            record_phase("retrieve_with_broadening", phase_started_at)
            emit_phase("retrieve_primary", "done", count=len(retrieved))
        except Exception as exc:
            eprint(f"RedisSearch query failed: {exc}")
            return 2
        if annotation_k > 0:
            try:
                check_abort("retrieve_annotations")
                emit_phase("retrieve_annotations", "start", k=annotation_k)
                phase_started_at = time.perf_counter()
                annotations = retrieve_annotation_chunks(
                    client,
                    args.index,
                    vec,
                    annotation_k,
                    keywords,
                )
                record_phase("retrieve_annotations", phase_started_at)
                emit_phase("retrieve_annotations", "done", count=len(annotations))
                retrieved = merge_annotation_chunks(retrieved, annotations, annotation_k)
            except Exception as exc:
                eprint(f"Annotation retrieval failed: {exc}")

    if agentic_mode == "basic":
        emit_phase("agentic", "start", max_iters=agentic_max_iters)
        for step in range(1, agentic_max_iters + 1):
            check_abort("agentic_plan")
            emit_phase("agentic_plan", "start", step=step)
            phase_started_at = time.perf_counter()
            plan = plan_agentic_action(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                raw_query,
                retrieved,
                step,
                agentic_max_iters,
            )
            record_phase("agentic_plan", phase_started_at)
            action = str(plan.get("action", "answer_with_current_context") or "answer_with_current_context")
            reason = str(plan.get("reason", "") or "")
            emit_phase("agentic_plan", "done", step=step, action=action, reason=reason)
            step_trace: Dict[str, Any] = {
                "step": step,
                "action": action,
                "reason": reason,
                "before_chunks": len(retrieved),
                "before_chars": sum_retrieved_chars(retrieved),
            }
            strategy_trace.append(step_trace)
            if action == "answer_with_current_context":
                break

            before_sig = retrieval_signature(retrieved)
            if action == "expand_retry":
                check_abort("agentic_expand_retry")
                emit_phase("agentic_expand_retry", "start", step=step)
                phase_started_at = time.perf_counter()
                retry_expanded = expand_query(
                    args.chat_base_url,
                    args.chat_api_key,
                    args.chat_model,
                    retrieval_query,
                    max(1, int(args.expand_count or 0)),
                    should_abort=should_abort,
                    endpoint_mode=args.chat_endpoint_mode,
                )
                record_phase("expand_query", phase_started_at)
                emit_phase("agentic_expand_retry", "done", step=step, expanded=len(retry_expanded))
                step_trace["expanded_queries"] = retry_expanded
                query_variants = [retrieval_query] + retry_expanded
                candidate_multiplier = max(2, int(args.rerank_candidates or 1))
                candidate_k = max(base_k * candidate_multiplier, base_k)
                candidates_map: Dict[str, Dict[str, Any]] = {}
                try:
                    emit_phase("agentic_retrieve", "start", step=step, variants=len(query_variants), k=candidate_k)
                    for variant in query_variants:
                        check_abort("agentic_retrieve")
                        vec = embed_query(variant)
                        keywords = extract_keywords(variant)
                        phase_started_at = time.perf_counter()
                        retrieved_variant, _ = retrieve_with_broadening(
                            client,
                            args.index,
                            vec,
                            candidate_k,
                            keywords,
                            rrf_k=rrf_k,
                            rrf_log_top=rrf_log_top,
                            max_per_doc=0,
                            annotation_k=0,
                        )
                        record_phase("retrieve_with_broadening", phase_started_at)
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
                    emit_phase("agentic_retrieve", "done", step=step, unique_candidates=len(candidates_map))
                except Exception as exc:
                    step_trace["status"] = "error"
                    step_trace["error"] = str(exc)
                    break

                candidates = list(candidates_map.values())
                if args.rerank:
                    check_abort("agentic_reranker_load")
                    emit_phase("agentic_reranker_load", "start", step=step, model=args.rerank_model)
                    phase_started_at = time.perf_counter()
                    reranker = load_reranker(args.rerank_model)
                    record_phase("reranker_load", phase_started_at)
                    emit_phase("agentic_reranker_load", "done", step=step, loaded=reranker is not None)
                    check_abort("agentic_rerank_score")
                    emit_phase("agentic_rerank_score", "start", step=step, candidates=len(candidates))
                    phase_started_at = time.perf_counter()
                    reranked = rerank_candidates(
                        reranker,
                        query_for_display or retrieval_query,
                        candidates,
                        max(200, int(args.rerank_max_chars or _RERANK_MAX_CHARS_DEFAULT)),
                    )
                    record_phase("rerank_score", phase_started_at)
                    emit_phase("agentic_rerank_score", "done", step=step, reranked=len(reranked))
                    updated = apply_doc_cap(reranked, max_per_doc)[:base_k]
                else:
                    ordered = apply_tag_boosting(candidates, extract_keywords(retrieval_query))
                    updated = apply_doc_cap(ordered, max_per_doc)[:base_k]
                if annotation_k > 0 and updated:
                    try:
                        check_abort("agentic_annotations")
                        emit_phase("agentic_annotations", "start", step=step, k=annotation_k)
                        vec = embed_query(retrieval_query)
                        keywords = extract_keywords(retrieval_query)
                        phase_started_at = time.perf_counter()
                        annotations = retrieve_annotation_chunks(
                            client,
                            args.index,
                            vec,
                            annotation_k,
                            keywords,
                        )
                        record_phase("retrieve_annotations", phase_started_at)
                        emit_phase("agentic_annotations", "done", step=step, count=len(annotations))
                        updated = merge_annotation_chunks(updated, annotations, annotation_k)
                    except Exception as exc:
                        step_trace["annotation_error"] = str(exc)
                if updated:
                    retrieved = updated
                    seen_expansions = {str(item).lower() for item in expanded_queries}
                    for item in retry_expanded:
                        key = str(item).lower()
                        if key in seen_expansions:
                            continue
                        seen_expansions.add(key)
                        expanded_queries.append(item)
                    if expanded_queries:
                        query_for_display = expanded_queries[0]
                else:
                    step_trace["status"] = "no_results"
                    break

            elif action == "full_document":
                check_abort("agentic_full_document")
                target_doc_id = str(plan.get("doc_id", "") or "").strip() or choose_top_doc_id(retrieved)
                step_trace["doc_id"] = target_doc_id
                if not target_doc_id:
                    step_trace["status"] = "skipped_no_doc_id"
                    break
                try:
                    emit_phase("agentic_full_document", "start", step=step, doc_id=target_doc_id)
                    phase_started_at = time.perf_counter()
                    full_chunks = retrieve_full_document_chunks(
                        client,
                        args.index,
                        target_doc_id,
                        agentic_full_doc_chunks,
                    )
                    record_phase("retrieve_full_document", phase_started_at)
                    emit_phase("agentic_full_document", "done", step=step, chunks=len(full_chunks))
                except Exception as exc:
                    step_trace["status"] = "error"
                    step_trace["error"] = str(exc)
                    break
                if not full_chunks:
                    step_trace["status"] = "no_results"
                    break
                full_chunks = trim_chunks_to_char_budget(full_chunks, agentic_full_doc_max_chars)
                merged = dedupe_by_doc_and_chunk(full_chunks + list(retrieved))
                retrieved = trim_chunks_to_char_budget(merged, agentic_full_doc_max_chars)
                step_trace["full_doc_chunks"] = len(full_chunks)

            after_sig = retrieval_signature(retrieved)
            step_trace["after_chunks"] = len(retrieved)
            step_trace["after_chars"] = sum_retrieved_chars(retrieved)
            if after_sig == before_sig:
                step_trace["status"] = "no_change"
                break
        emit_phase("agentic", "done", steps=len(strategy_trace))

    check_abort("build_context")
    emit_phase("build_context", "start", chunks=len(retrieved))
    phase_started_at = time.perf_counter()
    context = build_context(retrieved)
    record_phase("build_context", phase_started_at)
    emit_phase("build_context", "done", context_chars=len(context))

    system_prompt = (
        "Use ONLY the provided context for factual claims. If insufficient, say you do not know. "
        "Chat history is only for conversational continuity or for providing concepts to be retrieved. "
        "Add inline citations using this exact format: [[cite:DOC_ID:PAGE_START-PAGE_END]]. "
        "Example: ... [[cite:ABC123:12-13]]."
    )
    history_block = format_history_block(history_messages)
    if history_block:
        history_block = f"Chat history (for reference only):\\n{history_block}\\n\\n"
    def build_user_prompt(context_block: str) -> str:
        return f"{history_block}Question: {args.query}\\n\\nContext:\\n{context_block}"
    lm_studio_budget = get_lm_studio_context_budget(
        args.chat_base_url,
        args.chat_api_key,
        args.chat_model,
        f"{system_prompt}\\n\\n{history_block}\\n{args.query}\\n{context}",
    )
    max_output_tokens: Optional[int] = None
    if lm_studio_budget:
        max_output_tokens = int(lm_studio_budget.get("max_output_tokens") or 0) or None
        prompt_budget = max(
            64,
            int(lm_studio_budget.get("context_length") or 0) - int(max_output_tokens or 0) - _LM_STUDIO_CONTEXT_OVERHEAD_TOKENS,
        )
        static_prompt_tokens = estimate_text_tokens(system_prompt) + estimate_text_tokens(build_user_prompt(""))
        available_context_tokens = max(64, prompt_budget - static_prompt_tokens)
        trimmed_context = trim_text_to_token_budget(context, available_context_tokens)
        if trimmed_context:
            context = trimmed_context

    user_prompt = build_user_prompt(context)

    citations = build_citations(retrieved)

    answer = ""
    streamed = False
    if args.stream:
        def emit(obj: Dict[str, Any]) -> None:
            if emit_json is not None:
                emit_json(obj)
            else:
                print(json.dumps(obj, ensure_ascii=False), flush=True)

        try:
            check_abort("chat_stream")
            emit_phase("chat_stream", "start", model=args.chat_model)
            phase_started_at = time.perf_counter()
            answer = request_chat_stream(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
                lambda chunk: emit({"type": "delta", "content": chunk}),
                max_output_tokens=max_output_tokens,
                timing=chat_timing,
                should_abort=should_abort,
                endpoint_mode=args.chat_endpoint_mode,
            )
            record_phase("chat_request", phase_started_at)
            emit_phase("chat_stream", "done", chars=len(answer))
            streamed = True
        except Exception as exc:
            if is_stream_unsupported(str(exc)):
                chat_timing["chat_fallback_to_non_stream"] = True
                emit_phase("chat_stream", "fallback", reason="stream_unsupported")
                streamed = False
            else:
                eprint(f"Chat request failed: {exc}")
                return 2

    if not streamed:
        try:
            check_abort("chat_non_stream")
            emit_phase("chat_non_stream", "start", model=args.chat_model)
            phase_started_at = time.perf_counter()
            answer = request_chat(
                args.chat_base_url,
                args.chat_api_key,
                args.chat_model,
                args.temperature,
                system_prompt,
                user_prompt,
                max_output_tokens=max_output_tokens,
                timing=chat_timing,
                should_abort=should_abort,
                endpoint_mode=args.chat_endpoint_mode,
            )
            record_phase("chat_request", phase_started_at)
            emit_phase("chat_non_stream", "done", chars=len(answer))
        except Exception as exc:
            eprint(f"Chat request failed: {exc}")
            return 2

    total_ms = int((time.perf_counter() - run_started_at) * 1000)
    timing_summary: Dict[str, Any] = {
        "total_ms": total_ms,
        "phase_ms": phase_ms,
        "phase_counts": phase_counts,
        "chat": chat_timing,
    }

    output = {
        "query": query_for_display,
        "raw_query": raw_query if (query_rewritten or bool(expanded_queries)) else "",
        "retrieval_query": retrieval_query if query_rewritten else "",
        "query_rewritten": query_rewritten,
        "expanded_queries": expanded_queries,
        "rerank_used": bool(args.rerank),
        "rerank_model": args.rerank_model if args.rerank else "",
        "agentic_mode": agentic_mode,
        "agentic_trace": strategy_trace,
        "answer": answer,
        "citations": citations,
        "retrieved": retrieved,
        "timing": timing_summary,
    }

    if args.stream and streamed:
        final_payload = {"type": "final", **output}
        if emit_json is not None:
            emit_json(final_payload)
        else:
            print(json.dumps(final_payload, ensure_ascii=False), flush=True)
    else:
        if emit_json is not None:
            emit_json(output)
        else:
            print(json.dumps(output, ensure_ascii=False))
    return 0


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(list(argv) if argv is not None else None)
    return run_with_args(args)


if __name__ == "__main__":
    sys.exit(main())
`,"search_redis.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.10.1

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
# zotero-redisearch-rag tool version: 0.10.1

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
# zotero-redisearch-rag tool version: 0.10.1

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
# zotero-redisearch-rag tool version: 0.10.1
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
# zotero-redisearch-rag tool version: 0.10.1
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
`,"ocr_wordlist.txt":`# zotero-redisearch-rag tool version: 0.10.1
ackley
afton
alonso
altmetric
altmetrics
amityville
andersonville
andreassen
andrist
annalies
anshutz
arbeits
archeological
armroyd
arxiv
atchafalaya
ausbildungs
balize
barataria
barkhau
beardstown
bellum
beratungs
bibliotheks
bildungs
binkley
bissell
blakeley
blennerhassett
brien
britching
broadhorn
brockmann
burthen
burtnett
cadwallader
cahaba
cahawba
carondelet
cassville
castleman
centanni
chappell
chariton
chickering
chien
chouteau
clarington
cloverport
coara
cokely
concaved
cordelle
cordill
crain
creativecommons
crisman
crosshead
cyclopoedium
dailey
dards
deadrise
delly
devol
diningroom
donaldsonville
donelson
downbound
dravo
dunleith
duquesne
durward
eastport
elife
elihu
ellet
embree
engineeroom
engineroom
enroute
feedwater
fidler
filson
flatboatmen
flexner
fontayne
forschungs
fourche
francisville
frisbie
fryant
fugina
f\xFChrungs
gallipolis
garig
gearhart
genden
gephart
gerstner
goold
gravier
greenlee
grieco
guericke
guyandotte
habermehl
haites
halleck
halliday
handlin
handlungs
hannum
harmar
hartupee
hawesville
hinde
hinman
hogchain
hogchains
holdcamper
holston
hornbrook
howards
hulbert
hunster
idlewild
ingraham
jackstaff
jeffboat
keelboating
keiten
kommunikations
kooperations
kountz
labarge
lanman
lapointe
laughlin
leadsman
leitungs
likert
lodwick
lytle
marestier
marmet
martialed
martius
massie
maysville
mayville
mcclelland
mcconnellsville
mechling
metcalf
milliken
mohler
monon
monona
montauk
montul
moundsville
nachnutzbar
nauvoo
newbern
newcomen
noncondensing
oglebay
openaccess
openaire
orcid
oronoko
paddlewheel
paddlewheels
pargoud
pegram
petsche
peytona
pilotwheel
pitmans
plaquemine
portside
procedia
publikations
publikationsfonds
publikationswesen
ravenswood
redstone
remley
researchgate
ricouard
ringwalt
riverman
rivermen
riverward
roddy
rousters
rowberry
rumsey
rungen
savery
scantling
schen
schiedlichen
scientometrics
scopus
sewickley
sherrod
shippingport
shotwell
shousetown
shreve
sidewheel
sidewheeler
sidewheelers
simonds
simonton
sinkings
sistersville
slackwater
smithland
snagboat
snagboats
snaggings
snelling
staybolts
steamboating
steamboatman
steamboatmen
sternwheel
sternwheeler
sternwheelers
stillman
stoll
strader
streckfus
suter
sutphin
swartzwelder
tarascon
teche
tombigbee
totten
towson
trabue
tredgold
trone
unesdoc
upbound
vanceburg
vandergrift
wharfboat
wharfboats
whitten
wintringer
wissenschafts
woodyard
woodyards
wooldridge
woolfolk
yeatman
youghiogheny
zaiser
zenodo
`,"requirements.txt":`# zotero-redisearch-rag tool version: 0.10.1
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
requests==2.32.3
urllib3<3,>=2.2.2
charset-normalizer<4,>=3.3.2
chardet<6,>=5.2.0
sentence-transformers
stopwordsiso
tqdm
wordfreq

# Optional for language normalization and spellchecking
# hunspell  # Disabled: fails to build on macOS/Python 3.13, use spylls fallback
spylls
`,"docker-compose.yml":`# zotero-redisearch-rag tool version: 0.10.1
services:
  redis-stack:
    image: docker.io/redis/redis-stack:7.4.0-v8
    environment:
      - REDIS_ARGS=
    ports:
      - "\${ZRR_PORT:-6379}:6379"
      - "\${ZRR_INSIGHT_PORT:-8001}:8001"
    volumes:
      - "\${ZRR_DATA_DIR:-./.zotero-redisearch-rag/redis-data}:/data"
      - "./redis-stack.conf:/redis-stack.conf:ro"

  python-worker:
    build:
      context: "\${ZRR_PLUGIN_DIR:-.}"
      dockerfile: tools/python-worker.Dockerfile
      args:
        ZRR_TESSERACT_LANG_PACKS: "\${ZRR_TESSERACT_LANG_PACKS:-eng deu fra spa ita nld por pol swe}"
    restart: unless-stopped
    environment:
      - PYTHONUNBUFFERED=1
      - ZRR_WORKER_REQUIREMENTS=\${ZRR_WORKER_REQUIREMENTS:-/workspace/plugin/tools/requirements.txt}
      - ZRR_WORKER_VENV_DIR=/workspace/cache/venv
      - PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
      - DISABLE_MODEL_SOURCE_CHECK=True
    ports:
      - "\${ZRR_WORKER_PORT:-7379}:7379"
    volumes:
      - "\${ZRR_PLUGIN_DIR:-.}:/workspace/plugin:ro"
      - "\${ZRR_VAULT_DIR:-.}:/workspace/vault"
      - "\${ZRR_WORKER_CACHE_DIR:-./.zotero-redisearch-rag/python-worker-cache}:/workspace/cache"
`,"python-worker.Dockerfile":`# zotero-redisearch-rag tool version: 0.10.1
FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive
ARG ZRR_TESSERACT_LANG_PACKS="eng deu fra spa ita nld por pol swe"

RUN set -eux; \\
  apt-get update; \\
  apt-get install -y --no-install-recommends \\
    ca-certificates \\
    ccache \\
    gcc \\
    g++ \\
    libglib2.0-0 \\
    libgl1 \\
    libsm6 \\
    libxext6 \\
    libxrender1 \\
    poppler-utils \\
    tesseract-ocr; \\
  for lang in \${ZRR_TESSERACT_LANG_PACKS}; do \\
    [ -n "\${lang}" ] || continue; \\
    apt-get install -y --no-install-recommends "tesseract-ocr-\${lang}"; \\
  done; \\
  rm -rf /var/lib/apt/lists/*

COPY tools/python-worker-entrypoint.sh /usr/local/bin/python-worker-entrypoint.sh
RUN chmod +x /usr/local/bin/python-worker-entrypoint.sh

WORKDIR /workspace

ENV ZRR_WORKER_REQUIREMENTS=/workspace/plugin/tools/requirements.txt
ENV ZRR_WORKER_VENV_DIR=/workspace/cache/venv
ENV PATH=/workspace/cache/venv/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
ENV DISABLE_MODEL_SOURCE_CHECK=True

ENTRYPOINT ["/usr/local/bin/python-worker-entrypoint.sh"]
CMD ["/workspace/cache/venv/bin/python", "/workspace/plugin/tools/python-worker-api.py"]
`,"python-worker-entrypoint.sh":`#!/bin/sh
# zotero-redisearch-rag tool version: 0.10.1
set -eu

VENV_DIR="\${ZRR_WORKER_VENV_DIR:-/workspace/cache/venv}"
STAMP_FILE="\${VENV_DIR}/.requirements.sha256"

mkdir -p "$(dirname "\${VENV_DIR}")"

if [ ! -x "\${VENV_DIR}/bin/python" ]; then
  python3 -m venv "\${VENV_DIR}"
fi

REQ_FILE=""
for candidate in \\
  "\${ZRR_WORKER_REQUIREMENTS:-}" \\
  "/workspace/plugin/tools/requirements.txt" \\
  "/workspace/plugin/requirements.txt"
do
  if [ -n "\${candidate}" ] && [ -f "\${candidate}" ]; then
    REQ_FILE="\${candidate}"
    break
  fi
done

if [ -z "\${REQ_FILE}" ]; then
  echo "Python worker requirements file not found. Checked: \${ZRR_WORKER_REQUIREMENTS:-<unset>}, /workspace/plugin/tools/requirements.txt, /workspace/plugin/requirements.txt" >&2
  exit 2
fi

CURRENT_HASH="$(sha256sum "\${REQ_FILE}" | awk '{print $1}')"
INSTALLED_HASH=""
if [ -f "\${STAMP_FILE}" ]; then
  INSTALLED_HASH="$(cat "\${STAMP_FILE}" || true)"
fi

if [ "\${CURRENT_HASH}" != "\${INSTALLED_HASH}" ]; then
  "\${VENV_DIR}/bin/pip" install --upgrade pip
  "\${VENV_DIR}/bin/pip" install -r "\${REQ_FILE}"
  printf "%s\\n" "\${CURRENT_HASH}" > "\${STAMP_FILE}"
fi

exec "$@"
`,"python-worker-api.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.10.1
import argparse
import contextlib
import importlib
import io
import json
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlsplit, urlunsplit

TOOLS_ROOT = Path("/workspace/plugin/tools").resolve()
MAX_BODY_BYTES = 1048576
DEFAULT_TIMEOUT_SEC = 3600
TOOL_ENV = {
    "PYTHONUNBUFFERED": "1",
    "PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK": "True",
    "DISABLE_MODEL_SOURCE_CHECK": "True",
}
RAG_TOOL_NAME = "rag_query_redisearch.py"
RAG_MODULE_NAME = "rag_query_redisearch"
RAG_MODULE: Optional[Any] = None
RAG_MODULE_LOCK = threading.Lock()
RAG_EXEC_LOCK = threading.Lock()
CANCEL_EVENTS: Dict[str, threading.Event] = {}
CANCEL_EVENTS_LOCK = threading.Lock()


class ClientDisconnectedError(Exception):
    pass


def json_response(
    handler: BaseHTTPRequestHandler, status: int, payload: Dict[str, Any]
) -> None:
    data = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def monotonic_ms() -> int:
    return int(time.monotonic() * 1000)


def log_timing(event: str, **fields: Any) -> None:
    payload = {"event": event, **fields}
    sys.stderr.write(f"[zrr-python-worker] {json.dumps(payload, ensure_ascii=False)}\\n")
    sys.stderr.flush()


def is_rag_tool(script_path: Path) -> bool:
    return script_path.name == RAG_TOOL_NAME


def get_rag_module() -> Any:
    global RAG_MODULE
    if RAG_MODULE is not None:
        return RAG_MODULE
    with RAG_MODULE_LOCK:
        if RAG_MODULE is not None:
            return RAG_MODULE
        tools_root_str = str(TOOLS_ROOT)
        if tools_root_str not in sys.path:
            sys.path.insert(0, tools_root_str)
        RAG_MODULE = importlib.import_module(RAG_MODULE_NAME)
        return RAG_MODULE


def parse_rag_args(module: Any, args: List[str]) -> argparse.Namespace:
    parser = module.build_arg_parser()
    try:
        return parser.parse_args(args)
    except SystemExit as exc:
        code = int(exc.code) if isinstance(exc.code, int) else 2
        raise ValueError(f"Invalid arguments for {RAG_TOOL_NAME} (exit={code}).") from exc


def _is_local_redis_host(host: str) -> bool:
    normalized = (host or "").strip().lower()
    if not normalized:
        return False
    if normalized in {"localhost", "0.0.0.0", "::1"}:
        return True
    return normalized.startswith("127.")


def _rewrite_worker_redis_url(raw_url: str) -> str:
    trimmed = (raw_url or "").strip()
    if not trimmed:
        return raw_url
    try:
        parsed = urlsplit(trimmed)
    except Exception:
        return raw_url
    if parsed.scheme not in {"redis", "rediss", "redis+tls"}:
        return raw_url
    if not _is_local_redis_host(parsed.hostname or ""):
        return raw_url
    # Worker container must use compose service DNS instead of local loopback.
    netloc = parsed.netloc
    if "@" in netloc:
        userinfo, _host = netloc.rsplit("@", 1)
        new_netloc = f"{userinfo}@redis-stack:6379"
    else:
        new_netloc = "redis-stack:6379"
    rewritten = urlunsplit((parsed.scheme, new_netloc, parsed.path, parsed.query, parsed.fragment))
    return rewritten or raw_url


def rewrite_redis_args_for_worker(args: List[str]) -> Tuple[List[str], List[Tuple[str, str]]]:
    rewritten: List[str] = []
    changes: List[Tuple[str, str]] = []
    previous = ""
    for arg in args:
        updated = arg
        if previous == "--redis-url":
            candidate = _rewrite_worker_redis_url(arg)
            if candidate != arg:
                changes.append((arg, candidate))
            updated = candidate
        elif arg.startswith("--redis-url="):
            original_value = arg.split("=", 1)[1]
            updated_value = _rewrite_worker_redis_url(original_value)
            if updated_value != original_value:
                changes.append((original_value, updated_value))
            updated = f"--redis-url={updated_value}"
        rewritten.append(updated)
        previous = arg
    return rewritten, changes


def parse_run_request(payload: Dict[str, Any]) -> Tuple[Path, List[str], int]:
    tool = payload.get("tool")
    if not isinstance(tool, str) or not tool.strip():
        raise ValueError("Missing required field 'tool'.")

    tool_name = tool.strip()
    if "/" in tool_name or "\\\\" in tool_name:
        raise ValueError("'tool' must be a file name under /workspace/plugin/tools.")
    if not tool_name.endswith(".py"):
        raise ValueError("'tool' must reference a Python script (.py).")

    script_path = (TOOLS_ROOT / tool_name).resolve()
    if TOOLS_ROOT not in script_path.parents or not script_path.is_file():
        raise ValueError(f"Tool script not found: {tool_name}")

    raw_args = payload.get("args", [])
    if not isinstance(raw_args, list):
        raise ValueError("'args' must be a JSON array.")
    args = [str(value) for value in raw_args]
    args, _changes = rewrite_redis_args_for_worker(args)

    timeout_sec = payload.get("timeout_sec")
    if timeout_sec is None:
        timeout = DEFAULT_TIMEOUT_SEC
    elif isinstance(timeout_sec, (int, float)) and timeout_sec > 0:
        timeout = int(timeout_sec)
    else:
        raise ValueError("'timeout_sec' must be a positive number.")

    return script_path, args, timeout


def parse_cancel_request(payload: Dict[str, Any]) -> str:
    request_id = payload.get("request_id")
    if not isinstance(request_id, str) or not request_id.strip():
        raise ValueError("Missing required field 'request_id'.")
    return request_id.strip()


def register_cancel_event(request_id: str) -> threading.Event:
    event = threading.Event()
    with CANCEL_EVENTS_LOCK:
        CANCEL_EVENTS[request_id] = event
    return event


def get_cancel_event(request_id: str) -> Optional[threading.Event]:
    with CANCEL_EVENTS_LOCK:
        return CANCEL_EVENTS.get(request_id)


def unregister_cancel_event(request_id: str) -> None:
    with CANCEL_EVENTS_LOCK:
        CANCEL_EVENTS.pop(request_id, None)


def acquire_rag_lock(cancel_event: threading.Event, deadline_ms: int) -> None:
    while True:
        if RAG_EXEC_LOCK.acquire(timeout=0.25):
            return
        if cancel_event.is_set():
            raise TimeoutError("canceled_while_waiting_rag_slot")
        if monotonic_ms() >= deadline_ms:
            raise TimeoutError("timeout_while_waiting_rag_slot")


class WorkerHandler(BaseHTTPRequestHandler):
    server_version = "ZRRPythonWorker/0.1"

    def log_message(self, format: str, *args: Any) -> None:
        return

    def request_id(self) -> str:
        header = self.headers.get("X-ZRR-Request-Id", "").strip()
        return header or f"req-{monotonic_ms()}"

    def do_GET(self) -> None:
        if self.path != "/health":
            json_response(self, 404, {"ok": False, "error": "not_found"})
            return
        json_response(
            self,
            200,
            {
                "ok": True,
                "python": sys.version.split()[0],
                "tools_root": str(TOOLS_ROOT),
            },
        )

    def _read_run_payload(self) -> Tuple[Path, List[str], int]:
        payload = self._read_json_payload()
        return parse_run_request(payload)

    def _read_cancel_payload(self) -> str:
        payload = self._read_json_payload()
        return parse_cancel_request(payload)

    def _read_json_payload(self) -> Dict[str, Any]:
        content_length = self.headers.get("Content-Length", "0").strip()
        try:
            body_len = int(content_length)
        except ValueError as exc:
            raise ValueError("Invalid Content-Length.") from exc
        if body_len <= 0 or body_len > MAX_BODY_BYTES:
            raise ValueError(
                f"Invalid request size ({body_len}); must be 1..{MAX_BODY_BYTES} bytes."
            )
        raw_body = self.rfile.read(body_len)
        payload = json.loads(raw_body.decode("utf-8"))
        if not isinstance(payload, dict):
            raise ValueError("Request body must be a JSON object.")
        return payload

    def _mark_canceled(self, request_id: str) -> bool:
        event = get_cancel_event(request_id)
        if event is None:
            return False
        event.set()
        return True

    def _run_non_stream(
        self,
        script_path: Path,
        args: List[str],
        timeout: int,
        request_id: str,
        cancel_event: threading.Event,
    ) -> None:
        started_at = monotonic_ms()
        log_timing(
            "run-start",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            args_count=len(args),
            timeout_sec=timeout,
        )
        if is_rag_tool(script_path):
            try:
                self._run_rag_non_stream(
                    script_path, args, timeout, request_id, started_at, cancel_event
                )
            except Exception as exc:
                finished_at = monotonic_ms()
                json_response(
                    self,
                    200,
                    {
                        "ok": False,
                        "exit_code": 1,
                        "stdout": "",
                        "stderr": str(exc),
                        "error": "exec_failed",
                    },
                )
                log_timing(
                    "run-error",
                    request_id=request_id,
                    path=self.path,
                    tool=script_path.name,
                    duration_ms=finished_at - started_at,
                    error=str(exc),
                    in_process=True,
                )
            return

        command = [sys.executable, str(script_path), *args]
        try:
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                cwd=str(TOOLS_ROOT),
                timeout=timeout,
                env=TOOL_ENV,
            )
            json_response(
                self,
                200,
                {
                    "ok": completed.returncode == 0,
                    "exit_code": completed.returncode,
                    "stdout": completed.stdout,
                    "stderr": completed.stderr,
                },
            )
            finished_at = monotonic_ms()
            log_timing(
                "run-done",
                request_id=request_id,
                path=self.path,
                tool=script_path.name,
                exit_code=completed.returncode,
                duration_ms=finished_at - started_at,
                stdout_bytes=len(completed.stdout or ""),
                stderr_bytes=len(completed.stderr or ""),
            )
        except subprocess.TimeoutExpired as exc:
            finished_at = monotonic_ms()
            json_response(
                self,
                200,
                {
                    "ok": False,
                    "exit_code": 124,
                    "stdout": exc.stdout if isinstance(exc.stdout, str) else "",
                    "stderr": exc.stderr if isinstance(exc.stderr, str) else "",
                    "error": "timeout",
                    "timeout_sec": timeout,
                },
            )
            log_timing(
                "run-timeout",
                request_id=request_id,
                path=self.path,
                tool=script_path.name,
                exit_code=124,
                duration_ms=finished_at - started_at,
            )
        except Exception as exc:
            finished_at = monotonic_ms()
            json_response(
                self,
                200,
                {
                    "ok": False,
                    "exit_code": 1,
                    "stdout": "",
                    "stderr": str(exc),
                    "error": "exec_failed",
                },
            )
            log_timing(
                "run-error",
                request_id=request_id,
                path=self.path,
                tool=script_path.name,
                duration_ms=finished_at - started_at,
                error=str(exc),
            )

    def _run_stream(
        self,
        script_path: Path,
        args: List[str],
        timeout: int,
        request_id: str,
        cancel_event: threading.Event,
    ) -> None:
        started_at = monotonic_ms()
        log_timing(
            "stream-start",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            args_count=len(args),
            timeout_sec=timeout,
        )
        if is_rag_tool(script_path):
            self._run_rag_stream(
                script_path, args, timeout, request_id, started_at, cancel_event
            )
            return

        command = [sys.executable, str(script_path), *args]
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            cwd=str(TOOLS_ROOT),
            env=TOOL_ENV,
        )

        stderr_parts: List[str] = []
        stderr_done = threading.Event()

        def read_stderr() -> None:
            try:
                if process.stderr is None:
                    return
                for chunk in iter(lambda: process.stderr.read(4096), ""):
                    if not chunk:
                        break
                    stderr_parts.append(chunk)
            finally:
                stderr_done.set()

        stderr_thread = threading.Thread(target=read_stderr, daemon=True)
        stderr_thread.start()

        timed_out = False
        canceled = False
        stdout_lines = 0
        first_stdout_at: Optional[int] = None

        def enforce_timeout() -> None:
            nonlocal timed_out
            timed_out = True
            try:
                process.kill()
            except Exception:
                return

        timer = threading.Timer(timeout, enforce_timeout)
        timer.daemon = True
        timer.start()

        def enforce_cancel() -> None:
            nonlocal canceled
            while process.poll() is None and not timed_out:
                if not cancel_event.wait(0.2):
                    continue
                canceled = True
                try:
                    process.kill()
                except Exception:
                    return
                return

        cancel_thread = threading.Thread(target=enforce_cancel, daemon=True)
        cancel_thread.start()

        def send_event(event: Dict[str, Any]) -> bool:
            data = (json.dumps(event) + "\\n").encode("utf-8")
            try:
                self.wfile.write(data)
                self.wfile.flush()
                return True
            except (BrokenPipeError, ConnectionResetError):
                return False

        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson")
        self.end_headers()

        client_open = True
        try:
            if process.stdout is not None:
                for line in process.stdout:
                    if not client_open:
                        break
                    if first_stdout_at is None:
                        first_stdout_at = monotonic_ms()
                    stdout_lines += 1
                    if not send_event({"type": "stdout", "line": line.rstrip("\\r\\n")}):
                        client_open = False
            if not client_open:
                try:
                    process.kill()
                except Exception:
                    pass
        finally:
            timer.cancel()
            try:
                process.wait(timeout=2)
            except Exception:
                pass

        stderr_done.wait(timeout=2)
        stderr_text = "".join(stderr_parts)
        exit_code = process.returncode if process.returncode is not None else 1
        if timed_out:
            exit_code = 124
        if canceled:
            exit_code = 130

        if client_open:
            send_event(
                {
                    "type": "done",
                    "ok": exit_code == 0,
                    "exit_code": exit_code,
                    "stderr": stderr_text,
                    "error": ("timeout" if timed_out else ("canceled" if canceled else "")),
                    "timeout_sec": timeout if timed_out else None,
                }
            )
        finished_at = monotonic_ms()
        log_timing(
            "stream-done",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            exit_code=exit_code,
            timed_out=timed_out,
            duration_ms=finished_at - started_at,
            first_stdout_ms=(first_stdout_at - started_at) if first_stdout_at is not None else None,
            stdout_lines=stdout_lines,
            stderr_bytes=len(stderr_text),
            client_open=client_open,
            canceled=canceled,
        )

    def _run_rag_non_stream(
        self,
        script_path: Path,
        args: List[str],
        timeout: int,
        request_id: str,
        started_at: int,
        cancel_event: threading.Event,
    ) -> None:
        module = get_rag_module()
        parsed = parse_rag_args(module, args)
        emitted_lines: List[str] = []
        stderr_buffer = io.StringIO()
        stdout_buffer = io.StringIO()
        deadline_ms = started_at + (max(1, timeout) * 1000)
        abort_type = getattr(module, "AbortRequested", None)

        def emit_json(payload: Dict[str, Any]) -> None:
            emitted_lines.append(json.dumps(payload, ensure_ascii=False))

        def should_abort() -> bool:
            if cancel_event.is_set():
                return True
            return monotonic_ms() >= deadline_ms

        # In-process execution keeps reranker warm across requests.
        timed_out = False
        canceled = False
        exit_code = 0
        lock_wait_ms = 0
        lock_acquired = False
        try:
            wait_started_at = monotonic_ms()
            acquire_rag_lock(cancel_event, deadline_ms)
            lock_wait_ms = monotonic_ms() - wait_started_at
            lock_acquired = True
            try:
                with contextlib.redirect_stderr(stderr_buffer), contextlib.redirect_stdout(stdout_buffer):
                    exit_code = int(
                        module.run_with_args(
                            parsed,
                            emit_json=emit_json,
                            should_abort=should_abort,
                        )
                    )
            except Exception as exc:
                if abort_type is not None and isinstance(exc, abort_type):
                    if cancel_event.is_set():
                        canceled = True
                    else:
                        timed_out = True
                    exit_code = 124
                    stderr_buffer.write(f"{exc}\\n")
                else:
                    raise
        except TimeoutError as exc:
            exit_code = 124
            if "canceled" in str(exc):
                canceled = True
            else:
                timed_out = True
            stderr_buffer.write(f"{exc}\\n")
        finally:
            if lock_acquired:
                RAG_EXEC_LOCK.release()

        stdout_parts: List[str] = []
        stdout_text = stdout_buffer.getvalue()
        if stdout_text:
            stdout_parts.append(stdout_text.rstrip("\\n"))
        stdout_parts.extend(emitted_lines)
        merged_stdout = "\\n".join(part for part in stdout_parts if part)
        if merged_stdout:
            merged_stdout += "\\n"
        merged_stderr = stderr_buffer.getvalue()

        json_response(
            self,
            200,
            {
                "ok": exit_code == 0,
                "exit_code": exit_code,
                "stdout": merged_stdout,
                "stderr": merged_stderr,
                "timeout_sec": timeout if timed_out else None,
                "error": "canceled" if canceled else ("timeout" if timed_out else ""),
            },
        )
        finished_at = monotonic_ms()
        log_timing(
            "run-done",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            exit_code=exit_code,
            duration_ms=finished_at - started_at,
            stdout_bytes=len(merged_stdout),
            stderr_bytes=len(merged_stderr),
            in_process=True,
            timed_out=timed_out,
            canceled=canceled,
            lock_wait_ms=lock_wait_ms,
        )

    def _run_rag_stream(
        self,
        script_path: Path,
        args: List[str],
        timeout: int,
        request_id: str,
        started_at: int,
        cancel_event: threading.Event,
    ) -> None:
        module = get_rag_module()
        parsed = parse_rag_args(module, args)
        stderr_buffer = io.StringIO()
        stdout_buffer = io.StringIO()
        stdout_lines = 0
        first_stdout_at: Optional[int] = None
        deadline_ms = started_at + (max(1, timeout) * 1000)
        abort_type = getattr(module, "AbortRequested", None)

        def send_event(event: Dict[str, Any]) -> bool:
            data = (json.dumps(event) + "\\n").encode("utf-8")
            try:
                self.wfile.write(data)
                self.wfile.flush()
                return True
            except (BrokenPipeError, ConnectionResetError):
                return False

        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson")
        self.end_headers()

        def emit_json(payload: Dict[str, Any]) -> None:
            nonlocal stdout_lines, first_stdout_at
            line = json.dumps(payload, ensure_ascii=False)
            stdout_lines += 1
            if first_stdout_at is None:
                first_stdout_at = monotonic_ms()
            if not send_event({"type": "stdout", "line": line}):
                cancel_event.set()
                raise ClientDisconnectedError("Client disconnected during stream.")

        def should_abort() -> bool:
            if cancel_event.is_set():
                return True
            return monotonic_ms() >= deadline_ms

        timed_out = False
        canceled = False
        client_open = True
        exit_code = 0
        error_text = ""
        lock_wait_ms = 0
        try:
            wait_started_at = monotonic_ms()
            acquire_rag_lock(cancel_event, deadline_ms)
            lock_wait_ms = monotonic_ms() - wait_started_at
            try:
                # In-process streaming keeps reranker loaded in memory.
                with contextlib.redirect_stderr(stderr_buffer), contextlib.redirect_stdout(stdout_buffer):
                    exit_code = int(
                        module.run_with_args(
                            parsed,
                            emit_json=emit_json,
                            should_abort=should_abort,
                        )
                    )
            finally:
                RAG_EXEC_LOCK.release()
        except ClientDisconnectedError:
            client_open = False
            error_text = "client_disconnected"
        except TimeoutError as exc:
            exit_code = 124
            if "canceled" in str(exc):
                canceled = True
                error_text = "canceled"
            else:
                timed_out = True
                error_text = "timeout"
            stderr_buffer.write(f"{exc}\\n")
        except Exception as exc:
            if abort_type is not None and isinstance(exc, abort_type):
                exit_code = 124
                if cancel_event.is_set():
                    canceled = True
                    error_text = "canceled"
                else:
                    timed_out = True
                    error_text = "timeout"
                stderr_buffer.write(f"{exc}\\n")
            else:
                exit_code = 1
                error_text = str(exc)
        stderr_text = stderr_buffer.getvalue()
        stdout_text = stdout_buffer.getvalue()
        if stdout_text.strip() and client_open:
            for raw in stdout_text.splitlines():
                line = raw.strip()
                if not line:
                    continue
                stdout_lines += 1
                if first_stdout_at is None:
                    first_stdout_at = monotonic_ms()
                if not send_event({"type": "stdout", "line": line}):
                    client_open = False
                    error_text = "client_disconnected"
                    break

        if client_open:
            send_event(
                {
                    "type": "done",
                    "ok": exit_code == 0,
                    "exit_code": exit_code,
                    "stderr": stderr_text,
                    "error": ("timeout" if timed_out else ("canceled" if canceled else error_text)),
                    "timeout_sec": timeout if timed_out else None,
                }
            )

        finished_at = monotonic_ms()
        log_timing(
            "stream-done",
            request_id=request_id,
            path=self.path,
            tool=script_path.name,
            exit_code=exit_code,
            timed_out=timed_out,
            duration_ms=finished_at - started_at,
            first_stdout_ms=(first_stdout_at - started_at) if first_stdout_at is not None else None,
            stdout_lines=stdout_lines,
            stderr_bytes=len(stderr_text),
            client_open=client_open,
            in_process=True,
            error=error_text,
            canceled=canceled,
            lock_wait_ms=lock_wait_ms,
        )

    def do_POST(self) -> None:
        if self.path not in {"/run", "/run-stream", "/cancel"}:
            log_timing("http-not-found", path=self.path, request_id=self.request_id())
            json_response(self, 404, {"ok": False, "error": "not_found"})
            return

        if self.path == "/cancel":
            request_id = self.request_id()
            try:
                target_request_id = self._read_cancel_payload()
            except Exception as exc:
                log_timing(
                    "invalid-request",
                    path=self.path,
                    request_id=request_id,
                    error=str(exc),
                )
                json_response(
                    self,
                    400,
                    {"ok": False, "error": "invalid_request", "detail": str(exc)},
                )
                return
            canceled = self._mark_canceled(target_request_id)
            log_timing(
                "cancel-request",
                path=self.path,
                request_id=request_id,
                target_request_id=target_request_id,
                canceled=canceled,
            )
            json_response(self, 200, {"ok": True, "request_id": target_request_id, "canceled": canceled})
            return

        request_id = self.request_id()
        try:
            script_path, args, timeout = self._read_run_payload()
        except Exception as exc:
            log_timing(
                "invalid-request",
                path=self.path,
                request_id=request_id,
                error=str(exc),
            )
            json_response(self, 400, {"ok": False, "error": "invalid_request", "detail": str(exc)})
            return

        cancel_event = register_cancel_event(request_id)
        try:
            if self.path == "/run-stream":
                try:
                    self._run_stream(script_path, args, timeout, request_id, cancel_event)
                except Exception as exc:
                    log_timing(
                        "stream-fatal",
                        path=self.path,
                        request_id=request_id,
                        tool=script_path.name,
                        error=str(exc),
                    )
                    try:
                        json_response(
                            self,
                            200,
                            {
                                "ok": False,
                                "exit_code": 1,
                                "stdout": "",
                                "stderr": str(exc),
                                "error": "exec_failed",
                            },
                        )
                    except Exception:
                        return
                return

            self._run_non_stream(script_path, args, timeout, request_id, cancel_event)
        finally:
            unregister_cancel_event(request_id)


def main() -> int:
    host = "0.0.0.0"
    port = 7379
    server = ThreadingHTTPServer((host, port), WorkerHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        return 0
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`,"pdf_page_count.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.10.1

import argparse
import json
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description="Return PDF page count as JSON.")
    parser.add_argument("--pdf", required=True, help="Absolute path to the PDF file.")
    args = parser.parse_args()

    try:
      from pypdf import PdfReader  # type: ignore
    except Exception as exc:
      sys.stderr.write(f"Failed to import pypdf: {exc}\\n")
      return 2

    try:
      reader = PdfReader(args.pdf)
      page_count = int(len(reader.pages))
    except Exception as exc:
      sys.stderr.write(f"Failed to read PDF page count: {exc}\\n")
      return 2

    print(json.dumps({"pages": page_count}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
`,"redis-stack.conf":`# zotero-redisearch-rag tool version: 0.10.1
# Redis Stack persistence config for local RAG index
appendonly yes
appendfsync everysec

dir /data
`};var wt=require("url"),me=y=>!y||typeof y!="object"?null:y,ln=y=>Array.isArray(y),qe=async(y,u,e)=>{let t=zn(y);if(t)return t;try{let n=await e.fetchZoteroChildren(u);for(let r of n){let i=cn(r);if(i)return i}}catch(n){console.error("Failed to fetch Zotero children",n)}return null},zn=y=>{let u=jn(y);for(let e of u){let t=cn(e);if(t)return t}return null},jn=y=>{let u=[y.attachments,y.children,y.items,y.attachment,y.allAttachments],e=[];for(let t of u)t&&(ln(t)?e.push(...t):typeof t=="object"&&e.push(t));return e},cn=y=>{var i,a,s,o;let u=me(y),e=me(u==null?void 0:u.data);if(((a=(i=u==null?void 0:u.contentType)!=null?i:u==null?void 0:u.mimeType)!=null?a:e==null?void 0:e.contentType)!=="application/pdf")return null;let n=(o=(s=u==null?void 0:u.key)!=null?s:u==null?void 0:u.attachmentKey)!=null?o:e==null?void 0:e.key;if(typeof n!="string"||!n.trim())return null;let r=$n(y);return r?{key:n,filePath:r}:{key:n}},$n=y=>{var o,l;let u=me(y),e=me(u==null?void 0:u.links),t=me(u==null?void 0:u.enclosure),n=me(u==null?void 0:u.data),r=me(n==null?void 0:n.links),i=me(e==null?void 0:e.enclosure),a=me(r==null?void 0:r.enclosure),s=(l=(o=i==null?void 0:i.href)!=null?o:t==null?void 0:t.href)!=null?l:a==null?void 0:a.href;if(typeof s=="string"&&s.startsWith("file://"))try{return(0,wt.fileURLToPath)(s)}catch(c){return null}return null},on=async(y,u)=>{if(y.statusCode<300||y.statusCode>=400)return null;let e=y.headers.location,t=ln(e)?e[0]:e;if(!t||typeof t!="string")return null;if(t.startsWith("file://")){let n=(0,wt.fileURLToPath)(t);return u.readFile(n)}return t.startsWith("http://")||t.startsWith("https://")?u.requestLocalApi(t):null},pt=async(y,u)=>{let e=u.buildZoteroUrl(`/${u.getZoteroLibraryPath()}/items/${y}/file`);try{let t=await u.requestLocalApiRaw(e),n=await on(t,u);if(n)return n;if(t.statusCode>=300)throw new Error(`Request failed, status ${t.statusCode}`);return t.body}catch(t){if(console.warn("Failed to download PDF from local API",t),!u.canUseWebApi())throw t;let n=u.buildWebApiUrl(`/${u.getWebApiLibraryPath()}/items/${y}/file`),r=await u.requestWebApiRaw(n),i=await on(r,u);if(i)return i;if(r.statusCode>=300)throw new Error(`Web API request failed, status ${r.statusCode}`);return r.body}};var Y=require("obsidian");var Le="zotero-redisearch-rag-chat",Un={artwork:"image",audioRecording:"music",bill:"file-text",blogPost:"globe",book:"book",bookSection:"book-open",case:"scale",computerProgram:"code",conferencePaper:"file-text",dataset:"database",dictionaryEntry:"book",document:"file-text",email:"mail",encyclopediaArticle:"book",film:"film",forumPost:"message-circle",hearing:"file-text",interview:"mic",journalArticle:"file-text",letter:"mail",magazineArticle:"file-text",manuscript:"file-text",map:"map",newspaperArticle:"file-text",patent:"award",podcast:"mic",preprint:"file-text",presentation:"file-text",radioBroadcast:"music",report:"file-text",statute:"scale",thesis:"graduation-cap",tvBroadcast:"film",videoRecording:"film",webpage:"globe"},ze=class extends Y.ItemView{constructor(e,t){super(e);this.messages=[];this.activeSessionId="default";this.messageEls=new Map;this.pendingRender=new Map;this.pendingThinking=new Set;this.busy=!1;this.cancelPending=!1;this.mentionOverlayEl=null;this.mentionListEl=null;this.mentionEmptyEl=null;this.mentionSuggestions=[];this.mentionSelectedIndex=0;this.mentionContext=null;this.mentionQuerySequence=0;this.mentionDebounceHandle=null;this.plugin=t}getViewType(){return Le}getDisplayText(){return"Zotero research assistant chat"}getIcon(){return"zrr-chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let t=e.createDiv({cls:"zrr-chat-header"});t.createDiv({cls:"zrr-chat-title",text:"Zotero research assistant chat"});let n=t.createDiv({cls:"zrr-chat-controls"}),r=n.createDiv({cls:"zrr-chat-controls-row"});this.sessionSelect=r.createEl("select",{cls:"zrr-chat-session"}),this.sessionSelect.addEventListener("change",()=>{this.switchSession(this.sessionSelect.value)});let i=n.createDiv({cls:"zrr-chat-controls-row zrr-chat-controls-actions"});this.renameButton=i.createEl("button",{cls:"zrr-chat-rename",text:"Rename",attr:{title:"Rename the current chat"}}),this.renameButton.addEventListener("click",()=>{this.promptRenameSession()}),this.copyButton=i.createEl("button",{cls:"zrr-chat-copy",text:"Copy",attr:{title:"Copy this chat to a new note"}}),this.copyButton.addEventListener("click",()=>{this.copyChatToNote()}),this.deleteButton=i.createEl("button",{cls:"zrr-chat-delete",text:"Delete",attr:{title:"Delete this chat"}}),this.deleteButton.addEventListener("click",()=>{this.deleteChat()}),this.newButton=i.createEl("button",{cls:"zrr-chat-new",text:"New chat",attr:{title:"Start a new chat session"}}),this.newButton.addEventListener("click",()=>{this.startNewChat()}),this.messagesEl=e.createDiv({cls:"zrr-chat-messages"}),this.inputWrapEl=e.createDiv({cls:"zrr-chat-input"}),this.inputEl=this.inputWrapEl.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=this.inputWrapEl.createEl("button",{cls:"zrr-chat-send",attr:{"aria-label":"Send message",title:"Send message"}}),this.createMentionOverlay(),this.updateSendButtonState(),this.sendButton.addEventListener("click",()=>{this.handleSendButtonClick()}),this.inputEl.addEventListener("keydown",a=>{this.handleMentionOverlayKeydown(a)||a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this.busy||this.handleSend())}),this.inputEl.addEventListener("input",()=>{this.scheduleZoteroMentionPicker()}),this.inputEl.addEventListener("click",()=>{this.scheduleZoteroMentionPicker()}),this.inputEl.addEventListener("keyup",()=>{this.scheduleZoteroMentionPicker()}),this.registerDomEvent(activeDocument,"mousedown",a=>{if(!this.inputWrapEl)return;let s=a.target;s instanceof Node&&!this.inputWrapEl.contains(s)&&this.closeMentionOverlay()}),await this.loadSessions(),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}onClose(){return this.closeMentionOverlay(),this.clearMentionPickerDebounce(),Promise.resolve()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistoryForSession(this.activeSessionId)}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages),await this.loadSessions()}catch(e){console.error(e)}}updateSessionControlsState(){let e="Finish or cancel the current response first",t=(n,r)=>{n&&(n.disabled=this.busy,n.setAttr("title",this.busy?e:r))};t(this.sessionSelect,"Switch chat session"),t(this.renameButton,"Rename the current chat"),t(this.deleteButton,"Delete this chat"),t(this.newButton,"Start a new chat session")}async loadSessions(){let e=await this.plugin.listChatSessions();this.activeSessionId=await this.plugin.getActiveChatSessionId(),this.sessionSelect.empty();for(let t of e){let n=this.sessionSelect.createEl("option",{text:t.name});n.value=t.id,t.id===this.activeSessionId&&(n.selected=!0)}!e.some(t=>t.id===this.activeSessionId)&&e.length>0&&(this.activeSessionId=e[0].id,await this.plugin.setActiveChatSessionId(this.activeSessionId),this.sessionSelect.value=this.activeSessionId),this.updateSessionControlsState()}async promptRenameSession(){var r;if(this.busy){new Y.Notice("Finish or cancel the current response before renaming this chat.");return}let t=(await this.plugin.listChatSessions()).find(i=>i.id===this.activeSessionId);new vt(this.app,(r=t==null?void 0:t.name)!=null?r:"New chat",async i=>{await this.plugin.renameChatSession(this.activeSessionId,i),await this.loadSessions()}).open()}async startNewChat(){if(this.busy){new Y.Notice("Finish or cancel the current response before starting a new chat.");return}await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages,{force:!0});let e=await this.plugin.createChatSession("New chat");await this.switchSession(e,{skipSave:!0})}async deleteChat(){if(this.busy){new Y.Notice("Finish or cancel the current response before deleting this chat.");return}let e=await this.plugin.listChatSessions();if(e.length<=1){new Y.Notice("You must keep at least one chat.");return}let t=e.find(r=>r.id===this.activeSessionId);if(!t)return;new Pt(this.app,t.name,async()=>{await this.plugin.deleteChatSession(this.activeSessionId);let r=await this.plugin.getActiveChatSessionId();await this.switchSession(r,{skipSave:!0})}).open()}async switchSession(e,t={}){if(this.busy){this.sessionSelect.value=this.activeSessionId,new Y.Notice("Finish or cancel the current response before switching chats.");return}!e||e===this.activeSessionId||(t.skipSave||await this.saveHistory(),this.activeSessionId=e,await this.plugin.setActiveChatSessionId(e),await this.loadSessions(),await this.loadHistory(),await this.renderAll())}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();let e=new Set(this.messages.map(t=>t.id));for(let t of Array.from(this.pendingThinking))e.has(t)||this.pendingThinking.delete(t);for(let t of this.messages)await this.renderMessage(t);this.scrollToBottom()}async renderMessage(e){let t=this.messagesEl.createDiv({cls:`zrr-chat-message zrr-chat-${e.role}`}),n=t.createDiv({cls:"zrr-chat-meta-row"});n.createDiv({cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Zotero Assistant");let i=n.createDiv({cls:"zrr-chat-message-actions"}),a=i.createEl("button",{cls:"zrr-chat-message-copy zrr-chat-icon-button",attr:{title:"Copy this message","aria-label":"Copy this message"}});(0,Y.setIcon)(a,"copy"),a.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.copyMessage(e)});let s=i.createEl("button",{cls:"zrr-chat-message-delete zrr-chat-icon-button",attr:{title:"Delete this message","aria-label":"Delete this message"}});(0,Y.setIcon)(s,"trash-2"),s.addEventListener("click",c=>{c.preventDefault(),c.stopPropagation(),this.deleteMessage(e.id)});let o=t.createDiv({cls:"zrr-chat-content"}),l=t.createDiv({cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:t,content:o,citations:l}),await this.renderMessageContent(e)}async copyMessage(e){var r,i,a;let n=(await this.plugin.formatInlineCitations(e.content||"",(r=e.citations)!=null?r:[],(i=e.retrieved)!=null?i:[])||"").trim();if(!n){new Y.Notice("Nothing to copy.");return}if(!((a=navigator.clipboard)!=null&&a.writeText)){new Y.Notice("Clipboard API unavailable. Select text to copy.");return}try{await navigator.clipboard.writeText(n),new Y.Notice("Message copied to clipboard.")}catch(s){console.error("Failed to copy message",s),new Y.Notice("Failed to copy message.")}}async deleteMessage(e){let t=this.messages.findIndex(a=>a.id===e);if(t===-1||!await this.confirmDeleteMessage())return;this.messages.splice(t,1);let r=this.messageEls.get(e);r&&r.wrapper.remove(),this.messageEls.delete(e);let i=this.pendingRender.get(e);i!==void 0&&(activeWindow.clearTimeout(i),this.pendingRender.delete(e)),this.pendingThinking.delete(e),await this.saveHistory()}async confirmDeleteMessage(){return new Promise(e=>{new Ct(this.app,e).open()})}scheduleRender(e){if(this.pendingRender.has(e.id))return;let t=activeWindow.setTimeout(()=>{this.pendingRender.delete(e.id),this.renderMessageContent(e).then(()=>{this.scrollToBottom()})},80);this.pendingRender.set(e.id,t)}async renderMessageContent(e){var i,a,s;let t=this.messageEls.get(e.id);if(!t)return;if(e.role==="assistant"&&!e.content.trim()&&this.pendingThinking.has(e.id)){t.content.dataset.lastRendered!=="__thinking__"&&(t.content.empty(),this.renderThinkingIndicator(t.content),t.content.dataset.lastRendered="__thinking__"),t.citations.empty();return}let r=await this.plugin.formatInlineCitations(e.content||"",(i=e.citations)!=null?i:[],(a=e.retrieved)!=null?a:[]);t.content.dataset.lastRendered!==r&&(t.content.empty(),await Y.MarkdownRenderer.render(this.app,r,t.content,"",this),this.hookInternalLinks(t.content),t.content.dataset.lastRendered=r),t.citations.empty(),await this.renderCitations(t.citations,(s=e.citations)!=null?s:[])}renderThinkingIndicator(e){let t=e.createDiv({cls:"zrr-chat-thinking"});t.setAttr("role","status"),t.setAttr("aria-live","polite"),t.createSpan({cls:"zrr-chat-thinking-spinner"}),t.createSpan({cls:"zrr-chat-thinking-text",text:"Thinking"});let n=t.createSpan({cls:"zrr-chat-thinking-dots"});n.createSpan(),n.createSpan(),n.createSpan()}hookInternalLinks(e){let t=e.querySelectorAll("a.internal-link");for(let n of Array.from(t))n.dataset.zrrBound!=="1"&&(n.dataset.zrrBound="1",this.registerDomEvent(n,"click",r=>{r.preventDefault();let i=n.getAttribute("data-href")||n.getAttribute("href")||"";i&&this.plugin.openInternalLinkInMain(i)}))}async renderCitations(e,t){if(e.empty(),!t.length)return;let n=e.createEl("details",{cls:"zrr-chat-citations-details"});n.createEl("summary",{text:`Relevant context sources (${t.length})`,cls:"zrr-chat-citations-summary"});let r=n.createEl("ul",{cls:"zrr-chat-citation-list"});for(let i of t){let a=await this.plugin.resolveCitationDisplay(i),s=r.createEl("li"),o=`${a.noteTitle} p. ${a.pageLabel}`;s.createEl("a",{text:o,href:"#"}).addEventListener("click",c=>{c.preventDefault(),this.plugin.openCitationTarget(i,a)}),i.annotation_key&&s.createSpan({text:"Annotation",cls:"zrr-chat-citation-badge"})}}async copyChatToNote(){var r;let t=(await this.plugin.listChatSessions()).find(i=>i.id===this.activeSessionId),n=(r=t==null?void 0:t.name)!=null?r:"New chat";await this.plugin.createChatNoteFromSession(this.activeSessionId,n,this.messages)}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}updateSendButtonState(){if(this.sendButton){if(this.updateSessionControlsState(),this.busy){this.sendButton.disabled=this.cancelPending,(0,Y.setIcon)(this.sendButton,this.cancelPending?"loader-2":"square"),this.sendButton.setAttr("aria-label",this.cancelPending?"Canceling...":"Cancel response"),this.sendButton.setAttr("title",this.cancelPending?"Canceling...":"Cancel response");return}this.sendButton.disabled=!1,(0,Y.setIcon)(this.sendButton,"send"),this.sendButton.setAttr("aria-label","Send message"),this.sendButton.setAttr("title","Send message")}}isCancellationError(e){let n=(e instanceof Error?e.message:typeof e=="string"?e:"").toLowerCase();return n.includes("request canceled")||n.includes("request cancelled")||n.includes("request aborted")||n.includes("python worker request aborted")||n.includes("client_disconnected")}async handleSendButtonClick(){if(this.busy){if(this.cancelPending)return;this.cancelPending=!0,this.updateSendButtonState(),this.plugin.cancelActiveRagQuery()||(this.cancelPending=!1,this.updateSendButtonState());return}await this.handleSend()}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new Y.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new Y.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.clearMentionPickerDebounce(),this.closeMentionOverlay(),this.busy=!0,this.cancelPending=!1,this.updateSendButtonState();let t={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom(),await this.saveHistory();let n={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(n),this.pendingThinking.add(n.id),await this.renderMessage(n),this.scrollToBottom();let r=!1,i=!1,a=this.plugin.getRecentChatHistory(this.messages.slice(0,-2));try{await this.plugin.runRagQueryStreaming(e,s=>{this.pendingThinking.delete(n.id),r=!0,n.content+=s,this.scheduleRender(n)},s=>{if(this.pendingThinking.delete(n.id),s!=null&&s.canceled){i=!0,!r&&!n.content.trim()&&(n.content=typeof(s==null?void 0:s.answer)=="string"&&s.answer.trim()?s.answer:"Request canceled."),this.scheduleRender(n);return}(!r&&(s!=null&&s.answer)||s!=null&&s.answer)&&(n.content=s.answer),Array.isArray(s==null?void 0:s.citations)&&(n.citations=s.citations),Array.isArray(s==null?void 0:s.retrieved)&&(n.retrieved=s.retrieved),this.scheduleRender(n)},a)}catch(s){console.error(s),this.pendingThinking.delete(n.id),i||this.isCancellationError(s)?!r&&!n.content.trim()&&(n.content="Request canceled."):n.content="Failed to fetch answer. See console for details.",this.scheduleRender(n)}finally{this.pendingThinking.delete(n.id),this.busy=!1,this.cancelPending=!1,this.updateSendButtonState(),await this.saveHistory()}}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}scheduleZoteroMentionPicker(){if(this.busy){this.closeMentionOverlay();return}let e=this.getMentionContextAtCursor();if(e&&e.query.length===0){this.clearMentionPickerDebounce(),this.updateMentionSuggestions();return}this.clearMentionPickerDebounce(),this.mentionDebounceHandle=activeWindow.setTimeout(()=>{this.mentionDebounceHandle=null,this.updateMentionSuggestions()},180)}clearMentionPickerDebounce(){this.mentionDebounceHandle!==null&&(activeWindow.clearTimeout(this.mentionDebounceHandle),this.mentionDebounceHandle=null)}getMentionContextAtCursor(){var d;let e=this.inputEl.value,t=(d=this.inputEl.selectionStart)!=null?d:e.length,n=e.slice(0,t),r=e.slice(t),i=n.search(/\S+$/),a=i===-1?t:i,s=r.search(/\s/),o=s===-1?e.length:t+s,l=e.slice(a,o);if(!l||!l.startsWith("@"))return null;let c=l.slice(1).trim();return{from:a,to:o,query:c}}async updateMentionSuggestions(){if(this.busy){this.closeMentionOverlay();return}let e=this.getMentionContextAtCursor();if(!e){this.closeMentionOverlay();return}let t=++this.mentionQuerySequence;try{let n=await this.searchIndexedMentionItems(e.query);if(t!==this.mentionQuerySequence)return;this.mentionContext=e,this.mentionSuggestions=n,this.mentionSelectedIndex=0,this.renderMentionOverlay()}catch(n){console.error("Failed to fetch mention suggestions",n),this.closeMentionOverlay()}}async searchIndexedMentionItems(e){return this.plugin.searchIndexedZoteroItems(e.trim(),8)}getMentionIconName(e){var n,r;let t=typeof((n=e.data)==null?void 0:n.itemType)=="string"?e.data.itemType.trim():"";return(r=Un[t])!=null?r:"file-text"}insertSelectedMention(e,t){var c;let n=Re(e),i=(typeof((c=e.data)==null?void 0:c.title)=="string"?e.data.title.trim():"")||"Untitled",a=n?`"${i}" (doc_id ${n})`:`"${i}"`,s=this.inputEl.value,o=`${s.slice(0,t.from)}${a}${s.slice(t.to)}`;this.inputEl.value=o;let l=t.from+a.length;this.inputEl.setSelectionRange(l,l),this.inputEl.focus(),this.closeMentionOverlay()}createMentionOverlay(){this.mentionOverlayEl=this.inputWrapEl.createDiv({cls:"zrr-chat-mention-overlay"}),this.mentionOverlayEl.setAttr("role","listbox"),this.mentionOverlayEl.setAttr("aria-label","Indexed Zotero citation suggestions"),this.mentionListEl=this.mentionOverlayEl.createDiv({cls:"zrr-chat-mention-list"}),this.mentionEmptyEl=this.mentionOverlayEl.createDiv({cls:"zrr-chat-mention-empty",text:"No indexed Zotero notes found."}),this.closeMentionOverlay()}renderMentionOverlay(){if(!this.mentionOverlayEl||!this.mentionListEl||!this.mentionEmptyEl||!this.mentionContext)return;this.mentionListEl.empty();let e=this.mentionSuggestions.length>0;if(this.mentionEmptyEl.toggleClass("is-visible",!e),!e){this.mentionOverlayEl.addClass("is-open");return}this.mentionSuggestions.forEach((t,n)=>{var d,p;let r=this.mentionListEl.createDiv({cls:"zrr-chat-mention-item"});n===this.mentionSelectedIndex&&r.addClass("is-active"),r.setAttr("role","option"),r.setAttr("aria-selected",n===this.mentionSelectedIndex?"true":"false");let i=r.createSpan({cls:"zrr-chat-mention-icon"});(0,Y.setIcon)(i,this.getMentionIconName(t));let a=r.createDiv({cls:"zrr-chat-mention-text"}),s=typeof((d=t.data)==null?void 0:d.title)=="string"&&t.data.title.trim()?t.data.title.trim():"Untitled";a.createDiv({cls:"zrr-chat-mention-title",text:s});let o=Re(t),l=typeof((p=t.data)==null?void 0:p.itemType)=="string"?t.data.itemType.trim():"",c=[o?`doc_id ${o}`:"No doc_id"];l&&c.push(l),a.createDiv({cls:"zrr-chat-mention-meta",text:c.join(" - ")}),r.addEventListener("mousedown",_=>{_.preventDefault(),_.stopPropagation(),this.mentionContext&&this.insertSelectedMention(t,this.mentionContext)})}),this.mentionOverlayEl.addClass("is-open")}closeMentionOverlay(){this.mentionSuggestions=[],this.mentionSelectedIndex=0,this.mentionContext=null,this.mentionOverlayEl&&this.mentionOverlayEl.removeClass("is-open")}handleMentionOverlayKeydown(e){var t,n;if(!((t=this.mentionOverlayEl)!=null&&t.hasClass("is-open"))||!this.mentionContext)return e.key==="Escape"&&this.closeMentionOverlay(),!1;if(e.key==="ArrowDown")return e.preventDefault(),this.mentionSuggestions.length>0&&(this.mentionSelectedIndex=(this.mentionSelectedIndex+1)%this.mentionSuggestions.length,this.renderMentionOverlay()),!0;if(e.key==="ArrowUp")return e.preventDefault(),this.mentionSuggestions.length>0&&(this.mentionSelectedIndex=(this.mentionSelectedIndex-1+this.mentionSuggestions.length)%this.mentionSuggestions.length,this.renderMentionOverlay()),!0;if(e.key==="Enter"||e.key==="Tab"){if(this.mentionSuggestions.length===0)return!1;e.preventDefault();let r=(n=this.mentionSuggestions[this.mentionSelectedIndex])!=null?n:this.mentionSuggestions[0];return!r||!this.mentionContext||this.insertSelectedMention(r,this.mentionContext),!0}return e.key==="Escape"?(e.preventDefault(),this.closeMentionOverlay(),!0):!1}},vt=class extends Y.Modal{constructor(u,e,t){super(u),this.initialValue=e,this.onSubmit=t}onOpen(){let{contentEl:u}=this;u.empty(),u.addClass("zrr-chat-rename-modal"),u.createEl("h3",{text:"Rename chat"});let e=this.initialValue;new Y.Setting(u).setName("Name").addText(i=>{i.setValue(e),i.onChange(a=>{e=a})});let t=u.createDiv();t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-gap-0-5rem"),t.addClass("zrr-u-margin-top-1rem"),t.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),t.createEl("button",{text:"Save"}).addEventListener("click",()=>{let i=e.trim();if(!i){new Y.Notice("Name cannot be empty.");return}this.close(),Promise.resolve(this.onSubmit(i))})}},Pt=class extends Y.Modal{constructor(u,e,t){super(u),this.chatName=e,this.onConfirm=t}onOpen(){let{contentEl:u}=this;u.empty(),u.createEl("h3",{text:"Delete chat"}),u.createEl("p",{text:`Delete "${this.chatName}"? This cannot be undone.`});let e=u.createDiv();e.addClass("zrr-u-display-flex"),e.addClass("zrr-u-gap-0-5rem"),e.addClass("zrr-u-margin-top-1rem"),e.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),e.createEl("button",{text:"Delete"}).addEventListener("click",()=>{this.close(),Promise.resolve(this.onConfirm())})}},Ct=class extends Y.Modal{constructor(e,t){super(e);this.resolved=!1;this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Delete message"}),e.createEl("p",{text:"Delete this message? This cannot be undone."});let t=e.createDiv();t.addClass("zrr-u-display-flex"),t.addClass("zrr-u-gap-0-5rem"),t.addClass("zrr-u-margin-top-1rem"),t.createEl("button",{text:"Cancel"}).addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),t.createEl("button",{text:"Delete"}).addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}};var At=[{version:"0.10.1",markdown:"- Update the Zotero Research Assistant Companion add-on to `0.1.5`.\n- Extend companion compatibility to Zotero `9.*` by raising the add-on `strict_max_version` from `8.*` to `9.*`.\n- Refresh the companion update manifest/hash for the rebuilt `zrr-companion.xpi`."},{version:"0.10.0",markdown:`- Add optional follow-up query rewriting for retrieval:
  - new \`Rewrite follow-up queries\` setting rewrites the current chat turn into a standalone retrieval query using recent chat history,
  - the rewritten query is used for retrieval, query expansion, reranking, and annotation lookup,
  - the original user wording is still preserved for answer generation.
- Improve chat-session safety while a response is streaming:
  - disable switching, renaming, deleting, and creating chat sessions while the current response is still in flight,
  - show clearer notices when a session action is blocked until the response is finished or canceled.
- Improve chat request parsing and docs:
  - preserve streamed whitespace more reliably when parsing chat/responses payloads,
  - document follow-up query rewriting in the README, chat-panel docs, retrieval-ranking docs, and settings reference.`},{version:"0.9.28",markdown:`- Surface import timeout budgeting more clearly during Docling imports:
  - compute a page-aware timeout budget up front,
  - show a notice with the chosen timeout budget before running the import worker,
  - log the same budget details to the console for troubleshooting.
- Bundle the new \`pdf_page_count.py\` helper into generated tool assets so packaged/plugin builds include the page-count utility used for timeout scaling.`},{version:"0.9.27",markdown:`- Scale Docling/import worker timeouts with PDF length:
  - add a small PDF page-count helper to estimate document size before import,
  - increase the worker timeout automatically for longer PDFs while keeping sensible minimum and maximum caps.
- Improve LM Studio tagging/cleanup error handling:
  - detect unloaded LM Studio tagging models more explicitly,
  - show targeted notices for imports, reindexing, and tag generation instead of generic embedding-provider failures.
- Improve Hunspell dictionary discovery and caching for Docling cleanup:
  - search both bundled and temp-cache Hunspell directories,
  - download fallback dictionaries into a shared cache directory instead of the bundled tools folder.`},{version:"0.9.26",markdown:"- Improve LM Studio compatibility for chat requests and title generation:\n  - use the `/responses` API automatically for LM Studio chat/title requests when appropriate,\n  - fall back to classic chat completions when the responses endpoint is unavailable,\n  - parse streamed and non-streamed response payloads more robustly.\n- Add LM Studio-aware context budgeting for chat:\n  - inspect local model metadata to estimate context length,\n  - trim oversized prompts/context blocks automatically,\n  - pass explicit output-token budgets to reduce context-overflow failures.\n- Add cleanup reasoning-mode controls for LLM cleanup:\n  - new `Cleanup reasoning mode` setting with `Automatic`, `Reasoning on`, and `Reasoning off`,\n  - in automatic mode, learn the preferred LM Studio native cleanup reasoning mode per provider/model and reprobe it every 30 days."},{version:"0.9.25",markdown:`- Improve provider rate-limit handling across chat and indexing workflows:
  - detect common 429 / quota-exceeded failures more reliably,
  - show explicit retry messages for chat provider limits and embedding provider limits,
  - stop treating embedding rate limits as generic provider failures during imports, reindexing, and chat-triggered rebuilds.
- Tighten RAG query typing by introducing a dedicated final-payload type for streamed chat responses.
- Harden Zotero item and PDF attachment helpers:
  - normalize object access through safe record coercion instead of loose unknown-property reads,
  - validate PDF attachment keys more strictly before use,
  - keep citekey, short-title, creator-name, and attachment-path extraction logic working against more heterogeneous payload shapes.`},{version:"0.9.24",markdown:"- Add chat export post-processing controls:\n  - new `Chat export template` setting to wrap copied chat notes in an optional vault template,\n  - support `{{chat_title}}`, `{{chat_created_at}}`, and `{{chat_body}}` placeholders,\n  - new `Chat export post-create command` setting to run a user-selected command after the copied chat note is created and opened.\n- Improve copied-chat export behavior:\n  - if the template omits `{{chat_body}}`, keep the transcript first so downstream templater workflows can operate on the full note body,\n  - activate the freshly created note before running any configured post-create command.\n- Clean up the chunk-citation implementation by removing the unused native `^zrr-chunk-...` export path and keeping plugin-driven `#zrr-chunk:` jumps as the only page/section citation mechanism.\n- Minor chat UI and code-quality follow-up:\n  - reduce mention picker text sizing slightly for better readability,\n  - enforce `@typescript-eslint/require-await` and remove the unnecessary async `onClose()` implementation in the chat view."},{version:"0.9.23",markdown:"- Fix chat `@` suggestion icons to reflect Zotero item types instead of always showing a book icon.\n- Improve indexed `@` mention search reliability for metadata queries (especially `citekey`) by:\n  - searching indexed metadata snapshots in addition to cached Zotero item payloads,\n  - normalizing mention queries (leading `@` and surrounding punctuation) before scoring,\n  - improving ranking so citekey and metadata hits surface more consistently."},{version:"0.9.22",markdown:"- Improve chat citation insertion with an inline `@` picker overlay inside the chat textarea (no separate modal required).\n- Add indexed-only citation suggestions for `@` mentions so results are limited to already indexed Zotero items.\n- Expand mention triggering behavior:\n  - trigger suggestions for `@` followed by any token,\n  - open the picker immediately when only `@` is typed,\n  - show recent indexed suggestions even before a first search character is entered.\n- Add keyboard interaction for the overlay picker (Arrow Up/Down, Enter/Tab to insert, Escape to close).\n- Add follow-up lint hardening for suggest modal prefill callbacks to satisfy no-floating-promises checks."},{version:"0.9.21",markdown:`- Make Zotero PDF imports transactional and self-cleaning:
  - stage item cache, chunk cache, synced note, and vault-copied PDFs under temporary paths during import,
  - replace final files only after note finalization succeeds,
  - clean up staged/incomplete files plus Redis chunk keys when Docling extraction, indexing, or final note assembly fails or times out.
- Extend cleanup for note deletion and failed imports:
  - remove vault-local copied PDFs associated with a doc when deleting a note/cache bundle,
  - add timeout-aware import failure notices and failed-import Redis cleanup.
- Improve Docling PDF handling:
  - detect born-digital text layers more reliably and skip unnecessary OCR post-processing for them,
  - sanitize \`docling_config.json\` by removing GUI/runtime-managed keys on read/write so persisted config stays portable,
  - add explicit \`--no-llm-cleanup\` CLI support when LLM cleanup is disabled.
- Add regression tests for Docling config filtering and born-digital post-processing decisions.`},{version:"0.9.20",markdown:`- Harden Docling LLM cleanup against repeated slow/failing requests:
  - add a total cleanup time budget so LLM cleanup disables itself after spending too much wall-clock time across chunks,
  - cap each cleanup request timeout to the remaining cleanup budget,
  - disable further cleanup calls after timeout failures instead of retrying the same failure mode on later chunks.
- Improve Python error surfacing by collapsing noisy process stderr into shorter diagnostics that preserve the most relevant traceback/error lines.
- Reduce noisy warning logs for optional network lookups (model discovery, Zotero Web API group/user resolution, annotation item fetches) by downgrading expected offline/network-unavailable failures to debug logging.
- Add regression tests covering LLM cleanup timeout handling and cleanup-budget exhaustion.`},{version:"0.9.19",markdown:"- Restore copied-chat chunk citation jumps without relying on native Obsidian block refs:\n  - exported chat notes now keep legacy `#zrr-chunk:` wiki-links for page/section chunk citations,\n  - regular rendered markdown notes intercept those legacy links and route them through the plugin's existing chunk-marker jump logic.\n- Add live preview support for legacy chunk citation jumps by intercepting `#zrr-chunk:` wiki-links from the CodeMirror editor surface and opening the target chunk directly.\n- Improve internal-link resolution for copied chat-note citations by resolving relative wiki-links against the current note source path during custom navigation."},{version:"0.9.18",markdown:`- Replace the bundled Redis image with \`redis/redis-stack:7.4.0-v8\` so new and recreated local stacks include Redis Insight.
- Add multi-vault-safe Redis Insight host-port handling by deriving the Insight port alongside the Redis and Python worker ports during auto-assign.
- Add a conservative Redis refresh workflow:
  - new command palette action **Recreate redis stack (pull configured image)**,
  - new **Maintenance -> Redis indexing -> Recreate redis stack** button,
  - the recreate action pulls the configured Redis image and force-recreates only the \`redis-stack\` service.
- Update Docker and startup docs for Redis Insight availability and the new recreate flow.`},{version:"0.9.17",markdown:`- Fix right-sidebar PDF sync recovery after the sidebar tab is closed:
  - manual PDF sync now reuses only real PDF leaves instead of hijacking unrelated sidebar tabs or spawning empty leaves/splits,
  - sidebar recovery now coerces fallback leaves into a PDF view before opening the target file/page.
- Improve manual PDF sync UX:
  - make **Sync PDF view in right sidebar for current note** resolve the current Markdown note reliably even when focus is in another pane or the command palette,
  - make both the command and the ribbon button reveal the right-sidebar PDF view after syncing.
- Add a dedicated PDF ribbon button for one-click sidebar recovery and update docs for the new recovery path.`},{version:"0.9.16",markdown:"- Fix metadata sync coverage for publication container fields by adding full bidirectional sync support for:\n  - `publication_title` (`publicationTitle` in Zotero),\n  - `book_title` (`bookTitle` in Zotero),\n  - `journal_abbrev` (`journalAbbreviation` in Zotero).\n- Include these fields in metadata conflict/snapshot tracking and one-sided auto-create note -> Zotero behavior.\n- Update docs to reflect the expanded synced metadata set and recognized YAML key variants."},{version:"0.9.15",markdown:"- Add chunk-cache self-healing for note-based reindexing:\n  - when `.zotero-redisearch-rag/chunks/<doc_id>.json` is missing but the note still contains `zrr:sync` / `zrr:chunk` markers, the plugin rebuilds chunk cache JSON directly from the note and continues reindexing.\n- Apply the same fallback during note-save sync, so incremental chunk updates keep working after accidental cache file deletion.\n- Preserve chunk marker metadata while restoring cache (chunk ID, page number, exclude flag, section marker), and refresh `doc_index` note path/title plus available PDF/attachment metadata."},{version:"0.9.14",markdown:`- Fix repeated empty right-sidebar tab creation when opening Zotero notes:
  - prevent automatic PDF sidebar sync from creating new sidebar leaves,
  - reuse existing right-sidebar/PDF leaves only during background sync,
  - reserve leaf creation for the manual command **Sync PDF view in right sidebar for current note**.
- Harden right-sidebar leaf detection to use passive leaf iteration instead of \`getRightLeaf(...)\` during auto-sync paths.`},{version:"0.9.13",markdown:"- Add release quality gates for plugin publishing:\n  - add ESLint flat config for TypeScript source checks,\n  - add `npm run lint:changed` helper for fast changed-file linting,\n  - enforce `npm run lint` as part of `npm run package-release`.\n- Add a dedicated manifest validator (`npm run validate:manifest`) and enforce it in `package-release` before build/package steps.\n- Fix minor citation label sanitization escaping to satisfy lint while preserving wiki-link safety."},{version:"0.9.12",markdown:"- Fix broken chunk citation wiki-links by writing proper Obsidian link label delimiters (`|`) instead of escaped `\\|` in generated inline citations and exported chat notes.\n- Improve legacy citation compatibility by normalizing malformed chunk anchors (`#zrr-chunk:...\\\\|...`) before rendering and by extracting chunk IDs robustly when opening links.\n- Fix citation/link resolution edge cases for note titles ending in whitespace:\n  - harden filename sanitization to strip trailing spaces/dots after truncation,\n  - sanitize reused basename sources from existing `note_path` / `pdf_path`,\n  - keep exact internal-link path resolution with trimmed fallbacks for legacy files."},{version:"0.9.11",markdown:"- Fix annotation-sync safety when Zotero annotation fetch is incomplete by preserving existing annotation chunks and skipping delete reindex operations in fetch-error states.\n- Fix PDF sidebar sync for newly imported notes by re-triggering sidebar sync after `doc_index` updates.\n- Improve PDF sidebar reliability by triggering pending sync on note-open and adding a manual command: **Sync PDF view in right sidebar for current note**.\n- Add compatibility mapping for legacy worker paths (`/workspace/vault/...`) to vault-relative paths so existing `doc_index.json` entries resolve in desktop Obsidian."},{version:"0.9.1",markdown:"- Rebrand the plugin display name to **Zotero Research Assistant** across Obsidian UI labels and user-facing docs.\n- Rename chat UI labels and command text to match the new product name.\n- Rebrand the Zotero add-on package to **Zotero Research Assistant Companion** in the add-on manifest and preferences pane.\n- Publish companion add-on update `0.1.4` and refresh `zotero-companion/updates.json` hash for update distribution."},{version:"0.9.0",markdown:`- Make Python worker runtime the graceful default path for legacy installs, with one-time migration and preserved local settings.
- Fix runtime-specific stack startup so **Start Redis stack** brings up only services required by the selected runtime.
- Refactor RAG reranking performance in worker mode:
  - run \`rag_query_redisearch.py\` in-process inside \`python-worker\`,
  - keep cross-encoder reranker models warm across requests via in-worker cache,
  - add reranker and stream phase/timing telemetry.
- Improve worker streaming control:
  - add request-id based worker cancel endpoint,
  - wire chat cancel to worker request cancel for long-running requests.
- Improve reranker model setup UX with multilingual presets plus explicit **Custom** model support.
- Add advanced gating for local runtime controls:
  - new **Advanced Python runtime options** toggle in Prerequisites,
  - hide local-only fields by default,
  - auto-switch back to worker if advanced options are turned off while local runtime is active.
- Add explicit legacy local opt-in paths:
  - **Maintenance -> Python Runtime -> Use local runtime (legacy)**,
  - command palette: **Switch Python runtime to local (legacy)**.
- Update docs and README for worker-first runtime UX and migration behavior.`},{version:"0.8.4",markdown:"- Fix the **What's New** splash title and layout:\n  - use a generic `What's new` header,\n  - keep a single visible version heading (`vX.Y.Z`) without duplicate internal release-title lines.\n- Fix release-notes sanitization so `Full Changelog` lines are removed even when formatted as markdown links or styled text.\n- Fix `ReleaseNotesModal` markdown rendering type-safety by using an Obsidian `Component` lifecycle owner instead of passing the modal instance.\n- Move **Maintenance -> Release Notes** to the end of the Maintenance settings section."},{version:"0.8.3",markdown:"- Add a versioned bundled release-notes log and show all changes between the previously seen plugin version and the current version.\n- Add a manual **Maintenance -> Release Notes -> Show** button to reopen the **What's New** splash on demand.\n- Strip per-release `Full Changelog:` lines from bundled notes and show one canonical link to the full changelog in the splash footer.\n- Improve release-note bundling by merging GitHub Release notes history (with local fallback) into the generated `releaseNotes.ts` log."},{version:"0.8.2",markdown:"- Generate bundled **What's New** content automatically from the GitHub Release body during the release workflow.\n- Render **What's New** content as Markdown so release notes formatting is preserved.\n- Store only the current release's bundled notes instead of maintaining a full in-repo version history map.\n- Package cleanup:\n  - exclude `.DS_Store` from release archives,\n  - remove tracked Python `__pycache__` artifacts,\n  - remove obsolete root `ocr_wordlist.txt`."},{version:"0.8.1",markdown:"- Add an automatic **What's New** splash modal shown once after plugin version updates, backed by bundled versioned release notes."},{version:"0.8.0",markdown:"- Add optional **agentic retrieval** mode with a lightweight planner step before answer generation.\n- Add agentic retrieval actions:\n  - keep current context,\n  - run an expansion retry retrieval pass,\n  - pull full-document chunks for whole-document synthesis queries.\n- Add agentic controls in settings (`Enable agentic retrieval`, `Agentic max iterations`).\n- Extend RAG tool output with `agentic_mode` and `agentic_trace` for debugging and tuning.\n- Add an animated **Thinking** indicator in the assistant bubble before streaming starts.\n- Update docs for retrieval tuning and chat panel behavior."},{version:"0.7.0",markdown:`- Add Python worker runtime architecture as the recommended path, with Redis and Python running as separate compose services.
- Route Python execution through the worker container in worker mode, including path mapping, worker readiness checks, and worker startup helpers.
- Improve worker reliability:
  - fix requirements path resolution and add fallback handling in worker entrypoint,
  - rebuild worker image automatically on worker startup,
  - remove home-directory mount to avoid Docker home-sharing prompts.
- Improve worker networking compatibility by mapping local loopback provider URLs for container execution.
- Add configurable Tesseract language pack installation in the worker image (default: \`eng deu fra spa ita nld por pol swe\`).
- Keep local Python fallback mode while disabling/greying local-only Python settings when worker runtime is selected.
- Update docs for worker-first setup, OCR dependencies, Docker setup, and troubleshooting.
- PDF sidebar sync stability fixes:
  - serialize/queue sidebar PDF page jumps and retry once on PDF.js \`injectLinkAnnotations\` render-order race,
  - stop forcing active-leaf switching during sidebar sync to avoid triggering incompatible active-leaf handlers in other plugins.`}];var dn={en:"eng",de:"deu",fr:"fra",es:"spa",it:"ita",nl:"nld",pt:"por",pl:"pol",sv:"swe"},Vn=Qe["zrr-picker"],Bn=Qe["zrr-chat"],pn=Qe["zrr-pdf"],he="redis-stack",ut="python-worker",Zn="/workspace/plugin",un="/workspace/vault",Gn="127.0.0.1",Wn=7379,Hn=1e3,xn=8001,Kn=xn-6379,Jn=48,Xn=32e3,Qn=180,Yn=120,_n=90,gn=900,er=12,tr=10800,nr=30,mn=80,hn=12e4,rr=720*60*60*1e3,ir=/<!--\s*zrr:annotations-start\b[^>]*-->/i,ar=/<!--\s*zrr:annotations-end\s*-->/i,fn=["doc_id","zotero_key","zotero_link","item_link","item_key","citekey","title","short_title","date","year","year_number","authors","editors","aliases","tags","collection_title","collection_titles","collections","collections_links","item_type","creator_summary","publication_title","book_title","journal_abbrev","volume","issue","pages","date_added","date_modified","doi","isbn","issn","publisher","place","url","language","abstract","pdf_link","item_json"],_t=class extends h.Plugin{constructor(){super(...arguments);this.docIndex=null;this.metadataSnapshotCache=null;this.annotationSnapshotCache=null;this.lastPythonEnvNotice=null;this.lastContainerNotice=null;this.lastZoteroApiNotice=null;this.lastRedisNotice=null;this.pythonWorkerRequestSeq=0;this.noteSyncTimers=new Map;this.noteSyncInFlight=new Set;this.noteSyncPending=new Set;this.noteSyncPendingDeletes=new Map;this.noteSyncSuppressed=new Set;this.noteMetadataSyncTimers=new Map;this.noteMetadataSyncInFlight=new Set;this.noteMetadataSyncPending=new Set;this.noteMetadataSyncSuppressed=new Set;this.noteAnnotationSyncTimers=new Map;this.noteAnnotationSyncInFlight=new Set;this.noteAnnotationSyncPending=new Set;this.noteAnnotationSyncSuppressed=new Set;this.annotationNoteEditTimes=new Map;this.missingDocIdWarned=new Set;this.annotationWebApiWarned=new Set;this.collectionTitleCache=new Map;this.recreateMissingNotesActive=!1;this.recreateMissingNotesAbort=!1;this.recreateMissingNotesProcess=null;this.reindexCacheActive=!1;this.activeChatQueryProcess=null;this.activeChatQueryCancelRequested=!1;this.lastReindexFailure=null;this.lastRedisSearchTerm="";this.hadSavedSettingsData=!1;this.pendingPythonRuntimeMigrationNotice=null}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new Ke(this.app,this)),this.pdfSidebar=new Xe({app:this.app,iconSvg:pn,resolveDocIdForNote:this.resolveDocIdForNote.bind(this),getDocIndexEntry:this.getDocIndexEntry.bind(this),hydrateDocIndexFromCache:this.hydrateDocIndexFromCache.bind(this),toVaultRelativePath:this.toVaultRelativePath.bind(this),normalizeChunkIdForNote:this.normalizeChunkIdForNote.bind(this),readChunkPayload:this.readChunkPayload.bind(this)},{extractDocIdFromDoc:We,findChunkStartLineInDoc:gt,parseChunkMarkerLine:Ge,extractFirstChunkMarkerFromContent:It}),this.registerRibbonIcons(),this.registerView(Le,e=>new ze(e,this)),this.setupStatusBar(),this.registerNoteRenameHandler(),this.registerNoteSyncHandler(),this.registerNoteOpenHandler(),this.registerAnnotationFocusSyncHandler(),this.registerPreviewScrollSyncHandlers(),this.registerNoteDeleteMenu(),this.registerEditorExtension($t(this)),this.registerEditorExtension(Ut(this)),this.registerEditorExtension(jt()),this.registerEditorExtension(this.pdfSidebar.createSyncExtension()),this.registerMarkdownPostProcessor((e,t)=>{this.hookChunkInternalLinks(e,t.sourcePath||"")});try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.autoDetectRedisOnLoad(),this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (docling -> redissearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (rag via redissearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open research assistant chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"sync-pdf-sidebar-current-note",name:"Sync PDF view in right sidebar for current note",callback:()=>this.syncPdfSidebarForActiveNote({revealSidebar:!0})}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (docling + redissearch)",callback:()=>this.rebuildNoteFromCache()}),this.addCommand({id:"rebuild-doc-index-cache",name:"Rebuild doc index from cache",callback:()=>this.rebuildDocIndexFromCache()}),this.addCommand({id:"recreate-missing-notes-cache",name:"Recreate missing notes from cache (docling + redissearch)",callback:()=>this.recreateMissingNotesFromCache()}),this.addCommand({id:"reindex-redis-from-cache",name:"Reindex redis from cached chunks",callback:()=>this.reindexRedisFromCache()}),this.addCommand({id:"reindex-current-note",name:"Reindex current note from cache",callback:()=>this.reindexCurrentNoteFromCache()}),this.addCommand({id:"drop-rebuild-redis-index",name:"Drop & rebuild redis index",callback:()=>this.dropAndRebuildRedisIndex()}),this.addCommand({id:"start-redis-stack",name:"Start redis stack (docker/podman compose)",callback:()=>this.startRedisStack()}),this.addCommand({id:"recreate-redis-stack",name:"Recreate redis stack (pull configured image)",callback:()=>this.recreateRedisStack()}),this.addCommand({id:"switch-python-runtime-local-legacy",name:"Switch python runtime to local (legacy)",callback:()=>this.switchPythonRuntimeToLocalLegacy()}),this.addCommand({id:"open-docling-log",name:"Open log file",callback:()=>this.openLogFile()}),this.addCommand({id:"clear-docling-log",name:"Clear log file",callback:()=>this.clearLogFile()}),this.addCommand({id:"toggle-zrr-chunk-delete",name:"Toggle zrr chunk exclude at cursor",editorCallback:e=>this.toggleChunkExclude(e)}),this.addCommand({id:"delete-zotero-note-cache",name:"Delete Zotero note and cached data",callback:()=>this.deleteZoteroNoteAndCache()}),this.addCommand({id:"search-redis-index",name:"Search redis index for term",callback:()=>this.searchRedisIndex()}),this.addCommand({id:"redis-diagnostics",name:"Show redis diagnostics",callback:()=>this.showRedisDiagnostics()}),this.addCommand({id:"zotero-companion-health",name:"Check Zotero companion status",callback:()=>this.checkZoteroCompanionHealth()}),this.addCommand({id:"zotero-open-addons",name:"Open Zotero add-ons",callback:()=>this.openZoteroAddons()}),this.addCommand({id:"purge-redis-orphans",name:"Purge redis orphaned chunks (missing cache files)",callback:()=>this.purgeRedisOrphanedKeys()}),this.maybeShowReleaseNotesModal(),this.autoDetectContainerCliOnLoad(),this.pendingPythonRuntimeMigrationNotice&&(new h.Notice(this.pendingPythonRuntimeMigrationNotice,9e3),this.pendingPythonRuntimeMigrationNotice=null),this.settings.autoStartRedis&&this.startRedisStack(!0)}async loadSettings(){var l,c,d;let e=(l=await this.loadData())!=null?l:{};this.hadSavedSettingsData=Object.keys(e).length>0;let t=Object.assign({},Je,e),n=e.pythonRuntime,r=n==null||n==="",i=!r&&n!=="worker"&&n!=="local",a=!!e.pythonRuntimeMigrationV1Done,s=!1;if(r||i)t.pythonRuntime="worker",s=!0;else if(!a&&n==="local"){let p=String((c=e.pythonPath)!=null?c:"").trim(),_=String((d=e.pythonEnvLocation)!=null?d:"").trim();!p&&(!_||_==="shared")&&(t.pythonRuntime="worker",s=!0)}t.pythonRuntimeMigrationV1Done=!0,s?this.pendingPythonRuntimeMigrationNotice="Python runtime was migrated to worker mode. Legacy local runtime settings were kept and can still be re-enabled in Settings.":this.pendingPythonRuntimeMigrationNotice=null;let o=e.showAdvancedPythonRuntimeOptions===void 0;o&&t.pythonRuntime==="local"&&(t.showAdvancedPythonRuntimeOptions=!0),t.preferObsidianNoteForCitations===void 0&&typeof e.preferVaultPdfForCitations=="boolean"&&(t.preferObsidianNoteForCitations=e.preferVaultPdfForCitations),this.settings=t,(!a||r||i||o)&&await this.saveData(this.settings)}async saveSettings(){await this.saveData(this.settings)}async switchPythonRuntimeToLocalLegacy(){let e=this.settings.pythonRuntime==="local";if(this.settings.pythonRuntime="local",this.settings.showAdvancedPythonRuntimeOptions=!0,await this.saveSettings(),e){new h.Notice("Local python runtime is already active.");return}new h.Notice("Switched to local python runtime (legacy). Open settings > prerequisites and run python environment > create/update.")}async maybeShowReleaseNotesModal(){let e=String(this.manifest.version||"").trim();if(!e)return;let t=String(this.settings.lastSeenReleaseNotesVersion||"").trim();if(!t&&!this.hadSavedSettingsData){this.settings.lastSeenReleaseNotesVersion=e,await this.saveSettings();return}if(t===e)return;let n=this.getReleaseNotesMarkdown(e,t||null);this.settings.lastSeenReleaseNotesVersion=e,await this.saveSettings(),new Me(this.app,e,n).open()}openReleaseNotesModal(){let e=String(this.manifest.version||"").trim();if(!e)return;let t=this.getReleaseNotesMarkdown(e,null);new Me(this.app,e,t).open()}normalizeReleaseVersion(e){return String(e||"").trim().replace(/^refs\/tags\//,"").replace(/^v/,"")}parseNumericReleaseVersion(e){let t=this.normalizeReleaseVersion(e);if(!t)return null;let n=t.split(".");if(!n.length)return null;let r=n.map(i=>Number.parseInt(i,10));return r.some(i=>!Number.isFinite(i))?null:r}compareReleaseVersions(e,t){var s,o;let n=this.normalizeReleaseVersion(e),r=this.normalizeReleaseVersion(t),i=this.parseNumericReleaseVersion(n),a=this.parseNumericReleaseVersion(r);if(i&&a){let l=Math.max(i.length,a.length);for(let c=0;c<l;c+=1){let d=(s=i[c])!=null?s:0,p=(o=a[c])!=null?o:0;if(d!==p)return d-p}return 0}return n.localeCompare(r,void 0,{numeric:!0,sensitivity:"base"})}isFullChangelogLine(e){return String(e||"").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/[*_`]/g,"").trim().toLowerCase().includes("full changelog")}sanitizeReleaseNotesMarkdown(e){return String(e||"").replace(/\r\n/g,`
`).split(`
`).filter(r=>!this.isFullChangelogLine(r)).join(`
`).replace(/\n{3,}/g,`

`).trim()}stripLeadingVersionHeading(e,t){let n=String(e||"").replace(/\r\n/g,`
`).split(`
`),r=n.findIndex(l=>l.trim().length>0);if(r<0)return"";let i=this.normalizeReleaseVersion(t);if(!i)return n.join(`
`).replace(/\n{3,}/g,`

`).trim();let a=i.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),s=n[r].replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/[*_`]/g,"").trim();if(!new RegExp(`^#{0,6}\\s*v?${a}(?:\\b|\\s|\\(|-)`,"i").test(s))return n.join(`
`).replace(/\n{3,}/g,`

`).trim();for(n.splice(r,1);r<n.length&&n[r].trim().length===0;)n.splice(r,1);return r<n.length&&/^[-=]{3,}\s*$/.test(n[r].trim())&&n.splice(r,1),n.join(`
`).replace(/\n{3,}/g,`

`).trim()}getBundledReleaseNotesEntries(){var r,i;let e=new Set,t=Array.isArray(At)?At:[],n=[];for(let a of t){let s=this.normalizeReleaseVersion(String((r=a==null?void 0:a.version)!=null?r:"")),o=this.sanitizeReleaseNotesMarkdown(String((i=a==null?void 0:a.markdown)!=null?i:""));!s||e.has(s)||(e.add(s),n.push({version:s,markdown:o}))}return n.sort((a,s)=>this.compareReleaseVersions(s.version,a.version))}getReleaseNotesMarkdown(e,t){let n=this.normalizeReleaseVersion(e);if(!n)return"";let r=this.normalizeReleaseVersion(t||""),i=this.getBundledReleaseNotesEntries(),a=i.filter(o=>this.compareReleaseVersions(o.version,n)>0?!1:r?this.compareReleaseVersions(o.version,r)>0:o.version===n),s=a.length?a:i.filter(o=>o.version===n);if(!s.length)return"This version includes improvements and fixes.";if(s.length===1){let o=s[0],l=this.stripLeadingVersionHeading(this.sanitizeReleaseNotesMarkdown(String(o.markdown||"")),o.version);return`### v${o.version}

${l||"This release includes improvements and fixes."}`}return s.map(o=>{let l=this.stripLeadingVersionHeading(this.sanitizeReleaseNotesMarkdown(String(o.markdown||"")),o.version)||"This release includes improvements and fixes.";return`### v${o.version}

${l}`}).join(`

`)}async importZoteroItem(){var M,J,W;try{await this.ensureBundledTools()}catch(I){new h.Notice("Failed to sync bundled tools. See console for details."),console.error(I);return}if(!await this.warnIfZoteroLocalApiUnavailable("import")&&!this.canUseWebApi())return;let t;try{t=await this.promptZoteroItem()}catch(I){new h.Notice("Zotero search failed. See console for details."),console.error(I);return}if(!t){new h.Notice("No Zotero item selected.");return}let n=(M=t.data)!=null?M:t;!n.key&&t.key&&(n.key=t.key);let r=Kt(n);if(!r){new h.Notice("Could not resolve a stable doc_ID from Zotero item.");return}let i=await this.resolveLanguageHint(n,(J=t.key)!=null?J:n.key),a=this.buildDoclingLanguageHint(i!=null?i:void 0),s=await qe(n,r,{fetchZoteroChildren:this.fetchZoteroChildren.bind(this)});if(!s){new h.Notice("No PDF attachment found for item.");return}if(this.showStatusProgress("Preparing...",5),!await this.ensureRedisAvailable("import")){this.clearStatusProgress();return}let o=typeof n.title=="string"?n.title:"",l=await this.getDocIndexEntry(r);l&&new h.Notice("Item already indexed. Updating cached files and index.");let c=this.sanitizeFileName(o)||r;if(l!=null&&l.note_path)c=this.sanitizeFileName(E.default.basename(l.note_path,".md"))||c;else if(l!=null&&l.pdf_path){let I=this.toVaultRelativePath(l.pdf_path);I&&I.startsWith((0,h.normalizePath)(this.settings.outputPdfDir))&&(c=this.sanitizeFileName(E.default.basename(I,".pdf"))||c)}let d=l?c:await this.resolveUniqueBaseName(c,r),p=(0,h.normalizePath)(`${this.settings.outputPdfDir}/${d}.pdf`),_=(0,h.normalizePath)(`${ce}/${r}.json`),g=(0,h.normalizePath)(`${te}/${r}.json`),f=this.app.vault.adapter,b=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${d}.md`);l!=null&&l.note_path&&await f.exists(l.note_path)&&(b=(0,h.normalizePath)(l.note_path));let k=await f.exists(b),m=await f.exists(_),x=await f.exists(g),w=this.buildImportTempPath(_,"item"),S=this.buildImportTempPath(g,"chunk"),R=this.buildImportTempPath(b,"note"),P=this.settings.copyPdfToVault||!s.filePath,A=P?await f.exists(p):!1,N=P?this.buildImportTempPath(p,"pdf"):null,O=async()=>{await this.removeVaultFilesIfExist([w,S,R,N])},q=async()=>{await this.removeVaultFilesIfExist([m?null:_,x?null:g,k?null:b,A?null:p])};if(await f.exists(b)&&!await this.confirmOverwrite(b)){new h.Notice("Import canceled.");return}try{if(await this.ensureFolder(ce),await this.ensureFolder(te),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let I=this.getLogFileRelativePath(),B=(0,h.normalizePath)(E.default.dirname(I));B&&await this.ensureFolder(B),await this.deleteLogFileIfExists();let K=this.getSpellcheckerInfoRelativePath(),ie=(0,h.normalizePath)(E.default.dirname(K));ie&&await this.ensureFolder(ie)}}catch(I){new h.Notice("Failed to create output folders."),console.error(I),this.clearStatusProgress();return}let j="",V="";try{if(this.settings.copyPdfToVault){let I=s.filePath?await ne.promises.readFile(s.filePath):await pt(s.key,{buildZoteroUrl:this.buildZoteroUrl.bind(this),getZoteroLibraryPath:this.getZoteroLibraryPath.bind(this),canUseWebApi:this.canUseWebApi.bind(this),buildWebApiUrl:this.buildWebApiUrl.bind(this),getWebApiLibraryPath:this.getWebApiLibraryPath.bind(this),requestLocalApiRaw:this.requestLocalApiRaw.bind(this),requestWebApiRaw:this.requestWebApiRaw.bind(this),requestLocalApi:this.requestLocalApi.bind(this),readFile:ne.promises.readFile}),B=N||p;await this.app.vault.adapter.writeBinary(B,this.bufferToArrayBuffer(I)),j=this.getAbsoluteVaultPath(B)}else if(s.filePath)j=s.filePath;else{await this.ensureFolder(this.settings.outputPdfDir);let I=await pt(s.key,{buildZoteroUrl:this.buildZoteroUrl.bind(this),getZoteroLibraryPath:this.getZoteroLibraryPath.bind(this),canUseWebApi:this.canUseWebApi.bind(this),buildWebApiUrl:this.buildWebApiUrl.bind(this),getWebApiLibraryPath:this.getWebApiLibraryPath.bind(this),requestLocalApiRaw:this.requestLocalApiRaw.bind(this),requestWebApiRaw:this.requestWebApiRaw.bind(this),requestLocalApi:this.requestLocalApi.bind(this),readFile:ne.promises.readFile}),B=N||p;await this.app.vault.adapter.writeBinary(B,this.bufferToArrayBuffer(I)),j=this.getAbsoluteVaultPath(B),new h.Notice("Local PDF path unavailable; copied PDF into vault for processing.")}V=this.buildPdfLinkForNote(j,s.key,r)}catch(I){await O(),new h.Notice("Failed to download PDF attachment."),console.error(I),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(w,JSON.stringify(t,null,2))}catch(I){await O(),new h.Notice("Failed to write Zotero item JSON."),console.error(I),this.clearStatusProgress();return}let z=this.getPluginDir(),Z=E.default.join(z,"tools","docling_extract.py"),T=E.default.join(z,"tools","index_redisearch.py"),G=null,$=await this.getImportWorkerBudget(j),H=$.timeoutSec;this.logImportWorkerBudget(j,$);try{this.showStatusProgress(this.formatStatusLabel("Docling extraction...",G),0);let I=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;await this.runPythonStreaming(Z,await this.buildDoclingArgs(j,r,S,R,a,!0),ie=>this.handleDoclingProgress(ie,G),()=>{},I,"docling_extract",void 0,H),G=await this.readDoclingQualityLabel(S),await this.annotateChunkJsonWithAttachmentKey(S,s.key);let B=await this.readDoclingMetadata(S),K=await this.maybeCreateOcrLayeredPdf(j,B,a);K&&(j=K,V=this.buildPdfLinkFromSourcePath(K),await this.updateChunkJsonSourcePdf(S,K))}catch(I){let B=this.getPythonErrorMessage(I);await O(),this.isTimeoutLikeErrorMessage(B)?new h.Notice("Docling extraction timed out. Incomplete import files were cleaned up."):new h.Notice("Docling extraction failed. Incomplete import files were cleaned up."),console.error(I),this.clearStatusProgress();return}let F=!1;try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",G),0);let I=["--chunks-json",this.getAbsoluteVaultPath(S),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"];this.appendEmbedSubchunkArgs(I),this.appendEmbedContextArgs(I),this.settings.embedIncludeMetadata&&I.push("--embed-include-metadata"),this.appendChunkTaggingArgs(I),await this.runPythonStreaming(T,I,B=>{let K=this.asRecord(B),ie=typeof(K==null?void 0:K.total)=="number"?K.total:0,ue=typeof(K==null?void 0:K.current)=="number"?K.current:0;if((K==null?void 0:K.type)==="progress"&&ie>0){let fe=Math.round(ue/ie*100),oe=typeof K.message=="string"&&K.message.trim()?K.message:`Indexing chunks ${ue}/${ie}`,Ne=this.formatStatusLabel(oe,G);this.showStatusProgress(Ne,fe)}},()=>{},null,"docling_extract",void 0,H)}catch(I){let B=this.getPythonErrorMessage(I),K=this.classifyIndexingError(B);if(console.error(I),K==="embed_dim_mismatch")if(await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema. Switch to a model with matching dimensions, or drop/rebuild the index."))try{if(await this.dropRedisIndex(!0),!await this.reindexRedisFromCache()){this.clearStatusProgress(),this.lastReindexFailure==="rate_limited"?new h.Notice(this.getEmbeddingRateLimitMessage("retry_import")):this.lastReindexFailure==="embed_failure"?new h.Notice("Embedding provider error detected while rebuilding the Redis index. Fix the provider/model settings and retry import."):new h.Notice("Redis index rebuild did not complete. Import stopped.");return}new h.Notice("Redis index rebuilt; resuming import."),F=!0}catch(ue){this.clearStatusProgress(),new h.Notice("Failed to drop/rebuild the redis index. See console for details."),console.error(ue);return}else{this.clearStatusProgress(),new h.Notice("Indexing aborted due to embedding dimension mismatch. Switch models or drop/rebuild the index.");return}if(!F){if(await this.cleanupIndexedChunksForDoc(r),await O(),K==="rate_limited"){this.clearStatusProgress(),new h.Notice(this.getEmbeddingRateLimitMessage("retry_import"));return}if(this.isLmStudioTagModelUnloadedMessage(B)){this.clearStatusProgress(),new h.Notice(this.getLmStudioTagModelUnloadedMessage("retry_import"));return}if(K==="embed_failure"){this.clearStatusProgress(),new h.Notice("Embedding provider error detected. Fix the provider/model settings and rerun.");return}if(this.isTimeoutLikeErrorMessage(B)){this.clearStatusProgress(),new h.Notice("Chunk indexing timed out. Incomplete import files were cleaned up.");return}this.clearStatusProgress(),new h.Notice("Redissearch indexing failed. Incomplete import files were cleaned up.");return}}try{let I=N?this.getAbsoluteVaultPath(p):j,B=N?this.buildPdfLinkForNote(I,s.key,r):V,K=await this.app.vault.adapter.read(R),ie=await this.readChunkPayload(S),ue=this.buildSyncedDoclingContent(r,ie,K),fe=await this.buildNoteMarkdown(n,(W=t.meta)!=null?W:{},r,B,s.key,b,_,ue);await this.app.vault.adapter.write(R,fe),await this.replaceVaultFile(w,_),await this.replaceVaultFile(S,g),N&&(await this.replaceVaultFile(N,p),j=I),await this.replaceVaultFile(R,b);let oe=this.app.vault.getAbstractFileByPath(b);oe instanceof h.TFile&&this.scheduleNoteAnnotationSync(oe,2e3,"save")}catch(I){await this.cleanupIndexedChunksForDoc(r),await O(),await q(),new h.Notice("Failed to finalize note Markdown. Incomplete import files were cleaned up."),console.error(I),this.clearStatusProgress();return}try{let I=Pe(n);await this.updateDocIndex({doc_id:r,note_path:b,note_title:d,zotero_title:o,short_title:I||void 0,pdf_path:j,attachment_key:s.key});let B=this.app.vault.getAbstractFileByPath(b);B instanceof h.TFile&&(this.pdfSidebar.syncPdfSidebarForFile(B),this.pdfSidebar.maybeSyncPendingPdf())}catch(I){console.error("Failed to update doc index",I)}this.showStatusProgress("Done",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),new h.Notice(`Indexed Zotero item ${r}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getCurrentMarkdownFile(){let e=this.app.workspace.getActiveViewOfType(h.MarkdownView),t=e==null?void 0:e.file;if(t instanceof h.TFile&&t.extension==="md")return t;let n=this.app.workspace.getActiveFile();if(n instanceof h.TFile&&n.extension==="md")return n;let r=this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit),i=r==null?void 0:r.view;if(i instanceof h.MarkdownView){let o=i.file;if(o instanceof h.TFile&&o.extension==="md")return o}let a=this.app.workspace.getLeavesOfType("markdown")[0],s=a==null?void 0:a.view;if(s instanceof h.MarkdownView){let o=s.file;if(o instanceof h.TFile&&o.extension==="md")return o}return null}async syncPdfSidebarForActiveNote(e={}){let t=this.getCurrentMarkdownFile();if(!(t instanceof h.TFile)||t.extension!=="md"){new h.Notice("Open a Markdown note first.");return}await this.pdfSidebar.syncPdfSidebarForFile(t,{allowCreateLeaf:!0}),await this.pdfSidebar.maybeSyncPendingPdf({allowCreateLeaf:!0}),e.revealSidebar&&await this.pdfSidebar.revealPdfSidebar({allowCreateLeaf:!0})}getChatLeaf(){var t;let e=this.app.workspace.getLeavesOfType(Le);return e.length>0?e[0]:this.settings.chatPaneLocation==="right"?(t=this.app.workspace.getRightLeaf(!1))!=null?t:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let t=this.getChatLeaf();await t.setViewState({type:Le,active:!0}),await this.app.workspace.revealLeaf(t);let n=t.view;return n instanceof ze&&e&&n.focusInput(),n}async loadChatHistory(){let e=await this.getActiveChatSessionId();return this.loadChatHistoryForSession(e)}async saveChatHistory(e){let t=await this.getActiveChatSessionId();await this.saveChatHistoryForSession(t,e)}getChatSessionsDir(){return(0,h.normalizePath)(`${se}/chats`)}getChatExportDir(){let e=(this.settings.chatOutputDir||"").trim();return e?(0,h.normalizePath)(e):(0,h.normalizePath)("zotero/chats")}getChatSessionsIndexPath(){return(0,h.normalizePath)(`${this.getChatSessionsDir()}/index.json`)}getChatSessionPath(e){return(0,h.normalizePath)(`${this.getChatSessionsDir()}/${e}.json`)}async listChatSessions(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,t=this.getChatSessionsIndexPath();if(!await e.exists(t)){let n=new Date().toISOString(),r=[{id:"default",name:"New chat",createdAt:n,updatedAt:n}];return await this.writeChatSessionsIndex({version:1,active:"default",sessions:r}),r}try{let n=await e.read(t),r=this.asRecord(JSON.parse(n));return(Array.isArray(r==null?void 0:r.sessions)?r.sessions:[]).filter(a=>!!(this.asRecord(a)&&typeof a.id=="string")).map(a=>{let s=typeof a.id=="string"?a.id:"";return{id:s,name:typeof a.name=="string"&&a.name.trim()?a.name.trim():s,createdAt:typeof a.createdAt=="string"?a.createdAt:new Date().toISOString(),updatedAt:typeof a.updatedAt=="string"?a.updatedAt:new Date().toISOString()}})}catch(n){return console.warn("Failed to read chat sessions index",n),[]}}async getActiveChatSessionId(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,t=this.getChatSessionsIndexPath();if(!await e.exists(t))return"default";try{let n=await e.read(t),r=JSON.parse(n);return(typeof(r==null?void 0:r.active)=="string"?r.active:"default")||"default"}catch(n){return"default"}}async setActiveChatSessionId(e){var a,s;await this.migrateLegacyChatHistory();let t=await this.readChatSessionsIndex(),n=((a=t.sessions)!=null?a:[]).some(o=>o.id===e),r=new Date().toISOString(),i=n?t.sessions:[...(s=t.sessions)!=null?s:[],{id:e,name:e,createdAt:r,updatedAt:r}];await this.writeChatSessionsIndex({version:1,active:e,sessions:i})}async createChatSession(e){var s;await this.migrateLegacyChatHistory();let t=this.generateChatId(),n=new Date().toISOString(),r=(e||"").trim()||"New chat",a=[...(s=(await this.readChatSessionsIndex()).sessions)!=null?s:[],{id:t,name:r,createdAt:n,updatedAt:n}];return await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionPath(t),JSON.stringify({version:1,messages:[]},null,2)),await this.writeChatSessionsIndex({version:1,active:t,sessions:a}),t}async renameChatSession(e,t){var a,s;await this.migrateLegacyChatHistory();let n=(t||"").trim();if(!n)return;let r=await this.readChatSessionsIndex(),i=((a=r.sessions)!=null?a:[]).map(o=>o.id===e?{...o,name:n}:o);await this.writeChatSessionsIndex({version:1,active:(s=r.active)!=null?s:"default",sessions:i})}async deleteChatSession(e){var s;if(await this.migrateLegacyChatHistory(),!e)return;let t=this.app.vault.adapter,n=await this.readChatSessionsIndex(),r=(s=n.sessions)!=null?s:[];if(r.length<=1)return;let i=r.filter(o=>o.id!==e);if(!i.length)return;let a=n.active===e?i[0].id:n.active;try{await t.remove(this.getChatSessionPath(e))}catch(o){console.warn("Failed to delete chat session file",o)}await this.writeChatSessionsIndex({version:1,active:a,sessions:i})}async loadChatHistoryForSession(e){await this.migrateLegacyChatHistory();let t=this.app.vault.adapter,n=this.getChatSessionPath(e||"default");if(!await t.exists(n))return[];let r=await t.read(n),i;try{i=JSON.parse(r)}catch(o){return[]}let a=this.asRecord(i),s=Array.isArray(i)?i:Array.isArray(a==null?void 0:a.messages)?a.messages:[];return Array.isArray(s)?s.filter(o=>!!(this.asRecord(o)&&typeof o.content=="string")).map(o=>({id:typeof o.id=="string"?o.id:this.generateChatId(),role:o.role==="assistant"?"assistant":"user",content:typeof o.content=="string"?o.content:"",citations:Array.isArray(o.citations)?o.citations:[],retrieved:Array.isArray(o.retrieved)?o.retrieved:[],createdAt:typeof o.createdAt=="string"?o.createdAt:new Date().toISOString()})):[]}async saveChatHistoryForSession(e,t){var l,c;await this.migrateLegacyChatHistory(),await this.ensureFolder(this.getChatSessionsDir());let n=this.app.vault.adapter,r=this.getChatSessionPath(e||"default"),i={version:1,messages:t};await n.write(r,JSON.stringify(i,null,2));let a=await this.readChatSessionsIndex(),s=new Date().toISOString(),o=((l=a.sessions)!=null?l:[]).map(d=>d.id===e?{...d,updatedAt:s}:d);await this.writeChatSessionsIndex({version:1,active:(c=a.active)!=null?c:e,sessions:o})}getRecentChatHistory(e){let t=Math.max(0,this.settings.chatHistoryMessages||0);return t?e.filter(r=>{var i;return r&&((i=r.content)==null?void 0:i.trim())}).slice(-t):[]}async readChatSessionsIndex(){let e=this.app.vault.adapter,t=this.getChatSessionsIndexPath(),n=new Date().toISOString();if(!await e.exists(t))return{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:n,updatedAt:n}]};try{let r=await e.read(t),i=this.asRecord(JSON.parse(r)),a=Array.isArray(i==null?void 0:i.sessions)?i.sessions:[];return{version:1,active:typeof(i==null?void 0:i.active)=="string"?i.active:"default",sessions:a.map(s=>this.asRecord(s)).filter(s=>!!s).map(s=>{let o=typeof s.id=="string"?s.id:"";return{id:o,name:typeof s.name=="string"&&s.name.trim()?s.name.trim():o,createdAt:typeof s.createdAt=="string"?s.createdAt:n,updatedAt:typeof s.updatedAt=="string"?s.updatedAt:n}})}}catch(r){return console.warn("Failed to parse chat sessions index",r),{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:n,updatedAt:n}]}}}async writeChatSessionsIndex(e){await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionsIndexPath(),JSON.stringify(e,null,2))}async migrateLegacyChatHistory(){let e=this.app.vault.adapter,t=(0,h.normalizePath)(`${se}/chat.json`),n=this.getChatSessionsDir(),r=this.getChatSessionsIndexPath(),i=this.getChatSessionPath("default"),a=await e.exists(t),s=await e.exists(i),o=await e.exists(r);if(!a&&o)return;let l=new Date().toISOString();if(await this.ensureFolder(n),a&&!s)try{await e.rename(t,i)}catch(c){try{let d=await e.read(t);await e.write(i,d),await e.remove(t)}catch(d){console.warn("Failed to migrate legacy chat history",d)}}if(!o){let c=[{id:"default",name:"New chat",createdAt:l,updatedAt:l}];await this.writeChatSessionsIndex({version:1,active:"default",sessions:c})}if(o)try{let c=await e.read(r),d=this.asRecord(JSON.parse(c)),p=Array.isArray(d==null?void 0:d.sessions)?d.sessions:[],_=p.some(f=>{let b=this.asRecord(f);return(b==null?void 0:b.id)==="default"}),g=p.map(f=>this.asRecord(f)).filter(f=>!!f).map(f=>f.id==="default"&&typeof f.name=="string"&&f.name.trim().toLowerCase()==="default"?{...f,name:"New chat"}:f);_&&JSON.stringify(g)!==JSON.stringify(p)&&await this.writeChatSessionsIndex({version:1,active:typeof(d==null?void 0:d.active)=="string"?d.active:"default",sessions:g.map(f=>({id:typeof f.id=="string"?f.id:"",name:typeof f.name=="string"?f.name:"New chat",createdAt:typeof f.createdAt=="string"?f.createdAt:l,updatedAt:typeof f.updatedAt=="string"?f.updatedAt:l}))})}catch(c){}}isPlaceholderChatName(e){let t=(e||"").trim().toLowerCase();return t==="new chat"||t==="default"}normalizeChatTitle(e){let t=(e||"").replace(/\s+/g," ").trim();return t.length>60?`${t.slice(0,57)}...`:t}guessTitleFromMessages(e){let t=e.find(r=>r.role==="user"&&r.content.trim());if(!t)return"New chat";let n=t.content.replace(/\s+/g," ").trim().split(" ").slice(0,8).join(" ");return this.normalizeChatTitle(n||"New chat")}async suggestChatTitleWithLlm(e){let t=(this.settings.chatBaseUrl||"").trim(),n=(this.settings.chatModel||"").trim();if(!t||!n)return null;let r=t.replace(/\/$/,"");if(r.toLowerCase().includes("api.openai.com")&&(!this.settings.chatApiKey||n.includes("/")))return null;try{let a=e.slice(-8).map(o=>`${o.role.toUpperCase()}: ${o.content}`).join(`
`).slice(0,4e3),s=await this.requestLlmText({baseUrl:r,apiKey:(this.settings.chatApiKey||"").trim(),model:n,temperature:.2,systemPrompt:"Generate a short, specific title (3-7 words) for the chat. No quotes, no punctuation at the end.",userPrompt:a,endpointMode:this.isLmStudioProvider(r,this.settings.chatProviderProfileId)?"responses":"chat"});return this.normalizeChatTitle(s.replace(/^"|"$/g,"").trim())}catch(a){return console.warn("Chat title suggestion failed",a),null}}async finalizeChatSessionNameIfNeeded(e,t,n={}){var c;if(!e)return;let r=t||[];if(!r.some(d=>d.role==="user"&&d.content.trim())||!n.force&&r.length<4)return;let s=((c=(await this.readChatSessionsIndex()).sessions)!=null?c:[]).find(d=>d.id===e);if(!s||!this.isPlaceholderChatName(s.name))return;let l=await this.suggestChatTitleWithLlm(r)||this.guessTitleFromMessages(r);!l||this.isPlaceholderChatName(l)||await this.renameChatSession(e,l)}getRagWorkerTimeoutSec(){let e=Qn;if(this.settings.enableCrossEncoderRerank&&(e+=Yn),this.settings.enableAgenticRag){let t=Number.isFinite(this.settings.agenticMaxIters)?Math.max(1,Math.trunc(this.settings.agenticMaxIters)):2;e+=Math.max(_n,t*_n)}return Math.min(3600,Math.max(60,e))}async getPdfPageCount(e){let t=this.getPluginDir(),n=E.default.join(t,"tools","pdf_page_count.py");try{let r=await this.runPythonWithOutput(n,["--pdf",e],null,"pdf_page_count",nr),i=JSON.parse(r||"{}"),a=Number(i.pages);if(Number.isFinite(a)&&a>0)return Math.trunc(a)}catch(r){console.debug("Failed to read PDF page count for timeout budgeting",r)}return null}formatDurationShort(e){let t=Math.max(0,Math.round(e)),n=Math.floor(t/3600),r=Math.floor(t%3600/60),i=t%60,a=[];return n>0&&a.push(`${n}h`),r>0&&a.push(`${r}m`),(!a.length||i>0)&&a.push(`${i}s`),a.join(" ")}async getImportWorkerBudget(e){let t=await this.getPdfPageCount(e);if(!t)return{pages:null,timeoutSec:gn};let n=Math.max(gn,300+t*er);return{pages:t,timeoutSec:Math.min(tr,n)}}logImportWorkerBudget(e,t){let n=this.formatDurationShort(t.timeoutSec);if(t.pages&&t.pages>0){console.debug("Import worker timeout budget",{pdfPath:e,pages:t.pages,timeoutSec:t.timeoutSec}),new h.Notice(`Import timeout budget: ${t.pages} pages, ${n}.`,5e3);return}console.debug("Import worker timeout budget",{pdfPath:e,pages:null,timeoutSec:t.timeoutSec,fallback:"page_count_unavailable"}),new h.Notice(`Import timeout budget: page count unavailable, using ${n}.`,5e3)}isRagQueryCancellationMessage(e){let t=(e||"").toLowerCase();return t.includes("python worker request aborted")||t.includes("request aborted")||t.includes("request canceled")||t.includes("request cancelled")||t.includes("canceled_while_waiting_rag_slot")||t.includes("cancelled_while_waiting_rag_slot")||t.includes("client_disconnected")||t.includes("error: canceled")||t.includes("error: cancelled")}cancelActiveRagQuery(){this.activeChatQueryCancelRequested=!0;let e=this.activeChatQueryProcess;if(!e)return!1;if(e.killed)return!0;try{return e.kill("SIGTERM"),!0}catch(t){console.warn("Failed to cancel active RAG query with SIGTERM",t);try{return e.kill(),!0}catch(n){return console.warn("Failed to cancel active RAG query",n),!1}}}async runRagQueryStreaming(e,t,n,r=[]){if(this.activeChatQueryProcess=null,this.activeChatQueryCancelRequested=!1,await this.ensureBundledTools(),!await this.ensureRedisAvailable("chat query")){n({answer:"Redis is not reachable. Please start Redis Stack and try again."});return}let i=this.getPluginDir(),a=E.default.join(i,"tools","rag_query_redisearch.py"),s=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--chat-endpoint-mode",this.isLmStudioProvider(this.settings.chatBaseUrl,this.settings.chatProviderProfileId)?"responses":"chat","--temperature",String(this.settings.chatTemperature),"--stream"];if(this.settings.enableQueryExpansion&&(s.push("--expand-query"),s.push("--expand-count",String(Math.max(1,Math.trunc(this.settings.queryExpansionCount))))),this.settings.enableFollowUpRewrite&&s.push("--rewrite-followups"),this.settings.enableCrossEncoderRerank){s.push("--rerank");let c=(this.settings.rerankModel||"").trim();c&&s.push("--rerank-model",c)}Number.isFinite(this.settings.rerankCandidateMultiplier)&&s.push("--rerank-candidates",String(Math.max(1,Math.trunc(this.settings.rerankCandidateMultiplier)))),Number.isFinite(this.settings.rrfK)&&s.push("--rrf-k",String(Math.max(1,Math.trunc(this.settings.rrfK)))),Number.isFinite(this.settings.rrfLogTop)&&this.settings.rrfLogTop>0&&s.push("--rrf-log-top",String(Math.max(1,Math.trunc(this.settings.rrfLogTop)))),Number.isFinite(this.settings.maxChunksPerDoc)&&this.settings.maxChunksPerDoc>0&&s.push("--max-per-doc",String(Math.max(1,Math.trunc(this.settings.maxChunksPerDoc)))),this.settings.enableAgenticRag&&(s.push("--agentic","basic"),Number.isFinite(this.settings.agenticMaxIters)&&this.settings.agenticMaxIters>0&&s.push("--agentic-max-iters",String(Math.max(1,Math.trunc(this.settings.agenticMaxIters)))),s.push("--agentic-full-doc-chunks",String(Jn),"--agentic-full-doc-max-chars",String(Xn)));let o=this.buildChatHistoryPayload(r),l=await this.writeChatHistoryTemp(o);l!=null&&l.absolutePath&&s.push("--history-file",l.absolutePath);try{let c=this.getRagWorkerTimeoutSec(),d=async()=>{await this.runPythonStreaming(a,s,_=>{let g=this.asRecord(_);if((g==null?void 0:g.type)==="delta"&&typeof g.content=="string"){t(g.content);return}if((g==null?void 0:g.type)==="phase"){this.logPythonWorkerTiming("rag-phase",g);return}if((g==null?void 0:g.type)==="final"){n(g);return}g!=null&&g.answer&&n(g)},_=>{let g=this.asRecord(_);n(g!=null?g:{})},void 0,"rag_query_redisearch",_=>{if(this.activeChatQueryProcess=_,this.activeChatQueryCancelRequested&&!_.killed)try{_.kill("SIGTERM")}catch(g){console.warn("Failed to cancel queued chat request",g)}},c)},p=!1;for(;;){if(this.activeChatQueryCancelRequested){n({canceled:!0,answer:"Request canceled."});return}try{await d();break}catch(_){let g=this.getPythonErrorMessage(_);if(this.activeChatQueryCancelRequested||this.isRagQueryCancellationMessage(g)){n({canceled:!0,answer:"Request canceled."});return}let f=this.classifyIndexingError(g);if(this.isRateLimitErrorMessage(g)){n({answer:f==="rate_limited"?this.getEmbeddingRateLimitMessage("retry"):this.getChatRateLimitMessage()});return}if(f==="embed_dim_mismatch"){if(p){n({answer:"Embedding dimension mismatch persists after rebuild. Check the embedding model settings."});return}if(!await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema.")){n({answer:"Embedding dimension mismatch. Switch models or drop/rebuild the Redis index."});return}try{if(await this.dropRedisIndex(!0),!await this.reindexRedisFromCache()){let m=this.lastReindexFailure==="rate_limited"?this.getEmbeddingRateLimitMessage("rebuild"):this.lastReindexFailure==="embed_failure"?"Embedding provider error detected while rebuilding the index. Fix settings and retry.":"Redis index rebuild did not complete. Chat query stopped.";n({answer:m});return}}catch(k){console.error(k),n({answer:"Failed to drop/rebuild the Redis index. See console for details."});return}p=!0;continue}if(f==="rate_limited"){n({answer:this.getEmbeddingRateLimitMessage("retry")});return}if(f==="embed_failure"){n({answer:"Embedding provider error detected. Fix the provider/model settings and retry."});return}throw _}}}finally{if(l!=null&&l.relativePath)try{await this.app.vault.adapter.remove(l.relativePath)}catch(c){console.warn("Failed to remove chat history temp file",c)}this.activeChatQueryProcess=null,this.activeChatQueryCancelRequested=!1}}buildChatHistoryPayload(e){return this.getRecentChatHistory(e).map(n=>({role:n.role,content:n.content}))}async writeChatHistoryTemp(e){if(!e.length)return null;let t=(0,h.normalizePath)(`${se}/tmp`);await this.ensureFolder(t);let n=`chat_history_${Date.now()}_${Math.random().toString(36).slice(2,8)}.json`,r=(0,h.normalizePath)(`${t}/${n}`),i={version:1,messages:e};return await this.app.vault.adapter.write(r,JSON.stringify(i,null,2)),{relativePath:r,absolutePath:this.getAbsoluteVaultPath(r)}}async resolveCitationDisplay(e){let t=await this.getDocIndexEntry(e.doc_id);(!t||!t.note_title||!t.zotero_title||!t.note_path||!t.pdf_path||t.short_title===void 0)&&(t=await this.hydrateDocIndexFromCache(e.doc_id));let n=e.doc_id?await this.resolveNotePathForDocId(e.doc_id):t==null?void 0:t.note_path,r=this.resolveCitationTitle(t,n,e.doc_id),i=this.formatCitationPageLabel(e),a=e.page_start?String(e.page_start):"",s=(t==null?void 0:t.pdf_path)||e.source_pdf||"",o=e.attachment_key||(t==null?void 0:t.attachment_key),l=e.annotation_key||this.extractAnnotationKey(e.chunk_id),c=e.doc_id?this.buildZoteroDeepLink(e.doc_id,o,a,l):void 0;return{noteTitle:r,pageLabel:i,notePath:n||void 0,pdfPath:s||void 0,zoteroUrl:c,pageStart:a||void 0}}resolveCitationTitle(e,t,n){let r=n||"?",i=(e==null?void 0:e.short_title)||(e==null?void 0:e.zotero_title)||(e==null?void 0:e.note_title)||(t?E.default.basename(t,".md"):"")||r;return this.shortenCitationTitle(i)}shortenCitationTitle(e){let t=String(e||"").trim();if(!t)return"?";if(t.length<=mn)return t;let n=Math.max(0,mn-3);return`${t.slice(0,n).trim()}...`}formatCitationLabel(e,t){let n=e.trim()||"?",r=(t||"").trim();return r?`${n}, p. ${r}`:n}async formatInlineCitations(e,t,n=[]){var c,d,p,_;if(!e)return e;let r=/\[\[?cite:([A-Za-z0-9]+):([^\]\n]+?)\]?\]/g,i=Array.from(e.matchAll(r));if(i.length===0)return e;let a=new Map;for(let g of i){let f=g[0];if(a.has(f))continue;let b=g[1],k=g[2].trim(),m=k.match(/^(\d+)-(\d+)(?::([A-Za-z0-9]+))?$/),x="",w="",S,R,P,A;m?(x=m[1],w=m[2],S=m[3]):A=k;let N=A?n.find(T=>{let G=typeof T.doc_id=="string"?T.doc_id:"";if(G&&G!==b)return!1;let $=typeof T.chunk_id=="string"?T.chunk_id:"";return $?$===A||$===`${b}:${A}`||$.endsWith(`:${A}`):!1}):void 0;N&&(!x&&N.page_start!==void 0&&(x=String(N.page_start)),!w&&N.page_end!==void 0&&(w=String(N.page_end)),!P&&typeof N.attachment_key=="string"&&(P=N.attachment_key),!R&&typeof N.annotation_page_label=="string"&&(R=N.annotation_page_label),!S&&typeof N.chunk_id=="string"&&(S=this.extractAnnotationKey(N.chunk_id)));let O={doc_id:b,chunk_id:N==null?void 0:N.chunk_id,annotation_key:S};P&&(O.attachment_key=P),R&&(O.annotation_page_label=R),(x||w)&&(O.page_start=x||w,O.page_end=w||x,O.pages=`${O.page_start}-${O.page_end}`),N!=null&&N.source_pdf&&(O.source_pdf=String(N.source_pdf));let q=(x||w?t.find(T=>{var G,$;return T.doc_id===b&&String((G=T.page_start)!=null?G:"")===x&&String(($=T.page_end)!=null?$:"")===w}):void 0)||t.find(T=>T.doc_id===b)||O,j=q.annotation_key||S;!q.annotation_key&&j&&(q={...q,annotation_key:j}),!q.attachment_key&&P&&(q={...q,attachment_key:P}),!q.annotation_page_label&&R&&(q={...q,annotation_page_label:R});let V=await this.resolveCitationDisplay(q),z=this.formatCitationLabel(V.noteTitle,V.pageLabel),Z=this.normalizeChunkIdForNote(q.chunk_id,b);if(this.settings.preferObsidianNoteForCitations&&V.notePath){if(j){let T=q.attachment_key||P||((d=(c=this.docIndex)==null?void 0:c[b])==null?void 0:d.attachment_key)||"",G=q.page_start?String(q.page_start):x||w||"0",$=this.buildNoteAnnotationLink(V.notePath,j,T,G,z);if($){a.set(f,$);continue}a.set(f,this.buildNoteLink(V.notePath,z));continue}if(Z&&!j){a.set(f,this.buildNoteChunkLink(V.notePath,Z,z));continue}}if(V.zoteroUrl)a.set(f,`[${z}](${V.zoteroUrl})`);else{let T=this.formatCitationLabel(b,V.pageLabel);a.set(f,`(${T})`)}}let s=[],o=0;for(let g of i){let f=g[0],b=(p=g.index)!=null?p:0;if(b<o)continue;s.push(e.slice(o,b));let k=(_=a.get(f))!=null?_:f,m=b>0?e[b-1]:"";m&&!/\s/.test(m)&&!/[([{!]/.test(m)&&s.push(" "),s.push(k),o=b+f.length}s.push(e.slice(o));let l=s.join("");return this.repairTruncatedWikilinks(l)}repairTruncatedWikilinks(e){if(!e||typeof e!="string")return e;let t=e;return t=t.replace(/(\[\[[^\]\n#]+#zrr-chunk:[^\]\n\\|]+)\\\|/g,"$1|"),t=t.replace(/\[\[([^\]\n#]+#zrr-chunk:[^\]\n|]+)(?=\n|$)/g,"[[$1]]"),t=t.replace(/\[\[([^\]\n#]+#zrr-chunk:([^\]\n|]+))\]\]/g,(n,r,i)=>{let a=this.escapeWikiLabel(this.buildDefaultChunkLabel(String(i||"").trim()));return`[[${r}\\|${a}]]`}),t}buildDefaultChunkLabel(e){let t=(e||"").trim(),n=t.match(/^p(\d+)$/i);return n?`p. ${n[1]}`:t||"source"}handleDoclingProgress(e,t){let n=this.asRecord(e);if(!n||n.type!=="progress")return;let r=Number(n.percent);if(!Number.isFinite(r))return;let i=typeof n.message=="string"&&n.message.trim()?n.message:"Docling extraction...";this.showStatusProgress(this.formatStatusLabel(i,t),Math.round(r))}async createChatNoteFromSession(e,t,n){let r=this.getChatExportDir();await this.ensureFolder(r),await this.getDocIndex();let i=this.sanitizeFileName(t)||"Zotero Chat",a=this.formatTimestamp(new Date),s=(0,h.normalizePath)(`${r}/${i}.md`),o=await this.resolveUniqueNotePath(s,`${i}-${a}.md`),l=await this.buildChatTranscript(t,n),c=await this.applyChatExportTemplate(t,l);await this.app.vault.adapter.write(o,c),await this.openNoteInNewTab(o),await this.runChatExportPostCreateCommand(o),new h.Notice(`Chat copied to ${o}`)}async applyChatExportTemplate(e,t){let n=(this.settings.chatExportTemplatePath||"").trim();if(!n)return t;let r=(0,h.normalizePath)(n),i=this.app.vault.getAbstractFileByPath(r);if(!(i instanceof h.TFile))return new h.Notice(`Chat export template not found: ${r}`),t;let a="";try{a=await this.app.vault.read(i)}catch(p){return console.error("Failed to read chat export template",p),new h.Notice("Failed to read chat export template."),t}let s=t.trim(),o=(e||"Zotero Chat").trim(),l=new Date().toISOString(),c=a.replace(/{{\s*chat_title\s*}}/gi,o).replace(/{{\s*chat_created_at\s*}}/gi,l);if(/{{\s*chat_body\s*}}/i.test(c))return c=c.replace(/{{\s*chat_body\s*}}/gi,s),`${c.trim()}
`;let d=c.trim();return d?`${s}

${d}
`:`${s}
`}async runChatExportPostCreateCommand(e){let t=(this.settings.chatExportPostCreateCommandId||"").trim();if(!t)return;await this.openNoteInMain(e);let n=this.app.commands;n!=null&&n.executeCommandById&&n.executeCommandById(t)||new h.Notice(`Chat export command not found: ${t}`)}async buildChatTranscript(e,t){var r,i,a;let n=[];n.push(`# ${e||"Zotero Chat"}`),n.push(""),n.push(`Created: ${new Date().toISOString()}`),n.push("");for(let s of t){let o=s.role==="user"?"## You":"## Assistant";n.push(o),n.push("");let l=s.role==="assistant"?await this.formatInlineCitations(s.content||"",(r=s.citations)!=null?r:[],(i=s.retrieved)!=null?i:[]):s.content||"";if(n.push(l.trim()),n.push(""),s.role==="assistant"&&((a=s.citations)!=null&&a.length)){n.push("### Relevant context sources");let c=this.formatCitationsMarkdown(s.citations);c&&(n.push(c),n.push(""))}}return n.join(`
`).trim()+`
`}async resolveUniqueNotePath(e,t){let n=this.app.vault.adapter;if(!await n.exists(e))return e;let r=E.default.dirname(e),i=(0,h.normalizePath)(E.default.join(r,t));if(!await n.exists(i))return i;let a=2;for(;a<1e3;){let s=(0,h.normalizePath)(E.default.join(r,`${E.default.basename(t,".md")}-${a}.md`));if(!await n.exists(s))return s;a+=1}return i}formatTimestamp(e){let t=n=>String(n).padStart(2,"0");return[e.getFullYear(),t(e.getMonth()+1),t(e.getDate()),"-",t(e.getHours()),t(e.getMinutes())].join("")}async openCitationTarget(e,t){var s,o;let n=t!=null?t:await this.resolveCitationDisplay(e),r=this.normalizeChunkIdForNote(e.chunk_id,e.doc_id),i=e.annotation_key||this.extractAnnotationKey(e.chunk_id);if(this.settings.preferObsidianNoteForCitations&&n.notePath){if(i){let l=e.attachment_key||((o=(s=this.docIndex)==null?void 0:s[e.doc_id||""])==null?void 0:o.attachment_key)||"",c=e.page_start?String(e.page_start):e.page_end?String(e.page_end):"0";if(await this.openNoteAtAnnotation(n.notePath,i,l,c))return}if(r&&!i&&await this.openNoteAtChunk(n.notePath,r))return;await this.openNoteInMain(n.notePath);return}if(n.zoteroUrl){this.openExternalUrl(n.zoteroUrl);return}if(!(n.pdfPath&&await this.openPdfInMain(n.pdfPath,n.pageStart))){if(n.zoteroUrl){this.openExternalUrl(n.zoteroUrl);return}new h.Notice("Unable to open citation target.")}}async rebuildNoteFromCache(){let e=await this.promptDocId();if(!e){new h.Notice("No doc_ID provided.");return}await this.rebuildNoteFromCacheForDocId(e,!0)&&new h.Notice(`Rebuilt Zotero note for ${e}.`)}async reindexCurrentNoteFromCache(){let e=this.app.workspace.getActiveFile();if(!e){new h.Notice("No active note to reindex.");return}await this.reindexNoteFromCacheForFile(e,!0)}async reindexNoteFromCacheForFile(e,t){try{let n=await this.app.vault.read(e),r=await this.resolveDocIdForNote(e,n);if(!r){t&&new h.Notice("No doc_ID found for this note.");return}let i=(0,h.normalizePath)(`${te}/${r}.json`);if(!await this.app.vault.adapter.exists(i)&&!await this.restoreMissingChunkCacheFromNote(e,n,r,t))return;await this.reindexDocIdFromCache(r,t)&&t&&new h.Notice(`Reindexed ${r}.`)}catch(n){t&&new h.Notice("Failed to reindex note."),console.error("Failed to reindex note",n)}}async rebuildDocIndexFromCache(){var c,d,p;let e=this.app.vault.adapter,t=await this.listDocIds(ce),n=await this.listDocIds(te),r=await this.scanNotesForDocIds(this.settings.outputNoteDir),i=Object.keys(r),a=Array.from(new Set([...t,...n,...i]));if(a.length===0){new h.Notice("No cached items found.");return}this.showStatusProgress("Rebuilding doc index...",0);let s=await this.getDocIndex(),o=0;for(let _ of a){o+=1;let g={},f=r[_];f&&(g.note_path=f.note_path,g.note_title=f.note_title);let b=(0,h.normalizePath)(`${ce}/${_}.json`);if(await e.exists(b))try{let x=await e.read(b),w=JSON.parse(x),S=(d=(c=w==null?void 0:w.data)!=null?c:w)!=null?d:{},R=typeof S.title=="string"?S.title:"";R&&(g.zotero_title=R);let P=Pe(S);P&&(g.short_title=P);let A=this.sanitizeFileName(R)||_,N=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${A}.md`),O=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${A}-${_}.md`);await e.exists(N)?(g.note_path=N,g.note_title=E.default.basename(N,".md")):await e.exists(O)&&(g.note_path=O,g.note_title=E.default.basename(O,".md"))}catch(x){console.error("Failed to read cached item JSON",x)}let k=(0,h.normalizePath)(`${te}/${_}.json`);if(await e.exists(k))try{let x=await e.read(k),w=JSON.parse(x);typeof(w==null?void 0:w.source_pdf)=="string"&&(g.pdf_path=w.source_pdf)}catch(x){console.error("Failed to read cached chunks JSON",x)}if(Object.keys(g).length>0){let w={...(p=s[_])!=null?p:{doc_id:_},...g,doc_id:_,updated_at:new Date().toISOString()};!w.note_title&&w.note_path&&(w.note_title=E.default.basename(w.note_path,".md")),typeof w.pdf_path=="string"&&(w.pdf_path=this.normalizeDocIndexPdfPath(w.pdf_path)),s[_]=w}let m=Math.round(o/a.length*100);this.showStatusProgress(`Rebuilding doc index ${o}/${a.length}`,m)}await this.saveDocIndex(s);let l=await this.pruneDocIndexOrphans();this.showStatusProgress("Done",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),l.removed>0?new h.Notice(`Rebuilt doc index for ${a.length} items; pruned ${l.removed} stale entries.`):new h.Notice(`Rebuilt doc index for ${a.length} items.`)}async recreateMissingNotesFromCache(){if(this.recreateMissingNotesActive){new h.Notice("Recreate missing notes is already running.");return}this.recreateMissingNotesActive=!0,this.recreateMissingNotesAbort=!1,this.recreateMissingNotesProcess=null;try{let e=this.app.vault.adapter,t=await this.listDocIds(ce),n=await this.listDocIds(te),r=await this.scanNotesForDocIds(this.settings.outputNoteDir),i=Object.keys(r),a=Array.from(new Set([...t,...n,...i]));if(a.length===0){new h.Notice("No cached items found.");return}let s=[];for(let c of a){if(r[c])continue;let d=await this.getDocIndexEntry(c);if(d!=null&&d.note_path&&await e.exists(d.note_path))continue;let p=await this.inferNotePathFromCache(c);p&&await e.exists(p)||s.push(c)}if(s.length===0){new h.Notice("No missing notes detected.");return}this.showStatusProgress("Recreating missing notes...",0);let o=0,l=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;for(let c=0;c<s.length&&!this.recreateMissingNotesAbort;c+=1){let d=s[c],p=Math.round((c+1)/s.length*100);this.showStatusProgress(`Recreating ${c+1}/${s.length}`,p),l&&this.appendToLogFile(l,`Recreate missing note doc_id ${d} (${c+1}/${s.length})`,"recreate_missing_notes","INFO"),await this.rebuildNoteFromCacheForDocId(d,!1)&&(o+=1)}this.recreateMissingNotesAbort?(this.showStatusProgress("Canceled",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),new h.Notice(`Canceled after ${o}/${s.length} notes.`)):(this.showStatusProgress("Done",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),new h.Notice(`Recreated ${o}/${s.length} missing notes.`))}finally{this.recreateMissingNotesActive=!1,this.recreateMissingNotesProcess=null}}cancelRecreateMissingNotesFromCache(){if(!this.recreateMissingNotesActive){new h.Notice("No recreate job is running.");return}this.recreateMissingNotesAbort=!0;let e=this.recreateMissingNotesProcess;if(e&&!e.killed){try{e.kill("SIGTERM")}catch(t){console.warn("Failed to terminate recreate process",t)}activeWindow.setTimeout(()=>{if(e&&!e.killed)try{e.kill("SIGKILL")}catch(t){console.warn("Failed to force-kill recreate process",t)}},2e3)}new h.Notice("Canceling recreate missing notes...")}buildRedisCommand(e){let t=[`*${e.length}\r
`];for(let n of e){let r=String(n);t.push(`$${Buffer.byteLength(r)}\r
${r}\r
`)}return t.join("")}async checkRedisConnectionWithUrl(e,t=2e3){let n=(e||"").trim();if(!n)return{ok:!1,message:"Redis URL is not configured."};let r;try{r=new URL(n)}catch(c){return{ok:!1,message:"Redis URL is invalid."}}let i=r.hostname||"127.0.0.1",a=Number(r.port)||(r.protocol==="rediss:"||r.protocol==="redis+tls:"?6380:6379),s=decodeURIComponent(r.username||""),o=decodeURIComponent(r.password||""),l=r.protocol==="rediss:"||r.protocol==="redis+tls:";return new Promise(c=>{let d=l?bn.default.connect({host:i,port:a,timeout:t,rejectUnauthorized:!1}):je.default.createConnection({host:i,port:a,timeout:t}),p="",_=o||s?"auth":"ping",g=!1,f=(k,m)=>{if(!g){g=!0;try{d.end(),d.destroy()}catch(x){}c({ok:k,message:m})}},b=k=>{let m=k.trim();if(m){if(m.startsWith("-NOAUTH")){f(!1,"Redis requires authentication. Check your Redis URL credentials.");return}if(m.startsWith("-WRONGPASS")||m.toLowerCase().includes("invalid password")){f(!1,"Redis authentication failed. Check your Redis URL credentials.");return}if(m.startsWith("-ERR")){f(!1,`Redis error: ${m}`);return}if(_==="auth"){if(m.startsWith("+OK")){_="ping",p="",d.write(this.buildRedisCommand(["PING"]));return}f(!1,`Redis auth failed: ${m}`);return}m.startsWith("+PONG")&&f(!0)}};d.on("connect",()=>{if(_==="auth"){let k=s?["AUTH",s,o]:["AUTH",o];d.write(this.buildRedisCommand(k))}else d.write(this.buildRedisCommand(["PING"]))}),d.on("data",k=>{var x;p+=k.toString();let m=p.split(/\r?\n/);p=(x=m.pop())!=null?x:"";for(let w of m)b(w)}),d.on("timeout",()=>{f(!1,"Timed out connecting to Redis.")}),d.on("error",k=>{f(!1,`Redis connection failed: ${k.message}`)}),d.on("close",()=>{g||f(!1,"Redis connection closed unexpectedly.")})})}async checkRedisConnection(e=2e3){return this.checkRedisConnectionWithUrl(this.settings.redisUrl,e)}async ensureRedisAvailable(e){let t=await this.checkRedisConnection();if(t.ok)return!0;let n=t.message?`Redis unavailable for ${e}: ${t.message}`:`Redis unavailable for ${e}.`;return this.notifyContainerOnce(n),!1}isOptionalLookupNetworkError(e){let t=this.getPythonErrorMessage(e).toLowerCase();return t.includes("enotfound")||t.includes("getaddrinfo")||t.includes("eai_again")||t.includes("timed out")||t.includes("etimedout")||t.includes("econnrefused")||t.includes("econnreset")||t.includes("ehostunreach")||t.includes("enetunreach")}isTimeoutLikeErrorMessage(e){let t=(e||"").toLowerCase();return t.includes("timed out")||t.includes("timeout")||t.includes("request timed out")||t.includes("timeout_while_waiting")||t.includes("python worker streaming request timed out")}isRateLimitErrorMessage(e){let t=(e||"").toLowerCase();return/\b429\b/.test(t)||t.includes("status 429")||t.includes("too many requests")||t.includes("rate limit")||t.includes("rate-limit")||t.includes("rate limited")||t.includes("rate-limited")||t.includes("retry-after")||t.includes("quota exceeded")}getEmbeddingRateLimitMessage(e){switch(e){case"rerun":return"Embedding provider rate limit exceeded. Wait and rerun.";case"rebuild":return"Embedding provider rate limit exceeded while rebuilding the index. Wait and retry.";case"retry_import":return"Embedding provider rate limit exceeded. Wait and retry import.";default:return"Embedding provider rate limit exceeded. Wait and retry."}}getChatRateLimitMessage(){return"Chat provider rate limit exceeded. Wait and retry."}isLmStudioTagModelUnloadedMessage(e){if(!this.isLmStudioProvider(this.settings.llmCleanupBaseUrl,this.settings.llmCleanupProviderProfileId))return!1;let t=(e||"").toLowerCase();return t.includes("tag request failed")&&t.includes("model unloaded")}getLmStudioTagModelUnloadedMessage(e){switch(e){case"retry_import":return"LM Studio tagging model is unloaded. Load the cleanup/tagging model in LM Studio and retry import.";case"rerun_reindexing":return"LM Studio tagging model is unloaded. Load the cleanup/tagging model in LM Studio and rerun reindexing.";default:return"LM Studio tagging model is unloaded. Load the cleanup/tagging model in LM Studio and retry."}}isLmStudioProvider(e,t=""){if((t||"").trim()==="lm-studio")return!0;let n=(e||"").trim();if(!n)return!1;try{let r=new URL(n),i=r.hostname.toLowerCase(),a=r.port||(r.protocol==="https:"?"443":"80");return(i==="127.0.0.1"||i==="localhost")&&a==="1234"}catch(r){return!1}}isTemperatureUnsupportedMessage(e){let t=(e||"").toLowerCase();return t.includes("temperature")&&(t.includes("unsupported")||t.includes("not supported")||t.includes("unknown parameter")||t.includes("default"))}isResponsesEndpointUnsupportedMessage(e){let t=(e||"").toLowerCase();return t.includes("404")||t.includes("not found")||t.includes("unknown endpoint")||t.includes("responses response missing content")}buildLmStudioModelsUrl(e){try{let t=new URL((e||"").trim()),n=t.pathname.replace(/\/+$/,""),r=n.endsWith("/v1")?n.slice(0,-3):n;return t.pathname=`${r||""}/api/v1/models`.replace(/\/{2,}/g,"/"),t.search="",t.hash="",t.toString()}catch(t){return null}}buildLmStudioNativeChatUrl(e){try{let t=new URL((e||"").trim()),n=t.pathname.replace(/\/+$/,""),r=n.endsWith("/v1")?n.slice(0,-3):n;return t.pathname=`${r||""}/api/v1/chat`.replace(/\/{2,}/g,"/"),t.search="",t.hash="",t.toString()}catch(t){return null}}estimateTextTokens(e){return e?Math.max(1,Math.ceil(e.length/3)):0}async getLmStudioModelMetadata(e,t,n){if(!this.isLmStudioProvider(e))return null;let r=this.buildLmStudioModelsUrl(e);if(!r)return null;try{let i={};t&&(i.Authorization=`Bearer ${t}`);let a=await this.requestLocalApiRaw(r,{headers:i,timeoutMs:3e3});if(a.statusCode>=400)return null;let s=JSON.parse(a.body.toString("utf8")),o=this.asRecord(s),l=Array.isArray(o==null?void 0:o.models)?o.models:[];for(let c of l){let d=this.asRecord(c);if(!d||U(d.key).trim()!==n)continue;let p=Array.isArray(d.loaded_instances)?d.loaded_instances:[],_=0;for(let w of p){let S=this.asRecord(w);if(!S)continue;let R=U(S.id).trim();if(R&&R!==n)continue;let P=this.asRecord(S.config),A=Number(P==null?void 0:P.context_length);if(Number.isFinite(A)&&A>0){_=Math.trunc(A);break}}let g=Number(d.max_context_length),f=Number.isFinite(g)&&g>0?Math.trunc(g):0;_<=0&&(_=f);let b=this.asRecord(d.capabilities),k=this.asRecord(b==null?void 0:b.reasoning),m=Array.isArray(k==null?void 0:k.allowed_options)?k.allowed_options.map(w=>U(w).trim()).filter(w=>w):[],x=U(k==null?void 0:k.default).trim();return{contextLength:_,maxContextLength:f,reasoningAllowedOptions:m,reasoningDefault:x}}}catch(i){console.debug("Failed to read LM Studio model metadata",i)}return null}trimTextToApproxTokenBudget(e,t){let n=Math.max(0,Math.trunc(t));if(n<=0||!e)return"";let r=n*3;if(e.length<=r)return e;let i=e.slice(0,r),a=i.lastIndexOf(`

`),s=i.lastIndexOf(`
`),o=Math.max(i.lastIndexOf(". "),i.lastIndexOf("? "),i.lastIndexOf("! ")),l=Math.max(a,s,o);return l>=Math.floor(r*.7)?i=i.slice(0,l).trimEnd():i=i.trimEnd(),i}async getLmStudioPromptBudget(e,t,n,r,i){if(!this.isLmStudioProvider(e))return null;let a=await this.getLmStudioModelMetadata(e,t,n);if(!a||a.contextLength<=0)return null;let s=a.contextLength,o=this.estimateTextTokens(i),l=Math.max(256,Math.min(2048,Math.max(Math.ceil(o*1.1),Math.floor(s*.2)))),c=Math.max(64,Math.min(l,Math.max(64,s-256))),d=Math.max(64,s-c-128),p=Math.max(64,Math.floor(d*.25)),_=this.trimTextToApproxTokenBudget(r,p),g=Math.max(64,d-this.estimateTextTokens(_)),f=this.trimTextToApproxTokenBudget(i,g);return{systemPrompt:_||r,userPrompt:f,maxOutputTokens:c}}async resolveLmStudioReasoningValue(e,t,n,r){var d,p;let i=await this.getLmStudioModelMetadata(e,t,n),a=(d=i==null?void 0:i.reasoningAllowedOptions)!=null?d:[],s=a.map(_=>_.toLowerCase());if(s.length===0)return r==="off"?null:"on";if(r==="off"){let _=s.indexOf("off");return _>=0?a[_]:null}let o=s.indexOf("on");if(o>=0)return a[o];let l=["low","medium","high"];for(let _ of l){let g=s.indexOf(_);if(g>=0)return a[g]}let c=((i==null?void 0:i.reasoningDefault)||"").trim();return c||((p=a[0])!=null?p:null)}extractTextSegments(e){if(typeof e=="string")return e?[e]:[];if(Array.isArray(e))return e.flatMap(i=>this.extractTextSegments(i));let t=this.asRecord(e);if(!t)return[];let n=U(t.type).trim().toLowerCase();if(n==="reasoning"||n==="reasoning_content"||n==="thinking")return[];let r=[];for(let i of["text","output_text","content","value"]){let a=t[i];typeof a=="string"?a&&r.push(a):a!==void 0&&r.push(...this.extractTextSegments(a))}return r}extractTextFromChatCompletionsPayload(e){let t=this.asRecord(e);if(!t)return"";let n=[],r=Array.isArray(t.choices)?t.choices:[],i=this.asRecord(r[0]),a=this.asRecord(i==null?void 0:i.message);return n.push(...this.extractTextSegments(a==null?void 0:a.content)),n.push(...this.extractTextSegments(i==null?void 0:i.text)),n.push(...this.extractTextSegments(t.output_text)),n.join("").trim()}extractTextFromResponsesPayload(e){let t=this.asRecord(e);if(!t)return"";let n=[];n.push(...this.extractTextSegments(t.output_text));let r=Array.isArray(t.output)?t.output:[];for(let a of r){let s=this.asRecord(a);s&&(U(s.type).trim().toLowerCase()==="message"?n.push(...this.extractTextSegments(s.content)):n.push(...this.extractTextSegments(s)))}let i=this.asRecord(t.response);if(i){n.push(...this.extractTextSegments(i.output_text));let a=Array.isArray(i.output)?i.output:[];for(let s of a)n.push(...this.extractTextSegments(s))}return n.join("").trim()}extractTextFromLmStudioNativeChatPayload(e){let t=this.asRecord(e);if(!t)return"";let n=[],r=Array.isArray(t.output)?t.output:[];for(let i of r)n.push(...this.extractTextSegments(i));return n.join("").trim()}async requestLmStudioNativeText(e){var g,f;let t=this.buildLmStudioNativeChatUrl(e.baseUrl);if(!t)throw new Error("LM Studio native chat endpoint is invalid.");let n={"Content-Type":"application/json"};e.apiKey&&(n.Authorization=`Bearer ${e.apiKey}`);let r=await this.getLmStudioPromptBudget(e.baseUrl,e.apiKey,e.model,e.systemPrompt,e.userPrompt),i=(g=r==null?void 0:r.systemPrompt)!=null?g:e.systemPrompt,a=(f=r==null?void 0:r.userPrompt)!=null?f:e.userPrompt,s=r==null?void 0:r.maxOutputTokens,o=await this.resolveLmStudioReasoningValue(e.baseUrl,e.apiKey,e.model,e.reasoningMode),l=`${i}

${a}`.trim(),c={model:e.model,input:l};o&&(c.reasoning=o),s&&Number.isFinite(s)&&s>0&&(c.max_output_tokens=s);let d=await this.requestLocalApiRaw(t,{method:"POST",headers:n,body:JSON.stringify(c)});if(d.statusCode>=400){let b=d.body.toString("utf8");throw new Error(`LM Studio native chat request failed (${d.statusCode}): ${b||"no response body"}`)}let p=JSON.parse(d.body.toString("utf8")),_=this.extractTextFromLmStudioNativeChatPayload(p);if(!_)throw new Error("LM Studio native chat response missing content");return _}buildCleanupModeMemoryKey(e,t,n){return JSON.stringify({provider:(t||"").trim()||(this.isLmStudioProvider(e,t)?"lm-studio":"custom"),baseUrl:(e||"").trim().replace(/\/+$/,"").toLowerCase(),model:(n||"").trim()})}getCleanupModeMemoryEntry(e){var a;let t=this.asRecord((a=this.settings.llmCleanupModeMemory)==null?void 0:a[e]);if(!t)return null;let n=U(t.mode).trim(),r=Number(t.lastPreferredProbeAt),i=Number(t.updatedAt);return n!=="lmstudio_native_reasoning_on"&&n!=="lmstudio_native_reasoning_off"||!Number.isFinite(r)||!Number.isFinite(i)?null:{mode:n,lastPreferredProbeAt:Math.trunc(r),updatedAt:Math.trunc(i)}}async setCleanupModeMemoryEntry(e,t){let n=this.getCleanupModeMemoryEntry(e);n&&n.mode===t.mode&&n.lastPreferredProbeAt===t.lastPreferredProbeAt&&n.updatedAt===t.updatedAt||(this.settings.llmCleanupModeMemory={...this.settings.llmCleanupModeMemory||{},[e]:t},await this.saveSettings())}shouldReprobeCleanupPreferredMode(e,t=Date.now()){return e?e.mode==="lmstudio_native_reasoning_on"?!1:t-e.lastPreferredProbeAt>=rr:!0}isCleanupModeSwitchableError(e){let t=(e||"").toLowerCase();return t.includes("compute error")||t.includes("internal_error")||t.includes("reasoning setting")||t.includes("not supported by model")||t.includes("missing content")||t.includes("response missing")}buildLmStudioCleanupAttemptModes(e,t,n){let r=this.settings.llmCleanupReasoningMode||"auto";if(r==="on")return["lmstudio_native_reasoning_on"];if(r==="off")return["lmstudio_native_reasoning_off"];let i=this.buildCleanupModeMemoryKey(e,t,n),a=this.getCleanupModeMemoryEntry(i),s=[],o=l=>{s.includes(l)||s.push(l)};return a&&a.mode==="lmstudio_native_reasoning_off"?(this.shouldReprobeCleanupPreferredMode(a)&&o("lmstudio_native_reasoning_on"),o("lmstudio_native_reasoning_off"),o("lmstudio_native_reasoning_on"),s):(o("lmstudio_native_reasoning_on"),o("lmstudio_native_reasoning_off"),s)}async requestCleanupText(e,t){var _,g,f;let n=(this.settings.llmCleanupBaseUrl||"").trim().replace(/\/$/,""),r=(this.settings.llmCleanupModel||"").trim(),i=(this.settings.llmCleanupApiKey||"").trim(),a=this.settings.llmCleanupProviderProfileId;if(!this.isLmStudioProvider(n,a))return this.requestLlmText({baseUrl:n,apiKey:i,model:r,temperature:Number((_=this.settings.llmCleanupTemperature)!=null?_:0),systemPrompt:e,userPrompt:t,endpointMode:"chat"});let o=this.settings.llmCleanupReasoningMode||"auto",l=this.buildCleanupModeMemoryKey(n,a,r),c=this.buildLmStudioCleanupAttemptModes(n,a,r),d=!1,p=null;for(let b of c){b==="lmstudio_native_reasoning_on"&&(d=!0);try{let k=await this.requestLmStudioNativeText({baseUrl:n,apiKey:i,model:r,systemPrompt:e,userPrompt:t,reasoningMode:b==="lmstudio_native_reasoning_on"?"on":"off"});if(o==="auto"){let m=Date.now(),x={mode:b,lastPreferredProbeAt:b==="lmstudio_native_reasoning_on"||d?m:(f=(g=this.getCleanupModeMemoryEntry(l))==null?void 0:g.lastPreferredProbeAt)!=null?f:0,updatedAt:m};await this.setCleanupModeMemoryEntry(l,x)}return k}catch(k){p=k;let m=k instanceof Error?k.message:String(k),x=b===c[c.length-1];if(o!=="auto"||!this.isCleanupModeSwitchableError(m)||x){if(o==="auto"&&d&&x){let w=this.getCleanupModeMemoryEntry(l);w&&w.mode==="lmstudio_native_reasoning_off"&&await this.setCleanupModeMemoryEntry(l,{...w,lastPreferredProbeAt:Date.now(),updatedAt:w.updatedAt})}break}}}if(o==="auto"&&d){let b=this.getCleanupModeMemoryEntry(l);b&&b.mode==="lmstudio_native_reasoning_off"&&await this.setCleanupModeMemoryEntry(l,{...b,lastPreferredProbeAt:Date.now()})}throw p instanceof Error?p:new Error(String(p))}async requestLlmText(e){var c,d;let t=(e.baseUrl||"").trim().replace(/\/$/,""),n={"Content-Type":"application/json"};e.apiKey&&(n.Authorization=`Bearer ${e.apiKey}`);let r=await this.getLmStudioPromptBudget(t,e.apiKey,e.model,e.systemPrompt,e.userPrompt),i=(c=r==null?void 0:r.systemPrompt)!=null?c:e.systemPrompt,a=(d=r==null?void 0:r.userPrompt)!=null?d:e.userPrompt,s=r==null?void 0:r.maxOutputTokens,o=async(p,_)=>{var x;let g=`${t}/${p==="responses"?"responses":"chat/completions"}`,f=p==="responses"?{model:e.model,instructions:i,input:a}:{model:e.model,messages:[{role:"system",content:i},{role:"user",content:a}]};s&&Number.isFinite(s)&&s>0&&(p==="responses"?f.max_output_tokens=s:f.max_tokens=s),_&&Number.isFinite((x=e.temperature)!=null?x:NaN)&&(f.temperature=Number(e.temperature));let b=await this.requestLocalApiRaw(g,{method:"POST",headers:n,body:JSON.stringify(f)});if(b.statusCode>=400){let w=b.body.toString("utf8");throw new Error(`${p==="responses"?"Responses":"Chat"} request failed (${b.statusCode}): ${w||"no response body"}`)}let k=JSON.parse(b.body.toString("utf8")),m=p==="responses"?this.extractTextFromResponsesPayload(k):this.extractTextFromChatCompletionsPayload(k);if(!m)throw new Error(p==="responses"?"Responses response missing content":"Chat response missing content");return m},l=async p=>{try{return await o(p,!0)}catch(_){let g=_ instanceof Error?_.message:String(_);if(this.isTemperatureUnsupportedMessage(g))return o(p,!1);throw _}};if(e.endpointMode==="responses")try{return await l("responses")}catch(p){let _=p instanceof Error?p.message:String(p);if(this.isResponsesEndpointUnsupportedMessage(_))return l("chat");throw p}return l("chat")}logOptionalLookupFailure(e,t){if(this.isOptionalLookupNetworkError(t)){console.debug(`${e} (network unavailable)`,t);return}console.warn(e,t)}getPythonErrorMessage(e){if(e instanceof Error)return e.message||String(e);if(typeof e=="string")return e;try{return JSON.stringify(e)}catch(t){return String(e)}}summarizePythonDiagnostic(e,t){let n=e.split(/\r?\n/).map(a=>a.trimEnd()).filter(a=>!!a.trim());if(!n.length)return t;let r=n.findIndex(a=>a.startsWith("Traceback"));if(r>=0)return n.slice(r).slice(-12).join(`
`);let i=[...n].reverse().find(a=>/(^error[:\s]|exception|traceback|failed|timed out|timeout|no module named|not found|enoent|econnrefused|enotfound|valueerror|typeerror|runtimeerror|importerror)/i.test(a));return i||n.slice(-8).join(`
`)}buildImportTempPath(e,t){let n=(0,h.normalizePath)(E.default.dirname(e)),r=E.default.extname(e),i=E.default.basename(e,r),a=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;return(0,h.normalizePath)(E.default.join(n,`${i}.zrr-${t}-${a}${r}`))}async removeVaultFilesIfExist(e){let t=this.app.vault.adapter;for(let n of e){let r=(0,h.normalizePath)(n||"");if(r)try{await t.exists(r)&&await t.remove(r)}catch(i){console.warn("Failed to remove temporary import file",{target:r,error:i})}}}async replaceVaultFile(e,t){let n=this.app.vault.adapter,r=(0,h.normalizePath)(e),i=(0,h.normalizePath)(t);if(!r||!i||r===i)return;let a=(0,h.normalizePath)(E.default.dirname(i));a&&await this.ensureFolder(a),await n.exists(i)&&await n.remove(i),await n.rename(r,i)}async cleanupIndexedChunksForDoc(e){if(e)try{let t=this.getPluginDir(),n=E.default.join(t,"tools","delete_redis_doc_chunks.py");await this.runPython(n,["--redis-url",this.settings.redisUrl,"--prefix",this.getRedisKeyPrefix(),"--doc-id",e])}catch(t){console.warn("Failed to clean up Redis chunks after import failure",{docId:e,error:t})}}classifyIndexingError(e){let t=e.toLowerCase();return t.includes("embedding dim mismatch")||t.includes("dim mismatch")?"embed_dim_mismatch":t.includes("chunks json not found")?"chunks_missing":this.isRateLimitErrorMessage(e)&&(t.includes("embedding request failed")||t.includes("failed to embed query"))?"rate_limited":t.includes("embedding failed")||t.includes("embedding request failed")||t.includes("unloaded")||t.includes("crashed")||t.includes("model does not exist")||t.includes("failed to load model")||t.includes("connection refused")||t.includes("econnrefused")||t.includes("max retries exceeded")||t.includes("failed to establish a new connection")||t.includes("failed to fetch models")?"embed_failure":"unknown"}async confirmRebuildIndex(e){return new Promise(t=>{new at(this.app,e,t).open()})}async confirmPurgeRedisOrphans(){return new Promise(e=>{new st(this.app,e).open()})}async dropRedisIndex(e=!1){await this.ensureBundledTools();let t=this.getPluginDir(),n=E.default.join(t,"tools","drop_redis_index.py"),r=["--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName()];e&&r.push("--drop-docs"),await this.runPython(n,r)}async dropAndRebuildRedisIndex(){if(this.reindexCacheActive){new h.Notice("Reindex already running.");return}if(!(!await this.ensureRedisAvailable("drop/rebuild")||!await this.confirmRebuildIndex("This will remove the current RedisSearch index and rebuild it from cached chunks."))){try{await this.dropRedisIndex(!0)}catch(t){let n=t instanceof Error?t.message:String(t);if(n.includes("Unknown Index name")||n.includes("Unknown index name"))console.warn("Redis index missing; skipping drop step.");else{console.error("Failed to drop Redis index",t),new h.Notice("Failed to drop redis index. See console for details.");return}}await this.reindexRedisFromCache()}}async purgeRedisOrphanedKeys(){var i,a,s,o,l;if(!await this.ensureRedisAvailable("purge orphans")||!await this.confirmPurgeRedisOrphans())return;try{await this.ensureBundledTools()}catch(c){new h.Notice("Failed to sync bundled tools. See console for details."),console.error(c);return}let t=this.getPluginDir(),n=E.default.join(t,"tools","purge_redis_orphans.py"),r=["--redis-url",this.settings.redisUrl,"--key-prefix",this.getRedisKeyPrefix(),"--chunk-dir",this.getAbsoluteVaultPath(te),"--item-dir",this.getAbsoluteVaultPath(ce)];try{let c=await this.runPythonWithOutput(n,r),d=null;try{d=c?JSON.parse(c):null}catch(w){console.warn("Failed to parse purge output",w)}if(!d){new h.Notice("Purge completed. See console for details.");return}let p=(i=this.asRecord(d))!=null?i:{},_=Number((a=p.keys_scanned)!=null?a:0),g=Number((s=p.keys_deleted)!=null?s:0),f=Number((o=p.docs_checked)!=null?o:0),b=Number((l=p.orphan_doc_count)!=null?l:0),k=[`Keys scanned: ${_}`,`Keys deleted: ${g}`,`Docs checked: ${f}`,`Orphan docs: ${b}`],m=await this.pruneDocIndexOrphans();k.push(`Doc index entries removed: ${m.removed}`),m.updated>0&&k.push(`Doc index entries updated: ${m.updated}`);let x=Array.isArray(p.sample_orphan_doc_ids)?p.sample_orphan_doc_ids.filter(Boolean):[];x.length&&k.push("","Sample doc_ids:",...x.map(w=>`- ${w}`)),new Ee(this.app,"Redis orphan purge",k.join(`
`)).open(),g===0?new h.Notice("No orphaned redis keys found."):new h.Notice(`Deleted ${g} Redis keys.`)}catch(c){console.error("Failed to purge Redis orphans",c),new h.Notice("Failed to purge redis orphans. See console for details.")}}async reindexRedisFromCache(){if(this.lastReindexFailure=null,this.reindexCacheActive)return new h.Notice("Reindex already running."),this.lastReindexFailure="busy",!1;this.reindexCacheActive=!0;let e=null,t=0;try{await this.ensureBundledTools()}catch(o){return new h.Notice("Failed to sync bundled tools. See console for details."),console.error(o),this.reindexCacheActive=!1,this.lastReindexFailure="tools_error",!1}if(!await this.ensureRedisAvailable("reindex"))return this.reindexCacheActive=!1,this.lastReindexFailure="redis_unavailable",!1;let n=await this.listDocIds(te);if(n.length===0)return new h.Notice("No cached chunks found."),this.reindexCacheActive=!1,this.lastReindexFailure="no_cache",!1;let r=this.getPluginDir(),i=E.default.join(r,"tools","index_redisearch.py"),a=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null,s=0;this.showStatusProgress("Reindexing cached chunks...",0),a&&this.appendToLogFile(a,`Reindex started: ${n.length} cached items`,"index_redisearch","INFO");for(let o of n){s+=1;let l=Math.round(s/n.length*100);this.showStatusProgress(`Reindexing ${s}/${n.length}`,l);let c=(0,h.normalizePath)(`${te}/${o}.json`);try{let d=["--chunks-json",this.getAbsoluteVaultPath(c),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"];this.appendEmbedSubchunkArgs(d),this.appendEmbedContextArgs(d),this.settings.embedIncludeMetadata&&d.push("--embed-include-metadata"),this.appendChunkTaggingArgs(d,{allowRegenerate:!1}),a&&this.appendToLogFile(a,`Reindexing doc_id ${o}`,"index_redisearch","INFO"),await this.runPythonStreaming(i,d,p=>{let _=this.asRecord(p);if(!(!a||!_)&&_.type==="progress"&&_.message){let g=typeof _.message=="string"?_.message:"";if(!g)return;this.appendToLogFile(a,g,"index_redisearch","INFO")}},()=>{},a,"index_redisearch")}catch(d){t+=1;let p=this.getPythonErrorMessage(d),_=this.classifyIndexingError(p);if(console.error(`Failed to reindex ${o}`,d),_==="chunks_missing"){new h.Notice(`Chunks cache missing for ${o}. Reimport or rebuild this note.`);continue}if(_==="embed_dim_mismatch"){e={kind:"embed_dim_mismatch",message:p};break}if(_==="rate_limited"){e={kind:"embed_failure",message:p};break}if(_==="embed_failure"){e={kind:"embed_failure",message:p};break}}}if(e){if(this.showStatusProgress("Aborted",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),this.reindexCacheActive=!1,e.kind==="embed_dim_mismatch"){if(await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema."))try{return await this.dropRedisIndex(!0),await this.reindexRedisFromCache()}catch(l){return new h.Notice("Failed to drop/rebuild the redis index. See console for details."),console.error(l),this.lastReindexFailure="unknown",!1}this.lastReindexFailure="embed_dim_mismatch"}else this.isRateLimitErrorMessage(e.message)?(new h.Notice(this.getEmbeddingRateLimitMessage("rerun")),this.lastReindexFailure="rate_limited"):(new h.Notice(this.isLmStudioTagModelUnloadedMessage(e.message)?this.getLmStudioTagModelUnloadedMessage("rerun_reindexing"):"Embedding provider error detected. Fix the provider/model settings and rerun reindexing."),this.lastReindexFailure="embed_failure");return!1}this.showStatusProgress("Done",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),t===0?new h.Notice(`Reindexed ${n.length} cached items.`):new h.Notice(`Reindexed ${n.length-t}/${n.length} items (see console).`);try{await this.pruneDocIndexOrphans()}catch(o){console.warn("Failed to prune doc index orphans",o)}return this.reindexCacheActive=!1,this.lastReindexFailure=null,!0}async reindexDocIdFromCache(e,t){if(this.lastReindexFailure=null,this.reindexCacheActive)return t&&new h.Notice("Reindex already running."),this.lastReindexFailure="busy",!1;this.reindexCacheActive=!0;try{await this.ensureBundledTools()}catch(o){return t&&new h.Notice("Failed to sync bundled tools. See console for details."),console.error(o),this.reindexCacheActive=!1,this.lastReindexFailure="tools_error",!1}if(!await this.ensureRedisAvailable("reindex"))return this.reindexCacheActive=!1,this.lastReindexFailure="redis_unavailable",!1;let n=(0,h.normalizePath)(`${te}/${e}.json`);if(!await this.app.vault.adapter.exists(n))return t&&new h.Notice(`Chunks cache missing for ${e}.`),this.reindexCacheActive=!1,this.lastReindexFailure="no_cache",!1;let i=this.getPluginDir(),a=E.default.join(i,"tools","index_redisearch.py"),s=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;this.showStatusProgress(`Reindexing ${e}...`,0),s&&this.appendToLogFile(s,`Reindexing doc_id ${e}`,"index_redisearch","INFO");try{let o=["--chunks-json",this.getAbsoluteVaultPath(n),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"];this.appendEmbedSubchunkArgs(o),this.appendEmbedContextArgs(o),this.settings.embedIncludeMetadata&&o.push("--embed-include-metadata"),this.appendChunkTaggingArgs(o,{allowRegenerate:!1}),await this.runPythonStreaming(a,o,l=>{let c=this.asRecord(l),d=typeof(c==null?void 0:c.total)=="number"?c.total:0,p=typeof(c==null?void 0:c.current)=="number"?c.current:0;if((c==null?void 0:c.type)==="progress"&&d>0){let _=Math.round(p/d*100),g=typeof c.message=="string"&&c.message.trim()?c.message:`Indexing chunks ${p}/${d}`;this.showStatusProgress(this.formatStatusLabel(g),_)}},()=>{},s,"index_redisearch")}catch(o){let l=this.getPythonErrorMessage(o),c=this.classifyIndexingError(l);if(console.error(`Failed to reindex ${e}`,o),c==="embed_dim_mismatch"){if(this.lastReindexFailure="embed_dim_mismatch",t&&await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema."))try{return await this.dropRedisIndex(!0),this.reindexCacheActive=!1,await this.reindexRedisFromCache()}catch(p){new h.Notice("Failed to drop/rebuild the redis index. See console for details."),console.error(p),this.lastReindexFailure="unknown"}}else c==="rate_limited"?(this.lastReindexFailure="rate_limited",t&&new h.Notice(this.getEmbeddingRateLimitMessage("rerun"))):c==="embed_failure"?(this.lastReindexFailure="embed_failure",t&&new h.Notice(this.isLmStudioTagModelUnloadedMessage(l)?this.getLmStudioTagModelUnloadedMessage("rerun_reindexing"):"Embedding provider error detected. Fix the provider/model settings and rerun reindexing.")):t&&new h.Notice(`Failed to reindex ${e}. See console for details.`);return this.showStatusProgress("Failed",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),this.reindexCacheActive=!1,!1}return this.showStatusProgress("Done",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),this.reindexCacheActive=!1,!0}async reindexChunkUpdates(e,t,n,r){if(!n.length&&!r.length||!await this.ensureRedisAvailable("reindex updates"))return;let i=this.getPluginDir(),a=E.default.join(i,"tools","index_redisearch.py"),s=["--chunks-json",this.getAbsoluteVaultPath(t),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"];this.appendEmbedSubchunkArgs(s),this.appendEmbedContextArgs(s),this.settings.embedIncludeMetadata&&s.push("--embed-include-metadata"),this.appendChunkTaggingArgs(s,{allowRegenerate:!1}),n.length&&s.push("--chunk-ids",n.join(",")),r.length&&s.push("--delete-chunk-ids",r.join(","));try{await this.runPython(a,s)}catch(o){let l=this.getPythonErrorMessage(o),c=this.classifyIndexingError(l);if(console.error(`Failed to reindex updated chunks for ${e}`,o),c==="embed_dim_mismatch"){if(await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema."))try{await this.dropRedisIndex(!0),await this.reindexRedisFromCache()}catch(p){new h.Notice("Failed to drop/rebuild the redis index. See console for details."),console.error(p)}return}if(c==="rate_limited"){new h.Notice(this.getEmbeddingRateLimitMessage("rerun"));return}c==="embed_failure"&&new h.Notice(this.isLmStudioTagModelUnloadedMessage(l)?this.getLmStudioTagModelUnloadedMessage("retry"):"Embedding provider error detected. Fix the provider/model settings and rerun.")}}async promptZoteroItem(){return new Promise(e=>{new dt(this.app,this,e).open()})}async listDocIds(e){let t=this.app.vault.adapter,n=(0,h.normalizePath)(e);return await t.exists(n)?(await t.list(n)).files.filter(i=>i.endsWith(".json")).map(i=>E.default.basename(i,".json")):[]}async listMarkdownFiles(e){let t=this.app.vault.adapter,n=(0,h.normalizePath)(e);if(!await t.exists(n))return[];let r=[n],i=[];for(;r.length>0;){let a=r.pop();if(!a)continue;let s=await t.list(a);for(let o of s.files)o.endsWith(".md")&&i.push(o);for(let o of s.folders)r.push(o)}return i}getZoteroFrontmatterKeyVariants(e){let t=e.replace(/_/g," "),n=new Set([t,e,e.replace(/_/g,"-")]);if(e.includes("_")){let r=e.split("_"),i=r[0]+r.slice(1).map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join("");n.add(i)}return Array.from(n)}getFrontmatterValue(e,t){if(!e)return;let n=this.getZoteroFrontmatterKeyVariants(t);for(let r of n)if(Object.prototype.hasOwnProperty.call(e,r))return e[r]}hasFrontmatterKey(e,t){if(!e)return!1;let n=this.getZoteroFrontmatterKeyVariants(t);for(let r of n)if(Object.prototype.hasOwnProperty.call(e,r))return!0;return!1}normalizeZoteroFrontmatterKeys(e){let t=!1;for(let n of fn){let r=n.replace(/_/g," "),i=this.getZoteroFrontmatterKeyVariants(n),a=Object.prototype.hasOwnProperty.call(e,r),s=a?e[r]:void 0;if(!a){for(let o of i)if(o!==r&&Object.prototype.hasOwnProperty.call(e,o)){s=e[o];break}}if(s!==void 0){a||(e[r]=s,t=!0);for(let o of i)o!==r&&Object.prototype.hasOwnProperty.call(e,o)&&(delete e[o],t=!0)}}return t}async normalizeZoteroFrontmatterKeysInFile(e){let t=this.app.metadataCache.getFileCache(e),n=t==null?void 0:t.frontmatter;if(!n)return;let r=this.getFrontmatterValue(n,"doc_id"),i=this.getFrontmatterValue(n,"zotero_key");if(!r&&!i)return;let a={...n};if(!this.normalizeZoteroFrontmatterKeys(a))return;let s=e.path;this.noteSyncSuppressed.add(s),this.noteMetadataSyncSuppressed.add(s);try{await this.app.fileManager.processFrontMatter(e,o=>{this.normalizeZoteroFrontmatterKeys(o)})}catch(o){console.warn("Failed to normalize Zotero frontmatter keys",o)}finally{activeWindow.setTimeout(()=>{this.noteSyncSuppressed.delete(s),this.noteMetadataSyncSuppressed.delete(s)},1500)}}normalizeFrontmatterKeySpacing(e){return e.trim()?e.split(/\r?\n/).map(r=>{var l,c;if(/^\s+-\s+/.test(r)||!r.includes(":")||((c=(l=r.match(/^\s*/))==null?void 0:l[0])!=null?c:""))return r;let a=r.indexOf(":");if(a<=0)return r;let s=r.slice(0,a).trim(),o=r.slice(a);for(let d of fn){let p=d.replace(/_/g," ");if(this.getZoteroFrontmatterKeyVariants(d).includes(s))return`${p}${o}`}return r}).join(`
`):e}extractDocIdFromFrontmatter(e){let t=e.match(/^---\s*\n([\s\S]*?)\n---/);if(!t)return null;let r=t[1].split(/\r?\n/);for(let i of r){let a=i.trim();if(!a||a.startsWith("#"))continue;let s=a.split(":");if(s.length<2)continue;let o=s[0].trim().toLowerCase();if(o!=="doc_id"&&o!=="doc id"&&o!=="doc-id"&&o!=="zotero_key"&&o!=="zotero key"&&o!=="zotero-key")continue;let c=a.slice(a.indexOf(":")+1).trim().replace(/^["']|["']$/g,"").trim();if(c)return c}return null}hasDocIdFieldInFrontmatter(e){let t=e.match(/^---\s*\n([\s\S]*?)\n---/);return t?/^\s*doc(?:[_\s-]?id)\s*:/im.test(t[1]):!1}ensureDocIdInFrontmatter(e,t){let n=e.trim(),r=`doc id: ${this.escapeYamlString(t)}`;return n?/^\s*doc(?:[_\s-]?id)\s*:/im.test(n)?n:`${r}
${n}`:r}ensureDocIdInNoteContent(e,t){var _,g;let n=e.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/),r=`doc id: ${this.escapeYamlString(t)}`;if(!n)return`---
${r}
---

${e.trimStart()}`;let a=((_=n[1])!=null?_:"").split(/\r?\n/),s=!1,o=a.map(f=>/^\s*doc(?:[_\s-]?id)\s*:/i.test(f)?(s=!0,r):f);s||o.unshift(r);let l=o.join(`
`).trim(),c=(g=n.index)!=null?g:0,d=e.slice(0,c),p=e.slice(c+n[0].length).replace(/^\n+/,"");return`${d}---
${l}
---
${p}`}async findDocIdByNotePath(e){let t=(0,h.normalizePath)(e),n=await this.getDocIndex();for(let[r,i]of Object.entries(n))if(i!=null&&i.note_path&&(0,h.normalizePath)(i.note_path)===t)return r;return null}async resolveDocIdForNote(e,t){let n=this.extractDocIdFromFrontmatter(t),r=this.hasDocIdFieldInFrontmatter(t);if(n&&r)return n;let i=this.extractDocIdFromSyncMarker(t),a=await this.findDocIdByNotePath(e.path),s=n||i||a;if(!s)return we.test(t)&&!this.missingDocIdWarned.has(e.path)&&(new h.Notice("This Zotero note is missing a doc_ID in frontmatter. Reimport or add doc_ID manually."),this.missingDocIdWarned.add(e.path)),null;if(!r||!n){let o=this.ensureDocIdInNoteContent(t,s);o!==t&&await this.writeNoteWithSyncSuppressed(e.path,o)}return s}async scanNotesForDocIds(e){var i;let t=this.app.vault.adapter,n=await this.listMarkdownFiles(e),r={};for(let a of n)try{let s=await t.read(a),o=(i=this.extractDocIdFromFrontmatter(s))!=null?i:this.extractDocIdFromSyncMarker(s);if(!o)continue;r[o]={doc_id:o,note_path:a,note_title:E.default.basename(a,".md"),updated_at:new Date().toISOString()}}catch(s){console.error("Failed to read note for doc_id scan",s)}return r}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.addClass("status-bar-item-segment"),e.hide();let t=e.createSpan({text:"Idle"});t.addClass("zrr-status-label");let r=e.createDiv({cls:"zrr-status-bar"}).createDiv({cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=t,this.statusBarInnerEl=r}showStatusProgress(e,t){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.show(),this.statusLabelEl.setText(e),t===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.addClass("zrr-status-bar-inner--indeterminate-width"),this.statusBarInnerEl.removeClass("zrr-status-bar-inner--zero-width");else{this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.removeClass("zrr-status-bar-inner--indeterminate-width"),this.statusBarInnerEl.removeClass("zrr-status-bar-inner--zero-width");let n=Math.max(0,Math.min(100,t));this.statusBarInnerEl.style.setProperty("width",`${n}%`)}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.hide(),this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.removeClass("zrr-status-bar-inner--indeterminate-width"),this.statusBarInnerEl.addClass("zrr-status-bar-inner--zero-width"))}formatStatusLabel(e,t){return t?`${e} (Text layer quality ${t})`:e}async readDoclingQualityLabel(e){var t,n,r;try{let i=await this.app.vault.adapter.read(e),a=JSON.parse(i),s=(r=(t=a==null?void 0:a.metadata)==null?void 0:t.effective_confidence_proxy)!=null?r:(n=a==null?void 0:a.metadata)==null?void 0:n.confidence_proxy;if(typeof s=="number")return s.toFixed(2)}catch(i){console.warn("Failed to read Docling quality metadata",i)}return null}async readDoclingMetadata(e){try{let t=await this.app.vault.adapter.read(e),n=JSON.parse(t),r=n==null?void 0:n.metadata;if(r&&typeof r=="object")return r}catch(t){console.warn("Failed to read Docling metadata",t)}return null}async readDoclingQualityLabelFromPdf(e,t){var n;try{let r=this.getPluginDir(),i=E.default.join(r,"tools","docling_extract.py"),a=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,s=["--quality-only","--pdf",e,"--ocr",a],o=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;o&&s.push("--log-file",o),this.settings.ocrMode==="force_low_quality"&&s.push("--force-ocr-low-quality"),s.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),t&&s.push("--language-hint",t);let l=await this.runPythonWithOutput(i,s,o),c=JSON.parse(l),d=(n=c==null?void 0:c.effective_confidence_proxy)!=null?n:c==null?void 0:c.confidence_proxy;if(typeof d=="number")return d.toFixed(2)}catch(r){console.warn("Failed to read Docling quality from PDF",r)}return null}async promptDocId(){return new Promise(e=>{new Fe(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",t=>e(t),"Doc ID cannot be empty.").open()})}async promptLanguageHint(){return new Promise(e=>{new ct(this.app,e).open()})}registerRibbonIcons(){(0,h.addIcon)("zrr-picker",Vn),(0,h.addIcon)("zrr-chat",Bn),(0,h.addIcon)("zrr-pdf",pn),this.addRibbonIcon("zrr-picker","Import Zotero item and index",()=>this.importZoteroItem()).addClass("zrr-ribbon-picker"),this.addRibbonIcon("zrr-chat","Open Zotero research assistant chat",()=>this.openChatView(!0)).addClass("zrr-ribbon-chat"),this.addRibbonIcon("zrr-pdf","Sync PDF view in right sidebar for current note",()=>{this.syncPdfSidebarForActiveNote({revealSidebar:!0})}).addClass("zrr-ribbon-pdf")}async confirmOverwrite(e){return new Promise(t=>{new rt(this.app,e,t).open()})}async resolveLanguageHint(e,t){let n=typeof e.language=="string"?e.language:"",r=this.normalizeZoteroLanguage(n);if(r)return r;let i=await this.promptLanguageHint();if(i===null)return console.debug("Language selection canceled."),null;let a=this.normalizeZoteroLanguage(i);if(!a)return console.debug("Language selection empty; skipping Zotero update."),"";if(e.language=a,console.debug("Language selected",{language:a,itemKey:t}),t)try{await this.updateZoteroItemLanguage(t,e,a),new h.Notice("Saved language to Zotero.")}catch(s){new h.Notice("Failed to write language back to Zotero."),console.error(s)}else console.warn("Language selected but itemKey is missing; skipping Zotero update.");return a}normalizeZoteroLanguage(e){return(e||"").trim().toLowerCase()}buildDoclingLanguageHint(e){let t=this.normalizeZoteroLanguage(e!=null?e:"");if(!t)return null;let n=t.split(/[^a-z]+/).filter(Boolean),r=n.some(a=>["de","deu","ger","german"].includes(a)),i=n.some(a=>["en","eng","english"].includes(a));return r&&i?"deu+eng":r?"deu":i?"eng":n.length===1&&dn[n[0]]?dn[n[0]]:t}async fetchZoteroItem(e){try{let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),n=await this.requestLocalApi(t,`Zotero item fetch failed for ${t}`);return JSON.parse(n.toString("utf8"))}catch(t){return console.warn("Failed to fetch Zotero item from local API",t),this.canUseWebApi()?this.fetchZoteroItemWeb(e):null}}async fetchZoteroItemCsl(e){try{let t=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}?format=csljson`),n=await this.requestLocalApi(t,`Zotero CSL fetch failed for ${t}`);return this.parseCslPayload(n)}catch(t){return console.warn("Failed to fetch Zotero CSL from local API",t),this.canUseWebApi()?this.fetchZoteroItemCslWeb(e):null}}async fetchZoteroCollectionTitle(e){var i,a,s,o,l,c;let t=(e||"").trim();if(!t)return"";let n=this.collectionTitleCache.get(t);if(n!==void 0)return n;let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/collections/${t}`);try{let d=await this.requestLocalApi(r,`Zotero collection fetch failed for ${r}`),p=JSON.parse(d.toString("utf8")),_=String((s=(a=(i=p==null?void 0:p.data)==null?void 0:i.name)!=null?a:p==null?void 0:p.name)!=null?s:"").trim();return this.collectionTitleCache.set(t,_),_}catch(d){if(!this.canUseWebApi())return this.collectionTitleCache.set(t,""),"";try{let p=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/collections/${t}`),_=await this.requestWebApi(p,`Zotero Web API collection fetch failed for ${p}`),g=JSON.parse(_.toString("utf8")),f=String((c=(l=(o=g==null?void 0:g.data)==null?void 0:o.name)!=null?l:g==null?void 0:g.name)!=null?c:"").trim();return this.collectionTitleCache.set(t,f),f}catch(p){return console.warn("Failed to fetch Zotero collection title",p),this.collectionTitleCache.set(t,""),""}}}async resolveCollectionTitles(e){let n=(Array.isArray(e.collections)?e.collections:[]).map(i=>String(i||"").trim()).filter(Boolean);if(!n.length)return[];let r=[];for(let i of n){let a=await this.fetchZoteroCollectionTitle(i);a&&r.push(a)}return r}async fetchZoteroItemWeb(e){try{let t=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}`),n=await this.requestWebApi(t,`Zotero Web API fetch failed for ${t}`);return JSON.parse(n.toString("utf8"))}catch(t){return console.warn("Failed to fetch Zotero item from Web API",t),null}}async fetchZoteroItemCslWeb(e){try{let t=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}?format=csljson`),n=await this.requestWebApi(t,`Zotero Web API CSL fetch failed for ${t}`);return this.parseCslPayload(n)}catch(t){return console.warn("Failed to fetch Zotero CSL from Web API",t),null}}parseCslPayload(e){try{let t=JSON.parse(e.toString("utf8"));return Array.isArray(t)?typeof t[0]=="object"&&t[0]?t[0]:null:typeof t=="object"&&t?t:null}catch(t){return console.warn("Failed to parse CSL payload",t),null}}async searchZoteroItemsWeb(e){let t=e.trim(),n=["data"];for(let r of n){let i=new URLSearchParams;i.set("itemType","-attachment"),i.set("limit","25"),i.set("include",r),t?i.set("q",t):(i.set("sort","dateAdded"),i.set("direction","desc"));let a=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/top?${i.toString()}`);try{let s=await this.requestWebApi(a,`Zotero Web API search failed for ${a}`),o=JSON.parse(s.toString("utf8"));return Array.isArray(o)?this.normalizeZoteroSearchResults(o):[]}catch(s){console.warn("Failed to search Zotero via web API",s)}}return[]}normalizeZoteroSearchResults(e){return e.map(t=>{var s,o,l,c;let n=(s=this.asRecord(t))!=null?s:{},r=(o=this.asRecord(n.data))!=null?o:{},i=(l=this.asRecord(n.meta))!=null?l:{},a=(c=n.key)!=null?c:r.key;return{key:typeof a=="string"?a:"",data:r,meta:i}}).filter(t=>this.isImportableZoteroResult(t))}isImportableZoteroResult(e){var i,a;if(!(typeof e.key=="string"?e.key.trim():""))return!1;let n=typeof((i=e.data)==null?void 0:i.itemType)=="string"?e.data.itemType.trim().toLowerCase():"";return!(n==="attachment"||n==="note"||n==="annotation"||!(typeof((a=e.data)==null?void 0:a.title)=="string"?e.data.title.trim():""))}async updateZoteroItemLanguage(e,t,n){try{await this.updateZoteroItemLanguageLocal(e,t,n);return}catch(r){if(!this.canUseWebApi())throw r;let i=r instanceof Error?r.message:String(r);console.debug("Local Zotero write failed; trying Web API",{itemKey:e,reason:i}),await this.updateZoteroItemLanguageWeb(e,t,n)}}async updateZoteroItemLanguageLocal(e,t,n){var x,w;let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),i={...t,language:n},a={"Content-Type":"application/json","Zotero-API-Version":"3"},s=typeof i.version=="number"?i.version:Number(i.version);Number.isNaN(s)||(a["If-Unmodified-Since-Version"]=String(s)),console.debug("Zotero language PUT",{url:r,itemKey:e,language:n});try{let S=await this.requestLocalApiWithBody(r,"PUT",i,a,`Zotero update failed for ${r}`);console.debug("Zotero language PUT response",{status:S.statusCode})}catch(S){if(!(S instanceof Error?S.message:String(S)).includes("status 501"))throw S;let P=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.debug("Zotero language PUT unsupported; trying POST",{postUrl:P});let A=await this.requestLocalApiWithBody(P,"POST",[i],a,`Zotero update failed for ${P}`);console.debug("Zotero language POST response",{status:A.statusCode})}let o=this.asRecord(await this.fetchZoteroItem(e)),l=this.asRecord(o==null?void 0:o.data);if(this.normalizeZoteroLanguage(typeof(l==null?void 0:l.language)=="string"?l.language:"")===this.normalizeZoteroLanguage(n))return;let d={...l!=null?l:t,language:n},p={key:e,version:(w=(x=l==null?void 0:l.version)!=null?x:o==null?void 0:o.version)!=null?w:s,data:d},_={...a},g=typeof p.version=="number"?p.version:Number(p.version);Number.isNaN(g)?delete _["If-Unmodified-Since-Version"]:_["If-Unmodified-Since-Version"]=String(g);let f=await this.requestLocalApiWithBody(r,"PUT",p,_,`Zotero update failed for ${r}`);console.debug("Zotero language PUT retry response",{status:f.statusCode});let b=this.asRecord(await this.fetchZoteroItem(e)),k=this.asRecord(b==null?void 0:b.data);if(this.normalizeZoteroLanguage(typeof(k==null?void 0:k.language)=="string"?k.language:"")!==this.normalizeZoteroLanguage(n))throw new Error("Language update did not persist in Zotero.")}async updateZoteroItemLanguageWeb(e,t,n){var b,k;let r=this.getWebApiLibraryPath();if(!r)throw new Error("Web API library path is not configured.");let i=this.buildWebApiUrl(`/${r}/items/${e}`),a=this.asRecord(await this.fetchZoteroItemWeb(e)),s=this.asRecord(a==null?void 0:a.data),o={...s!=null?s:t,language:n},l={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},c=(k=(b=s==null?void 0:s.version)!=null?b:a==null?void 0:a.version)!=null?k:t==null?void 0:t.version,d=typeof c=="number"?c:Number(c);Number.isNaN(d)||(l["If-Unmodified-Since-Version"]=String(d)),console.debug("Zotero Web API language PUT",{url:i,itemKey:e,language:n});let p=await this.requestWebApiWithBody(i,"PUT",o,l,`Zotero Web API update failed for ${i}`);console.debug("Zotero Web API language PUT response",{status:p.statusCode});let _=this.asRecord(await this.fetchZoteroItemWeb(e)),g=this.asRecord(_==null?void 0:_.data);if(this.normalizeZoteroLanguage(typeof(g==null?void 0:g.language)=="string"?g.language:"")!==this.normalizeZoteroLanguage(n))throw new Error("Language update did not persist in Zotero Web API.")}async updateZoteroItemFields(e,t,n){let r=async(i,a)=>{let s=this.buildCitationKeyFallbackUpdates(n);return!s||!this.isCitationKeyFieldUnsupportedError(a)?!1:(console.debug("Retrying Zotero metadata update without native citationKey field",{itemKey:e}),await i(s),!0)};try{await this.updateZoteroItemFieldsLocal(e,t,n);return}catch(i){if(await r(s=>this.updateZoteroItemFieldsLocal(e,t,s),i))return;if(!this.canUseWebApi())throw i;let a=i instanceof Error?i.message:String(i);console.debug("Local Zotero write failed; trying Web API",{itemKey:e,reason:a});try{await this.updateZoteroItemFieldsWeb(e,t,n)}catch(s){if(await r(o=>this.updateZoteroItemFieldsWeb(e,t,o),s))return;throw s}}}buildCitationKeyFallbackUpdates(e){if(!Object.prototype.hasOwnProperty.call(e,"citationKey"))return null;let t={...e};return delete t.citationKey,t}isCitationKeyFieldUnsupportedError(e){let t=e instanceof Error?e.message:String(e);if(!t)return!1;let n=t.toLowerCase();return!n.includes("citationkey")&&!n.includes("citation-key")&&!n.includes("citation key")?!1:n.includes("unknown field")||n.includes("unknown property")||n.includes("invalid field")||n.includes("invalid property")||n.includes("unsupported")||n.includes("cannot be set")||n.includes("not allowed")||n.includes("status 400")}async updateZoteroItemFieldsLocal(e,t,n){let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),i={...t,...n},a={"Content-Type":"application/json","Zotero-API-Version":"3"},s=typeof i.version=="number"?i.version:Number(i.version);Number.isNaN(s)||(a["If-Unmodified-Since-Version"]=String(s)),console.debug("Zotero metadata PUT",{url:r,itemKey:e});try{let o=await this.requestLocalApiWithBody(r,"PUT",i,a,`Zotero update failed for ${r}`);console.debug("Zotero metadata PUT response",{status:o.statusCode})}catch(o){if(!(o instanceof Error?o.message:String(o)).includes("status 501"))throw o;let c=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.debug("Zotero metadata PUT unsupported; trying POST",{postUrl:c});let d=await this.requestLocalApiWithBody(c,"POST",[i],a,`Zotero update failed for ${c}`);console.debug("Zotero metadata POST response",{status:d.statusCode})}}async updateZoteroItemFieldsWeb(e,t,n){var _,g;let r=this.getWebApiLibraryPath();if(!r)throw new Error("Web API library path is not configured.");let i=this.buildWebApiUrl(`/${r}/items/${e}`),a=this.asRecord(await this.fetchZoteroItemWeb(e)),s=this.asRecord(a==null?void 0:a.data),o={...s!=null?s:t,...n},l={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},c=(g=(_=s==null?void 0:s.version)!=null?_:a==null?void 0:a.version)!=null?g:t==null?void 0:t.version,d=typeof c=="number"?c:Number(c);Number.isNaN(d)||(l["If-Unmodified-Since-Version"]=String(d)),console.debug("Zotero Web API metadata PUT",{url:i,itemKey:e});let p=await this.requestWebApiWithBody(i,"PUT",o,l,`Zotero Web API update failed for ${i}`);console.debug("Zotero Web API metadata PUT response",{status:p.statusCode})}sanitizeFileName(e){let t=String(e||"").replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return t?t.slice(0,120).replace(/[. ]+$/g,"").trim():""}registerNoteRenameHandler(){this.registerEvent(this.app.vault.on("rename",async e=>{var t;if(!(!(e instanceof h.TFile)||e.extension!=="md"))try{let n=await this.app.vault.read(e),r=(t=this.extractDocIdFromFrontmatter(n))!=null?t:this.extractDocIdFromSyncMarker(n);if(!r)return;await this.updateDocIndex({doc_id:r,note_path:e.path,note_title:E.default.basename(e.path,".md")})}catch(n){console.warn("Failed to update doc index for renamed note",n)}}))}registerNoteSyncHandler(){this.registerEvent(this.app.vault.on("modify",e=>{if(!(!(e instanceof h.TFile)||e.extension!=="md")){if(this.noteMetadataSyncSuppressed.has(e.path)){this.noteSyncSuppressed.has(e.path)&&this.scheduleNoteSync(e,2500);return}if(this.noteSyncSuppressed.has(e.path)){this.scheduleNoteSync(e,2500),this.scheduleNoteMetadataSync(e,2500,"save"),this.scheduleNoteAnnotationSync(e,2500,"save");return}this.scheduleNoteSync(e),this.scheduleNoteMetadataSync(e,1200,"save"),this.scheduleNoteAnnotationSync(e,1200,"save")}}))}registerNoteOpenHandler(){this.registerEvent(this.app.workspace.on("file-open",e=>{!(e instanceof h.TFile)||e.extension!=="md"||(this.pdfSidebar.syncPdfSidebarForFile(e),this.pdfSidebar.maybeSyncPendingPdf(),this.pdfSidebar.updatePreviewScrollHandler(),this.scheduleNoteMetadataSync(e,600,"open"),this.scheduleNoteAnnotationSync(e,800,"open"),this.normalizeZoteroFrontmatterKeysInFile(e))}))}registerAnnotationFocusSyncHandler(){this.registerDomEvent(window,"focus",()=>{let e=this.app.workspace.getActiveViewOfType(h.MarkdownView),t=e==null?void 0:e.file;!(t instanceof h.TFile)||t.extension!=="md"||this.isZoteroNoteFile(t)&&this.scheduleNoteAnnotationSync(t,600,"open")})}registerPreviewScrollSyncHandlers(){this.registerEvent(this.app.workspace.on("active-leaf-change",()=>{this.pdfSidebar.updatePreviewScrollHandler(),this.pdfSidebar.maybeSyncPendingPdf()})),this.registerEvent(this.app.workspace.on("layout-change",()=>{this.pdfSidebar.updatePreviewScrollHandler(),this.pdfSidebar.maybeSyncPendingPdf()})),this.pdfSidebar.updatePreviewScrollHandler()}registerNoteDeleteMenu(){this.registerEvent(this.app.workspace.on("file-menu",(e,t)=>{if(!(t instanceof h.TFile)||t.extension!=="md")return;let n=(0,h.normalizePath)(this.settings.outputNoteDir),r=(0,h.normalizePath)(t.path);!(n&&(r===n||r.startsWith(`${n}/`)))&&!this.isZoteroNoteFile(t)||(e.addItem(a=>{a.setTitle("Reindex note from cache").onClick(()=>this.reindexNoteFromCacheForFile(t,!0))}),e.addItem(a=>{a.setTitle("Delete Zotero note and cached data").onClick(()=>this.deleteZoteroNoteAndCacheForFile(t))}))}))}findChunkStartLine(e,t){let n=t!=null?t:e.getCursor().line;for(;n>=0;n-=1){let r=e.getLine(n);if(be.test(r))return{line:n,text:r};if(we.test(r)||Ae.test(r))break}return null}findChunkEndLine(e,t){for(let n=t;n<e.lineCount();n+=1){let r=e.getLine(n);if(Ze.test(r))return n;if(Ae.test(r))break}return null}findChunkAtCursor(e,t){let n=t!=null?t:e.getCursor().line,r=this.findChunkStartLine(e,n);if(!r)return null;let i=this.findChunkEndLine(e,r.line+1);return i===null||n<r.line||n>i?null:{startLine:r.line,endLine:i,text:r.text}}toggleChunkExclude(e,t){var d;let n=this.findChunkAtCursor(e,t);if(!n){new h.Notice("No synced chunk found at cursor.");return}let r=n.text.match(be);if(!r){new h.Notice("Invalid chunk marker.");return}let i=((d=r[1])!=null?d:"").trim(),a=n.endLine,s=!1;if(a!==null){for(let p=n.startLine+1;p<a;p+=1)if(Te.test(e.getLine(p))){s=!0;break}}let l=/\bexclude\b/i.test(i)||/\bdelete\b/i.test(i)||s;l?i=i.replace(/\b(delete|exclude)\b/gi,"").replace(/\s{2,}/g," ").trim():i=i?`${i} exclude`:"exclude";let c=`<!-- zrr:chunk${i?" "+i:""} -->`;if(c!==n.text&&e.replaceRange(c,{line:n.startLine,ch:0},{line:n.startLine,ch:n.text.length}),l&&a!==null){let p=[];for(let _=n.startLine+1;_<a;_+=1)Te.test(e.getLine(_))&&p.push(_);for(let _=p.length-1;_>=0;_-=1){let g=p[_],f=e.lineCount();g<f-1?e.replaceRange("",{line:g,ch:0},{line:g+1,ch:0}):e.replaceRange("",{line:g,ch:0},{line:g,ch:e.getLine(g).length})}}new h.Notice(l?"Chunk included.":"Chunk excluded from index.")}toggleChunkExcludeFromToolbar(e){let t=this.app.workspace.getActiveViewOfType(h.MarkdownView);if(!t){new h.Notice("No active editor found.");return}let n=Math.max(0,e-1);this.toggleChunkExclude(t.editor,n)}async openChunkTagEditor(e,t){var d;let n=(0,h.normalizePath)(`${te}/${e}.json`),r=this.app.vault.adapter;if(!await r.exists(n)){new h.Notice("Chunk cache not found for this document.");return}let i=await this.readChunkPayload(n);if(!i){new h.Notice("Failed to read chunk cache.");return}let a=Array.isArray(i.chunks)?i.chunks:[],s=this.resolveChunkFromPayload(a,t,e);if(!s){new h.Notice(`Chunk ${t} not found in cache.`);return}let o=(d=s.chunk_tags)!=null?d:[],l=Array.isArray(o)?o.map(p=>String(p).trim()).filter(p=>p):(typeof o=="string"?o:"").split(/[|,;\n]+/).map(p=>p.trim()).filter(p=>p),c=typeof s.text=="string"?s.text:"";new et(this.app,t,l,async p=>{p.length>0?s.chunk_tags=p:delete s.chunk_tags,await r.write(n,JSON.stringify(i,null,2));let _=typeof s.chunk_id=="string"?s.chunk_id:t;await this.reindexChunkUpdates(e,n,[_],[]),new h.Notice("Chunk tags updated.")},async()=>{if(!c.trim())return new h.Notice("Chunk has no text to tag."),null;let p=await this.renderMarkdownToIndexText(c);return this.requestChunkTags(p)}).open()}async openChunkIndexedTextPreview(e,t){let n=(0,h.normalizePath)(`${te}/${e}.json`);if(!await this.app.vault.adapter.exists(n)){new h.Notice("Chunk cache not found for this document.");return}let i=await this.readChunkPayload(n);if(!i){new h.Notice("Failed to read chunk cache.");return}let a=Array.isArray(i.chunks)?i.chunks:[],s=this.resolveChunkFromPayload(a,t,e);if(!s){new h.Notice(`Chunk ${t} not found in cache.`);return}let o=typeof s.text=="string"?s.text:"",l=await this.renderMarkdownToIndexText(o),c=this.settings.embedIncludeMetadata?"Note: when \u201CInclude metadata in embeddings\u201D is enabled, the indexer prepends title/authors/tags/section info before embedding. The preview below shows only the chunk text.":"";new tt(this.app,`Indexed text for ${t}`,l,c).open()}async openChunkInZotero(e,t){var _,g,f;let n=(0,h.normalizePath)(`${te}/${e}.json`),r=this.app.vault.adapter,i=null;await r.exists(n)&&(i=await this.readChunkPayload(n));let a=Array.isArray(i==null?void 0:i.chunks)?i==null?void 0:i.chunks:[],s=this.resolveChunkFromPayload(a,t,e),o=(_=s==null?void 0:s.page_start)!=null?_:s==null?void 0:s.pageStart,l=this.asRecord(i==null?void 0:i.metadata),c=U((g=l==null?void 0:l.attachment_key)!=null?g:l==null?void 0:l.attachmentKey);if(!c){let b=await this.getDocIndexEntry(e);c=(f=b==null?void 0:b.attachment_key)!=null?f:""}if(!c){new h.Notice("Attachment key not found for Zotero deeplink.");return}let d=typeof o=="number"?String(o):"",p=this.buildZoteroDeepLink(e,c,d);this.openExternalUrl(p)}async cleanChunkFromToolbar(e){let t=this.app.workspace.getActiveViewOfType(h.MarkdownView);if(!t){new h.Notice("No active editor found.");return}let n=t.editor,r=Math.max(0,e-1),i=this.findChunkAtCursor(n,r);if(!i){new h.Notice("No synced chunk found at cursor.");return}let a=[];for(let c=i.startLine+1;c<i.endLine;c+=1)a.push(n.getLine(c));let s=a.join(`
`).trim();if(!s){new h.Notice("Chunk has no text to clean.");return}this.showStatusProgress("Cleaning chunk...",null);let o=null;try{o=await this.requestOcrCleanup(s)}finally{o||this.clearStatusProgress()}if(!o)return;if(o.trim()===s.trim()){new h.Notice("Cleanup produced no changes."),this.clearStatusProgress();return}let l=`${o.trim()}
`;n.replaceRange(l,{line:i.startLine+1,ch:0},{line:i.endLine,ch:0}),this.showStatusProgress("Chunk cleaned.",100),activeWindow.setTimeout(()=>this.clearStatusProgress(),1200),new h.Notice("Chunk cleaned.")}async requestOcrCleanup(e){let t=(this.settings.llmCleanupBaseUrl||"").trim().replace(/\/$/,""),n=(this.settings.llmCleanupModel||"").trim();if(!t||!n)return new h.Notice("Ocr cleanup model is not configured."),this.openPluginSettings(),null;let r=Number(this.settings.llmCleanupMaxChars||0);if(r>0&&e.length>r)return new h.Notice("Chunk exceeds ocr cleanup max length. Adjust settings to clean it."),this.openPluginSettings(),null;try{let i=await this.requestCleanupText(this.getOcrCleanupSystemPrompt(),e),a=this.escapeGenderStars(String(i||"").trim());return a||(new h.Notice("Cleanup returned empty text."),null)}catch(i){return console.error("OCR cleanup failed",i),new h.Notice("Ocr cleanup failed. Check the cleanup model settings."),null}}getOcrCleanupSystemPrompt(){return["You clean OCR text into Markdown.","Correct OCR errors only when the intended text is clear.","Do not add, remove, or invent content.","Preserve wording, punctuation, and special characters.","Return only the corrected text.","Reformat existing footnote references as [^n].","Reformat existing footnote definitions as [^n]: ....","Do not create new footnotes; only reformat footnotes that already exist.","If paragraph breaks are completely missing, insert them only where the sentence structure clearly supports them.","Do not escape asterisks used for Markdown emphasis, list bullets, multiplication, or other non-gender uses.","Adding the backslash for escaping literal gender stars is allowed and does not count as adding content."].join(" ")}escapeGenderStars(e){return e&&e.replace(/(?<!\\)\b([A-Za-zÄÖÜäöüß]{2,})\*(in(?:nen)?|r|n|m|s)\b/g,(t,n,r)=>`${n}\\*${r}`)}parseChunkTags(e,t){if(!e)return[];let n=e.trim(),r=[];if(n.startsWith("[")&&n.endsWith("]"))try{let s=JSON.parse(n);Array.isArray(s)&&(r=s.map(o=>String(o)))}catch(s){r=[]}r.length===0&&(r=n.split(/[,;\n]+/));let i=new Set,a=[];for(let s of r){let o=s.trim();if(o=o.replace(/^[-•\d.)\s]+/,""),o=o.replace(/\s+/g," ").trim(),!o||o.length<2)continue;let l=o.toLowerCase();if(!i.has(l)&&(i.add(l),a.push(o),a.length>=t))break}return a}async requestChunkTags(e){let t=(this.settings.llmCleanupBaseUrl||"").trim().replace(/\/$/,""),n=(this.settings.llmCleanupModel||"").trim();if(!t||!n)return new h.Notice("Ocr cleanup model is not configured."),this.openPluginSettings(),null;let r=e.trim().slice(0,2e3);if(!r)return[];let i=5,a="Return 3 to 5 high-signal, concrete noun-phrase tags. Avoid generic terms (study, paper, method), verbs, and filler. Prefer specific entities, methods, datasets, and named concepts. Output comma-separated tags only. No extra text.";this.showStatusProgress("Generating tags...",null);try{let s=await this.requestCleanupText(a,r),o=this.parseChunkTags(String(s||""),i);return o.length||new h.Notice("Tag generation returned no tags."),o}catch(s){console.error("Tag generation failed",s);let o=this.getPythonErrorMessage(s);return new h.Notice(this.isLmStudioTagModelUnloadedMessage(o)?this.getLmStudioTagModelUnloadedMessage("retry"):"Tag generation failed. Check the cleanup model settings."),null}finally{this.clearStatusProgress()}}async renderMarkdownToIndexText(e){if(!e)return"";let t=this.replaceImageMarkersForIndexPreview(e),n=createDiv(),r=new h.Component;r.load();try{await h.MarkdownRenderer.render(this.app,t,n,"",r)}catch(a){return console.warn("Failed to render markdown for index preview",a),this.normalizeIndexPreviewText(t)}finally{r.unload()}let i=n.textContent||t;return this.normalizeIndexPreviewText(i)}replaceImageMarkersForIndexPreview(e){if(!e)return"";let t=r=>{let i=r.trim();return i?`Image caption: ${i}`:"Image"},n=e.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(r,i,a)=>t(a||""));return n=n.replace(/!\[([^\]]*)]\([^)]+\)/g,(r,i)=>t(i||"")),n=n.replace(/<img[^>]*>/gi,r=>{let i=r.match(/\balt=(['"])([^'"]*)\1/i);return t(i?i[2]:"")}),n}normalizeIndexPreviewText(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).replace(/[ \t]+/g," ").replace(/\n{3,}/g,`

`).replace(/[ \t]*\n[ \t]*/g,`
`).trim()}scheduleNoteSync(e,t=1200){let n=this.noteSyncTimers.get(e.path);n!==void 0&&activeWindow.clearTimeout(n);let r=activeWindow.setTimeout(()=>{this.noteSyncTimers.delete(e.path),this.syncNoteToRedis(e)},t);this.noteSyncTimers.set(e.path,r)}scheduleNoteMetadataSync(e,t=1200,n="save"){let r=this.noteMetadataSyncTimers.get(e.path);r!==void 0&&activeWindow.clearTimeout(r);let i=activeWindow.setTimeout(()=>{this.noteMetadataSyncTimers.delete(e.path),this.syncNoteMetadataWithZotero(e,n)},t);this.noteMetadataSyncTimers.set(e.path,i)}scheduleNoteAnnotationSync(e,t=1200,n="save"){let r=this.noteAnnotationSyncTimers.get(e.path);r!==void 0&&activeWindow.clearTimeout(r);let i=activeWindow.setTimeout(()=>{this.noteAnnotationSyncTimers.delete(e.path),this.syncNoteAnnotationsWithZotero(e,n)},t);this.noteAnnotationSyncTimers.set(e.path,i)}getAnnotationGraceRemaining(e){let t=this.annotationNoteEditTimes.get(e);if(!t)return 0;let n=Date.now()-t;return n>=hn?0:hn-n}escapeRegExp(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}formatCitationPageLabel(e){let t=(e.annotation_page_label||"").trim();if(t)return t;let n=e.page_start?String(e.page_start):"",r=e.page_end?String(e.page_end):"";if(n&&(!r||n===r))return n;if(n&&r)return`${n} - ${r}`;let i=(e.pages||"").trim();if(!i)return"?";let a=i.match(/^(\d+)\s*-\s*(\d+)$/);return a?a[1]===a[2]?a[1]:`${a[1]} - ${a[2]}`:i.replace("-"," - ")}normalizeChunkIdForNote(e,t){if(!e)return null;let n=String(e);if(t&&n.startsWith(`${t}:`))return n.slice(t.length+1);if(n.includes(":")){let r=n.split(":");if(r.length>1&&t&&r[0]===t)return r.slice(1).join(":")}return n}async syncNoteToRedis(e){if(this.noteSyncInFlight.has(e.path)){this.noteSyncPending.add(e.path);return}if(this.noteSyncSuppressed.has(e.path)){this.scheduleNoteSync(e,2e3);return}this.noteSyncInFlight.add(e.path);try{let t=await this.app.vault.read(e),n=this.extractSyncSection(t);if(!n)return;let r=await this.resolveDocIdForNote(e,t);if(!r)return;let i=this.parseSyncedChunkBlocks(n);if(!i.length)return;let a=(0,h.normalizePath)(`${te}/${r}.json`),s=this.app.vault.adapter;if(!await s.exists(a)&&!await this.restoreMissingChunkCacheFromNote(e,t,r,!1))return;let o=await this.readChunkPayload(a);if(!o)return;let l=Array.isArray(o.chunks)?o.chunks:[],c=new Map;for(let k of l){if(this.isAnnotationChunk(k))continue;let m=typeof(k==null?void 0:k.chunk_id)=="string"?k.chunk_id:"";m&&c.set(m,k)}let d=new Set,p=new Set,_=new Set,g=new Set,f=!1;for(let k of i){let m=k.chunkId;if(!m)continue;d.add(m);let x=c.get(m);if(!x){console.warn(`Sync note: chunk id not found in cache (${m})`);continue}if(k.excludeFlag){x.excluded!==!0&&(x.excluded=!0,f=!0);let R=this.normalizeChunkText(k.text),P=typeof x.text=="string"?x.text:"";R&&R!==P&&(x.text=R,x.char_count=R.length,f=!0),_.add(m);continue}if(x.excluded&&(x.excluded=!1,f=!0,p.add(m)),!k.text.trim()){_.add(m),g.add(m);continue}let w=this.normalizeChunkText(k.text);if(!w){_.add(m),g.add(m);continue}let S=typeof x.text=="string"?x.text:"";w!==S&&(x.text=w,x.char_count=w.length,p.add(m),f=!0)}for(let k of c.keys())d.has(k)||(_.add(k),g.add(k));let b=new Set([..._,...g]);if(b.size){let k=Array.from(b).sort().join("|");if(this.noteSyncPendingDeletes.get(e.path)!==k){this.noteSyncPendingDeletes.set(e.path,k),this.scheduleNoteSync(e,1500);return}}else this.noteSyncPendingDeletes.has(e.path)&&this.noteSyncPendingDeletes.delete(e.path);if(!p.size&&!_.size&&!g.size&&!f)return;g.size&&(o.chunks=l.filter(k=>{let m=typeof(k==null?void 0:k.chunk_id)=="string"?k.chunk_id:"";return m&&!g.has(m)}),f=!0),(f||g.size)&&await s.write(a,JSON.stringify(o,null,2)),await this.reindexChunkUpdates(r,a,Array.from(p),Array.from(_)),(_.size||g.size)&&this.noteSyncPendingDeletes.delete(e.path)}catch(t){console.warn("Failed to sync note edits to Redis",t)}finally{this.noteSyncInFlight.delete(e.path),this.noteSyncPending.delete(e.path)&&this.scheduleNoteSync(e,400)}}async syncNoteMetadataWithZotero(e,t){var n,r,i,a;if(this.noteMetadataSyncInFlight.has(e.path)){this.noteMetadataSyncPending.add(e.path);return}if(this.noteMetadataSyncSuppressed.has(e.path)){this.scheduleNoteMetadataSync(e,2e3,t);return}this.noteMetadataSyncInFlight.add(e.path);try{let s=await this.app.vault.read(e),o=await this.resolveDocIdForNote(e,s);if(!o)return;let l=(n=this.app.metadataCache.getFileCache(e))==null?void 0:n.frontmatter;if(!l)return;let c=this.resolveZoteroItemKey(l,o);if(!c)return;let d=this.asRecord(await this.fetchZoteroItem(c)),p=(r=this.asRecord(d==null?void 0:d.data))!=null?r:d;if(!p||typeof p!="object")return;let _=this.extractNoteMetadata(l),g=this.extractZoteroMetadata(p);g.citekey||(g.citekey=await this.resolveZoteroCitekey(p,c,(i=this.asRecord(d==null?void 0:d.meta))!=null?i:{}));let f=await this.getMetadataSnapshot(o,l,e),b={},k={},m={},x=[],w=["title","short_title","citekey","date","abstract","doi","publication_title","book_title","journal_abbrev","publisher","place","issue","volume","pages","item_type","tags","authors","editors"],S={title:"title",short_title:"short_title",citekey:"citekey",date:"date",abstract:"abstract",doi:"doi",publication_title:"publication_title",book_title:"book_title",journal_abbrev:"journal_abbrev",publisher:"publisher",place:"place",issue:"issue",volume:"volume",pages:"pages",item_type:"item_type",tags:"tags",authors:"authors",editors:"editors"},R=Object.fromEntries(w.map(O=>[O,this.hasFrontmatterKey(l,S[O])])),P=new Set(["title","short_title","citekey","date","abstract","doi","publication_title","book_title","journal_abbrev","publisher","place","issue","volume","pages","item_type","authors","editors"]),A=w.filter(O=>R[O]||!this.isMetadataValueEmpty(_[O])||!this.isMetadataValueEmpty(g[O]));if(!A.length)return;let N={title:"Title",short_title:"Short title",citekey:"Citekey",date:"Date",abstract:"Abstract",doi:"DOI",publication_title:"Publication title",book_title:"Book title",journal_abbrev:"Journal abbreviation",publisher:"Publisher",place:"Place",issue:"Issue",volume:"Volume",pages:"Pages",item_type:"Item type",tags:"Tags",authors:"Authors",editors:"Editors"};for(let O of A){let q=_[O],j=g[O];if(this.metadataValuesEqual(O,q,j))continue;let V=this.isMetadataValueEmpty(q),z=this.isMetadataValueEmpty(j),Z=f==null?void 0:f[O];if(Z===void 0){if(V&&!z){m[O]="zotero",this.assignMetadataUpdate(b,O,j);continue}if(!V&&z&&P.has(O)){m[O]="note",this.assignMetadataUpdate(k,O,q);continue}}if(Z!==void 0){let G=!this.metadataValuesEqual(O,q,Z),$=!this.metadataValuesEqual(O,j,Z);if(G&&!$){m[O]="note",this.assignMetadataUpdate(k,O,q);continue}if(!G&&$){m[O]="zotero",this.assignMetadataUpdate(b,O,j);continue}}let T=this.getMetadataDecisionLabels(O,q,j,N);x.push({field:O,fieldLabel:N[O],noteLabel:T.noteLabel,zoteroLabel:T.zoteroLabel,noteValue:this.formatMetadataValue(q),zoteroValue:this.formatMetadataValue(j)})}if(x.length>0){let O=await this.promptMetadataBatchDecision(x);for(let q of x){let j=(a=O[q.field])!=null?a:"skip";m[q.field]=j,j==="note"?this.assignMetadataUpdate(k,q.field,_[q.field]):j==="zotero"&&this.assignMetadataUpdate(b,q.field,g[q.field])}}Object.keys(b).length>0&&await this.applyNoteMetadataUpdates(e,b),Object.keys(k).length>0&&await this.applyZoteroMetadataUpdates(c,p,_,g,k),await this.updateMetadataSnapshot(e,o,_,g,f,m,A)}catch(s){console.warn("Failed to sync note metadata with Zotero",s)}finally{this.noteMetadataSyncInFlight.delete(e.path),this.noteMetadataSyncPending.delete(e.path)&&this.scheduleNoteMetadataSync(e,500,t)}}async syncNoteAnnotationsWithZotero(e,t){var n,r,i,a,s;if(this.noteAnnotationSyncInFlight.has(e.path)){this.noteAnnotationSyncPending.add(e.path);return}if(this.noteAnnotationSyncSuppressed.has(e.path)){this.scheduleNoteAnnotationSync(e,2e3,t);return}this.noteAnnotationSyncInFlight.add(e.path);try{let o=await this.app.vault.read(e),l=this.findAnnotationBlockRange(o);if(!l)return;let c=this.parseAnnotationBlockMarker(l.startMarker),d=await this.resolveDocIdForNote(e,o);if(!d&&c.docId){d=c.docId;let z=this.ensureDocIdInNoteContent(o,d);z!==o&&await this.writeNoteWithSyncSuppressed(e.path,z)}if(!d)return;let p=(r=(n=this.app.metadataCache.getFileCache(e))==null?void 0:n.frontmatter)!=null?r:{},_=(i=c.attachmentKey)!=null?i:"";if(_||(_=await this.resolveAttachmentKeyForDocId(d,p)),!_)return;c.attachmentKey&&(!c.docId||c.docId===d)&&c.attachmentKey===_&&await this.updateDocIndex({doc_id:d,attachment_key:_});let g=_,f=await this.fetchZoteroAnnotationsForDoc(d,_),b=f.annotations;_=f.attachmentKey,_&&_!==g&&await this.updateDocIndex({doc_id:d,attachment_key:_});let k=this.parseAnnotationBlock(l.block,_),m=new Map;for(let z of k)z.key&&z.imagePath&&m.set(z.key,{path:z.imagePath,hash:z.imageHash||this.extractAnnotationImageHashFromPath(z.imagePath)});await this.attachAnnotationImages(d,_,b,e.path,m);let x=new Map;for(let z of k)z.key&&x.set(z.key,z);let w=new Map;for(let z of b)w.set(z.key,z);let S=!1,R=!1,P=!1;if(f.hadFetchError)x.size>0&&b.length===0&&console.debug("Skipping annotation-prune sync due incomplete Zotero annotation fetch.",{docId:d,attachmentKey:_,reason:t});else for(let z of x.keys())w.has(z)||(R=!0);let A=await this.getAnnotationSnapshot(d),N=(a=A==null?void 0:A.annotations)!=null?a:{},O={},q=[];_&&_!==g&&b.length>0&&(R=!0,P=!0);for(let[z,Z]of w.entries()){let T=x.get(z);if(!T){R=!0;continue}let G=N[z],$=this.annotationSnapshotFromEntry(T,Z.annotationType),H=this.annotationSnapshotFromEntry(Z,Z.annotationType),F=($.image_hash||"")!==(H.image_hash||"");if(!G){this.annotationSnapshotsEqualIgnoringImage($,H)?F&&(R=!0,P=!0):(O[z]="note",S=!0);continue}let M=!this.annotationSnapshotsEqual($,G),J=!this.annotationSnapshotsEqual(H,G),W=(H.color_key||"")!==(G.color_key||""),I=!this.annotationSnapshotsEqualIgnoringImage($,G),B=!this.annotationSnapshotsEqualIgnoringImage(H,G);I&&!B?(O[z]="note",S=!0):!I&&B?(O[z]="zotero",R=!0):I&&B&&q.push({key:z,title:this.formatAnnotationConflictTitle(Z),noteValue:this.formatAnnotationConflictValue($,T.tags),zoteroValue:this.formatAnnotationConflictValue(H,Z.tags)}),F&&(M||J)&&(R=!0,P=!0),W&&(R=!0,P=!0)}if(q.length>0){let z=await this.promptAnnotationBatchDecision(q);for(let Z of q){let T=(s=z[Z.key])!=null?s:"skip";O[Z.key]=T,T==="note"?S=!0:T==="zotero"&&(R=!0,P=!0)}}let j=[];for(let[z,Z]of Object.entries(O)){if(Z!=="note")continue;let T=x.get(z),G=w.get(z);!T||!G||j.push({entry:G,note:T})}j.length>0&&await this.applyZoteroAnnotationUpdates(j),S&&this.annotationNoteEditTimes.set(e.path,Date.now());let V=this.getAnnotationGraceRemaining(e.path);if(R&&V>0&&S&&!P&&(this.scheduleNoteAnnotationSync(e,V+250,t),R=!1),R){let z=this.buildAnnotationBlock(d,_,b),Z=this.replaceAnnotationBlock(o,z);if(Z&&Z!==o){this.noteSyncSuppressed.add(e.path),this.noteAnnotationSyncSuppressed.add(e.path),this.noteMetadataSyncSuppressed.add(e.path);try{await this.app.vault.adapter.write(e.path,Z)}finally{activeWindow.setTimeout(()=>{this.noteSyncSuppressed.delete(e.path),this.noteAnnotationSyncSuppressed.delete(e.path),this.noteMetadataSyncSuppressed.delete(e.path)},1500)}}}await this.updateAnnotationSnapshot(d,_,b),await this.updateAnnotationChunks(d,_,b,{allowDeletes:!f.hadFetchError})}catch(o){console.warn("Failed to sync note annotations with Zotero",o)}finally{this.noteAnnotationSyncInFlight.delete(e.path),this.noteAnnotationSyncPending.delete(e.path)&&this.scheduleNoteAnnotationSync(e,500,t)}}resolveZoteroItemKey(e,t){let n=[this.getFrontmatterValue(e,"zotero_key"),this.getFrontmatterValue(e,"item_key"),this.getFrontmatterValue(e,"doc_id"),t];for(let r of n){let i=U(r);if(i)return i}return""}async resolveAttachmentKeyForDocId(e,t){var l;if(!e)return"";let n=await this.getDocIndexEntry(e);if(n||(n=await this.hydrateDocIndexFromCache(e)),n!=null&&n.attachment_key)return n.attachment_key;let r=(0,h.normalizePath)(`${te}/${e}.json`);try{if(await this.app.vault.adapter.exists(r)){let d=await this.readChunkPayload(r),p=this.asRecord(d==null?void 0:d.metadata),_=p==null?void 0:p.attachment_key;if(typeof _=="string"&&_.trim())return await this.updateDocIndex({doc_id:e,attachment_key:_.trim()}),_.trim()}}catch(c){}let i=this.resolveZoteroItemKey(t,e);if(!i)return"";let a=this.asRecord(await this.fetchZoteroItem(i)),s=(l=this.asRecord(a==null?void 0:a.data))!=null?l:a;if(!s||typeof s!="object")return"";let o=await qe(s,e,{fetchZoteroChildren:this.fetchZoteroChildren.bind(this)});return o!=null&&o.key?(await this.updateDocIndex({doc_id:e,attachment_key:o.key}),o.key):""}extractNoteMetadata(e){var w,S,R,P,A,N,O,q,j,V,z,Z,T,G,$,H,F,M,J,W,I,B;let t=this.normalizeMetadataString(e==null?void 0:e.title),n=this.normalizeMetadataString((P=(R=(S=(w=e==null?void 0:e["short title"])!=null?w:e==null?void 0:e.short_title)!=null?S:e==null?void 0:e.shortTitle)!=null?R:e==null?void 0:e["short-title"])!=null?P:e==null?void 0:e["title-short"]),r=this.normalizeMetadataString((q=(O=(N=(A=e==null?void 0:e.citekey)!=null?A:e==null?void 0:e["citation key"])!=null?N:e==null?void 0:e.citation_key)!=null?O:e==null?void 0:e.citationKey)!=null?q:e==null?void 0:e["citation-key"]),i=this.normalizeMetadataString(e==null?void 0:e.date),a=this.normalizeMetadataString((j=e==null?void 0:e.abstract)!=null?j:e==null?void 0:e.abstractNote),s=this.normalizeMetadataString((V=e==null?void 0:e.doi)!=null?V:e==null?void 0:e.DOI),o=this.normalizeMetadataString((T=(Z=(z=e==null?void 0:e["publication title"])!=null?z:e==null?void 0:e.publication_title)!=null?Z:e==null?void 0:e.publicationTitle)!=null?T:e==null?void 0:e["publication-title"]),l=this.normalizeMetadataString((H=($=(G=e==null?void 0:e["book title"])!=null?G:e==null?void 0:e.book_title)!=null?$:e==null?void 0:e.bookTitle)!=null?H:e==null?void 0:e["book-title"]),c=this.normalizeMetadataString((J=(M=(F=e==null?void 0:e["journal abbrev"])!=null?F:e==null?void 0:e.journal_abbrev)!=null?M:e==null?void 0:e.journalAbbrev)!=null?J:e==null?void 0:e["journal-abbrev"]),d=this.normalizeMetadataString(e==null?void 0:e.publisher),p=this.normalizeMetadataString(e==null?void 0:e.place),_=this.normalizeMetadataString(e==null?void 0:e.issue),g=this.normalizeMetadataString(e==null?void 0:e.volume),f=this.normalizeMetadataString(e==null?void 0:e.pages),b=this.normalizeMetadataString((B=(I=(W=e==null?void 0:e["item type"])!=null?W:e==null?void 0:e.item_type)!=null?I:e==null?void 0:e.itemType)!=null?B:e==null?void 0:e["item-type"]),k=this.normalizeMetadataList(e==null?void 0:e.tags),m=this.normalizeMetadataList(e==null?void 0:e.authors),x=this.normalizeMetadataList(e==null?void 0:e.editors);return{title:t,short_title:n,citekey:r,date:i,abstract:a,doi:s,publication_title:o,book_title:l,journal_abbrev:c,publisher:d,place:p,issue:_,volume:g,pages:f,item_type:b,tags:this.sanitizeObsidianTags(k),authors:m,editors:x}}extractZoteroMetadata(e){var S,R,P;let t=this.normalizeMetadataString(e==null?void 0:e.title),n=this.normalizeMetadataString(Pe(e)),r=this.normalizeMetadataString(Ie(e)),i=this.normalizeMetadataString(e==null?void 0:e.date),a=this.normalizeMetadataString(e==null?void 0:e.abstractNote),s=this.normalizeMetadataString((S=e==null?void 0:e.DOI)!=null?S:e==null?void 0:e.doi),o=this.normalizeMetadataString(e==null?void 0:e.publicationTitle),l=this.normalizeMetadataString(e==null?void 0:e.bookTitle),c=this.normalizeMetadataString(e==null?void 0:e.journalAbbreviation),d=this.normalizeMetadataString(e==null?void 0:e.publisher),p=this.normalizeMetadataString(e==null?void 0:e.place),_=this.normalizeMetadataString(e==null?void 0:e.issue),g=this.normalizeMetadataString(e==null?void 0:e.volume),f=this.normalizeMetadataString(e==null?void 0:e.pages),b=this.normalizeMetadataString((P=(R=e==null?void 0:e.itemType)!=null?R:e==null?void 0:e.item_type)!=null?P:e==null?void 0:e["item-type"]),k=Array.isArray(e==null?void 0:e.creators)?e.creators:[],m=k.filter(A=>(A==null?void 0:A.creatorType)==="author").map(A=>ve(A)).filter(Boolean),x=k.filter(A=>(A==null?void 0:A.creatorType)==="editor"||(A==null?void 0:A.creatorType)==="seriesEditor").map(A=>ve(A)).filter(Boolean),w=Array.isArray(e==null?void 0:e.tags)?e.tags.map(A=>{var N;return typeof A=="string"?A:(N=this.asRecord(A))==null?void 0:N.tag}).filter(A=>typeof A=="string"):[];return{title:t,short_title:n,citekey:r,date:i,abstract:a,doi:s,publication_title:o,book_title:l,journal_abbrev:c,publisher:d,place:p,issue:_,volume:g,pages:f,item_type:b,tags:this.sanitizeObsidianTags(w),authors:this.normalizeMetadataList(m),editors:this.normalizeMetadataList(x)}}async resolveZoteroCitekey(e,t,n){let r=this.normalizeMetadataString(Ie(e,n!=null?n:void 0));if(r)return r;if(!t)return"";let i=await this.fetchZoteroItemCsl(t);return this.normalizeMetadataString(xt(i))}extractAnnotationPageInfo(e){var a;let n=U((a=e.annotationPageLabel)!=null?a:e.annotationPage).trim(),r=null,i=e.annotationPage;if(typeof i=="number"&&Number.isFinite(i))r=i;else if(typeof i=="string"&&i.trim()){let s=Number(i);Number.isFinite(s)&&(r=s)}if(r===null&&typeof e.annotationPosition=="string")try{let s=JSON.parse(e.annotationPosition),o=s==null?void 0:s.pageIndex;typeof o=="number"&&Number.isFinite(o)&&(r=o+1)}catch(s){}return{pageLabel:n,pageIndex:r}}extractAnnotationImagePayload(e){var a,s,o,l;let t=(s=(a=e.annotationImage)!=null?a:e.annotationImageData)!=null?s:e.annotationImageBase64;if(!t)return null;let n=null,r="";if(Buffer.isBuffer(t))n=t;else if(ArrayBuffer.isView(t))n=Buffer.from(t.buffer,t.byteOffset,t.byteLength);else if(t instanceof ArrayBuffer)n=Buffer.from(t);else if(typeof t=="string"){let c=t.trim();if(!c)return null;let d=c.match(/^data:([^;]+);base64,(.*)$/i);if(d&&(r=this.normalizeAnnotationImageMime(d[1]),c=d[2]),/^(https?|file|zotero):/i.test(c)||(c=c.replace(/^base64,/,"").replace(/\s+/g,""),!c))return null;n=Buffer.from(c,"base64")}if(!n||!n.length)return null;r||(r=this.normalizeAnnotationImageMime((l=(o=e.annotationImageMimeType)!=null?o:e.annotationImageType)!=null?l:e.annotationImageFormat)||this.guessAnnotationImageMime(n)||"image/png");let i=this.annotationImageExtensionFromMime(r)||this.annotationImageExtensionFromMime(this.guessAnnotationImageMime(n))||"png";return{buffer:n,mime:r,ext:i}}parseZoteroAnnotationItem(e,t){var m,x,w,S;let n=(x=(m=e==null?void 0:e.data)!=null?m:e)!=null?x:{},r=U((w=e==null?void 0:e.key)!=null?w:n==null?void 0:n.key);if(!r)return null;let i=U(n.annotationType),a=this.normalizeAnnotationText(n.annotationText),s=this.normalizeAnnotationText(n.annotationComment),o=U(n.annotationColor),l=this.normalizeAnnotationColorKey(o),{heading:c,callout:d}=this.resolveAnnotationColorMeta(l),{pageLabel:p,pageIndex:_}=this.extractAnnotationPageInfo(n),g=(S=n.annotationSortIndex)!=null?S:n.annotationSort,f=U(g).trim(),b=Number.isFinite(Number(f))?Number(f):Number.NaN,k=Array.isArray(n.tags)?n.tags.map(R=>{var P;return typeof R=="string"?R:(P=this.asRecord(R))==null?void 0:P.tag}).filter(R=>typeof R=="string"):[];return{key:r.trim(),attachmentKey:t,pageLabel:p,pageIndex:_,colorKey:l,callout:d,heading:c,annotationType:i,text:a,comment:s,tags:this.normalizeAnnotationTags(k),sortToken:f,sortIndex:b,rawValues:n}}async fetchZoteroAnnotations(e){if(!e)return{annotations:[],hadFetchError:!1};let t=this.canUseWebApi()||await this.ensureWebApiLibraryId(),n=!1,r=!1,i=o=>{var c,d;let l=[];for(let p of o){let _=this.asRecord(p),g=(d=(c=this.asRecord(_==null?void 0:_.data))!=null?c:_)!=null?d:{};if(U(g.itemType)!=="annotation")continue;let f=this.parseZoteroAnnotationItem(p,e);f&&l.push(f)}return l},a=[];try{a=await this.fetchZoteroChildrenLocal(e,{includeAnnotationImage:!0})}catch(o){try{a=await this.fetchZoteroChildrenLocal(e)}catch(l){n=!0,console.warn("Failed to fetch Zotero annotation items from local API",l)}}let s=i(a);if(!s.length&&t)try{let o=[];try{o=await this.fetchZoteroChildrenWeb(e,{includeAnnotationImage:!0})}catch(c){o=await this.fetchZoteroChildrenWeb(e)}r=!0;let l=i(o);l.length&&(s=l)}catch(o){n=!0,this.logOptionalLookupFailure("Failed to fetch Zotero annotation items from Web API",o)}return!s.length&&t&&!r&&(n=!0),!s.length&&!t&&(n=!0),{annotations:s,hadFetchError:n}}async fetchZoteroAnnotationsForDoc(e,t){var l,c;let n=t,r=await this.fetchZoteroAnnotations(n);if(r.annotations.length||!e)return r.annotations.length||this.maybeWarnMissingAnnotationApi(e,t),{attachmentKey:n,annotations:r.annotations,hadFetchError:r.hadFetchError};let i=[];try{i=await this.fetchZoteroChildren(e)}catch(d){return console.warn("Failed to fetch Zotero attachments for annotations",d),this.maybeWarnMissingAnnotationApi(e,t),{attachmentKey:n,annotations:r.annotations,hadFetchError:!0}}let a=r.hadFetchError,s=[],o=new Set(n?[n]:[]);for(let d of i){if(!kt(d))continue;let p=this.asRecord(d),_=this.asRecord(p==null?void 0:p.data),g=U((c=(l=p==null?void 0:p.key)!=null?l:_==null?void 0:_.key)!=null?c:p==null?void 0:p.attachmentKey);!g||o.has(g)||(o.add(g),s.push(g))}for(let d of s){let p=await this.fetchZoteroAnnotations(d);if(a=a||p.hadFetchError,p.annotations.length)return{attachmentKey:d,annotations:p.annotations,hadFetchError:a}}return this.maybeWarnMissingAnnotationApi(e,t),{attachmentKey:n,annotations:r.annotations,hadFetchError:a}}async attachAnnotationImages(e,t,n,r,i){var p;if(!this.settings.includeAnnotationImages||!n.length)return;let a=await this.resolveAnnotationImageOutputDir(r);if(!a)return;let s=this.sanitizeFileName(e||t)||"annotations",o=(0,h.normalizePath)(E.default.join(a.relative||"",s)),l=E.default.normalize(E.default.join(a.absolute,s));o?await this.ensureFolder(o):await ne.promises.mkdir(l,{recursive:!0});let c=this.app.vault.adapter,d=new Map;for(let _ of n){let g=String(_.annotationType||"").trim().toLowerCase(),f=g==="image"||g==="ink",b=this.extractAnnotationImagePayload((p=_.rawValues)!=null?p:{});if(!b&&f&&this.settings.zoteroCompanionEnabled&&(b=await this.fetchCompanionAnnotationImage(_.key)),!b){let w=i==null?void 0:i.get(_.key);w!=null&&w.path&&await c.exists(w.path)&&(_.imagePath=w.path,_.imageHash=w.hash,d.set(_.key,w.path));continue}let k=(0,Ue.createHash)("sha1").update(b.buffer).digest("hex").slice(0,12),m=`zrr-annotation-${_.key}-${k}.${b.ext}`,x=(0,h.normalizePath)(E.default.join(o,m));try{await c.exists(x)||await c.writeBinary(x,this.bufferToArrayBuffer(b.buffer)),_.imagePath=x,_.imageHash=k,d.set(_.key,x)}catch(w){console.warn("Failed to write annotation image",{annotationKey:_.key,error:w})}}if(o&&await c.exists(o))try{let _=await c.list(o);for(let g of _.files){let b=E.default.basename(g).match(/^zrr-annotation-([A-Z0-9]{8})-[a-f0-9]{12}\./i);if(!b)continue;let k=b[1].toUpperCase(),m=d.get(k);(!m||(0,h.normalizePath)(m)!==(0,h.normalizePath)(g))&&await c.remove(g)}}catch(_){console.warn("Failed to clean up annotation images",_)}}async fetchCompanionAnnotationImage(e){let t=(this.settings.zoteroCompanionBaseUrl||"").trim();if(!t)return null;let n=`${t.replace(/\/$/,"")}/annotations/${encodeURIComponent(e)}/image`,r={},i=(this.settings.zoteroCompanionToken||"").trim();i&&(r.Authorization=`Bearer ${i}`);try{let a=await this.requestLocalApiRaw(n,{headers:r,timeoutMs:5e3});if(a.statusCode===200){let s=a.headers["content-type"],o=Array.isArray(s)?s[0]:s!=null?s:"";return this.buildAnnotationImagePayloadFromBuffer(a.body,o)}if(a.statusCode===204||a.statusCode===404)return null;console.warn("Unexpected Zotero companion response",{annotationKey:e,status:a.statusCode})}catch(a){console.warn("Failed to fetch annotation image from Zotero companion",a)}return null}async checkZoteroCompanionHealth(){let e=(this.settings.zoteroCompanionBaseUrl||"").trim();if(!e){new h.Notice("Zotero companion base URL is not set.");return}let t=`${e.replace(/\/$/,"")}/health`,n={},r=(this.settings.zoteroCompanionToken||"").trim();r&&(n.Authorization=`Bearer ${r}`);try{let i=await this.requestLocalApiRaw(t,{headers:n,timeoutMs:3e3});if(i.statusCode===200){try{let a=JSON.parse(i.body.toString("utf8"));if(a!=null&&a.ok){new h.Notice("Zotero companion: OK.");return}}catch(a){}new h.Notice("Zotero companion responded but did not return OK.");return}if(i.statusCode===401){new h.Notice("Zotero companion: unauthorized (check token).");return}new h.Notice(`Zotero companion: HTTP ${i.statusCode}.`)}catch(i){console.warn("Zotero companion health check failed",i),new h.Notice("Zotero companion: unreachable.")}}async openZoteroAddons(){try{let e=process.platform;e==="darwin"?await this.spawnDetached(["open","-a","Zotero"]):e==="win32"?await this.spawnDetached(["cmd","/c","start","","zotero"]):await this.spawnDetached(["zotero"]),new h.Notice("Opened Zotero. Go to tools \u2192 add-ons.")}catch(e){console.warn("Failed to open Zotero add-ons",e),new h.Notice("Unable to open Zotero automatically. Open Zotero and go to tools \u2192 add-ons.")}}async spawnDetached(e){let[t,...n]=e;if(!t)throw new Error("Missing command");await new Promise((r,i)=>{let a=!1,s=(0,de.spawn)(t,n,{detached:!0,stdio:"ignore"});s.on("error",o=>{a||(a=!0,i(o))}),s.unref(),a||(a=!0,r())})}maybeWarnMissingAnnotationApi(e,t){if(this.canUseWebApi()){console.debug("No Zotero annotations returned for attachment",{docId:e,attachmentKey:t});return}let n=e||t;!n||this.annotationWebApiWarned.has(n)||(this.annotationWebApiWarned.add(n),new h.Notice("Zotero annotations require web API access. Configure the web API library ID and key to import annotations."))}normalizeMetadataString(e){return typeof e=="string"?e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).trim():typeof e=="number"&&Number.isFinite(e)?String(e):""}normalizeMetadataList(e){return Array.isArray(e)?e.map(t=>this.normalizeMetadataString(t)).filter(t=>t.length>0):typeof e=="string"?e.split(/[,;\n]+/).map(t=>t.trim()).filter(t=>t.length>0):[]}coerceMetadataStringValue(e){return Array.isArray(e)?e.join("; ").trim():this.normalizeMetadataString(e)}assignMetadataUpdate(e,t,n){if(t==="tags"||t==="authors"||t==="editors"){e[t]=Array.isArray(n)?n:this.normalizeMetadataList(n);return}e[t]=this.coerceMetadataStringValue(n)}metadataValuesEqual(e,t,n){if(Array.isArray(t)||Array.isArray(n)){let r=Array.isArray(t)?t:this.normalizeMetadataList(t),i=Array.isArray(n)?n:this.normalizeMetadataList(n),a=e==="tags";return this.compareMetadataLists(r,i,a)}return this.normalizeMetadataString(t)===this.normalizeMetadataString(n)}compareMetadataLists(e,t,n){let r=s=>s.replace(/\s+/g," ").trim(),i=e.map(r).filter(Boolean),a=t.map(r).filter(Boolean);if(n&&(i.sort(),a.sort()),i.length!==a.length)return!1;for(let s=0;s<i.length;s+=1)if(i[s]!==a[s])return!1;return!0}isMetadataValueEmpty(e){return Array.isArray(e)?e.length===0:this.normalizeMetadataString(e).length===0}formatMetadataValue(e){return Array.isArray(e)?e.join(`
`):this.normalizeMetadataString(e)}normalizeAnnotationText(e){return typeof e=="string"?e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).trim():typeof e=="number"&&Number.isFinite(e)?String(e):""}normalizeAnnotationImageMime(e){let t=U(e).toLowerCase();return t?t.includes("/")?t:t==="png"?"image/png":t==="jpg"||t==="jpeg"?"image/jpeg":t==="gif"?"image/gif":t==="webp"?"image/webp":"":""}buildAnnotationImagePayloadFromBuffer(e,t){if(!e||!e.length)return null;let n=this.normalizeAnnotationImageMime(t);n||(n=this.guessAnnotationImageMime(e)||"image/png");let r=this.annotationImageExtensionFromMime(n)||this.annotationImageExtensionFromMime(this.guessAnnotationImageMime(e))||"png";return{buffer:e,mime:n,ext:r}}guessAnnotationImageMime(e){return e.length>=3&&e[0]===255&&e[1]===216&&e[2]===255?"image/jpeg":e.length>=4&&e[0]===137&&e[1]===80&&e[2]===78&&e[3]===71?"image/png":e.length>=6&&e.subarray(0,3).toString("ascii")==="GIF"?"image/gif":e.length>=12&&e.subarray(0,4).toString("ascii")==="RIFF"&&e.subarray(8,12).toString("ascii")==="WEBP"?"image/webp":""}annotationImageExtensionFromMime(e){switch(e.toLowerCase()){case"image/png":return"png";case"image/jpeg":case"image/jpg":return"jpg";case"image/gif":return"gif";case"image/webp":return"webp";default:return""}}extractAnnotationImageHashFromPath(e){if(!e)return"";let n=E.default.basename(e).match(/^zrr-annotation-[A-Z0-9]{8}-([a-f0-9]{12})\./i);return n?n[1].toLowerCase():""}normalizeAnnotationTags(e){let t=this.sanitizeObsidianTags(e),n=Array.from(new Set(t));return n.sort(),n}getAnnotationColorMap(){let e=this.settings.annotationColorMap;return e&&typeof e=="object"?e:Je.annotationColorMap}normalizeAnnotationColorKey(e){var r,i;let t=this.getAnnotationColorMap(),n=String(e||"").trim().toLowerCase();if(!n)return(r=Object.keys(t)[0])!=null?r:"gray";if(n==="grey"&&(n="gray"),t[n])return n;if(n.startsWith("#")){let a=this.inferAnnotationColorFromHex(n);if(a&&t[a])return a}return t.gray?"gray":(i=Object.keys(t)[0])!=null?i:"gray"}inferAnnotationColorFromHex(e){let t=e.replace("#","").trim();if(![3,6].includes(t.length))return null;let n=f=>f.length===1?`${f}${f}`:f,r=t.length===3?n(t[0]):t.slice(0,2),i=t.length===3?n(t[1]):t.slice(2,4),a=t.length===3?n(t[2]):t.slice(4,6),s=parseInt(r,16)/255,o=parseInt(i,16)/255,l=parseInt(a,16)/255;if(Number.isNaN(s)||Number.isNaN(o)||Number.isNaN(l))return null;let c=Math.max(s,o,l),d=Math.min(s,o,l),p=c-d,_=(c+d)/2;if(p<.08||_<.12)return"gray";let g=0;return p===0?g=0:c===s?g=(o-l)/p%6:c===o?g=(l-s)/p+2:g=(s-o)/p+4,g=Math.round(g*60),g<0&&(g+=360),g<20||g>=340?"red":g<45?"orange":g<70?"yellow":g<160?"green":g<250?"blue":g<290?"purple":g<330?"magenta":"red"}resolveAnnotationColorMeta(e){let t=this.getAnnotationColorMap(),n=t[e];return n&&n.heading&&n.callout?n:t.gray||t.yellow||{heading:"Annotations",callout:"note"}}getMetadataDecisionLabels(e,t,n,r){let i=this.isMetadataValueEmpty(t),a=this.isMetadataValueEmpty(n),s="Keep note",o="Keep Zotero";return i&&!a?(s="Delete in Zotero",o="Use Zotero value"):!i&&a&&(s="Update Zotero from note",o="Clear note"),{fieldLabel:r[e],noteLabel:s,zoteroLabel:o}}async promptMetadataBatchDecision(e){return new Promise(t=>{new ot(this.app,e.map(n=>({field:n.field,fieldLabel:n.fieldLabel,noteLabel:n.noteLabel,zoteroLabel:n.zoteroLabel,noteValue:n.noteValue,zoteroValue:n.zoteroValue})),n=>t(n)).open()})}formatAnnotationConflictTitle(e){let t=this.settings.annotationPageLabel||"Page",n=e.pageLabel||(e.pageIndex?String(e.pageIndex):"?");return`${t} ${n} (${e.key})`}formatAnnotationConflictValue(e,t){let n=[];e.text&&n.push("Highlight:",e.text),e.comment&&(n.length&&n.push(""),n.push("Comment:",e.comment));let r=this.normalizeAnnotationTags(t);return r.length&&(n.length&&n.push(""),n.push(`Tags: ${r.map(i=>`#${i}`).join(" ")}`)),n.join(`
`).trim()}async promptAnnotationBatchDecision(e){return new Promise(t=>{new lt(this.app,e,n=>t(n)).open()})}normalizeSnapshotValue(e,t){return e==="tags"?[...this.normalizeMetadataList(t)].sort():e==="authors"||e==="editors"?this.normalizeMetadataList(t):this.normalizeMetadataString(t)}setMetadataSnapshotValue(e,t,n){e[t]=n}getMetadataSnapshotCachePath(){return(0,h.normalizePath)(Zt)}normalizeMetadataSnapshotRecord(e){if(!e)return null;let t=e;if(typeof e=="string")try{t=JSON.parse(e)}catch(i){return null}if(!t||typeof t!="object")return null;let n={},r=["title","short_title","citekey","date","abstract","doi","publication_title","book_title","journal_abbrev","publisher","place","issue","volume","pages","item_type","tags","authors","editors"];for(let i of r)Object.prototype.hasOwnProperty.call(t,i)&&this.setMetadataSnapshotValue(n,i,this.normalizeSnapshotValue(i,t[i]));return Object.keys(n).length>0?n:null}parseLegacyMetadataSnapshot(e){var n;if(!e)return null;let t=(n=e.zrr_metadata_snapshot)!=null?n:e["zrr metadata snapshot"];return t?this.normalizeMetadataSnapshotRecord(t):null}async loadMetadataSnapshotCache(){var n;let e=this.app.vault.adapter,t=this.getMetadataSnapshotCachePath();if(!await e.exists(t))return{};try{let r=await e.read(t),i=JSON.parse(r),a=(n=i==null?void 0:i.entries)!=null?n:i;if(!a||typeof a!="object"||Array.isArray(a))return{};let s={};for(let[o,l]of Object.entries(a)){let c=this.normalizeMetadataSnapshotRecord(l);c&&(s[String(o)]=c)}return s}catch(r){return console.error("Failed to read metadata snapshot cache",r),{}}}async getMetadataSnapshotCache(){return this.metadataSnapshotCache?this.metadataSnapshotCache:(this.metadataSnapshotCache=await this.loadMetadataSnapshotCache(),this.metadataSnapshotCache)}async saveMetadataSnapshotCache(e){await this.ensureFolder(se);let t=this.app.vault.adapter,n=this.getMetadataSnapshotCachePath(),r={version:1,entries:e};await t.write(n,JSON.stringify(r,null,2)),this.metadataSnapshotCache=e}async removeLegacyMetadataSnapshotFrontmatter(e,t){if(!!!(t&&(Object.prototype.hasOwnProperty.call(t,"zrr_metadata_snapshot")||Object.prototype.hasOwnProperty.call(t,"zrr metadata snapshot"))))return;let r=e.path;this.noteSyncSuppressed.add(r),this.noteMetadataSyncSuppressed.add(r);try{await this.app.fileManager.processFrontMatter(e,i=>{delete i.zrr_metadata_snapshot,delete i["zrr metadata snapshot"]})}catch(i){console.warn("Failed to remove legacy metadata snapshot",i)}finally{activeWindow.setTimeout(()=>{this.noteSyncSuppressed.delete(r),this.noteMetadataSyncSuppressed.delete(r)},1500)}}async getMetadataSnapshot(e,t,n){if(!e)return null;let r=await this.getMetadataSnapshotCache(),i=r[e];if(i)return i;let a=t?this.parseLegacyMetadataSnapshot(t):null;return a?(r[e]=a,await this.saveMetadataSnapshotCache(r),await this.removeLegacyMetadataSnapshotFrontmatter(n,t),a):null}serializeMetadataSnapshot(e,t){let n={};for(let r of t)e[r]!==void 0&&(n[r]=e[r]);return JSON.stringify(n)}async updateMetadataSnapshot(e,t,n,r,i,a,s){var _,g;if(!t)return;let o=i?{...i}:{};for(let f of s){let b=n[f],k=r[f];if(this.metadataValuesEqual(f,b,k)){this.setMetadataSnapshotValue(o,f,this.normalizeSnapshotValue(f,b));continue}let m=a[f];m==="note"?this.setMetadataSnapshotValue(o,f,this.normalizeSnapshotValue(f,b)):m==="zotero"&&this.setMetadataSnapshotValue(o,f,this.normalizeSnapshotValue(f,k))}let l=this.serializeMetadataSnapshot(o,s),c=await this.getMetadataSnapshotCache(),d=c[t],p=d?this.serializeMetadataSnapshot(d,s):"";if(l!==p){c[t]=o;try{await this.saveMetadataSnapshotCache(c)}catch(f){console.warn("Failed to update metadata snapshot cache",f)}await this.removeLegacyMetadataSnapshotFrontmatter(e,(g=(_=this.app.metadataCache.getFileCache(e))==null?void 0:_.frontmatter)!=null?g:null)}}async removeMetadataSnapshot(e){if(!e)return;let t=await this.getMetadataSnapshotCache();if(t[e]){delete t[e];try{await this.saveMetadataSnapshotCache(t)}catch(n){console.warn("Failed to remove metadata snapshot",n)}}}getAnnotationSnapshotCachePath(){return(0,h.normalizePath)(Gt)}async loadAnnotationSnapshotCache(){var n;let e=this.app.vault.adapter,t=this.getAnnotationSnapshotCachePath();if(!await e.exists(t))return{};try{let r=await e.read(t),i=JSON.parse(r),a=(n=i==null?void 0:i.entries)!=null?n:i;return!a||typeof a!="object"||Array.isArray(a)?{}:a}catch(r){return console.error("Failed to read annotation snapshot cache",r),{}}}async getAnnotationSnapshotCache(){return this.annotationSnapshotCache?this.annotationSnapshotCache:(this.annotationSnapshotCache=await this.loadAnnotationSnapshotCache(),this.annotationSnapshotCache)}async saveAnnotationSnapshotCache(e){await this.ensureFolder(se);let t=this.app.vault.adapter,n=this.getAnnotationSnapshotCachePath(),r={version:1,entries:e};await t.write(n,JSON.stringify(r,null,2)),this.annotationSnapshotCache=e}annotationSnapshotFromEntry(e,t){var o;let n=this.normalizeAnnotationText(e.text),r=this.normalizeAnnotationText(e.comment),i=this.normalizeAnnotationTags((o=e.tags)!=null?o:[]),a=e.imageHash?e.imageHash.toLowerCase():"",s=e.colorKey?this.normalizeAnnotationColorKey(e.colorKey):"";return t==="note"&&!r&&n?{text:"",comment:n,tags:i,image_hash:a,color_key:s}:{text:n,comment:r,tags:i,image_hash:a,color_key:s}}annotationSnapshotsEqual(e,t){if(e.text!==t.text||e.comment!==t.comment||(e.image_hash||"")!==(t.image_hash||"")||e.tags.length!==t.tags.length)return!1;for(let n=0;n<e.tags.length;n+=1)if(e.tags[n]!==t.tags[n])return!1;return!0}annotationSnapshotsEqualIgnoringImage(e,t){if(e.text!==t.text||e.comment!==t.comment||e.tags.length!==t.tags.length)return!1;for(let n=0;n<e.tags.length;n+=1)if(e.tags[n]!==t.tags[n])return!1;return!0}async getAnnotationSnapshot(e){var n;return e&&(n=(await this.getAnnotationSnapshotCache())[e])!=null?n:null}async updateAnnotationSnapshot(e,t,n){if(!e)return;let r=await this.getAnnotationSnapshotCache(),i={attachment_key:t,annotations:{}};for(let a of n)i.annotations[a.key]=this.annotationSnapshotFromEntry(a,a.annotationType);r[e]=i;try{await this.saveAnnotationSnapshotCache(r)}catch(a){console.warn("Failed to update annotation snapshot cache",a)}}async applyNoteMetadataUpdates(e,t){if(!Object.keys(t).length)return;let n=e.path;this.noteSyncSuppressed.add(n),this.noteMetadataSyncSuppressed.add(n);try{await this.app.fileManager.processFrontMatter(e,r=>{var i,a,s,o,l,c,d,p,_,g,f,b,k,m,x;"title"in t&&(r.title=(i=t.title)!=null?i:""),"short_title"in t&&(r["short title"]=(a=t.short_title)!=null?a:"",delete r.short_title,delete r.shortTitle,delete r["title-short"]),"citekey"in t&&(r.citekey=(s=t.citekey)!=null?s:"",delete r.citation_key,delete r.citationKey,delete r["citation key"],delete r["citation-key"]),"date"in t&&(r.date=(o=t.date)!=null?o:""),"abstract"in t&&(r.abstract=(l=t.abstract)!=null?l:""),"doi"in t&&(r.doi=(c=t.doi)!=null?c:""),"publication_title"in t&&(r["publication title"]=(d=t.publication_title)!=null?d:"",delete r.publication_title,delete r.publicationTitle,delete r["publication-title"]),"book_title"in t&&(r["book title"]=(p=t.book_title)!=null?p:"",delete r.book_title,delete r.bookTitle,delete r["book-title"]),"journal_abbrev"in t&&(r["journal abbrev"]=(_=t.journal_abbrev)!=null?_:"",delete r.journal_abbrev,delete r.journalAbbrev,delete r["journal-abbrev"]),"publisher"in t&&(r.publisher=(g=t.publisher)!=null?g:""),"place"in t&&(r.place=(f=t.place)!=null?f:""),"issue"in t&&(r.issue=(b=t.issue)!=null?b:""),"volume"in t&&(r.volume=(k=t.volume)!=null?k:""),"pages"in t&&(r.pages=(m=t.pages)!=null?m:""),"item_type"in t&&(r["item type"]=(x=t.item_type)!=null?x:"",delete r.item_type,delete r.itemType,delete r["item-type"]),"tags"in t&&(r.tags=Array.isArray(t.tags)?t.tags:[]),"authors"in t&&(r.authors=Array.isArray(t.authors)?t.authors:[]),"editors"in t&&(r.editors=Array.isArray(t.editors)?t.editors:[])})}catch(r){console.warn("Failed to update note frontmatter from Zotero",r)}finally{activeWindow.setTimeout(()=>{this.noteSyncSuppressed.delete(n),this.noteMetadataSyncSuppressed.delete(n)},1500)}}async applyZoteroMetadataUpdates(e,t,n,r,i){var s,o,l,c,d,p,_,g,f,b,k,m,x,w;if(!Object.keys(i).length)return;let a={};if("title"in i&&(a.title=(s=i.title)!=null?s:""),"short_title"in i&&(a.shortTitle=(o=i.short_title)!=null?o:""),"citekey"in i){let S=(l=i.citekey)!=null?l:"";a.citationKey=S,a.extra=this.updateExtraWithCitekey(t==null?void 0:t.extra,S)}if("date"in i&&(a.date=(c=i.date)!=null?c:""),"abstract"in i&&(a.abstractNote=(d=i.abstract)!=null?d:""),"doi"in i&&(a.DOI=(p=i.doi)!=null?p:""),"publication_title"in i&&(a.publicationTitle=(_=i.publication_title)!=null?_:""),"book_title"in i&&(a.bookTitle=(g=i.book_title)!=null?g:""),"journal_abbrev"in i&&(a.journalAbbreviation=(f=i.journal_abbrev)!=null?f:""),"publisher"in i&&(a.publisher=(b=i.publisher)!=null?b:""),"place"in i&&(a.place=(k=i.place)!=null?k:""),"issue"in i&&(a.issue=(m=i.issue)!=null?m:""),"volume"in i&&(a.volume=(x=i.volume)!=null?x:""),"pages"in i&&(a.pages=(w=i.pages)!=null?w:""),"item_type"in i){let S=this.normalizeMetadataString(i.item_type);S&&(/^[A-Za-z][A-Za-z0-9]*$/.test(S)?a.itemType=S:console.warn("Skipping invalid item_type update",{itemKey:e,itemType:S}))}if("tags"in i&&(a.tags=this.buildZoteroTags(n.tags,t==null?void 0:t.tags)),"authors"in i||"editors"in i){let S="authors"in i?n.authors:r.authors,R="editors"in i?n.editors:r.editors;a.creators=this.buildZoteroCreators(S,R,Array.isArray(t==null?void 0:t.creators)?t.creators:[])}await this.updateZoteroItemFields(e,t,a)}updateExtraWithCitekey(e,t){let n=this.normalizeMetadataString(t),r=this.normalizeMetadataString(e),a=(r?r.split(/\r?\n/):[]).filter(s=>!this.isCitekeyExtraLine(s));return n&&a.push(`Citation Key: ${n}`),a.join(`
`).trim()}isCitekeyExtraLine(e){let t=e.trim();return t?/^biblatexcitekey\s*\[[^\]]*\]\s*$/i.test(t)?!0:/^\s*(citation key|citationkey|citekey|citation-key|bibtex key|bibtexkey|bibtex)\s*:/i.test(t):!1}async applyZoteroAnnotationUpdates(e){var t;for(let n of e){let{entry:r,note:i}=n,a=(t=r.rawValues)!=null?t:{},s=this.normalizeAnnotationText(i.text),o=this.normalizeAnnotationText(i.comment),l=String(r.annotationType||"").trim().toLowerCase(),c=l==="highlight"||l==="underline";!c&&!o&&s&&(o=s,s=""),l==="note"&&!o&&s&&(o=s,s="");let d={annotationComment:o,tags:this.buildZoteroTags(i.tags,a==null?void 0:a.tags)};c&&(d.annotationText=s);try{await this.updateZoteroItemFields(r.key,a,d),r.text=c?s:"",r.comment=o,r.tags=this.normalizeAnnotationTags(i.tags)}catch(p){console.warn(`Failed to update Zotero annotation ${r.key}`,p)}}}buildZoteroTags(e,t){let n=this.normalizeZoteroTags(e),r=n.map(o=>({tag:o,type:0})),i=new Set(n.map(o=>o.toLowerCase())),s=(Array.isArray(t)?t.map(o=>this.asRecord(o)).filter(o=>o!==null).filter(o=>Number(o.type)===1).filter(o=>typeof o.tag=="string"):[]).filter(o=>!i.has(String(o.tag).toLowerCase()));return[...r,...s]}buildZoteroCreators(e,t,n){let r=new Map;for(let o of n){let l=this.asRecord(o);if(!l||l.creatorType!=="editor"&&l.creatorType!=="seriesEditor")continue;let c=ve(l);c&&r.set(c.trim().toLowerCase(),String(l.creatorType))}let i=n.map(o=>this.asRecord(o)).filter(o=>o?o.creatorType!=="author"&&o.creatorType!=="editor"&&o.creatorType!=="seriesEditor":!1),a=e.map(o=>o.trim()).filter(Boolean).map(o=>({creatorType:"author",...this.parseCreatorName(o)})),s=t.map(o=>o.trim()).filter(Boolean).map(o=>{var l;return{creatorType:(l=r.get(o.trim().toLowerCase()))!=null?l:"editor",...this.parseCreatorName(o)}});return[...a,...s,...i]}parseCreatorName(e){var a;let t=String(e||"").trim();if(!t)return{name:""};if(t.includes(",")){let[s,o]=t.split(",",2).map(l=>l.trim());if(s&&o)return{firstName:o,lastName:s};if(s)return{lastName:s}}let n=t.split(/\s+/).filter(Boolean);if(n.length===1)return{name:t};let r=(a=n.pop())!=null?a:"";return{firstName:n.join(" ").trim(),lastName:r}}extractSyncSection(e){let t=we.exec(e);if(!t)return null;let n=e.slice(t.index+t[0].length),r=Ae.exec(n);return r?n.slice(0,r.index):null}extractDocIdFromSyncMarker(e){var i;let t=we.exec(e);if(!t)return null;let r=((i=t[0])!=null?i:"").match(/doc_id=(["']?)([^"'\s]+)\1/i);return r?r[2].trim():null}parseSyncedChunkBlocks(e){var c,d;let t=e.split(/\r?\n/),n=[],r="",i=!1,a,s=!1,o=[],l=()=>{r&&(n.push({chunkId:r,text:o.join(`
`).trim(),excludeFlag:i,pageStart:Number.isFinite(a!=null?a:NaN)?Number(a):void 0,sectionChunk:s}),r="",i=!1,a=void 0,s=!1,o=[])};for(let p of t){let _=p.match(be);if(_){l();let g=(c=_[1])!=null?c:"",f=g.match(/id=(["']?)([^"'\s]+)\1/i),b=f?f[2].trim():"";if(!b)continue;let k=Ge(p);r=b,i=/\bexclude\b/i.test(g)||/\bdelete\b/i.test(g),a=Number.isFinite((d=k==null?void 0:k.pageNumber)!=null?d:NaN)?Number(k==null?void 0:k.pageNumber):void 0,s=/\bsection\b/i.test(g),o=[];continue}if(Ze.test(p)){l();continue}if(r){if(Te.test(p)){i=!0;continue}this.isChunkBlockIdLine(p)||o.push(p)}}return l(),n}inferSectionTitleFromChunkText(e){if(!e)return"";let t=e.split(/\r?\n/);for(let n of t){let r=n.trim();if(!r)continue;let i=r.match(/^#{1,6}\s+(.+)$/);if(i!=null&&i[1])return i[1].trim();break}return""}extractAttachmentKeyFromAnnotationMarker(e){var r,i;let t=this.findAnnotationBlockRange(e);return t&&(i=(r=this.parseAnnotationBlockMarker(t.startMarker).attachmentKey)==null?void 0:r.trim())!=null?i:""}async restoreMissingChunkCacheFromNote(e,t,n,r){var b,k,m,x,w,S;let i=this.app.vault.adapter,a=(0,h.normalizePath)(`${te}/${n}.json`);if(await i.exists(a))return a;let s=this.extractSyncSection(t);if(!s)return r&&new h.Notice(`Chunks cache missing for ${n}, and no sync section was found in the note.`),null;let o=this.parseSyncedChunkBlocks(s);if(!o.length)return r&&new h.Notice(`Chunks cache missing for ${n}, and no chunk markers were found in the sync section.`),null;let l=[];for(let R of o){let P=String(R.chunkId||"").trim();if(!P)continue;let A=(b=this.normalizeChunkIdForNote(P,n))!=null?b:P,N=this.normalizeChunkText(String(R.text||"")),O=Number.isFinite((k=R.pageStart)!=null?k:NaN)?Number(R.pageStart):(m=mt(A))!=null?m:void 0,q={chunk_id:A,text:N,char_count:N.length};if(R.excludeFlag&&(q.excluded=!0),Number.isFinite(O!=null?O:NaN)&&(q.page_start=Number(O),q.page_end=Number(O)),R.sectionChunk){let j=this.inferSectionTitleFromChunkText(N);j&&(q.section=j)}l.push(q)}if(!l.length)return r&&new h.Notice(`Chunks cache missing for ${n}, and chunk markers contained no usable chunks.`),null;await this.ensureFolder(te);let c=await this.getDocIndexEntry(n);c||(c=await this.hydrateDocIndexFromCache(n));let d=(w=(x=this.app.metadataCache.getFileCache(e))==null?void 0:x.frontmatter)!=null?w:{},p=this.normalizeDocIndexPdfPath((S=c==null?void 0:c.pdf_path)!=null?S:""),_=(c==null?void 0:c.attachment_key)||this.extractAttachmentKeyFromAnnotationMarker(t)||await this.resolveAttachmentKeyForDocId(n,d),g={doc_id:n,chunks:l};p&&(g.source_pdf=p),_&&(g.metadata={attachment_key:_}),await i.write(a,JSON.stringify(g,null,2));let f={doc_id:n,note_path:e.path,note_title:E.default.basename(e.path,".md")};return p&&(f.pdf_path=p),_&&(f.attachment_key=_),await this.updateDocIndex(f),r&&new h.Notice(`Restored chunk cache from note markers for ${n}.`),a}normalizeChunkText(e){return e.split(/\r?\n/).filter(t=>!this.isChunkBlockIdLine(t)).map(t=>t.replace(/\s+/g," ").trim()).filter((t,n,r)=>!(t===""&&r[n-1]==="")).join(`
`).trim()}isAnnotationChunk(e){return!e||typeof e!="object"?!1:!!(e.is_annotation||e.annotation||e.annotation_key)}buildSyncedDoclingContent(e,t,n){var o;let r=t==null?void 0:t.chunks,i=(Array.isArray(r)?r:[]).filter(l=>!this.isAnnotationChunk(l));if(!i.length)return`<!-- zrr:sync-start doc_id=${e} -->
${n}
<!-- zrr:sync-end -->`;let a=i.some(l=>{if(typeof(l==null?void 0:l.section)=="string"?l.section.trim():"")return!0;let d=typeof(l==null?void 0:l.chunk_id)=="string"?l.chunk_id.trim():"";return!!(d&&!/^p\d+$/i.test(d))}),s=[`<!-- zrr:sync-start doc_id=${e} -->`];for(let l of i){let c=typeof(l==null?void 0:l.chunk_id)=="string"?l.chunk_id.trim():"";if(!c)continue;let d=Number.isFinite((o=l==null?void 0:l.page_start)!=null?o:NaN)?Number(l.page_start):null,p=!!(l!=null&&l.excluded||l!=null&&l.exclude),g=typeof(l==null?void 0:l.text)=="string"?l.text.trim():"";if(a){let m=typeof(l==null?void 0:l.section)=="string"?l.section.trim():"",x=m?`## ${m}`:"";x&&!g.startsWith("#")&&(g=g?`${x}

${g}`:x)}let f=d!==null?a?` (${d})`:` page=${d}`:"",k=` id=${c}${a?" section":""}${f}${p?" exclude":""}`;s.push(`<!-- zrr:chunk${k} -->`),g&&s.push(g),s.push("<!-- zrr:chunk end -->"),s.push("")}return s[s.length-1]===""&&s.pop(),s.push("<!-- zrr:sync-end -->"),s.join(`
`)}async readChunkPayload(e){try{let t=await this.app.vault.adapter.read(e);return JSON.parse(t)}catch(t){return console.warn("Failed to read cached chunks JSON",t),null}}buildAnnotationChunk(e){var a;let t=[];e.text&&t.push(e.text),e.comment&&t.push(e.comment),e.tags.length&&t.push(`Tags: ${e.tags.map(s=>`#${s}`).join(" ")}`);let n=t.join(`

`).trim(),r=(a=e.pageIndex)!=null?a:0,i=e.pageLabel||(e.pageIndex?String(e.pageIndex):"");return{chunk_id:e.key,text:n,page_start:r,page_end:r,annotation_page_label:i,section:e.heading,chunk_tags:e.tags,is_annotation:!0,annotation_key:e.key,annotation_color:e.colorKey,annotation_text:e.text,annotation_comment:e.comment}}annotationChunkSignature(e){var t,n,r,i,a,s,o,l,c;return JSON.stringify({text:(t=e.text)!=null?t:"",page_start:(n=e.page_start)!=null?n:"",page_end:(r=e.page_end)!=null?r:"",section:(i=e.section)!=null?i:"",chunk_tags:Array.isArray(e.chunk_tags)?e.chunk_tags:(a=e.chunk_tags)!=null?a:"",annotation_color:(s=e.annotation_color)!=null?s:"",annotation_page_label:(o=e.annotation_page_label)!=null?o:"",annotation_text:(l=e.annotation_text)!=null?l:"",annotation_comment:(c=e.annotation_comment)!=null?c:""})}async updateAnnotationChunks(e,t,n,r){var b;let i=(r==null?void 0:r.allowDeletes)!==!1,a=(0,h.normalizePath)(`${te}/${e}.json`),s=this.app.vault.adapter;if(!await s.exists(a))return;let o=await this.readChunkPayload(a);if(!o)return;let l=Array.isArray(o.chunks)?o.chunks:[],c=[],d=new Map;for(let k of l){let m=typeof(k==null?void 0:k.chunk_id)=="string"?k.chunk_id:"";m&&this.isAnnotationChunk(k)?d.set(m,k):c.push(k)}let p=[],_=[],g=new Set;for(let k of n){let m=this.buildAnnotationChunk(k),x=typeof m.chunk_id=="string"?m.chunk_id:"";if(!x)continue;g.add(x),p.push(m);let w=d.get(x);if(!w){_.push(x);continue}this.annotationChunkSignature(w)!==this.annotationChunkSignature(m)&&_.push(x)}let f=[];if(i)for(let k of d.keys())g.has(k)||f.push(k);else for(let[k,m]of d.entries())g.has(k)||p.push(m);if(o.chunks=[...c,...p],await s.write(a,JSON.stringify(o,null,2)),(_.length||f.length)&&await this.reindexChunkUpdates(e,a,_,f),t)try{let k=(b=this.asRecord(o.metadata))!=null?b:{};k.attachment_key!==t&&(k.attachment_key=t,o.metadata=k,await s.write(a,JSON.stringify(o,null,2)))}catch(k){}}resolveChunkFromPayload(e,t,n){let r=this.normalizeChunkIdForNote(t,n)||t,i=new Set([t,r,`${n}:${t}`]);for(let a of e){let s=typeof(a==null?void 0:a.chunk_id)=="string"?a.chunk_id:"";if(s&&i.has(s))return a}return null}async writeNoteWithSyncSuppressed(e,t){this.noteSyncSuppressed.add(e);try{await this.app.vault.adapter.write(e,t)}finally{activeWindow.setTimeout(()=>{this.noteSyncSuppressed.delete(e)},1500)}}async resolveNotePathForDocId(e){if(!e)return null;let t=this.app.vault.adapter,n=await this.getDocIndexEntry(e);if(n!=null&&n.note_path&&await t.exists(n.note_path))return n.note_path;let i=(await this.scanNotesForDocIds(this.settings.outputNoteDir))[e];return i!=null&&i.note_path?(await this.updateDocIndex({doc_id:e,note_path:i.note_path,note_title:i.note_title}),i.note_path):null}isZoteroNoteFile(e){let t=this.app.metadataCache.getFileCache(e),n=t==null?void 0:t.frontmatter;return!!(this.getFrontmatterValue(n,"doc_id")||this.getFrontmatterValue(n,"zotero_key"))}async deleteZoteroNoteAndCacheForFile(e){var p,_;let t=e.path,n=await this.app.vault.read(e),r=(p=this.extractDocIdFromFrontmatter(n))!=null?p:this.extractDocIdFromSyncMarker(n);if(!r){new h.Notice("No doc_ID found in this note.");return}if(!await new Promise(g=>{new it(this.app,t,r,g).open()}))return;let a=this.app.vault.adapter,s=(0,h.normalizePath)(`${te}/${r}.json`),o=(0,h.normalizePath)(`${ce}/${r}.json`),l=await this.getDocIndexEntry(r),c="",d=[];if(await a.exists(s)){let g=await this.readChunkPayload(s);d=(Array.isArray(g==null?void 0:g.chunks)?g==null?void 0:g.chunks:[]).map(m=>typeof(m==null?void 0:m.chunk_id)=="string"?m.chunk_id:"").map(m=>m.startsWith(`${r}:`)?m.slice(r.length+1):m).filter(m=>m);let b=typeof(g==null?void 0:g.source_pdf)=="string"?g.source_pdf:"",k=this.normalizeDocIndexPdfPath(b);k&&k.startsWith((0,h.normalizePath)(this.settings.outputPdfDir))&&await a.exists(k)&&(c=k)}if(!c){let g=this.normalizeDocIndexPdfPath((_=l==null?void 0:l.pdf_path)!=null?_:"");g&&g.startsWith((0,h.normalizePath)(this.settings.outputPdfDir))&&await a.exists(g)&&(c=g)}d.length>0&&await this.reindexChunkUpdates(r,s,[],d);try{if(await a.exists(s)&&await a.remove(s),await a.exists(o)&&await a.remove(o),await this.removeDocIndexEntry(r),c){let g=this.app.vault.getAbstractFileByPath(c);g instanceof h.TFile?await this.app.fileManager.trashFile(g):await a.exists(c)&&await a.remove(c)}await this.app.fileManager.trashFile(e),new h.Notice(`Deleted note and cache for ${r}.`)}catch(g){console.error("Failed to delete note and cached data",g),new h.Notice("Failed to delete note or cached data. See console for details.")}}async deleteZoteroNoteAndCache(){let e=this.app.workspace.getActiveViewOfType(h.MarkdownView);if(!e||!e.file){new h.Notice("No active Zotero note found.");return}await this.deleteZoteroNoteAndCacheForFile(e.file)}formatRedisSearchResults(e){var _;let t=(_=this.asRecord(e))!=null?_:{},n=typeof t.total=="number"?t.total:0,r=typeof t.query=="string"?t.query:"",i=typeof t.raw_query=="string"?t.raw_query:"",a=t.field_types&&typeof t.field_types=="object"?t.field_types:null,s=!!t.fallback_used,o=typeof t.fallback_reason=="string"?t.fallback_reason:"",l=Array.isArray(t.fallback_queries)?t.fallback_queries:[],c=Array.isArray(t.fallback_failed_fields)?t.fallback_failed_fields:[],d=Array.isArray(t.results)?t.results:[],p=[];if(p.push(`Query: ${i||r}`),r&&i&&r!==i&&p.push(`Expanded: ${r}`),p.push(`Total matches: ${n}`),a&&Object.keys(a).length>0){let g=Object.keys(a).sort().map(f=>{let b=a[f],k=typeof b=="string"||typeof b=="number"||typeof b=="boolean"?String(b):"";return`${f}:${k}`});p.push(`Field types: {${g.join(", ")}}`)}if(s&&p.push(`Fallback: ${o||"true"}`),l.length){p.push("Fallback queries:");for(let g of l)p.push(`  - ${g}`)}if(c.length&&p.push(`Fallback failed fields: ${c.join(", ")}`),p.push(""),!d.length)return p.push("(no results)"),p.join(`
`);for(let g of d){let f=String(g.doc_id||"").trim(),b=String(g.chunk_id||"").trim(),k=String(g.page_start||"").trim(),m=String(g.page_end||"").trim(),x=String(g.title||"").trim(),w=String(g.section||"").trim(),S=String(g.score||"").trim(),R=String(g.authors||"").trim(),P=String(g.item_type||"").trim(),A=String(g.year||"").trim(),N=String(g.tags||"").trim(),O=String(g.chunk_tags||"").trim(),q=String(g.attachment_key||"").trim(),j=String(g.source_pdf||"").trim(),V=String(g.text||"").replace(/\s+/g," ").trim(),z=V.length>220?`${V.slice(0,220)}\u2026`:V,Z=[f];b&&Z.push(b),(k||m)&&Z.push(`p.${k||"?"}-${m||"?"}`),p.push(Z.filter(Boolean).join(" \u2022 ")),S&&p.push(`  score: ${S}`),x&&p.push(`  title: ${x}`),R&&p.push(`  authors: ${R}`),A&&p.push(`  year: ${A}`),P&&p.push(`  item_type: ${P}`),N&&p.push(`  tags: ${N}`),O&&p.push(`  chunk_tags: ${O}`),q&&p.push(`  attachment_key: ${q}`),w&&p.push(`  section: ${w}`),j&&p.push(`  source_pdf: ${j}`),z&&p.push(`  ${z}`),p.push("")}return p.join(`
`)}searchRedisIndex(){new nt(this.app,this,this.lastRedisSearchTerm).open()}async runRedisSearch(e){let t=e.trim();if(!t)return"(no query)";if(this.lastRedisSearchTerm=t,!await this.ensureRedisAvailable("index search"))return"Redis is not reachable. Please start Redis Stack and try again.";let n=this.getPluginDir(),r=E.default.join(n,"tools","search_redis.py"),i=["--query",t,"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--limit","10"];try{await this.ensureBundledTools();let a=await this.runPythonWithOutput(r,i),s=JSON.parse(a||"{}");return this.formatRedisSearchResults(s)||"(no results)"}catch(a){return console.error("Redis search failed",a),"Redis search failed. See console for details."}}async showRedisDiagnostics(){if(!await this.ensureRedisAvailable("diagnostics"))return;let e=this.getPluginDir(),t=E.default.join(e,"tools","redis_diagnostics.py"),n=["--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName()];try{await this.ensureBundledTools();let r=await this.runPythonWithOutput(t,n),i=JSON.parse(r||"{}"),a=`\`\`\`json
${JSON.stringify(i,null,2)}
\`\`\``;new Ee(this.app,"Redis diagnostics",a||"(empty)").open()}catch(r){console.error("Redis diagnostics failed",r),new h.Notice("Redis diagnostics failed. See console for details.")}}async resolveUniqueBaseName(e,t){let n=this.app.vault.adapter,r=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),i=(0,h.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),a=await n.exists(r),s=this.settings.copyPdfToVault?await n.exists(i):!1;return a||s?`${e}-${t}`:e}async searchZoteroItems(e){let t=e.trim(),n=["data,meta"];for(let r of n){let i=new URLSearchParams;i.set("itemType","-attachment"),i.set("limit","25"),i.set("include",r),t?i.set("q",t):(i.set("sort","dateAdded"),i.set("direction","desc"));let a=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/top?${i.toString()}`);try{let s=await this.requestLocalApi(a,`Zotero search failed for ${a}`),o=JSON.parse(s.toString("utf8"));return Array.isArray(o)?this.normalizeZoteroSearchResults(o):[]}catch(s){console.warn("Failed to search Zotero via local API",s)}}if(!this.canUseWebApi())throw new Error("Zotero search failed for all include modes.");return this.searchZoteroItemsWeb(t)}async searchIndexedZoteroItems(e,t=25){let n=e.trim(),r=this.normalizeIndexedSearchQuery(n),i=Math.max(1,Math.floor(t)),a=await this.getDocIndex(),s=await this.getMetadataSnapshotCache(),o=Object.keys(a);if(!o.length)return[];let l=this.app.vault.adapter,c=[];for(let p of o){let _=a[p],g=s[p],f=(0,h.normalizePath)(`${ce}/${p}.json`),b=null;if(await l.exists(f))try{let m=await l.read(f),x=JSON.parse(m);b=this.normalizeIndexedSearchItem(x,p)}catch(m){console.debug("Failed to parse indexed Zotero cache item",{docId:p,error:m})}if(b||(b=this.buildIndexedSearchFallbackItem(p,_)),!b||!this.isImportableZoteroResult(b))continue;let k=this.buildIndexedSearchFields(b,_,g);c.push({item:b,title:k.title,citekey:k.citekey,searchable:k.searchable,updatedAt:this.parseIndexTimestamp(_==null?void 0:_.updated_at)})}return r?c.map((p,_)=>({idx:_,item:p.item,updatedAt:p.updatedAt,score:this.scoreIndexedSearchEntry(r,p.title,p.citekey,p.searchable)})).filter(p=>p.score>0).sort((p,_)=>_.score!==p.score?_.score-p.score:_.updatedAt!==p.updatedAt?_.updatedAt-p.updatedAt:p.idx-_.idx).slice(0,i).map(p=>p.item):c.sort((p,_)=>_.updatedAt-p.updatedAt).slice(0,i).map(p=>p.item)}normalizeIndexedSearchItem(e,t){var s,o;let n=this.asRecord(e);if(!n)return null;let r=(s=this.asRecord(n.data))!=null?s:n,i=(o=this.asRecord(n.meta))!=null?o:{};return{key:U(n.key)||U(r.key)||t,data:r,meta:i}}buildIndexedSearchFallbackItem(e,t){let n=U(t==null?void 0:t.zotero_title)||U(t==null?void 0:t.short_title)||U(t==null?void 0:t.note_title);return n?{key:e,data:{key:e,title:n},meta:{}}:null}collectIndexedSearchTags(e){let t=e.tags;if(!Array.isArray(t))return[];let n=[];for(let r of t){if(typeof r=="string"){let i=r.trim();i&&n.push(i);continue}if(r&&typeof r=="object"){let i=this.asRecord(r),a=i?U(i.tag):"";a&&n.push(a)}}return n}collectIndexedSearchCreators(e){let t=e.creators;if(!Array.isArray(t))return[];let n=[];for(let r of t){let i=ve(r).trim();i&&n.push(i)}return n}buildIndexedSearchFields(e,t,n){let r=e.data,i=U(r.title)||this.normalizeMetadataString(n==null?void 0:n.title)||U(t==null?void 0:t.zotero_title)||U(t==null?void 0:t.note_title),a=Pe(r)||this.normalizeMetadataString(n==null?void 0:n.short_title)||U(t==null?void 0:t.short_title),s=Ie(r,e.meta)||this.normalizeMetadataString(n==null?void 0:n.citekey),o=U(r.itemType)||this.normalizeMetadataString(n==null?void 0:n.item_type),l=U(r.publicationTitle)||this.normalizeMetadataString(n==null?void 0:n.publication_title),c=U(r.bookTitle)||this.normalizeMetadataString(n==null?void 0:n.book_title),d=U(r.journalAbbreviation)||this.normalizeMetadataString(n==null?void 0:n.journal_abbrev),p=Ye(U(r.date)||this.normalizeMetadataString(n==null?void 0:n.date)),_=this.collectIndexedSearchTags(e.data),g=this.collectIndexedSearchCreators(e.data),f=this.normalizeMetadataList(n==null?void 0:n.tags),b=this.normalizeMetadataList(n==null?void 0:n.authors),k=this.normalizeMetadataList(n==null?void 0:n.editors),m=[i,a,s,e.key,o,l,c,d,p,..._,...g,...f,...b,...k].filter(x=>!!(x&&String(x).trim())).join(" ").toLowerCase();return{title:i,citekey:s,searchable:m}}scoreIndexedSearchEntry(e,t,n,r){if(!r)return 0;let i=t.toLowerCase(),a=n.toLowerCase(),s=0;a&&(a===e?s+=140:a.startsWith(e)?s+=110:a.includes(e)&&(s+=90)),i&&(i===e?s+=90:i.startsWith(e)?s+=65:i.includes(e)&&(s+=45)),r.includes(e)&&(s+=25);let o=e.split(/\s+/).filter(Boolean);if(o.length>1){let l=0;for(let c of o)r.includes(c)&&(l+=1);if(l===0)return 0;s+=l*10}return s}normalizeIndexedSearchQuery(e){return e.trim().replace(/^@+/,"").replace(/^[\s.,;:!?()[\]{}<>"'`]+/,"").replace(/[\s.,;:!?()[\]{}<>"'`]+$/,"").replace(/\s+/g," ").toLowerCase()}parseIndexTimestamp(e){if(!e)return 0;let t=Date.parse(e);return Number.isFinite(t)?t:0}async hasProcessableAttachment(e){var i;let t=(i=e.data)!=null?i:e,n=typeof e.key=="string"?e.key:U(t.key);return n?!!await qe(t,n,{fetchZoteroChildren:this.fetchZoteroChildren.bind(this)}):!1}async fetchZoteroChildrenLocal(e,t={}){let n=new URLSearchParams;t.includeAnnotationImage&&n.set("include","annotationImage");let r=n.toString()?`?${n.toString()}`:"",i=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children${r}`),a=await this.requestLocalApi(i,`Zotero children request failed for ${i}`);return JSON.parse(a.toString("utf8"))}async fetchZoteroChildrenWeb(e,t={}){if(!this.canUseWebApi()&&(!await this.ensureWebApiLibraryId()||!this.canUseWebApi()))throw new Error("Zotero Web API is not configured.");let n=new URLSearchParams;t.includeAnnotationImage&&n.set("include","annotationImage");let r=n.toString()?`?${n.toString()}`:"",i=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/children${r}`),a=await this.requestWebApi(i,`Zotero Web API children request failed for ${i}`);return JSON.parse(a.toString("utf8"))}async fetchZoteroChildren(e){try{return await this.fetchZoteroChildrenLocal(e)}catch(t){if(console.warn("Failed to fetch Zotero children from local API",t),!this.canUseWebApi())throw t;return this.fetchZoteroChildrenWeb(e)}}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}canUseWebApi(){return!!((this.settings.webApiBaseUrl||"").trim()&&this.settings.webApiKey&&this.settings.webApiLibraryId)}async ensureWebApiLibraryId(){var r,i,a,s,o;let e=(this.settings.webApiBaseUrl||"").trim(),t=(this.settings.webApiKey||"").trim();if(!e||!t||(this.settings.webApiLibraryId||"").trim())return!!(this.settings.webApiLibraryId||"").trim();let n=this.buildWebApiUrl("/keys/current");try{let l=await this.requestWebApi(n,`Zotero Web API key lookup failed for ${n}`),c=JSON.parse(l.toString("utf8")),d=(o=(a=(r=c==null?void 0:c.userID)!=null?r:c==null?void 0:c.userId)!=null?a:(i=c==null?void 0:c.data)==null?void 0:i.userID)!=null?o:(s=c==null?void 0:c.data)==null?void 0:s.userId;return d?(this.settings.webApiLibraryId=String(d),await this.saveSettings(),console.debug("Resolved Zotero Web API user ID from key",{userId:d}),!0):!1}catch(l){return this.logOptionalLookupFailure("Failed to resolve Zotero Web API user ID",l),!1}}getWebApiLibraryPath(){let e=(this.settings.webApiLibraryId||"").trim();return e?`${this.settings.webApiLibraryType==="group"?"groups":"users"}/${e}`:""}buildWebApiUrl(e){return`${this.settings.webApiBaseUrl.replace(/\/$/,"")}${e}`}isZoteroLocalApiRequest(e){let t=(this.settings.zoteroBaseUrl||"").trim();if(!t)return!1;try{let n=new URL(e),r=new URL(t),i=n.port||(n.protocol==="https:"?"443":"80"),a=r.port||(r.protocol==="https:"?"443":"80");if(n.protocol!==r.protocol||n.hostname!==r.hostname||i!==a)return!1;let s=r.pathname.replace(/\/$/,"");return!s||s==="/"?!0:n.pathname===s||n.pathname.startsWith(`${s}/`)}catch(n){return!1}}notifyZoteroLocalApiConnectionError(){this.notifyZoteroApiOnce("Zotero connection error. Start Zotero and enable 'Allow other applications on this computer to communicate with Zotero' in Settings -> Advanced -> General.")}requestLocalApiRaw(e,t={}){return new Promise((n,r)=>{var f,b,k;let i=this.isZoteroLocalApiRequest(e),a=new URL(e),s=a.protocol==="https:"?yn.default:St.default,o=(f=t.method)!=null?f:"GET",l={Accept:"*/*",...(b=t.headers)!=null?b:{}},c=t.body,d=Number.isFinite((k=t.timeoutMs)!=null?k:NaN)?Number(t.timeoutMs):0,p=null;if(c!==void 0&&l["Content-Length"]===void 0){let m=Buffer.isBuffer(c)?c.length:Buffer.byteLength(c);l["Content-Length"]=String(m)}let _=s.request({method:o,hostname:a.hostname,port:a.port||void 0,path:`${a.pathname}${a.search}`,headers:l},m=>{let x=[];m.on("data",w=>x.push(Buffer.from(w))),m.on("end",()=>{var S;p&&activeWindow.clearTimeout(p),i&&(this.lastZoteroApiNotice=null);let w=Buffer.concat(x);n({statusCode:(S=m.statusCode)!=null?S:0,headers:m.headers,body:w})})});d>0&&(p=activeWindow.setTimeout(()=>{_.destroy(new Error(`Request timed out after ${d}ms`))},d)),_.on("error",m=>{p&&activeWindow.clearTimeout(p),i&&this.notifyZoteroLocalApiConnectionError();let x=m instanceof Error?m:new Error(typeof m=="string"?m:"Request failed");r(x)}),c!==void 0&&_.write(c),_.end()})}async requestLocalApi(e,t){let n=await this.requestLocalApiRaw(e);if(n.statusCode>=400){let r=n.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${n.statusCode}: ${r||"no response body"}`)}if(n.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${n.statusCode}`);return n.body}async requestLocalApiWithBody(e,t,n,r,i){let a=JSON.stringify(n),s=await this.requestLocalApiRaw(e,{method:t,headers:r,body:a});if(s.statusCode>=400){let o=s.body.toString("utf8");throw new Error(`${i!=null?i:"Request failed"}, status ${s.statusCode}: ${o||"no response body"}`)}if(s.statusCode>=300)throw new Error(`${i!=null?i:"Request failed"}, status ${s.statusCode}`);return{statusCode:s.statusCode,body:s.body}}async requestWebApi(e,t){let n={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},r=await this.requestLocalApiRaw(e,{headers:n});if(r.statusCode>=400){let i=r.body.toString("utf8");throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}: ${i||"no response body"}`)}if(r.statusCode>=300)throw new Error(`${t!=null?t:"Request failed"}, status ${r.statusCode}`);return r.body}requestWebApiRaw(e,t={}){var r;let n={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey,...(r=t.headers)!=null?r:{}};return this.requestLocalApiRaw(e,{...t,headers:n})}async requestWebApiWithBody(e,t,n,r,i){let a=JSON.stringify(n),s=await this.requestLocalApiRaw(e,{method:t,headers:r,body:a});if(s.statusCode>=400){let o=s.body.toString("utf8");throw new Error(`${i!=null?i:"Request failed"}, status ${s.statusCode}: ${o||"no response body"}`)}if(s.statusCode>=300)throw new Error(`${i!=null?i:"Request failed"}, status ${s.statusCode}`);return{statusCode:s.statusCode,body:s.body}}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}async annotateChunkJsonWithAttachmentKey(e,t){if(t)try{let n=await this.app.vault.adapter.read(e),r=JSON.parse(n);if(!r||typeof r!="object")return;let i=r.metadata&&typeof r.metadata=="object"?r.metadata:{};i.attachment_key=t,r.metadata=i,await this.app.vault.adapter.write(e,JSON.stringify(r,null,2))}catch(n){console.warn("Failed to annotate chunks JSON with attachment key",n)}}async updateChunkJsonSourcePdf(e,t){if(t)try{let n=await this.app.vault.adapter.read(e),r=JSON.parse(n);if(!r||typeof r!="object")return;r.source_pdf=t,await this.app.vault.adapter.write(e,JSON.stringify(r,null,2))}catch(n){console.warn("Failed to update chunks JSON source_pdf",n)}}buildPdfLinkFromSourcePath(e){if(!e)return"";let t=this.toVaultRelativePath(e);return t?`[[${t}]]`:`[PDF](${(0,Rt.pathToFileURL)(e).toString()})`}toVaultRelativePath(e){if(!e)return"";if(!E.default.isAbsolute(e)&&!/^[A-Za-z]+:\/\//.test(e))return(0,h.normalizePath)(e);let t=E.default.normalize(this.getVaultBasePath()),n=E.default.normalize(e),r=t.endsWith(E.default.sep)?t:`${t}${E.default.sep}`;if(!n.startsWith(r)){let i=E.default.normalize(un),a=i.endsWith(E.default.sep)?i:`${i}${E.default.sep}`;return n.startsWith(a)?(0,h.normalizePath)(E.default.relative(i,n)):""}return(0,h.normalizePath)(E.default.relative(t,n))}normalizeDocIndexPdfPath(e){return e&&(this.toVaultRelativePath(e)||e)}async isFileAccessible(e){if(!e)return!1;try{return await ne.promises.access(e),!0}catch(t){return!1}}deriveVaultPdfRelativePath(e,t,n){let r=this.toVaultRelativePath(e);if(r&&r.startsWith((0,h.normalizePath)(this.settings.outputPdfDir)))return r;let i=this.sanitizeFileName(t)||n;return(0,h.normalizePath)(`${this.settings.outputPdfDir}/${i}.pdf`)}async recoverMissingPdfFromAttachment(e,t,n,r,i,a,s){let o=await qe(t,n,{fetchZoteroChildren:this.fetchZoteroChildren.bind(this)});if(!o&&i&&(o={key:i}),!o)return null;let l=o.key||i,c=o.filePath;if(!this.settings.copyPdfToVault&&c&&await this.isFileAccessible(c))return{sourcePdf:c,attachmentKey:l};try{await this.ensureFolder(this.settings.outputPdfDir)}catch(g){return console.error("Failed to create PDF output folder",g),null}let d=this.deriveVaultPdfRelativePath(e,a,r),p;try{if(c&&await this.isFileAccessible(c))p=await ne.promises.readFile(c);else if(l)p=await pt(l,{buildZoteroUrl:this.buildZoteroUrl.bind(this),getZoteroLibraryPath:this.getZoteroLibraryPath.bind(this),canUseWebApi:this.canUseWebApi.bind(this),buildWebApiUrl:this.buildWebApiUrl.bind(this),getWebApiLibraryPath:this.getWebApiLibraryPath.bind(this),requestLocalApiRaw:this.requestLocalApiRaw.bind(this),requestWebApiRaw:this.requestWebApiRaw.bind(this),requestLocalApi:this.requestLocalApi.bind(this),readFile:ne.promises.readFile}),!this.settings.copyPdfToVault&&s&&new h.Notice("Local PDF path unavailable; copied PDF into vault for processing.");else return null}catch(g){return console.error("Failed to read or download PDF attachment",g),null}try{await this.app.vault.adapter.writeBinary(d,this.bufferToArrayBuffer(p))}catch(g){return console.error("Failed to write recovered PDF into vault",g),null}return{sourcePdf:this.getAbsoluteVaultPath(d),attachmentKey:l}}buildPdfLinkForNote(e,t,n){return!e&&!t?"":!this.settings.copyPdfToVault&&t?`[PDF](${this.buildZoteroDeepLink(n!=null?n:"",t)})`:this.buildPdfLinkFromSourcePath(e)}async maybeCreateOcrLayeredPdf(e,t,n){if(!this.settings.createOcrLayeredPdf||!this.settings.copyPdfToVault||!e||!((t==null?void 0:t.ocr_used)===!0))return null;if(!this.toVaultRelativePath(e))return console.warn("OCR layered PDF requires a vault-local PDF"),null;try{await this.ensureFolder(this.settings.outputPdfDir)}catch(c){return console.warn("Failed to create OCR PDF output folder",c),null}let i=`${e}.ocr.tmp`,a=typeof(t==null?void 0:t.languages)=="string"?t.languages:"",s=(typeof n=="string"&&n.trim()?n:a||"eng").trim(),o=this.getPluginDir(),l=E.default.join(o,"tools","ocr_layered_pdf.py");try{return this.showStatusProgress("Creating OCR PDF...",0),await this.runPythonStreaming(l,["--pdf",e,"--out-pdf",i,"--language",s,"--progress"],c=>{let d=this.asRecord(c),p=typeof(d==null?void 0:d.total)=="number"?d.total:0,_=typeof(d==null?void 0:d.current)=="number"?d.current:0;if((d==null?void 0:d.type)==="progress"&&p>0){let g=Math.round(_/p*100);this.showStatusProgress(`Creating OCR PDF ${_}/${p}`,g)}},()=>{}),await ne.promises.rename(i,e),e}catch(c){return console.warn("OCR layered PDF creation failed",c),null}}getMainLeaf(){let e=new Set(this.app.workspace.getLeavesOfType(Le)),t=this.app.workspace.getLeavesOfType("markdown").find(r=>!e.has(r));if(t)return t;let n=this.app.workspace.getLeaf(!1);return n&&!e.has(n)?n:this.app.workspace.getLeaf("tab")}async openNoteInMain(e){let t=(0,h.normalizePath)(e),n=this.app.vault.getAbstractFileByPath(t),r=this.getMainLeaf();if(n instanceof h.TFile){await r.openFile(n,{active:!0});return}await this.app.workspace.openLinkText(t,"",!1)}findChunkLineInText(e,t){if(!e||!t)return null;let n=this.escapeRegExp(t),r=new RegExp(`<!--\\s*zrr:chunk\\b[^>]*\\bid=(["']?)${n}\\1[^>]*-->`,"i"),i=e.split(`
`);for(let a=0;a<i.length;a+=1)if(r.test(i[a]))return a;return null}findAnnotationLineInText(e,t){if(!e||!t)return null;let n=this.escapeRegExp(t),r=new RegExp(`^\\s*>?\\s*\\^${n}\\b`,"i"),i=e.split(`
`);for(let a=0;a<i.length;a+=1)if(r.test(i[a]))return a;return null}extractChunkIdFromAnchor(e){if(!e)return"";let t=String(e).replace(/\\\|/g,"|").trim(),n=t.indexOf("|");return(n>=0?t.slice(0,n):t).trim()}async openNoteAtChunk(e,t){let n=this.extractChunkIdFromAnchor(t);if(!e||!n)return!1;await this.openNoteInMain(e);let i=this.getMainLeaf().view;if(!(i instanceof h.MarkdownView))return!1;let a=i.editor,s=this.normalizeChunkIdForNote(n)||n,o=this.findChunkLineInText(a.getValue(),s);return o===null?(new h.Notice(`Chunk ${s} not found in note.`),!1):(a.setCursor({line:o,ch:0}),a.scrollIntoView({from:{line:o,ch:0},to:{line:o,ch:0}},!0),!0)}async openNoteAtAnnotation(e,t,n,r){let i=this.buildAnnotationBlockId(t,n,r);if(!e||!i)return!1;await this.openNoteInMain(e);let s=this.getMainLeaf().view;if(!(s instanceof h.MarkdownView))return!1;let o=s.editor,l=this.findAnnotationLineInText(o.getValue(),i);return l===null?(new h.Notice(`Annotation ${t} not found in note.`),!1):(o.setCursor({line:l,ch:0}),o.scrollIntoView({from:{line:l,ch:0},to:{line:l,ch:0}},!0),!0)}isZrrChunkInternalLink(e){return String(e||"").replace(/\\\|/g,"|").includes("#zrr-chunk:")}getLivePreviewSourcePath(){var t,n,r;let e=this.app.workspace.getActiveViewOfType(h.MarkdownView);return(t=e==null?void 0:e.file)!=null&&t.path?e.file.path:(r=(n=this.app.workspace.getActiveFile())==null?void 0:n.path)!=null?r:""}hookChunkInternalLinks(e,t){let n=e.querySelectorAll("a.internal-link");for(let r of Array.from(n)){if(r.dataset.zrrChunkBound==="1")continue;let i=r.getAttribute("data-href")||r.getAttribute("href")||"";this.isZrrChunkInternalLink(i)&&(r.dataset.zrrChunkBound="1",this.registerDomEvent(r,"click",a=>{a.preventDefault(),a.stopPropagation(),this.openInternalLinkInMain(i,t)}))}}async openInternalLinkInMain(e,t=""){let n=this.getMainLeaf(),[r,...i]=e.split("#"),a=r||"",s=i.join("#").trim(),o="zrr-chunk:",l=null;if(a){let c=Array.from(new Set([a,a.trimEnd(),a.trim()]));for(let d of c){if(!d)continue;let p=this.app.metadataCache.getFirstLinkpathDest(d,t);if(p instanceof h.TFile){l=p;break}}}if(l instanceof h.TFile){let c=s.startsWith(o)?this.extractChunkIdFromAnchor(s.slice(o.length).trim()):"";if(c&&await this.openNoteAtChunk(l.path,c))return;await n.openFile(l,{active:!0}),e.includes("#")&&!c&&await this.openLinkTextInLeaf(n,e,t);return}await this.openLinkTextInLeaf(n,e,t)}async openLinkTextInLeaf(e,t,n=""){let r=e;if(typeof r.openLinkText=="function"){await r.openLinkText(t,n,{active:!0});return}await this.app.workspace.openLinkText(t,n,"tab")}async openNoteInNewTab(e){let t=(0,h.normalizePath)(e);await this.app.workspace.openLinkText(t,"","tab")}async openPdfInMain(e,t){if(!e)return!1;let n=this.toVaultRelativePath(e);if(n){let r=t?`#page=${t}`:"";return await this.app.workspace.openLinkText(`${n}${r}`,"","tab"),!0}try{return window.open((0,Rt.pathToFileURL)(e).toString()),!0}catch(r){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,t,n,r){if(t){let i=new URLSearchParams;n&&i.set("page",n),r&&i.set("annotation",r);let a=i.toString()?`?${i.toString()}`:"";return`zotero://open-pdf/library/items/${t}${a}`}return`zotero://select/library/items/${e}`}extractAnnotationKey(e){if(!e)return;let n=(e.includes(":")?e.split(":").slice(1).join(":"):e).trim().toUpperCase();if(/^[A-Z0-9]{8}$/.test(n))return n}formatCitationsMarkdown(e){return e.length?e.map(n=>this.formatCitationMarkdown(n)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var d,p,_,g,f;let t=e.doc_id||"?",n=this.formatCitationPageLabel(e),r=e.annotation_key||this.extractAnnotationKey(e.chunk_id),i=e.attachment_key||((p=(d=this.docIndex)==null?void 0:d[e.doc_id||""])==null?void 0:p.attachment_key),a=e.page_start?String(e.page_start):"",s=(g=(_=this.docIndex)==null?void 0:_[e.doc_id||""])!=null?g:null,o=this.resolveCitationTitle(s,(f=s==null?void 0:s.note_path)!=null?f:null,e.doc_id),l=this.formatCitationLabel(o,n),c=this.normalizeChunkIdForNote(e.chunk_id,e.doc_id);if(this.settings.preferObsidianNoteForCitations&&(s!=null&&s.note_path)){if(r){let b=a||(e.page_end?String(e.page_end):"0"),k=this.buildNoteAnnotationLink(s.note_path,r,i||"",b,l);return k?`- ${k}`:`- ${this.buildNoteLink(s.note_path,l)}`}if(c&&!r)return`- ${this.buildNoteChunkLink(s.note_path,c,l)}`}if(i){let b=this.buildZoteroDeepLink(t,i,a,r);return`- [${l}](${b})`}return`- ${l}`}buildNoteChunkLink(e,t,n){let r=(0,h.normalizePath)(e).replace(/\.md$/i,""),i=this.escapeWikiLabel(n),a=`zrr-chunk:${t}`;return`[[${r}#${a}|${i}]]`}isChunkBlockIdLine(e){return/^\s*\^zrr-chunk-[A-Za-z0-9-]+\s*$/.test(e||"")}buildNoteLink(e,t){let n=(0,h.normalizePath)(e).replace(/\.md$/i,""),r=this.escapeWikiLabel(t);return`[[${n}|${r}]]`}buildNoteAnnotationLink(e,t,n,r,i){let a=this.buildAnnotationBlockId(t,n,r);if(!a)return null;let s=(0,h.normalizePath)(e).replace(/\.md$/i,""),o=this.escapeWikiLabel(i);return`[[${s}#^${a}|${o}]]`}buildAnnotationBlockId(e,t,n){let r=(e||"").trim().toUpperCase(),i=(t||"").trim().toUpperCase();if(!r||!i)return null;let a=(n||"").trim()||"0";return`${r}a${i}p${a}`}escapeWikiLabel(e){return e?e.replace(/\|/g," ").replace(/\[/g,"").replace(/\]/g,"").trim():""}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,h.normalizePath)(`${se}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var n;let e=this.app.vault.adapter,t=this.getDocIndexPath();if(!await e.exists(t))return{};try{let r=await e.read(t),i=JSON.parse(r);if(i&&typeof i=="object"){let a=(n=i.entries)!=null?n:i;if(Array.isArray(a)){let s={};for(let l of a)l!=null&&l.doc_id&&(s[String(l.doc_id)]=l);let o=!1;for(let l of Object.values(s))if(l&&typeof l.pdf_path=="string"){let c=this.normalizeDocIndexPdfPath(l.pdf_path);c!==l.pdf_path&&(l.pdf_path=c,o=!0)}return o&&await this.saveDocIndex(s),s}if(a&&typeof a=="object"){let s=a,o=!1;for(let l of Object.values(s))if(l&&typeof l.pdf_path=="string"){let c=this.normalizeDocIndexPdfPath(l.pdf_path);c!==l.pdf_path&&(l.pdf_path=c,o=!0)}return o&&await this.saveDocIndex(s),s}}}catch(r){console.error("Failed to read doc index",r)}return{}}async saveDocIndex(e){await this.ensureFolder(se);let t=this.app.vault.adapter,n=this.getDocIndexPath(),r={version:1,entries:e};await t.write(n,JSON.stringify(r,null,2)),this.docIndex=e}async pruneDocIndexOrphans(){var c;let e=this.app.vault.adapter,t=await this.getDocIndex(),n=new Set(await this.listDocIds(ce)),r=new Set(await this.listDocIds(te)),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),a=0,s=0,o=!1,l=new Date().toISOString();for(let d of Object.keys(t)){let p=t[d],_=!1,g=p!=null&&p.note_path?p.note_path.trim():"";if(g&&await e.exists(g))_=!0;else if((c=i[d])!=null&&c.note_path){_=!0;let b=i[d];b.note_path&&b.note_path!==p.note_path&&(p.note_path=b.note_path,s+=1,o=!0),b.note_title&&b.note_title!==p.note_title&&(p.note_title=b.note_title,s+=1,o=!0),s>0&&(p.updated_at=l)}let f=n.has(d)||r.has(d);!_&&!f&&(delete t[d],a+=1,o=!0)}return o&&await this.saveDocIndex(t),{removed:a,updated:s}}async updateDocIndex(e){var i;let t=await this.getDocIndex(),n=(i=t[e.doc_id])!=null?i:{doc_id:e.doc_id},r={...n,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&n.note_path&&(r.note_path=n.note_path),e.note_title===void 0&&n.note_title&&(r.note_title=n.note_title),e.zotero_title===void 0&&n.zotero_title&&(r.zotero_title=n.zotero_title),e.short_title===void 0&&n.short_title&&(r.short_title=n.short_title),e.pdf_path===void 0&&n.pdf_path&&(r.pdf_path=n.pdf_path),e.attachment_key===void 0&&n.attachment_key&&(r.attachment_key=n.attachment_key),typeof r.pdf_path=="string"&&(r.pdf_path=this.normalizeDocIndexPdfPath(r.pdf_path)),t[e.doc_id]=r,await this.saveDocIndex(t)}async removeDocIndexEntry(e){let t=await this.getDocIndex();if(!t[e]){await this.removeMetadataSnapshot(e);return}delete t[e],await this.saveDocIndex(t),await this.removeMetadataSnapshot(e)}async hydrateDocIndexFromCache(e){var s,o;if(!e)return null;let t=this.app.vault.adapter,n=await this.getDocIndexEntry(e),r={},i=(0,h.normalizePath)(`${ce}/${e}.json`);if(await t.exists(i))try{let l=await t.read(i),c=JSON.parse(l),d=(o=(s=c==null?void 0:c.data)!=null?s:c)!=null?o:{},p=typeof d.title=="string"?d.title:"";p&&(r.zotero_title=p);let _=Pe(d);if(_&&(r.short_title=_),!r.note_title||!r.note_path){let g=this.sanitizeFileName(p)||e,f=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${g}.md`),b=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${g}-${e}.md`),k="";await t.exists(f)?k=f:await t.exists(b)&&(k=b),k&&(r.note_path=k,r.note_title=E.default.basename(k,".md"))}}catch(l){console.error("Failed to read cached item JSON",l)}!r.note_title&&(n!=null&&n.note_path)&&(r.note_title=E.default.basename(n.note_path,".md"));let a=(0,h.normalizePath)(`${te}/${e}.json`);if(await t.exists(a))try{let l=await t.read(a),c=JSON.parse(l);typeof(c==null?void 0:c.source_pdf)=="string"&&(r.pdf_path=c.source_pdf)}catch(l){console.error("Failed to read cached chunks JSON",l)}return Object.keys(r).length>0&&await this.updateDocIndex({doc_id:e,...r}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var n;return e&&(n=(await this.getDocIndex())[e])!=null?n:null}async inferNotePathFromCache(e){var r,i;let t=this.app.vault.adapter,n=(0,h.normalizePath)(`${ce}/${e}.json`);if(!await t.exists(n))return"";try{let a=await t.read(n),s=JSON.parse(a),o=(i=(r=s==null?void 0:s.data)!=null?r:s)!=null?i:{},l=typeof o.title=="string"?o.title:"",c=this.sanitizeFileName(l)||e,d=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${c}.md`),p=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${c}-${e}.md`);if(await t.exists(d))return d;if(await t.exists(p))return p}catch(a){console.error("Failed to infer note path from cache",a)}return""}async rebuildNoteFromCacheForDocId(e,t){var O,q,j,V,z,Z;try{await this.ensureBundledTools()}catch(T){return t&&new h.Notice("Failed to sync bundled tools. See console for details."),console.error(T),!1}let n=this.app.vault.adapter,r=(0,h.normalizePath)(`${ce}/${e}.json`),i=(0,h.normalizePath)(`${te}/${e}.json`);if(!await n.exists(r)||!await n.exists(i))return t&&new h.Notice("Cached item or chunks JSON not found."),!1;this.showStatusProgress("Preparing...",5);let a;try{let T=await n.read(r);a=JSON.parse(T)}catch(T){return t&&new h.Notice("Failed to read cached item JSON."),console.error(T),this.clearStatusProgress(),!1}let s;try{let T=await n.read(i);s=JSON.parse(T)}catch(T){return t&&new h.Notice("Failed to read cached chunks JSON."),console.error(T),this.clearStatusProgress(),!1}let o=(O=a.data)!=null?O:a,l=typeof o.title=="string"?o.title:"",c=((j=(q=a.key)!=null?q:o.key)!=null?j:e).toString(),d=await this.getDocIndexEntry(e),p=typeof((V=this.asRecord(s==null?void 0:s.metadata))==null?void 0:V.attachment_key)=="string"?String((z=this.asRecord(s==null?void 0:s.metadata))==null?void 0:z.attachment_key):d==null?void 0:d.attachment_key,_=typeof s.source_pdf=="string"?s.source_pdf:"";if(!_||!await this.isFileAccessible(_)){let T=await this.recoverMissingPdfFromAttachment(_,o,c,e,p,l,t);if(!T)return t&&new h.Notice("Cached source PDF is missing and could not be recovered."),this.clearStatusProgress(),!1;_=T.sourcePdf,T.attachmentKey&&(p=T.attachmentKey),await this.updateChunkJsonSourcePdf(i,_)}let g=await this.resolveLanguageHint(o,c),f=this.buildDoclingLanguageHint(g!=null?g:void 0),b="";if(d!=null&&d.note_path&&await n.exists(d.note_path)&&(b=(0,h.normalizePath)(d.note_path)),!b){let T=this.sanitizeFileName(l)||e,G=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${T}.md`),$=await n.exists(G)?T:await this.resolveUniqueBaseName(T,e);b=(0,h.normalizePath)(`${this.settings.outputNoteDir}/${$}.md`)}try{if(await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let T=this.getLogFileRelativePath(),G=(0,h.normalizePath)(E.default.dirname(T));G&&await this.ensureFolder(G);let $=this.getSpellcheckerInfoRelativePath(),H=(0,h.normalizePath)(E.default.dirname($));H&&await this.ensureFolder(H)}}catch(T){return t&&new h.Notice("Failed to create notes folder."),console.error(T),this.clearStatusProgress(),!1}let k=this.getPluginDir(),m=E.default.join(k,"tools","docling_extract.py"),x=E.default.join(k,"tools","index_redisearch.py"),w=null,S=null,R=T=>{this.recreateMissingNotesActive&&(this.recreateMissingNotesProcess=T)};try{this.showStatusProgress(this.formatStatusLabel("Docling extraction...",w),0);let T=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;await this.runPythonStreaming(m,await this.buildDoclingArgs(_,e,i,b,f,!0),H=>this.handleDoclingProgress(H,w),()=>{},T,"docling_extract",R),this.recreateMissingNotesProcess=null,w=await this.readDoclingQualityLabel(i),p&&await this.annotateChunkJsonWithAttachmentKey(i,p);let G=await this.readDoclingMetadata(i),$=await this.maybeCreateOcrLayeredPdf(_,G,f);$&&(_=$,S=$,await this.updateChunkJsonSourcePdf(i,$))}catch(T){return this.recreateMissingNotesAbort?(this.recreateMissingNotesProcess=null,this.clearStatusProgress(),!1):(t&&new h.Notice("Docling extraction failed. See console for details."),console.error(T),this.clearStatusProgress(),!1)}let P=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;if(!await this.ensureRedisAvailable("rebuild"))t&&new h.Notice("Redis is unavailable; skipping indexing for this note.");else try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",w),0);let T=["--chunks-json",this.getAbsoluteVaultPath(i),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"];this.appendEmbedSubchunkArgs(T),this.appendEmbedContextArgs(T),this.settings.embedIncludeMetadata&&T.push("--embed-include-metadata"),this.appendChunkTaggingArgs(T,{allowRegenerate:!1}),await this.runPythonStreaming(x,T,G=>{let $=this.asRecord(G),H=typeof($==null?void 0:$.total)=="number"?$.total:0,F=typeof($==null?void 0:$.current)=="number"?$.current:0;if(($==null?void 0:$.type)==="progress"&&H>0){let M=Math.round(F/H*100),J=typeof $.message=="string"&&$.message.trim()?$.message:`Indexing chunks ${F}/${H}`,W=this.formatStatusLabel(J,w);this.showStatusProgress(W,M)}},()=>{},P,"index_redisearch",R),this.recreateMissingNotesProcess=null}catch(T){if(this.recreateMissingNotesAbort)return this.recreateMissingNotesProcess=null,this.clearStatusProgress(),!1;t&&new h.Notice("Redissearch indexing failed; note will still be rebuilt."),console.error(T)}let N=S?this.buildPdfLinkFromSourcePath(S):this.buildPdfLinkForNote(_,d==null?void 0:d.attachment_key,e);try{let T=await this.app.vault.adapter.read(b),G=await this.readChunkPayload(i),$=this.buildSyncedDoclingContent(e,G,T),H=await this.buildNoteMarkdown(o,(Z=a.meta)!=null?Z:{},e,N,p,b,r,$);await this.writeNoteWithSyncSuppressed(b,H);let F=this.app.vault.getAbstractFileByPath(b);F instanceof h.TFile&&this.scheduleNoteAnnotationSync(F,2e3,"save")}catch(T){return t&&new h.Notice("Failed to finalize note Markdown."),console.error(T),this.clearStatusProgress(),!1}try{let T=Pe(o);await this.updateDocIndex({doc_id:e,note_path:b,note_title:E.default.basename(b,".md"),zotero_title:l,short_title:T||void 0,pdf_path:_})}catch(T){console.error("Failed to update doc index",T)}return!0}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async fetchZoteroLibraryOptions(){let e=[{value:"0",label:"My Library (local)"}],t=await this.fetchZoteroGroupOptions();return t.length&&e.push(...t),e}async fetchEmbeddingModelOptions(){let e=(this.settings.embedModel||"").trim(),t=[],n=(this.settings.embedBaseUrl||"").trim().replace(/\/$/,"");if(!n)return e&&t.push({value:e,label:e}),t;let r=(this.settings.embedApiKey||"").trim(),i=await this.fetchModelIds(n,r);if(i.length){let a=i.filter(o=>/embed/i.test(o)),s=a.length?a:i;t.push(...s.map(o=>({value:o,label:o})))}return!t.length&&e&&t.push({value:e,label:e}),t.sort((a,s)=>a.label.localeCompare(s.label))}async fetchChatModelOptions(){return this.fetchLlmModelOptions(this.settings.chatBaseUrl,this.settings.chatApiKey,"chat")}async fetchCleanupModelOptions(){return this.fetchLlmModelOptions(this.settings.llmCleanupBaseUrl,this.settings.llmCleanupApiKey,"cleanup")}async fetchLlmModelOptions(e,t,n){let r=n==="cleanup"?(this.settings.llmCleanupModel||"").trim():(this.settings.chatModel||"").trim(),i=[],a=(e||"").trim().replace(/\/$/,"");if(!a)return r&&i.push({value:r,label:r}),i;let s=(t||"").trim(),o=await this.fetchModelIds(a,s);if(o.length){let l=o.filter(d=>!/embed/i.test(d)),c=l.length?l:o;i.push(...c.map(d=>({value:d,label:d})))}return!i.length&&r&&i.push({value:r,label:r}),i.sort((l,c)=>l.label.localeCompare(c.label))}detectEmbeddingProvider(e){let t=e.toLowerCase();return t.includes("anthropic")?"anthropic":t.includes("openrouter")?"openrouter":t.includes("ollama")||t.includes(":11434")?"ollama":t.includes("openai")?"openai":"generic"}async fetchModelIds(e,t){let n=this.detectEmbeddingProvider(e);try{if(n==="anthropic")return await this.fetchAnthropicModels(e,t);let r=await this.fetchOpenAiCompatibleModels(e,t);return!r.length&&n==="ollama"?await this.fetchOllamaModels(e):r}catch(r){return this.logOptionalLookupFailure("Failed to fetch models",r),[]}}async fetchOpenAiCompatibleModels(e,t){let n=`${e}/models`,r={};t&&(r.Authorization=`Bearer ${t}`);let i=await this.requestLocalApiRaw(n,{headers:r});if(i.statusCode>=400)throw new Error(`Model list request failed (${i.statusCode})`);let a=JSON.parse(i.body.toString("utf8"));return this.extractModelIds(a)}async fetchOllamaModels(e){let n=`${e.replace(/\/v1\/?$/,"")}/api/tags`,r=await this.requestLocalApiRaw(n);if(r.statusCode>=400)throw new Error(`Ollama tags request failed (${r.statusCode})`);let i;try{i=JSON.parse(r.body.toString("utf8"))}catch(s){return console.warn("Failed to parse Ollama tags response",s),[]}if(!i||typeof i!="object")return[];let a=i.models;return Array.isArray(a)?a.map(s=>this.extractModelId(s)).filter(s=>!!s):[]}async fetchAnthropicModels(e,t){if(!t)return[];let n=`${e}/models`,r={"x-api-key":t,"anthropic-version":"2023-06-01"},i=await this.requestLocalApiRaw(n,{headers:r});if(i.statusCode>=400)throw new Error(`Anthropic model list request failed (${i.statusCode})`);let a=JSON.parse(i.body.toString("utf8"));return this.extractModelIds(a)}extractModelIds(e){var r,i,a;if(Array.isArray(e))return e.map(s=>this.extractModelId(s)).filter(s=>!!s);if(!e||typeof e!="object")return[];let t=e,n=(a=(i=(r=t.data)!=null?r:t.models)!=null?i:t.model)!=null?a:t.items;return Array.isArray(n)?n.map(s=>this.extractModelId(s)).filter(s=>!!s):[]}asRecord(e){return!e||typeof e!="object"?null:e}extractModelId(e){var i,a,s;if(!e||typeof e!="object")return null;let t=e,n=(s=(a=(i=t.id)!=null?i:t.name)!=null?a:t.model)!=null?s:t.identifier;return typeof n!="string"?null:n.trim()||null}async fetchZoteroGroupOptions(){let e=new Map,t=r=>{for(let i of r)e.has(i.value)||e.set(i.value,i.label)};if(await this.warnIfZoteroLocalApiUnavailable("Zotero groups"))try{let r=this.buildZoteroUrl("/users/0/groups"),i=await this.requestLocalApi(r,`Zotero groups fetch failed for ${r}`);t(this.parseZoteroGroupOptions(i))}catch(r){console.warn("Failed to fetch Zotero groups from local API",r)}if(this.canUseWebApi()&&this.settings.webApiLibraryType==="user"){let r=(this.settings.webApiLibraryId||"").trim();if(r)try{let i=this.buildWebApiUrl(`/users/${r}/groups`),a=await this.requestWebApi(i,`Zotero Web API groups fetch failed for ${i}`);t(this.parseZoteroGroupOptions(a))}catch(i){this.logOptionalLookupFailure("Failed to fetch Zotero groups from Web API",i)}}return Array.from(e.entries()).map(([r,i])=>({value:r,label:i})).sort((r,i)=>r.label.localeCompare(i.label))}parseZoteroGroupOptions(e){var r,i,a,s,o;let t;try{t=JSON.parse(e.toString("utf8"))}catch(l){return console.warn("Failed to parse Zotero group payload",l),[]}if(!Array.isArray(t))return[];let n=[];for(let l of t){if(!l||typeof l!="object")continue;let c=(r=l.data)!=null?r:l,d=(a=(i=c.id)!=null?i:l.id)!=null?a:c.key;if(!d)continue;let p=typeof d=="string"||typeof d=="number"?String(d).trim():"";if(!p)continue;let _=(o=(s=c.name)!=null?s:l.name)!=null?o:p,g=(typeof _=="string"||typeof _=="number")&&String(_).trim()||p;n.push({value:`groups/${p}`,label:`Group: ${g}`})}return n}async ensureFolder(e){let t=this.app.vault.adapter,n=(0,h.normalizePath)(e).split("/").filter(Boolean),r="";for(let i of n)r=r?`${r}/${i}`:i,await t.exists(r)||await t.mkdir(r)}async buildNoteMarkdown(e,t,n,r,i,a,s,o){let l=`[[${s}]]`,c=this.settings.copyPdfToVault&&r.startsWith("[["),d=i?this.buildZoteroDeepLink(n,i):"",p=d||r,_=c?r:d||r,g=_?c?`PDF: !${_}`:`PDF: ${_}`:"",f=g?`${g}

`:"",b=await this.buildTemplateVars(e,t,n,p,l);b.pdf_block=f,b.pdf_line=g,b.docling_markdown=o;let k=(this.settings.noteBodyTemplate||"").trim();/{{\s*annotation_block\s*}}/i.test(k)&&i?b.annotation_block=await this.buildAnnotationBlockForAttachment(n,i,a):b.annotation_block="";let x=this.ensureDocIdInFrontmatter(await this.renderFrontmatter(e,t,n,p,l,b),n),w=x?`---
${x}
---

`:"",S=`${f}${o}`,R=k?this.renderTemplate(k,b,S,{appendDocling:!0}):S;return`${w}${R}`}async buildAnnotationBlockForAttachment(e,t,n){let r=await this.fetchZoteroAnnotationsForDoc(e,t);return r.attachmentKey&&r.attachmentKey!==t&&await this.updateDocIndex({doc_id:e,attachment_key:r.attachmentKey}),await this.attachAnnotationImages(e,r.attachmentKey,r.annotations,n),this.buildAnnotationBlock(e,r.attachmentKey,r.annotations)}buildAnnotationBlock(e,t,n){var p;let r=`<!-- zrr:annotations-start doc_id=${e} attachment_key=${t} -->`,i="<!-- zrr:annotations-end -->";if(!n.length)return`${r}
${i}`;let a=this.getAnnotationColorMap(),s=Object.keys(a),o=new Map;for(let _ of n){let g=_.colorKey||this.normalizeAnnotationColorKey(_.colorKey),f=(p=o.get(g))!=null?p:[];f.push(_),o.set(g,f)}let l=[r],c=new Set,d=[...s,...Array.from(o.keys()).filter(_=>!s.includes(_))];for(let _ of d){let g=o.get(_);if(!g||!g.length)continue;c.add(_);let{heading:f}=this.resolveAnnotationColorMeta(_);l.push("",`## ${f}`),g.sort((b,k)=>{var A,N;let m=(b.sortToken||"").trim(),x=(k.sortToken||"").trim();if(m&&x&&m!==x)return m.localeCompare(x,void 0,{numeric:!0,sensitivity:"base"});if(m&&!x)return-1;if(!m&&x)return 1;let w=Number.isFinite(b.sortIndex),S=Number.isFinite(k.sortIndex);if(w&&S&&b.sortIndex!==k.sortIndex)return b.sortIndex-k.sortIndex;let R=(A=b.pageIndex)!=null?A:0,P=(N=k.pageIndex)!=null?N:0;return R!==P?R-P:b.key.localeCompare(k.key)});for(let b of g)l.push(...this.formatAnnotationCallout(b,t,e))}return l.push("",i),l.join(`
`).trim()}formatAnnotationCallout(e,t,n){let r=this.settings.annotationPageLabel||"Page",i=e.pageLabel||(e.pageIndex?String(e.pageIndex):"?"),a=e.pageIndex?String(e.pageIndex):"",s=this.buildZoteroDeepLink(n,t,a,e.key),l=[`> [!${e.callout}] ${r} [${i}](${s})`];e.imagePath&&l.push(`> ![[${e.imagePath}]]`);let c=p=>{if(p)for(let _ of p.split(/\r?\n/))l.push(_.trim()?`> ${_}`:">")};c(e.text),e.comment&&(l.push(">","> ---"),c(e.comment)),e.tags.length&&l.push(`> **Tags:** ${e.tags.map(p=>`#${p}`).join(" ")}`);let d=e.pageIndex?String(e.pageIndex):"0";return l.push(`> ^${e.key}a${t}p${d}`),l.push(""),l}findAnnotationBlockRange(e){let t=ir.exec(e);if(!t)return null;let n=e.slice(t.index+t[0].length),r=ar.exec(n);if(!r)return null;let i=t.index,a=t.index+t[0].length+r.index+r[0].length,s=n.slice(0,r.index);return{start:i,end:a,block:s,startMarker:t[0]}}parseAnnotationBlockMarker(e){let t=e.match(/doc_id=(["']?)([^"'\s]+)\1/i),n=e.match(/attachment_key=(["']?)([^"'\s]+)\1/i);return{docId:t?t[2].trim():void 0,attachmentKey:n?n[2].trim():void 0}}parseAnnotationBlock(e,t){let n=e.split(/\r?\n/),r=[],i=0;for(;i<n.length;){if(!n[i].trim().startsWith("> [!")){i+=1;continue}let s=[];for(;i<n.length&&n[i].trim().startsWith(">");)s.push(n[i]),i+=1;let o=this.parseAnnotationCallout(s,t);o&&r.push(o)}return r}parseAnnotationImageLine(e){var o,l;let t=e.trim();if(!t)return null;let n="",r=t.match(/!\[\[([^\]]+)\]\]/);r&&(n=r[1].trim());let i=n?null:t.match(/!\[[^\]]*\]\(([^)]+)\)/);i&&(n=i[1].trim());let a=n?null:t.match(/<img[^>]+src=["']([^"']+)["']/i);if(a&&(n=a[1].trim()),!n)return null;let s=(l=(o=n.split("|")[0])==null?void 0:o.trim())!=null?l:"";return s?{path:s,hash:this.extractAnnotationImageHashFromPath(s)}:null}parseAnnotationCallout(e,t){if(!e.length)return null;let n=e[0].replace(/^>\s?/,"").trim(),r=n.match(/\[!([^\]]+)\]/),i=r?r[1].trim():"note",a=n.match(/\((zotero:\/\/open-pdf\/library\/items\/[^)]+)\)/i),s="",o=t,l="",c=null;if(a){let x=a[1],w=x.match(/items\/([A-Z0-9]{8})/i);w&&(o=w[1]);let S=x.match(/annotation=([A-Z0-9]{8})/i);S&&(s=S[1]);let R=x.match(/page=(\d+)/i);R&&(c=Number(R[1]));let P=n.match(/\[([^\]]+)\]\(zotero:\/\//i);P&&(l=P[1].trim())}let d=[],p=[],_=[],g=!1,f="",b="";for(let x=1;x<e.length;x+=1){let w=e[x].replace(/^>\s?/,""),S=w.trim();if(!S){g?_.push(""):p.push("");continue}let R=this.parseAnnotationImageLine(S);if(R){f=R.path,b=R.hash;continue}if(S.startsWith("^")){let P=S.match(/^\^([A-Z0-9]{8})a([A-Z0-9]{8})p(\d+)/i);P&&(s=P[1],o=P[2],c=Number(P[3]));continue}if(/^(\*\*tags:\*\*|tags:)/i.test(S)){d.push(S);continue}if(S==="---"){g=!0;continue}g?_.push(w):p.push(w)}let k=d.join(" "),m=k?k.replace(/\*\*tags:\*\*/i,"").replace(/tags:/i,"").split(/[\s,]+/).map(x=>x.trim().replace(/^#+/,"")).filter(Boolean):[];return s?{key:s,attachmentKey:o,pageLabel:l,pageIndex:c,callout:i,text:this.normalizeAnnotationText(p.join(`
`)),comment:this.normalizeAnnotationText(_.join(`
`)),tags:this.normalizeAnnotationTags(m),imagePath:f||void 0,imageHash:b||void 0}:null}replaceAnnotationBlock(e,t){let n=this.findAnnotationBlockRange(e);if(!n)return null;let r=e.slice(0,n.start),i=e.slice(n.end),a=t.trim()?`${t.trim()}
`:`${t}`;return`${r}${a}${i}`.replace(/\n{4,}/g,`


`)}async renderFrontmatter(e,t,n,r,i,a){var d;let s=(d=this.settings.frontmatterTemplate)!=null?d:"";if(!s.trim())return"";let o=a!=null?a:await this.buildTemplateVars(e,t,n,r,i),l=this.renderTemplate(s,o,"",{appendDocling:!1}).trim(),c=this.stripEmptyFrontmatterFields(l);return this.normalizeFrontmatterKeySpacing(c)}stripEmptyFrontmatterFields(e){if(!e.trim())return"";let t=e.split(/\r?\n/),n=[],r=/^([A-Za-z0-9][A-Za-z0-9 _-]*)\s*:\s*(.*)$/,i=/^[ \t]+-\s*(.*)$/,a=new Set(["abstract"]),s=l=>l===""||l==='""'||l==="''",o=0;for(;o<t.length;){let l=t[o],c=l.match(r);if(!c){n.push(l),o+=1;continue}let d=c[1].trim(),p=c[2].trim();if(a.has(d)){n.push(l),o+=1;continue}if(!s(p)){n.push(l),o+=1;continue}let _=o+1,g=[];for(;_<t.length&&t[_].match(i);)g.push(t[_]),_+=1;if(g.length===0){for(o=_;o<t.length&&t[o].trim()==="";)o+=1;continue}let f=g.filter(b=>{let k=b.match(i);if(!k)return!1;let m=k[1].trim();return!s(m)});if(f.length>0&&n.push(l,...f),o=_,f.length===0)for(;o<t.length&&t[o].trim()==="";)o+=1}for(;n.length>0&&n[n.length-1].trim()==="";)n.pop();return n.join(`
`).trim()}renderTemplate(e,t,n,r={}){let i=e.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(a,s)=>{var o;return(o=t[s])!=null?o:""});return r.appendDocling&&!e.includes("{{docling_markdown}}")&&t.docling_markdown&&(i=`${i}

${t.docling_markdown}`),i.trim()?i:n}async buildTemplateVars(e,t,n,r,i){let a=U(e.title),s=U(e.shortTitle),o=U(e.date),l=typeof(t==null?void 0:t.parsedDate)=="string"?t.parsedDate:"",c=Ye(l||o),d=/^\d{4}$/.test(c)?c:"",p=Array.isArray(e.creators)?e.creators:[],_=p.filter(ee=>ee.creatorType==="author").map(ee=>ve(ee)),g=_.join("; "),f=p.filter(ee=>ee.creatorType==="editor"||ee.creatorType==="seriesEditor").map(ee=>ve(ee)),b=f.join("; "),k=Array.isArray(e.tags)?e.tags.map(ee=>{var ge;return typeof ee=="string"?ee:(ge=this.asRecord(ee))==null?void 0:ge.tag}).filter(ee=>typeof ee=="string"&&ee.length>0):[],m=this.sanitizeObsidianTags(k),x=m.join("; "),w=await this.resolveCollectionTitles(e),S=w.join("; "),R=this.toObsidianLinks(w),P=R.join("; "),A=U(e.itemType),N=typeof(t==null?void 0:t.creatorSummary)=="string"?t.creatorSummary:"",O=U(e.publicationTitle),q=U(e.bookTitle),j=U(e.journalAbbreviation),V=U(e.volume),z=U(e.issue),Z=U(e.pages),T=U(e.dateAdded),G=U(e.dateModified),$=typeof e.key=="string"?e.key:n,H=U(e.DOI);H||(H=Qt(e));let F=Ie(e,t),M=null;(!H||!s||!F)&&(M=await this.fetchZoteroItemCsl($)),H||(H=Yt(M)),s||(s=Xt(M)),F||(F=xt(M));let J=U(e.ISBN),W=U(e.ISSN),I=U(e.publisher),B=U(e.place),K=U(e.url),ie=U(e.language),ue=U(e.abstractNote),fe=this.buildZoteroDeepLink($),oe=Array.from(new Set([F,s,H].map(ee=>String(ee||"").trim()).filter(ee=>ee.length>0))),Ne=oe.join("; "),Q={doc_id:n,zotero_key:typeof e.key=="string"?e.key:n,item_link:fe,citekey:F,title:a,short_title:s,date:o,year:c,year_number:d,authors:g,editors:b,aliases:Ne,tags:x,collection_title:S,collection_titles:S,collections_links:P,item_type:A,creator_summary:N,publication_title:O,book_title:q,journal_abbrev:j,volume:V,issue:z,pages:Z,date_added:T,date_modified:G,doi:H,isbn:J,issn:W,publisher:I,place:B,url:K,language:ie,abstract:ue,pdf_link:r,item_json:i};for(let[ee,ge]of Object.entries(Q)){let le=this.escapeYamlString(ge);Q[`${ee}_yaml`]=le,Q[`${ee}_quoted`]=le,Q[`${ee}_text`]=le}return Q.authors_yaml_list=this.toYamlList(_),Q.editors_yaml_list=this.toYamlList(f),Q.tags_yaml_list=m.length>0?this.toYamlList(m):"",Q.aliases_yaml_list=oe.length>0?this.toYamlList(oe):"",Q.collections_yaml_list=this.toYamlList(w),Q.collections_links_yaml_list=this.toYamlList(R),Q.tags_raw=k.join("; "),Q.tags_raw_yaml=this.escapeYamlString(Q.tags_raw),Q.tags_raw_yaml_list=k.length>0?this.toYamlList(k):"",Q.authors_list=Q.authors_yaml_list,Q.editors_list=Q.editors_yaml_list,Q.tags_list=Q.tags_yaml_list,Q.aliases_list=Q.aliases_yaml_list,Q.collections_list=Q.collections_yaml_list,Q.collections_links_list=Q.collections_links_yaml_list,Q}escapeYamlString(e){return`"${String(e).replace(/\r\n/g,`
`).replace(/\r/g,`
`).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n")}"`}toYamlList(e){return e.length?e.map(t=>`  - ${this.escapeYamlString(t)}`).join(`
`):'  - ""'}sanitizeObsidianTags(e){let t=this.settings.tagSanitizeMode||"kebab",n=t==="replace"?"kebab":t;return e.map(r=>this.sanitizeObsidianTag(r,n)).filter(r=>r.length>0)}sanitizeObsidianTag(e,t){let n=String(e||"").trim();if(!n)return"";let r=n.replace(/^#+/,"");if(t==="none")return r;let i=o=>!/^\d+$/.test(o),s=(o=>r.split("/").map(d=>{let _=d.replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).filter(Boolean);if(!_.length)return"";if(o==="camel"||o==="pascal"){let[f,...b]=_;return[o==="pascal"?f.charAt(0).toUpperCase()+f.slice(1):f.charAt(0).toLowerCase()+f.slice(1),...b.map(m=>m.charAt(0).toUpperCase()+m.slice(1))].join("")}let g=o==="snake"?"_":"-";return _.join(g)}).filter(Boolean).join("/").replace(/\/{2,}/g,"/").replace(/^\/+|\/+$/g,""))(t);return s&&i(s)?s:""}normalizeZoteroTags(e){let t=new Map;for(let n of e){let r=this.normalizeZoteroTag(n);if(!r)continue;let i=r.toLowerCase();t.has(i)||t.set(i,r)}return Array.from(t.values())}normalizeZoteroTag(e){let t=String(e||"").trim();if(!t)return"";let n=t.replace(/^#+/,"").trim();if(!n)return"";let r=n.split("/").map(i=>{let a=i.trim();return a?(a=a.replace(/[_-]+/g," "),a=a.replace(/([A-Z]+)([A-Z][a-z])/g,"$1 $2"),a=a.replace(/([a-z\\d])([A-Z])/g,"$1 $2"),a=a.replace(/([a-zA-Z])(\\d)/g,"$1 $2"),a=a.replace(/(\\d)([a-zA-Z])/g,"$1 $2"),a=a.replace(/\s+/g," ").trim(),a):""}).filter(Boolean);return r.length?r.join("/"):""}toObsidianLinks(e){return e.map(t=>String(t||"").trim()).filter(t=>t.length>0).map(t=>t.startsWith("[[")&&t.endsWith("]]")?t:`[[${t}]]`)}getVaultBasePath(){var r;let e=this.app.vault.adapter;if(e instanceof h.FileSystemAdapter)return e.getBasePath();let t=e,n=(r=t.getBasePath)==null?void 0:r.call(t);if(n)return n;throw new Error("Vault base path is unavailable.")}expandPathValue(e){let t=(e||"").trim();if(!t)return t;let n=t;return n==="~"?n=$e.default.homedir():(n.startsWith("~/")||n.startsWith("~\\"))&&(n=E.default.join($e.default.homedir(),n.slice(2))),n}resolvePythonPath(){return this.resolveUserPath(this.settings.pythonPath||"")}getPythonRuntimeMode(){return this.settings.pythonRuntime==="local"?"local":"worker"}usePythonWorker(){return this.getPythonRuntimeMode()==="worker"}getPythonWorkerCacheDir(){return E.default.join(this.getVaultBasePath(),se,"python-worker-cache")}getPythonWorkerApiPort(e){let n=(Number.isFinite(e!=null?e:NaN)?Number(e):this.getRedisPortFromUrl())+Hn;return n>=1024&&n<=65535?n:Wn}getPythonWorkerApiBaseUrl(e){let t=Number.isFinite(e!=null?e:NaN)?Number(e):this.getPythonWorkerApiPort();return`http://${Gn}:${t}`}getPythonWorkerApiPortFromContext(e){let t=Number.parseInt(String(e.composeEnv.ZRR_WORKER_PORT||""),10);return Number.isFinite(t)&&t>0?t:this.getPythonWorkerApiPort()}nextPythonWorkerRequestId(e){this.pythonWorkerRequestSeq+=1;let t=e.replace(/[^a-zA-Z0-9_.-]/g,"_");return`${Date.now().toString(36)}-${this.pythonWorkerRequestSeq.toString(36)}-${t}`}logPythonWorkerTiming(e,t){console.debug("[zrr-python-worker]",e,t)}async isPythonWorkerApiHealthy(e,t=1500){let n=`${this.getPythonWorkerApiBaseUrl(this.getPythonWorkerApiPortFromContext(e))}/health`;try{let r=await this.requestLocalApiRaw(n,{headers:{Accept:"application/json"},timeoutMs:t});if(r.statusCode<200||r.statusCode>=300)return!1;let i=JSON.parse(r.body.toString("utf8"));return!!(i!=null&&i.ok)}catch(r){return!1}}getWorkerToolName(e){let t=E.default.resolve(this.getPluginDir(),"tools"),n=E.default.resolve(e);if(E.default.dirname(n)!==t)return null;let r=E.default.basename(n);return!r.endsWith(".py")||r.includes(E.default.sep)?null:r}getComposeServiceNamesForCurrentRuntime(){return this.usePythonWorker()?[he,ut]:[he]}toContainerPath(e,t,n){let r=E.default.relative(e,t);if(r.startsWith("..")||E.default.isAbsolute(r))return null;let i=r.split(E.default.sep).filter(Boolean);return i.length?E.default.posix.join(n,...i):n}mapPathForPythonWorker(e){var i,a;if(!E.default.isAbsolute(e))return e;let t=E.default.normalize(e),n=E.default.normalize(this.getPluginDir()),r=E.default.normalize(this.getVaultBasePath());return(a=(i=this.toContainerPath(n,t,Zn))!=null?i:this.toContainerPath(r,t,un))!=null?a:e}getWorkerHostAlias(){return(this.settings.dockerPath||"").toLowerCase().includes("podman")?"host.containers.internal":"host.docker.internal"}mapUrlForPythonWorker(e){let t=(e||"").trim();if(!t)return e;let n;try{n=new URL(t)}catch(r){return e}return!["http:","https:","redis:","rediss:","redis+tls:"].includes(n.protocol)||!this.isLocalRedisHost(n.hostname||"")?e:n.protocol==="redis:"||n.protocol==="rediss:"||n.protocol==="redis+tls:"?(n.hostname=he,n.port="6379",n.toString()):(n.hostname=this.getWorkerHostAlias(),n.toString())}mapPythonArgsForWorker(e){return e.map((t,n)=>{if(n>0&&e[n-1]==="--redis-url")return this.mapUrlForPythonWorker(t);if(t.startsWith("--redis-url=")){let a=t.slice(12);return`--redis-url=${this.mapUrlForPythonWorker(a)}`}let r=this.mapUrlForPythonWorker(t);if(r!==t)return r;if(!E.default.isAbsolute(t))return t;let i=this.mapPathForPythonWorker(t);if(i===t)throw new Error(`Python worker cannot access path '${t}'. Keep files under your vault or plugin directory.`);return i})}resolveUserPath(e,t){let n=this.expandPathValue(e);return!n||!(n.includes("/")||n.includes("\\"))||E.default.isAbsolute(n)?n:t&&(n.startsWith("./")||n.startsWith(".\\"))?E.default.join(t,n.slice(2)):E.default.join($e.default.homedir(),n)}getPluginDir(){var r;let e=this.getVaultBasePath(),t=(r=this.manifest.dir)!=null?r:this.manifest.id;if(!t)throw new Error("Plugin directory is unavailable.");let n=E.default.isAbsolute(t)?t:E.default.join(e,t);return E.default.normalize(n)}async ensureBundledTools(){let e=this.getPluginDir(),t=E.default.join(e,"tools");await ne.promises.mkdir(t,{recursive:!0});for(let[n,r]of Object.entries(sn)){let i=E.default.join(t,n),a=!0;try{await ne.promises.readFile(i,"utf8")===r&&(a=!1)}catch(s){}a&&await ne.promises.writeFile(i,r,"utf8")}}async migrateCachePaths(){let e="zotero/items",t="zotero/chunks",n=ce,r=te,i=this.app.vault.adapter,a=(0,h.normalizePath)(e),s=(0,h.normalizePath)(t),o=(0,h.normalizePath)(n),l=(0,h.normalizePath)(r),c=o.split("/").slice(0,-1).join("/"),d=l.split("/").slice(0,-1).join("/");c&&await this.ensureFolder(c),d&&await this.ensureFolder(d);let p=await i.exists(a),_=await i.exists(s),g=await i.exists(o),f=await i.exists(l);p&&!g&&await i.rename(a,o),_&&!f&&await i.rename(s,l)}getAbsoluteVaultPath(e){let t=this.getVaultBasePath(),n=E.default.isAbsolute(e)?e:E.default.join(t,e);return E.default.normalize(n)}async resolveAttachmentOutputDir(e){let t=e?E.default.isAbsolute(e)?this.toVaultRelativePath(e):(0,h.normalizePath)(e):"";if(!t)return null;let n=this.app.fileManager;if(!(n!=null&&n.getAvailablePathForAttachment))return null;try{let r=`zrr-image-${Date.now()}.png`,i=await n.getAvailablePathForAttachment(r,t);if(!i)return null;let a=E.default.isAbsolute(i)?i:this.getAbsoluteVaultPath(i),s=E.default.normalize(E.default.dirname(a)),o=E.default.normalize(this.getVaultBasePath()),l=this.toVaultRelativePath(s);return!l&&s!==o?null:{absolute:s,relative:l}}catch(r){return console.warn("Failed to resolve attachment output dir",r),null}}async resolveAnnotationImageOutputDir(e){let t=null;if(e&&(t=await this.resolveAttachmentOutputDir(e)),!t){let i=(0,h.normalizePath)(this.settings.outputNoteDir||"");if(!i)return null;t={absolute:this.getAbsoluteVaultPath(i),relative:i}}let n=(0,h.normalizePath)(E.default.join(t.relative||"","zrr-annotations")),r=E.default.normalize(E.default.join(t.absolute,"zrr-annotations"));return n&&await this.ensureFolder(n),{absolute:r,relative:n}}async buildDoclingArgs(e,t,n,r,i,a=!1){let s=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,o=["--pdf",e,"--doc-id",t,"--out-json",this.getAbsoluteVaultPath(n),"--out-md",this.getAbsoluteVaultPath(r),"--chunking",this.settings.chunkingMode,"--ocr",s];a&&o.push("--progress"),this.settings.ocrMode==="force_low_quality"&&o.push("--force-ocr-low-quality"),this.settings.forcePerPageOcr&&o.push("--force-per-page-ocr"),o.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),i&&o.push("--language-hint",i),this.settings.enableLlmCleanup?(o.push("--enable-llm-cleanup"),this.settings.llmCleanupBaseUrl&&o.push("--llm-cleanup-base-url",this.settings.llmCleanupBaseUrl),this.settings.llmCleanupApiKey&&o.push("--llm-cleanup-api-key",this.settings.llmCleanupApiKey),this.settings.llmCleanupModel&&o.push("--llm-cleanup-model",this.settings.llmCleanupModel),o.push("--llm-cleanup-temperature",String(this.settings.llmCleanupTemperature)),o.push("--llm-cleanup-min-quality",String(this.settings.llmCleanupMinQuality)),o.push("--llm-cleanup-max-chars",String(this.settings.llmCleanupMaxChars))):o.push("--no-llm-cleanup");let l=this.getPluginDir(),c=E.default.join(l,"tools","ocr_wordlist.txt");if((0,ne.existsSync)(c)&&o.push("--enable-dictionary-correction","--dictionary-path",c),this.settings.enableFileLogging){let p=this.getLogFileAbsolutePath();p&&o.push("--log-file",p);let _=this.getAbsoluteVaultPath(this.getSpellcheckerInfoRelativePath());_&&o.push("--spellchecker-info-out",_)}let d=await this.resolveAttachmentOutputDir(r);return d&&(d.relative&&await this.ensureFolder(d.relative),o.push("--image-output-dir",d.absolute)),this.appendOcrEngineArgs(o),o}appendOcrEngineArgs(e){let t=this.settings.ocrEngine,n=(this.settings.paddleApiKey||"").trim(),r=(this.settings.paddleVlApiUrl||"").trim(),i=(this.settings.paddleStructureApiUrl||"").trim(),a=o=>{e.push("--prefer-ocr-engine",o,"--fallback-ocr-engine",o)},s=()=>{e.push("--no-paddle-vl-api","--no-paddle-structure-api")};switch(t){case"tesseract":a("tesseract"),e.push("--no-paddle-vl","--no-paddle-structure-v3"),s();break;case"paddle_structure_local":a("paddle"),e.push("--paddle-structure-v3","--no-paddle-vl"),s();break;case"paddle_vl_local":a("paddle"),e.push("--paddle-vl","--no-paddle-structure-v3"),s();break;case"paddle_structure_api":a("paddle"),e.push("--paddle-structure-v3","--no-paddle-vl","--no-paddle-vl-api"),n?(e.push("--paddle-structure-api","--paddle-structure-api-token",n),i&&e.push("--paddle-structure-api-url",i)):e.push("--no-paddle-structure-api");break;case"paddle_vl_api":a("paddle"),e.push("--paddle-vl","--no-paddle-structure-v3","--no-paddle-structure-api"),n?(e.push("--paddle-vl-api","--paddle-vl-api-token",n),r&&e.push("--paddle-vl-api-url",r)):e.push("--no-paddle-vl-api");break;default:s();break}}appendEmbedSubchunkArgs(e){let t=this.settings.embedSubchunkChars;Number.isFinite(t)&&e.push("--embed-subchunk-chars",String(Math.max(0,Math.trunc(t))));let n=this.settings.embedSubchunkOverlap;Number.isFinite(n)&&e.push("--embed-subchunk-overlap",String(Math.max(0,Math.trunc(n))))}appendEmbedContextArgs(e){let t=this.settings.embedContextWindow;Number.isFinite(t)&&e.push("--embed-context-window",String(Math.max(0,Math.trunc(t))));let n=this.settings.embedContextChars;Number.isFinite(n)&&e.push("--embed-context-chars",String(Math.max(0,Math.trunc(n))))}appendChunkTaggingArgs(e,t){if((t==null?void 0:t.allowRegenerate)===!1||!this.settings.enableChunkTagging)return;let n=(this.settings.llmCleanupBaseUrl||"").trim(),r=(this.settings.llmCleanupModel||"").trim();if(!n||!r)return;e.push("--generate-chunk-tags","--tag-base-url",n,"--tag-model",r);let i=(this.settings.llmCleanupApiKey||"").trim();i&&e.push("--tag-api-key",i),e.push("--tag-temperature",String(this.settings.llmCleanupTemperature))}getRedisDataDir(){let e=this.resolveUserPath(this.settings.redisDataDirOverride||"",this.getVaultBasePath());return!this.settings.autoAssignRedisPort&&e?e:E.default.join(this.getVaultBasePath(),se,"redis-data")}getDockerComposePath(){let e=this.getPluginDir();return E.default.join(e,"tools","docker-compose.yml")}prependBinaryDirToPath(e,t){if(!t||!E.default.isAbsolute(t))return;let n=E.default.dirname(t),r=e.PATH||"";(r?r.split(E.default.delimiter):[]).includes(n)||(e.PATH=r?`${n}${E.default.delimiter}${r}`:n)}getDefaultChildPath(){return process.platform==="win32"?["C:\\Windows\\System32","C:\\Windows","C:\\Windows\\System32\\WindowsPowerShell\\v1.0"].join(E.default.delimiter):["/opt/homebrew/bin","/usr/local/bin","/usr/bin","/bin","/usr/sbin","/sbin"].join(E.default.delimiter)}buildChildEnv(){return{PATH:this.getDefaultChildPath()}}async resolveDockerPath(){var c;let e=(c=this.settings.dockerPath)==null?void 0:c.trim(),t=e?this.resolveUserPath(e):"",n=["/opt/homebrew/bin/docker","/usr/local/bin/docker","/usr/bin/docker","/Applications/Docker.app/Contents/Resources/bin/docker"],r=["/opt/homebrew/bin/podman","/usr/local/bin/podman","/usr/bin/podman"],i=["/opt/homebrew/bin/podman-compose","/usr/local/bin/podman-compose","/usr/bin/podman-compose"],a=[];t&&a.push(t);let s=t?this.getContainerCliKind(t):"docker",o=s==="podman-compose"?[i,r,n]:s==="podman"?[r,i,n]:[n,r,i];if(!t||t==="docker"||t==="podman"||t==="podman-compose")for(let d of o)a.push(...d);for(let d of a)if(E.default.isAbsolute(d))try{if(await this.isContainerCliAvailable(d))return d}catch(p){}let l=[t,s==="podman"?"podman":"docker",s==="podman"?"docker":"podman","podman-compose"].filter(d=>!!(d&&d.trim()));for(let d of l)if(await this.isContainerCliAvailable(d))return d;return t||"docker"}async isContainerCliAvailable(e){return new Promise(t=>{let n=(0,de.spawn)(e,["--version"]);n.on("error",()=>t(!1)),n.on("close",r=>t(r===0))})}getContainerCliKind(e){let t=E.default.basename(e);return t==="podman-compose"?"podman-compose":t.includes("podman")?"podman":"docker"}async isContainerDaemonRunning(e){let t=this.getContainerCliKind(e),n=e,r=["info"];if(t==="podman-compose"){let i=await this.resolvePodmanBin();if(!i)return!1;n=i}return new Promise(i=>{let a=(0,de.spawn)(n,r),s=!1,o=c=>{s||(s=!0,i(c))},l=activeWindow.setTimeout(()=>{a.kill(),o(!1)},2e3);a.on("error",()=>{activeWindow.clearTimeout(l),o(!1)}),a.on("close",c=>{activeWindow.clearTimeout(l),o(c===0)})})}getContainerDaemonHint(e){let t=this.getContainerCliKind(e);return t==="podman"||t==="podman-compose"?"Podman machine not running. Run `podman machine start`.":"Docker Desktop is not running. Start Docker Desktop."}async supportsComposeSubcommand(e){return new Promise(t=>{let n=(0,de.spawn)(e,["compose","version"]);n.on("error",()=>t(!1)),n.on("close",r=>t(r===0))})}async findPodmanComposePath(){let e=["/opt/homebrew/bin/podman-compose","/usr/local/bin/podman-compose","/usr/bin/podman-compose"];for(let t of e)try{return await ne.promises.access(t),t}catch(n){}return await this.isContainerCliAvailable("podman-compose")?"podman-compose":null}async resolvePodmanBin(){let e=["/opt/homebrew/bin/podman","/usr/local/bin/podman","/usr/bin/podman"];for(let t of e)if(await this.isContainerCliAvailable(t))return t;return await this.isContainerCliAvailable("podman")?"podman":null}async resolveComposeCommand(e){let t=E.default.basename(e);if(t==="podman-compose")return{command:e,argsPrefix:[]};if(t==="podman"){let n=await this.findPodmanComposePath();return n?{command:n,argsPrefix:[]}:await this.supportsComposeSubcommand(e)?{command:e,argsPrefix:["compose"]}:null}return await this.supportsComposeSubcommand(e)?{command:e,argsPrefix:["compose"]}:null}async buildComposeEnvironment(e,t,n){var s;let r=this.buildChildEnv();if(this.prependBinaryDirToPath(r,e),this.prependBinaryDirToPath(r,t.command),E.default.basename(t.command)==="podman-compose"){let o=await this.resolvePodmanBin();o&&(r.PODMAN_BIN=o,this.prependBinaryDirToPath(r,o))}let i=(n==null?void 0:n.dataDir)||this.getRedisDataDir(),a=(s=n==null?void 0:n.redisPort)!=null?s:this.getRedisPortFromUrl();return r.ZRR_DATA_DIR=this.toComposePath(i),this.applyComposePortEnvironment(r,a),r.ZRR_VAULT_DIR=this.toComposePath(this.getVaultBasePath()),r.ZRR_PLUGIN_DIR=this.toComposePath(this.getPluginDir()),r.ZRR_WORKER_CACHE_DIR=this.toComposePath(this.getPythonWorkerCacheDir()),r}toComposePath(e){return process.platform!=="win32"?e:e.replace(/\\/g,"/")}async resolveComposeProjectContext(e){await this.ensureBundledTools();let t=this.getDockerComposePath(),n=await this.resolveDockerPath();if(!await this.isContainerCliAvailable(n))throw new Error('Docker or Podman not found. Install Docker Desktop or Podman and set "Docker/Podman path" in settings.');if(!await this.isContainerDaemonRunning(n))throw new Error(this.getContainerDaemonHint(n));let r=await this.resolveComposeCommand(n);if(!r)throw new Error("Compose support not found. Install Docker Desktop or Podman with podman-compose.");let i=await this.buildComposeEnvironment(n,r,e);return{composePath:t,composeCommand:r,composeEnv:i,project:this.getDockerProjectName()}}async maybeShowFirstContainerStartupNotice(e){if(!(e||this.settings.firstContainerStartupNoticeShown)){this.settings.firstContainerStartupNoticeShown=!0;try{await this.saveSettings()}catch(t){console.warn("Failed to persist first container startup notice flag",t)}new h.Notice("First container startup can take several minutes (sometimes 10+ minutes) while images are pulled and worker dependencies are built.",16e3)}}async autoDetectContainerCliOnLoad(){var o;let e=await this.resolveDockerPath();if(!await this.isContainerCliAvailable(e)){this.notifyContainerOnce("Docker or Podman not found. Install Docker Desktop or Podman and set Docker/Podman path in settings.");return}let t=((o=this.settings.dockerPath)==null?void 0:o.trim())||"docker",n=this.expandPathValue(t);!await this.isContainerCliAvailable(n)&&!(t==="docker"||t==="podman"||t==="podman-compose")&&e&&e!==t&&(this.settings.dockerPath=e,await this.saveSettings());let s=l=>new Promise(c=>activeWindow.setTimeout(c,l));if(!await this.isContainerDaemonRunning(e)){for(let l of[5e3,1e4])if(await s(l),await this.isContainerDaemonRunning(e))return;this.notifyContainerOnce(this.getContainerDaemonHint(e))}}getDockerProjectName(){let e=a=>a.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,32),t=(this.settings.redisProjectName||"").trim();if(t&&!this.settings.autoAssignRedisPort)return e(t)||"zrr";let n=this.getVaultBasePath(),r=E.default.basename(n).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,18),i=(0,Ue.createHash)("sha1").update(n).digest("hex").slice(0,8);return`zrr-${r||"vault"}-${i}`}getRedisPortFromUrl(){try{let e=new URL(this.settings.redisUrl),t=e.port?Number(e.port):6379;return Number.isFinite(t)&&t>0?t:6379}catch(e){return 6379}}getRedisInsightPort(e){let n=(Number.isFinite(e!=null?e:NaN)?Number(e):this.getRedisPortFromUrl())+Kn;return n>=1024&&n<=65535?n:xn}applyComposePortEnvironment(e,t){e.ZRR_PORT=String(t),e.ZRR_WORKER_PORT=String(this.getPythonWorkerApiPort(t)),e.ZRR_INSIGHT_PORT=String(this.getRedisInsightPort(t))}getVaultPreferredRedisPort(){let e=(0,Ue.createHash)("sha1").update(this.getVaultBasePath()).digest("hex");return 6400+Number.parseInt(e.slice(0,4),16)%2e3}getRedisHostFromUrl(){try{return new URL(this.settings.redisUrl).hostname||"127.0.0.1"}catch(e){return"127.0.0.1"}}isLocalRedisHost(e){let t=e.trim().toLowerCase();return t?t==="localhost"||t==="0.0.0.0"||t==="::1"?!0:t.startsWith("127."):!1}getPortCheckHost(e){return this.isLocalRedisHost(e)?"127.0.0.1":e}async isPortFree(e,t){return new Promise(n=>{let r=je.default.createServer();r.once("error",()=>n(!1)),r.once("listening",()=>{r.close(()=>n(!0))}),r.listen(t,e)})}getRequiredComposeHostPorts(e){let t=[e,this.getRedisInsightPort(e)];return this.usePythonWorker()&&t.push(this.getPythonWorkerApiPort(e)),Array.from(new Set(t))}async findAvailableComposeRedisPort(e,t){for(let r=0;r<25;r+=1){let i=t+r,a=this.getRequiredComposeHostPorts(i),s=!0;for(let o of a)if(!await this.isPortFree(e,o)){s=!1;break}if(s)return i}return null}updateRedisUrlPort(e,t){try{let n=new URL(e);return n.port=String(t),n.toString()}catch(n){return`redis://127.0.0.1:${t}`}}async isRedisReachable(e){let t="127.0.0.1",n=6379;try{let r=new URL(e);t=r.hostname||t,n=r.port?Number(r.port):n}catch(r){return!1}return t=this.getPortCheckHost(t),new Promise(r=>{let i=new je.default.Socket,a=!1,s=o=>{a||(a=!0,i.destroy(),r(o))};i.setTimeout(500),i.once("connect",()=>s(!0)),i.once("timeout",()=>s(!1)),i.once("error",()=>s(!1)),i.connect(n,t)})}async isZoteroLocalApiReachable(){let e=(this.settings.zoteroBaseUrl||"").trim();if(!e)return!1;let t="127.0.0.1",n=23119;try{let r=new URL(e);if(t=r.hostname||t,r.port){let i=Number(r.port);Number.isFinite(i)&&i>0&&(n=i)}else r.protocol==="https:"?n=443:n=80}catch(r){return!1}return new Promise(r=>{let i=new je.default.Socket,a=!1,s=o=>{a||(a=!0,i.destroy(),r(o))};i.setTimeout(500),i.once("connect",()=>s(!0)),i.once("timeout",()=>s(!1)),i.once("error",()=>s(!1)),i.connect(n,t)})}getRedisNamespace(){let e=this.getVaultBasePath(),t=E.default.basename(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,24),n=(0,Ue.createHash)("sha1").update(e).digest("hex").slice(0,8);return`${t||"vault"}-${n}`}getRedisIndexName(){return`${(this.settings.redisIndex||"idx:zotero").trim()||"idx:zotero"}:${this.getRedisNamespace()}`}getRedisKeyPrefix(){let e=(this.settings.redisPrefix||"zotero:chunk:").trim()||"zotero:chunk:";return`${e.endsWith(":")?e:`${e}:`}${this.getRedisNamespace()}:`}async isComposeProjectRunning(e,t,n,r,i,a=[]){let s=a.length?a:[""];for(let o of s)if(!await new Promise(c=>{let d=o?[o]:[],p=(0,de.spawn)(e,[...t,"-p",r,"-f",n,"ps","-q",...d],{cwd:E.default.dirname(n),env:i}),_="";p.stdout.on("data",g=>{_+=g.toString()}),p.on("error",g=>{console.warn("Redis Stack status check failed",g),c(!1)}),p.on("close",g=>{if(g!==0){c(!1);return}c(_.trim().length>0)})}))return!1;return!0}isContainerNameConflictError(e){return/container name/i.test(e)&&/already in use/i.test(e)}extractConflictingContainerNames(e){let t=new Set,n=/container name\s+["']\/?([^"'\s]+)["']/gi,r;for(;(r=n.exec(e))!==null;){let i=String(r[1]||"").trim().replace(/^\/+/,"");i&&t.add(i)}return Array.from(t)}getExpectedComposeContainerNames(e,t){let n=new Set([...t,he,ut]);return Array.from(n).map(r=>`${e}-${r}-1`)}async resolveContainerRuntimeCommandForCompose(e){if(E.default.basename(e.composeCommand.command||"")==="podman-compose"){let n=String(e.composeEnv.PODMAN_BIN||"").trim();return n||this.resolvePodmanBin()}return e.composeCommand.command||null}async recoverFromContainerNameConflict(e,t,n){let r=e instanceof Error?e.message:typeof e=="string"?e:"";if(!this.isContainerNameConflictError(r))return!1;let i=this.getExpectedComposeContainerNames(t.project,n),a=this.extractConflictingContainerNames(r),s=`${t.project}-`,o=Array.from(new Set([...i,...a])).map(c=>c.replace(/^\/+/,"").trim()).filter(c=>c.startsWith(s));if(!o.length)return!1;let l=await this.resolveContainerRuntimeCommandForCompose(t);if(!l)return!1;console.warn("Recovering from stale container name conflict",{project:t.project,containers:o});for(let c of o)try{await this.runCommand(l,["rm","-f",c],{cwd:E.default.dirname(t.composePath),env:t.composeEnv})}catch(d){console.warn("Failed to remove stale container during conflict recovery",{name:c,cleanupError:d})}return!0}async startRedisStack(e){var t;try{await this.ensureBundledTools();let n=this.getDockerComposePath(),r=this.getRedisDataDir(),i=this.getPythonWorkerCacheDir();await ne.promises.mkdir(r,{recursive:!0}),await ne.promises.mkdir(i,{recursive:!0});let a=await this.resolveDockerPath(),s=((t=this.settings.dockerPath)==null?void 0:t.trim())||"docker",o=this.resolveUserPath(s),l=s==="docker"||s==="podman"||s==="podman-compose";if(!await this.isContainerCliAvailable(o)&&!l&&a&&a!==s&&(this.settings.dockerPath=a,await this.saveSettings(),e||new h.Notice(`Docker/Podman path set to ${a}.`)),!await this.isContainerCliAvailable(a)){e||new h.Notice('Docker or podman not found. Install docker desktop or podman and set "docker/podman path" in settings.');return}if(!await this.isContainerDaemonRunning(a)){e||new h.Notice(this.getContainerDaemonHint(a));return}let p=await this.resolveComposeCommand(a);if(!p){e||new h.Notice("Compose support not found. Install docker desktop or podman with podman-compose.");return}let _=this.getRedisPortFromUrl(),g=await this.buildComposeEnvironment(a,p,{dataDir:r,redisPort:_}),f=this.getDockerProjectName(),b={composePath:n,composeCommand:p,composeEnv:g,project:f},k=this.getComposeServiceNamesForCurrentRuntime();if(await this.isComposeProjectRunning(p.command,p.argsPrefix,n,f,g,k)){e||new h.Notice(this.usePythonWorker()?"Redis Stack and Python worker already running for this vault.":"Redis Stack already running for this vault.");return}let m=this.getRedisHostFromUrl(),x=this.getPortCheckHost(m),w=this.settings.autoAssignRedisPort&&this.isLocalRedisHost(m),S=this.settings.redisUrl,R=_,P=()=>{if(!e){if(!this.settings.autoAssignRedisPort){new h.Notice("Redis already running. If you share redis across vaults, disable auto-start redis in this vault.");return}new h.Notice(`Redis already running at ${S}.`)}};if(w){let N=_===6379?this.getVaultPreferredRedisPort():_,O=await this.findAvailableComposeRedisPort(x,N);if(!O)throw new Error(`No available Redis port found starting at ${N}.`);O!==_&&(R=O,S=this.updateRedisUrlPort(S,R),this.settings.redisUrl=S,await this.saveSettings(),e||new h.Notice(`Using Redis port ${R} for this vault.`))}else{if(this.isLocalRedisHost(m)&&!await this.isPortFree(x,R)){await this.isRedisReachable(S)?(P(),this.usePythonWorker()&&(await this.maybeShowFirstContainerStartupNotice(e),await this.startPythonWorkerService(b))):e||new h.Notice(`Port ${R} is already in use and Redis is not reachable at ${S}. Update the Redis URL or enable auto-assign.`);return}if(await this.isRedisReachable(S)){P(),this.usePythonWorker()&&(await this.maybeShowFirstContainerStartupNotice(e),await this.startPythonWorkerService(b));return}}this.applyComposePortEnvironment(g,R);try{await this.runCommand(p.command,[...p.argsPrefix,"-p",f,"-f",n,"down"],{cwd:E.default.dirname(n),env:g})}catch(N){console.warn("Redis Stack stop before restart failed",N)}let A=[...p.argsPrefix,"-p",f,"-f",n,"up","-d"];this.usePythonWorker()&&A.push("--build"),A.push(...k),await this.maybeShowFirstContainerStartupNotice(e);try{await this.runCommand(p.command,A,{cwd:E.default.dirname(n),env:g})}catch(N){if(!await this.recoverFromContainerNameConflict(N,b,k))throw N;console.debug("Retrying Redis stack startup after container conflict recovery."),await this.runCommand(p.command,A,{cwd:E.default.dirname(n),env:g})}e||new h.Notice("Redis stack started.")}catch(n){e||new h.Notice("Failed to start redis stack. Check docker/podman and file sharing."),console.error("Failed to start Redis Stack",n)}}async recreateRedisStack(e){try{if(!this.isLocalRedisHost(this.getRedisHostFromUrl())){e||new h.Notice("This command only works for local redis addresses managed by compose.");return}let t=await this.resolveComposeProjectContext({dataDir:this.getRedisDataDir(),redisPort:this.getRedisPortFromUrl()});await this.maybeShowFirstContainerStartupNotice(e),await this.runCommand(t.composeCommand.command,[...t.composeCommand.argsPrefix,"-p",t.project,"-f",t.composePath,"pull",he],{cwd:E.default.dirname(t.composePath),env:t.composeEnv}),await this.runCommand(t.composeCommand.command,[...t.composeCommand.argsPrefix,"-p",t.project,"-f",t.composePath,"up","-d","--force-recreate",he],{cwd:E.default.dirname(t.composePath),env:t.composeEnv}),e||new h.Notice("Redis stack recreated.")}catch(t){e||new h.Notice("Failed to recreate redis stack. Check docker/podman and file sharing."),console.error("Failed to recreate Redis Stack",t)}}async waitForPythonWorkerReady(e,t=900*1e3){let n=Date.now(),r=i=>new Promise(a=>activeWindow.setTimeout(a,i));for(;Date.now()-n<t;){if(await this.isPythonWorkerApiHealthy(e))return;await r(2e3)}throw new Error("Python worker is still starting. Check compose logs for the python-worker service.")}async startPythonWorkerService(e){let t=e!=null?e:await this.resolveComposeProjectContext({dataDir:this.getRedisDataDir(),redisPort:this.getRedisPortFromUrl()}),n=[...t.composeCommand.argsPrefix,"-p",t.project,"-f",t.composePath,"up","-d","--build",ut];await this.runCommand(t.composeCommand.command,n,{cwd:E.default.dirname(t.composePath),env:t.composeEnv})}async ensureWorkerRedisService(e,t){if(!this.settings.autoStartRedis||!this.isLocalRedisHost(this.getRedisHostFromUrl()))return;if(!await this.isComposeProjectRunning(e.composeCommand.command,e.composeCommand.argsPrefix,e.composePath,e.project,e.composeEnv,[he])&&t){let i=[...e.composeCommand.argsPrefix,"-p",e.project,"-f",e.composePath,"up","-d",he];await this.runCommand(e.composeCommand.command,i,{cwd:E.default.dirname(e.composePath),env:e.composeEnv})}if(!await this.isComposeProjectRunning(e.composeCommand.command,e.composeCommand.argsPrefix,e.composePath,e.project,e.composeEnv,[he]))throw new Error("Redis service is not running. Start Redis stack now or enable Auto-start Redis stack.")}async ensurePythonWorkerContext(e){let t=this.getRedisDataDir();await ne.promises.mkdir(t,{recursive:!0}),await ne.promises.mkdir(this.getPythonWorkerCacheDir(),{recursive:!0});let n=await this.resolveComposeProjectContext({dataDir:t,redisPort:this.getRedisPortFromUrl()}),r=[ut];if(!await this.isComposeProjectRunning(n.composeCommand.command,n.composeCommand.argsPrefix,n.composePath,n.project,n.composeEnv,r)&&e&&(await this.startPythonWorkerService(n),n=await this.resolveComposeProjectContext({dataDir:t,redisPort:this.getRedisPortFromUrl()})),!await this.isComposeProjectRunning(n.composeCommand.command,n.composeCommand.argsPrefix,n.composePath,n.project,n.composeEnv,r))throw new Error("Python worker is not running. Start Redis stack now or enable Auto-start Redis stack.");return await this.ensureWorkerRedisService(n,e),await this.waitForPythonWorkerReady(n),n}async setupPythonEnv(){if(this.usePythonWorker()){try{new h.Notice("Setting up python worker environment..."),this.showStatusProgress("Setting up Python worker environment...",null),await this.ensurePythonWorkerContext(!0),this.clearStatusProgress(),new h.Notice("Python worker environment ready.")}catch(i){this.clearStatusProgress(),new h.Notice("Failed to set up python worker environment. See console for details."),console.error("Python worker setup failed",i)}return}let e=this.getPluginDir(),t=this.getPythonVenvDir(),n=this.getVenvPythonPath(t);await this.ensureBundledTools();let r=this.resolveRequirementsPath(e);if(!r)throw new Error(`requirements.txt not found in ${e}`);try{new h.Notice("Setting up python environment..."),this.showStatusProgress("Setting up Python environment...",null),console.debug(`Python env: using plugin dir ${e}`),console.debug(`Python env: venv path ${t}`),await ne.promises.mkdir(E.default.dirname(t),{recursive:!0});let i=null,a=async()=>(i||(i=await this.resolveBootstrapPython()),i);if((0,ne.existsSync)(n)){let s=await this.getPythonVersion(n,[]);if(s&&this.isUnsupportedPythonVersion(s)){let o=await a();console.debug(`Python env: existing venv uses Python ${s.major}.${s.minor}; rebuilding with ${o.command} ${o.args.join(" ")}`),this.showStatusProgress("Rebuilding Python environment...",null),await ne.promises.rm(t,{recursive:!0,force:!0})}}if(!(0,ne.existsSync)(n)){let s=await a();console.debug(`Python env: creating venv with ${s.command} ${s.args.join(" ")}`),await this.runCommand(s.command,[...s.args,"-m","venv",t],{cwd:e})}await this.runCommandStreaming(n,["-m","pip","install","-r",r],{cwd:e},s=>{let o=s.trim();if(!o)return;let l=o.match(/^Collecting\s+([^\s]+)/);if(l){this.showStatusProgress(`Installing ${l[1]}...`,null);return}if(o.startsWith("Installing collected packages")){this.showStatusProgress("Installing packages...",null);return}o.startsWith("Successfully installed")&&this.showStatusProgress("Python environment ready.",100)}),this.settings.pythonPath=n,await this.saveSettings(),this.clearStatusProgress(),new h.Notice("Python environment ready.")}catch(i){this.clearStatusProgress(),new h.Notice("Failed to set up python environment. See console for details."),console.error("Python env setup failed",i)}}async detectOcrEngines(){if(this.usePythonWorker())return{tesseract:!0,paddleStructureLocal:!0,paddleVlLocal:!0};let e=await this.canRunCommand("tesseract",[]),t=this.resolvePythonPath(),n=[];if(!t)try{let l=await this.resolveBootstrapPython();t=l.command,n=l.args}catch(l){return{tesseract:e,paddleStructureLocal:!1,paddleVlLocal:!1}}let r=["import importlib.util, json","def has_module(name):","    return importlib.util.find_spec(name) is not None","has_paddle = has_module('paddle')","has_paddleocr = has_module('paddleocr')","has_paddlex = has_module('paddlex')","has_vl = False","if has_paddleocr:","    try:","        from paddleocr import PaddleOCRVL","        has_vl = True","    except Exception:","        has_vl = False","print(json.dumps({'paddle': has_paddle, 'paddleocr': has_paddleocr, 'paddlex': has_paddlex, 'paddle_vl': has_vl}))"].join(`
`),i=await new Promise(l=>{let c=(0,de.spawn)(t,[...n,"-c",r],{env:this.buildPythonEnv()}),d="";c.stdout.on("data",p=>{d+=p.toString()}),c.on("error",()=>l({ok:!1})),c.on("close",p=>{if(p!==0){l({ok:!1});return}try{let _=JSON.parse(d.trim());l({ok:!0,data:_})}catch(_){l({ok:!1})}})});if(!i.ok||!i.data)return{tesseract:e,paddleStructureLocal:!1,paddleVlLocal:!1};let a=i.data,s=!!a.paddle,o=!!a.paddleocr;return{tesseract:e,paddleStructureLocal:s&&o&&!!a.paddlex,paddleVlLocal:s&&o&&!!a.paddle_vl}}getSharedPythonEnvRoot(){let e=$e.default.homedir();return process.platform==="win32"?E.default.join(e,"AppData","Local","zotero-redisearch-rag"):E.default.join(e,".cache","zotero-redisearch-rag")}getPythonVenvDir(){return this.settings.pythonEnvLocation==="plugin"?E.default.join(this.getPluginDir(),".venv"):E.default.join(this.getSharedPythonEnvRoot(),"venv")}getVenvPythonPath(e){return process.platform==="win32"?E.default.join(e,"Scripts","python.exe"):E.default.join(e,"bin","python")}resolveRequirementsPath(e){var n;return(n=[E.default.join(e,"requirements.txt"),E.default.join(e,"tools","requirements.txt")].find(r=>(0,ne.existsSync)(r)))!=null?n:null}async resolveBootstrapPython(){let e=(this.settings.pythonPath||"").trim(),t=this.expandPathValue(e);if(t&&await this.canRunCommand(t,[])){let r=await this.getPythonVersion(t,[]);if(r&&this.isUnsupportedPythonVersion(r))throw new Error(`Configured Python ${r.major}.${r.minor} is not supported. Install Python 3.11\u20133.13 and update the Python path.`);return{command:t,args:[]}}let n=process.platform==="win32"?[{command:"py",args:["-3.13"]},{command:"py",args:["-3.12"]},{command:"py",args:["-3.11"]},{command:"py",args:["-3.10"]},{command:"py",args:["-3"]},{command:"python",args:[]}]:[{command:"python3.13",args:[]},{command:"python3.12",args:[]},{command:"python3.11",args:[]},{command:"python3.10",args:[]},{command:"python3",args:[]},{command:"python",args:[]}];for(let r of n)if(await this.canRunCommand(r.command,r.args)){let i=await this.getPythonVersion(r.command,r.args);if(i&&this.isUnsupportedPythonVersion(i)){console.debug(`Python env: skipping ${r.command} ${r.args.join(" ")} (Python ${i.major}.${i.minor} unsupported)`);continue}return r}throw new Error("No usable Python 3.11\u20133.13 interpreter found on PATH.")}isUnsupportedPythonVersion(e){return e.major>3||e.major===3&&e.minor>=14}async getPythonVersion(e,t){return new Promise(n=>{let r=(0,de.spawn)(e,[...t,"-c","import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"]),i="";r.stdout.on("data",a=>{i+=a.toString()}),r.on("error",()=>n(null)),r.on("close",a=>{if(a!==0){n(null);return}let s=i.trim().match(/(\d+)\.(\d+)/);if(!s){n(null);return}n({major:Number(s[1]),minor:Number(s[2])})})})}async canRunCommand(e,t){return new Promise(n=>{let r=(0,de.spawn)(e,[...t,"--version"],{env:this.buildPythonEnv()});r.on("error",()=>n(!1)),r.on("close",i=>n(i===0))})}buildPythonEnv(){let e=this.buildChildEnv();return e.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK="True",e.DISABLE_MODEL_SOURCE_CHECK="True",e}getLocalPythonInvocation(e,t){return{command:this.resolvePythonPath(),args:[e,...t],cwd:E.default.dirname(e),env:this.buildPythonEnv()}}async runPython(e,t){if(this.usePythonWorker()){let r=this.getWorkerToolName(e);if(!r)throw new Error(`Python worker can only run bundled tools under '${E.default.join(this.getPluginDir(),"tools")}'.`);await this.runPythonToolWithOutputViaWorkerApi(r,t,this.settings.autoStartRedis);return}let n=this.getLocalPythonInvocation(e,t);return new Promise((r,i)=>{let a=(0,de.spawn)(n.command,n.args,{cwd:n.cwd,env:n.env}),s="",o="";a.stdout.on("data",l=>{s+=l.toString()}),a.stderr.on("data",l=>{o+=l.toString()}),a.on("error",l=>{this.handlePythonProcessError(String(l)),i(l)}),a.on("close",l=>{if(l===0)r();else{let c=o.trim()?o:s;this.handlePythonProcessError(c),i(new Error(o||`Process exited with code ${l}`))}})})}runCommand(e,t,n){return new Promise((r,i)=>{var o;let a=(0,de.spawn)(e,t,{cwd:n==null?void 0:n.cwd,env:(o=n==null?void 0:n.env)!=null?o:this.buildPythonEnv()}),s="";a.stderr.on("data",l=>{s+=l.toString()}),a.on("error",l=>{i(l)}),a.on("close",l=>{l===0?r():i(new Error(s||`Process exited with code ${l}`))})})}async runPythonStreaming(e,t,n,r,i,a="docling_extract",s,o){if(this.usePythonWorker()){let c=this.getWorkerToolName(e);if(!c)throw new Error(`Python worker can only run bundled tools under '${E.default.join(this.getPluginDir(),"tools")}'.`);await this.runPythonStreamingViaWorkerApi(c,t,n,r,i,a,this.settings.autoStartRedis,s,o);return}let l=this.getLocalPythonInvocation(e,t);return new Promise((c,d)=>{let p=(0,de.spawn)(l.command,l.args,{cwd:l.cwd,env:l.env});s&&s(p);let _="",g="",f="",b=null,k=!1,m=x=>{if(x.trim())try{let w=JSON.parse(x);b=w,((w==null?void 0:w.type)==="final"||w!=null&&w.answer)&&(k=!0),n(w)}catch(w){f+=`${x}
`}};p.stdout.on("data",x=>{var S;_+=x.toString();let w=_.split(/\r?\n/);_=(S=w.pop())!=null?S:"";for(let R of w)m(R)}),p.stderr.on("data",x=>{g+=x.toString()}),p.on("error",x=>{this.handlePythonProcessError(String(x)),d(x)}),p.on("close",x=>{if(_.trim()&&m(_),!k&&b&&r(b),i&&this.appendToLogFile(i,g,a,"STDERR"),x===0)c();else{let w=g.trim()?g:f;this.handlePythonProcessError(w),d(new Error(this.summarizePythonDiagnostic(w,`Process exited with code ${x}`)))}})})}runCommandStreaming(e,t,n,r){return new Promise((i,a)=>{var c;let s=(0,de.spawn)(e,t,{cwd:n==null?void 0:n.cwd,env:(c=n==null?void 0:n.env)!=null?c:this.buildPythonEnv()}),o=d=>{d.toString().split(/\r?\n/).forEach(_=>{_.trim()&&r(_)})},l="";s.stdout.on("data",o),s.stderr.on("data",d=>{l+=d.toString(),o(d)}),s.on("error",d=>{a(d)}),s.on("close",d=>{d===0?i():a(new Error(l||`Process exited with code ${d}`))})})}async requestPythonWorkerCancel(e,t,n=2e3){let r=`${e.protocol}//${e.host}/cancel`;try{await this.requestLocalApiRaw(r,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json","X-ZRR-Request-Id":t},body:JSON.stringify({request_id:t}),timeoutMs:n}),this.logPythonWorkerTiming("cancel-request",{requestId:t,cancelUrl:r})}catch(i){this.logPythonWorkerTiming("cancel-request-error",{requestId:t,cancelUrl:r,error:String(i)})}}async runPythonStreamingViaWorkerApi(e,t,n,r,i,a="docling_extract",s=!0,o,l){let c=this.nextPythonWorkerRequestId(e),d=Date.now(),p=await this.ensurePythonWorkerContext(s),_=Date.now(),g=this.mapPythonArgsForWorker(t),f=`${this.getPythonWorkerApiBaseUrl(this.getPythonWorkerApiPortFromContext(p))}/run-stream`,b=new URL(f),k=Number.isFinite(l!=null?l:NaN)?Math.max(1,Math.trunc(Number(l))):600,m=JSON.stringify({tool:e,args:g,timeout_sec:k});return this.logPythonWorkerTiming("stream-start",{requestId:c,tool:e,argsCount:g.length,ensureContextMs:_-d,port:this.getPythonWorkerApiPortFromContext(p),timeoutSec:k}),new Promise((x,w)=>{let S="",R="",P=null,A=!1,N=null,O=!1,q=null,j=null,V=0,z=!1,Z=()=>{z=!0},T=St.default.request({method:"POST",hostname:b.hostname,port:b.port||void 0,path:`${b.pathname}${b.search}`,headers:{Accept:"application/x-ndjson","Content-Type":"application/json","Content-Length":String(Buffer.byteLength(m)),"X-ZRR-Request-Id":c}},H=>{var J;q=Date.now();let F=W=>{if(W.trim())try{let I=JSON.parse(W);P=I,((I==null?void 0:I.type)==="final"||I!=null&&I.answer)&&(A=!0,!O&&(I!=null&&I.timing)&&typeof I.timing=="object"&&(O=!0,this.logPythonWorkerTiming("stream-tool-timing",{requestId:c,tool:e,timing:I.timing}))),n(I)}catch(I){R+=`${W}
`}},M=W=>{var I;if(W.trim())try{let B=JSON.parse(W);if((B==null?void 0:B.type)==="stdout"){V+=1,j===null&&(j=Date.now()),F(String((I=B.line)!=null?I:""));return}if((B==null?void 0:B.type)==="done"){N=B;return}R+=`${W}
`}catch(B){R+=`${W}
`}};if(((J=H.statusCode)!=null?J:0)>=400){let W=[];H.on("data",I=>W.push(Buffer.from(I))),H.on("end",()=>{var B;Z();let I=Buffer.concat(W).toString("utf8");this.logPythonWorkerTiming("stream-http-error",{requestId:c,tool:e,statusCode:(B=H.statusCode)!=null?B:0,durationMs:Date.now()-d}),w(new Error(`Python worker API request failed (${H.statusCode}): ${I||"no response body"}`))});return}H.on("data",W=>{var B;S+=W.toString();let I=S.split(/\r?\n/);S=(B=I.pop())!=null?B:"";for(let K of I)M(K)}),H.on("end",()=>{Z(),S.trim()&&M(S);let W=this.asRecord(N),I=typeof(W==null?void 0:W.stderr)=="string"?W.stderr:"",B=typeof(W==null?void 0:W.error)=="string"?W.error.trim():"",K=typeof(W==null?void 0:W.exit_code)=="number"?W.exit_code:Number.parseInt(typeof(W==null?void 0:W.exit_code)=="string"?W.exit_code:"1",10);if(!A&&P&&r(P),i&&I&&this.appendToLogFile(i,I,a,"STDERR"),this.logPythonWorkerTiming("stream-done",{requestId:c,tool:e,exitCode:Number.isFinite(K)?K:1,totalMs:Date.now()-d,responseOpenMs:q?q-d:null,firstStdoutMs:j?j-d:null,stdoutEvents:V,stderrBytes:I.length,doneError:B}),Number.isFinite(K)&&K===0){x();return}if(/^(canceled|cancelled|client_disconnected)$/i.test(B)){w(new Error(`Python worker request canceled: ${B}`));return}let ie=/^(timeout|canceled|cancelled|client_disconnected)$/i.test(B)?`${B}
${I||R}`.trim():I.trim()?I:B||R;this.handlePythonProcessError(ie),w(new Error(this.summarizePythonDiagnostic(ie,`Process exited with code ${Number.isFinite(K)?K:1}`)))})});o&&o({get killed(){return z},kill:H=>z?!1:(Z(),this.requestPythonWorkerCancel(b,c),T.destroy(new Error("Python worker request aborted")),!0)}),T.setTimeout((k+30)*1e3,()=>{T.destroy(new Error("Python worker streaming request timed out"))}),T.on("error",H=>{Z();let F=H instanceof Error?H.message:typeof H=="string"?H:"";this.logPythonWorkerTiming("stream-request-error",{requestId:c,tool:e,durationMs:Date.now()-d,error:F}),this.handlePythonProcessError(F);let M=H instanceof Error?H:new Error(F||"Python worker streaming request failed");w(M)}),T.write(m),T.end()})}handlePythonProcessError(e){if(!e)return;if(/Python worker cannot access path/i.test(e)){this.notifyContainerOnce(e.replace(/^Error:\s*/i,""));return}if(/python-worker/i.test(e)&&/(No such service|is not running|not found|no container)/i.test(e)){this.notifyContainerOnce("Python worker is not running. Start Redis stack now or enable Auto-start Redis stack.");return}if(/Cannot connect to the Docker daemon|docker desktop is not running|podman machine/i.test(e)){this.notifyContainerOnce("Container runtime is not available. Start Docker Desktop or Podman.");return}if(/Python worker API request failed|Python worker streaming request timed out|ECONNREFUSED 127\.0\.0\.1/i.test(e)){this.notifyContainerOnce("Python worker API is not reachable. Start Redis stack now or check python-worker container logs.");return}let t=e.match(/ModuleNotFoundError:\s+No module named ['"]([^'"]+)['"]/);if(t){let n=this.usePythonWorker()?`Python worker missing module '${t[1]}'. Restart Redis stack to rebuild worker env.`:`Python env missing module '${t[1]}'. Open Settings > Python environment > Create/Update.`;this.notifyPythonEnvOnce(n,!0);return}if(/No module named ['"]|ImportError: No module named/i.test(e)){let n=this.usePythonWorker()?"Python worker missing required modules. Restart Redis stack to rebuild worker env.":"Python env missing required modules. Open Settings > Python environment > Create/Update.";this.notifyPythonEnvOnce(n,!0);return}if(/ENOENT|No such file or directory|not found|command not found|spawn .* ENOENT/i.test(e)){let n=this.usePythonWorker()?"Python worker command failed. Start Redis stack and check container logs.":"Python not found. Configure the Python path or use Settings > Python environment > Create/Update.";this.notifyPythonEnvOnce(n,!0)}}notifyPythonEnvOnce(e,t=!1){this.lastPythonEnvNotice!==e&&(this.lastPythonEnvNotice=e,new h.Notice(e),t&&this.openPluginSettings())}notifyContainerOnce(e){this.lastContainerNotice!==e&&(this.lastContainerNotice=e,new h.Notice(e))}notifyRedisOnce(e){this.lastRedisNotice!==e&&(this.lastRedisNotice=e,new h.Notice(e))}async autoDetectRedisOnLoad(){if(this.settings.autoStartRedis)return;let e=(this.settings.redisUrl||"").trim(),n=e||"redis://127.0.0.1:6379";(await this.checkRedisConnectionWithUrl(n,500)).ok&&(e||(this.settings.redisUrl=n,await this.saveSettings()),this.notifyRedisOnce(`Redis detected at ${n}. This instance will be used.`))}notifyZoteroApiOnce(e){this.lastZoteroApiNotice!==e&&(this.lastZoteroApiNotice=e,new h.Notice(e))}async warnIfZoteroLocalApiUnavailable(e){if(await this.isZoteroLocalApiReachable())return this.lastZoteroApiNotice=null,!0;let r=`Zotero Local API is not reachable for ${e?`${e}`:"this action"}. Start Zotero or update the Local API URL in settings.`;return this.notifyZoteroApiOnce(r),!1}openPluginSettings(){var t,n;let e=this.app;(t=e.setting)!=null&&t.open&&e.setting.open(),(n=e.setting)!=null&&n.openTabById&&e.setting.openTabById(this.manifest.id)}getLogsDirRelative(){return(0,h.normalizePath)(`${se}/logs`)}getLogFileRelativePath(){let e=(this.settings.logFilePath||"").trim();return(0,h.normalizePath)(e||`${this.getLogsDirRelative()}/docling_extract.log`)}getLogFileAbsolutePath(){return this.getAbsoluteVaultPath(this.getLogFileRelativePath())}getSpellcheckerInfoRelativePath(){return(0,h.normalizePath)(`${this.getLogsDirRelative()}/spellchecker_info.json`)}async openLogFile(){let e=this.getLogFileRelativePath(),t=this.app.vault.adapter;if(!await t.exists(e)){new h.Notice("Log file not found.");return}try{let n=async()=>{try{return await t.read(e)||"(empty)"}catch(i){return"(empty)"}},r=await n();new Ee(this.app,"Log file",r||"(empty)",{autoRefresh:!0,refreshIntervalMs:2e3,onRefresh:n,onClear:async()=>{await this.clearLogFile()}}).open()}catch(n){new h.Notice("Failed to open log file."),console.error(n)}}async clearLogFile(){let e=this.getLogFileRelativePath(),t=this.app.vault.adapter;try{let n=(0,h.normalizePath)(E.default.dirname(e));n&&await this.ensureFolder(n),await t.write(e,""),new h.Notice("Log file cleared.")}catch(n){new h.Notice("Failed to clear log file."),console.error(n)}}async deleteLogFileIfExists(){let e=this.getLogFileRelativePath(),t=this.app.vault.adapter;try{await t.exists(e)&&await t.remove(e)}catch(n){console.warn("Failed to delete log file before import",n)}}formatLogLines(e,t,n){let r=e.split(/\r?\n/).map(a=>a.trimEnd()).filter(a=>!!a.trim());if(!r.length)return"";let i=new Date().toISOString().replace("T"," ").replace(".",",");return r.map(a=>`${i} ${n} ${t}: ${a}`).join(`
`)+`
`}async appendToLogFile(e,t,n="docling_extract",r="STDERR"){if(!t||!t.trim())return;let i=this.formatLogLines(t,n,r);if(i)try{await ne.promises.mkdir(E.default.dirname(e),{recursive:!0}),await ne.promises.appendFile(e,i)}catch(a){console.warn("Failed to append stderr to log file",a)}}async runPythonToolWithOutputViaWorkerApi(e,t,n,r,i="docling_extract",a){var w,S,R;if(!this.usePythonWorker())throw new Error("Worker API is only available in worker runtime mode.");let s=this.nextPythonWorkerRequestId(e),o=Date.now(),l=await this.ensurePythonWorkerContext(n),c=Date.now(),d=this.mapPythonArgsForWorker(t),p=`${this.getPythonWorkerApiBaseUrl(this.getPythonWorkerApiPortFromContext(l))}/run`,_=Number.isFinite(a!=null?a:NaN)?Math.max(1,Math.trunc(Number(a))):600,g=JSON.stringify({tool:e,args:d,timeout_sec:_}),f=await this.requestLocalApiRaw(p,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json","X-ZRR-Request-Id":s},body:g,timeoutMs:(_+30)*1e3});if(f.statusCode<200||f.statusCode>=300){let P=f.body.toString("utf8");throw this.logPythonWorkerTiming("run-http-error",{requestId:s,tool:e,statusCode:f.statusCode,totalMs:Date.now()-o,ensureContextMs:c-o}),new Error(`Python worker API request failed (${f.statusCode}): ${P||"no response body"}`)}let b=JSON.parse(f.body.toString("utf8")||"{}"),k=String((w=b==null?void 0:b.stdout)!=null?w:""),m=String((S=b==null?void 0:b.stderr)!=null?S:"");b!=null&&b.timing&&typeof b.timing=="object"&&this.logPythonWorkerTiming("run-tool-timing",{requestId:s,tool:e,timing:b.timing}),r&&m&&await this.appendToLogFile(r,m,i,"STDERR");let x=Number.parseInt(String((R=b==null?void 0:b.exit_code)!=null?R:1),10);if(this.logPythonWorkerTiming("run-done",{requestId:s,tool:e,exitCode:Number.isFinite(x)?x:1,totalMs:Date.now()-o,ensureContextMs:c-o,requestMs:Date.now()-c,stdoutBytes:k.length,stderrBytes:m.length,timeoutSec:_}),!Number.isFinite(x)||x!==0){let P=m.trim()?m:k;throw this.handlePythonProcessError(P),new Error(m||`Process exited with code ${Number.isFinite(x)?x:1}`)}return k.trim()}async runPythonWithOutput(e,t,n,r="docling_extract",i){if(this.usePythonWorker()){let s=this.getWorkerToolName(e);if(!s)throw new Error(`Python worker can only run bundled tools under '${E.default.join(this.getPluginDir(),"tools")}'.`);return this.runPythonToolWithOutputViaWorkerApi(s,t,this.settings.autoStartRedis,n,r,i)}let a=this.getLocalPythonInvocation(e,t);return new Promise((s,o)=>{let l=(0,de.spawn)(a.command,a.args,{cwd:a.cwd,env:a.env}),c="",d="";l.stdout.on("data",p=>{c+=p.toString()}),l.stderr.on("data",p=>{d+=p.toString()}),l.on("error",p=>{this.handlePythonProcessError(String(p)),o(p)}),l.on("close",p=>{if(n&&this.appendToLogFile(n,d,r,"STDERR"),p===0)s(c.trim());else{let _=d.trim()?d:c;this.handlePythonProcessError(_),o(new Error(this.summarizePythonDiagnostic(_,`Process exited with code ${p}`)))}})})}};
