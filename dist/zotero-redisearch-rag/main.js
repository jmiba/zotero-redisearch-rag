"use strict";var Xe=Object.create;var ge=Object.defineProperty;var en=Object.getOwnPropertyDescriptor;var nn=Object.getOwnPropertyNames;var tn=Object.getPrototypeOf,rn=Object.prototype.hasOwnProperty;var sn=(w,g)=>{for(var e in g)ge(w,e,{get:g[e],enumerable:!0})},ze=(w,g,e,n)=>{if(g&&typeof g=="object"||typeof g=="function")for(let t of nn(g))!rn.call(w,t)&&t!==e&&ge(w,t,{get:()=>g[t],enumerable:!(n=en(g,t))||n.enumerable});return w};var le=(w,g,e)=>(e=w!=null?Xe(tn(w)):{},ze(g||!w||!w.__esModule?ge(e,"default",{value:w,enumerable:!0}):e,w)),an=w=>ze(ge({},"__esModule",{value:!0}),w);var mn={};sn(mn,{default:()=>be});module.exports=an(mn);var p=require("obsidian"),ne=require("@codemirror/state"),$=require("@codemirror/view"),J=require("child_process"),U=require("fs"),Ue=le(require("http")),Ze=le(require("https")),_e=le(require("net")),Ve=le(require("tls")),P=le(require("path")),se=require("url"),fe=require("crypto");var L=require("obsidian"),W=".zotero-redisearch-rag",K=`${W}/items`,Z=`${W}/chunks`,Fe={zoteroBaseUrl:"http://127.0.0.1:23119/api",zoteroUserId:"0",webApiBaseUrl:"https://api.zotero.org",webApiLibraryType:"user",webApiLibraryId:"",webApiKey:"",pythonPath:"python3",dockerPath:"docker",autoStartRedis:!1,copyPdfToVault:!0,frontmatterTemplate:`doc_id: {{doc_id}}
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
item_json: {{item_json_yaml}}`,noteBodyTemplate:"{{pdf_block}}{{docling_markdown}}",llmProviderProfiles:[{id:"lm-studio",name:"LM Studio",baseUrl:"http://localhost:1234/v1",apiKey:"lm-studio"},{id:"ollama",name:"Ollama",baseUrl:"http://localhost:11434/v1",apiKey:""},{id:"openrouter",name:"OpenRouter",baseUrl:"https://openrouter.ai/api/v1",apiKey:""},{id:"openai",name:"OpenAI",baseUrl:"https://api.openai.com/v1",apiKey:""}],embedProviderProfileId:"lm-studio",chatProviderProfileId:"lm-studio",llmCleanupProviderProfileId:"lm-studio",tagSanitizeMode:"kebab",outputPdfDir:"Zotero/PDFs",outputNoteDir:"Zotero/Notes",chatOutputDir:"Zotero/Chats",chatPaneLocation:"right",redisUrl:"redis://127.0.0.1:6379",autoAssignRedisPort:!0,redisIndex:"idx:zotero",redisPrefix:"zotero:chunk:",embedBaseUrl:"http://localhost:1234/v1",embedApiKey:"lm-studio",embedModel:"google/embedding-gemma-300m",embedIncludeMetadata:!0,embedSubchunkChars:3500,embedSubchunkOverlap:200,enableChunkTagging:!1,chatBaseUrl:"http://127.0.0.1:1234/v1",chatApiKey:"",chatModel:"openai/gpt-oss-20b",chatTemperature:.2,chatHistoryMessages:6,ocrMode:"auto",chunkingMode:"page",ocrQualityThreshold:.5,enableLlmCleanup:!1,llmCleanupBaseUrl:"http://127.0.0.1:1234/v1",llmCleanupApiKey:"",llmCleanupModel:"openai/gpt-oss-20b",llmCleanupTemperature:0,llmCleanupMinQuality:.35,llmCleanupMaxChars:2e3,enableFileLogging:!1,logFilePath:`${W}/logs/docling_extract.log`,createOcrLayeredPdf:!1,preferObsidianNoteForCitations:!0},he=class extends L.PluginSettingTab{constructor(g,e){super(g,e),this.plugin=e}display(){let{containerEl:g}=this;g.empty();let e=()=>Array.isArray(this.plugin.settings.llmProviderProfiles)?this.plugin.settings.llmProviderProfiles:[],n=async u=>{this.plugin.settings.llmProviderProfiles=u,await this.plugin.saveSettings()},t=u=>{u.inputEl.type="password",u.inputEl.autocomplete="off",u.inputEl.spellcheck=!1};g.createEl("h2",{text:"Prerequisites"}),new L.Setting(g).setName("Python path").setDesc("Optional path to the Python interpreter used to create or run the plugin env.").addText(u=>u.setPlaceholder("python3").setValue(this.plugin.settings.pythonPath).onChange(async f=>{this.plugin.settings.pythonPath=f.trim(),await this.plugin.saveSettings()})),new L.Setting(g).setName("Python environment").setDesc("Create or update the plugin's Python env (.venv in the plugin folder).").addButton(u=>{u.setButtonText("Create/Update").setCta(),u.onClick(async()=>{u.setDisabled(!0);try{await this.plugin.setupPythonEnv()}finally{u.setDisabled(!1)}})}),new L.Setting(g).setName("Docker/Podman path").setDesc("CLI path for Docker or Podman (used to start Redis Stack).").addText(u=>u.setPlaceholder("docker").setValue(this.plugin.settings.dockerPath).onChange(async f=>{this.plugin.settings.dockerPath=f.trim()||"docker",await this.plugin.saveSettings()})),new L.Setting(g).setName("Redis URL").addText(u=>u.setPlaceholder("redis://127.0.0.1:6379").setValue(this.plugin.settings.redisUrl).onChange(async f=>{this.plugin.settings.redisUrl=f.trim(),await this.plugin.saveSettings()})),new L.Setting(g).setName("Auto-assign Redis port").setDesc("When starting Redis stack, pick a free local port and update the Redis URL.").addToggle(u=>u.setValue(this.plugin.settings.autoAssignRedisPort).onChange(async f=>{this.plugin.settings.autoAssignRedisPort=f,await this.plugin.saveSettings()})),new L.Setting(g).setName("Auto-start Redis stack (Docker/Podman Compose)").setDesc("Requires Docker Desktop running and your vault path shared with Docker.").addToggle(u=>u.setValue(this.plugin.settings.autoStartRedis).onChange(async f=>{this.plugin.settings.autoStartRedis=f,await this.plugin.saveSettings()})),new L.Setting(g).setName("Start Redis stack now").setDesc("Restarts Docker/Podman Compose with the vault data directory.").addButton(u=>u.setButtonText("Start").onClick(async()=>{await this.plugin.startRedisStack()})),g.createEl("h2",{text:"Zotero Local API"}),new L.Setting(g).setName("Zotero base URL").setDesc("Local Zotero API base URL, e.g. http://127.0.0.1:23119/api").addText(u=>u.setPlaceholder("http://127.0.0.1:23119/api").setValue(this.plugin.settings.zoteroBaseUrl).onChange(async f=>{this.plugin.settings.zoteroBaseUrl=f.trim(),await this.plugin.saveSettings()}));let i=new L.Setting(g).setName("Zotero library").setDesc("Select your local library or a Zotero group library."),r=null,s=u=>{if(!r)return;let f=(this.plugin.settings.zoteroUserId||"0").trim()||"0";new Set(u.map(M=>M.value)).has(f)||(u=u.concat([{value:f,label:`Custom (${f})`}])),r.selectEl.options.length=0;for(let M of u)r.addOption(M.value,M.label);r.setValue(f)},a=async()=>{if(r){r.setDisabled(!0);try{let u=await this.plugin.fetchZoteroLibraryOptions();s(u)}finally{r.setDisabled(!1)}}};i.addDropdown(u=>{r=u;let f=(this.plugin.settings.zoteroUserId||"0").trim()||"0";u.addOption(f,"Loading..."),u.setValue(f),u.onChange(async k=>{this.plugin.settings.zoteroUserId=k.trim(),await this.plugin.saveSettings()})}),i.addButton(u=>{u.setButtonText("Refresh").onClick(async()=>{await a()})}),a(),g.createEl("h2",{text:"Zotero Web API"}),new L.Setting(g).setName("Web API base URL").setDesc("Zotero Web API base URL for write fallback, e.g. https://api.zotero.org").addText(u=>u.setPlaceholder("https://api.zotero.org").setValue(this.plugin.settings.webApiBaseUrl).onChange(async f=>{this.plugin.settings.webApiBaseUrl=f.trim(),await this.plugin.saveSettings()})),new L.Setting(g).setName("Web API library type").setDesc("Library type for Web API writes.").addDropdown(u=>u.addOption("user","user").addOption("group","group").setValue(this.plugin.settings.webApiLibraryType).onChange(async f=>{this.plugin.settings.webApiLibraryType=f,await this.plugin.saveSettings()})),new L.Setting(g).setName("Web API library ID").setDesc("Numeric Zotero user/group ID for Web API writes.").addText(u=>u.setPlaceholder("15218").setValue(this.plugin.settings.webApiLibraryId).onChange(async f=>{this.plugin.settings.webApiLibraryId=f.trim(),await this.plugin.saveSettings()})),new L.Setting(g).setName("Web API key").setDesc("Zotero API key for write fallback (from zotero.org).").addText(u=>{t(u),u.setPlaceholder("your-api-key").setValue(this.plugin.settings.webApiKey).onChange(async f=>{this.plugin.settings.webApiKey=f.trim(),await this.plugin.saveSettings()})}),g.createEl("h2",{text:"Output"}),new L.Setting(g).setName("PDF folder").addText(u=>u.setPlaceholder("zotero/pdfs").setValue(this.plugin.settings.outputPdfDir).onChange(async f=>{this.plugin.settings.outputPdfDir=f.trim(),await this.plugin.saveSettings()})),new L.Setting(g).setName("Notes folder").addText(u=>u.setPlaceholder("zotero/notes").setValue(this.plugin.settings.outputNoteDir).onChange(async f=>{this.plugin.settings.outputNoteDir=f.trim(),await this.plugin.saveSettings()})),new L.Setting(g).setName("Frontmatter template").setDesc("Template for note YAML frontmatter. Use {{var}} placeholders; leave blank to omit.").addTextArea(u=>{u.setValue(this.plugin.settings.frontmatterTemplate).onChange(async f=>{this.plugin.settings.frontmatterTemplate=f,await this.plugin.saveSettings()}),u.inputEl.rows=10,u.inputEl.style.width="100%"}),new L.Setting(g).setName("Tag sanitization").setDesc("Normalize Zotero tags for Obsidian (no spaces, punctuation trimmed).").addDropdown(u=>u.addOption("none","No change").addOption("camel","camelCase").addOption("pascal","PascalCase").addOption("snake","snake_case").addOption("kebab","kebab-case").setValue(this.plugin.settings.tagSanitizeMode==="replace"?"kebab":this.plugin.settings.tagSanitizeMode).onChange(async f=>{this.plugin.settings.tagSanitizeMode=f,await this.plugin.saveSettings()})),new L.Setting(g).setName("Note body template").setDesc("Template for the note body after frontmatter. Use {{pdf_block}} and {{docling_markdown}} placeholders.").addTextArea(u=>{u.setValue(this.plugin.settings.noteBodyTemplate).onChange(async f=>{this.plugin.settings.noteBodyTemplate=f,await this.plugin.saveSettings()}),u.inputEl.rows=8,u.inputEl.style.width="100%"}),g.createEl("h2",{text:"LLM Provider Profiles"});let o=g.createDiv({cls:"zrr-llm-profiles"}),c=()=>{o.empty();let u=e();u.length||o.createEl("p",{text:"No profiles yet. Add one below."});for(let f of u){let k=o.createEl("details",{cls:"zrr-profile"});u.length===1&&(k.open=!0);let M=k.createEl("summary",{text:f.name||f.id||"Profile"});M.addClass("zrr-profile-title");let te=k.createDiv({cls:"zrr-profile-body"});new L.Setting(te).setName("Profile name").addText(Q=>Q.setPlaceholder("My provider").setValue(f.name||"").onChange(async ee=>{f.name=ee.trim(),M.textContent=f.name||f.id||"Profile",await n(e())})),new L.Setting(te).setName("Base URL").addText(Q=>Q.setPlaceholder("http://localhost:1234/v1").setValue(f.baseUrl||"").onChange(async ee=>{f.baseUrl=ee.trim(),await n(e())})),new L.Setting(te).setName("API key").setDesc("Stored in settings (not encrypted).").addText(Q=>{t(Q),Q.setPlaceholder("sk-...").setValue(f.apiKey||"").onChange(async ee=>{f.apiKey=ee.trim(),await n(e())})}),new L.Setting(te).setName("Remove profile").setDesc("Deletes this saved profile.").addButton(Q=>Q.setButtonText("Delete profile").onClick(async()=>{let ee=e().filter(oe=>oe.id!==f.id);this.plugin.settings.embedProviderProfileId=this.plugin.settings.embedProviderProfileId===f.id?"":this.plugin.settings.embedProviderProfileId,this.plugin.settings.chatProviderProfileId=this.plugin.settings.chatProviderProfileId===f.id?"":this.plugin.settings.chatProviderProfileId,this.plugin.settings.llmCleanupProviderProfileId=this.plugin.settings.llmCleanupProviderProfileId===f.id?"":this.plugin.settings.llmCleanupProviderProfileId,await n(ee),c()}))}new L.Setting(o).addButton(f=>f.setButtonText("Add profile").onClick(async()=>{let k=`profile-${Date.now().toString(36)}`,M=e().concat([{id:k,name:"Custom",baseUrl:"",apiKey:""}]);await n(M),c()}))};c(),new L.Setting(g).setName("Saved chats folder").setDesc("Where exported chat notes are stored (vault-relative).").addText(u=>u.setPlaceholder("zotero/chats").setValue(this.plugin.settings.chatOutputDir).onChange(async f=>{this.plugin.settings.chatOutputDir=f.trim()||"zotero/chats",await this.plugin.saveSettings()})),new L.Setting(g).setName("Copy PDFs into vault").setDesc("Disable to use Zotero storage paths directly. If a local file path is unavailable, the plugin temporarily copies the PDF into the vault for processing.").addToggle(u=>u.setValue(this.plugin.settings.copyPdfToVault).onChange(async f=>{this.plugin.settings.copyPdfToVault=f,!f&&this.plugin.settings.createOcrLayeredPdf&&(this.plugin.settings.createOcrLayeredPdf=!1),await this.plugin.saveSettings(),this.display()})),new L.Setting(g).setName("Create OCR-layered PDF copy").setDesc("When OCR is used, replace the vault PDF with a Tesseract text layer (requires Copy PDFs into vault).").addToggle(u=>{let f=this.plugin.settings.copyPdfToVault;u.setValue(f?this.plugin.settings.createOcrLayeredPdf:!1).setDisabled(!f).onChange(async k=>{if(!this.plugin.settings.copyPdfToVault){this.plugin.settings.createOcrLayeredPdf=!1,await this.plugin.saveSettings();return}this.plugin.settings.createOcrLayeredPdf=k,await this.plugin.saveSettings()})}),new L.Setting(g).setName("Prefer Obsidian note for citations").setDesc("Link citations to the Obsidian note when available; otherwise use Zotero deep links.").addToggle(u=>u.setValue(this.plugin.settings.preferObsidianNoteForCitations).onChange(async f=>{this.plugin.settings.preferObsidianNoteForCitations=f,await this.plugin.saveSettings()})),g.createEl("h2",{text:"Docling"}),new L.Setting(g).setName("OCR mode").setDesc("auto: skip OCR when text is readable; force if bad: OCR only when text looks poor; force: always OCR.").addDropdown(u=>u.addOption("auto","auto").addOption("force_low_quality","force if quality is bad").addOption("force","force").setValue(this.plugin.settings.ocrMode).onChange(async f=>{this.plugin.settings.ocrMode=f,await this.plugin.saveSettings()})),new L.Setting(g).setName("Text quality threshold").setDesc("Lower values are stricter; below this threshold the text is treated as low quality.").addSlider(u=>{u.setLimits(0,1,.05).setValue(this.plugin.settings.ocrQualityThreshold).setDynamicTooltip().onChange(async f=>{this.plugin.settings.ocrQualityThreshold=f,await this.plugin.saveSettings()})}),new L.Setting(g).setName("Chunking").setDesc("page or section").addDropdown(u=>u.addOption("page","page").addOption("section","section").setValue(this.plugin.settings.chunkingMode).onChange(async f=>{this.plugin.settings.chunkingMode=f,await this.plugin.saveSettings()})),g.createEl("h2",{text:"OCR cleanup"}),new L.Setting(g).setName("LLM cleanup for low-quality chunks").setDesc("Automatic AI cleanup for poor OCR at import. Can be slow/costly.").addToggle(u=>u.setValue(this.plugin.settings.enableLlmCleanup).onChange(async f=>{this.plugin.settings.enableLlmCleanup=f,await this.plugin.saveSettings()}));let l=null,d=null,h=null,_=async()=>{},m=async(u,f=!0)=>{let k=u.trim();this.plugin.settings.llmCleanupBaseUrl=k,f&&(this.plugin.settings.llmCleanupProviderProfileId="",l&&l.setValue("custom")),d&&d.setValue(k),await this.plugin.saveSettings()},y=async u=>{let f=e().find(k=>k.id===u);this.plugin.settings.llmCleanupProviderProfileId=u,f&&(this.plugin.settings.llmCleanupBaseUrl=f.baseUrl,this.plugin.settings.llmCleanupApiKey=f.apiKey,d==null||d.setValue(f.baseUrl),h==null||h.setValue(f.apiKey)),await this.plugin.saveSettings(),await _()};new L.Setting(g).setName("LLM cleanup provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(u=>{l=u,u.addOption("custom","Custom (manual)");for(let k of e())u.addOption(k.id,k.name||k.id);let f=this.plugin.settings.llmCleanupProviderProfileId;u.setValue(f&&e().some(k=>k.id===f)?f:"custom"),u.onChange(async k=>{if(k==="custom"){this.plugin.settings.llmCleanupProviderProfileId="",await this.plugin.saveSettings();return}await y(k)})}),new L.Setting(g).setName("LLM cleanup base URL").setDesc("OpenAI-compatible endpoint, e.g. http://127.0.0.1:1234/v1").addText(u=>{d=u,u.setPlaceholder("http://127.0.0.1:1234/v1").setValue(this.plugin.settings.llmCleanupBaseUrl).onChange(async f=>{await m(f)})}),new L.Setting(g).setName("LLM cleanup API key").setDesc("Optional API key for the cleanup endpoint.").addText(u=>{h=u,t(u),u.setPlaceholder("sk-...").setValue(this.plugin.settings.llmCleanupApiKey).onChange(async f=>{this.plugin.settings.llmCleanupApiKey=f.trim(),this.plugin.settings.llmCleanupProviderProfileId="",l&&l.setValue("custom"),await this.plugin.saveSettings()})});let x=new L.Setting(g).setName("LLM cleanup model").setDesc("Select a cleanup-capable model from the provider."),b=null,v=u=>{if(!b)return;let f=(this.plugin.settings.llmCleanupModel||"").trim(),k=new Set(u.map(M=>M.value));f&&!k.has(f)&&(u=u.concat([{value:f,label:`Custom (${f})`}])),b.selectEl.options.length=0;for(let M of u)b.addOption(M.value,M.label);f&&b.setValue(f)};_=async()=>{if(b){b.setDisabled(!0);try{let u=await this.plugin.fetchCleanupModelOptions();v(u)}finally{b.setDisabled(!1)}}},x.addDropdown(u=>{b=u;let f=(this.plugin.settings.llmCleanupModel||"").trim();u.addOption(f||"loading","Loading..."),u.setValue(f||"loading"),u.onChange(async k=>{this.plugin.settings.llmCleanupModel=k.trim(),await this.plugin.saveSettings()})}),x.addButton(u=>{u.setButtonText("Refresh").onClick(async()=>{await _()})}),_(),new L.Setting(g).setName("LLM cleanup temperature").setDesc("Lower is more conservative.").addText(u=>u.setPlaceholder("0.0").setValue(String(this.plugin.settings.llmCleanupTemperature)).onChange(async f=>{let k=Number.parseFloat(f);this.plugin.settings.llmCleanupTemperature=Number.isFinite(k)?k:0,await this.plugin.saveSettings()})),new L.Setting(g).setName("LLM cleanup min quality").setDesc("Only run cleanup when chunk quality is below this threshold (0-1).").addSlider(u=>u.setLimits(0,1,.05).setValue(this.plugin.settings.llmCleanupMinQuality).setDynamicTooltip().onChange(async f=>{this.plugin.settings.llmCleanupMinQuality=f,await this.plugin.saveSettings()})),new L.Setting(g).setName("LLM cleanup max chars").setDesc("Skip cleanup for chunks longer than this limit.").addText(u=>u.setPlaceholder("2000").setValue(String(this.plugin.settings.llmCleanupMaxChars)).onChange(async f=>{let k=Number.parseInt(f,10);this.plugin.settings.llmCleanupMaxChars=Number.isFinite(k)?k:2e3,await this.plugin.saveSettings()})),g.createEl("h2",{text:"Text Embedding"});let C=null,S=null,A=null,N=async()=>{},R=async(u,f=!0)=>{let k=u.trim();this.plugin.settings.embedBaseUrl=k,f&&(this.plugin.settings.embedProviderProfileId="",C&&C.setValue("custom")),S&&S.setValue(k),await this.plugin.saveSettings()},z=async u=>{let f=e().find(k=>k.id===u);this.plugin.settings.embedProviderProfileId=u,f&&(this.plugin.settings.embedBaseUrl=f.baseUrl,this.plugin.settings.embedApiKey=f.apiKey,S==null||S.setValue(f.baseUrl),A==null||A.setValue(f.apiKey)),await this.plugin.saveSettings(),await N()};new L.Setting(g).setName("Embeddings provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(u=>{C=u,u.addOption("custom","Custom (manual)");for(let k of e())u.addOption(k.id,k.name||k.id);let f=this.plugin.settings.embedProviderProfileId;u.setValue(f&&e().some(k=>k.id===f)?f:"custom"),u.onChange(async k=>{if(k==="custom"){this.plugin.settings.embedProviderProfileId="",await this.plugin.saveSettings();return}await z(k)})}),new L.Setting(g).setName("Embeddings base URL").addText(u=>{S=u,u.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.embedBaseUrl).onChange(async f=>{await R(f)})}),new L.Setting(g).setName("Embeddings API key").addText(u=>{A=u,t(u),u.setPlaceholder("lm-studio").setValue(this.plugin.settings.embedApiKey).onChange(async f=>{this.plugin.settings.embedApiKey=f.trim(),this.plugin.settings.embedProviderProfileId="",C&&C.setValue("custom"),await this.plugin.saveSettings()})});let E=new L.Setting(g).setName("Embeddings model").setDesc("Select an embeddings model from the provider."),O=null,T=u=>{if(!O)return;let f=(this.plugin.settings.embedModel||"").trim(),k=new Set(u.map(M=>M.value));f&&!k.has(f)&&(u=u.concat([{value:f,label:`Custom (${f})`}])),O.selectEl.options.length=0;for(let M of u)O.addOption(M.value,M.label);f&&O.setValue(f)};N=async()=>{if(O){O.setDisabled(!0);try{let u=await this.plugin.fetchEmbeddingModelOptions();T(u)}finally{O.setDisabled(!1)}}},E.addDropdown(u=>{O=u;let f=(this.plugin.settings.embedModel||"").trim();u.addOption(f||"loading","Loading..."),u.setValue(f||"loading"),u.onChange(async k=>{this.plugin.settings.embedModel=k.trim(),await this.plugin.saveSettings()})}),E.addButton(u=>{u.setButtonText("Refresh").onClick(async()=>{await N()})}),N(),new L.Setting(g).setName("Include metadata in embeddings").setDesc("Prepend title/authors/tags/section info before embedding chunks.").addToggle(u=>u.setValue(this.plugin.settings.embedIncludeMetadata).onChange(async f=>{this.plugin.settings.embedIncludeMetadata=f,await this.plugin.saveSettings()})),new L.Setting(g).setName("Embedding subchunk size (chars)").setDesc("Split long chunks into smaller subchunks for embedding only (0 disables).").addText(u=>u.setPlaceholder("1800").setValue(String(this.plugin.settings.embedSubchunkChars)).onChange(async f=>{let k=Number.parseInt(f,10);this.plugin.settings.embedSubchunkChars=Number.isFinite(k)?Math.max(0,k):3500,await this.plugin.saveSettings()})),new L.Setting(g).setName("Embedding subchunk overlap (chars)").setDesc("Overlap between embedding subchunks to keep context intact.").addText(u=>u.setPlaceholder("200").setValue(String(this.plugin.settings.embedSubchunkOverlap)).onChange(async f=>{let k=Number.parseInt(f,10);this.plugin.settings.embedSubchunkOverlap=Number.isFinite(k)?Math.max(0,k):200,await this.plugin.saveSettings()})),new L.Setting(g).setName("Generate LLM tags for chunks").setDesc("Use the OCR cleanup model to tag chunks before indexing.").addToggle(u=>u.setValue(this.plugin.settings.enableChunkTagging).onChange(async f=>{this.plugin.settings.enableChunkTagging=f,await this.plugin.saveSettings()})),g.createEl("h2",{text:"Chat LLM"});let F=null,V=null,Y=null,X=async()=>{},D=async(u,f=!0)=>{let k=u.trim();this.plugin.settings.chatBaseUrl=k,f&&(this.plugin.settings.chatProviderProfileId="",F&&F.setValue("custom")),V&&V.setValue(k),await this.plugin.saveSettings()},I=async u=>{let f=e().find(k=>k.id===u);this.plugin.settings.chatProviderProfileId=u,f&&(this.plugin.settings.chatBaseUrl=f.baseUrl,this.plugin.settings.chatApiKey=f.apiKey,V==null||V.setValue(f.baseUrl),Y==null||Y.setValue(f.apiKey)),await this.plugin.saveSettings(),await X()};new L.Setting(g).setName("Chat provider profile").setDesc("Select a profile to populate base URL and API key.").addDropdown(u=>{F=u,u.addOption("custom","Custom (manual)");for(let k of e())u.addOption(k.id,k.name||k.id);let f=this.plugin.settings.chatProviderProfileId;u.setValue(f&&e().some(k=>k.id===f)?f:"custom"),u.onChange(async k=>{if(k==="custom"){this.plugin.settings.chatProviderProfileId="",await this.plugin.saveSettings();return}await I(k)})}),new L.Setting(g).setName("Chat base URL").setDesc("OpenAI-compatible base URL for chat requests.").addText(u=>{V=u,u.setPlaceholder("http://localhost:1234/v1").setValue(this.plugin.settings.chatBaseUrl).onChange(async f=>{await D(f)})}),new L.Setting(g).setName("Chat API key").addText(u=>{Y=u,t(u),u.setPlaceholder("lm-studio").setValue(this.plugin.settings.chatApiKey).onChange(async f=>{this.plugin.settings.chatApiKey=f.trim(),this.plugin.settings.chatProviderProfileId="",F&&F.setValue("custom"),await this.plugin.saveSettings()})});let B=new L.Setting(g).setName("Chat model").setDesc("Select a chat-capable model from the provider."),G=null,ae=u=>{if(!G)return;let f=(this.plugin.settings.chatModel||"").trim(),k=new Set(u.map(M=>M.value));f&&!k.has(f)&&(u=u.concat([{value:f,label:`Custom (${f})`}])),G.selectEl.options.length=0;for(let M of u)G.addOption(M.value,M.label);f&&G.setValue(f)};X=async()=>{if(G){G.setDisabled(!0);try{let u=await this.plugin.fetchChatModelOptions();ae(u)}finally{G.setDisabled(!1)}}},B.addDropdown(u=>{G=u;let f=(this.plugin.settings.chatModel||"").trim();u.addOption(f||"loading","Loading..."),u.setValue(f||"loading"),u.onChange(async k=>{this.plugin.settings.chatModel=k.trim(),await this.plugin.saveSettings()})}),B.addButton(u=>{u.setButtonText("Refresh").onClick(async()=>{await X()})}),X(),new L.Setting(g).setName("Temperature").addText(u=>u.setPlaceholder("0.2").setValue(String(this.plugin.settings.chatTemperature)).onChange(async f=>{let k=Number.parseFloat(f);this.plugin.settings.chatTemperature=Number.isFinite(k)?k:.2,await this.plugin.saveSettings()})),new L.Setting(g).setName("Chat history messages").setDesc("Number of recent messages to include for conversational continuity (0 disables).").addText(u=>u.setPlaceholder("6").setValue(String(this.plugin.settings.chatHistoryMessages)).onChange(async f=>{let k=Number.parseInt(f,10);this.plugin.settings.chatHistoryMessages=Number.isFinite(k)?Math.max(0,k):6,await this.plugin.saveSettings()})),new L.Setting(g).setName("Chat panel location").setDesc("Where to open the chat view by default.").addDropdown(u=>u.addOption("right","Right sidebar").addOption("main","Main window").setValue(this.plugin.settings.chatPaneLocation).onChange(async f=>{this.plugin.settings.chatPaneLocation=f,await this.plugin.saveSettings()})),g.createEl("h2",{text:"Logging"}),new L.Setting(g).setName("Enable logging to file").setDesc("Write plugin logs to a file.").addToggle(u=>u.setValue(this.plugin.settings.enableFileLogging).onChange(async f=>{this.plugin.settings.enableFileLogging=f,await this.plugin.saveSettings()})),new L.Setting(g).setName("Log file path (vault-relative)").setDesc("Where to write the log file. Keep inside the vault.").addText(u=>u.setPlaceholder(`${W}/logs/docling_extract.log`).setValue(this.plugin.settings.logFilePath).onChange(async f=>{this.plugin.settings.logFilePath=f.trim()||`${W}/logs/docling_extract.log`,await this.plugin.saveSettings()})),new L.Setting(g).setName("View or clear log").setDesc("Open the log file or clear it.").addButton(u=>u.setButtonText("Open log").onClick(async()=>{var f,k;await((k=(f=this.plugin).openLogFile)==null?void 0:k.call(f))})).addButton(u=>u.setButtonText("Clear log").onClick(async()=>{var f,k;await((k=(f=this.plugin).clearLogFile)==null?void 0:k.call(f))})),g.createEl("h2",{text:"Maintenance"}),new L.Setting(g).setName("Reindex Redis from cached chunks").setDesc("Rebuild the Redis index from cached chunk JSON files.").addButton(u=>u.setButtonText("Reindex").onClick(async()=>{await this.plugin.reindexRedisFromCache()})),new L.Setting(g).setName("Recreate missing notes from cache").setDesc("Rebuild missing notes using cached Zotero items and chunks.").addButton(u=>u.setButtonText("Recreate").onClick(async()=>{await this.plugin.recreateMissingNotesFromCache()})).addButton(u=>u.setButtonText("Cancel").onClick(()=>{this.plugin.cancelRecreateMissingNotesFromCache()}))}};var we={"zrr-picker":`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
`};var qe={"docling_extract.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.3.4
import argparse
import json
import math
import logging
import os
import re
import shutil
import sys
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Set, Tuple
import langcodes
import warnings

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
    sys.stderr.write(message + "\\n")


ProgressCallback = Callable[[int, str, str], None]


def make_progress_emitter(enabled: bool) -> ProgressCallback:
    if not enabled:
        def _noop(percent: int, stage: str, message: str) -> None:
            return None
        return _noop

    def _emit(percent: int, stage: str, message: str) -> None:
        payload = {
            "type": "progress",
            "percent": max(0, min(100, int(percent))),
            "stage": stage,
            "message": message,
        }
        print(json.dumps(payload), flush=True)

    return _emit


@dataclass
class DoclingProcessingConfig:
    ocr_mode: str = "auto"
    prefer_ocr_engine: str = "tesseract"
    fallback_ocr_engine: str = "paddle"
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
    postprocess_markdown: bool = True
    analysis_max_pages: int = 5
    analysis_sample_strategy: str = "middle"
    ocr_dpi: int = 300
    ocr_overlay_dpi: int = 400
    paddle_max_dpi: int = 300
    paddle_target_max_side_px: int = 3500
    paddle_use_doc_orientation_classify: bool = True
    paddle_use_doc_unwarping: bool = False
    paddle_use_textline_orientation: bool = False
    paddle_use_structure_v3: bool = False
    paddle_structure_version: str = "PP-StructureV3"
    paddle_structure_header_ratio: float = 0.05
    paddle_structure_footer_ratio: float = 0.05
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

    tokens = re.findall(r"[A-Za-z0-9]+", " ".join(texts))
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
    if quality.confidence_proxy < config.quality_confidence_threshold:
        return True
    return (
        quality.avg_chars_per_page < config.quality_min_avg_chars_per_page
        or quality.alpha_ratio < config.quality_alpha_ratio_threshold
        or quality.suspicious_token_ratio > config.quality_suspicious_token_threshold
    )


def should_rasterize_text_layer(has_text_layer: bool, low_quality: bool, config: DoclingProcessingConfig) -> bool:
    if config.ocr_mode == "force":
        return True
    return bool(has_text_layer and low_quality and config.force_ocr_on_low_quality_text)


def decide_per_page_ocr(
    has_text_layer: bool,
    quality: TextQuality,
    config: DoclingProcessingConfig,
) -> Tuple[bool, str]:
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
    elif has_text_layer and not (config.force_ocr_on_low_quality_text and low_quality):
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
        }
        lang_code = None
        lang = (languages or "").lower()
        if any(t in lang for t in ("de", "deu", "german", "deutsch")):
            lang_code = "de_DE"
        elif any(t in lang for t in ("en", "eng", "english")):
            lang_code = "en_US"
        elif any(t in lang for t in ("fr", "fra", "french", "francais")):
            lang_code = "fr_FR"
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
    current_lines: List[str] = []

    def flush() -> None:
        nonlocal current_title, current_lines
        if current_title or current_lines:
            sections.append({
                "title": current_title.strip(),
                "text": "\\n".join(current_lines).strip(),
            })
        current_title = ""
        current_lines = []

    for line in markdown.splitlines():
        if line.startswith("#"):
            flush()
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


def ocr_pages_with_paddle_structure(
    images: Sequence[Any],
    languages: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    def _check_ppstructure_deps() -> None:
        missing: List[str] = []
        for module_name in ("cv2", "pyclipper", "shapely", "paddlex"):
            try:
                __import__(module_name)
            except Exception:
                missing.append(module_name)
        if missing:
            raise RuntimeError(
                "PP-Structure dependencies missing: "
                + ", ".join(missing)
                + ". Install them in the plugin venv."
            )

    def _resolve_ppstructure():
        import importlib
        import pkgutil

        candidates = [
            ("paddleocr", "PPStructure"),
            ("paddleocr", "PPStructureV3"),
            ("paddleocr.ppstructure", "PPStructure"),
            ("paddleocr.ppstructure", "PPStructureV3"),
            ("paddleocr.ppstructure.predict_system", "PPStructure"),
            ("paddleocr.ppstructure.predict_system", "StructureSystem"),
            ("paddleocr._pipelines", "PPStructure"),
            ("paddleocr._pipelines", "PPStructureV3"),
            ("paddleocr._pipelines", "StructureSystem"),
        ]
        for module_name, attr_name in candidates:
            try:
                module = importlib.import_module(module_name)
            except Exception:
                continue
            if hasattr(module, attr_name):
                LOGGER.info("PPStructure resolved from %s.%s", module_name, attr_name)
                return getattr(module, attr_name)

        try:
            pipelines = importlib.import_module("paddleocr._pipelines")
        except Exception:
            pipelines = None
        if pipelines and hasattr(pipelines, "__path__"):
            for modinfo in pkgutil.walk_packages(pipelines.__path__, pipelines.__name__ + "."):
                if "structure" not in modinfo.name:
                    continue
                try:
                    module = importlib.import_module(modinfo.name)
                except Exception:
                    continue
                for attr_name in ("PPStructure", "PPStructureV3", "StructureSystem"):
                    if hasattr(module, attr_name):
                        LOGGER.info("PPStructure resolved from %s.%s", modinfo.name, attr_name)
                        return getattr(module, attr_name)
        raise RuntimeError(
            "PPStructure not available in paddleocr; install a version that ships PPStructure."
        )

    _check_ppstructure_deps()
    PPStructure = _resolve_ppstructure()
    structure_name = getattr(PPStructure, "__name__", "")
    structure_module = getattr(PPStructure, "__module__", "")
    use_v3 = "v3" in structure_name.lower() or "pp_structurev3" in structure_module.lower()

    try:
        import numpy as np
    except Exception as exc:
        raise RuntimeError(f"numpy is required for PPStructure: {exc}") from exc

    if use_v3:
        structure_kwargs: Dict[str, Any] = {"lang": languages}
        if config.paddle_target_max_side_px > 0:
            structure_kwargs["text_det_limit_side_len"] = config.paddle_target_max_side_px
            structure_kwargs["text_det_limit_type"] = "max"
        if config.paddle_use_textline_orientation:
            structure_kwargs["use_textline_orientation"] = True
        if config.paddle_use_doc_orientation_classify:
            structure_kwargs["use_doc_orientation_classify"] = True
        if config.paddle_use_doc_unwarping:
            structure_kwargs["use_doc_unwarping"] = True
    else:
        structure_kwargs = {
            "lang": languages,
            "layout": True,
            "ocr": True,
            "show_log": False,
        }
        if config.paddle_use_textline_orientation:
            structure_kwargs["use_textline_orientation"] = True
        if config.paddle_use_doc_orientation_classify:
            structure_kwargs["use_doc_orientation_classify"] = True
        if config.paddle_use_doc_unwarping:
            structure_kwargs["use_doc_unwarping"] = True
        if config.paddle_structure_version:
            structure_kwargs["structure_version"] = config.paddle_structure_version

    def _create_structure(kwargs: Dict[str, Any]) -> Any:
        return PPStructure(**kwargs)

    structure = None
    try:
        structure = _create_structure(structure_kwargs)
    except TypeError:
        reduced_kwargs = dict(structure_kwargs)
        reduced_kwargs.pop("use_textline_orientation", None)
        reduced_kwargs.pop("use_doc_orientation_classify", None)
        reduced_kwargs.pop("use_doc_unwarping", None)
        reduced_kwargs.pop("text_det_limit_side_len", None)
        reduced_kwargs.pop("text_det_limit_type", None)
        try:
            structure = _create_structure(reduced_kwargs)
        except TypeError:
            reduced_kwargs.pop("structure_version", None)
            structure = _create_structure(reduced_kwargs)
        except Exception as exc:
            LOGGER.exception("PP-Structure init failed with reduced kwargs: %s", exc)
            raise
    except Exception as exc:
        LOGGER.exception("PP-Structure init failed: %s", exc)
        raise

    def _run_structure(structure_obj: Any, image_arr: Any) -> Any:
        if callable(structure_obj):
            return structure_obj(image_arr)
        predict = getattr(structure_obj, "predict", None)
        if callable(predict):
            try:
                return predict(image_arr)
            except Exception:
                return predict([image_arr])
        paddlex_pipeline = getattr(structure_obj, "paddlex_pipeline", None)
        pipeline_predict = getattr(paddlex_pipeline, "predict", None)
        if callable(pipeline_predict):
            try:
                return pipeline_predict(image_arr)
            except Exception:
                return pipeline_predict([image_arr])
        raise RuntimeError("PP-Structure instance is not callable and has no predict method.")

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

    def _strip_html(text: str) -> str:
        return re.sub(r"<[^>]+>", " ", text)

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
                    item = item.strip()
                    if item:
                        lines.append(item)
                    continue
                if isinstance(item, dict):
                    text_val = item.get("text")
                    if isinstance(text_val, str):
                        text_val = text_val.strip()
                        if text_val:
                            lines.append(text_val)
            return lines
        return []

    def _extract_bbox(block: Dict[str, Any]) -> Optional[Tuple[float, float, float, float]]:
        bbox = block.get("bbox") or block.get("box") or block.get("points")
        if bbox is None:
            return None
        if isinstance(bbox, dict):
            try:
                x0 = float(bbox.get("x0", bbox.get("left", 0.0)))
                y0 = float(bbox.get("y0", bbox.get("top", 0.0)))
                x1 = float(bbox.get("x1", bbox.get("right", 0.0)))
                y1 = float(bbox.get("y1", bbox.get("bottom", 0.0)))
                return x0, y0, x1, y1
            except Exception:
                return None
        if isinstance(bbox, (list, tuple)):
            if len(bbox) == 4 and all(isinstance(v, (int, float)) for v in bbox):
                x0, y0, x1, y1 = bbox
                return float(x0), float(y0), float(x1), float(y1)
            if len(bbox) >= 4 and all(isinstance(v, (list, tuple)) for v in bbox):
                xs = []
                ys = []
                for pt in bbox:
                    if len(pt) < 2:
                        continue
                    xs.append(float(pt[0]))
                    ys.append(float(pt[1]))
                if xs and ys:
                    return min(xs), min(ys), max(xs), max(ys)
            if len(bbox) >= 8 and all(isinstance(v, (int, float)) for v in bbox):
                xs = [float(v) for v in bbox[0::2]]
                ys = [float(v) for v in bbox[1::2]]
                if xs and ys:
                    return min(xs), min(ys), max(xs), max(ys)
        return None

    def _is_header_footer(bbox: Optional[Tuple[float, float, float, float]], page_h: float) -> bool:
        if not bbox or page_h <= 0:
            return False
        _, y0, _, y1 = bbox
        top_band = max(0.0, float(config.paddle_structure_header_ratio))
        bottom_band = max(0.0, float(config.paddle_structure_footer_ratio))
        if top_band > 0 and y1 <= page_h * top_band:
            return True
        if bottom_band > 0 and y0 >= page_h * (1.0 - bottom_band):
            return True
        return False

    pages: List[Dict[str, Any]] = []
    total = max(1, len(images))
    total_pages = len(images)
    removed_total = 0
    repeat_threshold = 0
    repeated_clusters: List[BoilerplateCluster] = []
    page_records: List[Dict[str, Any]] = []
    edge_candidates: List[List[str]] = []

    for idx, image in enumerate(images, start=1):
        LOGGER.info("PP-Structure page %d/%d: layout start", idx, total)
        t_start = time.perf_counter()
        result = _run_structure(structure, np.array(image))
        if isinstance(result, dict):
            blocks = (
                result.get("layout")
                or result.get("blocks")
                or result.get("result")
                or result.get("items")
                or []
            )
        elif hasattr(result, "layout"):
            blocks = getattr(result, "layout", []) or []
        else:
            blocks = result if isinstance(result, list) else []
        elapsed = time.perf_counter() - t_start
        LOGGER.info(
            "PP-Structure page %d/%d: layout done in %.2fs (blocks=%d)",
            idx,
            total,
            elapsed,
            len(blocks),
        )
        page_h = float(getattr(image, "height", 0.0) or 0.0)
        record_blocks: List[Dict[str, Any]] = []
        edge_lines: List[str] = []
        for block in blocks:
            block_dict = _block_to_dict(block)
            if not block_dict:
                continue
            block_type = str(
                block_dict.get("type")
                or block_dict.get("label")
                or block_dict.get("category")
                or ""
            ).lower()
            block_lines = _extract_block_lines(block_dict)
            if not block_lines:
                continue
            bbox = _extract_bbox(block_dict)
            is_edge = _is_header_footer(bbox, page_h)
            if is_edge:
                edge_lines.append(" ".join(block_lines).strip())
            record_blocks.append(
                {
                    "type": block_type,
                    "lines": block_lines,
                    "edge": is_edge,
                }
            )
        page_records.append({"page_num": idx, "blocks": record_blocks})
        if config.enable_boilerplate_removal and edge_lines:
            edge_candidates.append([line for line in edge_lines if line])

    if config.enable_boilerplate_removal and total_pages >= config.boilerplate_min_pages:
        repeated_clusters, repeat_threshold = detect_repeated_line_clusters(
            edge_candidates,
            total_pages,
            config,
        )

    for record in page_records:
        lines_out: List[str] = []
        for block in record["blocks"]:
            block_lines = block["lines"]
            block_text = " ".join(block_lines).strip()
            if not block_text:
                continue
            if config.enable_boilerplate_removal and block["edge"]:
                normalized = normalize_boilerplate_line(block_text)
                if matches_repeated_cluster(block_text, repeated_clusters, config) or is_boilerplate_line(normalized):
                    removed_total += 1
                    continue
            if block["type"] in ("title", "header", "heading"):
                lines_out.append(f"# {block_text}")
            else:
                lines_out.append("\\n".join(block_lines))
        pages.append({"page_num": record["page_num"], "text": "\\n\\n".join(lines_out).strip()})
        if progress_cb and progress_span > 0:
            percent = progress_base + int(record["page_num"] / total * progress_span)
            progress_cb(percent, "layout", f"Paddle layout page {record['page_num']}/{total}")

    if removed_total and config.enable_boilerplate_removal:
        LOGGER.info(
            "Boilerplate removal (PP-Structure): removed %s blocks (repeat_threshold=%s, repeated_lines=%s)",
            removed_total,
            repeat_threshold,
            len(repeated_clusters),
        )
    LOGGER.info(
        "PP-Structure OCR complete: pages=%d, text_chars=%d",
        len(pages),
        ocr_pages_text_chars(pages),
    )

    return pages, {"layout_used": True, "layout_model": config.paddle_structure_version}


def ocr_pages_with_paddle(
    images: Sequence[Any],
    languages: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
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

    def _create_ocr(kwargs: Dict[str, Any], use_textline_orientation: bool) -> PaddleOCR:
        return PaddleOCR(use_textline_orientation=use_textline_orientation, **kwargs)

    def _try_create(kwargs: Dict[str, Any], use_textline_orientation: bool) -> Optional[PaddleOCR]:
        try:
            return _create_ocr(kwargs, use_textline_orientation)
        except TypeError:
            return None

    ocr = _try_create(ocr_kwargs, config.paddle_use_textline_orientation)
    if ocr is None:
        reduced_kwargs = dict(ocr_kwargs)
        reduced_kwargs.pop("use_doc_orientation_classify", None)
        reduced_kwargs.pop("use_doc_unwarping", None)
        ocr = _try_create(reduced_kwargs, config.paddle_use_textline_orientation)
    if ocr is None:
        ocr = _create_ocr(ocr_kwargs, config.paddle_use_textline_orientation)
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
    total_pages = len(images)
    repeat_threshold = 0
    repeated_clusters: List[BoilerplateCluster] = []
    page_edge_candidates: List[List[str]] = []

    for idx, image in enumerate(images, start=1):
        if config.enable_boilerplate_removal:
            LOGGER.info("Paddle OCR prepass %d/%d: start", idx, total_pages)
        t_start = time.perf_counter()
        edge_lines: List[Tuple[str, float]] = []
        result = None
        image_arr = _image_to_array(image)
        try:
            result = ocr.predict(image_arr)  # type: ignore[attr-defined]
        except Exception as exc:
            LOGGER.debug("PaddleOCR predict failed: %s", exc)
        if result:
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
        if config.enable_boilerplate_removal and edge_lines:
            page_edge_candidates.append(
                select_edge_texts_by_y(edge_lines, config.boilerplate_edge_lines)
            )
        if config.enable_boilerplate_removal:
            elapsed = time.perf_counter() - t_start
            LOGGER.info(
                "Paddle OCR prepass %d/%d: done in %.2fs (edge_lines=%d)",
                idx,
                total_pages,
                elapsed,
                len(edge_lines),
            )

    if config.enable_boilerplate_removal and total_pages >= config.boilerplate_min_pages:
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
        try:
            result = ocr.predict(image_arr)  # type: ignore[attr-defined]
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
        if config.enable_boilerplate_removal and blocks:
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

    if removed_total and config.enable_boilerplate_removal:
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


def ocr_pages_with_tesseract(
    images: Sequence[Any],
    languages: str,
    config: DoclingProcessingConfig,
    progress_cb: Optional[ProgressCallback] = None,
    progress_base: int = 0,
    progress_span: int = 0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
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
    repeated_clusters: List[BoilerplateCluster] = []
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
    if progress_cb and progress_span > 0:
        label = "Paddle OCR" if engine == "paddle" else "Tesseract OCR"
        progress_cb(progress_base, "ocr", f"{label} starting")
    if engine == "paddle" and config.paddle_use_structure_v3:
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
        if max_side_points and config.paddle_target_max_side_px > 0:
            target_dpi = int(config.paddle_target_max_side_px * 72 / max_side_points)
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
    if engine == "paddle":
        if config.paddle_use_structure_v3:
            try:
                return ocr_pages_with_paddle_structure(
                    images,
                    normalize_languages_for_engine(languages, engine),
                    config,
                    progress_cb,
                    progress_base,
                    progress_span,
                )
            except Exception as exc:
                LOGGER.warning("PP-StructureV3 failed; falling back to PaddleOCR: %s", exc)
        return ocr_pages_with_paddle(
            images,
            normalize_languages_for_engine(languages, engine),
            config,
            progress_cb,
            progress_base,
            progress_span,
        )
    if engine == "tesseract":
        return ocr_pages_with_tesseract(
            images,
            normalize_languages_for_engine(languages, engine),
            config,
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
    low_quality = is_low_quality(quality, config)
    text_layer_overlay = bool(
        has_text_layer
        and quality.image_page_ratio is not None
        and quality.image_page_ratio >= config.quality_image_page_ratio_threshold
    )
    if quality.image_page_ratio is not None:
        LOGGER.info(
            "Text-layer overlay: %s (img_pages=%.2f, threshold=%.2f)",
            text_layer_overlay,
            quality.image_page_ratio,
            config.quality_image_page_ratio_threshold,
        )
    return {
        "text_layer_detected": has_text_layer,
        "text_layer_low_quality": has_text_layer and low_quality,
        "text_layer_overlay": text_layer_overlay,
        "avg_chars_per_page": quality.avg_chars_per_page,
        "alpha_ratio": quality.alpha_ratio,
        "suspicious_token_ratio": quality.suspicious_token_ratio,
        "confidence_proxy": quality.confidence_proxy,
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
        "spellchecker_hit_ratio": quality.spellchecker_hit_ratio,
        "image_heavy_ratio": quality.image_heavy_ratio,
        "image_page_ratio": quality.image_page_ratio,
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
    low_quality = is_low_quality(quality, config)
    text_layer_overlay = bool(
        has_text_layer
        and quality.image_page_ratio is not None
        and quality.image_page_ratio >= config.quality_image_page_ratio_threshold
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
            if column_layout.detected and decision.use_external_ocr and decision.per_page_ocr:
                decision.per_page_ocr = False
                decision.per_page_reason = "Columns detected; keep Docling layout"
        except Exception as exc:
            LOGGER.warning("Column layout detection failed: %s", exc)

    dict_ratio = "n/a" if quality.dictionary_hit_ratio is None else f"{quality.dictionary_hit_ratio:.2f}"
    spell_ratio = "n/a" if quality.spellchecker_hit_ratio is None else f"{quality.spellchecker_hit_ratio:.2f}"
    img_ratio = "n/a" if quality.image_heavy_ratio is None else f"{quality.image_heavy_ratio:.2f}"
    img_pages_ratio = "n/a" if quality.image_page_ratio is None else f"{quality.image_page_ratio:.2f}"
    LOGGER.info(
        "Text-layer check: %s (avg_chars=%.1f, alpha_ratio=%.2f, suspicious=%.2f, dict=%s, spell=%s, img=%s, img_pages=%s)",
        has_text_layer,
        quality.avg_chars_per_page,
        quality.alpha_ratio,
        quality.suspicious_token_ratio,
        dict_ratio,
        spell_ratio,
        img_ratio,
        img_pages_ratio,
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
                    pages = ocr_pages
                    external_ocr_used = True
                    if config.postprocess_markdown and not markdown.strip():
                        markdown = "\\n\\n".join(page.get("text", "") for page in ocr_pages)
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
        "dictionary_hit_ratio": quality.dictionary_hit_ratio,
        "spellchecker_hit_ratio": quality.spellchecker_hit_ratio,
        "image_heavy_ratio": quality.image_heavy_ratio,
        "image_page_ratio": quality.image_page_ratio,
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
) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    total_pages = len(pages)
    for page in pages:
        raw_text = str(page.get("text", ""))
        page_num = int(page.get("page_num", 0))
        if postprocess:
            raw_text = postprocess(raw_text, f"page {page_num}/{total_pages}")
        raw_text = clean_chunk_text(raw_text, config)
        if table_map:
            tables = table_map.get(page_num, [])
            if tables:
                raw_text = inject_markdown_tables(raw_text, tables)
        if heading_map:
            titles = heading_map.get(page_num, [])
            if titles:
                raw_text = inject_headings_inline(raw_text, titles)
        cleaned = normalize_display_markdown(raw_text)
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
) -> List[Dict[str, Any]]:
    sections = split_markdown_sections(markdown)
    chunks: List[Dict[str, Any]] = []
    seen_ids: Dict[str, int] = {}

    if not sections:
        return build_chunks_page(doc_id, pages, config=config)

    total_sections = len(sections)
    for idx, section in enumerate(sections, start=1):
        title = section.get("title", "")
        text = section.get("text", "")
        if postprocess:
            text = postprocess(text, f"section {idx}/{total_sections}")
        text = clean_chunk_text(text, config)
        if not text.strip():
            continue
        base_id = slugify(title) or f"section-{idx}"
        if base_id in seen_ids:
            seen_ids[base_id] += 1
            base_id = f"{base_id}-{seen_ids[base_id]}"
        else:
            seen_ids[base_id] = 1
        max_chars = config.max_chunk_chars if config else 0
        overlap_chars = config.chunk_overlap_chars if config else 0
        segments = split_text_by_size(text, max_chars, overlap_chars)
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
    parser.add_argument("--log-file", help="Optional path to write a detailed log file")
    parser.add_argument("--spellchecker-info-out", help="Optional path to write spellchecker backend info JSON")
    parser.add_argument("--chunking", choices=["page", "section"], default="page")
    parser.add_argument("--ocr", choices=["auto", "force", "off"], default="auto")
    parser.add_argument("--language-hint", help="Language hint for OCR/quality (e.g., eng, deu, deu+eng)")
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

    logging.basicConfig(level=logging.INFO)
    # If a log file was requested, add a file handler
    if args.log_file:
        try:
            fh = logging.FileHandler(args.log_file, encoding="utf-8")
            fh.setLevel(logging.INFO)
            formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
            fh.setFormatter(formatter)
            logging.getLogger().addHandler(fh)
            LOGGER.info("Logging to file: %s", args.log_file)
        except Exception as exc:
            eprint(f"Failed to set up log file {args.log_file}: {exc}")


    if not os.path.isfile(args.pdf):
        eprint(f"PDF not found: {args.pdf}")
        return 2

    if args.quality_only:
        config = DoclingProcessingConfig(ocr_mode=args.ocr)
        if args.force_ocr_low_quality:
            config.force_ocr_on_low_quality_text = True
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
    if args.force_ocr_low_quality:
        config.force_ocr_on_low_quality_text = True
    if args.quality_threshold is not None:
        config.quality_confidence_threshold = args.quality_threshold
    if args.language_hint:
        config.language_hint = args.language_hint
    if args.paddle_structure_v3 is not None:
        config.paddle_use_structure_v3 = args.paddle_structure_v3
    if args.paddle_structure_version:
        config.paddle_structure_version = args.paddle_structure_version
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
        postprocess_fn: Optional[Callable[[str, Optional[str]], str]] = None
        ocr_used = bool(conversion.metadata.get("ocr_used"))
        should_postprocess = config.enable_post_correction
        if should_postprocess:
            wordlist = prepare_dictionary_words(config)
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

        if postprocess_fn:
            total_pages = len(pages)
            updated_pages: List[Dict[str, Any]] = []
            for idx, page in enumerate(pages, start=1):
                label = f"page {idx}/{total_pages}"
                updated_pages.append({
                    "page_num": page.get("page_num", idx),
                    "text": postprocess_fn(str(page.get("text", "")), label),
                })
            pages = updated_pages
            if ocr_pages_text_chars(pages) == 0 and ocr_pages_text_chars(original_pages) > 0:
                LOGGER.warning("Postprocess removed all page text; keeping original pages.")
                pages = original_pages

        markdown = conversion.markdown
        original_markdown = markdown
        if config.enable_post_correction and config.postprocess_markdown and should_postprocess:
            wordlist = prepare_dictionary_words(config)
            allow_missing_space = ocr_used
            if progress_cb:
                progress_cb(100, "postprocess_markdown", "Postprocess markdown...")
            processed_markdown = postprocess_text(
                markdown,
                config,
                languages,
                wordlist,
                allow_missing_space=allow_missing_space,
                progress_cb=progress_cb,
                progress_label="markdown",
            )
            if original_markdown.strip() and not processed_markdown.strip():
                LOGGER.warning("Postprocess removed all markdown; keeping original.")
                markdown = original_markdown
            else:
                markdown = processed_markdown

        repeated_clusters: List[BoilerplateCluster] = []
        external_ocr_used = bool(conversion.metadata.get("external_ocr_used"))
        if config.enable_boilerplate_removal and not external_ocr_used:
            pre_boilerplate_pages = pages
            pre_boilerplate_markdown = markdown
            pages, repeated_clusters, _ = remove_boilerplate_from_pages(pages, config)
            markdown = remove_boilerplate_from_markdown(markdown, repeated_clusters, config)
            if not has_output_text(markdown, pages) and has_output_text(pre_boilerplate_markdown, pre_boilerplate_pages):
                LOGGER.warning("Boilerplate removal removed all text; keeping original.")
                pages = pre_boilerplate_pages
                markdown = pre_boilerplate_markdown

        if external_ocr_used:
            markdown = "\\n\\n".join(page.get("text", "") for page in pages)

        if not markdown.strip():
            LOGGER.warning("Markdown empty; rebuilding from %d pages", len(pages))
            markdown = "\\n\\n".join(str(page.get("text", "")) for page in pages)

        if not has_output_text(markdown, pages):
            eprint("Extraction produced empty output after fallback attempts.")
            return 2

        LOGGER.info("Docling output: pages=%d, markdown_chars=%d", len(pages), len(markdown))

        try:
            with open(args.out_md, "w", encoding="utf-8") as handle:
                handle.write(markdown)
        except Exception as exc:
            eprint(f"Failed to write markdown: {exc}")
            return 2

        if args.chunking == "section":
            chunks = build_chunks_section(
                args.doc_id,
                markdown,
                pages,
                config=config,
                postprocess=postprocess_fn,
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
`,"index_redisearch.py":`#!/usr/bin/env python3
# zotero-redisearch-rag tool version: 0.3.4
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

    first_chunk = prepared_chunks[0]["chunk"]
    first_text = prepared_chunks[0]["sub_texts"][0]
    first_embedding_text = (
        build_embedding_text(first_text, first_chunk, item_metadata)
        if args.embed_include_metadata
        else first_text
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
                    embedding_text = (
                        build_embedding_text(sub_text, chunk, item_metadata)
                        if args.embed_include_metadata
                        else sub_text
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
# zotero-redisearch-rag tool version: 0.3.4
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
# zotero-redisearch-rag tool version: 0.3.4
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
# zotero-redisearch-rag tool version: 0.3.4

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


def retrieve_chunks(
    client: redis.Redis,
    index: str,
    vec: bytes,
    k: int,
    keywords: List[str],
    strict: bool = True,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    retrieved = search_redis_knn(client, index, vec, k)

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
    ordered = apply_tag_boosting(filtered, keywords)
    if lexical_ids:
        lexical_set = set(lexical_ids)
        lexical_first = [item for item in ordered if chunk_key(item) in lexical_set]
        rest = [item for item in ordered if chunk_key(item) not in lexical_set]
        ordered = lexical_first + rest
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


_MIN_CONTEXT_CHUNKS = 3
_MIN_CONTEXT_CHARS = 1500
_MAX_ACCEPTABLE_SCORE = 0.4
_MIN_NARRATIVE_RATIO = 0.5
_MIN_CONTENT_FOR_RATIO = 4


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
    args = parser.parse_args()

    try:
        embedding = request_embedding(args.embed_base_url, args.embed_api_key, args.embed_model, args.query)
        if len(embedding) != 768:
            raise RuntimeError(f"Embedding dim mismatch: {len(embedding)}")
        embedding = normalize_vector(embedding)
        vec = vector_to_bytes(embedding)
    except Exception as exc:
        eprint(f"Failed to embed query: {exc}")
        return 2

    client = redis.Redis.from_url(args.redis_url, decode_responses=False)
    keywords = extract_keywords(args.query)

    base_k = args.k
    if is_short_query(args.query):
        base_k = max(base_k, 12)
    try:
        retrieved, metrics = retrieve_chunks(client, args.index, vec, base_k, keywords, strict=True)
    except Exception as exc:
        eprint(f"RedisSearch query failed: {exc}")
        return 2

    broaden, _ = should_broaden_retrieval(metrics, base_k)
    if broaden:
        fallback_k = max(base_k * 2, 12)
        try:
            retrieved, _ = retrieve_chunks(client, args.index, vec, fallback_k, keywords, strict=False)
        except Exception as exc:
            eprint(f"Fallback retrieval failed: {exc}")

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
        "query": args.query,
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
# zotero-redisearch-rag tool version: 0.3.4

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
# zotero-redisearch-rag tool version: 0.3.4

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
# zotero-redisearch-rag tool version: 0.3.4

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
# zotero-redisearch-rag tool version: 0.3.4
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
# zotero-redisearch-rag tool version: 0.3.4
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
`,"ocr_wordlist.txt":`# zotero-redisearch-rag tool version: 0.3.4
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
`,"requirements.txt":`# zotero-redisearch-rag tool version: 0.3.4
docling
paddleocr
paddlex[ocr]
paddlepaddle==3.2.2
opencv-python
pyclipper
shapely
pdf2image
pypdf
pytesseract
redis
requests
pyzotero
tqdm
wordfreq
markdown
markdown-it-py
stopwordsiso

# Optional for language normalization and spellchecking
langcodes
# hunspell  # Disabled: fails to build on macOS/Python 3.13, use spylls fallback
spylls
`,"docker-compose.yml":`# zotero-redisearch-rag tool version: 0.3.4
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
`,"redis-stack.conf":`# zotero-redisearch-rag tool version: 0.3.4
# Redis Stack persistence config for local RAG index
appendonly yes
appendfsync everysec

dir /data
`};var H=require("obsidian"),ie="zotero-redisearch-rag-chat",ce=class extends H.ItemView{constructor(e,n){super(e);this.messages=[];this.activeSessionId="default";this.messageEls=new Map;this.pendingRender=new Map;this.busy=!1;this.plugin=n}getViewType(){return ie}getDisplayText(){return"Zotero RAG Chat"}getIcon(){return"zrr-chat"}async onOpen(){let{containerEl:e}=this;e.empty(),e.addClass("zrr-chat-view");let n=e.createEl("div",{cls:"zrr-chat-header"});n.createEl("div",{cls:"zrr-chat-title",text:"Zotero RAG Chat"});let t=n.createEl("div",{cls:"zrr-chat-controls"}),i=t.createEl("div",{cls:"zrr-chat-controls-row"});this.sessionSelect=i.createEl("select",{cls:"zrr-chat-session"}),this.sessionSelect.addEventListener("change",async()=>{await this.switchSession(this.sessionSelect.value)});let r=t.createEl("div",{cls:"zrr-chat-controls-row zrr-chat-controls-actions"});this.renameButton=r.createEl("button",{cls:"zrr-chat-rename",text:"Rename",attr:{title:"Rename the current chat"}}),this.renameButton.addEventListener("click",async()=>{await this.promptRenameSession()}),this.copyButton=r.createEl("button",{cls:"zrr-chat-copy",text:"Copy",attr:{title:"Copy this chat to a new note"}}),this.copyButton.addEventListener("click",async()=>{await this.copyChatToNote()}),this.deleteButton=r.createEl("button",{cls:"zrr-chat-delete",text:"Delete",attr:{title:"Delete this chat"}}),this.deleteButton.addEventListener("click",async()=>{await this.deleteChat()}),this.newButton=r.createEl("button",{cls:"zrr-chat-new",text:"New chat",attr:{title:"Start a new chat session"}}),this.newButton.addEventListener("click",async()=>{await this.startNewChat()}),this.messagesEl=e.createEl("div",{cls:"zrr-chat-messages"});let s=e.createEl("div",{cls:"zrr-chat-input"});this.inputEl=s.createEl("textarea",{cls:"zrr-chat-textarea",attr:{placeholder:"Ask your Zotero library..."}}),this.sendButton=s.createEl("button",{cls:"zrr-chat-send",text:"Send"}),this.sendButton.addEventListener("click",()=>this.handleSend()),this.inputEl.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this.handleSend())}),await this.loadSessions(),await this.loadHistory(),await this.renderAll()}focusInput(){var e;(e=this.inputEl)==null||e.focus()}async loadHistory(){try{this.messages=await this.plugin.loadChatHistoryForSession(this.activeSessionId)}catch(e){console.error(e),this.messages=[]}}async saveHistory(){try{await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages),await this.loadSessions()}catch(e){console.error(e)}}async loadSessions(){let e=await this.plugin.listChatSessions();this.activeSessionId=await this.plugin.getActiveChatSessionId(),this.sessionSelect.empty();for(let n of e){let t=this.sessionSelect.createEl("option",{text:n.name});t.value=n.id,n.id===this.activeSessionId&&(t.selected=!0)}!e.some(n=>n.id===this.activeSessionId)&&e.length>0&&(this.activeSessionId=e[0].id,await this.plugin.setActiveChatSessionId(this.activeSessionId),this.sessionSelect.value=this.activeSessionId)}async promptRenameSession(){var i;let n=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId);new ke(this.app,(i=n==null?void 0:n.name)!=null?i:"New chat",async r=>{await this.plugin.renameChatSession(this.activeSessionId,r),await this.loadSessions()}).open()}async startNewChat(){await this.plugin.saveChatHistoryForSession(this.activeSessionId,this.messages),await this.plugin.finalizeChatSessionNameIfNeeded(this.activeSessionId,this.messages,{force:!0});let e=await this.plugin.createChatSession("New chat");await this.switchSession(e,{skipSave:!0})}async deleteChat(){let e=await this.plugin.listChatSessions();if(e.length<=1){new H.Notice("You must keep at least one chat.");return}let n=e.find(i=>i.id===this.activeSessionId);if(!n)return;new ve(this.app,n.name,async()=>{await this.plugin.deleteChatSession(this.activeSessionId);let i=await this.plugin.getActiveChatSessionId();await this.switchSession(i,{skipSave:!0})}).open()}async switchSession(e,n={}){!e||e===this.activeSessionId||(n.skipSave||await this.saveHistory(),this.activeSessionId=e,await this.plugin.setActiveChatSessionId(e),await this.loadSessions(),await this.loadHistory(),await this.renderAll())}async renderAll(){this.messagesEl.empty(),this.messageEls.clear();for(let e of this.messages)await this.renderMessage(e);this.scrollToBottom()}async renderMessage(e){let n=this.messagesEl.createEl("div",{cls:`zrr-chat-message zrr-chat-${e.role}`});n.createEl("div",{cls:"zrr-chat-meta"}).setText(e.role==="user"?"You":"Zotero Assistant");let i=n.createEl("div",{cls:"zrr-chat-content"}),r=n.createEl("div",{cls:"zrr-chat-citations"});this.messageEls.set(e.id,{wrapper:n,content:i,citations:r}),await this.renderMessageContent(e)}scheduleRender(e){if(this.pendingRender.has(e.id))return;let n=window.setTimeout(async()=>{this.pendingRender.delete(e.id),await this.renderMessageContent(e),this.scrollToBottom()},80);this.pendingRender.set(e.id,n)}async renderMessageContent(e){var i,r,s;let n=this.messageEls.get(e.id);if(!n)return;let t=await this.plugin.formatInlineCitations(e.content||"",(i=e.citations)!=null?i:[],(r=e.retrieved)!=null?r:[]);n.content.dataset.lastRendered!==t&&(n.content.empty(),await H.MarkdownRenderer.renderMarkdown(t,n.content,"",this.plugin),this.hookInternalLinks(n.content),n.content.dataset.lastRendered=t),n.citations.empty(),await this.renderCitations(n.citations,(s=e.citations)!=null?s:[])}hookInternalLinks(e){let n=e.querySelectorAll("a.internal-link");for(let t of Array.from(n))t.dataset.zrrBound!=="1"&&(t.dataset.zrrBound="1",this.registerDomEvent(t,"click",i=>{i.preventDefault();let r=t.getAttribute("data-href")||t.getAttribute("href")||"";r&&this.plugin.openInternalLinkInMain(r)}))}async renderCitations(e,n){if(e.empty(),!n.length)return;let t=e.createEl("details",{cls:"zrr-chat-citations-details"});t.createEl("summary",{text:`Relevant context sources (${n.length})`,cls:"zrr-chat-citations-summary"});let i=t.createEl("ul",{cls:"zrr-chat-citation-list"});for(let r of n){let s=await this.plugin.resolveCitationDisplay(r),a=i.createEl("li"),o=`${s.noteTitle} p. ${s.pageLabel}`;a.createEl("a",{text:o,href:"#"}).addEventListener("click",l=>{l.preventDefault(),this.plugin.openCitationTarget(r,s)})}}async copyChatToNote(){var i;let n=(await this.plugin.listChatSessions()).find(r=>r.id===this.activeSessionId),t=(i=n==null?void 0:n.name)!=null?i:"New chat";await this.plugin.createChatNoteFromSession(this.activeSessionId,t,this.messages)}scrollToBottom(){this.messagesEl.scrollTop=this.messagesEl.scrollHeight}async handleSend(){if(this.busy)return;let e=this.inputEl.value.trim();if(!e){new H.Notice("Query cannot be empty.");return}if(!this.plugin.settings.chatBaseUrl){new H.Notice("Chat base URL must be set in settings.");return}this.inputEl.value="",this.busy=!0,this.sendButton.disabled=!0;let n={id:this.generateId(),role:"user",content:e,createdAt:new Date().toISOString()};this.messages.push(n),await this.renderMessage(n),this.scrollToBottom(),await this.saveHistory();let t={id:this.generateId(),role:"assistant",content:"",citations:[],createdAt:new Date().toISOString()};this.messages.push(t),await this.renderMessage(t),this.scrollToBottom();let i=!1,r=this.plugin.getRecentChatHistory(this.messages.slice(0,-2));try{await this.plugin.runRagQueryStreaming(e,s=>{i=!0,t.content+=s,this.scheduleRender(t)},s=>{(!i&&(s!=null&&s.answer)||s!=null&&s.answer)&&(t.content=s.answer),Array.isArray(s==null?void 0:s.citations)&&(t.citations=s.citations),Array.isArray(s==null?void 0:s.retrieved)&&(t.retrieved=s.retrieved),this.scheduleRender(t)},r)}catch(s){console.error(s),t.content="Failed to fetch answer. See console for details.",this.scheduleRender(t)}finally{this.busy=!1,this.sendButton.disabled=!1,await this.saveHistory()}}generateId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}},ke=class extends H.Modal{constructor(g,e,n){super(g),this.initialValue=e,this.onSubmit=n}onOpen(){let{contentEl:g}=this;g.empty(),g.createEl("h3",{text:"Rename chat"});let e=this.initialValue;new H.Setting(g).setName("Name").addText(r=>{r.setValue(e),r.onChange(s=>{e=s})});let n=g.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="1rem",n.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),n.createEl("button",{text:"Save"}).addEventListener("click",()=>{let r=e.trim();if(!r){new H.Notice("Name cannot be empty.");return}this.close(),this.onSubmit(r)})}},ve=class extends H.Modal{constructor(g,e,n){super(g),this.chatName=e,this.onConfirm=n}onOpen(){let{contentEl:g}=this;g.empty(),g.createEl("h3",{text:"Delete chat"}),g.createEl("p",{text:`Delete "${this.chatName}"? This cannot be undone.`});let e=g.createEl("div");e.style.display="flex",e.style.gap="0.5rem",e.style.marginTop="1rem",e.createEl("button",{text:"Cancel"}).addEventListener("click",()=>this.close()),e.createEl("button",{text:"Delete"}).addEventListener("click",()=>{this.close(),this.onConfirm()})}};var $e=[{label:"Auto (no hint)",value:""},{label:"English (en)",value:"en"},{label:"German (de)",value:"de"},{label:"German + English (de,en)",value:"de,en"},{label:"French (fr)",value:"fr"},{label:"Spanish (es)",value:"es"},{label:"Italian (it)",value:"it"},{label:"Dutch (nl)",value:"nl"},{label:"Portuguese (pt)",value:"pt"},{label:"Polish (pl)",value:"pl"},{label:"Swedish (sv)",value:"sv"},{label:"Other (custom ISO code)",value:"__custom__"}],Me={en:"eng",de:"deu",fr:"fra",es:"spa",it:"ita",nl:"nld",pt:"por",pl:"pol",sv:"swe"},on=we["zrr-picker"],ln=we["zrr-chat"],re=/<!--\s*zrr:sync-start[^>]*-->/i,de=/<!--\s*zrr:sync-end\s*-->/i,pe=/<!--\s*zrr:chunk\b([^>]*)-->/i,Pe=/<!--\s*zrr:chunk\s+end\s*-->/i,me=/<!--\s*zrr:(?:exclude|delete)\s*-->/i,He=w=>{let g=w.trim();if(!g.toLowerCase().startsWith("zrr:"))return null;if(/^zrr:sync-start\b/i.test(g)){let o=g.match(/\bdoc_id=(["']?)([^"'\s]+)\1/i);return{type:"sync-start",docId:o?o[2]:void 0}}if(/^zrr:sync-end\b/i.test(g))return{type:"sync-end"};if(/^zrr:chunk\s+end\b/i.test(g))return{type:"chunk-end"};let e=g.match(/^zrr:chunk\b(.*)$/i);if(!e)return null;let n=e[1]||"",t=n.match(/\bid=(["']?)([^"'\s]+)\1/i),i=t?t[2]:"",r=i.match(/^p(\d+)$/i),s=r?Number.parseInt(r[1],10):void 0,a=/\bexclude\b/i.test(n)||/\bdelete\b/i.test(n);return{type:"chunk-start",chunkId:i||void 0,excluded:a,pageNumber:Number.isFinite(s!=null?s:NaN)?s:void 0,chunkKind:s?"page":"section"}},We=(w,g)=>{let e=document.createElement("div");return e.classList.add("zrr-sync-badge"),w.type==="sync-start"||w.type==="sync-end"?(e.classList.add("zrr-sync-badge--sync"),e.classList.add(w.type==="sync-start"?"zrr-sync-badge--sync-start":"zrr-sync-badge--sync-end"),w.type==="sync-start"?e.textContent=w.docId?`Redis Index Sync start \u2022 ${w.docId}`:"Redis Index Sync start":e.textContent="Redis Index Sync end",e):w.type==="chunk-end"?(e.classList.add("zrr-sync-badge--chunk-end"),e.textContent=w.chunkKind==="page"?"Page end":"Section end",e):w.type!=="chunk-start"?null:(e.classList.add("zrr-sync-badge--chunk"),w.excluded&&e.classList.add("is-excluded"),w.pageNumber&&g>0?e.textContent=`Page ${w.pageNumber}/${g}`:w.pageNumber?e.textContent=`Page ${w.pageNumber}`:w.chunkId?e.textContent=`Section ${w.chunkId}`:e.textContent="Section",w.excluded&&(e.textContent=`${e.textContent} \u2022 excluded`),e)},ye=class extends p.Modal{constructor(g,e,n,t,i="Value cannot be empty."){super(g),this.titleText=e,this.placeholder=n,this.onSubmit=t,this.emptyMessage=i}onOpen(){let{contentEl:g}=this;g.empty(),g.createEl("h3",{text:this.titleText});let e=g.createEl("input",{type:"text",placeholder:this.placeholder});e.style.width="100%",e.focus();let n=g.createEl("button",{text:"Submit"});n.style.marginTop="0.75rem";let t=()=>{let i=e.value.trim();if(!i){new p.Notice(this.emptyMessage);return}this.close(),this.onSubmit(i)};n.addEventListener("click",t),e.addEventListener("keydown",i=>{i.key==="Enter"&&t()})}},Ce=class extends p.Modal{constructor(g,e,n,t,i){super(g),this.chunkId=e,this.initialTags=n,this.onSubmit=t,this.onRegenerate=i}onOpen(){let{contentEl:g}=this;g.empty(),g.createEl("h3",{text:`Edit tags for ${this.chunkId}`});let e=g.createEl("textarea",{attr:{rows:"3"}});e.style.width="100%",e.placeholder="tag1, tag2, tag3",e.value=this.initialTags.join(", "),e.focus();let n=g.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Save tags"}),i=async()=>{let s=(e.value||"").split(/[,;\n]+/).map(o=>o.trim()).filter(o=>o.length>0),a=Array.from(new Set(s));this.close(),await Promise.resolve(this.onSubmit(a))};if(this.onRegenerate){let r=n.createEl("button",{text:"Regenerate"});r.addEventListener("click",async()=>{var s;r.setAttribute("disabled","true"),t.setAttribute("disabled","true");try{let a=await((s=this.onRegenerate)==null?void 0:s.call(this));a&&a.length>0?(e.value=a.join(", "),await Promise.resolve(this.onSubmit(a))):a&&new p.Notice("No tags were generated.")}finally{r.removeAttribute("disabled"),t.removeAttribute("disabled")}})}t.addEventListener("click",i),e.addEventListener("keydown",r=>{r.key==="Enter"&&(r.metaKey||r.ctrlKey)&&i()})}},Se=class extends p.Modal{constructor(g,e,n,t=""){super(g),this.titleText=e,this.content=n,this.noteText=t}onOpen(){let{contentEl:g}=this;if(g.empty(),g.createEl("h3",{text:this.titleText}),this.noteText){let n=g.createEl("div",{text:this.noteText});n.className="zrr-indexed-note"}let e=g.createEl("textarea",{attr:{rows:"12",readonly:"true"}});e.style.width="100%",e.value=this.content}},cn=w=>w.includes("STDERR")?"zrr-log-stderr":w.includes("ERROR")?"zrr-log-error":w.includes("WARNING")||w.includes("WARN")?"zrr-log-warning":w.includes("INFO")?"zrr-log-info":null,je=w=>{let g=new ne.RangeSetBuilder;for(let{from:e,to:n}of w.visibleRanges){let t=e;for(;t<=n;){let i=w.state.doc.lineAt(t),r=cn(i.text);r&&g.add(i.from,i.from,$.Decoration.line({class:r})),t=i.to+1}}return g.finish()},Ke=$.EditorView.theme({".cm-editor":{height:"100%",display:"flex",flexDirection:"column",minHeight:"0"},".cm-scroller":{fontFamily:"var(--font-monospace)",fontSize:"0.85rem",flex:"1",height:"100%",maxHeight:"100%",overflow:"auto"},".zrr-log-error":{color:"var(--text-error)"},".zrr-log-warning":{color:"var(--text-accent)"},".zrr-log-info":{color:"var(--text-muted)"},".zrr-log-stderr":{color:"var(--text-accent)"}}),dn=w=>{for(let g=1;g<=w.lines;g+=1){let e=w.line(g).text;if(re.test(e)){let n=e.match(/doc_id=([\"']?)([^\"'\s]+)\1/i);return n?n[2].trim():null}}return null},pn=(w,g)=>{let e=g;for(;e>=1;e-=1){let n=w.line(e).text;if(pe.test(n))return{line:e,text:n};if(re.test(n)||de.test(n))break}return null},un=(w,g)=>{for(let e=g;e<=w.lines;e+=1){let n=w.line(e).text;if(Pe.test(n))return e;if(de.test(n))break}return null},gn=(w,g)=>{let e=pn(w,g);if(!e)return null;let n=un(w,e.line+1);return n===null||g<e.line||g>n?null:{startLine:e.line,endLine:n,text:e.text}},hn=(w,g,e)=>{if(g>e)return!1;for(let n=g;n<=e;n+=1){let t=w.line(n).text;if(me.test(t))return!0}return!1},Ee=class extends $.WidgetType{constructor(g,e,n,t,i){super(),this.plugin=g,this.docId=e,this.chunkId=n,this.startLine=t,this.excluded=i}eq(g){return this.docId===g.docId&&this.chunkId===g.chunkId&&this.startLine===g.startLine&&this.excluded===g.excluded}toDOM(){let g=document.createElement("span");g.className="zrr-chunk-toolbar",g.setAttribute("data-chunk-id",this.chunkId);let e=(l,d)=>{l.setAttribute("title",d),l.setAttribute("aria-label",d),l.setAttribute("data-tooltip-position","top")},n=(l,d,h)=>{let _=document.createElement("span");_.className="zrr-chunk-button-icon",(0,p.setIcon)(_,d);let m=document.createElement("span");m.className="zrr-chunk-button-label",m.textContent=h,l.appendChild(_),l.appendChild(m)},t=document.createElement("button");t.type="button",t.className="zrr-chunk-button",n(t,"sparkles","Clean"),e(t,"Clean this chunk with the OCR cleanup model"),t.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),this.plugin.cleanChunkFromToolbar(this.startLine)}),g.appendChild(t);let i=document.createElement("button");i.type="button",i.className="zrr-chunk-button",n(i,"tag","Tags"),e(i,"Edit chunk tags"),i.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),this.plugin.openChunkTagEditor(this.docId,this.chunkId)}),g.appendChild(i);let r=document.createElement("button");r.type="button",r.className="zrr-chunk-button",n(r,"search","Indexed"),e(r,"Preview indexed chunk text"),r.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),this.plugin.openChunkIndexedTextPreview(this.docId,this.chunkId)}),g.appendChild(r);let s=document.createElement("button");s.type="button",s.className="zrr-chunk-button",n(s,"external-link","Zotero"),e(s,"Open this page in Zotero"),s.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),this.plugin.openChunkInZotero(this.docId,this.chunkId)}),g.appendChild(s);let a=document.createElement("button");a.type="button",a.className="zrr-chunk-button";let o=this.excluded?"Include":"Exclude",c=this.excluded?"check":"ban";return n(a,c,o),e(a,this.excluded?"Include this chunk in the index":"Exclude this chunk from the index"),a.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),this.plugin.toggleChunkExcludeFromToolbar(this.startLine)}),g.appendChild(a),g}ignoreEvent(){return!0}},Be=(w,g)=>{var y;let e=w.state.doc,n=dn(e);if(!n)return $.Decoration.none;let t=w.state.selection.main.head,i=e.lineAt(t).number,r=gn(e,i);if(!r)return $.Decoration.none;let s=r.text.match(pe);if(!s)return $.Decoration.none;let a=((y=s[1])!=null?y:"").trim(),o=a.match(/id=([\"']?)([^\"'\s]+)\1/i);if(!o)return $.Decoration.none;let c=o[2].trim();if(!c)return $.Decoration.none;let l=/\bexclude\b/i.test(a)||/\bdelete\b/i.test(a),d=hn(e,r.startLine+1,r.endLine-1),h=l||d,_=e.line(r.startLine),m=$.Decoration.widget({widget:new Ee(g,n,c,r.startLine,h),side:1});return $.Decoration.set([m.range(_.to)])},Le=class extends $.WidgetType{constructor(g,e){super(),this.info=g,this.totalPages=e}toDOM(){var g;return(g=We(this.info,this.totalPages))!=null?g:document.createElement("span")}},Ge=w=>{var a;let g=w.dom.closest(".markdown-source-view");if(!g||!g.classList.contains("is-live-preview"))return $.Decoration.none;let e=w.state.doc,n=new ne.RangeSetBuilder,t=[],i=[],r=null;for(let o=1;o<=e.lines;o+=1){let c=e.line(o),l=c.text.match(/<!--\s*([^>]*)\s*-->/);if(!l)continue;let d=He(l[1]);d&&(d.type==="chunk-start"?r=(a=d.chunkKind)!=null?a:d.pageNumber?"page":"section":d.type==="chunk-end"&&(d.chunkKind=r!=null?r:"section",r=null),t.push({from:c.from,to:c.to,info:d}),d.pageNumber&&i.push(d.pageNumber))}if(!t.length)return $.Decoration.none;let s=i.length?Math.max(...i):0;for(let o of t){let c=$.Decoration.replace({widget:new Le(o.info,s)});n.add(o.from,o.to,c)}return n.finish()},_n=()=>$.ViewPlugin.fromClass(class{constructor(w){this.decorations=Ge(w)}update(w){(w.docChanged||w.viewportChanged)&&(this.decorations=Ge(w.view))}},{decorations:w=>w.decorations}),fn=w=>$.ViewPlugin.fromClass(class{constructor(g){this.decorations=Be(g,w)}update(g){(g.docChanged||g.selectionSet||g.viewportChanged)&&(this.decorations=Be(g.view,w))}},{decorations:g=>g.decorations}),Je=$.ViewPlugin.fromClass(class{constructor(w){this.decorations=je(w)}update(w){(w.docChanged||w.viewportChanged)&&(this.decorations=je(w.view))}},{decorations:w=>w.decorations}),Ae=class extends p.Modal{constructor(e,n,t=""){super(e);this.bodyText="";this.plugin=n,this.initialTerm=t}onOpen(){let{contentEl:e}=this;e.empty(),this.modalEl&&(this.modalEl.style.width="80vw",this.modalEl.style.maxWidth="1200px",this.modalEl.style.height="80vh",this.modalEl.style.maxHeight="90vh",this.modalEl.style.resize="both",this.modalEl.style.overflow="hidden"),e.style.display="flex",e.style.flexDirection="column",e.style.height="100%",e.style.overflow="hidden",e.style.minHeight="0";let n=e.createDiv();n.style.display="flex",n.style.alignItems="center",n.style.justifyContent="space-between",n.style.gap="0.5rem",n.createEl("h3",{text:"Redis index search"});let t=n.createEl("button",{text:"Copy All"});t.style.marginLeft="auto",t.addEventListener("click",()=>{this.copyResultsToClipboard()});let i=e.createDiv();i.style.display="flex",i.style.alignItems="center",i.style.gap="0.5rem",i.style.margin="0.5rem 0";let r=i.createEl("input");r.type="text",r.placeholder="Search term",r.value=this.initialTerm,r.style.flex="1",r.style.minWidth="0",this.inputEl=r,i.createEl("button",{text:"Search"}).addEventListener("click",()=>{this.runSearch()}),r.addEventListener("keydown",l=>{l.key==="Enter"&&(l.preventDefault(),this.runSearch())});let a=e.createDiv();a.style.color="var(--text-muted)",a.style.marginBottom="0.5rem",this.statusEl=a;let o=e.createDiv();o.style.flex="1 1 0",o.style.minHeight="0",o.style.border="1px solid var(--background-modifier-border)",o.style.borderRadius="6px",o.style.display="flex",o.style.flexDirection="column",o.style.overflow="auto";let c=ne.EditorState.create({doc:this.bodyText,extensions:[Ke,Je,$.EditorView.editable.of(!1),ne.EditorState.readOnly.of(!0),$.EditorView.lineWrapping]});this.editorView=new $.EditorView({state:c,parent:o}),this.initialTerm&&this.runSearch()}onClose(){var e;(e=this.editorView)==null||e.destroy(),this.editorView=void 0}async runSearch(){var t;let e=(((t=this.inputEl)==null?void 0:t.value)||"").trim();if(!e){this.statusEl&&(this.statusEl.textContent="Enter a search term.");return}this.statusEl&&(this.statusEl.textContent="Searching...");let n=await this.plugin.runRedisSearch(e);this.updateEditor(n),this.statusEl&&(this.statusEl.textContent=`Results for \u201C${e}\u201D`)}updateEditor(e){if(!this.editorView)return;let n=this.editorView,t=n.scrollDOM.scrollTop,i=n.state.selection.main,r=e.length,s=Math.min(i.anchor,r),a=Math.min(i.head,r);n.dispatch({changes:{from:0,to:n.state.doc.length,insert:e},selection:{anchor:s,head:a}}),n.scrollDOM.scrollTop=t,this.bodyText=e}copyResultsToClipboard(){let e=this.bodyText||"";if(!e){new p.Notice("Nothing to copy.");return}navigator.clipboard.writeText(e).then(()=>new p.Notice("Results copied to clipboard.")).catch(()=>new p.Notice("Failed to copy results."))}},ue=class extends p.Modal{constructor(g,e,n,t){super(g),this.titleText=e,this.bodyText=n,this.options=t}onOpen(){var r,s,a,o;let{contentEl:g}=this;g.empty(),this.modalEl&&(this.modalEl.style.width="80vw",this.modalEl.style.maxWidth="1200px",this.modalEl.style.height="80vh",this.modalEl.style.maxHeight="90vh",this.modalEl.style.resize="both",this.modalEl.style.overflow="hidden"),g.style.display="flex",g.style.flexDirection="column",g.style.height="100%",g.style.overflow="hidden",g.style.minHeight="0";let e=g.createDiv();e.style.display="flex",e.style.alignItems="center",e.style.justifyContent="space-between",e.style.gap="0.5rem",e.createEl("h3",{text:this.titleText});let n=e.createDiv();if(n.style.display="flex",n.style.gap="0.5rem",(r=this.options)!=null&&r.onClear){let c=(s=this.options.clearLabel)!=null?s:"Clear log";n.createEl("button",{text:c}).addEventListener("click",async()=>{var d,h;try{await((h=(d=this.options)==null?void 0:d.onClear)==null?void 0:h.call(d))}finally{await this.refreshFromSource()}})}let t=g.createDiv();t.style.flex="1 1 0",t.style.minHeight="0",t.style.border="1px solid var(--background-modifier-border)",t.style.borderRadius="6px",t.style.display="flex",t.style.flexDirection="column",t.style.overflow="auto";let i=ne.EditorState.create({doc:this.bodyText,extensions:[Ke,Je,$.EditorView.editable.of(!0),ne.EditorState.readOnly.of(!1),$.EditorView.lineWrapping]});if(this.editorView=new $.EditorView({state:i,parent:t}),this.refreshFromSource(),(a=this.options)!=null&&a.autoRefresh&&this.options.onRefresh){let c=(o=this.options.refreshIntervalMs)!=null?o:2e3;this.refreshTimer=window.setInterval(()=>{this.refreshFromSource()},c)}}onClose(){var g;this.refreshTimer!==void 0&&(window.clearInterval(this.refreshTimer),this.refreshTimer=void 0),(g=this.editorView)==null||g.destroy(),this.editorView=void 0}async refreshFromSource(){var a;if(!((a=this.options)!=null&&a.onRefresh)||!this.editorView)return;let g="";try{g=await this.options.onRefresh()||""}catch(o){return}if(g===this.bodyText)return;let e=this.editorView,n=e.scrollDOM.scrollTop,t=e.state.selection.main,i=g.length,r=Math.min(t.anchor,i),s=Math.min(t.head,i);e.dispatch({changes:{from:0,to:e.state.doc.length,insert:g},selection:{anchor:r,head:s}}),e.scrollDOM.scrollTop=n,this.bodyText=g}},Re=class extends p.Modal{constructor(e,n,t){super(e);this.resolved=!1;this.filePath=n,this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Overwrite existing note?"}),e.createEl("p",{text:`This will overwrite: ${this.filePath}`});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Overwrite"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},De=class extends p.Modal{constructor(e,n,t,i){super(e);this.resolved=!1;this.notePath=n,this.docId=t,this.onResolve=i}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Delete note and cached data?"}),e.createEl("p",{text:`This will delete the note and cached chunks/items for doc_id ${this.docId}.`}),e.createEl("p",{text:`Note: ${this.notePath}`});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Delete"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},Te=class extends p.Modal{constructor(e,n,t){super(e);this.resolved=!1;this.reason=n,this.onResolve=t}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Rebuild Redis index?"}),e.createEl("p",{text:this.reason}),e.createEl("p",{text:"This will drop the RedisSearch index (and embeddings) and rebuild it from cached chunks."});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Drop & rebuild"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},Ne=class extends p.Modal{constructor(e,n){super(e);this.resolved=!1;this.onResolve=n}onOpen(){let{contentEl:e}=this;e.empty(),e.createEl("h3",{text:"Purge Redis orphaned chunks?"}),e.createEl("p",{text:"This removes Redis chunk keys that have no cached item.json or chunk.json on disk."}),e.createEl("p",{text:"Cache files are not deleted. Use this to clean up stale Redis data."});let n=e.createEl("div");n.style.display="flex",n.style.gap="0.5rem",n.style.marginTop="0.75rem";let t=n.createEl("button",{text:"Cancel"}),i=n.createEl("button",{text:"Purge orphans"});t.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!1)}),i.addEventListener("click",()=>{this.resolved=!0,this.close(),this.onResolve(!0)})}onClose(){this.resolved||this.onResolve(!1)}},Oe=class extends p.SuggestModal{constructor(e,n){super(e);this.resolved=!1;this.resolveSelection=n,this.setPlaceholder("Select a language for OCR/quality...")}getSuggestions(e){let n=e.trim().toLowerCase();return n?$e.filter(t=>t.label.toLowerCase().includes(n)||t.value.toLowerCase().includes(n)):$e}renderSuggestion(e,n){n.setText(e.label),n.addEventListener("click",()=>this.handleSelection(e))}onChooseSuggestion(e){this.handleSelection(e)}onClose(){this.resolved||this.resolveSelection(null)}handleSelection(e){if(!this.resolved){if(this.resolved=!0,e.value==="__custom__"){this.close(),new ye(this.app,"Custom language hint","e.g., en, de, fr, de,en",n=>this.resolveSelection(n.trim()),"Language hint cannot be empty.").open();return}this.resolveSelection(e.value),this.close()}}},be=class extends p.Plugin{constructor(){super(...arguments);this.docIndex=null;this.lastPythonEnvNotice=null;this.lastContainerNotice=null;this.noteSyncTimers=new Map;this.noteSyncInFlight=new Set;this.noteSyncSuppressed=new Set;this.missingDocIdWarned=new Set;this.collectionTitleCache=new Map;this.recreateMissingNotesActive=!1;this.recreateMissingNotesAbort=!1;this.recreateMissingNotesProcess=null;this.reindexCacheActive=!1;this.lastRedisSearchTerm=""}async onload(){await this.loadSettings(),await this.migrateCachePaths(),this.addSettingTab(new he(this.app,this)),this.registerRibbonIcons(),this.registerView(ie,e=>new ce(e,this)),this.setupStatusBar(),this.registerNoteRenameHandler(),this.registerNoteSyncHandler(),this.registerNoteDeleteMenu(),this.registerSyncCommentBadges(),this.registerEditorExtension(fn(this)),this.registerEditorExtension(_n());try{await this.ensureBundledTools()}catch(e){console.error("Failed to sync bundled tools",e)}this.addCommand({id:"import-zotero-item-index",name:"Import Zotero item and index (Docling -> RedisSearch)",callback:()=>this.importZoteroItem()}),this.addCommand({id:"ask-zotero-library",name:"Ask my Zotero library (RAG via RedisSearch)",callback:()=>this.askZoteroLibrary()}),this.addCommand({id:"open-zotero-chat",name:"Open Zotero RAG chat panel",callback:()=>this.openChatView(!0)}),this.addCommand({id:"rebuild-zotero-note-cache",name:"Rebuild Zotero note from cache (Docling + RedisSearch)",callback:()=>this.rebuildNoteFromCache()}),this.addCommand({id:"rebuild-doc-index-cache",name:"Rebuild doc index from cache",callback:()=>this.rebuildDocIndexFromCache()}),this.addCommand({id:"recreate-missing-notes-cache",name:"Recreate missing notes from cache (Docling + RedisSearch)",callback:()=>this.recreateMissingNotesFromCache()}),this.addCommand({id:"reindex-redis-from-cache",name:"Reindex Redis from cached chunks",callback:()=>this.reindexRedisFromCache()}),this.addCommand({id:"drop-rebuild-redis-index",name:"Drop & rebuild Redis index",callback:()=>this.dropAndRebuildRedisIndex()}),this.addCommand({id:"start-redis-stack",name:"Start Redis Stack (Docker/Podman Compose)",callback:()=>this.startRedisStack()}),this.addCommand({id:"open-docling-log",name:"Open log file",callback:()=>this.openLogFile()}),this.addCommand({id:"clear-docling-log",name:"Clear log file",callback:()=>this.clearLogFile()}),this.addCommand({id:"toggle-zrr-chunk-delete",name:"Toggle ZRR chunk exclude at cursor",editorCallback:e=>this.toggleChunkExclude(e)}),this.addCommand({id:"delete-zotero-note-cache",name:"Delete Zotero note and cached data",callback:()=>this.deleteZoteroNoteAndCache()}),this.addCommand({id:"search-redis-index",name:"Search Redis index for term",callback:()=>this.searchRedisIndex()}),this.addCommand({id:"redis-diagnostics",name:"Show Redis diagnostics",callback:()=>this.showRedisDiagnostics()}),this.addCommand({id:"purge-redis-orphans",name:"Purge Redis orphaned chunks (missing cache files)",callback:()=>this.purgeRedisOrphanedKeys()}),this.autoDetectContainerCliOnLoad(),this.settings.autoStartRedis&&this.startRedisStack(!0)}async loadSettings(){var t;let e=(t=await this.loadData())!=null?t:{},n=Object.assign({},Fe,e);n.preferObsidianNoteForCitations===void 0&&typeof e.preferVaultPdfForCitations=="boolean"&&(n.preferObsidianNoteForCitations=e.preferVaultPdfForCitations),this.settings=n}async saveSettings(){await this.saveData(this.settings)}async importZoteroItem(){var N,R,z;try{await this.ensureBundledTools()}catch(E){new p.Notice("Failed to sync bundled tools. See console for details."),console.error(E);return}let e;try{e=await this.promptZoteroItem()}catch(E){new p.Notice("Zotero search failed. See console for details."),console.error(E);return}if(!e){new p.Notice("No Zotero item selected.");return}let n=(N=e.data)!=null?N:e;!n.key&&e.key&&(n.key=e.key);let t=this.getDocId(n);if(!t){new p.Notice("Could not resolve a stable doc_id from Zotero item.");return}let i=await this.resolveLanguageHint(n,(R=e.key)!=null?R:n.key),r=this.buildDoclingLanguageHint(i!=null?i:void 0),s=await this.resolvePdfAttachment(n,t);if(!s){new p.Notice("No PDF attachment found for item.");return}if(this.showStatusProgress("Preparing...",5),!await this.ensureRedisAvailable("import")){this.clearStatusProgress();return}let a=typeof n.title=="string"?n.title:"",o=await this.getDocIndexEntry(t);o&&new p.Notice("Item already indexed. Updating cached files and index.");let c=this.sanitizeFileName(a)||t;if(o!=null&&o.note_path)c=P.default.basename(o.note_path,".md")||c;else if(o!=null&&o.pdf_path){let E=this.toVaultRelativePath(o.pdf_path);E&&E.startsWith((0,p.normalizePath)(this.settings.outputPdfDir))&&(c=P.default.basename(E,".pdf")||c)}let l=o?c:await this.resolveUniqueBaseName(c,t),d=(0,p.normalizePath)(`${this.settings.outputPdfDir}/${l}.pdf`),h=(0,p.normalizePath)(`${K}/${t}.json`),_=(0,p.normalizePath)(`${Z}/${t}.json`),m=this.app.vault.adapter,y=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${l}.md`);if(o!=null&&o.note_path&&await m.exists(o.note_path)&&(y=(0,p.normalizePath)(o.note_path)),await m.exists(y)&&!await this.confirmOverwrite(y)){new p.Notice("Import canceled.");return}try{if(await this.ensureFolder(K),await this.ensureFolder(Z),await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let E=this.getLogFileRelativePath(),O=(0,p.normalizePath)(P.default.dirname(E));O&&await this.ensureFolder(O);let T=this.getSpellcheckerInfoRelativePath(),F=(0,p.normalizePath)(P.default.dirname(T));F&&await this.ensureFolder(F)}}catch(E){new p.Notice("Failed to create output folders."),console.error(E),this.clearStatusProgress();return}let x="",b="";try{if(this.settings.copyPdfToVault){let E=s.filePath?await U.promises.readFile(s.filePath):await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(d,this.bufferToArrayBuffer(E)),x=this.getAbsoluteVaultPath(d)}else if(s.filePath)x=s.filePath;else{await this.ensureFolder(this.settings.outputPdfDir);let E=await this.downloadZoteroPdf(s.key);await this.app.vault.adapter.writeBinary(d,this.bufferToArrayBuffer(E)),x=this.getAbsoluteVaultPath(d),new p.Notice("Local PDF path unavailable; copied PDF into vault for processing.")}b=this.buildPdfLinkForNote(x,s.key,t)}catch(E){new p.Notice("Failed to download PDF attachment."),console.error(E),this.clearStatusProgress();return}try{await this.app.vault.adapter.write(h,JSON.stringify(e,null,2))}catch(E){new p.Notice("Failed to write Zotero item JSON."),console.error(E),this.clearStatusProgress();return}let v=this.getPluginDir(),C=P.default.join(v,"tools","docling_extract.py"),S=P.default.join(v,"tools","index_redisearch.py"),A=null;try{A=await this.readDoclingQualityLabelFromPdf(x,r),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",A),0);let E=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;await this.runPythonStreaming(C,this.buildDoclingArgs(x,t,_,y,r,!0),F=>this.handleDoclingProgress(F,A),()=>{},E),A=await this.readDoclingQualityLabel(_),await this.annotateChunkJsonWithAttachmentKey(_,s.key);let O=await this.readDoclingMetadata(_),T=await this.maybeCreateOcrLayeredPdf(x,O,r);T&&(x=T,b=this.buildPdfLinkFromSourcePath(T),await this.updateChunkJsonSourcePdf(_,T))}catch(E){new p.Notice("Docling extraction failed. See console for details."),console.error(E),this.clearStatusProgress();return}try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",A),0);let E=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null,O=["--chunks-json",this.getAbsoluteVaultPath(_),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--progress"];this.appendEmbedSubchunkArgs(O),this.settings.embedIncludeMetadata&&O.push("--embed-include-metadata"),this.appendChunkTaggingArgs(O),await this.runPythonStreaming(S,O,T=>{if((T==null?void 0:T.type)==="progress"&&T.total){let F=Math.round(T.current/T.total*100),V=typeof T.message=="string"&&T.message.trim()?T.message:`Indexing chunks ${T.current}/${T.total}`,Y=this.formatStatusLabel(V,A);this.showStatusProgress(Y,F)}},()=>{})}catch(E){new p.Notice("RedisSearch indexing failed. See console for details."),console.error(E),this.clearStatusProgress();return}try{let E=await this.app.vault.adapter.read(y),O=await this.readChunkPayload(_),T=this.buildSyncedDoclingContent(t,O,E),F=await this.buildNoteMarkdown(n,(z=e.meta)!=null?z:{},t,b,s.key,h,T);await this.writeNoteWithSyncSuppressed(y,F)}catch(E){new p.Notice("Failed to finalize note markdown."),console.error(E),this.clearStatusProgress();return}try{await this.updateDocIndex({doc_id:t,note_path:y,note_title:l,zotero_title:a,pdf_path:x,attachment_key:s.key})}catch(E){console.error("Failed to update doc index",E)}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new p.Notice(`Indexed Zotero item ${t}.`)}async askZoteroLibrary(){await this.openChatView(!0)}getChatLeaf(){var n;let e=this.app.workspace.getLeavesOfType(ie);return e.length>0?e[0]:this.settings.chatPaneLocation==="right"?(n=this.app.workspace.getRightLeaf(!1))!=null?n:this.app.workspace.getLeaf("split"):this.app.workspace.getLeaf("tab")}async openChatView(e=!1){let n=this.getChatLeaf();await n.setViewState({type:ie,active:!0}),this.app.workspace.revealLeaf(n);let t=n.view;return t instanceof ce&&e&&t.focusInput(),t}async loadChatHistory(){let e=await this.getActiveChatSessionId();return this.loadChatHistoryForSession(e)}async saveChatHistory(e){let n=await this.getActiveChatSessionId();await this.saveChatHistoryForSession(n,e)}getChatSessionsDir(){return(0,p.normalizePath)(`${W}/chats`)}getChatExportDir(){let e=(this.settings.chatOutputDir||"").trim();return e?(0,p.normalizePath)(e):(0,p.normalizePath)("zotero/chats")}getChatSessionsIndexPath(){return(0,p.normalizePath)(`${this.getChatSessionsDir()}/index.json`)}getChatSessionPath(e){return(0,p.normalizePath)(`${this.getChatSessionsDir()}/${e}.json`)}async listChatSessions(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath();if(!await e.exists(n)){let t=new Date().toISOString(),i=[{id:"default",name:"New chat",createdAt:t,updatedAt:t}];return await this.writeChatSessionsIndex({version:1,active:"default",sessions:i}),i}try{let t=await e.read(n),i=JSON.parse(t);return(Array.isArray(i==null?void 0:i.sessions)?i.sessions:[]).filter(s=>s&&typeof s.id=="string").map(s=>({id:String(s.id),name:typeof s.name=="string"&&s.name.trim()?s.name.trim():String(s.id),createdAt:typeof s.createdAt=="string"?s.createdAt:new Date().toISOString(),updatedAt:typeof s.updatedAt=="string"?s.updatedAt:new Date().toISOString()}))}catch(t){return console.warn("Failed to read chat sessions index",t),[]}}async getActiveChatSessionId(){await this.migrateLegacyChatHistory();let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath();if(!await e.exists(n))return"default";try{let t=await e.read(n),i=JSON.parse(t);return(typeof(i==null?void 0:i.active)=="string"?i.active:"default")||"default"}catch(t){return"default"}}async setActiveChatSessionId(e){var s,a;await this.migrateLegacyChatHistory();let n=await this.readChatSessionsIndex(),t=((s=n.sessions)!=null?s:[]).some(o=>o.id===e),i=new Date().toISOString(),r=t?n.sessions:[...(a=n.sessions)!=null?a:[],{id:e,name:e,createdAt:i,updatedAt:i}];await this.writeChatSessionsIndex({version:1,active:e,sessions:r})}async createChatSession(e){var a;await this.migrateLegacyChatHistory();let n=this.generateChatId(),t=new Date().toISOString(),i=(e||"").trim()||"New chat",s=[...(a=(await this.readChatSessionsIndex()).sessions)!=null?a:[],{id:n,name:i,createdAt:t,updatedAt:t}];return await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionPath(n),JSON.stringify({version:1,messages:[]},null,2)),await this.writeChatSessionsIndex({version:1,active:n,sessions:s}),n}async renameChatSession(e,n){var s,a;await this.migrateLegacyChatHistory();let t=(n||"").trim();if(!t)return;let i=await this.readChatSessionsIndex(),r=((s=i.sessions)!=null?s:[]).map(o=>o.id===e?{...o,name:t}:o);await this.writeChatSessionsIndex({version:1,active:(a=i.active)!=null?a:"default",sessions:r})}async deleteChatSession(e){var a;if(await this.migrateLegacyChatHistory(),!e)return;let n=this.app.vault.adapter,t=await this.readChatSessionsIndex(),i=(a=t.sessions)!=null?a:[];if(i.length<=1)return;let r=i.filter(o=>o.id!==e);if(!r.length)return;let s=t.active===e?r[0].id:t.active;try{await n.remove(this.getChatSessionPath(e))}catch(o){console.warn("Failed to delete chat session file",o)}await this.writeChatSessionsIndex({version:1,active:s,sessions:r})}async loadChatHistoryForSession(e){await this.migrateLegacyChatHistory();let n=this.app.vault.adapter,t=this.getChatSessionPath(e||"default");if(!await n.exists(t))return[];let i=await n.read(t),r;try{r=JSON.parse(i)}catch(a){return[]}let s=Array.isArray(r)?r:r==null?void 0:r.messages;return Array.isArray(s)?s.filter(a=>a&&typeof a.content=="string").map(a=>({id:a.id||this.generateChatId(),role:a.role==="assistant"?"assistant":"user",content:a.content,citations:Array.isArray(a.citations)?a.citations:[],retrieved:Array.isArray(a.retrieved)?a.retrieved:[],createdAt:a.createdAt||new Date().toISOString()})):[]}async saveChatHistoryForSession(e,n){var c,l;await this.migrateLegacyChatHistory(),await this.ensureFolder(this.getChatSessionsDir());let t=this.app.vault.adapter,i=this.getChatSessionPath(e||"default"),r={version:1,messages:n};await t.write(i,JSON.stringify(r,null,2));let s=await this.readChatSessionsIndex(),a=new Date().toISOString(),o=((c=s.sessions)!=null?c:[]).map(d=>d.id===e?{...d,updatedAt:a}:d);await this.writeChatSessionsIndex({version:1,active:(l=s.active)!=null?l:e,sessions:o})}getRecentChatHistory(e){let n=Math.max(0,this.settings.chatHistoryMessages||0);return n?e.filter(i=>{var r;return i&&((r=i.content)==null?void 0:r.trim())}).slice(-n):[]}async readChatSessionsIndex(){let e=this.app.vault.adapter,n=this.getChatSessionsIndexPath(),t=new Date().toISOString();if(!await e.exists(n))return{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:t,updatedAt:t}]};try{let i=await e.read(n),r=JSON.parse(i),s=Array.isArray(r==null?void 0:r.sessions)?r.sessions:[];return{version:1,active:typeof(r==null?void 0:r.active)=="string"?r.active:"default",sessions:s.map(a=>({id:String(a.id),name:typeof a.name=="string"&&a.name.trim()?a.name.trim():String(a.id),createdAt:typeof a.createdAt=="string"?a.createdAt:t,updatedAt:typeof a.updatedAt=="string"?a.updatedAt:t}))}}catch(i){return console.warn("Failed to parse chat sessions index",i),{version:1,active:"default",sessions:[{id:"default",name:"New chat",createdAt:t,updatedAt:t}]}}}async writeChatSessionsIndex(e){await this.ensureFolder(this.getChatSessionsDir()),await this.app.vault.adapter.write(this.getChatSessionsIndexPath(),JSON.stringify(e,null,2))}async migrateLegacyChatHistory(){let e=this.app.vault.adapter,n=(0,p.normalizePath)(`${W}/chat.json`),t=this.getChatSessionsDir(),i=this.getChatSessionsIndexPath(),r=this.getChatSessionPath("default"),s=await e.exists(n),a=await e.exists(r),o=await e.exists(i);if(!s&&o)return;let c=new Date().toISOString();if(await this.ensureFolder(t),s&&!a)try{await e.rename(n,r)}catch(l){try{let d=await e.read(n);await e.write(r,d),await e.remove(n)}catch(d){console.warn("Failed to migrate legacy chat history",d)}}if(!o){let l=[{id:"default",name:"New chat",createdAt:c,updatedAt:c}];await this.writeChatSessionsIndex({version:1,active:"default",sessions:l})}if(o)try{let l=await e.read(i),d=JSON.parse(l),h=Array.isArray(d==null?void 0:d.sessions)?d.sessions:[],_=h.some(y=>(y==null?void 0:y.id)==="default"),m=h.map(y=>(y==null?void 0:y.id)==="default"&&typeof(y==null?void 0:y.name)=="string"&&y.name.trim().toLowerCase()==="default"?{...y,name:"New chat"}:y);_&&JSON.stringify(m)!==JSON.stringify(h)&&await this.writeChatSessionsIndex({version:1,active:typeof(d==null?void 0:d.active)=="string"?d.active:"default",sessions:m.map(y=>({id:String(y.id),name:typeof y.name=="string"?y.name:"New chat",createdAt:typeof y.createdAt=="string"?y.createdAt:c,updatedAt:typeof y.updatedAt=="string"?y.updatedAt:c}))})}catch(l){}}isPlaceholderChatName(e){let n=(e||"").trim().toLowerCase();return n==="new chat"||n==="default"}normalizeChatTitle(e){let n=(e||"").replace(/\s+/g," ").trim();return n.length>60?`${n.slice(0,57)}...`:n}guessTitleFromMessages(e){let n=e.find(i=>i.role==="user"&&i.content.trim());if(!n)return"New chat";let t=n.content.replace(/\s+/g," ").trim().split(" ").slice(0,8).join(" ");return this.normalizeChatTitle(t||"New chat")}async suggestChatTitleWithLlm(e){var s,a,o;let n=(this.settings.chatBaseUrl||"").trim(),t=(this.settings.chatModel||"").trim();if(!n||!t)return null;let i=n.replace(/\/$/,"");if(i.toLowerCase().includes("api.openai.com")&&(!this.settings.chatApiKey||t.includes("/")))return null;try{let c=`${i}/chat/completions`,l={"Content-Type":"application/json"};this.settings.chatApiKey&&(l.Authorization=`Bearer ${this.settings.chatApiKey}`);let d=e.slice(-8).map(x=>`${x.role.toUpperCase()}: ${x.content}`).join(`
`).slice(0,4e3),_=await fetch(c,{method:"POST",headers:l,body:JSON.stringify({model:t,temperature:.2,messages:[{role:"system",content:"Generate a short, specific title (3-7 words) for the chat. No quotes, no punctuation at the end."},{role:"user",content:d}]})});if(!_.ok)return null;let m=await _.json(),y=(o=(a=(s=m==null?void 0:m.choices)==null?void 0:s[0])==null?void 0:a.message)==null?void 0:o.content;return typeof y!="string"?null:this.normalizeChatTitle(y.replace(/^\"|\"$/g,"").trim())}catch(c){return console.warn("Chat title suggestion failed",c),null}}async finalizeChatSessionNameIfNeeded(e,n,t={}){var l;if(!e)return;let i=n||[];if(!i.some(d=>d.role==="user"&&d.content.trim())||!t.force&&i.length<4)return;let a=((l=(await this.readChatSessionsIndex()).sessions)!=null?l:[]).find(d=>d.id===e);if(!a||!this.isPlaceholderChatName(a.name))return;let c=await this.suggestChatTitleWithLlm(i)||this.guessTitleFromMessages(i);!c||this.isPlaceholderChatName(c)||await this.renameChatSession(e,c)}async runRagQueryStreaming(e,n,t,i=[]){if(await this.ensureBundledTools(),!await this.ensureRedisAvailable("chat query")){t({answer:"Redis is not reachable. Please start Redis Stack and try again."});return}let r=this.getPluginDir(),s=P.default.join(r,"tools","rag_query_redisearch.py"),a=["--query",e,"--k","5","--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--chat-base-url",this.settings.chatBaseUrl,"--chat-api-key",this.settings.chatApiKey,"--chat-model",this.settings.chatModel,"--temperature",String(this.settings.chatTemperature),"--stream"],o=this.buildChatHistoryPayload(i),c=await this.writeChatHistoryTemp(o);c!=null&&c.absolutePath&&a.push("--history-file",c.absolutePath);try{await this.runPythonStreaming(s,a,l=>{if((l==null?void 0:l.type)==="delta"&&typeof l.content=="string"){n(l.content);return}if((l==null?void 0:l.type)==="final"){t(l);return}l!=null&&l.answer&&t(l)},t)}finally{if(c!=null&&c.relativePath)try{await this.app.vault.adapter.remove(c.relativePath)}catch(l){console.warn("Failed to remove chat history temp file",l)}}}buildChatHistoryPayload(e){return this.getRecentChatHistory(e).map(t=>({role:t.role,content:t.content}))}async writeChatHistoryTemp(e){if(!e.length)return null;let n=(0,p.normalizePath)(`${W}/tmp`);await this.ensureFolder(n);let t=`chat_history_${Date.now()}_${Math.random().toString(36).slice(2,8)}.json`,i=(0,p.normalizePath)(`${n}/${t}`),r={version:1,messages:e};return await this.app.vault.adapter.write(i,JSON.stringify(r,null,2)),{relativePath:i,absolutePath:this.getAbsoluteVaultPath(i)}}async resolveCitationDisplay(e){let n=await this.getDocIndexEntry(e.doc_id);(!n||!n.note_title||!n.zotero_title||!n.note_path||!n.pdf_path)&&(n=await this.hydrateDocIndexFromCache(e.doc_id));let t=e.doc_id?await this.resolveNotePathForDocId(e.doc_id):n==null?void 0:n.note_path,i=(n==null?void 0:n.zotero_title)||(n==null?void 0:n.note_title)||(t?P.default.basename(t,".md"):e.doc_id||"?"),r=this.formatCitationPageLabel(e),s=e.page_start?String(e.page_start):"",a=(n==null?void 0:n.pdf_path)||e.source_pdf||"",o=e.attachment_key||(n==null?void 0:n.attachment_key),c=e.annotation_key||this.extractAnnotationKey(e.chunk_id),l=e.doc_id?this.buildZoteroDeepLink(e.doc_id,o,s,c):void 0;return{noteTitle:i,pageLabel:r,notePath:t||void 0,pdfPath:a||void 0,zoteroUrl:l,pageStart:s||void 0}}async formatInlineCitations(e,n,t=[]){if(!e)return e;let i=/\[\[?cite:([A-Za-z0-9]+):([^\]\n]+?)\]?\]/g,r=Array.from(e.matchAll(i));if(r.length===0)return e;let s=new Map;for(let o of r){let c=o[0];if(s.has(c))continue;let l=o[1],d=o[2].trim(),h=d.match(/^(\d+)-(\d+)(?::([A-Za-z0-9]+))?$/),_="",m="",y,x;h?(_=h[1],m=h[2],y=h[3]):x=d;let b=x?t.find(R=>{let z=typeof R.doc_id=="string"?R.doc_id:"";if(z&&z!==l)return!1;let E=typeof R.chunk_id=="string"?R.chunk_id:"";return E?E===x||E===`${l}:${x}`||E.endsWith(`:${x}`):!1}):void 0;b&&(!_&&b.page_start!==void 0&&(_=String(b.page_start)),!m&&b.page_end!==void 0&&(m=String(b.page_end)),!y&&typeof b.chunk_id=="string"&&(y=this.extractAnnotationKey(b.chunk_id)));let v={doc_id:l,chunk_id:b==null?void 0:b.chunk_id,annotation_key:y};(_||m)&&(v.page_start=_||m,v.page_end=m||_,v.pages=`${v.page_start}-${v.page_end}`),b!=null&&b.source_pdf&&(v.source_pdf=String(b.source_pdf));let C=(_||m?n.find(R=>{var z,E;return R.doc_id===l&&String((z=R.page_start)!=null?z:"")===_&&String((E=R.page_end)!=null?E:"")===m}):void 0)||n.find(R=>R.doc_id===l)||v;!C.annotation_key&&y&&(C={...C,annotation_key:y});let S=await this.resolveCitationDisplay(C),A=`${S.noteTitle} p. ${S.pageLabel}`,N=this.normalizeChunkIdForNote(C.chunk_id,l);if(this.settings.preferObsidianNoteForCitations&&S.notePath&&N)s.set(c,this.buildNoteChunkLink(S.notePath,N,A));else if(S.zoteroUrl)s.set(c,`[${A}](${S.zoteroUrl})`);else{let R=S.pageLabel?`${l} p. ${S.pageLabel}`:`${l}`;s.set(c,`(${R})`)}}let a=e;for(let[o,c]of s)a=a.split(o).join(c);return this.repairTruncatedWikilinks(a)}repairTruncatedWikilinks(e){if(!e||typeof e!="string")return e;let n=e;return n=n.replace(/\[\[([^\]\n#]+#zrr-chunk:[^\]\n|]+)(?=\n|$)/g,"[[$1]]"),n=n.replace(/\[\[([^\]\n#]+#zrr-chunk:([^\]\n|]+))\]\]/g,(t,i,r)=>{let s=this.buildDefaultChunkLabel(String(r||"").trim());return`[[${i}|${s}]]`}),n}buildDefaultChunkLabel(e){let n=(e||"").trim(),t=n.match(/^p(\d+)$/i);return t?`p. ${t[1]}`:n||"source"}handleDoclingProgress(e,n){if(!e||e.type!=="progress")return;let t=Number(e.percent);if(!Number.isFinite(t))return;let i=typeof e.message=="string"&&e.message.trim()?e.message:"Docling extraction...";this.showStatusProgress(this.formatStatusLabel(i,n),Math.round(t))}async createChatNoteFromSession(e,n,t){let i=this.getChatExportDir();await this.ensureFolder(i),await this.getDocIndex();let r=this.sanitizeFileName(n)||"Zotero Chat",s=this.formatTimestamp(new Date),a=(0,p.normalizePath)(`${i}/${r}.md`),o=await this.resolveUniqueNotePath(a,`${r}-${s}.md`),c=await this.buildChatTranscript(n,t);await this.app.vault.adapter.write(o,c),await this.openNoteInNewTab(o),new p.Notice(`Chat copied to ${o}`)}async buildChatTranscript(e,n){var i,r,s;let t=[];t.push(`# ${e||"Zotero Chat"}`),t.push(""),t.push(`Created: ${new Date().toISOString()}`),t.push("");for(let a of n){let o=a.role==="user"?"## You":"## Assistant";t.push(o),t.push("");let c=a.role==="assistant"?await this.formatInlineCitations(a.content||"",(i=a.citations)!=null?i:[],(r=a.retrieved)!=null?r:[]):a.content||"";if(t.push(c.trim()),t.push(""),a.role==="assistant"&&((s=a.citations)!=null&&s.length)){t.push("### Relevant context sources");let l=this.formatCitationsMarkdown(a.citations);l&&(t.push(l),t.push(""))}}return t.join(`
`).trim()+`
`}async resolveUniqueNotePath(e,n){let t=this.app.vault.adapter;if(!await t.exists(e))return e;let i=P.default.dirname(e),r=(0,p.normalizePath)(P.default.join(i,n));if(!await t.exists(r))return r;let s=2;for(;s<1e3;){let a=(0,p.normalizePath)(P.default.join(i,`${P.default.basename(n,".md")}-${s}.md`));if(!await t.exists(a))return a;s+=1}return r}formatTimestamp(e){let n=t=>String(t).padStart(2,"0");return[e.getFullYear(),n(e.getMonth()+1),n(e.getDate()),"-",n(e.getHours()),n(e.getMinutes())].join("")}async openCitationTarget(e,n){let t=n!=null?n:await this.resolveCitationDisplay(e),i=this.normalizeChunkIdForNote(e.chunk_id,e.doc_id),r=this.settings.preferObsidianNoteForCitations;if(!(r&&t.notePath&&i&&await this.openNoteAtChunk(t.notePath,i))){if(r&&t.notePath){await this.openNoteInMain(t.notePath);return}if(!r&&t.zoteroUrl){this.openExternalUrl(t.zoteroUrl);return}if(!(t.pdfPath&&await this.openPdfInMain(t.pdfPath,t.pageStart))){if(t.zoteroUrl){this.openExternalUrl(t.zoteroUrl);return}new p.Notice("Unable to open citation target.")}}}async rebuildNoteFromCache(){let e=await this.promptDocId();if(!e){new p.Notice("No doc_id provided.");return}await this.rebuildNoteFromCacheForDocId(e,!0)&&new p.Notice(`Rebuilt Zotero note for ${e}.`)}async rebuildDocIndexFromCache(){var l,d,h;let e=this.app.vault.adapter,n=await this.listDocIds(K),t=await this.listDocIds(Z),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(i),s=Array.from(new Set([...n,...t,...r]));if(s.length===0){new p.Notice("No cached items found.");return}this.showStatusProgress("Rebuilding doc index...",0);let a=await this.getDocIndex(),o=0;for(let _ of s){o+=1;let m={},y=i[_];y&&(m.note_path=y.note_path,m.note_title=y.note_title);let x=(0,p.normalizePath)(`${K}/${_}.json`);if(await e.exists(x))try{let C=await e.read(x),S=JSON.parse(C),A=(d=(l=S==null?void 0:S.data)!=null?l:S)!=null?d:{},N=typeof A.title=="string"?A.title:"";N&&(m.zotero_title=N);let R=this.sanitizeFileName(N)||_,z=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${R}.md`),E=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${R}-${_}.md`);await e.exists(z)?(m.note_path=z,m.note_title=P.default.basename(z,".md")):await e.exists(E)&&(m.note_path=E,m.note_title=P.default.basename(E,".md"))}catch(C){console.error("Failed to read cached item JSON",C)}let b=(0,p.normalizePath)(`${Z}/${_}.json`);if(await e.exists(b))try{let C=await e.read(b),S=JSON.parse(C);typeof(S==null?void 0:S.source_pdf)=="string"&&(m.pdf_path=S.source_pdf)}catch(C){console.error("Failed to read cached chunks JSON",C)}if(Object.keys(m).length>0){let S={...(h=a[_])!=null?h:{doc_id:_},...m,doc_id:_,updated_at:new Date().toISOString()};!S.note_title&&S.note_path&&(S.note_title=P.default.basename(S.note_path,".md")),a[_]=S}let v=Math.round(o/s.length*100);this.showStatusProgress(`Rebuilding doc index ${o}/${s.length}`,v)}await this.saveDocIndex(a);let c=await this.pruneDocIndexOrphans();this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),c.removed>0?new p.Notice(`Rebuilt doc index for ${s.length} items; pruned ${c.removed} stale entries.`):new p.Notice(`Rebuilt doc index for ${s.length} items.`)}async recreateMissingNotesFromCache(){if(this.recreateMissingNotesActive){new p.Notice("Recreate missing notes is already running.");return}this.recreateMissingNotesActive=!0,this.recreateMissingNotesAbort=!1,this.recreateMissingNotesProcess=null;try{let e=this.app.vault.adapter,n=await this.listDocIds(K),t=await this.listDocIds(Z),i=await this.scanNotesForDocIds(this.settings.outputNoteDir),r=Object.keys(i),s=Array.from(new Set([...n,...t,...r]));if(s.length===0){new p.Notice("No cached items found.");return}let a=[];for(let l of s){if(i[l])continue;let d=await this.getDocIndexEntry(l);if(d!=null&&d.note_path&&await e.exists(d.note_path))continue;let h=await this.inferNotePathFromCache(l);h&&await e.exists(h)||a.push(l)}if(a.length===0){new p.Notice("No missing notes detected.");return}this.showStatusProgress("Recreating missing notes...",0);let o=0,c=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;for(let l=0;l<a.length&&!this.recreateMissingNotesAbort;l+=1){let d=a[l],h=Math.round((l+1)/a.length*100);this.showStatusProgress(`Recreating ${l+1}/${a.length}`,h),c&&this.appendToLogFile(c,`Recreate missing note doc_id ${d} (${l+1}/${a.length})`,"recreate_missing_notes","INFO"),await this.rebuildNoteFromCacheForDocId(d,!1)&&(o+=1)}this.recreateMissingNotesAbort?(this.showStatusProgress("Canceled",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new p.Notice(`Canceled after ${o}/${a.length} notes.`)):(this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new p.Notice(`Recreated ${o}/${a.length} missing notes.`))}finally{this.recreateMissingNotesActive=!1,this.recreateMissingNotesProcess=null}}cancelRecreateMissingNotesFromCache(){if(!this.recreateMissingNotesActive){new p.Notice("No recreate job is running.");return}this.recreateMissingNotesAbort=!0;let e=this.recreateMissingNotesProcess;if(e&&!e.killed){try{e.kill("SIGTERM")}catch(n){console.warn("Failed to terminate recreate process",n)}window.setTimeout(()=>{if(e&&!e.killed)try{e.kill("SIGKILL")}catch(n){console.warn("Failed to force-kill recreate process",n)}},2e3)}new p.Notice("Canceling recreate missing notes...")}buildRedisCommand(e){let n=[`*${e.length}\r
`];for(let t of e){let i=String(t);n.push(`$${Buffer.byteLength(i)}\r
${i}\r
`)}return n.join("")}async checkRedisConnection(e=2e3){let n=(this.settings.redisUrl||"").trim();if(!n)return{ok:!1,message:"Redis URL is not configured."};let t;try{t=new URL(n)}catch(c){return{ok:!1,message:"Redis URL is invalid."}}let i=t.hostname||"127.0.0.1",r=Number(t.port)||(t.protocol==="rediss:"||t.protocol==="redis+tls:"?6380:6379),s=decodeURIComponent(t.username||""),a=decodeURIComponent(t.password||""),o=t.protocol==="rediss:"||t.protocol==="redis+tls:";return new Promise(c=>{let l=o?Ve.default.connect({host:i,port:r,timeout:e,rejectUnauthorized:!1}):_e.default.createConnection({host:i,port:r,timeout:e}),d="",h=a||s?"auth":"ping",_=!1,m=(x,b)=>{if(!_){_=!0;try{l.end(),l.destroy()}catch(v){}c({ok:x,message:b})}},y=x=>{let b=x.trim();if(b){if(b.startsWith("-NOAUTH")){m(!1,"Redis requires authentication. Check your Redis URL credentials.");return}if(b.startsWith("-WRONGPASS")||b.toLowerCase().includes("invalid password")){m(!1,"Redis authentication failed. Check your Redis URL credentials.");return}if(b.startsWith("-ERR")){m(!1,`Redis error: ${b}`);return}if(h==="auth"){if(b.startsWith("+OK")){h="ping",d="",l.write(this.buildRedisCommand(["PING"]));return}m(!1,`Redis auth failed: ${b}`);return}b.startsWith("+PONG")&&m(!0)}};l.on("connect",()=>{if(h==="auth"){let x=s?["AUTH",s,a]:["AUTH",a];l.write(this.buildRedisCommand(x))}else l.write(this.buildRedisCommand(["PING"]))}),l.on("data",x=>{var v;d+=x.toString();let b=d.split(/\r?\n/);d=(v=b.pop())!=null?v:"";for(let C of b)y(C)}),l.on("timeout",()=>{m(!1,"Timed out connecting to Redis.")}),l.on("error",x=>{m(!1,`Redis connection failed: ${x.message}`)}),l.on("close",()=>{_||m(!1,"Redis connection closed unexpectedly.")})})}async ensureRedisAvailable(e){let n=await this.checkRedisConnection();if(n.ok)return!0;let t=n.message?`Redis unavailable for ${e}: ${n.message}`:`Redis unavailable for ${e}.`;return this.notifyContainerOnce(t),!1}getPythonErrorMessage(e){if(e instanceof Error)return e.message||String(e);if(typeof e=="string")return e;try{return JSON.stringify(e)}catch(n){return String(e)}}classifyIndexingError(e){let n=e.toLowerCase();return n.includes("embedding dim mismatch")||n.includes("dim mismatch")?"embed_dim_mismatch":n.includes("chunks json not found")?"chunks_missing":n.includes("embedding failed")||n.includes("embedding request failed")||n.includes("model does not exist")||n.includes("failed to load model")||n.includes("connection refused")||n.includes("econnrefused")||n.includes("max retries exceeded")||n.includes("failed to establish a new connection")||n.includes("failed to fetch models")?"embed_failure":"unknown"}async confirmRebuildIndex(e){return new Promise(n=>{new Te(this.app,e,n).open()})}async confirmPurgeRedisOrphans(){return new Promise(e=>{new Ne(this.app,e).open()})}async dropRedisIndex(e=!1){await this.ensureBundledTools();let n=this.getPluginDir(),t=P.default.join(n,"tools","drop_redis_index.py"),i=["--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName()];e&&i.push("--drop-docs"),await this.runPython(t,i)}async dropAndRebuildRedisIndex(){if(this.reindexCacheActive){new p.Notice("Reindex already running.");return}if(!(!await this.ensureRedisAvailable("drop/rebuild")||!await this.confirmRebuildIndex("This will remove the current RedisSearch index and rebuild it from cached chunks."))){try{await this.dropRedisIndex(!0)}catch(n){let t=n instanceof Error?n.message:String(n);if(t.includes("Unknown Index name")||t.includes("Unknown index name"))console.warn("Redis index missing; skipping drop step.");else{console.error("Failed to drop Redis index",n),new p.Notice("Failed to drop Redis index. See console for details.");return}}await this.reindexRedisFromCache()}}async purgeRedisOrphanedKeys(){var r,s,a,o,c;if(!await this.ensureRedisAvailable("purge orphans")||!await this.confirmPurgeRedisOrphans())return;try{await this.ensureBundledTools()}catch(l){new p.Notice("Failed to sync bundled tools. See console for details."),console.error(l);return}let n=this.getPluginDir(),t=P.default.join(n,"tools","purge_redis_orphans.py"),i=["--redis-url",this.settings.redisUrl,"--key-prefix",this.getRedisKeyPrefix(),"--chunk-dir",this.getAbsoluteVaultPath(Z),"--item-dir",this.getAbsoluteVaultPath(K)];try{let l=await this.runPythonWithOutput(t,i),d=null;try{d=l?JSON.parse(l):null}catch(y){console.warn("Failed to parse purge output",y)}if(!d){new p.Notice("Purge completed. See console for details.");return}let h=[`Keys scanned: ${(r=d.keys_scanned)!=null?r:0}`,`Keys deleted: ${(s=d.keys_deleted)!=null?s:0}`,`Docs checked: ${(a=d.docs_checked)!=null?a:0}`,`Orphan docs: ${(o=d.orphan_doc_count)!=null?o:0}`],_=await this.pruneDocIndexOrphans();h.push(`Doc index entries removed: ${_.removed}`),_.updated>0&&h.push(`Doc index entries updated: ${_.updated}`);let m=Array.isArray(d.sample_orphan_doc_ids)?d.sample_orphan_doc_ids.filter(Boolean):[];m.length&&h.push("","Sample doc_ids:",...m.map(y=>`- ${y}`)),new ue(this.app,"Redis orphan purge",h.join(`
`)).open(),((c=d.keys_deleted)!=null?c:0)===0?new p.Notice("No orphaned Redis keys found."):new p.Notice(`Deleted ${d.keys_deleted} Redis keys.`)}catch(l){console.error("Failed to purge Redis orphans",l),new p.Notice("Failed to purge Redis orphans. See console for details.")}}async reindexRedisFromCache(){if(this.reindexCacheActive){new p.Notice("Reindex already running.");return}this.reindexCacheActive=!0;let e=null,n=0;try{await this.ensureBundledTools()}catch(o){new p.Notice("Failed to sync bundled tools. See console for details."),console.error(o),this.reindexCacheActive=!1;return}if(!await this.ensureRedisAvailable("reindex")){this.reindexCacheActive=!1;return}let t=await this.listDocIds(Z);if(t.length===0){new p.Notice("No cached chunks found."),this.reindexCacheActive=!1;return}let i=this.getPluginDir(),r=P.default.join(i,"tools","index_redisearch.py"),s=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null,a=0;this.showStatusProgress("Reindexing cached chunks...",0),s&&this.appendToLogFile(s,`Reindex started: ${t.length} cached items`,"index_redisearch","INFO");for(let o of t){a+=1;let c=Math.round(a/t.length*100);this.showStatusProgress(`Reindexing ${a}/${t.length}`,c);let l=(0,p.normalizePath)(`${Z}/${o}.json`);try{let d=["--chunks-json",this.getAbsoluteVaultPath(l),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"];this.appendEmbedSubchunkArgs(d),this.settings.embedIncludeMetadata&&d.push("--embed-include-metadata"),this.appendChunkTaggingArgs(d,{allowRegenerate:!1}),s&&this.appendToLogFile(s,`Reindexing doc_id ${o}`,"index_redisearch","INFO"),await this.runPythonStreaming(r,d,h=>{!s||!h||(h==null?void 0:h.type)==="progress"&&h.message&&this.appendToLogFile(s,String(h.message),"index_redisearch","INFO")},()=>{},s,"index_redisearch")}catch(d){n+=1;let h=this.getPythonErrorMessage(d),_=this.classifyIndexingError(h);if(console.error(`Failed to reindex ${o}`,d),_==="chunks_missing"){new p.Notice(`Chunks cache missing for ${o}. Reimport or rebuild this note.`);continue}if(_==="embed_dim_mismatch"){e={kind:"embed_dim_mismatch",message:h};break}if(_==="embed_failure"){e={kind:"embed_failure",message:h};break}}}if(e){if(this.showStatusProgress("Aborted",100),window.setTimeout(()=>this.clearStatusProgress(),1200),this.reindexCacheActive=!1,e.kind==="embed_dim_mismatch"){if(await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema."))try{await this.dropRedisIndex(!0),await this.reindexRedisFromCache()}catch(c){new p.Notice("Failed to drop/rebuild the Redis index. See console for details."),console.error(c)}}else new p.Notice("Embedding provider error detected. Fix the provider/model settings and rerun reindexing.");return}this.showStatusProgress("Done",100),window.setTimeout(()=>this.clearStatusProgress(),1200),n===0?new p.Notice(`Reindexed ${t.length} cached items.`):new p.Notice(`Reindexed ${t.length-n}/${t.length} items (see console).`);try{await this.pruneDocIndexOrphans()}catch(o){console.warn("Failed to prune doc index orphans",o)}this.reindexCacheActive=!1}async reindexChunkUpdates(e,n,t,i){if(!t.length&&!i.length||!await this.ensureRedisAvailable("reindex updates"))return;let r=this.getPluginDir(),s=P.default.join(r,"tools","index_redisearch.py"),a=["--chunks-json",this.getAbsoluteVaultPath(n),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert"];this.appendEmbedSubchunkArgs(a),this.settings.embedIncludeMetadata&&a.push("--embed-include-metadata"),this.appendChunkTaggingArgs(a,{allowRegenerate:!1}),t.length&&a.push("--chunk-ids",t.join(",")),i.length&&a.push("--delete-chunk-ids",i.join(","));try{await this.runPython(s,a)}catch(o){let c=this.getPythonErrorMessage(o),l=this.classifyIndexingError(c);if(console.error(`Failed to reindex updated chunks for ${e}`,o),l==="embed_dim_mismatch"){if(await this.confirmRebuildIndex("Embedding model output dimension does not match the Redis index schema."))try{await this.dropRedisIndex(!0),await this.reindexRedisFromCache()}catch(h){new p.Notice("Failed to drop/rebuild the Redis index. See console for details."),console.error(h)}return}l==="embed_failure"&&new p.Notice("Embedding provider error detected. Fix the provider/model settings and rerun.")}}async promptZoteroItem(){return new Promise(e=>{new Ie(this.app,this,e).open()})}async listDocIds(e){let n=this.app.vault.adapter,t=(0,p.normalizePath)(e);return await n.exists(t)?(await n.list(t)).files.filter(r=>r.endsWith(".json")).map(r=>P.default.basename(r,".json")):[]}async listMarkdownFiles(e){let n=this.app.vault.adapter,t=(0,p.normalizePath)(e);if(!await n.exists(t))return[];let i=[t],r=[];for(;i.length>0;){let s=i.pop();if(!s)continue;let a=await n.list(s);for(let o of a.files)o.endsWith(".md")&&r.push(o);for(let o of a.folders)i.push(o)}return r}extractDocIdFromFrontmatter(e){let n=e.match(/^---\s*\n([\s\S]*?)\n---/);if(!n)return null;let i=n[1].split(/\r?\n/);for(let r of i){let s=r.trim();if(!s||s.startsWith("#"))continue;let a=s.split(":");if(a.length<2)continue;let o=a[0].trim().toLowerCase();if(o!=="doc_id"&&o!=="zotero_key")continue;let l=s.slice(s.indexOf(":")+1).trim().replace(/^["']|["']$/g,"").trim();if(l)return l}return null}hasDocIdFieldInFrontmatter(e){let n=e.match(/^---\s*\n([\s\S]*?)\n---/);return n?/^\s*doc_id\s*:/im.test(n[1]):!1}ensureDocIdInFrontmatter(e,n){let t=e.trim(),i=`doc_id: ${this.escapeYamlString(n)}`;return t?/^\s*doc_id\s*:/im.test(t)?t:`${i}
${t}`:i}ensureDocIdInNoteContent(e,n){var _,m;let t=e.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/),i=`doc_id: ${this.escapeYamlString(n)}`;if(!t)return`---
${i}
---

${e.trimStart()}`;let s=((_=t[1])!=null?_:"").split(/\r?\n/),a=!1,o=s.map(y=>/^\s*doc_id\s*:/i.test(y)?(a=!0,i):y);a||o.unshift(i);let c=o.join(`
`).trim(),l=(m=t.index)!=null?m:0,d=e.slice(0,l),h=e.slice(l+t[0].length).replace(/^\n+/,"");return`${d}---
${c}
---
${h}`}async findDocIdByNotePath(e){let n=(0,p.normalizePath)(e),t=await this.getDocIndex();for(let[i,r]of Object.entries(t))if(r!=null&&r.note_path&&(0,p.normalizePath)(r.note_path)===n)return i;return null}async resolveDocIdForNote(e,n){let t=this.extractDocIdFromFrontmatter(n),i=this.hasDocIdFieldInFrontmatter(n);if(t&&i)return t;let r=this.extractDocIdFromSyncMarker(n),s=await this.findDocIdByNotePath(e.path),a=t||r||s;if(!a)return re.test(n)&&!this.missingDocIdWarned.has(e.path)&&(new p.Notice("This Zotero note is missing a doc_id in frontmatter. Reimport or add doc_id manually."),this.missingDocIdWarned.add(e.path)),null;if(!i||!t){let o=this.ensureDocIdInNoteContent(n,a);o!==n&&await this.writeNoteWithSyncSuppressed(e.path,o)}return a}async scanNotesForDocIds(e){var r;let n=this.app.vault.adapter,t=await this.listMarkdownFiles(e),i={};for(let s of t)try{let a=await n.read(s),o=(r=this.extractDocIdFromFrontmatter(a))!=null?r:this.extractDocIdFromSyncMarker(a);if(!o)continue;i[o]={doc_id:o,note_path:s,note_title:P.default.basename(s,".md"),updated_at:new Date().toISOString()}}catch(a){console.error("Failed to read note for doc_id scan",a)}return i}setupStatusBar(){let e=this.addStatusBarItem();e.addClass("zrr-status-progress"),e.addClass("status-bar-item-segment"),e.style.display="none";let n=e.createEl("span",{text:"Idle"});n.addClass("zrr-status-label");let i=e.createEl("div",{cls:"zrr-status-bar"}).createEl("div",{cls:"zrr-status-bar-inner"});this.statusBarEl=e,this.statusLabelEl=n,this.statusBarInnerEl=i}showStatusProgress(e,n){if(!(!this.statusBarEl||!this.statusLabelEl||!this.statusBarInnerEl))if(this.statusBarEl.style.display="flex",this.statusLabelEl.setText(e),n===null)this.statusBarInnerEl.addClass("indeterminate"),this.statusBarInnerEl.style.width="40%";else{this.statusBarInnerEl.removeClass("indeterminate");let t=Math.max(0,Math.min(100,n));this.statusBarInnerEl.style.width=`${t}%`}}clearStatusProgress(){!this.statusBarEl||!this.statusBarInnerEl||(this.statusBarEl.style.display="none",this.statusBarInnerEl.removeClass("indeterminate"),this.statusBarInnerEl.style.width="0%")}formatStatusLabel(e,n){return n?`${e} (Text layer quality ${n})`:e}async readDoclingQualityLabel(e){var n;try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t),r=(n=i==null?void 0:i.metadata)==null?void 0:n.confidence_proxy;if(typeof r=="number")return r.toFixed(2)}catch(t){console.warn("Failed to read Docling quality metadata",t)}return null}async readDoclingMetadata(e){try{let n=await this.app.vault.adapter.read(e),t=JSON.parse(n),i=t==null?void 0:t.metadata;if(i&&typeof i=="object")return i}catch(n){console.warn("Failed to read Docling metadata",n)}return null}async readDoclingQualityLabelFromPdf(e,n){try{let t=this.getPluginDir(),i=P.default.join(t,"tools","docling_extract.py"),r=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,s=["--quality-only","--pdf",e,"--ocr",r],a=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;a&&s.push("--log-file",a),this.settings.ocrMode==="force_low_quality"&&s.push("--force-ocr-low-quality"),s.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),n&&s.push("--language-hint",n);let o=await this.runPythonWithOutput(i,s,a),c=JSON.parse(o),l=c==null?void 0:c.confidence_proxy;if(typeof l=="number")return l.toFixed(2)}catch(t){console.warn("Failed to read Docling quality from PDF",t)}return null}async promptDocId(){return new Promise(e=>{new ye(this.app,"Rebuild Zotero note from cache","Enter Zotero doc_id (e.g., ABC123)",n=>e(n),"Doc ID cannot be empty.").open()})}async promptLanguageHint(){return new Promise(e=>{new Oe(this.app,e).open()})}registerRibbonIcons(){(0,p.addIcon)("zrr-picker",on),(0,p.addIcon)("zrr-chat",ln),this.addRibbonIcon("zrr-picker","Import Zotero item and index",()=>this.importZoteroItem()).addClass("zrr-ribbon-picker"),this.addRibbonIcon("zrr-chat","Open Zotero RAG chat",()=>this.openChatView(!0)).addClass("zrr-ribbon-chat")}async confirmOverwrite(e){return new Promise(n=>{new Re(this.app,e,n).open()})}async resolveLanguageHint(e,n){let t=typeof e.language=="string"?e.language:"",i=this.normalizeZoteroLanguage(t);if(i)return i;let r=await this.promptLanguageHint();if(r===null)return console.info("Language selection canceled."),null;let s=this.normalizeZoteroLanguage(r);if(!s)return console.info("Language selection empty; skipping Zotero update."),"";if(e.language=s,console.info("Language selected",{language:s,itemKey:n}),n)try{await this.updateZoteroItemLanguage(n,e,s),new p.Notice("Saved language to Zotero.")}catch(a){new p.Notice("Failed to write language back to Zotero."),console.error(a)}else console.warn("Language selected but itemKey is missing; skipping Zotero update.");return s}normalizeZoteroLanguage(e){return(e||"").trim().toLowerCase()}buildDoclingLanguageHint(e){let n=this.normalizeZoteroLanguage(e!=null?e:"");if(!n)return null;let t=n.split(/[^a-z]+/).filter(Boolean),i=t.some(s=>["de","deu","ger","german"].includes(s)),r=t.some(s=>["en","eng","english"].includes(s));return i&&r?"deu+eng":i?"deu":r?"eng":t.length===1&&Me[t[0]]?Me[t[0]]:n}async fetchZoteroItem(e){try{let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),t=await this.requestLocalApi(n,`Zotero item fetch failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(n){return console.warn("Failed to fetch Zotero item from local API",n),this.canUseWebApi()?this.fetchZoteroItemWeb(e):null}}async fetchZoteroItemCsl(e){try{let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}?format=csljson`),t=await this.requestLocalApi(n,`Zotero CSL fetch failed for ${n}`);return this.parseCslPayload(t)}catch(n){return console.warn("Failed to fetch Zotero CSL from local API",n),this.canUseWebApi()?this.fetchZoteroItemCslWeb(e):null}}async fetchZoteroCollectionTitle(e){var r,s,a,o,c,l;let n=(e||"").trim();if(!n)return"";let t=this.collectionTitleCache.get(n);if(t!==void 0)return t;let i=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/collections/${n}`);try{let d=await this.requestLocalApi(i,`Zotero collection fetch failed for ${i}`),h=JSON.parse(d.toString("utf8")),_=String((a=(s=(r=h==null?void 0:h.data)==null?void 0:r.name)!=null?s:h==null?void 0:h.name)!=null?a:"").trim();return this.collectionTitleCache.set(n,_),_}catch(d){if(!this.canUseWebApi())return this.collectionTitleCache.set(n,""),"";try{let h=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/collections/${n}`),_=await this.requestWebApi(h,`Zotero Web API collection fetch failed for ${h}`),m=JSON.parse(_.toString("utf8")),y=String((l=(c=(o=m==null?void 0:m.data)==null?void 0:o.name)!=null?c:m==null?void 0:m.name)!=null?l:"").trim();return this.collectionTitleCache.set(n,y),y}catch(h){return console.warn("Failed to fetch Zotero collection title",h),this.collectionTitleCache.set(n,""),""}}}async resolveCollectionTitles(e){let t=(Array.isArray(e.collections)?e.collections:[]).map(r=>String(r||"").trim()).filter(Boolean);if(!t.length)return[];let i=[];for(let r of t){let s=await this.fetchZoteroCollectionTitle(r);s&&i.push(s)}return i}async fetchZoteroItemWeb(e){try{let n=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}`),t=await this.requestWebApi(n,`Zotero Web API fetch failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(n){return console.warn("Failed to fetch Zotero item from Web API",n),null}}async fetchZoteroItemCslWeb(e){try{let n=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}?format=csljson`),t=await this.requestWebApi(n,`Zotero Web API CSL fetch failed for ${n}`);return this.parseCslPayload(t)}catch(n){return console.warn("Failed to fetch Zotero CSL from Web API",n),null}}parseCslPayload(e){try{let n=JSON.parse(e.toString("utf8"));return Array.isArray(n)?typeof n[0]=="object"&&n[0]?n[0]:null:typeof n=="object"&&n?n:null}catch(n){return console.warn("Failed to parse CSL payload",n),null}}async searchZoteroItemsWeb(e){let n=["data,meta,children","data,meta"];for(let t of n){let i=new URLSearchParams;i.set("itemType","-attachment"),i.set("limit","25"),i.set("include",t),e.trim()&&i.set("q",e.trim());let r=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items?${i.toString()}`);try{let s=await this.requestWebApi(r,`Zotero Web API search failed for ${r}`),a=JSON.parse(s.toString("utf8"));return Array.isArray(a)?a.map(o=>{var c,l,d,h;return{key:(l=o.key)!=null?l:(c=o.data)==null?void 0:c.key,data:(d=o.data)!=null?d:{},meta:(h=o.meta)!=null?h:{}}}).filter(o=>typeof o.key=="string"&&o.key.trim().length>0):[]}catch(s){console.warn("Failed to search Zotero via web API",s)}}return[]}async updateZoteroItemLanguage(e,n,t){try{await this.updateZoteroItemLanguageLocal(e,n,t);return}catch(i){if(!this.canUseWebApi())throw i;let r=i instanceof Error?i.message:String(i);console.info("Local Zotero write failed; trying Web API",{itemKey:e,reason:r}),await this.updateZoteroItemLanguageWeb(e,n,t)}}async updateZoteroItemLanguageLocal(e,n,t){var b,v,C,S,A,N;let i=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}`),r={...n,language:t},s={"Content-Type":"application/json","Zotero-API-Version":"3"},a=typeof r.version=="number"?r.version:Number(r.version);Number.isNaN(a)||(s["If-Unmodified-Since-Version"]=String(a)),console.info("Zotero language PUT",{url:i,itemKey:e,language:t});try{let R=await this.requestLocalApiWithBody(i,"PUT",r,s,`Zotero update failed for ${i}`);console.info("Zotero language PUT response",{status:R.statusCode})}catch(R){if(!(R instanceof Error?R.message:String(R)).includes("status 501"))throw R;let E=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items`);console.info("Zotero language PUT unsupported; trying POST",{postUrl:E});let O=await this.requestLocalApiWithBody(E,"POST",[r],s,`Zotero update failed for ${E}`);console.info("Zotero language POST response",{status:O.statusCode})}let o=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((b=o==null?void 0:o.data)==null?void 0:b.language)=="string"?o.data.language:"")===this.normalizeZoteroLanguage(t))return;let l={...(v=o==null?void 0:o.data)!=null?v:n,language:t},d={key:e,version:(A=(S=(C=o==null?void 0:o.data)==null?void 0:C.version)!=null?S:o==null?void 0:o.version)!=null?A:a,data:l},h={...s},_=typeof d.version=="number"?d.version:Number(d.version);Number.isNaN(_)?delete h["If-Unmodified-Since-Version"]:h["If-Unmodified-Since-Version"]=String(_);let m=await this.requestLocalApiWithBody(i,"PUT",d,h,`Zotero update failed for ${i}`);console.info("Zotero language PUT retry response",{status:m.statusCode});let y=await this.fetchZoteroItem(e);if(this.normalizeZoteroLanguage(typeof((N=y==null?void 0:y.data)==null?void 0:N.language)=="string"?y.data.language:"")!==this.normalizeZoteroLanguage(t))throw new Error("Language update did not persist in Zotero.")}async updateZoteroItemLanguageWeb(e,n,t){var m,y,x,b,v;let i=this.getWebApiLibraryPath();if(!i)throw new Error("Web API library path is not configured.");let r=this.buildWebApiUrl(`/${i}/items/${e}`),s=await this.fetchZoteroItemWeb(e),a={...(m=s==null?void 0:s.data)!=null?m:n,language:t},o={"Content-Type":"application/json","Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},c=(b=(x=(y=s==null?void 0:s.data)==null?void 0:y.version)!=null?x:s==null?void 0:s.version)!=null?b:n==null?void 0:n.version,l=typeof c=="number"?c:Number(c);Number.isNaN(l)||(o["If-Unmodified-Since-Version"]=String(l)),console.info("Zotero Web API language PUT",{url:r,itemKey:e,language:t});let d=await this.requestWebApiWithBody(r,"PUT",a,o,`Zotero Web API update failed for ${r}`);console.info("Zotero Web API language PUT response",{status:d.statusCode});let h=await this.fetchZoteroItemWeb(e);if(this.normalizeZoteroLanguage(typeof((v=h==null?void 0:h.data)==null?void 0:v.language)=="string"?h.data.language:"")!==this.normalizeZoteroLanguage(t))throw new Error("Language update did not persist in Zotero Web API.")}getDocId(e){let n=[e.key,e.itemKey,e.id,e.citationKey];for(let t of n)if(typeof t=="string"&&t.trim())return t.trim();return null}sanitizeFileName(e){let n=e.replace(/[\\/:*?"<>|]/g,"").replace(/\s+/g," ").trim();return n?n.replace(/[.]+$/g,"").trim().slice(0,120):""}registerNoteRenameHandler(){this.registerEvent(this.app.vault.on("rename",async e=>{var n;if(!(!(e instanceof p.TFile)||e.extension!=="md"))try{let t=await this.app.vault.read(e),i=(n=this.extractDocIdFromFrontmatter(t))!=null?n:this.extractDocIdFromSyncMarker(t);if(!i)return;await this.updateDocIndex({doc_id:i,note_path:e.path,note_title:P.default.basename(e.path,".md")})}catch(t){console.warn("Failed to update doc index for renamed note",t)}}))}registerNoteSyncHandler(){this.registerEvent(this.app.vault.on("modify",e=>{!(e instanceof p.TFile)||e.extension!=="md"||this.noteSyncSuppressed.has(e.path)||this.scheduleNoteSync(e)}))}registerNoteDeleteMenu(){this.registerEvent(this.app.workspace.on("file-menu",(e,n)=>{if(!(n instanceof p.TFile)||n.extension!=="md")return;let t=(0,p.normalizePath)(this.settings.outputNoteDir),i=(0,p.normalizePath)(n.path);!(t&&(i===t||i.startsWith(`${t}/`)))&&!this.isZoteroNoteFile(n)||e.addItem(s=>{s.setTitle("Delete Zotero note and cached data").onClick(()=>this.deleteZoteroNoteAndCacheForFile(n))})}))}findChunkStartLine(e,n){let t=n!=null?n:e.getCursor().line;for(;t>=0;t-=1){let i=e.getLine(t);if(pe.test(i))return{line:t,text:i};if(re.test(i)||de.test(i))break}return null}findChunkEndLine(e,n){for(let t=n;t<e.lineCount();t+=1){let i=e.getLine(t);if(Pe.test(i))return t;if(de.test(i))break}return null}findChunkAtCursor(e,n){let t=n!=null?n:e.getCursor().line,i=this.findChunkStartLine(e,t);if(!i)return null;let r=this.findChunkEndLine(e,i.line+1);return r===null||t<i.line||t>r?null:{startLine:i.line,endLine:r,text:i.text}}toggleChunkExclude(e,n){var d;let t=this.findChunkAtCursor(e,n);if(!t){new p.Notice("No synced chunk found at cursor.");return}let i=t.text.match(pe);if(!i){new p.Notice("Invalid chunk marker.");return}let r=((d=i[1])!=null?d:"").trim(),s=t.endLine,a=!1;if(s!==null){for(let h=t.startLine+1;h<s;h+=1)if(me.test(e.getLine(h))){a=!0;break}}let c=/\bexclude\b/i.test(r)||/\bdelete\b/i.test(r)||a;c?r=r.replace(/\b(delete|exclude)\b/gi,"").replace(/\s{2,}/g," ").trim():r=r?`${r} exclude`:"exclude";let l=`<!-- zrr:chunk${r?" "+r:""} -->`;if(l!==t.text&&e.replaceRange(l,{line:t.startLine,ch:0},{line:t.startLine,ch:t.text.length}),c&&s!==null){let h=[];for(let _=t.startLine+1;_<s;_+=1)me.test(e.getLine(_))&&h.push(_);for(let _=h.length-1;_>=0;_-=1){let m=h[_],y=e.lineCount();m<y-1?e.replaceRange("",{line:m,ch:0},{line:m+1,ch:0}):e.replaceRange("",{line:m,ch:0},{line:m,ch:e.getLine(m).length})}}new p.Notice(c?"Chunk included.":"Chunk excluded from index.")}toggleChunkExcludeFromToolbar(e){let n=this.app.workspace.getActiveViewOfType(p.MarkdownView);if(!n){new p.Notice("No active editor found.");return}let t=Math.max(0,e-1);this.toggleChunkExclude(n.editor,t)}async openChunkTagEditor(e,n){var d,h;let t=(0,p.normalizePath)(`${Z}/${e}.json`),i=this.app.vault.adapter;if(!await i.exists(t)){new p.Notice("Chunk cache not found for this document.");return}let r=await this.readChunkPayload(t);if(!r){new p.Notice("Failed to read chunk cache.");return}let s=Array.isArray(r.chunks)?r.chunks:[],a=this.resolveChunkFromPayload(s,n,e);if(!a){new p.Notice(`Chunk ${n} not found in cache.`);return}let o=(d=a.chunk_tags)!=null?d:[],c=Array.isArray(o)?o.map(_=>String(_).trim()).filter(_=>_):String(o).split(/[|,;\n]+/).map(_=>_.trim()).filter(_=>_),l=typeof a.text=="string"?a.text:String((h=a.text)!=null?h:"");new Ce(this.app,n,c,async _=>{_.length>0?a.chunk_tags=_:delete a.chunk_tags,await i.write(t,JSON.stringify(r,null,2)),await this.reindexChunkUpdates(e,t,[String(a.chunk_id||n)],[]),new p.Notice("Chunk tags updated.")},async()=>{if(!l.trim())return new p.Notice("Chunk has no text to tag."),null;let _=await this.renderMarkdownToIndexText(l);return this.requestChunkTags(_)}).open()}async openChunkIndexedTextPreview(e,n){var d;let t=(0,p.normalizePath)(`${Z}/${e}.json`);if(!await this.app.vault.adapter.exists(t)){new p.Notice("Chunk cache not found for this document.");return}let r=await this.readChunkPayload(t);if(!r){new p.Notice("Failed to read chunk cache.");return}let s=Array.isArray(r.chunks)?r.chunks:[],a=this.resolveChunkFromPayload(s,n,e);if(!a){new p.Notice(`Chunk ${n} not found in cache.`);return}let o=typeof a.text=="string"?a.text:String((d=a.text)!=null?d:""),c=await this.renderMarkdownToIndexText(o),l=this.settings.embedIncludeMetadata?"Note: when \u201CInclude metadata in embeddings\u201D is enabled, the indexer prepends title/authors/tags/section info before embedding. The preview below shows only the chunk text.":"";new Se(this.app,`Indexed text for ${n}`,c,l).open()}async openChunkInZotero(e,n){var h,_,m,y,x,b;let t=(0,p.normalizePath)(`${Z}/${e}.json`),i=this.app.vault.adapter,r=null;await i.exists(t)&&(r=await this.readChunkPayload(t));let s=Array.isArray(r==null?void 0:r.chunks)?r==null?void 0:r.chunks:[],a=this.resolveChunkFromPayload(s,n,e),o=(h=a==null?void 0:a.page_start)!=null?h:a==null?void 0:a.pageStart,c=(x=(y=(_=r==null?void 0:r.metadata)==null?void 0:_.attachment_key)!=null?y:(m=r==null?void 0:r.metadata)==null?void 0:m.attachmentKey)!=null?x:"";if(!c){let v=await this.getDocIndexEntry(e);c=(b=v==null?void 0:v.attachment_key)!=null?b:""}if(!c){new p.Notice("Attachment key not found for Zotero deeplink.");return}let l=typeof o=="number"?String(o):"",d=this.buildZoteroDeepLink(e,c,l);this.openExternalUrl(d)}async cleanChunkFromToolbar(e){let n=this.app.workspace.getActiveViewOfType(p.MarkdownView);if(!n){new p.Notice("No active editor found.");return}let t=n.editor,i=Math.max(0,e-1),r=this.findChunkAtCursor(t,i);if(!r){new p.Notice("No synced chunk found at cursor.");return}let s=[];for(let l=r.startLine+1;l<r.endLine;l+=1)s.push(t.getLine(l));let a=s.join(`
`).trim();if(!a){new p.Notice("Chunk has no text to clean.");return}this.showStatusProgress("Cleaning chunk...",null);let o=null;try{o=await this.requestOcrCleanup(a)}finally{o||this.clearStatusProgress()}if(!o)return;if(o.trim()===a.trim()){new p.Notice("Cleanup produced no changes."),this.clearStatusProgress();return}let c=`${o.trim()}
`;t.replaceRange(c,{line:r.startLine+1,ch:0},{line:r.endLine,ch:0}),this.showStatusProgress("Chunk cleaned.",100),window.setTimeout(()=>this.clearStatusProgress(),1200),new p.Notice("Chunk cleaned.")}async requestOcrCleanup(e){var c,l,d,h,_,m,y,x,b;let n=(this.settings.llmCleanupBaseUrl||"").trim().replace(/\/$/,""),t=(this.settings.llmCleanupModel||"").trim();if(!n||!t)return new p.Notice("OCR cleanup model is not configured."),this.openPluginSettings(),null;let i=Number(this.settings.llmCleanupMaxChars||0);if(i>0&&e.length>i)return new p.Notice("Chunk exceeds OCR cleanup max length. Adjust settings to clean it."),this.openPluginSettings(),null;let r=`${n}/chat/completions`,s={"Content-Type":"application/json"},a=(this.settings.llmCleanupApiKey||"").trim();a&&(s.Authorization=`Bearer ${a}`);let o={model:t,temperature:Number((c=this.settings.llmCleanupTemperature)!=null?c:0),messages:[{role:"system",content:"You are an OCR cleanup assistant. Fix OCR errors without changing meaning. Do not add content. Return corrected text only."},{role:"user",content:e}]};try{let v=await this.requestLocalApiRaw(r,{method:"POST",headers:s,body:JSON.stringify(o)});if(v.statusCode>=400){let N=v.body.toString("utf8");throw new Error(`Cleanup request failed (${v.statusCode}): ${N||"no response body"}`)}let C=JSON.parse(v.body.toString("utf8")),S=(b=(x=(y=(h=(d=(l=C==null?void 0:C.choices)==null?void 0:l[0])==null?void 0:d.message)==null?void 0:h.content)!=null?y:(m=(_=C==null?void 0:C.choices)==null?void 0:_[0])==null?void 0:m.text)!=null?x:C==null?void 0:C.output_text)!=null?b:"",A=String(S||"").trim();return A||(new p.Notice("Cleanup returned empty text."),null)}catch(v){return console.error("OCR cleanup failed",v),new p.Notice("OCR cleanup failed. Check the cleanup model settings."),null}}parseChunkTags(e,n){if(!e)return[];let t=e.trim(),i=[];if(t.startsWith("[")&&t.endsWith("]"))try{let a=JSON.parse(t);Array.isArray(a)&&(i=a.map(o=>String(o)))}catch(a){i=[]}i.length===0&&(i=t.split(/[,;\n]+/));let r=new Set,s=[];for(let a of i){let o=a.trim();if(o=o.replace(/^[-•\d.\)\s]+/,""),o=o.replace(/\s+/g," ").trim(),!o||o.length<2)continue;let c=o.toLowerCase();if(!r.has(c)&&(r.add(c),s.push(o),s.length>=n))break}return s}async requestChunkTags(e){var h,_,m,y,x,b,v,C,S;let n=(this.settings.llmCleanupBaseUrl||"").trim().replace(/\/$/,""),t=(this.settings.llmCleanupModel||"").trim();if(!n||!t)return new p.Notice("OCR cleanup model is not configured."),this.openPluginSettings(),null;let i=e.trim().slice(0,2e3);if(!i)return[];let r=`${n}/chat/completions`,s={"Content-Type":"application/json"},a=(this.settings.llmCleanupApiKey||"").trim();a&&(s.Authorization=`Bearer ${a}`);let o=5,c="Return 3 to 5 high-signal, concrete noun-phrase tags. Avoid generic terms (study, paper, method), verbs, and filler. Prefer specific entities, methods, datasets, and named concepts. Output comma-separated tags only. No extra text.",l=Number((h=this.settings.llmCleanupTemperature)!=null?h:0),d={model:t,messages:[{role:"system",content:c},{role:"user",content:i}]};Number.isFinite(l)&&(d.temperature=l),this.showStatusProgress("Generating tags...",null);try{let A=async O=>{let T=await this.requestLocalApiRaw(r,{method:"POST",headers:s,body:JSON.stringify(O)});if(T.statusCode>=400){let F=T.body.toString("utf8");throw new Error(`Tag request failed (${T.statusCode}): ${F||"no response body"}`)}return T.body},N;try{N=await A(d)}catch(O){let T=O instanceof Error?O.message:String(O);if("temperature"in d&&/temperature/i.test(T)&&/unsupported|default/i.test(T)){let F={...d};delete F.temperature,N=await A(F)}else throw O}let R=JSON.parse(N.toString("utf8")),z=(S=(C=(v=(y=(m=(_=R==null?void 0:R.choices)==null?void 0:_[0])==null?void 0:m.message)==null?void 0:y.content)!=null?v:(b=(x=R==null?void 0:R.choices)==null?void 0:x[0])==null?void 0:b.text)!=null?C:R==null?void 0:R.output_text)!=null?S:"",E=this.parseChunkTags(String(z||""),o);return E.length||new p.Notice("Tag generation returned no tags."),E}catch(A){return console.error("Tag generation failed",A),new p.Notice("Tag generation failed. Check the cleanup model settings."),null}finally{this.clearStatusProgress()}}async renderMarkdownToIndexText(e){if(!e)return"";let n=document.createElement("div");try{await p.MarkdownRenderer.renderMarkdown(e,n,"",this)}catch(o){return console.warn("Failed to render markdown for index preview",o),this.normalizeIndexPreviewText(e)}let r=(n.innerHTML||"").replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g," "),s=document.createElement("textarea");s.innerHTML=r;let a=s.value||r;return this.normalizeIndexPreviewText(a)}normalizeIndexPreviewText(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).replace(/[ \t]+/g," ").replace(/\n{3,}/g,`

`).replace(/[ \t]*\n[ \t]*/g,`
`).trim()}scheduleNoteSync(e){let n=this.noteSyncTimers.get(e.path);n!==void 0&&window.clearTimeout(n);let t=window.setTimeout(()=>{this.noteSyncTimers.delete(e.path),this.syncNoteToRedis(e)},1200);this.noteSyncTimers.set(e.path,t)}escapeRegExp(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}formatCitationPageLabel(e){let n=e.page_start?String(e.page_start):"",t=e.page_end?String(e.page_end):"";if(n&&(!t||n===t))return n;if(n&&t)return`${n} - ${t}`;let i=(e.pages||"").trim();if(!i)return"?";let r=i.match(/^(\d+)\s*-\s*(\d+)$/);return r?r[1]===r[2]?r[1]:`${r[1]} - ${r[2]}`:i.replace("-"," - ")}normalizeChunkIdForNote(e,n){if(!e)return null;let t=String(e);if(n&&t.startsWith(`${n}:`))return t.slice(n.length+1);if(t.includes(":")){let i=t.split(":");if(i.length>1&&n&&i[0]===n)return i.slice(1).join(":")}return t}async syncNoteToRedis(e){var n,t,i;if(!this.noteSyncInFlight.has(e.path)&&!this.noteSyncSuppressed.has(e.path)){this.noteSyncInFlight.add(e.path);try{let r=await this.app.vault.read(e),s=this.extractSyncSection(r);if(!s)return;let a=await this.resolveDocIdForNote(e,r);if(!a)return;let o=this.parseSyncedChunkBlocks(s);if(!o.length)return;let c=(0,p.normalizePath)(`${Z}/${a}.json`),l=this.app.vault.adapter;if(!await l.exists(c))return;let d=await this.readChunkPayload(c);if(!d)return;let h=Array.isArray(d.chunks)?d.chunks:[],_=new Map;for(let C of h){let S=typeof(C==null?void 0:C.chunk_id)=="string"?C.chunk_id:String((n=C==null?void 0:C.chunk_id)!=null?n:"");S&&_.set(S,C)}let m=new Set,y=new Set,x=new Set,b=new Set,v=!1;for(let C of o){let S=C.chunkId;if(!S)continue;m.add(S);let A=_.get(S);if(!A){console.warn(`Sync note: chunk id not found in cache (${S})`);continue}if(C.excludeFlag){A.excluded!==!0&&(A.excluded=!0,v=!0);let z=this.normalizeChunkText(C.text);z&&z!==String((t=A.text)!=null?t:"")&&(A.text=z,A.char_count=z.length,v=!0),x.add(S);continue}if(A.excluded&&(A.excluded=!1,v=!0,y.add(S)),!C.text.trim()){x.add(S),b.add(S);continue}let N=this.normalizeChunkText(C.text);if(!N){x.add(S),b.add(S);continue}let R=typeof A.text=="string"?A.text:String((i=A.text)!=null?i:"");N!==R&&(A.text=N,A.char_count=N.length,y.add(S),v=!0)}for(let C of _.keys())m.has(C)||(x.add(C),b.add(C));if(!y.size&&!x.size&&!b.size&&!v)return;b.size&&(d.chunks=h.filter(C=>{var A;let S=typeof(C==null?void 0:C.chunk_id)=="string"?C.chunk_id:String((A=C==null?void 0:C.chunk_id)!=null?A:"");return S&&!b.has(S)}),v=!0),(v||b.size)&&await l.write(c,JSON.stringify(d,null,2)),await this.reindexChunkUpdates(a,c,Array.from(y),Array.from(x))}catch(r){console.warn("Failed to sync note edits to Redis",r)}finally{this.noteSyncInFlight.delete(e.path)}}}extractSyncSection(e){let n=re.exec(e);if(!n)return null;let t=e.slice(n.index+n[0].length),i=de.exec(t);return i?t.slice(0,i.index):null}extractDocIdFromSyncMarker(e){var r;let n=re.exec(e);if(!n)return null;let i=((r=n[0])!=null?r:"").match(/doc_id=([\"']?)([^\"'\s]+)\1/i);return i?i[2].trim():null}parseSyncedChunkBlocks(e){var o;let n=e.split(/\r?\n/),t=[],i="",r=!1,s=[],a=()=>{i&&(t.push({chunkId:i,text:s.join(`
`).trim(),excludeFlag:r}),i="",r=!1,s=[])};for(let c of n){let l=c.match(pe);if(l){a();let d=(o=l[1])!=null?o:"",h=d.match(/id=([\"']?)([^\"'\s]+)\1/i),_=h?h[2].trim():"";if(!_)continue;i=_,r=/\bexclude\b/i.test(d)||/\bdelete\b/i.test(d),s=[];continue}if(Pe.test(c)){a();continue}if(i){if(me.test(c)){r=!0;continue}s.push(c)}}return a(),t}normalizeChunkText(e){return e.split(/\r?\n/).map(n=>n.replace(/\s+/g," ").trim()).filter((n,t,i)=>!(n===""&&i[t-1]==="")).join(`
`).trim()}registerSyncCommentBadges(){this.registerMarkdownPostProcessor(e=>{var c,l;let n=document.createNodeIterator(e,NodeFilter.SHOW_COMMENT),t=[],i=n.nextNode();for(;i;)i instanceof Comment&&t.push(i),i=n.nextNode();let r=t.map(d=>({comment:d,info:He(d.data||"")})).filter(d=>d.info!==null);if(!r.length)return;let s=r.map(d=>d.info).filter(d=>!!(d!=null&&d.pageNumber)).map(d=>d.pageNumber||0),a=s.length?Math.max(...s):0,o=null;for(let d of r){let h=d.info;if(!h)continue;h.type==="chunk-start"?o=(c=h.chunkKind)!=null?c:h.pageNumber?"page":"section":h.type==="chunk-end"&&(h.chunkKind=o!=null?o:"section",o=null);let _=We(h,a);_&&((l=d.comment.parentNode)==null||l.insertBefore(_,d.comment),d.comment.remove())}})}buildSyncedDoclingContent(e,n,t){let i=Array.isArray(n==null?void 0:n.chunks)?n==null?void 0:n.chunks:[];if(!i.length)return`<!-- zrr:sync-start doc_id=${e} -->
${t}
<!-- zrr:sync-end -->`;let r=[`<!-- zrr:sync-start doc_id=${e} -->`];for(let s of i){let a=typeof(s==null?void 0:s.chunk_id)=="string"?s.chunk_id.trim():"";if(!a)continue;let o=!!(s!=null&&s.excluded||s!=null&&s.exclude),c=typeof(s==null?void 0:s.text)=="string"?s.text.trim():"",l=o?` id=${a} exclude`:` id=${a}`;r.push(`<!-- zrr:chunk${l} -->`),c&&r.push(c),r.push("<!-- zrr:chunk end -->"),r.push("")}return r[r.length-1]===""&&r.pop(),r.push("<!-- zrr:sync-end -->"),r.join(`
`)}async readChunkPayload(e){try{let n=await this.app.vault.adapter.read(e);return JSON.parse(n)}catch(n){return console.warn("Failed to read cached chunks JSON",n),null}}resolveChunkFromPayload(e,n,t){var s;let i=this.normalizeChunkIdForNote(n,t)||n,r=new Set([n,i,`${t}:${n}`]);for(let a of e){let o=typeof(a==null?void 0:a.chunk_id)=="string"?a.chunk_id:String((s=a==null?void 0:a.chunk_id)!=null?s:"");if(o&&r.has(o))return a}return null}async writeNoteWithSyncSuppressed(e,n){this.noteSyncSuppressed.add(e);try{await this.app.vault.adapter.write(e,n)}finally{window.setTimeout(()=>{this.noteSyncSuppressed.delete(e)},1500)}}async resolveNotePathForDocId(e){if(!e)return null;let n=this.app.vault.adapter,t=await this.getDocIndexEntry(e);if(t!=null&&t.note_path&&await n.exists(t.note_path))return t.note_path;let r=(await this.scanNotesForDocIds(this.settings.outputNoteDir))[e];return r!=null&&r.note_path?(await this.updateDocIndex({doc_id:e,note_path:r.note_path,note_title:r.note_title}),r.note_path):null}isZoteroNoteFile(e){let n=this.app.metadataCache.getFileCache(e),t=n==null?void 0:n.frontmatter;return!!(t!=null&&t.doc_id||t!=null&&t.zotero_key)}async deleteZoteroNoteAndCacheForFile(e){var l;let n=e.path,t=await this.app.vault.read(e),i=(l=this.extractDocIdFromFrontmatter(t))!=null?l:this.extractDocIdFromSyncMarker(t);if(!i){new p.Notice("No doc_id found in this note.");return}if(!await new Promise(d=>{new De(this.app,n,i,d).open()}))return;let s=this.app.vault.adapter,a=(0,p.normalizePath)(`${Z}/${i}.json`),o=(0,p.normalizePath)(`${K}/${i}.json`),c=[];if(await s.exists(a)){let d=await this.readChunkPayload(a);c=(Array.isArray(d==null?void 0:d.chunks)?d==null?void 0:d.chunks:[]).map(_=>{var m;return String((m=_==null?void 0:_.chunk_id)!=null?m:"")}).map(_=>_.startsWith(`${i}:`)?_.slice(i.length+1):_).filter(_=>_)}c.length>0&&await this.reindexChunkUpdates(i,a,[],c);try{await s.exists(a)&&await s.remove(a),await s.exists(o)&&await s.remove(o),await this.removeDocIndexEntry(i),await this.app.vault.delete(e,!0),new p.Notice(`Deleted note and cache for ${i}.`)}catch(d){console.error("Failed to delete note and cached data",d),new p.Notice("Failed to delete note or cached data. See console for details.")}}async deleteZoteroNoteAndCache(){let e=this.app.workspace.getActiveViewOfType(p.MarkdownView);if(!e||!e.file){new p.Notice("No active Zotero note found.");return}await this.deleteZoteroNoteAndCacheForFile(e.file)}formatRedisSearchResults(e){let n=typeof(e==null?void 0:e.total)=="number"?e.total:0,t=typeof(e==null?void 0:e.query)=="string"?e.query:"",i=typeof(e==null?void 0:e.raw_query)=="string"?e.raw_query:"",r=e!=null&&e.field_types&&typeof e.field_types=="object"?e.field_types:null,s=!!(e!=null&&e.fallback_used),a=typeof(e==null?void 0:e.fallback_reason)=="string"?e.fallback_reason:"",o=Array.isArray(e==null?void 0:e.fallback_queries)?e.fallback_queries:[],c=Array.isArray(e==null?void 0:e.fallback_failed_fields)?e.fallback_failed_fields:[],l=Array.isArray(e==null?void 0:e.results)?e.results:[],d=[];if(d.push(`Query: ${i||t}`),t&&i&&t!==i&&d.push(`Expanded: ${t}`),d.push(`Total matches: ${n}`),r&&Object.keys(r).length>0){let h=Object.keys(r).sort().map(_=>`${_}:${r[_]}`);d.push(`Field types: {${h.join(", ")}}`)}if(s&&d.push(`Fallback: ${a||"true"}`),o.length){d.push("Fallback queries:");for(let h of o)d.push(`  - ${h}`)}if(c.length&&d.push(`Fallback failed fields: ${c.join(", ")}`),d.push(""),!l.length)return d.push("(no results)"),d.join(`
`);for(let h of l){let _=String(h.doc_id||"").trim(),m=String(h.chunk_id||"").trim(),y=String(h.page_start||"").trim(),x=String(h.page_end||"").trim(),b=String(h.title||"").trim(),v=String(h.section||"").trim(),C=String(h.score||"").trim(),S=String(h.authors||"").trim(),A=String(h.item_type||"").trim(),N=String(h.year||"").trim(),R=String(h.tags||"").trim(),z=String(h.chunk_tags||"").trim(),E=String(h.attachment_key||"").trim(),O=String(h.source_pdf||"").trim(),T=String(h.text||"").replace(/\s+/g," ").trim(),F=T.length>220?`${T.slice(0,220)}\u2026`:T,V=[_];m&&V.push(m),(y||x)&&V.push(`p.${y||"?"}-${x||"?"}`),d.push(V.filter(Boolean).join(" \u2022 ")),C&&d.push(`  score: ${C}`),b&&d.push(`  title: ${b}`),S&&d.push(`  authors: ${S}`),N&&d.push(`  year: ${N}`),A&&d.push(`  item_type: ${A}`),R&&d.push(`  tags: ${R}`),z&&d.push(`  chunk_tags: ${z}`),E&&d.push(`  attachment_key: ${E}`),v&&d.push(`  section: ${v}`),O&&d.push(`  source_pdf: ${O}`),F&&d.push(`  ${F}`),d.push("")}return d.join(`
`)}async searchRedisIndex(){new Ae(this.app,this,this.lastRedisSearchTerm).open()}async runRedisSearch(e){let n=e.trim();if(!n)return"(no query)";if(this.lastRedisSearchTerm=n,!await this.ensureRedisAvailable("index search"))return"Redis is not reachable. Please start Redis Stack and try again.";let t=this.getPluginDir(),i=P.default.join(t,"tools","search_redis.py"),r=["--query",n,"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--limit","10"];try{await this.ensureBundledTools();let s=await this.runPythonWithOutput(i,r),a=JSON.parse(s||"{}");return this.formatRedisSearchResults(a)||"(no results)"}catch(s){return console.error("Redis search failed",s),"Redis search failed. See console for details."}}async showRedisDiagnostics(){if(!await this.ensureRedisAvailable("diagnostics"))return;let e=this.getPluginDir(),n=P.default.join(e,"tools","redis_diagnostics.py"),t=["--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName()];try{await this.ensureBundledTools();let i=await this.runPythonWithOutput(n,t),r=JSON.parse(i||"{}"),s=`\`\`\`json
${JSON.stringify(r,null,2)}
\`\`\``;new ue(this.app,"Redis diagnostics",s||"(empty)").open()}catch(i){console.error("Redis diagnostics failed",i),new p.Notice("Redis diagnostics failed. See console for details.")}}async resolveUniqueBaseName(e,n){let t=this.app.vault.adapter,i=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${e}.md`),r=(0,p.normalizePath)(`${this.settings.outputPdfDir}/${e}.pdf`),s=await t.exists(i),a=this.settings.copyPdfToVault?await t.exists(r):!1;return s||a?`${e}-${n}`:e}async searchZoteroItems(e){let n=["data,meta,children","data,meta"];for(let t of n){let i=new URLSearchParams;i.set("itemType","-attachment"),i.set("limit","25"),i.set("include",t),e.trim()&&i.set("q",e.trim());let r=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items?${i.toString()}`);try{let s=await this.requestLocalApi(r,`Zotero search failed for ${r}`),a=JSON.parse(s.toString("utf8"));return Array.isArray(a)?a.map(o=>{var c,l,d,h;return{key:(l=o.key)!=null?l:(c=o.data)==null?void 0:c.key,data:(d=o.data)!=null?d:{},meta:(h=o.meta)!=null?h:{}}}).filter(o=>typeof o.key=="string"&&o.key.trim().length>0):[]}catch(s){console.warn("Failed to search Zotero via local API",s)}}if(!this.canUseWebApi())throw new Error("Zotero search failed for all include modes.");return this.searchZoteroItemsWeb(e)}async hasProcessableAttachment(e){var r;let n=(r=e.data)!=null?r:e,t=typeof e.key=="string"?e.key:this.coerceString(n.key);return t?!!await this.resolvePdfAttachment(n,t):!1}async resolvePdfAttachment(e,n){let t=this.pickPdfAttachment(e);if(t)return t;try{let i=await this.fetchZoteroChildren(n);for(let r of i){let s=this.toPdfAttachment(r);if(s)return s}}catch(i){console.error("Failed to fetch Zotero children",i)}return null}pickPdfAttachment(e){let n=this.collectAttachmentCandidates(e);for(let t of n){let i=this.toPdfAttachment(t);if(i)return i}return null}collectAttachmentCandidates(e){let n=[e.attachments,e.children,e.items,e.attachment,e.allAttachments],t=[];for(let i of n)i&&(Array.isArray(i)?t.push(...i):typeof i=="object"&&t.push(i));return t}toPdfAttachment(e){var r,s,a,o,c,l;if(((a=(r=e==null?void 0:e.contentType)!=null?r:e==null?void 0:e.mimeType)!=null?a:(s=e==null?void 0:e.data)==null?void 0:s.contentType)!=="application/pdf")return null;let t=(l=(o=e==null?void 0:e.key)!=null?o:e==null?void 0:e.attachmentKey)!=null?l:(c=e==null?void 0:e.data)==null?void 0:c.key;if(!t)return null;let i=this.extractAttachmentPath(e);return i?{key:t,filePath:i}:{key:t}}extractAttachmentPath(e){var t,i,r,s,a,o,c,l;let n=(l=(s=(i=(t=e==null?void 0:e.links)==null?void 0:t.enclosure)==null?void 0:i.href)!=null?s:(r=e==null?void 0:e.enclosure)==null?void 0:r.href)!=null?l:(c=(o=(a=e==null?void 0:e.data)==null?void 0:a.links)==null?void 0:o.enclosure)==null?void 0:c.href;if(typeof n=="string"&&n.startsWith("file://"))try{return(0,se.fileURLToPath)(n)}catch(d){return null}return null}async fetchZoteroChildren(e){let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/children`);try{let t=await this.requestLocalApi(n,`Zotero children request failed for ${n}`);return JSON.parse(t.toString("utf8"))}catch(t){if(console.warn("Failed to fetch Zotero children from local API",t),!this.canUseWebApi())throw t;let i=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/children`),r=await this.requestWebApi(i,`Zotero Web API children request failed for ${i}`);return JSON.parse(r.toString("utf8"))}}async downloadZoteroPdf(e){let n=this.buildZoteroUrl(`/${this.getZoteroLibraryPath()}/items/${e}/file`);try{let t=await this.requestLocalApiRaw(n),i=await this.followFileRedirect(t);if(i)return i;if(t.statusCode>=300)throw new Error(`Request failed, status ${t.statusCode}`);return t.body}catch(t){if(console.warn("Failed to download PDF from local API",t),!this.canUseWebApi())throw t;let i=this.buildWebApiUrl(`/${this.getWebApiLibraryPath()}/items/${e}/file`),r=await this.requestWebApiRaw(i),s=await this.followFileRedirect(r);if(s)return s;if(r.statusCode>=300)throw new Error(`Web API request failed, status ${r.statusCode}`);return r.body}}buildZoteroUrl(e){return`${this.settings.zoteroBaseUrl.replace(/\/$/,"")}${e}`}canUseWebApi(){return!!((this.settings.webApiBaseUrl||"").trim()&&this.settings.webApiKey&&this.settings.webApiLibraryId)}getWebApiLibraryPath(){let e=(this.settings.webApiLibraryId||"").trim();return e?`${this.settings.webApiLibraryType==="group"?"groups":"users"}/${e}`:""}buildWebApiUrl(e){return`${this.settings.webApiBaseUrl.replace(/\/$/,"")}${e}`}requestLocalApiRaw(e,n={}){return new Promise((t,i)=>{var d,h;let r=new URL(e),s=r.protocol==="https:"?Ze.default:Ue.default,a=(d=n.method)!=null?d:"GET",o={Accept:"*/*",...(h=n.headers)!=null?h:{}},c=n.body;if(c!==void 0&&o["Content-Length"]===void 0){let _=Buffer.isBuffer(c)?c.length:Buffer.byteLength(c);o["Content-Length"]=String(_)}let l=s.request({method:a,hostname:r.hostname,port:r.port||void 0,path:`${r.pathname}${r.search}`,headers:o},_=>{let m=[];_.on("data",y=>m.push(Buffer.from(y))),_.on("end",()=>{var x;let y=Buffer.concat(m);t({statusCode:(x=_.statusCode)!=null?x:0,headers:_.headers,body:y})})});l.on("error",i),c!==void 0&&l.write(c),l.end()})}async requestLocalApi(e,n){let t=await this.requestLocalApiRaw(e);if(t.statusCode>=400){let i=t.body.toString("utf8");throw new Error(`${n!=null?n:"Request failed"}, status ${t.statusCode}: ${i||"no response body"}`)}if(t.statusCode>=300)throw new Error(`${n!=null?n:"Request failed"}, status ${t.statusCode}`);return t.body}async requestLocalApiWithBody(e,n,t,i,r){let s=JSON.stringify(t),a=await this.requestLocalApiRaw(e,{method:n,headers:i,body:s});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async requestWebApi(e,n){let t={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey},i=await this.requestLocalApiRaw(e,{headers:t});if(i.statusCode>=400){let r=i.body.toString("utf8");throw new Error(`${n!=null?n:"Request failed"}, status ${i.statusCode}: ${r||"no response body"}`)}if(i.statusCode>=300)throw new Error(`${n!=null?n:"Request failed"}, status ${i.statusCode}`);return i.body}requestWebApiRaw(e,n={}){var i;let t={"Zotero-API-Version":"3","Zotero-API-Key":this.settings.webApiKey,...(i=n.headers)!=null?i:{}};return this.requestLocalApiRaw(e,{...n,headers:t})}async requestWebApiWithBody(e,n,t,i,r){let s=JSON.stringify(t),a=await this.requestLocalApiRaw(e,{method:n,headers:i,body:s});if(a.statusCode>=400){let o=a.body.toString("utf8");throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}: ${o||"no response body"}`)}if(a.statusCode>=300)throw new Error(`${r!=null?r:"Request failed"}, status ${a.statusCode}`);return{statusCode:a.statusCode,body:a.body}}async followFileRedirect(e){if(e.statusCode<300||e.statusCode>=400)return null;let n=e.headers.location,t=Array.isArray(n)?n[0]:n;if(!t||typeof t!="string")return null;if(t.startsWith("file://")){let i=(0,se.fileURLToPath)(t);return U.promises.readFile(i)}return t.startsWith("http://")||t.startsWith("https://")?this.requestLocalApi(t):null}bufferToArrayBuffer(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}async annotateChunkJsonWithAttachmentKey(e,n){if(n)try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t);if(!i||typeof i!="object")return;let r=i.metadata&&typeof i.metadata=="object"?i.metadata:{};r.attachment_key=n,i.metadata=r,await this.app.vault.adapter.write(e,JSON.stringify(i,null,2))}catch(t){console.warn("Failed to annotate chunks JSON with attachment key",t)}}async updateChunkJsonSourcePdf(e,n){if(n)try{let t=await this.app.vault.adapter.read(e),i=JSON.parse(t);if(!i||typeof i!="object")return;i.source_pdf=n,await this.app.vault.adapter.write(e,JSON.stringify(i,null,2))}catch(t){console.warn("Failed to update chunks JSON source_pdf",t)}}buildPdfLinkFromSourcePath(e){if(!e)return"";let n=P.default.normalize(this.getVaultBasePath()),t=P.default.normalize(e),i=n.endsWith(P.default.sep)?n:`${n}${P.default.sep}`;return t.startsWith(i)?`[[${(0,p.normalizePath)(P.default.relative(n,t))}]]`:`[PDF](${(0,se.pathToFileURL)(e).toString()})`}toVaultRelativePath(e){if(!e)return"";let n=P.default.normalize(this.getVaultBasePath()),t=P.default.normalize(e),i=n.endsWith(P.default.sep)?n:`${n}${P.default.sep}`;return t.startsWith(i)?(0,p.normalizePath)(P.default.relative(n,t)):""}async isFileAccessible(e){if(!e)return!1;try{return await U.promises.access(e),!0}catch(n){return!1}}deriveVaultPdfRelativePath(e,n,t){let i=this.toVaultRelativePath(e);if(i&&i.startsWith((0,p.normalizePath)(this.settings.outputPdfDir)))return i;let r=this.sanitizeFileName(n)||t;return(0,p.normalizePath)(`${this.settings.outputPdfDir}/${r}.pdf`)}async recoverMissingPdfFromAttachment(e,n,t,i,r,s,a){let o=await this.resolvePdfAttachment(n,t);if(!o&&r&&(o={key:r}),!o)return null;let c=o.key||r,l=o.filePath;if(!this.settings.copyPdfToVault&&l&&await this.isFileAccessible(l))return{sourcePdf:l,attachmentKey:c};try{await this.ensureFolder(this.settings.outputPdfDir)}catch(m){return console.error("Failed to create PDF output folder",m),null}let d=this.deriveVaultPdfRelativePath(e,s,i),h;try{if(l&&await this.isFileAccessible(l))h=await U.promises.readFile(l);else if(c)h=await this.downloadZoteroPdf(c),!this.settings.copyPdfToVault&&a&&new p.Notice("Local PDF path unavailable; copied PDF into vault for processing.");else return null}catch(m){return console.error("Failed to read or download PDF attachment",m),null}try{await this.app.vault.adapter.writeBinary(d,this.bufferToArrayBuffer(h))}catch(m){return console.error("Failed to write recovered PDF into vault",m),null}return{sourcePdf:this.getAbsoluteVaultPath(d),attachmentKey:c}}buildPdfLinkForNote(e,n,t){return!e&&!n?"":!this.settings.copyPdfToVault&&n?`[PDF](${this.buildZoteroDeepLink(t!=null?t:"",n)})`:this.buildPdfLinkFromSourcePath(e)}buildVaultPdfCitationLink(e,n,t){if(!e)return"";let i=this.toVaultRelativePath(e);if(!i)return"";let r=n?`#page=${n}`:"";return`[[${i}${r}|${t||i}]]`}async maybeCreateOcrLayeredPdf(e,n,t){if(!this.settings.createOcrLayeredPdf||!this.settings.copyPdfToVault||!e||!((n==null?void 0:n.ocr_used)===!0))return null;if(!this.toVaultRelativePath(e))return console.warn("OCR layered PDF requires a vault-local PDF"),null;try{await this.ensureFolder(this.settings.outputPdfDir)}catch(c){return console.warn("Failed to create OCR PDF output folder",c),null}let r=`${e}.ocr.tmp`,s=(t||(n==null?void 0:n.languages)||"eng").toString(),a=this.getPluginDir(),o=P.default.join(a,"tools","ocr_layered_pdf.py");try{return this.showStatusProgress("Creating OCR PDF...",0),await this.runPythonStreaming(o,["--pdf",e,"--out-pdf",r,"--language",s,"--progress"],c=>{if((c==null?void 0:c.type)==="progress"&&c.total){let l=Math.round(c.current/c.total*100);this.showStatusProgress(`Creating OCR PDF ${c.current}/${c.total}`,l)}},()=>{}),await U.promises.rename(r,e),e}catch(c){return console.warn("OCR layered PDF creation failed",c),null}}getMainLeaf(){let e=new Set(this.app.workspace.getLeavesOfType(ie)),n=this.app.workspace.getLeavesOfType("markdown").find(i=>!e.has(i));if(n)return n;let t=this.app.workspace.getLeaf(!1);return t&&!e.has(t)?t:this.app.workspace.getLeaf("tab")}async openNoteInMain(e){let n=(0,p.normalizePath)(e),t=this.app.vault.getAbstractFileByPath(n),i=this.getMainLeaf();if(t instanceof p.TFile){await i.openFile(t,{active:!0});return}await this.app.workspace.openLinkText(n,"",!1)}findChunkLineInText(e,n){if(!e||!n)return null;let t=this.escapeRegExp(n),i=new RegExp(`<!--\\s*zrr:chunk\\b[^>]*\\bid=(["']?)${t}\\1[^>]*-->`,"i"),r=e.split(`
`);for(let s=0;s<r.length;s+=1)if(i.test(r[s]))return s;return null}async openNoteAtChunk(e,n){if(!e||!n)return!1;await this.openNoteInMain(e);let i=this.getMainLeaf().view;if(!(i instanceof p.MarkdownView))return!1;let r=i.editor,s=this.normalizeChunkIdForNote(n)||n,a=this.findChunkLineInText(r.getValue(),s);return a===null?(new p.Notice(`Chunk ${s} not found in note.`),!1):(r.setCursor({line:a,ch:0}),r.scrollIntoView({from:{line:a,ch:0},to:{line:a,ch:0}},!0),!0)}async openInternalLinkInMain(e){let n=this.getMainLeaf(),[t,i]=e.split("#"),r=(t||"").trim(),s=(i||"").trim(),a="zrr-chunk:",o=r?this.app.metadataCache.getFirstLinkpathDest(r,""):null;if(o instanceof p.TFile){let c=s.startsWith(a)?s.slice(a.length).trim():"";if(c&&await this.openNoteAtChunk(o.path,c))return;await n.openFile(o,{active:!0}),e.includes("#")&&!c&&(this.app.workspace.setActiveLeaf(n,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1));return}this.app.workspace.setActiveLeaf(n,{focus:!0}),await this.app.workspace.openLinkText(e,"",!1)}async openNoteInNewTab(e){let n=(0,p.normalizePath)(e);await this.app.workspace.openLinkText(n,"","tab")}async openPdfInMain(e,n){if(!e)return!1;let t=P.default.normalize(this.getVaultBasePath()),i=P.default.normalize(e),r=t.endsWith(P.default.sep)?t:`${t}${P.default.sep}`;if(i.startsWith(r)){let s=(0,p.normalizePath)(P.default.relative(t,i)),a=n?`#page=${n}`:"";return await this.app.workspace.openLinkText(`${s}${a}`,"","tab"),!0}try{return window.open((0,se.pathToFileURL)(e).toString()),!0}catch(s){return!1}}openExternalUrl(e){e&&window.open(e)}buildZoteroDeepLink(e,n,t,i){if(n){let r=new URLSearchParams;t&&r.set("page",t),i&&r.set("annotation",i);let s=r.toString()?`?${r.toString()}`:"";return`zotero://open-pdf/library/items/${n}${s}`}return`zotero://select/library/items/${e}`}extractAnnotationKey(e){if(!e)return;let t=(e.includes(":")?e.split(":").slice(1).join(":"):e).trim().toUpperCase();if(/^[A-Z0-9]{8}$/.test(t))return t}formatCitationsMarkdown(e){return e.length?e.map(t=>this.formatCitationMarkdown(t)).filter(Boolean).join(`
`):""}formatCitationMarkdown(e){var h,_,m,y;let n=e.doc_id||"?",t=`${n}`,i=this.formatCitationPageLabel(e),r=e.annotation_key||this.extractAnnotationKey(e.chunk_id),s=e.attachment_key||((_=(h=this.docIndex)==null?void 0:h[e.doc_id||""])==null?void 0:_.attachment_key),a=e.page_start?String(e.page_start):"",o=(y=(m=this.docIndex)==null?void 0:m[e.doc_id||""])!=null?y:null,l=`${(o==null?void 0:o.zotero_title)||(o==null?void 0:o.note_title)||t} p. ${i}`,d=this.normalizeChunkIdForNote(e.chunk_id,e.doc_id);if(this.settings.preferObsidianNoteForCitations&&d&&(o!=null&&o.note_path))return`- ${this.buildNoteChunkLink(o.note_path,d,l)}`;if(s){let x=this.buildZoteroDeepLink(n,s,a,r);return`- [${l}](${x})`}return`- ${l}`}buildNoteChunkLink(e,n,t){let i=(0,p.normalizePath)(e).replace(/\.md$/i,""),r=`zrr-chunk:${n}`;return`[[${i}#${r}|${t}]]`}generateChatId(){return typeof crypto!="undefined"&&"randomUUID"in crypto?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}getDocIndexPath(){return(0,p.normalizePath)(`${W}/doc_index.json`)}async getDocIndex(){return this.docIndex?this.docIndex:(this.docIndex=await this.loadDocIndexFromDisk(),this.docIndex)}async loadDocIndexFromDisk(){var t;let e=this.app.vault.adapter,n=this.getDocIndexPath();if(!await e.exists(n))return{};try{let i=await e.read(n),r=JSON.parse(i);if(r&&typeof r=="object"){let s=(t=r.entries)!=null?t:r;if(Array.isArray(s)){let a={};for(let o of s)o!=null&&o.doc_id&&(a[String(o.doc_id)]=o);return a}if(s&&typeof s=="object")return s}}catch(i){console.error("Failed to read doc index",i)}return{}}async saveDocIndex(e){await this.ensureFolder(W);let n=this.app.vault.adapter,t=this.getDocIndexPath(),i={version:1,entries:e};await n.write(t,JSON.stringify(i,null,2)),this.docIndex=e}async pruneDocIndexOrphans(){var l;let e=this.app.vault.adapter,n=await this.getDocIndex(),t=new Set(await this.listDocIds(K)),i=new Set(await this.listDocIds(Z)),r=await this.scanNotesForDocIds(this.settings.outputNoteDir),s=0,a=0,o=!1,c=new Date().toISOString();for(let d of Object.keys(n)){let h=n[d],_=!1,m=h!=null&&h.note_path?h.note_path.trim():"";if(m&&await e.exists(m))_=!0;else if((l=r[d])!=null&&l.note_path){_=!0;let x=r[d];x.note_path&&x.note_path!==h.note_path&&(h.note_path=x.note_path,a+=1,o=!0),x.note_title&&x.note_title!==h.note_title&&(h.note_title=x.note_title,a+=1,o=!0),a>0&&(h.updated_at=c)}let y=t.has(d)||i.has(d);!_&&!y&&(delete n[d],s+=1,o=!0)}return o&&await this.saveDocIndex(n),{removed:s,updated:a}}async updateDocIndex(e){var r;let n=await this.getDocIndex(),t=(r=n[e.doc_id])!=null?r:{doc_id:e.doc_id},i={...t,...e,doc_id:e.doc_id,updated_at:new Date().toISOString()};e.note_path===void 0&&t.note_path&&(i.note_path=t.note_path),e.note_title===void 0&&t.note_title&&(i.note_title=t.note_title),e.zotero_title===void 0&&t.zotero_title&&(i.zotero_title=t.zotero_title),e.pdf_path===void 0&&t.pdf_path&&(i.pdf_path=t.pdf_path),e.attachment_key===void 0&&t.attachment_key&&(i.attachment_key=t.attachment_key),n[e.doc_id]=i,await this.saveDocIndex(n)}async removeDocIndexEntry(e){let n=await this.getDocIndex();n[e]&&(delete n[e],await this.saveDocIndex(n))}async hydrateDocIndexFromCache(e){var a,o;if(!e)return null;let n=this.app.vault.adapter,t=await this.getDocIndexEntry(e),i={},r=(0,p.normalizePath)(`${K}/${e}.json`);if(await n.exists(r))try{let c=await n.read(r),l=JSON.parse(c),d=(o=(a=l==null?void 0:l.data)!=null?a:l)!=null?o:{},h=typeof d.title=="string"?d.title:"";if(h&&(i.zotero_title=h),!i.note_title||!i.note_path){let _=this.sanitizeFileName(h)||e,m=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${_}.md`),y=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${_}-${e}.md`),x="";await n.exists(m)?x=m:await n.exists(y)&&(x=y),x&&(i.note_path=x,i.note_title=P.default.basename(x,".md"))}}catch(c){console.error("Failed to read cached item JSON",c)}!i.note_title&&(t!=null&&t.note_path)&&(i.note_title=P.default.basename(t.note_path,".md"));let s=(0,p.normalizePath)(`${Z}/${e}.json`);if(await n.exists(s))try{let c=await n.read(s),l=JSON.parse(c);typeof(l==null?void 0:l.source_pdf)=="string"&&(i.pdf_path=l.source_pdf)}catch(c){console.error("Failed to read cached chunks JSON",c)}return Object.keys(i).length>0&&await this.updateDocIndex({doc_id:e,...i}),this.getDocIndexEntry(e)}async getDocIndexEntry(e){var t;return e&&(t=(await this.getDocIndex())[e])!=null?t:null}async inferNotePathFromCache(e){var i,r;let n=this.app.vault.adapter,t=(0,p.normalizePath)(`${K}/${e}.json`);if(!await n.exists(t))return"";try{let s=await n.read(t),a=JSON.parse(s),o=(r=(i=a==null?void 0:a.data)!=null?i:a)!=null?r:{},c=typeof o.title=="string"?o.title:"",l=this.sanitizeFileName(c)||e,d=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${l}.md`),h=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${l}-${e}.md`);if(await n.exists(d))return d;if(await n.exists(h))return h}catch(s){console.error("Failed to infer note path from cache",s)}return""}async rebuildNoteFromCacheForDocId(e,n){var T,F,V,Y,X;try{await this.ensureBundledTools()}catch(D){return n&&new p.Notice("Failed to sync bundled tools. See console for details."),console.error(D),!1}let t=this.app.vault.adapter,i=(0,p.normalizePath)(`${K}/${e}.json`),r=(0,p.normalizePath)(`${Z}/${e}.json`);if(!await t.exists(i)||!await t.exists(r))return n&&new p.Notice("Cached item or chunks JSON not found."),!1;this.showStatusProgress("Preparing...",5);let s;try{let D=await t.read(i);s=JSON.parse(D)}catch(D){return n&&new p.Notice("Failed to read cached item JSON."),console.error(D),this.clearStatusProgress(),!1}let a;try{let D=await t.read(r);a=JSON.parse(D)}catch(D){return n&&new p.Notice("Failed to read cached chunks JSON."),console.error(D),this.clearStatusProgress(),!1}let o=(T=s.data)!=null?T:s,c=typeof o.title=="string"?o.title:"",l=((V=(F=s.key)!=null?F:o.key)!=null?V:e).toString(),d=await this.getDocIndexEntry(e),h=typeof((Y=a==null?void 0:a.metadata)==null?void 0:Y.attachment_key)=="string"?a.metadata.attachment_key:d==null?void 0:d.attachment_key,_=typeof a.source_pdf=="string"?a.source_pdf:"";if(!_||!await this.isFileAccessible(_)){let D=await this.recoverMissingPdfFromAttachment(_,o,l,e,h,c,n);if(!D)return n&&new p.Notice("Cached source PDF is missing and could not be recovered."),this.clearStatusProgress(),!1;_=D.sourcePdf,D.attachmentKey&&(h=D.attachmentKey),await this.updateChunkJsonSourcePdf(r,_)}let m=await this.resolveLanguageHint(o,l),y=this.buildDoclingLanguageHint(m!=null?m:void 0),x="";if(d!=null&&d.note_path&&await t.exists(d.note_path)&&(x=(0,p.normalizePath)(d.note_path)),!x){let D=this.sanitizeFileName(c)||e,I=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${D}.md`),B=await t.exists(I)?D:await this.resolveUniqueBaseName(D,e);x=(0,p.normalizePath)(`${this.settings.outputNoteDir}/${B}.md`)}try{if(await this.ensureFolder(this.settings.outputNoteDir),this.settings.copyPdfToVault&&await this.ensureFolder(this.settings.outputPdfDir),this.settings.enableFileLogging){let D=this.getLogFileRelativePath(),I=(0,p.normalizePath)(P.default.dirname(D));I&&await this.ensureFolder(I);let B=this.getSpellcheckerInfoRelativePath(),G=(0,p.normalizePath)(P.default.dirname(B));G&&await this.ensureFolder(G)}}catch(D){return n&&new p.Notice("Failed to create notes folder."),console.error(D),this.clearStatusProgress(),!1}let b=this.getPluginDir(),v=P.default.join(b,"tools","docling_extract.py"),C=P.default.join(b,"tools","index_redisearch.py"),S=null,A=null,N=D=>{this.recreateMissingNotesActive&&(this.recreateMissingNotesProcess=D)};try{S=await this.readDoclingQualityLabelFromPdf(_,y),this.showStatusProgress(this.formatStatusLabel("Docling extraction...",S),0);let D=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;await this.runPythonStreaming(v,this.buildDoclingArgs(_,e,r,x,y,!0),G=>this.handleDoclingProgress(G,S),()=>{},D,"docling_extract",N),this.recreateMissingNotesProcess=null,S=await this.readDoclingQualityLabel(r),h&&await this.annotateChunkJsonWithAttachmentKey(r,h);let I=await this.readDoclingMetadata(r),B=await this.maybeCreateOcrLayeredPdf(_,I,y);B&&(_=B,A=B,await this.updateChunkJsonSourcePdf(r,B))}catch(D){return this.recreateMissingNotesAbort?(this.recreateMissingNotesProcess=null,this.clearStatusProgress(),!1):(n&&new p.Notice("Docling extraction failed. See console for details."),console.error(D),this.clearStatusProgress(),!1)}let R=!1,z=this.settings.enableFileLogging?this.getLogFileAbsolutePath():null;if(!await this.ensureRedisAvailable("rebuild"))R=!0,n&&new p.Notice("Redis is unavailable; skipping indexing for this note.");else try{this.showStatusProgress(this.formatStatusLabel("Indexing chunks...",S),0);let D=["--chunks-json",this.getAbsoluteVaultPath(r),"--redis-url",this.settings.redisUrl,"--index",this.getRedisIndexName(),"--prefix",this.getRedisKeyPrefix(),"--embed-base-url",this.settings.embedBaseUrl,"--embed-api-key",this.settings.embedApiKey,"--embed-model",this.settings.embedModel,"--upsert","--progress"];this.appendEmbedSubchunkArgs(D),this.settings.embedIncludeMetadata&&D.push("--embed-include-metadata"),this.appendChunkTaggingArgs(D,{allowRegenerate:!1}),await this.runPythonStreaming(C,D,I=>{if((I==null?void 0:I.type)==="progress"&&I.total){let B=Math.round(I.current/I.total*100),G=typeof I.message=="string"&&I.message.trim()?I.message:`Indexing chunks ${I.current}/${I.total}`,ae=this.formatStatusLabel(G,S);this.showStatusProgress(ae,B)}},()=>{},z,"index_redisearch",N),this.recreateMissingNotesProcess=null}catch(D){if(this.recreateMissingNotesAbort)return this.recreateMissingNotesProcess=null,this.clearStatusProgress(),!1;n&&new p.Notice("RedisSearch indexing failed; note will still be rebuilt."),console.error(D),R=!0}let O=A?this.buildPdfLinkFromSourcePath(A):this.buildPdfLinkForNote(_,d==null?void 0:d.attachment_key,e);try{let D=await this.app.vault.adapter.read(x),I=await this.readChunkPayload(r),B=this.buildSyncedDoclingContent(e,I,D),G=await this.buildNoteMarkdown(o,(X=s.meta)!=null?X:{},e,O,h,i,B);await this.writeNoteWithSyncSuppressed(x,G)}catch(D){return n&&new p.Notice("Failed to finalize note markdown."),console.error(D),this.clearStatusProgress(),!1}try{await this.updateDocIndex({doc_id:e,note_path:x,note_title:P.default.basename(x,".md"),zotero_title:c,pdf_path:_})}catch(D){console.error("Failed to update doc index",D)}return!0}getZoteroLibraryPath(){let e=(this.settings.zoteroUserId||"0").trim();return!e||e==="0"?"users/0":e.startsWith("users/")||e.startsWith("groups/")?e:`users/${e}`}async fetchZoteroLibraryOptions(){let e=[{value:"0",label:"My Library (local)"}],n=await this.fetchZoteroGroupOptions();return n.length&&e.push(...n),e}async fetchEmbeddingModelOptions(){let e=(this.settings.embedModel||"").trim(),n=[],t=(this.settings.embedBaseUrl||"").trim().replace(/\/$/,"");if(!t)return e&&n.push({value:e,label:e}),n;let i=(this.settings.embedApiKey||"").trim(),r=await this.fetchModelIds(t,i);if(r.length){let s=r.filter(o=>/embed/i.test(o)),a=s.length?s:r;n.push(...a.map(o=>({value:o,label:o})))}return!n.length&&e&&n.push({value:e,label:e}),n.sort((s,a)=>s.label.localeCompare(a.label))}async fetchChatModelOptions(){return this.fetchLlmModelOptions(this.settings.chatBaseUrl,this.settings.chatApiKey,"chat")}async fetchCleanupModelOptions(){return this.fetchLlmModelOptions(this.settings.llmCleanupBaseUrl,this.settings.llmCleanupApiKey,"cleanup")}async fetchLlmModelOptions(e,n,t){let i=t==="cleanup"?(this.settings.llmCleanupModel||"").trim():(this.settings.chatModel||"").trim(),r=[],s=(e||"").trim().replace(/\/$/,"");if(!s)return i&&r.push({value:i,label:i}),r;let a=(n||"").trim(),o=await this.fetchModelIds(s,a);if(o.length){let c=o.filter(d=>!/embed/i.test(d)),l=c.length?c:o;r.push(...l.map(d=>({value:d,label:d})))}return!r.length&&i&&r.push({value:i,label:i}),r.sort((c,l)=>c.label.localeCompare(l.label))}detectEmbeddingProvider(e){let n=e.toLowerCase();return n.includes("anthropic")?"anthropic":n.includes("openrouter")?"openrouter":n.includes("ollama")||n.includes(":11434")?"ollama":n.includes("openai")?"openai":"generic"}async fetchModelIds(e,n){let t=this.detectEmbeddingProvider(e);try{if(t==="anthropic")return await this.fetchAnthropicModels(e,n);let i=await this.fetchOpenAiCompatibleModels(e,n);return!i.length&&t==="ollama"?await this.fetchOllamaModels(e):i}catch(i){return console.warn("Failed to fetch models",i),[]}}async fetchOpenAiCompatibleModels(e,n){let t=`${e}/models`,i={};n&&(i.Authorization=`Bearer ${n}`);let r=await this.requestLocalApiRaw(t,{headers:i});if(r.statusCode>=400)throw new Error(`Model list request failed (${r.statusCode})`);let s=JSON.parse(r.body.toString("utf8"));return this.extractModelIds(s)}async fetchOllamaModels(e){let t=`${e.replace(/\/v1\/?$/,"")}/api/tags`,i=await this.requestLocalApiRaw(t);if(i.statusCode>=400)throw new Error(`Ollama tags request failed (${i.statusCode})`);let r;try{r=JSON.parse(i.body.toString("utf8"))}catch(a){return console.warn("Failed to parse Ollama tags response",a),[]}if(!r||typeof r!="object")return[];let s=r.models;return Array.isArray(s)?s.map(a=>this.extractModelId(a)).filter(a=>!!a):[]}async fetchAnthropicModels(e,n){if(!n)return[];let t=`${e}/models`,i={"x-api-key":n,"anthropic-version":"2023-06-01"},r=await this.requestLocalApiRaw(t,{headers:i});if(r.statusCode>=400)throw new Error(`Anthropic model list request failed (${r.statusCode})`);let s=JSON.parse(r.body.toString("utf8"));return this.extractModelIds(s)}extractModelIds(e){var i,r,s;if(Array.isArray(e))return e.map(a=>this.extractModelId(a)).filter(a=>!!a);if(!e||typeof e!="object")return[];let n=e,t=(s=(r=(i=n.data)!=null?i:n.models)!=null?r:n.model)!=null?s:n.items;return Array.isArray(t)?t.map(a=>this.extractModelId(a)).filter(a=>!!a):[]}extractModelId(e){var r,s,a;if(!e||typeof e!="object")return null;let n=e,t=(a=(s=(r=n.id)!=null?r:n.name)!=null?s:n.model)!=null?a:n.identifier;return typeof t!="string"?null:t.trim()||null}async fetchZoteroGroupOptions(){let e=new Map,n=t=>{for(let i of t)e.has(i.value)||e.set(i.value,i.label)};try{let t=this.buildZoteroUrl("/users/0/groups"),i=await this.requestLocalApi(t,`Zotero groups fetch failed for ${t}`);n(this.parseZoteroGroupOptions(i))}catch(t){console.warn("Failed to fetch Zotero groups from local API",t)}if(this.canUseWebApi()&&this.settings.webApiLibraryType==="user"){let t=(this.settings.webApiLibraryId||"").trim();if(t)try{let i=this.buildWebApiUrl(`/users/${t}/groups`),r=await this.requestWebApi(i,`Zotero Web API groups fetch failed for ${i}`);n(this.parseZoteroGroupOptions(r))}catch(i){console.warn("Failed to fetch Zotero groups from Web API",i)}}return Array.from(e.entries()).map(([t,i])=>({value:t,label:i})).sort((t,i)=>t.label.localeCompare(i.label))}parseZoteroGroupOptions(e){var i,r,s,a,o;let n;try{n=JSON.parse(e.toString("utf8"))}catch(c){return console.warn("Failed to parse Zotero group payload",c),[]}if(!Array.isArray(n))return[];let t=[];for(let c of n){if(!c||typeof c!="object")continue;let l=(i=c.data)!=null?i:c,d=(s=(r=l.id)!=null?r:c.id)!=null?s:l.key;if(!d)continue;let h=String(d).trim();if(!h)continue;let _=(o=(a=l.name)!=null?a:c.name)!=null?o:h,m=String(_||h).trim()||h;t.push({value:`groups/${h}`,label:`Group: ${m}`})}return t}async ensureFolder(e){let n=this.app.vault.adapter,t=(0,p.normalizePath)(e).split("/").filter(Boolean),i="";for(let r of t)i=i?`${i}/${r}`:r,await n.exists(i)||await n.mkdir(i)}async buildNoteMarkdown(e,n,t,i,r,s,a){let o=`[[${s}]]`,c=this.settings.copyPdfToVault&&i.startsWith("[["),l=r?this.buildZoteroDeepLink(t,r):"",d=l||i,h=c?i:l||i,_=h?c?`PDF: !${h}`:`PDF: ${h}`:"",m=_?`${_}

`:"",y=await this.buildTemplateVars(e,n,t,d,o);y.pdf_block=m,y.pdf_line=_,y.docling_markdown=a;let x=this.ensureDocIdInFrontmatter(await this.renderFrontmatter(e,n,t,d,o,y),t),b=x?`---
${x}
---

`:"",v=(this.settings.noteBodyTemplate||"").trim(),C=`${m}${a}`,S=v?this.renderTemplate(v,y,C,{appendDocling:!0}):C;return`${b}${S}`}async renderFrontmatter(e,n,t,i,r,s){var c;let a=(c=this.settings.frontmatterTemplate)!=null?c:"";if(!a.trim())return"";let o=s!=null?s:await this.buildTemplateVars(e,n,t,i,r);return this.renderTemplate(a,o,"",{appendDocling:!1}).trim()}renderTemplate(e,n,t,i={}){let r=e.replace(/{{\s*([a-z0-9_]+)\s*}}/gi,(s,a)=>{var o;return(o=n[a])!=null?o:""});return i.appendDocling&&!e.includes("{{docling_markdown}}")&&n.docling_markdown&&(r=`${r}

${n.docling_markdown}`),r.trim()?r:t}async buildTemplateVars(e,n,t,i,r){let s=this.coerceString(e.title),a=this.coerceString(e.shortTitle),o=this.coerceString(e.date),c=typeof(n==null?void 0:n.parsedDate)=="string"?n.parsedDate:"",l=this.extractYear(c||o),d=/^\d{4}$/.test(l)?l:"",h=Array.isArray(e.creators)?e.creators:[],_=h.filter(j=>j.creatorType==="author").map(j=>this.formatCreatorName(j)),m=_.join("; "),y=h.filter(j=>j.creatorType==="editor"||j.creatorType==="seriesEditor").map(j=>this.formatCreatorName(j)),x=y.join("; "),b=Array.isArray(e.tags)?e.tags.map(j=>typeof j=="string"?j:j==null?void 0:j.tag).filter(Boolean):[],v=this.sanitizeObsidianTags(b),C=v.join("; "),S=await this.resolveCollectionTitles(e),A=S.join("; "),N=this.toObsidianLinks(S),R=N.join("; "),z=this.coerceString(e.itemType),E=typeof(n==null?void 0:n.creatorSummary)=="string"?n.creatorSummary:"",O=this.coerceString(e.publicationTitle),T=this.coerceString(e.bookTitle),F=this.coerceString(e.journalAbbreviation),V=this.coerceString(e.volume),Y=this.coerceString(e.issue),X=this.coerceString(e.pages),D=typeof e.key=="string"?e.key:t,I=this.coerceString(e.DOI);I||(I=this.extractDoiFromExtra(e));let B=null;(!I||!a)&&(B=await this.fetchZoteroItemCsl(D)),I||(I=this.extractDoiFromCsl(B)),a||(a=this.extractShortTitleFromCsl(B));let G=this.coerceString(e.ISBN),ae=this.coerceString(e.ISSN),u=this.coerceString(e.publisher),f=this.coerceString(e.place),k=this.coerceString(e.url),M=this.coerceString(e.language),te=this.coerceString(e.abstractNote),Q=this.extractCitekey(e,n),ee=this.buildZoteroDeepLink(D),oe=Array.from(new Set([Q,a,I].map(j=>String(j||"").trim()).filter(j=>j.length>0))),Ye=oe.join("; "),q={doc_id:t,zotero_key:typeof e.key=="string"?e.key:t,item_link:ee,citekey:Q,title:s,short_title:a,date:o,year:l,year_number:d,authors:m,editors:x,aliases:Ye,tags:C,collection_title:A,collection_titles:A,collections_links:R,item_type:z,creator_summary:E,publication_title:O,book_title:T,journal_abbrev:F,volume:V,issue:Y,pages:X,doi:I,isbn:G,issn:ae,publisher:u,place:f,url:k,language:M,abstract:te,pdf_link:i,item_json:r};for(let[j,Qe]of Object.entries(q)){let xe=this.escapeYamlString(Qe);q[`${j}_yaml`]=xe,q[`${j}_quoted`]=xe,q[`${j}_text`]=xe}return q.authors_yaml_list=this.toYamlList(_),q.editors_yaml_list=this.toYamlList(y),q.tags_yaml_list=v.length>0?this.toYamlList(v):"",q.aliases_yaml_list=oe.length>0?this.toYamlList(oe):"",q.collections_yaml_list=this.toYamlList(S),q.collections_links_yaml_list=this.toYamlList(N),q.tags_raw=b.join("; "),q.tags_raw_yaml=this.escapeYamlString(q.tags_raw),q.tags_raw_yaml_list=b.length>0?this.toYamlList(b):"",q.authors_list=q.authors_yaml_list,q.editors_list=q.editors_yaml_list,q.tags_list=q.tags_yaml_list,q.aliases_list=q.aliases_yaml_list,q.collections_list=q.collections_yaml_list,q.collections_links_list=q.collections_links_yaml_list,q}extractYear(e){if(!e)return"";let n=e.match(/\b(\d{4})\b/);return n?n[1]:""}formatCreatorName(e){if(!e||typeof e!="object")return"";if(e.name)return String(e.name);let n=e.firstName?String(e.firstName):"",t=e.lastName?String(e.lastName):"";return[t,n].filter(Boolean).join(", ")||`${n} ${t}`.trim()}extractCitekey(e,n){let t=[n==null?void 0:n.citationKey,n==null?void 0:n.citekey,n==null?void 0:n.citeKey,n==null?void 0:n.betterBibtexKey,n==null?void 0:n.betterbibtexkey,e.citationKey,e.citekey,e.citeKey,e.betterBibtexKey,e.betterbibtexkey];for(let s of t){let a=this.coerceString(s);if(a)return a}let i=typeof e.extra=="string"?e.extra:"";if(!i)return"";let r=i.split(/\r?\n/);for(let s of r){let a=s.match(/^\s*(citation key|citekey|citation-key|bibtex key|bibtexkey)\s*:\s*(.+)\s*$/i);if(a&&a[2])return a[2].trim()}return""}extractShortTitleFromCsl(e){var t,i;if(!e)return"";let n=(i=(t=e["title-short"])!=null?t:e.shortTitle)!=null?i:e.short_title;return typeof n=="string"?n.trim():""}extractDoiFromExtra(e){let n=typeof e.extra=="string"?e.extra:"";if(!n)return"";let t=n.split(/\r?\n/);for(let r of t){let s=r.match(/^\s*doi\s*:\s*(.+)\s*$/i);if(s&&s[1])return s[1].trim().replace(/[.,;]+$/,"")}let i=n.match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i);return i?i[0].replace(/[.,;]+$/,""):""}extractDoiFromCsl(e){var t;if(!e)return"";let n=(t=e.DOI)!=null?t:e.doi;return typeof n=="string"?n.trim().replace(/[.,;]+$/,""):""}coerceString(e){if(typeof e=="string")return e.trim();if(typeof e=="number"&&Number.isFinite(e))return String(e);if(Array.isArray(e))for(let n of e){if(typeof n=="string"&&n.trim())return n.trim();if(typeof n=="number"&&Number.isFinite(n))return String(n)}if(e&&typeof e=="object"){let n=e[0];if(typeof n=="string"&&n.trim())return n.trim();if(typeof n=="number"&&Number.isFinite(n))return String(n)}return""}escapeYamlString(e){return`"${String(e).replace(/\r\n/g,`
`).replace(/\r/g,`
`).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n")}"`}toYamlList(e){return e.length?e.map(n=>`  - ${this.escapeYamlString(n)}`).join(`
`):'  - ""'}sanitizeObsidianTags(e){let n=this.settings.tagSanitizeMode||"kebab",t=n==="replace"?"kebab":n;return e.map(i=>this.sanitizeObsidianTag(i,t)).filter(i=>i.length>0)}sanitizeObsidianTag(e,n){let t=String(e||"").trim();if(!t)return"";let i=t.replace(/^#+/,"");if(n==="none")return i;let r=o=>!/^\d+$/.test(o),a=(o=>i.split("/").map(d=>{let _=d.replace(/[^\p{L}\p{N}]+/gu," ").split(/\s+/).filter(Boolean);if(!_.length)return"";if(o==="camel"||o==="pascal"){let[y,...x]=_;return[o==="pascal"?y.charAt(0).toUpperCase()+y.slice(1):y.charAt(0).toLowerCase()+y.slice(1),...x.map(v=>v.charAt(0).toUpperCase()+v.slice(1))].join("")}let m=o==="snake"?"_":"-";return _.join(m)}).filter(Boolean).join("/").replace(/\/{2,}/g,"/").replace(/^\/+|\/+$/g,""))(n);return a&&r(a)?a:""}toObsidianLinks(e){return e.map(n=>String(n||"").trim()).filter(n=>n.length>0).map(n=>n.startsWith("[[")&&n.endsWith("]]")?n:`[[${n}]]`)}getVaultBasePath(){var t;let e=this.app.vault.adapter;if(e instanceof p.FileSystemAdapter)return e.getBasePath();let n=(t=e.getBasePath)==null?void 0:t.call(e);if(n)return n;throw new Error("Vault base path is unavailable.")}getPluginDir(){var i;let e=this.getVaultBasePath(),n=(i=this.manifest.dir)!=null?i:this.manifest.id;if(!n)throw new Error("Plugin directory is unavailable.");let t=P.default.isAbsolute(n)?n:P.default.join(e,n);return P.default.normalize(t)}async ensureBundledTools(){let e=this.getPluginDir(),n=P.default.join(e,"tools");await U.promises.mkdir(n,{recursive:!0});for(let[t,i]of Object.entries(qe)){let r=P.default.join(n,t),s=!0;try{await U.promises.readFile(r,"utf8")===i&&(s=!1)}catch(a){}s&&await U.promises.writeFile(r,i,"utf8")}}async migrateCachePaths(){let e="zotero/items",n="zotero/chunks",t=K,i=Z,r=this.app.vault.adapter,s=(0,p.normalizePath)(e),a=(0,p.normalizePath)(n),o=(0,p.normalizePath)(t),c=(0,p.normalizePath)(i),l=o.split("/").slice(0,-1).join("/"),d=c.split("/").slice(0,-1).join("/");l&&await this.ensureFolder(l),d&&await this.ensureFolder(d);let h=await r.exists(s),_=await r.exists(a),m=await r.exists(o),y=await r.exists(c);h&&!m&&await r.rename(s,o),_&&!y&&await r.rename(a,c)}getAbsoluteVaultPath(e){let n=this.getVaultBasePath(),t=P.default.isAbsolute(e)?e:P.default.join(n,e);return P.default.normalize(t)}buildDoclingArgs(e,n,t,i,r,s=!1){let a=this.settings.ocrMode==="force_low_quality"?"auto":this.settings.ocrMode,o=["--pdf",e,"--doc-id",n,"--out-json",this.getAbsoluteVaultPath(t),"--out-md",this.getAbsoluteVaultPath(i),"--chunking",this.settings.chunkingMode,"--ocr",a];s&&o.push("--progress"),this.settings.ocrMode==="force_low_quality"&&o.push("--force-ocr-low-quality"),o.push("--quality-threshold",String(this.settings.ocrQualityThreshold)),r&&o.push("--language-hint",r),this.settings.enableLlmCleanup&&(o.push("--enable-llm-cleanup"),this.settings.llmCleanupBaseUrl&&o.push("--llm-cleanup-base-url",this.settings.llmCleanupBaseUrl),this.settings.llmCleanupApiKey&&o.push("--llm-cleanup-api-key",this.settings.llmCleanupApiKey),this.settings.llmCleanupModel&&o.push("--llm-cleanup-model",this.settings.llmCleanupModel),o.push("--llm-cleanup-temperature",String(this.settings.llmCleanupTemperature)),o.push("--llm-cleanup-min-quality",String(this.settings.llmCleanupMinQuality)),o.push("--llm-cleanup-max-chars",String(this.settings.llmCleanupMaxChars)));let c=this.getPluginDir(),l=P.default.join(c,"tools","ocr_wordlist.txt");if((0,U.existsSync)(l)&&o.push("--enable-dictionary-correction","--dictionary-path",l),this.settings.enableFileLogging){let d=this.getLogFileAbsolutePath();d&&o.push("--log-file",d);let h=this.getAbsoluteVaultPath(this.getSpellcheckerInfoRelativePath());h&&o.push("--spellchecker-info-out",h)}return o}appendEmbedSubchunkArgs(e){let n=this.settings.embedSubchunkChars;Number.isFinite(n)&&e.push("--embed-subchunk-chars",String(Math.max(0,Math.trunc(n))));let t=this.settings.embedSubchunkOverlap;Number.isFinite(t)&&e.push("--embed-subchunk-overlap",String(Math.max(0,Math.trunc(t))))}appendChunkTaggingArgs(e,n){if((n==null?void 0:n.allowRegenerate)===!1||!this.settings.enableChunkTagging)return;let t=(this.settings.llmCleanupBaseUrl||"").trim(),i=(this.settings.llmCleanupModel||"").trim();if(!t||!i)return;e.push("--generate-chunk-tags","--tag-base-url",t,"--tag-model",i);let r=(this.settings.llmCleanupApiKey||"").trim();r&&e.push("--tag-api-key",r),e.push("--tag-temperature",String(this.settings.llmCleanupTemperature))}getRedisDataDir(){return P.default.join(this.getVaultBasePath(),W,"redis-data")}getDockerComposePath(){let e=this.getPluginDir();return P.default.join(e,"tools","docker-compose.yml")}async resolveDockerPath(){var c;let e=(c=this.settings.dockerPath)==null?void 0:c.trim(),n=["/opt/homebrew/bin/docker","/usr/local/bin/docker","/usr/bin/docker","/Applications/Docker.app/Contents/Resources/bin/docker"],t=["/opt/homebrew/bin/podman","/usr/local/bin/podman","/usr/bin/podman"],i=["/opt/homebrew/bin/podman-compose","/usr/local/bin/podman-compose","/usr/bin/podman-compose"],r=[];e&&r.push(e);let s=e?this.getContainerCliKind(e):"docker",a=s==="podman-compose"?[i,t,n]:s==="podman"?[t,i,n]:[n,t,i];if(!e||e==="docker"||e==="podman"||e==="podman-compose")for(let l of a)r.push(...l);for(let l of r)if(P.default.isAbsolute(l))try{if(await this.isContainerCliAvailable(l))return l}catch(d){}let o=[e,s==="podman"?"podman":"docker",s==="podman"?"docker":"podman","podman-compose"].filter(l=>!!(l&&l.trim()));for(let l of o)if(await this.isContainerCliAvailable(l))return l;return e||"docker"}async isContainerCliAvailable(e){return new Promise(n=>{let t=(0,J.spawn)(e,["--version"]);t.on("error",()=>n(!1)),t.on("close",i=>n(i===0))})}getContainerCliKind(e){let n=P.default.basename(e);return n==="podman-compose"?"podman-compose":n.includes("podman")?"podman":"docker"}async isContainerDaemonRunning(e){let n=this.getContainerCliKind(e),t=e,i=["info"];if(n==="podman-compose"){let r=await this.resolvePodmanBin();if(!r)return!1;t=r}return new Promise(r=>{let s=(0,J.spawn)(t,i),a=!1,o=l=>{a||(a=!0,r(l))},c=setTimeout(()=>{s.kill(),o(!1)},2e3);s.on("error",()=>{clearTimeout(c),o(!1)}),s.on("close",l=>{clearTimeout(c),o(l===0)})})}getContainerDaemonHint(e){let n=this.getContainerCliKind(e);return n==="podman"||n==="podman-compose"?"Podman machine not running. Run `podman machine start`.":"Docker Desktop is not running. Start Docker Desktop."}async supportsComposeSubcommand(e){return new Promise(n=>{let t=(0,J.spawn)(e,["compose","version"]);t.on("error",()=>n(!1)),t.on("close",i=>n(i===0))})}async findPodmanComposePath(){let e=["/opt/homebrew/bin/podman-compose","/usr/local/bin/podman-compose","/usr/bin/podman-compose"];for(let n of e)try{return await U.promises.access(n),n}catch(t){}return await this.isContainerCliAvailable("podman-compose")?"podman-compose":null}async resolvePodmanBin(){let e=["/opt/homebrew/bin/podman","/usr/local/bin/podman","/usr/bin/podman"];for(let n of e)if(await this.isContainerCliAvailable(n))return n;return await this.isContainerCliAvailable("podman")?"podman":null}async resolveComposeCommand(e){let n=P.default.basename(e);if(n==="podman-compose")return{command:e,argsPrefix:[]};if(n==="podman"){let t=await this.findPodmanComposePath();return t?{command:t,argsPrefix:[]}:await this.supportsComposeSubcommand(e)?{command:e,argsPrefix:["compose"]}:null}return await this.supportsComposeSubcommand(e)?{command:e,argsPrefix:["compose"]}:null}async autoDetectContainerCliOnLoad(){var r;let e=await this.resolveDockerPath();if(!await this.isContainerCliAvailable(e)){this.notifyContainerOnce("Docker or Podman not found. Install Docker Desktop or Podman and set Docker/Podman path in settings.");return}let n=((r=this.settings.dockerPath)==null?void 0:r.trim())||"docker";(!await this.isContainerCliAvailable(n)||n==="docker"||n==="podman"||n==="podman-compose")&&e&&e!==n&&(this.settings.dockerPath=e,await this.saveSettings()),await this.isContainerDaemonRunning(e)||this.notifyContainerOnce(this.getContainerDaemonHint(e))}getDockerProjectName(){let e=this.getVaultBasePath(),n=P.default.basename(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,18),t=(0,fe.createHash)("sha1").update(e).digest("hex").slice(0,8);return`zrr-${n||"vault"}-${t}`}getRedisPortFromUrl(){try{let e=new URL(this.settings.redisUrl),n=e.port?Number(e.port):6379;return Number.isFinite(n)&&n>0?n:6379}catch(e){return 6379}}getVaultPreferredRedisPort(){let e=(0,fe.createHash)("sha1").update(this.getVaultBasePath()).digest("hex");return 6400+Number.parseInt(e.slice(0,4),16)%2e3}getRedisHostFromUrl(){try{return new URL(this.settings.redisUrl).hostname||"127.0.0.1"}catch(e){return"127.0.0.1"}}isLocalRedisHost(e){let n=e.trim().toLowerCase();return n?n==="localhost"||n==="0.0.0.0"||n==="::1"?!0:n.startsWith("127."):!1}getPortCheckHost(e){return this.isLocalRedisHost(e)?"127.0.0.1":e}async isPortFree(e,n){return new Promise(t=>{let i=_e.default.createServer();i.once("error",()=>t(!1)),i.once("listening",()=>{i.close(()=>t(!0))}),i.listen(n,e)})}async findAvailablePort(e,n){for(let i=0;i<25;i+=1){let r=n+i;if(await this.isPortFree(e,r))return r}return null}updateRedisUrlPort(e,n){try{let t=new URL(e);return t.port=String(n),t.toString()}catch(t){return`redis://127.0.0.1:${n}`}}async isRedisReachable(e){let n="127.0.0.1",t=6379;try{let i=new URL(e);n=i.hostname||n,t=i.port?Number(i.port):t}catch(i){return!1}return new Promise(i=>{let r=new _e.default.Socket,s=!1,a=o=>{s||(s=!0,r.destroy(),i(o))};r.setTimeout(500),r.once("connect",()=>a(!0)),r.once("timeout",()=>a(!1)),r.once("error",()=>a(!1)),r.connect(t,n)})}getRedisNamespace(){let e=this.getVaultBasePath(),n=P.default.basename(e).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,24),t=(0,fe.createHash)("sha1").update(e).digest("hex").slice(0,8);return`${n||"vault"}-${t}`}getRedisIndexName(){return`${(this.settings.redisIndex||"idx:zotero").trim()||"idx:zotero"}:${this.getRedisNamespace()}`}getRedisKeyPrefix(){let e=(this.settings.redisPrefix||"zotero:chunk:").trim()||"zotero:chunk:";return`${e.endsWith(":")?e:`${e}:`}${this.getRedisNamespace()}:`}async isComposeProjectRunning(e,n,t,i,r){return new Promise(s=>{let a=(0,J.spawn)(e,[...n,"-p",i,"-f",t,"ps","-q"],{cwd:P.default.dirname(t),env:r}),o="";a.stdout.on("data",c=>{o+=c.toString()}),a.on("error",c=>{console.warn("Redis Stack status check failed",c),s(!1)}),a.on("close",c=>{if(c!==0){s(!1);return}s(o.trim().length>0)})})}async startRedisStack(e){var n;try{await this.ensureBundledTools();let t=this.getDockerComposePath(),i=this.getRedisDataDir();await U.promises.mkdir(i,{recursive:!0});let r=await this.resolveDockerPath(),s=((n=this.settings.dockerPath)==null?void 0:n.trim())||"docker";if((!await this.isContainerCliAvailable(s)||!s||s==="docker"||s==="podman"||s==="podman-compose")&&r&&r!==s&&(this.settings.dockerPath=r,await this.saveSettings(),e||new p.Notice(`Docker/Podman path set to ${r}.`)),!await this.isContainerCliAvailable(r)){e||new p.Notice('Docker or Podman not found. Install Docker Desktop or Podman and set "Docker/Podman path" in settings.');return}if(!await this.isContainerDaemonRunning(r)){e||new p.Notice(this.getContainerDaemonHint(r));return}let o=await this.resolveComposeCommand(r);if(!o){e||new p.Notice("Compose support not found. Install Docker Desktop or Podman with podman-compose.");return}let c={...process.env};if(P.default.basename(o.command)==="podman-compose"){let b=await this.resolvePodmanBin();if(b&&(c.PODMAN_BIN=b,P.default.isAbsolute(b))){let v=P.default.dirname(b),C=c.PATH||"";C.split(P.default.delimiter).includes(v)||(c.PATH=`${v}${P.default.delimiter}${C}`)}}let l=this.getDockerProjectName();if(await this.isComposeProjectRunning(o.command,o.argsPrefix,t,l,c)){e||new p.Notice("Redis Stack already running for this vault.");return}let d=this.getRedisPortFromUrl(),h=this.getRedisHostFromUrl(),_=this.getPortCheckHost(h),m=this.settings.autoAssignRedisPort&&this.isLocalRedisHost(h),y=this.settings.redisUrl,x=d;if(m){let b=d===6379?this.getVaultPreferredRedisPort():d,v=await this.findAvailablePort(_,b);if(!v)throw new Error(`No available Redis port found starting at ${b}.`);v!==d&&(x=v,y=this.updateRedisUrlPort(y,x),this.settings.redisUrl=y,await this.saveSettings(),e||new p.Notice(`Using Redis port ${x} for this vault.`))}else if(await this.isRedisReachable(y)){e||new p.Notice(`Redis already running at ${y}.`);return}c.ZRR_DATA_DIR=i,c.ZRR_PORT=String(x);try{await this.runCommand(o.command,[...o.argsPrefix,"-p",l,"-f",t,"down"],{cwd:P.default.dirname(t),env:c})}catch(b){console.warn("Redis Stack stop before restart failed",b)}await this.runCommand(o.command,[...o.argsPrefix,"-p",l,"-f",t,"up","-d"],{cwd:P.default.dirname(t),env:c}),e||new p.Notice("Redis Stack started.")}catch(t){e||new p.Notice("Failed to start Redis Stack. Check Docker/Podman and file sharing."),console.error("Failed to start Redis Stack",t)}}async setupPythonEnv(){let e=this.getPluginDir(),n=this.getPythonVenvDir(),t=this.getVenvPythonPath(n);await this.ensureBundledTools();let i=this.resolveRequirementsPath(e);if(!i)throw new Error(`requirements.txt not found in ${e}`);try{new p.Notice("Setting up Python environment..."),this.showStatusProgress("Setting up Python environment...",null),console.log(`Python env: using plugin dir ${e}`),console.log(`Python env: venv path ${n}`);let r=null,s=async()=>(r||(r=await this.resolveBootstrapPython()),r);if((0,U.existsSync)(t)){let a=await this.getPythonVersion(t,[]);if(a&&this.isUnsupportedPythonVersion(a)){let o=await s();console.log(`Python env: existing venv uses Python ${a.major}.${a.minor}; rebuilding with ${o.command} ${o.args.join(" ")}`),this.showStatusProgress("Rebuilding Python environment...",null),await U.promises.rm(n,{recursive:!0,force:!0})}}if(!(0,U.existsSync)(t)){let a=await s();console.log(`Python env: creating venv with ${a.command} ${a.args.join(" ")}`),await this.runCommand(a.command,[...a.args,"-m","venv",n],{cwd:e})}await this.runCommandStreaming(t,["-m","pip","install","-r",i],{cwd:e},a=>{let o=a.trim();if(!o)return;let c=o.match(/^Collecting\s+([^\s]+)/);if(c){this.showStatusProgress(`Installing ${c[1]}...`,null);return}if(o.startsWith("Installing collected packages")){this.showStatusProgress("Installing packages...",null);return}o.startsWith("Successfully installed")&&this.showStatusProgress("Python environment ready.",100)}),this.settings.pythonPath=t,await this.saveSettings(),this.clearStatusProgress(),new p.Notice("Python environment ready.")}catch(r){this.clearStatusProgress(),new p.Notice("Failed to set up Python environment. See console for details."),console.error("Python env setup failed",r)}}getPythonVenvDir(){return P.default.join(this.getPluginDir(),".venv")}getVenvPythonPath(e){return process.platform==="win32"?P.default.join(e,"Scripts","python.exe"):P.default.join(e,"bin","python")}resolveRequirementsPath(e){var t;return(t=[P.default.join(e,"requirements.txt"),P.default.join(e,"tools","requirements.txt")].find(i=>(0,U.existsSync)(i)))!=null?t:null}async resolveBootstrapPython(){let e=(this.settings.pythonPath||"").trim();if(e&&await this.canRunCommand(e,[])){let t=await this.getPythonVersion(e,[]);if(t&&this.isUnsupportedPythonVersion(t))throw new Error(`Configured Python ${t.major}.${t.minor} is not supported. Install Python 3.11, 3.12, or 3.13 and update the Python path.`);return{command:e,args:[]}}let n=process.platform==="win32"?[{command:"py",args:["-3.13"]},{command:"py",args:["-3.12"]},{command:"py",args:["-3.11"]},{command:"py",args:["-3.10"]},{command:"py",args:["-3"]},{command:"python",args:[]}]:[{command:"python3.13",args:[]},{command:"python3.12",args:[]},{command:"python3.11",args:[]},{command:"python3.10",args:[]},{command:"python3",args:[]},{command:"python",args:[]}];for(let t of n)if(await this.canRunCommand(t.command,t.args)){let i=await this.getPythonVersion(t.command,t.args);if(i&&this.isUnsupportedPythonVersion(i)){console.log(`Python env: skipping ${t.command} ${t.args.join(" ")} (Python ${i.major}.${i.minor} unsupported)`);continue}return t}throw new Error("No usable Python 3.11-3.13 interpreter found on PATH.")}isUnsupportedPythonVersion(e){return e.major>3||e.major===3&&e.minor>=14}async getPythonVersion(e,n){return new Promise(t=>{let i=(0,J.spawn)(e,[...n,"-c","import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"]),r="";i.stdout.on("data",s=>{r+=s.toString()}),i.on("error",()=>t(null)),i.on("close",s=>{if(s!==0){t(null);return}let a=r.trim().match(/(\d+)\.(\d+)/);if(!a){t(null);return}t({major:Number(a[1]),minor:Number(a[2])})})})}async canRunCommand(e,n){return new Promise(t=>{let i=(0,J.spawn)(e,[...n,"--version"],{env:this.buildPythonEnv()});i.on("error",()=>t(!1)),i.on("close",r=>t(r===0))})}buildPythonEnv(){let e={...process.env},n=P.default.delimiter,t=e.PATH||"",r=[...process.platform==="win32"?[]:["/opt/homebrew/bin","/usr/local/bin"],t].filter(Boolean).join(n);return e.PATH=r,e.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK||(e.PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK="True"),e.DISABLE_MODEL_SOURCE_CHECK||(e.DISABLE_MODEL_SOURCE_CHECK="True"),e}runPython(e,n){return new Promise((t,i)=>{let r=(0,J.spawn)(this.settings.pythonPath,[e,...n],{cwd:P.default.dirname(e),env:this.buildPythonEnv()}),s="",a="";r.stdout.on("data",o=>{s+=o.toString()}),r.stderr.on("data",o=>{a+=o.toString()}),r.on("error",o=>{this.handlePythonProcessError(String(o)),i(o)}),r.on("close",o=>{if(o===0)t();else{let c=a.trim()?a:s;this.handlePythonProcessError(c),i(new Error(a||`Process exited with code ${o}`))}})})}runCommand(e,n,t){return new Promise((i,r)=>{var o;let s=(0,J.spawn)(e,n,{cwd:t==null?void 0:t.cwd,env:(o=t==null?void 0:t.env)!=null?o:this.buildPythonEnv()}),a="";s.stderr.on("data",c=>{a+=c.toString()}),s.on("error",c=>{r(c)}),s.on("close",c=>{c===0?i():r(new Error(a||`Process exited with code ${c}`))})})}runPythonStreaming(e,n,t,i,r,s="docling_extract",a){return new Promise((o,c)=>{let l=(0,J.spawn)(this.settings.pythonPath,[e,...n],{cwd:P.default.dirname(e),env:this.buildPythonEnv()});a&&a(l);let d="",h="",_="",m=null,y=!1,x=b=>{if(b.trim())try{let v=JSON.parse(b);m=v,((v==null?void 0:v.type)==="final"||v!=null&&v.answer)&&(y=!0),t(v)}catch(v){_+=`${b}
`}};l.stdout.on("data",b=>{var C;d+=b.toString();let v=d.split(/\r?\n/);d=(C=v.pop())!=null?C:"";for(let S of v)x(S)}),l.stderr.on("data",b=>{h+=b.toString()}),l.on("error",b=>{this.handlePythonProcessError(String(b)),c(b)}),l.on("close",b=>{if(d.trim()&&x(d),!y&&m&&i(m),r&&this.appendToLogFile(r,h,s,"STDERR"),b===0)o();else{let v=h.trim()?h:_;this.handlePythonProcessError(v),c(new Error(h||`Process exited with code ${b}`))}})})}runCommandStreaming(e,n,t,i){return new Promise((r,s)=>{var l;let a=(0,J.spawn)(e,n,{cwd:t==null?void 0:t.cwd,env:(l=t==null?void 0:t.env)!=null?l:this.buildPythonEnv()}),o=d=>{d.toString().split(/\r?\n/).forEach(_=>{_.trim()&&i(_)})},c="";a.stdout.on("data",o),a.stderr.on("data",d=>{c+=d.toString(),o(d)}),a.on("error",d=>{s(d)}),a.on("close",d=>{d===0?r():s(new Error(c||`Process exited with code ${d}`))})})}handlePythonProcessError(e){if(!e)return;let n=e.match(/ModuleNotFoundError:\s+No module named ['"]([^'"]+)['"]/);if(n){let t=`Python env missing module '${n[1]}'. Open Settings > Python environment > Create/Update.`;this.notifyPythonEnvOnce(t,!0);return}if(/No module named ['"]|ImportError: No module named/i.test(e)){this.notifyPythonEnvOnce("Python env missing required modules. Open Settings > Python environment > Create/Update.",!0);return}/ENOENT|No such file or directory|not found|command not found|spawn .* ENOENT/i.test(e)&&this.notifyPythonEnvOnce("Python not found. Configure the Python path or use Settings > Python environment > Create/Update.",!0)}notifyPythonEnvOnce(e,n=!1){this.lastPythonEnvNotice!==e&&(this.lastPythonEnvNotice=e,new p.Notice(e),n&&this.openPluginSettings())}notifyContainerOnce(e){this.lastContainerNotice!==e&&(this.lastContainerNotice=e,new p.Notice(e))}openPluginSettings(){let e=this.app.setting;e!=null&&e.open&&e.open(),e!=null&&e.openTabById&&e.openTabById(this.manifest.id)}getLogsDirRelative(){return(0,p.normalizePath)(`${W}/logs`)}getLogFileRelativePath(){let e=(this.settings.logFilePath||"").trim();return(0,p.normalizePath)(e||`${this.getLogsDirRelative()}/docling_extract.log`)}getLogFileAbsolutePath(){return this.getAbsoluteVaultPath(this.getLogFileRelativePath())}getSpellcheckerInfoRelativePath(){return(0,p.normalizePath)(`${this.getLogsDirRelative()}/spellchecker_info.json`)}async openLogFile(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;if(!await n.exists(e)){new p.Notice("Log file not found.");return}try{let t=async()=>{try{return await n.read(e)||"(empty)"}catch(r){return"(empty)"}},i=await t();new ue(this.app,"Log file",i||"(empty)",{autoRefresh:!0,refreshIntervalMs:2e3,onRefresh:t,onClear:async()=>{await this.clearLogFile()}}).open()}catch(t){new p.Notice("Failed to open log file."),console.error(t)}}async clearLogFile(){let e=this.getLogFileRelativePath(),n=this.app.vault.adapter;try{let t=(0,p.normalizePath)(P.default.dirname(e));t&&await this.ensureFolder(t),await n.write(e,""),new p.Notice("Log file cleared.")}catch(t){new p.Notice("Failed to clear log file."),console.error(t)}}formatLogLines(e,n,t){let i=e.split(/\r?\n/).map(s=>s.trimEnd()).filter(s=>!!s.trim());if(!i.length)return"";let r=new Date().toISOString().replace("T"," ").replace("Z","").replace(".",",");return i.map(s=>`${r} ${t} ${n}: ${s}`).join(`
`)+`
`}async appendToLogFile(e,n,t="docling_extract",i="STDERR"){if(!n||!n.trim())return;let r=this.formatLogLines(n,t,i);if(r)try{await U.promises.mkdir(P.default.dirname(e),{recursive:!0}),await U.promises.appendFile(e,r)}catch(s){console.warn("Failed to append stderr to log file",s)}}runPythonWithOutput(e,n,t,i="docling_extract"){return new Promise((r,s)=>{let a=(0,J.spawn)(this.settings.pythonPath,[e,...n],{cwd:P.default.dirname(e),env:this.buildPythonEnv()}),o="",c="";a.stdout.on("data",l=>{o+=l.toString()}),a.stderr.on("data",l=>{c+=l.toString()}),a.on("error",l=>{this.handlePythonProcessError(String(l)),s(l)}),a.on("close",l=>{if(t&&this.appendToLogFile(t,c,i,"STDERR"),l===0)r(o.trim());else{let d=c.trim()?c:o;this.handlePythonProcessError(d),s(new Error(c||`Process exited with code ${l}`))}})})}},Ie=class extends p.SuggestModal{constructor(e,n,t){super(e);this.lastError=null;this.indexedDocIds=null;this.attachmentStatusCache=new Map;this.attachmentChecks=new Set;this.plugin=n,this.resolveSelection=t,this.setPlaceholder("Search Zotero items...")}async getSuggestions(e){try{if(!this.indexedDocIds){let n=await this.plugin.getDocIndex();this.indexedDocIds=new Set(Object.keys(n))}return await this.plugin.searchZoteroItems(e)}catch(n){let t=n instanceof Error?n.message:String(n);return this.lastError!==t&&(this.lastError=t,new p.Notice(t)),console.error("Zotero search failed",n),[]}}renderSuggestion(e,n){var d,h,_;let t=(h=(d=e.data)==null?void 0:d.title)!=null?h:"[No title]",i=this.extractYear(e),r=this.getDocId(e),s=r?(_=this.indexedDocIds)==null?void 0:_.has(r):!1,a=this.getPdfStatus(e);s&&n.addClass("zrr-indexed-item"),a==="no"&&n.addClass("zrr-no-pdf-item"),n.createEl("div",{text:t});let o=n.createEl("small"),c=!1,l=()=>{c&&o.createSpan({text:" \u2022 "})};if(i&&(o.createSpan({text:i}),c=!0),s&&(l(),o.createSpan({text:"Indexed",cls:"zrr-indexed-flag"}),c=!0),a==="no"&&(l(),o.createSpan({text:"No PDF attachment",cls:"zrr-no-pdf-flag"}),c=!0),a==="unknown"){let m=r?this.attachmentStatusCache.get(r):void 0;m==="no"?(l(),o.createSpan({text:"No PDF attachment",cls:"zrr-no-pdf-flag"}),c=!0,n.addClass("zrr-no-pdf-item")):m==="yes"||r&&this.refreshAttachmentStatus(r,e,n,o)}n.addEventListener("click",()=>{this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()})}onChooseSuggestion(e,n){this.resolveSelection&&(this.resolveSelection(e),this.resolveSelection=null),this.close()}onClose(){this.resolveSelection&&(this.resolveSelection(null),this.resolveSelection=null)}getDocId(e){var t,i,r;let n=(r=(i=e.key)!=null?i:(t=e.data)==null?void 0:t.key)!=null?r:"";return typeof n=="string"?n:""}getPdfStatus(e){var i;let n=this.collectItemAttachments(e.data);if(n.length>0)return n.some(s=>this.isPdfAttachment(s))?"yes":"no";let t=(i=e.meta)==null?void 0:i.numChildren;return typeof t=="number"&&t===0?"no":"unknown"}collectItemAttachments(e){if(!e)return[];let n=[e.attachments,e.children,e.items,e.attachment,e.allAttachments],t=[];for(let i of n)i&&(Array.isArray(i)?t.push(...i):typeof i=="object"&&t.push(i));return t}isPdfAttachment(e){var i,r,s,a,o,c,l,d,h,_,m,y,x,b,v;if(((c=(o=(s=(i=e==null?void 0:e.contentType)!=null?i:e==null?void 0:e.mimeType)!=null?s:(r=e==null?void 0:e.data)==null?void 0:r.contentType)!=null?o:(a=e==null?void 0:e.data)==null?void 0:a.mimeType)!=null?c:"")==="application/pdf")return!0;let t=(v=(b=(y=(m=(h=(l=e==null?void 0:e.filename)!=null?l:e==null?void 0:e.fileName)!=null?h:(d=e==null?void 0:e.data)==null?void 0:d.filename)!=null?m:(_=e==null?void 0:e.data)==null?void 0:_.fileName)!=null?y:e==null?void 0:e.path)!=null?b:(x=e==null?void 0:e.data)==null?void 0:x.path)!=null?v:"";return!!(typeof t=="string"&&t.toLowerCase().endsWith(".pdf"))}extractYear(e){var i,r,s,a;let n=(a=(s=(i=e.meta)==null?void 0:i.parsedDate)!=null?s:(r=e.data)==null?void 0:r.date)!=null?a:"";if(typeof n!="string")return"";let t=n.match(/\b(\d{4})\b/);return t?t[1]:""}async refreshAttachmentStatus(e,n,t,i){if(!this.attachmentChecks.has(e)){this.attachmentChecks.add(e);try{let r=await this.plugin.hasProcessableAttachment(n);this.attachmentStatusCache.set(e,r?"yes":"no"),!r&&i.isConnected&&t.isConnected&&(i.querySelector(".zrr-no-pdf-flag")||(i.childNodes.length>0&&i.createSpan({text:" \u2022 "}),i.createSpan({text:"No PDF attachment",cls:"zrr-no-pdf-flag"})),t.addClass("zrr-no-pdf-item"))}finally{this.attachmentChecks.delete(e)}}}};
