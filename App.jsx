// import { useState, useRef, useEffect, useCallback } from "react";

// // ─── ICONS (inline SVG components) ───────────────────────────────────────────
// const Icon = ({ d, size = 16, color = "currentColor", stroke = true }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke ? "none" : color}
//     stroke={stroke ? color : "none"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
//     <path d={d} />
//   </svg>
// );
// const Icons = {
//   database:  "M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5z M2 7c0 2.76 4.48 5 10 5s10-2.24 10-5 M2 12c0 2.76 4.48 5 10 5s10-2.24 10-5",
//   file:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
//   table:     "M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18 M15 3v18",
//   mongo:     "M12 2C6 2 4 7 4 12c0 4 2 7 8 9 6-2 8-5 8-9 0-5-2-10-8-10z",
//   api:       "M4 6h16M4 12h16M4 18h7 M14 18l3 3 5-5",
//   csv:       "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M8 13h2 M8 17h2 M14 13h2 M14 17h2",
//   plus:      "M12 5v14 M5 12h14",
//   search:    "M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
//   run:       "M5 3l14 9-14 9V3z",
//   close:     "M18 6L6 18 M6 6l12 12",
//   check:     "M20 6L9 17l-5-5",
//   copy:      "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 2v6h6 M8 12h8 M8 16h6",
//   download:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
//   history:   "M12 8v4l3 3 M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z",
//   settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
//   bolt:      "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
//   upload:    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
//   chevronR:  "M9 18l6-6-6-6",
//   chevronD:  "M6 9l6 6 6-6",
//   grid:      "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
//   filter:    "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
//   refresh:   "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
//   aiSpark:   "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z",
//   table2:    "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M8 12h8 M8 16h5 M16 5l2 2 4-4",
//   info:      "M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z M12 16v-4 M12 8h.01",
// };

// // ─── THEME ───────────────────────────────────────────────────────────────────
// const T = {
//   bg:       "#060912",
//   surface:  "#0d1117",
//   panel:    "#111827",
//   card:     "#161f2e",
//   card2:    "#1a253b",
//   border:   "#1e2d45",
//   border2:  "#253550",
//   accent:   "#6366f1",
//   accentLo: "rgba(99,102,241,0.12)",
//   accentGl: "rgba(99,102,241,0.25)",
//   teal:     "#14b8a6",
//   green:    "#10b981",
//   yellow:   "#f59e0b",
//   red:      "#ef4444",
//   orange:   "#f97316",
//   text:     "#e2e8f0",
//   text2:    "#94a3b8",
//   text3:    "#475569",
//   mono:     "'JetBrains Mono', 'Fira Code', monospace",
//   sans:     "'Inter', system-ui, sans-serif",
// };

// // ─── SOURCE DEFINITIONS ───────────────────────────────────────────────────────
// const SOURCE_TYPES = [
//   { id: "excel",   label: "Excel / CSV",   icon: "table",    color: "#10b981", desc: "Upload .xls, .xlsx, or .csv files",       fields: [],                                     upload: true },
//   { id: "pdf",     label: "PDF",           icon: "file",     color: "#f97316", desc: "Extract and query data from PDF files",   fields: [],                                     upload: true },
//   { id: "postgres",label: "PostgreSQL",    icon: "database", color: "#336791", desc: "Connect to a PostgreSQL database",
//     fields: [{ key:"host",label:"Host",ph:"localhost" },{ key:"port",label:"Port",ph:"5432" },{ key:"db",label:"Database",ph:"mydb" },{ key:"user",label:"User",ph:"postgres" },{ key:"pass",label:"Password",ph:"••••••",type:"password" }] },
//   { id: "mysql",   label: "MySQL",         icon: "database", color: "#00758f", desc: "Connect to a MySQL/MariaDB database",
//     fields: [{ key:"host",label:"Host",ph:"localhost" },{ key:"port",label:"Port",ph:"3306" },{ key:"db",label:"Database",ph:"mydb" },{ key:"user",label:"User",ph:"root" },{ key:"pass",label:"Password",ph:"••••••",type:"password" }] },
//   { id: "mongodb", label: "MongoDB",       icon: "mongo",    color: "#47a248", desc: "Connect to a MongoDB collection",
//     fields: [{ key:"uri",label:"Connection URI",ph:"mongodb://localhost:27017/mydb" },{ key:"col",label:"Collection",ph:"users" }] },
//   { id: "sqlite",  label: "SQLite",        icon: "database", color: "#6366f1", desc: "Upload or connect a SQLite database",     fields: [],                                     upload: true },
//   { id: "api",     label: "REST API",      icon: "api",      color: "#8b5cf6", desc: "Fetch and query JSON from any REST API",
//     fields: [{ key:"url",label:"Endpoint URL",ph:"https://api.example.com/data" },{ key:"key",label:"API Key (optional)",ph:"Bearer ..." }] },
//   { id: "bigquery",label: "BigQuery",      icon: "database", color: "#4285f4", desc: "Query Google BigQuery tables",
//     fields: [{ key:"proj",label:"Project ID",ph:"my-project" },{ key:"ds",label:"Dataset",ph:"my_dataset" },{ key:"tbl",label:"Table",ph:"my_table" }] },
// ];

// const SAMPLE_QUERIES = {
//   excel:    ["Show first 20 rows", "Count rows by Category", "Top 10 by Revenue descending", "Show rows where Status is Active"],
//   pdf:      ["Extract all tables", "Show text from page 1", "Find rows mentioning 'total'"],
//   postgres: ["SELECT * FROM users LIMIT 20", "SELECT COUNT(*) FROM orders WHERE status='pending'", "SELECT name, SUM(amount) FROM sales GROUP BY name"],
//   mysql:    ["SELECT * FROM customers LIMIT 20", "SHOW TABLES", "DESCRIBE orders"],
//   mongodb:  ['db.collection.find({}).limit(20)', 'db.collection.aggregate([{$group:{_id:"$category",count:{$sum:1}}}])', 'db.collection.find({status:"active"})'],
//   sqlite:   ["SELECT * FROM main LIMIT 20", "SELECT name FROM sqlite_master WHERE type='table'"],
//   api:      ["Fetch all records", "Filter where status = active", "Show records created this month"],
//   bigquery: ["SELECT * FROM dataset.table LIMIT 100", "SELECT COUNT(*) as total FROM dataset.table"],
// };

// // ─── MOCK DATA GENERATOR ──────────────────────────────────────────────────────
// function generateMockData(sourceType, query = "") {
//   const datasets = {
//     excel: {
//       columns: ["ID","Product","Category","Revenue","Units","Region","Status","Date"],
//       rows: Array.from({length:42},(_,i)=>({
//         ID:1001+i, Product:["Laptop Pro","Wireless Mouse","USB Hub","Monitor 4K","Keyboard","Webcam","Headphones","SSD 1TB","RAM 16GB","Desk Lamp"][i%10],
//         Category:["Electronics","Peripherals","Storage","Accessories"][i%4],
//         Revenue:(Math.random()*5000+200).toFixed(2), Units:Math.floor(Math.random()*200+1),
//         Region:["North","South","East","West"][i%4], Status:i%5===0?"Inactive":"Active",
//         Date:`2024-0${(i%9)+1}-${String((i%28)+1).padStart(2,"0")}`
//       }))
//     },
//     postgres: {
//       columns:["user_id","name","email","role","created_at","last_login","plan"],
//       rows:Array.from({length:35},(_,i)=>({
//         user_id:i+1, name:["Alice Chen","Bob Martinez","Carol White","David Kim","Emma Davis"][i%5]+" "+(i+1),
//         email:`user${i+1}@example.com`, role:["admin","user","editor","viewer"][i%4],
//         created_at:`2024-0${(i%9)+1}-${String((i%28)+1).padStart(2,"0")}`,
//         last_login:`2024-12-${String((i%28)+1).padStart(2,"0")}`, plan:["free","pro","enterprise"][i%3]
//       }))
//     },
//     mongodb: {
//       columns:["_id","name","status","tags","score","created"],
//       rows:Array.from({length:28},(_,i)=>({
//         _id:`507f1f77bcf86cd79943901${i}`, name:`Document ${i+1}`,
//         status:["published","draft","archived"][i%3], tags:["tag1","tag2"].join(", "),
//         score:(Math.random()*100).toFixed(1), created:`2024-12-${String((i%28)+1).padStart(2,"0")}`
//       }))
//     },
//     api: {
//       columns:["id","userId","title","completed","priority"],
//       rows:Array.from({length:30},(_,i)=>({
//         id:i+1, userId:Math.floor(i/3)+1,
//         title:["Fix login bug","Update dashboard","Write tests","Deploy v2","Review PR","Update docs"][i%6]+" "+(i+1),
//         completed:i%3===0?"true":"false", priority:["high","medium","low"][i%3]
//       }))
//     },
//     pdf: {
//       columns:["Page","Section","Content","Type"],
//       rows:Array.from({length:20},(_,i)=>({
//         Page:Math.floor(i/4)+1, Section:["Header","Table","Paragraph","Footer","List"][i%5],
//         Content:`Extracted content from section ${i+1}. This is sample text from the PDF document.`,
//         Type:["text","table","image","metadata"][i%4]
//       }))
//     },
//   };
//   return datasets[sourceType] || datasets.excel;
// }

// // ─── CSS-IN-JS HELPERS ────────────────────────────────────────────────────────
// const css = (strings, ...vals) => strings.reduce((a,s,i)=>a+s+(vals[i]??''),'');

// // ─── MAIN APP ─────────────────────────────────────────────────────────────────
// export default function DataQuery() {
//   const [connections, setConnections] = useState([
//     { id:"conn_1", name:"Sales DB", type:"postgres", color:"#336791", status:"connected", tables:["orders","customers","products"] },
//     { id:"conn_2", name:"analytics.xlsx", type:"excel", color:"#10b981", status:"connected", tables:["Sheet1"] },
//   ]);
//   const [activeConn, setActiveConn] = useState("conn_1");
//   const [tabs, setTabs] = useState([
//     { id:"tab_1", title:"Query 1", connId:"conn_1", query:"SELECT * FROM customers LIMIT 20", results:null, ran:false }
//   ]);
//   const [activeTab, setActiveTab] = useState("tab_1");
//   const [showAddSource, setShowAddSource] = useState(false);
//   const [selectedSourceType, setSelectedSourceType] = useState(null);
//   const [sideSection, setSideSection] = useState("explorer"); // explorer | history
//   const [queryHistory, setQueryHistory] = useState([
//     {id:1, query:"SELECT COUNT(*) FROM orders", time:"2m ago", rows:1, conn:"Sales DB"},
//     {id:2, query:"Show top 10 products by revenue", time:"15m ago", rows:10, conn:"analytics.xlsx"},
//     {id:3, query:"SELECT * FROM customers WHERE plan='pro'", time:"1h ago", rows:47, conn:"Sales DB"},
//   ]);
//   const [running, setRunning] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [schemaOpen, setSchemaOpen] = useState({});
//   const [connForm, setConnForm] = useState({});
//   const [dragOver, setDragOver] = useState(false);
//   const [aiMode, setAiMode] = useState(true);
//   const editorRef = useRef(null);

//   const currentTab = tabs.find(t => t.id === activeTab);
//   const currentConn = connections.find(c => c.id === activeConn);

//   function showToast(msg, type="success") {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3000);
//   }

//   function runQuery() {
//     if (!currentTab?.query?.trim()) { showToast("Write a query first", "warning"); return; }
//     setRunning(true);
//     setTimeout(() => {
//       const data = generateMockData(currentConn?.type || "excel", currentTab.query);
//       setTabs(ts => ts.map(t => t.id===activeTab
//         ? {...t, results:data, ran:true, title: currentTab.query.slice(0,22)+(currentTab.query.length>22?"…":"")}
//         : t));
//       setQueryHistory(h => [{
//         id: Date.now(), query: currentTab.query,
//         time: "just now", rows: data.rows.length, conn: currentConn?.name||"—"
//       }, ...h.slice(0,19)]);
//       setRunning(false);
//       showToast(`${data.rows.length} rows returned`);
//     }, 900 + Math.random()*600);
//   }

//   function addTab() {
//     const id = "tab_"+Date.now();
//     setTabs(ts => [...ts, { id, title:"New query", connId:activeConn, query:"", results:null, ran:false }]);
//     setActiveTab(id);
//   }

//   function closeTab(id, e) {
//     e.stopPropagation();
//     if (tabs.length === 1) return;
//     const idx = tabs.findIndex(t=>t.id===id);
//     const next = tabs[idx===0?1:idx-1]?.id;
//     setTabs(ts => ts.filter(t=>t.id!==id));
//     if (activeTab===id) setActiveTab(next);
//   }

//   function updateQuery(val) {
//     setTabs(ts => ts.map(t => t.id===activeTab ? {...t, query:val} : t));
//   }

//   function addConnection(type, formData) {
//     const src = SOURCE_TYPES.find(s=>s.id===type);
//     const id = "conn_"+Date.now();
//     const name = formData?.host ? `${formData.db||type}@${formData.host}` :
//                  formData?.url  ? new URL(formData.url.startsWith("http")?formData.url:"https://"+formData.url).hostname :
//                  formData?.uri  ? "MongoDB" : "New source";
//     setConnections(cs => [...cs, {id, name, type, color:src?.color||T.accent, status:"connected", tables:["table1","table2"]}]);
//     setActiveConn(id);
//     setShowAddSource(false);
//     setSelectedSourceType(null);
//     setConnForm({});
//     showToast(`Connected to ${name}`);
//   }

//   function insertSampleQuery(q) {
//     setTabs(ts => ts.map(t => t.id===activeTab ? {...t, query:q} : t));
//     editorRef.current?.focus();
//   }

//   function copyQuery() {
//     navigator.clipboard.writeText(currentTab?.query||"").then(()=>showToast("Copied!"));
//   }

//   // keyboard shortcut
//   useEffect(() => {
//     const h = e => { if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();runQuery()} };
//     window.addEventListener("keydown",h);
//     return ()=>window.removeEventListener("keydown",h);
//   });

//   const dtypeColor = (v) => {
//     if(v===null||v===undefined||v==="") return T.text3;
//     if(v==="true"||v==="false") return "#a78bfa";
//     if(!isNaN(Number(v))&&v!=="") return "#34d399";
//     return T.text;
//   };

//   return (
//     <div style={{display:"flex",height:"100vh",overflow:"hidden",background:T.bg,fontFamily:T.sans,fontSize:13,color:T.text}}>
//       <style>{`
//         *{box-sizing:border-box;margin:0;padding:0}
//         ::-webkit-scrollbar{width:5px;height:5px}
//         ::-webkit-scrollbar-track{background:transparent}
//         ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:6px}
//         ::-webkit-scrollbar-thumb:hover{background:${T.text3}}
//         input,select,textarea{font-family:${T.sans};font-size:13px;color:${T.text};outline:none}
//         input::placeholder,textarea::placeholder{color:${T.text3}}
//         button{cursor:pointer;font-family:${T.sans}}
//         @keyframes spin{to{transform:rotate(360deg)}}
//         @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
//         @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
//         @keyframes shimmer{0%{background-position:-200%}100%{background-position:200%}}
//         .row-hover:hover{background:${T.card2}!important}
//         .tab-item:hover{background:${T.card}!important}
//         .conn-item:hover{background:${T.card2}!important}
//         .tree-item:hover{background:${T.card}!important}
//         .chip-btn:hover{background:${T.accentLo}!important;border-color:${T.accent}!important;color:${T.accent}!important}
//         .src-card:hover{border-color:${T.accent}!important;background:${T.card}!important}
//         .icon-btn:hover{background:${T.card2}!important}
//       `}</style>

//       {/* ══════════════════════ LEFT SIDEBAR ══════════════════════ */}
//       <div style={{width:240,background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>

//         {/* Logo */}
//         <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
//           <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${T.accent},#8b5cf6)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
//             <Icon d={Icons.bolt} size={14} color="#fff" />
//           </div>
//           <span style={{fontWeight:700,fontSize:14,letterSpacing:"-.3px"}}>DataQuery</span>
//           <div style={{flex:1}}/>
//           <button className="icon-btn" onClick={()=>setShowAddSource(true)} style={{width:24,height:24,borderRadius:5,background:"transparent",border:"none",display:"flex",alignItems:"center",justifyContent:"center",color:T.text2}} title="Add source">
//             <Icon d={Icons.plus} size={14}/>
//           </button>
//         </div>

//         {/* Section tabs */}
//         <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
//           {["explorer","history"].map(s=>(
//             <button key={s} onClick={()=>setSideSection(s)} style={{flex:1,padding:"8px 4px",background:"transparent",border:"none",borderBottom:sideSection===s?`2px solid ${T.accent}`:"2px solid transparent",color:sideSection===s?T.accent:T.text3,fontSize:11,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",transition:"all .15s"}}>
//               {s}
//             </button>
//           ))}
//         </div>

//         {sideSection==="explorer" ? (
//           <div style={{flex:1,overflow:"auto",padding:"8px 6px"}}>

//             {/* Connections */}
//             {connections.map(conn => {
//               const src = SOURCE_TYPES.find(s=>s.id===conn.type);
//               const isActive = conn.id===activeConn;
//               const isOpen = schemaOpen[conn.id];
//               return (
//                 <div key={conn.id}>
//                   <div className="conn-item" onClick={()=>{setActiveConn(conn.id);setSchemaOpen(p=>({...p,[conn.id]:!p[conn.id]}))}}
//                     style={{display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:7,cursor:"pointer",background:isActive?T.accentLo:"transparent",marginBottom:1}}>
//                     <div style={{width:20,height:20,borderRadius:5,background:conn.color+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
//                       <Icon d={Icons[src?.icon||"database"]} size={11} color={conn.color}/>
//                     </div>
//                     <div style={{flex:1,minWidth:0}}>
//                       <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:isActive?T.text:T.text2}}>{conn.name}</div>
//                       <div style={{fontSize:10,color:T.text3,textTransform:"uppercase",letterSpacing:".05em"}}>{conn.type}</div>
//                     </div>
//                     <div style={{width:6,height:6,borderRadius:"50%",background:T.green,flexShrink:0}}/>
//                     <Icon d={Icons[isOpen?"chevronD":"chevronR"]} size={11} color={T.text3}/>
//                   </div>

//                   {/* Schema tree */}
//                   {isOpen && (
//                     <div style={{paddingLeft:12,paddingBottom:4}}>
//                       {(conn.tables||[]).map(tbl=>(
//                         <div key={tbl} className="tree-item" onClick={()=>insertSampleQuery(conn.type==="postgres"||conn.type==="mysql"||conn.type==="sqlite"?`SELECT * FROM ${tbl} LIMIT 50`:conn.type==="mongodb"?`db.${tbl}.find({}).limit(50)`:`Show all rows from ${tbl}`)}
//                           style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:5,cursor:"pointer",marginBottom:1}}>
//                           <Icon d={Icons.table} size={11} color={T.text3}/>
//                           <span style={{fontSize:11,color:T.text2,fontFamily:T.mono}}>{tbl}</span>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               );
//             })}

//             {/* Add source button */}
//             <button onClick={()=>setShowAddSource(true)} style={{width:"100%",padding:"7px 8px",background:"transparent",border:`1.5px dashed ${T.border2}`,borderRadius:7,color:T.text3,fontSize:12,display:"flex",alignItems:"center",gap:6,marginTop:6,transition:"all .15s"}}
//               onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent}}
//               onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border2;e.currentTarget.style.color=T.text3}}>
//               <Icon d={Icons.plus} size={13}/> Add data source
//             </button>
//           </div>
//         ) : (
//           /* History panel */
//           <div style={{flex:1,overflow:"auto",padding:"8px 6px"}}>
//             {queryHistory.length===0 ? (
//               <div style={{textAlign:"center",padding:"24px 12px",color:T.text3,fontSize:12}}>No queries yet.</div>
//             ) : queryHistory.map(h=>(
//               <div key={h.id} className="conn-item" onClick={()=>insertSampleQuery(h.query)}
//                 style={{padding:"7px 10px",borderRadius:7,marginBottom:4,cursor:"pointer",border:`1px solid transparent`,transition:"all .12s"}}>
//                 <div style={{fontSize:12,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3,fontFamily:T.mono}}>{h.query}</div>
//                 <div style={{display:"flex",gap:10,fontSize:10,color:T.text3}}>
//                   <span>{h.time}</span>
//                   <span style={{color:T.green}}>{h.rows} rows</span>
//                   <span>{h.conn}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ══════════════════════ MAIN AREA ══════════════════════ */}
//       <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

//         {/* ── TABS BAR ── */}
//         <div style={{display:"flex",alignItems:"center",background:T.surface,borderBottom:`1px solid ${T.border}`,height:38,flexShrink:0,overflow:"hidden"}}>
//           <div style={{display:"flex",flex:1,overflow:"auto",height:"100%"}}>
//             {tabs.map(tab=>{
//               const conn = connections.find(c=>c.id===tab.connId);
//               const src = SOURCE_TYPES.find(s=>s.id===conn?.type);
//               const isActive = tab.id===activeTab;
//               return (
//                 <div key={tab.id} className="tab-item" onClick={()=>setActiveTab(tab.id)}
//                   style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",height:"100%",borderRight:`1px solid ${T.border}`,cursor:"pointer",background:isActive?T.panel:"transparent",borderBottom:isActive?`2px solid ${T.accent}`:"2px solid transparent",flexShrink:0,maxWidth:180,position:"relative",top:1}}>
//                   {conn && <div style={{width:8,height:8,borderRadius:2,background:conn.color,flexShrink:0}}/>}
//                   <span style={{fontSize:12,color:isActive?T.text:T.text2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:T.mono}}>{tab.title}</span>
//                   {tabs.length>1&&<button onClick={e=>closeTab(tab.id,e)} style={{background:"transparent",border:"none",color:T.text3,padding:"0 2px",display:"flex",lineHeight:1,marginLeft:2}} onMouseEnter={e=>e.currentTarget.style.color=T.red} onMouseLeave={e=>e.currentTarget.style.color=T.text3}>
//                     <Icon d={Icons.close} size={11}/>
//                   </button>}
//                 </div>
//               );
//             })}
//           </div>
//           <button onClick={addTab} className="icon-btn" style={{padding:"0 12px",height:"100%",background:"transparent",border:"none",borderLeft:`1px solid ${T.border}`,color:T.text3,display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
//             <Icon d={Icons.plus} size={13}/><span style={{fontSize:11}}>New</span>
//           </button>
//         </div>

//         {/* ── TOOLBAR ── */}
//         <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",background:T.panel,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
//           {/* Connection selector */}
//           <select value={activeConn} onChange={e=>{setActiveConn(e.target.value);setTabs(ts=>ts.map(t=>t.id===activeTab?{...t,connId:e.target.value}:t))}}
//             style={{background:T.card,border:`1px solid ${T.border2}`,borderRadius:6,padding:"5px 10px",color:T.text,fontSize:12,outline:"none",maxWidth:160}}>
//             {connections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
//           </select>

//           {/* AI toggle */}
//           <button onClick={()=>setAiMode(m=>!m)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,border:`1px solid ${aiMode?T.accent:T.border2}`,background:aiMode?T.accentLo:T.card,color:aiMode?T.accent:T.text2,fontSize:12,fontWeight:500,transition:"all .15s"}}>
//             <Icon d={Icons.aiSpark} size={13} color={aiMode?T.accent:T.text3}/>
//             {aiMode?"AI mode":"SQL mode"}
//           </button>

//           <div style={{flex:1}}/>

//           {/* Sample queries */}
//           <div style={{display:"flex",gap:4,overflow:"hidden"}}>
//             {(SAMPLE_QUERIES[currentConn?.type]||SAMPLE_QUERIES.excel).slice(0,2).map((q,i)=>(
//               <button key={i} className="chip-btn" onClick={()=>insertSampleQuery(q)}
//                 style={{padding:"4px 9px",borderRadius:5,border:`1px solid ${T.border2}`,background:T.card,color:T.text3,fontSize:11,whiteSpace:"nowrap",transition:"all .12s"}}>
//                 {q.length>24?q.slice(0,24)+"…":q}
//               </button>
//             ))}
//           </div>

//           <button onClick={copyQuery} className="icon-btn" title="Copy query" style={{padding:"5px 8px",background:T.card,border:`1px solid ${T.border2}`,borderRadius:6,color:T.text2,display:"flex",alignItems:"center",gap:4,fontSize:11}}>
//             <Icon d={Icons.copy} size={13}/>
//           </button>
//           <button onClick={()=>showToast("Settings coming soon","warning")} className="icon-btn" style={{padding:"5px 8px",background:T.card,border:`1px solid ${T.border2}`,borderRadius:6,color:T.text2,display:"flex"}}>
//             <Icon d={Icons.settings} size={13}/>
//           </button>
//         </div>

//         {/* ── EDITOR + RESULTS ── */}
//         <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

//           {/* Query editor */}
//           <div style={{background:T.panel,borderBottom:`1px solid ${T.border}`,flexShrink:0,position:"relative"}}>
//             {/* Editor header */}
//             <div style={{display:"flex",alignItems:"center",padding:"6px 14px 0",gap:8}}>
//               <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.text3}}>
//                 {aiMode?"Ask in plain English":"SQL Editor"}
//               </span>
//               {aiMode&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:3,background:T.accentLo,color:T.accent,border:`1px solid ${T.accentGl}`}}>AI</span>}
//               <div style={{flex:1}}/>
//               <span style={{fontSize:10,color:T.text3}}>⌘↵ to run</span>
//             </div>

//             <div style={{display:"flex",alignItems:"flex-end",gap:0}}>
//               {/* Line numbers */}
//               <div style={{padding:"8px 0 8px 10px",fontFamily:T.mono,fontSize:12,lineHeight:"20px",color:T.text3,userSelect:"none",minWidth:32,textAlign:"right",flexShrink:0}}>
//                 {(currentTab?.query||"").split("\n").map((_,i)=><div key={i}>{i+1}</div>)}
//                 {(currentTab?.query||"").split("\n").length===0&&<div>1</div>}
//               </div>

//               <textarea ref={editorRef} value={currentTab?.query||""} onChange={e=>updateQuery(e.target.value)}
//                 onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();runQuery()}}}
//                 placeholder={aiMode?"e.g.  Show me top 10 customers by total order value in the last 30 days…":"SELECT * FROM table LIMIT 20"}
//                 style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"8px 14px 12px 8px",fontFamily:aiMode?T.sans:T.mono,fontSize:aiMode?13.5:13,lineHeight:"20px",resize:"none",minHeight:72,maxHeight:180,color:T.text,caretColor:T.accent}}
//               />

//               <div style={{padding:"8px 12px 12px",flexShrink:0,display:"flex",alignItems:"flex-end",gap:6}}>
//                 <button onClick={runQuery} disabled={running} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:7,border:"none",background:running?"#2d3748":`linear-gradient(135deg,${T.accent},#8b5cf6)`,color:"#fff",fontWeight:600,fontSize:13,transition:"all .15s",opacity:running?.7:1}}>
//                   {running
//                     ? <div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
//                     : <Icon d={Icons.run} size={13} color="#fff"/>}
//                   {running?"Running…":"Run"}
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Results area */}
//           <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
//             {!currentTab?.ran ? (
//               <EmptyState aiMode={aiMode} onSample={insertSampleQuery} sourceType={currentConn?.type}/>
//             ) : (
//               <ResultsPanel data={currentTab.results} T={T} dtypeColor={dtypeColor} showToast={showToast}/>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ══════════════════════ ADD SOURCE MODAL ══════════════════════ */}
//       {showAddSource && (
//         <AddSourceModal
//           selectedType={selectedSourceType}
//           onSelectType={setSelectedSourceType}
//           onClose={()=>{setShowAddSource(false);setSelectedSourceType(null);setConnForm({})}}
//           onConnect={addConnection}
//           connForm={connForm}
//           setConnForm={setConnForm}
//           dragOver={dragOver}
//           setDragOver={setDragOver}
//           T={T}
//         />
//       )}

//       {/* ══════════════════════ TOAST ══════════════════════ */}
//       {toast && (
//         <div style={{position:"fixed",bottom:20,right:20,display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:9,background:T.card2,border:`1px solid ${toast.type==="success"?T.green:toast.type==="error"?T.red:T.yellow}`,color:T.text,fontSize:13,boxShadow:"0 8px 32px rgba(0,0,0,.5)",animation:"fadeUp .2s ease",zIndex:9999,maxWidth:320}}>
//           <span style={{fontSize:15}}>{toast.type==="success"?"✓":toast.type==="error"?"✕":"⚠"}</span>
//           {toast.msg}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── EMPTY STATE ─────────────────────────────────────────────────────────────
// function EmptyState({ aiMode, onSample, sourceType }) {
//   const T2 = T;
//   const samples = SAMPLE_QUERIES[sourceType||"excel"] || SAMPLE_QUERIES.excel;
//   return (
//     <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:20,background:T2.bg}}>
//       <div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${T2.accentLo},rgba(139,92,246,.12))`,border:`1px solid ${T2.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
//         <Icon d={aiMode?Icons.aiSpark:Icons.database} size={24} color={T2.accent}/>
//       </div>
//       <div style={{textAlign:"center",maxWidth:360}}>
//         <div style={{fontSize:16,fontWeight:600,marginBottom:6}}>{aiMode?"Ask anything about your data":"Write a query to get started"}</div>
//         <div style={{fontSize:13,color:T2.text2,lineHeight:1.65}}>{aiMode?"Describe what you want in plain English — the AI translates it to a query automatically.":"Use the editor above to write SQL, NoSQL, or any query supported by your data source."}</div>
//       </div>
//       <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center",maxWidth:480}}>
//         {samples.map((q,i)=>(
//           <button key={i} onClick={()=>onSample(q)}
//             style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${T2.border2}`,background:T2.card,color:T2.text2,fontSize:12,cursor:"pointer",transition:"all .12s",textAlign:"left"}}
//             onMouseEnter={e=>{e.currentTarget.style.borderColor=T2.accent;e.currentTarget.style.color=T2.accent;e.currentTarget.style.background=T2.accentLo}}
//             onMouseLeave={e=>{e.currentTarget.style.borderColor=T2.border2;e.currentTarget.style.color=T2.text2;e.currentTarget.style.background=T2.card}}>
//             {q}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── RESULTS PANEL ───────────────────────────────────────────────────────────
// function ResultsPanel({ data, T: T2, dtypeColor, showToast }) {
//   const [page, setPage] = useState(1);
//   const [search, setSearch] = useState("");
//   const [sortCol, setSortCol] = useState(null);
//   const [sortDir, setSortDir] = useState(1);
//   const pageSize = 50;

//   if (!data) return null;

//   let rows = data.rows;
//   if (search) rows = rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(search.toLowerCase())));
//   if (sortCol) rows = [...rows].sort((a,b)=>{const av=a[sortCol],bv=b[sortCol];return sortDir*(av>bv?1:av<bv?-1:0)});

//   const totalPages = Math.ceil(rows.length/pageSize);
//   const pageRows = rows.slice((page-1)*pageSize, page*pageSize);

//   function toggleSort(col) {
//     if(sortCol===col) setSortDir(d=>d*-1);
//     else { setSortCol(col); setSortDir(1); }
//   }

//   function exportCSV() {
//     const csv = [data.columns.join(","), ...rows.map(r=>data.columns.map(c=>JSON.stringify(r[c]??"")).join(","))].join("\n");
//     const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="results.csv";a.click();
//     showToast("Downloaded results.csv");
//   }
//   function exportJSON() {
//     const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(rows,null,2)],{type:"application/json"}));a.download="results.json";a.click();
//     showToast("Downloaded results.json");
//   }

//   return (
//     <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:T2.bg,animation:"fadeUp .2s ease"}}>
//       {/* Results toolbar */}
//       <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:T2.panel,borderBottom:`1px solid ${T2.border}`,flexShrink:0}}>
//         <Icon d={Icons.table2} size={14} color={T2.green}/>
//         <span style={{fontSize:12,fontWeight:600,color:T2.text2}}>Results</span>
//         <span style={{fontFamily:T2.mono,fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(16,185,129,.1)",color:T2.green,border:"1px solid rgba(16,185,129,.25)"}}>{rows.length} rows</span>
//         <span style={{fontFamily:T2.mono,fontSize:11,color:T2.text3}}>{data.columns.length} cols</span>
//         <div style={{flex:1}}/>
//         {/* Search */}
//         <div style={{display:"flex",alignItems:"center",gap:6,background:T2.card,border:`1px solid ${T2.border2}`,borderRadius:6,padding:"4px 8px"}}>
//           <Icon d={Icons.search} size={12} size={12} color={T2.text3}/>
//           <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Filter results…" style={{background:"transparent",border:"none",width:140,color:T2.text,fontSize:12}}/>
//         </div>
//         <button onClick={exportCSV} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,border:`1px solid ${T2.border2}`,background:T2.card,color:T2.text2,fontSize:11,fontWeight:500}}
//           onMouseEnter={e=>e.currentTarget.style.borderColor=T2.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T2.border2}>
//           <Icon d={Icons.download} size={12}/> CSV
//         </button>
//         <button onClick={exportJSON} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,border:`1px solid ${T2.border2}`,background:T2.card,color:T2.text2,fontSize:11,fontWeight:500}}
//           onMouseEnter={e=>e.currentTarget.style.borderColor=T2.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T2.border2}>
//           <Icon d={Icons.download} size={12}/> JSON
//         </button>
//       </div>

//       {/* Table */}
//       <div style={{flex:1,overflow:"auto"}}>
//         <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
//           <thead>
//             <tr style={{background:T2.panel,position:"sticky",top:0,zIndex:2}}>
//               <th style={{padding:"8px 10px",textAlign:"left",borderBottom:`2px solid ${T2.border}`,color:T2.text3,fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",width:40,fontFamily:T2.mono}}>#</th>
//               {data.columns.map(col=>(
//                 <th key={col} onClick={()=>toggleSort(col)} style={{padding:"8px 14px",textAlign:"left",borderBottom:`2px solid ${T2.border}`,color:sortCol===col?T2.accent:T2.text3,fontSize:10,fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap",userSelect:"none",transition:"color .12s"}}>
//                   {col} {sortCol===col?(sortDir===1?"↑":"↓"):<span style={{opacity:.3}}>↕</span>}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {pageRows.map((row,ri)=>(
//               <tr key={ri} className="row-hover" style={{background:(page-1)*pageSize+ri%2===0?T2.bg:"rgba(255,255,255,.012)",transition:"background .08s"}}>
//                 <td style={{padding:"6px 10px",borderBottom:`1px solid ${T2.border}`,color:T2.text3,fontFamily:T2.mono,fontSize:11}}>{(page-1)*pageSize+ri+1}</td>
//                 {data.columns.map(col=>{
//                   const v = row[col];
//                   const isEmpty = v===null||v===undefined||v==="";
//                   return (
//                     <td key={col} style={{padding:"6px 14px",borderBottom:`1px solid ${T2.border}`,color:isEmpty?T2.text3:dtypeColor(String(v)),fontFamily:(!isNaN(Number(v))&&v!=="")||v==="true"||v==="false"?T2.mono:T2.sans,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:12.5}}
//                       title={String(v??"")}>
//                       {isEmpty?"—":String(v)}
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       {totalPages>1&&(
//         <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:T2.panel,borderTop:`1px solid ${T2.border}`,flexShrink:0}}>
//           <span style={{fontFamily:T2.mono,fontSize:11,color:T2.text3,flex:1}}>{(page-1)*pageSize+1}–{Math.min(page*pageSize,rows.length)} of {rows.length.toLocaleString()}</span>
//           <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${T2.border2}`,background:T2.card,color:page===1?T2.text3:T2.text2,fontSize:12,opacity:page===1?.4:1}}>‹ Prev</button>
//           <span style={{fontFamily:T2.mono,fontSize:11,color:T2.text2}}>{page} / {totalPages}</span>
//           <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${T2.border2}`,background:T2.card,color:page===totalPages?T2.text3:T2.text2,fontSize:12,opacity:page===totalPages?.4:1}}>Next ›</button>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── ADD SOURCE MODAL ─────────────────────────────────────────────────────────
// function AddSourceModal({ selectedType, onSelectType, onClose, onConnect, connForm, setConnForm, dragOver, setDragOver, T: T2 }) {
//   const src = SOURCE_TYPES.find(s=>s.id===selectedType);

//   return (
//     <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,animation:"fadeUp .15s ease"}}
//       onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
//       <div style={{background:T2.panel,border:`1px solid ${T2.border}`,borderRadius:14,width:640,maxHeight:"85vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,.7)"}}>

//         {/* Modal header */}
//         <div style={{display:"flex",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${T2.border}`}}>
//           {selectedType && <button onClick={()=>onSelectType(null)} style={{background:"transparent",border:"none",color:T2.text3,marginRight:8,display:"flex"}}><Icon d={Icons.chevronR} size={16}/></button>}
//           <div>
//             <div style={{fontSize:15,fontWeight:700}}>{selectedType?`Connect ${src?.label}`:"Add data source"}</div>
//             <div style={{fontSize:12,color:T2.text2,marginTop:1}}>{selectedType?src?.desc:"Choose a source to connect"}</div>
//           </div>
//           <div style={{flex:1}}/>
//           <button onClick={onClose} style={{background:T2.card,border:`1px solid ${T2.border2}`,borderRadius:6,color:T2.text2,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
//             <Icon d={Icons.close} size={14}/>
//           </button>
//         </div>

//         <div style={{overflow:"auto",padding:20}}>
//           {!selectedType ? (
//             /* Source picker grid */
//             <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
//               {SOURCE_TYPES.map(s=>(
//                 <button key={s.id} className="src-card" onClick={()=>onSelectType(s.id)}
//                   style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:T2.card,border:`1px solid ${T2.border}`,borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
//                   <div style={{width:36,height:36,borderRadius:9,background:s.color+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${s.color}33`}}>
//                     <Icon d={Icons[s.icon||"database"]} size={17} color={s.color}/>
//                   </div>
//                   <div>
//                     <div style={{fontSize:13,fontWeight:600,color:T2.text,marginBottom:2}}>{s.label}</div>
//                     <div style={{fontSize:11,color:T2.text3,lineHeight:1.4}}>{s.desc}</div>
//                   </div>
//                   <Icon d={Icons.chevronR} size={14} color={T2.text3} style={{marginLeft:"auto",flexShrink:0}}/>
//                 </button>
//               ))}
//             </div>
//           ) : src?.upload ? (
//             /* Upload zone */
//             <div>
//               <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
//                 onDrop={e=>{e.preventDefault();setDragOver(false);onConnect(selectedType,{file:e.dataTransfer.files[0]?.name||"file"})}}
//                 style={{border:`2px dashed ${dragOver?T2.accent:T2.border2}`,borderRadius:10,padding:"40px 20px",textAlign:"center",cursor:"pointer",background:dragOver?T2.accentLo:"transparent",transition:"all .2s"}}>
//                 <div style={{fontSize:32,marginBottom:10}}>📂</div>
//                 <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Drop your file here</div>
//                 <div style={{fontSize:12,color:T2.text2,marginBottom:16}}>{selectedType==="excel"?".xls, .xlsx, .csv files":selectedType==="pdf"?".pdf files":selectedType==="sqlite"?".db, .sqlite files":"Any compatible file"}</div>
//                 <button onClick={()=>onConnect(selectedType,{file:"sample_file"})} style={{padding:"8px 20px",borderRadius:7,border:"none",background:`linear-gradient(135deg,${T2.accent},#8b5cf6)`,color:"#fff",fontWeight:600,fontSize:13}}>
//                   Browse files
//                 </button>
//               </div>
//               <div style={{marginTop:12,textAlign:"center"}}>
//                 <button onClick={()=>onConnect(selectedType,{file:"demo_data"})} style={{background:"transparent",border:"none",color:T2.text3,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>
//                   or use sample data to try it out →
//                 </button>
//               </div>
//             </div>
//           ) : (
//             /* Connection form */
//             <div style={{display:"flex",flexDirection:"column",gap:12}}>
//               {(src?.fields||[]).map(f=>(
//                 <div key={f.key}>
//                   <label style={{display:"block",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",color:T2.text3,marginBottom:5}}>{f.label}</label>
//                   <input type={f.type||"text"} placeholder={f.ph} value={connForm[f.key]||""}
//                     onChange={e=>setConnForm(p=>({...p,[f.key]:e.target.value}))}
//                     style={{width:"100%",padding:"9px 12px",background:T2.card,border:`1px solid ${T2.border2}`,borderRadius:7,color:T2.text,fontSize:13,outline:"none",transition:"border-color .15s"}}
//                     onFocus={e=>e.currentTarget.style.borderColor=T2.accent}
//                     onBlur={e=>e.currentTarget.style.borderColor=T2.border2}/>
//                 </div>
//               ))}
//               <div style={{display:"flex",gap:8,marginTop:4}}>
//                 <button onClick={()=>onConnect(selectedType,connForm)} style={{flex:1,padding:"10px",borderRadius:7,border:"none",background:`linear-gradient(135deg,${T2.accent},#8b5cf6)`,color:"#fff",fontWeight:600,fontSize:13}}>
//                   Connect
//                 </button>
//                 <button onClick={()=>onConnect(selectedType,{host:"demo",db:"demo",user:"demo"})} style={{padding:"10px 16px",borderRadius:7,border:`1px solid ${T2.border2}`,background:T2.card,color:T2.text2,fontWeight:500,fontSize:12}}>
//                   Test connection
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// src/DataQuery.jsx  —  Full backend-connected version
// All mock data, setTimeout fakes, and generateMockData removed.
// Every action hits the FastAPI backend at http://localhost:8000

import { useState, useRef, useEffect, useCallback } from "react";
import * as api from "./services/api";

// ─── ICONS ───────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", stroke = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={stroke ? "none" : color}
    stroke={stroke ? color : "none"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  database: "M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5z M2 7c0 2.76 4.48 5 10 5s10-2.24 10-5 M2 12c0 2.76 4.48 5 10 5s10-2.24 10-5",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  table:    "M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18 M15 3v18",
  mongo:    "M12 2C6 2 4 7 4 12c0 4 2 7 8 9 6-2 8-5 8-9 0-5-2-10-8-10z",
  api:      "M4 6h16M4 12h16M4 18h7 M14 18l3 3 5-5",
  plus:     "M12 5v14 M5 12h14",
  search:   "M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  run:      "M5 3l14 9-14 9V3z",
  close:    "M18 6L6 18 M6 6l12 12",
  copy:     "M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 2v6h6 M8 12h8 M8 16h6",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  history:  "M12 8v4l3 3 M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  bolt:     "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  upload:   "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  chevronR: "M9 18l6-6-6-6",
  chevronD: "M6 9l6 6 6-6",
  aiSpark:  "M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z",
  table2:   "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M8 12h8 M8 16h5 M16 5l2 2 4-4",
  trash:    "M3 6h18 M19 6l-1 14H6L5 6 M8 6V4h8v2",
  refresh:  "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
};

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg:       "#060912",
  surface:  "#0d1117",
  panel:    "#111827",
  card:     "#161f2e",
  card2:    "#1a253b",
  border:   "#1e2d45",
  border2:  "#253550",
  accent:   "#6366f1",
  accentLo: "rgba(99,102,241,0.12)",
  accentGl: "rgba(99,102,241,0.25)",
  green:    "#10b981",
  yellow:   "#f59e0b",
  red:      "#ef4444",
  text:     "#e2e8f0",
  text2:    "#94a3b8",
  text3:    "#475569",
  mono:     "'JetBrains Mono','Fira Code',monospace",
  sans:     "'Inter',system-ui,sans-serif",
};

// ─── SOURCE TYPE METADATA ─────────────────────────────────────────────────────
const SOURCE_TYPES = [
  { id:"excel",    label:"Excel / CSV",  icon:"table",    color:"#10b981", desc:"Upload .xls, .xlsx, or .csv files", upload:true,
    accept:".xls,.xlsx,.csv" },
  { id:"pdf",      label:"PDF",          icon:"file",     color:"#f97316", desc:"Extract and query data from PDF files", upload:true,
    accept:".pdf" },
  { id:"postgres", label:"PostgreSQL",   icon:"database", color:"#336791", desc:"Connect to a PostgreSQL database",
    fields:[{key:"name",label:"Name",ph:"My Postgres DB"},{key:"host",label:"Host",ph:"localhost"},{key:"port",label:"Port",ph:"5432"},{key:"database",label:"Database",ph:"mydb"},{key:"username",label:"User",ph:"postgres"},{key:"password",label:"Password",ph:"••••••",type:"password"}] },
  { id:"mysql",    label:"MySQL",        icon:"database", color:"#00758f", desc:"Connect to a MySQL/MariaDB database",
    fields:[{key:"name",label:"Name",ph:"My MySQL DB"},{key:"host",label:"Host",ph:"localhost"},{key:"port",label:"Port",ph:"3306"},{key:"database",label:"Database",ph:"mydb"},{key:"username",label:"User",ph:"root"},{key:"password",label:"Password",ph:"••••••",type:"password"}] },
  { id:"mongodb",  label:"MongoDB",      icon:"mongo",    color:"#47a248", desc:"Connect to a MongoDB collection",
    fields:[{key:"name",label:"Name",ph:"My MongoDB"},{key:"uri",label:"URI",ph:"mongodb://localhost:27017"},{key:"database",label:"Database",ph:"mydb"},{key:"collection",label:"Collection (optional)",ph:"users"}] },
  { id:"sqlite",   label:"SQLite",       icon:"database", color:"#6366f1", desc:"Upload a SQLite database file", upload:true,
    accept:".db,.sqlite,.sqlite3" },
  { id:"api",      label:"REST API",     icon:"api",      color:"#8b5cf6", desc:"Fetch and query JSON from any REST API",
    fields:[{key:"name",label:"Name",ph:"My API"},{key:"url",label:"Endpoint URL",ph:"https://api.example.com/data"},{key:"apiKey",label:"API Key (optional)",ph:"Bearer ..."}] },
  { id:"bigquery", label:"BigQuery",     icon:"database", color:"#4285f4", desc:"Query Google BigQuery tables",
    fields:[{key:"name",label:"Name",ph:"My BigQuery"},{key:"project_id",label:"Project ID",ph:"my-project"},{key:"dataset_id",label:"Dataset",ph:"my_dataset"},{key:"credentials",label:"Service Account JSON",ph:'{"type":"service_account",...}',textarea:true}] },
];

const TYPE_MAP = Object.fromEntries(SOURCE_TYPES.map(s => [s.id, s]));

function sourceColor(type) { return TYPE_MAP[type]?.color ?? T.accent; }
function sourceIcon(type)  { return TYPE_MAP[type]?.icon  ?? "database"; }

// ─── SAMPLE QUERY CHIPS ───────────────────────────────────────────────────────
const SAMPLE_QUERIES = {
  excel:    ["Show first 20 rows","Count rows by Category","Top 10 by Revenue descending","Rows where Status is Active"],
  pdf:      ["Extract all tables","Show text from page 1","Find rows mentioning total"],
  postgres: ["SELECT * FROM users LIMIT 20","SELECT COUNT(*) FROM orders WHERE status='pending'","SELECT name, SUM(amount) FROM sales GROUP BY name ORDER BY 2 DESC"],
  mysql:    ["SELECT * FROM customers LIMIT 20","SHOW TABLES","DESCRIBE orders"],
  mongodb:  ['{"filter":{},"limit":20}','{"filter":{"status":"active"}}','{"filter":{},"sort":{"createdAt":-1},"limit":10}'],
  sqlite:   ["SELECT * FROM main LIMIT 20","SELECT name FROM sqlite_master WHERE type='table'"],
  api:      ["Show all records","Filter where status is active","Show records created this month"],
  bigquery: ["SELECT * FROM dataset.table LIMIT 100","SELECT COUNT(*) as total FROM dataset.table"],
};

// ─── QUERY TYPE MAPPING ───────────────────────────────────────────────────────
// Maps source type → default query_type sent to POST /query/run
function defaultQueryType(sourceType, aiMode) {
  if (aiMode) return "natural_language";
  if (sourceType === "mongodb") return "mongodb";
  if (sourceType === "api")     return "api";
  return "sql";
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function DataQuery() {
  // ── Sources ──────────────────────────────────────────────────────────────────
  const [connections, setConnections]     = useState([]);
  const [activeConn,  setActiveConn]      = useState(null);
  const [schemaOpen,  setSchemaOpen]      = useState({});   // { source_id: bool }
  const [tableMap,    setTableMap]        = useState({});   // { source_id: [tbl] }
  const [sourcesLoading, setSourcesLoading] = useState(true);

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  const [tabs,       setTabs]      = useState([{ id:"tab_1", title:"Query 1", connId:null, query:"", results:null, ran:false, execTime:null }]);
  const [activeTab,  setActiveTab] = useState("tab_1");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showAddSource,       setShowAddSource]       = useState(false);
  const [selectedSourceType,  setSelectedSourceType]  = useState(null);
  const [sideSection,         setSideSection]         = useState("explorer");
  const [queryHistory,        setQueryHistory]        = useState([]);
  const [historyLoading,      setHistoryLoading]      = useState(false);
  const [running,             setRunning]             = useState(false);
  const [toast,               setToast]               = useState(null);
  const [connForm,            setConnForm]            = useState({});
  const [dragOver,            setDragOver]            = useState(false);
  const [aiMode,              setAiMode]              = useState(true);
  const [connecting,          setConnecting]          = useState(false);
  const [uploading,           setUploading]           = useState(false);

  const editorRef    = useRef(null);
  const fileInputRef = useRef(null);

  const currentTab  = tabs.find(t => t.id === activeTab);
  const currentConn = connections.find(c => c.id === activeConn);

  // ─── Toast ───────────────────────────────────────────────────────────────────
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ─── Load sources on mount ───────────────────────────────────────────────────
  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    setSourcesLoading(true);
    try {
      const list = await api.getSources();
      // API returns array of { id, name, type, status, created_at }
      const conns = list.map(s => ({
        id:     s.id,
        name:   s.name,
        type:   s.type,
        color:  sourceColor(s.type),
        status: s.status,
      }));
      setConnections(conns);
      // auto-select first source
      if (conns.length > 0 && !activeConn) {
        setActiveConn(conns[0].id);
        setTabs(ts => ts.map(t => t.id === activeTab ? { ...t, connId: conns[0].id } : t));
      }
    } catch (e) {
      showToast("Could not load sources: " + e.message, "error");
    } finally {
      setSourcesLoading(false);
    }
  }

  // ─── Load tables for a source (lazy, on expand) ──────────────────────────────
  async function loadTables(sourceId) {
    if (tableMap[sourceId]) return;           // already fetched
    try {
      const res = await api.getTables(sourceId);
      setTableMap(m => ({ ...m, [sourceId]: res.tables ?? [] }));
    } catch (e) {
      showToast("Could not load tables: " + e.message, "error");
    }
  }

  function toggleSchema(connId) {
    const willOpen = !schemaOpen[connId];
    setSchemaOpen(p => ({ ...p, [connId]: willOpen }));
    setActiveConn(connId);
    setTabs(ts => ts.map(t => t.id === activeTab ? { ...t, connId } : t));
    if (willOpen) loadTables(connId);
  }

  // ─── Load history when tab switches ──────────────────────────────────────────
  useEffect(() => {
    if (sideSection === "history") loadHistory();
  }, [sideSection]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await api.getHistory(50);
      setQueryHistory(res.history ?? []);
    } catch (e) {
      showToast("Could not load history: " + e.message, "error");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleClearHistory() {
    try {
      await api.clearHistory();
      setQueryHistory([]);
      showToast("History cleared");
    } catch (e) {
      showToast("Could not clear history: " + e.message, "error");
    }
  }

  // ─── Run query ───────────────────────────────────────────────────────────────
  async function runQuery() {
    const query = currentTab?.query?.trim();
    if (!query) { showToast("Write a query first", "warning"); return; }
    if (!activeConn) { showToast("Select a data source first", "warning"); return; }

    setRunning(true);
    try {
      const qtype = defaultQueryType(currentConn?.type, aiMode);

      // AI mode: generate SQL first, then run it
      if (aiMode) {
        let finalQuery = query;
        try {
          const gen = await api.generateAIQuery({ source_id: activeConn, prompt: query });
          finalQuery = gen.generated_query ?? query;
          // show the generated SQL in the editor
          setTabs(ts => ts.map(t => t.id === activeTab ? { ...t, query: finalQuery } : t));
        } catch (aiErr) {
          showToast("AI generation failed, running as-is: " + aiErr.message, "warning");
        }

        const res = await api.runQuery({
          source_id:  activeConn,
          query:      finalQuery,
          query_type: "sql",
          limit:      1000,
        });
        applyResults(res, finalQuery);
      } else {
        const res = await api.runQuery({
          source_id:  activeConn,
          query,
          query_type: qtype,
          limit:      1000,
        });
        applyResults(res, query);
      }
    } catch (e) {
      showToast("Query failed: " + e.message, "error");
      setRunning(false);
    }
  }

  function applyResults(res, query) {
    if (!res.success && !res.rows) {
      showToast(res.error ?? res.detail ?? "Query returned no data", "error");
      setRunning(false);
      return;
    }
    const results = {
      columns: res.columns ?? [],
      rows:    res.rows    ?? [],
    };
    setTabs(ts => ts.map(t =>
      t.id === activeTab
        ? { ...t, results, ran: true, execTime: res.execution_time,
            title: query.slice(0, 22) + (query.length > 22 ? "…" : "") }
        : t
    ));
    showToast(`${res.row_count ?? results.rows.length} rows · ${res.execution_time?.toFixed(3)}s`);
    setRunning(false);
    // refresh history badge
    loadHistory();
  }

  // ─── Add source ───────────────────────────────────────────────────────────────
  async function addConnection(type, formDataOrFile) {
    setConnecting(true);
    try {
      let result;
      if (type === "excel" || type === "sqlite") {
        const file = formDataOrFile instanceof File ? formDataOrFile : formDataOrFile?.file;
        if (!file) { showToast("Please choose a file", "warning"); setConnecting(false); return; }
        const name = formDataOrFile?.name || file.name;
        result = type === "excel"
          ? await api.uploadExcel(name, file)
          : await api.uploadSQLite(name, file);
      } else if (type === "pdf") {
        const file = formDataOrFile instanceof File ? formDataOrFile : formDataOrFile?.file;
        if (!file) { showToast("Please choose a file", "warning"); setConnecting(false); return; }
        result = await api.uploadPDF(formDataOrFile?.name || file.name, file);
      } else if (type === "postgres") {
        result = await api.connectPostgres({
          name:     formDataOrFile.name,
          host:     formDataOrFile.host,
          port:     Number(formDataOrFile.port) || 5432,
          database: formDataOrFile.database,
          username: formDataOrFile.username,
          password: formDataOrFile.password,
          ssl:      false,
        });
      } else if (type === "mysql") {
        result = await api.connectMySQL({
          name:     formDataOrFile.name,
          host:     formDataOrFile.host,
          port:     Number(formDataOrFile.port) || 3306,
          database: formDataOrFile.database,
          username: formDataOrFile.username,
          password: formDataOrFile.password,
        });
      } else if (type === "mongodb") {
        result = await api.connectMongoDB({
          name:       formDataOrFile.name,
          uri:        formDataOrFile.uri,
          database:   formDataOrFile.database,
          collection: formDataOrFile.collection || undefined,
        });
      } else if (type === "api") {
        result = await api.connectAPI({
          name:    formDataOrFile.name,
          url:     formDataOrFile.url,
          method:  "GET",
          headers: formDataOrFile.apiKey ? { Authorization: formDataOrFile.apiKey } : {},
          params:  {},
        });
      } else if (type === "bigquery") {
        result = await api.connectBigQuery({
          name:        formDataOrFile.name,
          project_id:  formDataOrFile.project_id,
          dataset_id:  formDataOrFile.dataset_id,
          credentials: formDataOrFile.credentials || undefined,
        });
      } else {
        throw new Error(`Unknown source type: ${type}`);
      }

      // result always contains source_id and name
      const newConn = {
        id:     result.source_id,
        name:   result.name,
        type,
        color:  sourceColor(type),
        status: "connected",
      };
      setConnections(cs => [...cs, newConn]);
      setActiveConn(result.source_id);
      setTabs(ts => ts.map(t => t.id === activeTab ? { ...t, connId: result.source_id } : t));
      setShowAddSource(false);
      setSelectedSourceType(null);
      setConnForm({});
      showToast(`Connected: ${result.name}`);
    } catch (e) {
      showToast("Connection failed: " + e.message, "error");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDeleteSource(id, e) {
    e.stopPropagation();
    try {
      await api.deleteSource(id);
      setConnections(cs => cs.filter(c => c.id !== id));
      if (activeConn === id) {
        const remaining = connections.filter(c => c.id !== id);
        setActiveConn(remaining[0]?.id ?? null);
      }
      showToast("Source removed");
    } catch (err) {
      showToast("Delete failed: " + err.message, "error");
    }
  }

  // ─── Tab management ───────────────────────────────────────────────────────────
  function addTab() {
    const id = "tab_" + Date.now();
    setTabs(ts => [...ts, { id, title: "New query", connId: activeConn, query: "", results: null, ran: false }]);
    setActiveTab(id);
  }

  function closeTab(id, e) {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const idx  = tabs.findIndex(t => t.id === id);
    const next = tabs[idx === 0 ? 1 : idx - 1]?.id;
    setTabs(ts => ts.filter(t => t.id !== id));
    if (activeTab === id) setActiveTab(next);
  }

  function updateQuery(val) {
    setTabs(ts => ts.map(t => t.id === activeTab ? { ...t, query: val } : t));
  }

  function insertSampleQuery(q) {
    setTabs(ts => ts.map(t => t.id === activeTab ? { ...t, query: q } : t));
    editorRef.current?.focus();
  }

  function copyQuery() {
    navigator.clipboard.writeText(currentTab?.query || "").then(() => showToast("Copied!"));
  }

  // ─── Keyboard shortcut ────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runQuery(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const dtypeColor = v => {
    if (v === null || v === undefined || v === "") return T.text3;
    if (v === "true" || v === "false") return "#a78bfa";
    if (!isNaN(Number(v)) && v !== "") return "#34d399";
    return T.text;
  };

  const samples = SAMPLE_QUERIES[currentConn?.type] ?? SAMPLE_QUERIES.excel;

  // ═════════════════════════════ RENDER ════════════════════════════════════════
  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:T.bg, fontFamily:T.sans, fontSize:13, color:T.text }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:6px}
        ::-webkit-scrollbar-thumb:hover{background:${T.text3}}
        input,select,textarea{font-family:${T.sans};font-size:13px;color:${T.text};outline:none}
        input::placeholder,textarea::placeholder{color:${T.text3}}
        button{cursor:pointer;font-family:${T.sans}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .row-hover:hover{background:${T.card2}!important}
        .tab-item:hover{background:${T.card}!important}
        .conn-item:hover{background:${T.card2}!important}
        .tree-item:hover{background:${T.card}!important}
        .chip-btn:hover{background:${T.accentLo}!important;border-color:${T.accent}!important;color:${T.accent}!important}
        .src-card:hover{border-color:${T.accent}!important;background:${T.card}!important}
        .icon-btn:hover{background:${T.card2}!important}
      `}</style>

      {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
      <div style={{ width:240, background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>

        {/* Logo */}
        <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:`linear-gradient(135deg,${T.accent},#8b5cf6)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon d={Icons.bolt} size={14} color="#fff" />
          </div>
          <span style={{ fontWeight:700, fontSize:14, letterSpacing:"-.3px" }}>DataQuery</span>
          <div style={{ flex:1 }} />
          <button className="icon-btn" onClick={loadSources} title="Refresh sources"
            style={{ width:24, height:24, borderRadius:5, background:"transparent", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:T.text2 }}>
            <Icon d={Icons.refresh} size={13} />
          </button>
          <button className="icon-btn" onClick={() => setShowAddSource(true)} title="Add source"
            style={{ width:24, height:24, borderRadius:5, background:"transparent", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:T.text2 }}>
            <Icon d={Icons.plus} size={14} />
          </button>
        </div>

        {/* Section tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          {["explorer","history"].map(s => (
            <button key={s} onClick={() => setSideSection(s)}
              style={{ flex:1, padding:"8px 4px", background:"transparent", border:"none", borderBottom:sideSection===s?`2px solid ${T.accent}`:"2px solid transparent", color:sideSection===s?T.accent:T.text3, fontSize:11, fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", transition:"all .15s" }}>
              {s}
            </button>
          ))}
        </div>

        {/* Explorer */}
        {sideSection === "explorer" && (
          <div style={{ flex:1, overflow:"auto", padding:"8px 6px" }}>
            {sourcesLoading && (
              <div style={{ textAlign:"center", padding:16, color:T.text3, fontSize:12 }}>
                <Spinner /> Loading sources…
              </div>
            )}
            {!sourcesLoading && connections.length === 0 && (
              <div style={{ textAlign:"center", padding:"20px 12px", color:T.text3, fontSize:12 }}>
                No sources yet. Add one below.
              </div>
            )}
            {connections.map(conn => {
              const isActive = conn.id === activeConn;
              const isOpen   = schemaOpen[conn.id];
              const tables   = tableMap[conn.id] ?? [];
              return (
                <div key={conn.id}>
                  <div className="conn-item" onClick={() => toggleSchema(conn.id)}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 8px", borderRadius:7, cursor:"pointer", background:isActive?T.accentLo:"transparent", marginBottom:1 }}>
                    <div style={{ width:20, height:20, borderRadius:5, background:conn.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon d={Icons[sourceIcon(conn.type)]} size={11} color={conn.color} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:isActive?T.text:T.text2 }}>{conn.name}</div>
                      <div style={{ fontSize:10, color:T.text3, textTransform:"uppercase", letterSpacing:".05em" }}>{conn.type}</div>
                    </div>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:conn.status==="connected"?T.green:T.yellow, flexShrink:0 }} />
                    <button onClick={e => handleDeleteSource(conn.id, e)} className="icon-btn"
                      style={{ width:18, height:18, borderRadius:4, background:"transparent", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:T.text3, opacity:0, transition:"opacity .12s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity="1"} onMouseLeave={e => e.currentTarget.style.opacity="0"}>
                      <Icon d={Icons.trash} size={11} color={T.red} />
                    </button>
                    <Icon d={Icons[isOpen?"chevronD":"chevronR"]} size={11} color={T.text3} />
                  </div>
                  {isOpen && (
                    <div style={{ paddingLeft:12, paddingBottom:4 }}>
                      {tables.length === 0 && <div style={{ fontSize:11, color:T.text3, padding:"4px 8px" }}>No tables found</div>}
                      {tables.map(tbl => (
                        <div key={tbl} className="tree-item"
                          onClick={() => insertSampleQuery(
                            conn.type === "postgres" || conn.type === "mysql" || conn.type === "sqlite"
                              ? `SELECT * FROM ${tbl} LIMIT 50`
                              : conn.type === "mongodb"
                              ? `{"filter":{},"limit":50}`
                              : `Show all rows from ${tbl}`
                          )}
                          style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 8px", borderRadius:5, cursor:"pointer", marginBottom:1 }}>
                          <Icon d={Icons.table} size={11} color={T.text3} />
                          <span style={{ fontSize:11, color:T.text2, fontFamily:T.mono }}>{tbl}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => setShowAddSource(true)}
              style={{ width:"100%", padding:"7px 8px", background:"transparent", border:`1.5px dashed ${T.border2}`, borderRadius:7, color:T.text3, fontSize:12, display:"flex", alignItems:"center", gap:6, marginTop:6, transition:"all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=T.accent; e.currentTarget.style.color=T.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.border2; e.currentTarget.style.color=T.text3; }}>
              <Icon d={Icons.plus} size={13} /> Add data source
            </button>
          </div>
        )}

        {/* History */}
        {sideSection === "history" && (
          <div style={{ flex:1, overflow:"auto", padding:"8px 6px" }}>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:6 }}>
              <button onClick={handleClearHistory} className="icon-btn"
                style={{ fontSize:11, color:T.text3, background:"transparent", border:"none", display:"flex", alignItems:"center", gap:4, padding:"3px 6px", borderRadius:4 }}>
                <Icon d={Icons.trash} size={11} /> Clear
              </button>
            </div>
            {historyLoading && <div style={{ textAlign:"center", padding:12, color:T.text3 }}><Spinner /></div>}
            {!historyLoading && queryHistory.length === 0 && (
              <div style={{ textAlign:"center", padding:"20px 12px", color:T.text3, fontSize:12 }}>No queries yet.</div>
            )}
            {queryHistory.map(h => (
              <div key={h.id} className="conn-item" onClick={() => insertSampleQuery(h.query)}
                style={{ padding:"7px 10px", borderRadius:7, marginBottom:4, cursor:"pointer", border:`1px solid transparent`, transition:"all .12s" }}>
                <div style={{ fontSize:12, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3, fontFamily:T.mono }}>{h.query}</div>
                <div style={{ display:"flex", gap:10, fontSize:10, color:T.text3 }}>
                  <span>{h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : h.time}</span>
                  <span style={{ color:T.green }}>{h.rows_returned ?? h.rows} rows</span>
                  <span>{h.source_name ?? h.conn}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════ MAIN AREA ═══════════════ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Tabs bar */}
        <div style={{ display:"flex", alignItems:"center", background:T.surface, borderBottom:`1px solid ${T.border}`, height:38, flexShrink:0, overflow:"hidden" }}>
          <div style={{ display:"flex", flex:1, overflow:"auto", height:"100%" }}>
            {tabs.map(tab => {
              const conn    = connections.find(c => c.id === tab.connId);
              const isActive = tab.id === activeTab;
              return (
                <div key={tab.id} className="tab-item" onClick={() => setActiveTab(tab.id)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"0 12px", height:"100%", borderRight:`1px solid ${T.border}`, cursor:"pointer", background:isActive?T.panel:"transparent", borderBottom:isActive?`2px solid ${T.accent}`:"2px solid transparent", flexShrink:0, maxWidth:180, position:"relative", top:1 }}>
                  {conn && <div style={{ width:8, height:8, borderRadius:2, background:conn.color, flexShrink:0 }} />}
                  <span style={{ fontSize:12, color:isActive?T.text:T.text2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:T.mono }}>{tab.title}</span>
                  {tabs.length > 1 && (
                    <button onClick={e => closeTab(tab.id, e)}
                      style={{ background:"transparent", border:"none", color:T.text3, padding:"0 2px", display:"flex", lineHeight:1, marginLeft:2 }}
                      onMouseEnter={e => e.currentTarget.style.color=T.red}
                      onMouseLeave={e => e.currentTarget.style.color=T.text3}>
                      <Icon d={Icons.close} size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={addTab} className="icon-btn"
            style={{ padding:"0 12px", height:"100%", background:"transparent", border:"none", borderLeft:`1px solid ${T.border}`, color:T.text3, display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
            <Icon d={Icons.plus} size={13} /><span style={{ fontSize:11 }}>New</span>
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", background:T.panel, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <select value={activeConn ?? ""} onChange={e => { setActiveConn(e.target.value); setTabs(ts => ts.map(t => t.id===activeTab?{...t,connId:e.target.value}:t)); }}
            style={{ background:T.card, border:`1px solid ${T.border2}`, borderRadius:6, padding:"5px 10px", color:T.text, fontSize:12, outline:"none", maxWidth:160 }}>
            <option value="" disabled>Select source</option>
            {connections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <button onClick={() => setAiMode(m => !m)}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:6, border:`1px solid ${aiMode?T.accent:T.border2}`, background:aiMode?T.accentLo:T.card, color:aiMode?T.accent:T.text2, fontSize:12, fontWeight:500, transition:"all .15s" }}>
            <Icon d={Icons.aiSpark} size={13} color={aiMode?T.accent:T.text3} />
            {aiMode ? "AI mode" : "SQL mode"}
          </button>

          <div style={{ flex:1 }} />

          <div style={{ display:"flex", gap:4, overflow:"hidden" }}>
            {samples.slice(0, 2).map((q, i) => (
              <button key={i} className="chip-btn" onClick={() => insertSampleQuery(q)}
                style={{ padding:"4px 9px", borderRadius:5, border:`1px solid ${T.border2}`, background:T.card, color:T.text3, fontSize:11, whiteSpace:"nowrap", transition:"all .12s" }}>
                {q.length > 24 ? q.slice(0, 24) + "…" : q}
              </button>
            ))}
          </div>

          <button onClick={copyQuery} className="icon-btn" title="Copy query"
            style={{ padding:"5px 8px", background:T.card, border:`1px solid ${T.border2}`, borderRadius:6, color:T.text2, display:"flex", alignItems:"center", gap:4, fontSize:11 }}>
            <Icon d={Icons.copy} size={13} />
          </button>
        </div>

        {/* Editor + Results */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

          {/* Editor */}
          <div style={{ background:T.panel, borderBottom:`1px solid ${T.border}`, flexShrink:0, position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", padding:"6px 14px 0", gap:8 }}>
              <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:T.text3 }}>
                {aiMode ? "Ask in plain English" : "SQL Editor"}
              </span>
              {aiMode && (
                <span style={{ fontSize:10, padding:"1px 6px", borderRadius:3, background:T.accentLo, color:T.accent, border:`1px solid ${T.accentGl}` }}>AI</span>
              )}
              <div style={{ flex:1 }} />
              {currentTab?.execTime != null && (
                <span style={{ fontSize:10, color:T.text3, fontFamily:T.mono }}>{currentTab.execTime.toFixed(3)}s</span>
              )}
              <span style={{ fontSize:10, color:T.text3 }}>⌘↵ to run</span>
            </div>

            <div style={{ display:"flex", alignItems:"flex-end" }}>
              {/* Line numbers */}
              <div style={{ padding:"8px 0 8px 10px", fontFamily:T.mono, fontSize:12, lineHeight:"20px", color:T.text3, userSelect:"none", minWidth:32, textAlign:"right", flexShrink:0 }}>
                {(currentTab?.query || "").split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>

              <textarea ref={editorRef} value={currentTab?.query || ""} onChange={e => updateQuery(e.target.value)}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runQuery(); } }}
                placeholder={aiMode ? "e.g.  Show me top 10 customers by total order value in the last 30 days…" : "SELECT * FROM table LIMIT 20"}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", padding:"8px 14px 12px 8px", fontFamily:aiMode?T.sans:T.mono, fontSize:aiMode?13.5:13, lineHeight:"20px", resize:"none", minHeight:72, maxHeight:180, color:T.text, caretColor:T.accent }} />

              <div style={{ padding:"8px 12px 12px", flexShrink:0, display:"flex", alignItems:"flex-end", gap:6 }}>
                <button onClick={runQuery} disabled={running}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px", borderRadius:7, border:"none", background:running?"#2d3748":`linear-gradient(135deg,${T.accent},#8b5cf6)`, color:"#fff", fontWeight:600, fontSize:13, transition:"all .15s", opacity:running?.7:1 }}>
                  {running
                    ? <div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                    : <Icon d={Icons.run} size={13} color="#fff" />}
                  {running ? "Running…" : "Run"}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {!currentTab?.ran
              ? <EmptyState aiMode={aiMode} onSample={insertSampleQuery} sourceType={currentConn?.type} />
              : <ResultsPanel data={currentTab.results} T={T} dtypeColor={dtypeColor} showToast={showToast} />}
          </div>
        </div>
      </div>

      {/* Add Source Modal */}
      {showAddSource && (
        <AddSourceModal
          selectedType={selectedSourceType}
          onSelectType={setSelectedSourceType}
          onClose={() => { setShowAddSource(false); setSelectedSourceType(null); setConnForm({}); }}
          onConnect={addConnection}
          connForm={connForm}
          setConnForm={setConnForm}
          dragOver={dragOver}
          setDragOver={setDragOver}
          connecting={connecting}
          T={T}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:20, right:20, display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:9, background:T.card2, border:`1px solid ${toast.type==="success"?T.green:toast.type==="error"?T.red:T.yellow}`, color:T.text, fontSize:13, boxShadow:"0 8px 32px rgba(0,0,0,.5)", animation:"fadeUp .2s ease", zIndex:9999, maxWidth:360 }}>
          <span style={{ fontSize:15 }}>{toast.type==="success"?"✓":toast.type==="error"?"✕":"⚠"}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
function Spinner({ size = 14 }) {
  return (
    <div style={{ width:size, height:size, border:"2px solid rgba(255,255,255,.15)", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block", verticalAlign:"middle" }} />
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyState({ aiMode, onSample, sourceType }) {
  const samples = SAMPLE_QUERIES[sourceType ?? "excel"] ?? SAMPLE_QUERIES.excel;
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, gap:20, background:T.bg }}>
      <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,${T.accentLo},rgba(139,92,246,.12))`, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon d={aiMode ? Icons.aiSpark : Icons.database} size={24} color={T.accent} />
      </div>
      <div style={{ textAlign:"center", maxWidth:360 }}>
        <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>{aiMode ? "Ask anything about your data" : "Write a query to get started"}</div>
        <div style={{ fontSize:13, color:T.text2, lineHeight:1.65 }}>{aiMode ? "Describe what you want in plain English — the AI translates it to a query automatically." : "Use the editor above to write SQL, NoSQL, or any query supported by your data source."}</div>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center", maxWidth:480 }}>
        {samples.map((q, i) => (
          <button key={i} onClick={() => onSample(q)}
            style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${T.border2}`, background:T.card, color:T.text2, fontSize:12, cursor:"pointer", transition:"all .12s", textAlign:"left" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.accent; e.currentTarget.style.color=T.accent; e.currentTarget.style.background=T.accentLo; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border2; e.currentTarget.style.color=T.text2; e.currentTarget.style.background=T.card; }}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── RESULTS PANEL ───────────────────────────────────────────────────────────
function ResultsPanel({ data, T: T2, dtypeColor, showToast }) {
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [exporting, setExporting] = useState(null);
  const pageSize = 50;

  if (!data) return null;

  let rows = data.rows ?? [];
  if (search) rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())));
  if (sortCol) rows = [...rows].sort((a, b) => { const av = a[sortCol], bv = b[sortCol]; return sortDir * (av > bv ? 1 : av < bv ? -1 : 0); });

  const totalPages = Math.ceil(rows.length / pageSize);
  const pageRows   = rows.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d * -1);
    else { setSortCol(col); setSortDir(1); }
  }

  async function handleExport(fmt) {
    setExporting(fmt);
    try {
      const fn = { csv: api.exportCSV, excel: api.exportExcel, json: api.exportJSON, pdf: api.exportPDF }[fmt];
      await fn(data.rows, data.columns, "results");
      showToast(`Downloaded results.${fmt === "excel" ? "xlsx" : fmt}`);
    } catch (e) {
      showToast("Export failed: " + e.message, "error");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:T2.bg, animation:"fadeUp .2s ease" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:T2.panel, borderBottom:`1px solid ${T2.border}`, flexShrink:0 }}>
        <Icon d={Icons.table2} size={14} color={T2.green} />
        <span style={{ fontSize:12, fontWeight:600, color:T2.text2 }}>Results</span>
        <span style={{ fontFamily:T2.mono, fontSize:11, padding:"2px 8px", borderRadius:4, background:"rgba(16,185,129,.1)", color:T2.green, border:"1px solid rgba(16,185,129,.25)" }}>{rows.length} rows</span>
        <span style={{ fontFamily:T2.mono, fontSize:11, color:T2.text3 }}>{(data.columns ?? []).length} cols</span>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", alignItems:"center", gap:6, background:T2.card, border:`1px solid ${T2.border2}`, borderRadius:6, padding:"4px 8px" }}>
          <Icon d={Icons.search} size={12} color={T2.text3} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Filter results…"
            style={{ background:"transparent", border:"none", width:140, color:T2.text, fontSize:12 }} />
        </div>
        {[["csv","CSV"],["excel","XLSX"],["json","JSON"],["pdf","PDF"]].map(([fmt, lbl]) => (
          <button key={fmt} onClick={() => handleExport(fmt)} disabled={!!exporting}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:6, border:`1px solid ${T2.border2}`, background:T2.card, color:T2.text2, fontSize:11, fontWeight:500, opacity:exporting?0.6:1 }}
            onMouseEnter={e => e.currentTarget.style.borderColor=T2.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor=T2.border2}>
            {exporting === fmt ? <Spinner size={11} /> : <Icon d={Icons.download} size={12} />} {lbl}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex:1, overflow:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5 }}>
          <thead>
            <tr style={{ background:T2.panel, position:"sticky", top:0, zIndex:2 }}>
              <th style={{ padding:"8px 10px", textAlign:"left", borderBottom:`2px solid ${T2.border}`, color:T2.text3, fontSize:10, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", width:40, fontFamily:T2.mono }}>#</th>
              {(data.columns ?? []).map(col => (
                <th key={col} onClick={() => toggleSort(col)}
                  style={{ padding:"8px 14px", textAlign:"left", borderBottom:`2px solid ${T2.border}`, color:sortCol===col?T2.accent:T2.text3, fontSize:10, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap", userSelect:"none", transition:"color .12s" }}>
                  {col} {sortCol===col?(sortDir===1?"↑":"↓"):<span style={{ opacity:.3 }}>↕</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr key={ri} className="row-hover" style={{ background:(page-1)*pageSize+ri%2===0?T2.bg:"rgba(255,255,255,.012)", transition:"background .08s" }}>
                <td style={{ padding:"6px 10px", borderBottom:`1px solid ${T2.border}`, color:T2.text3, fontFamily:T2.mono, fontSize:11 }}>{(page-1)*pageSize+ri+1}</td>
                {(data.columns ?? []).map(col => {
                  const v       = row[col];
                  const isEmpty = v === null || v === undefined || v === "";
                  return (
                    <td key={col} title={String(v ?? "")}
                      style={{ padding:"6px 14px", borderBottom:`1px solid ${T2.border}`, color:isEmpty?T2.text3:dtypeColor(String(v)), fontFamily:(!isNaN(Number(v))&&v!=="")||v==="true"||v==="false"?T2.mono:T2.sans, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:12.5 }}>
                      {isEmpty ? "—" : String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:T2.panel, borderTop:`1px solid ${T2.border}`, flexShrink:0 }}>
          <span style={{ fontFamily:T2.mono, fontSize:11, color:T2.text3, flex:1 }}>{(page-1)*pageSize+1}–{Math.min(page*pageSize,rows.length)} of {rows.length.toLocaleString()}</span>
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
            style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${T2.border2}`, background:T2.card, color:page===1?T2.text3:T2.text2, fontSize:12, opacity:page===1?.4:1 }}>‹ Prev</button>
          <span style={{ fontFamily:T2.mono, fontSize:11, color:T2.text2 }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
            style={{ padding:"4px 10px", borderRadius:5, border:`1px solid ${T2.border2}`, background:T2.card, color:page===totalPages?T2.text3:T2.text2, fontSize:12, opacity:page===totalPages?.4:1 }}>Next ›</button>
        </div>
      )}
    </div>
  );
}

// ─── ADD SOURCE MODAL ─────────────────────────────────────────────────────────
function AddSourceModal({ selectedType, onSelectType, onClose, onConnect, connForm, setConnForm, dragOver, setDragOver, connecting, T: T2 }) {
  const src         = SOURCE_TYPES.find(s => s.id === selectedType);
  const fileRef     = useRef(null);
  const [file, setFile] = useState(null);

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    if (!connForm.name) setConnForm(p => ({ ...p, name: f.name }));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleSubmit() {
    if (src?.upload) {
      onConnect(selectedType, { ...connForm, file });
    } else {
      onConnect(selectedType, connForm);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.72)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, animation:"fadeUp .15s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:T2.panel, border:`1px solid ${T2.border}`, borderRadius:14, width:640, maxHeight:"85vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,.7)" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", padding:"16px 20px", borderBottom:`1px solid ${T2.border}` }}>
          {selectedType && (
            <button onClick={() => { onSelectType(null); setFile(null); }}
              style={{ background:"transparent", border:"none", color:T2.text3, marginRight:8, display:"flex" }}>
              <Icon d={Icons.chevronR} size={16} />
            </button>
          )}
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>{selectedType ? `Connect ${src?.label}` : "Add data source"}</div>
            <div style={{ fontSize:12, color:T2.text2, marginTop:1 }}>{selectedType ? src?.desc : "Choose a source to connect"}</div>
          </div>
          <div style={{ flex:1 }} />
          <button onClick={onClose}
            style={{ background:T2.card, border:`1px solid ${T2.border2}`, borderRadius:6, color:T2.text2, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon d={Icons.close} size={14} />
          </button>
        </div>

        <div style={{ overflow:"auto", padding:20 }}>
          {!selectedType ? (
            /* Source picker */
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {SOURCE_TYPES.map(s => (
                <button key={s.id} className="src-card" onClick={() => onSelectType(s.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:T2.card, border:`1px solid ${T2.border}`, borderRadius:10, cursor:"pointer", textAlign:"left", transition:"all .15s" }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:s.color+"20", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1px solid ${s.color}33` }}>
                    <Icon d={Icons[s.icon ?? "database"]} size={17} color={s.color} />
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:T2.text, marginBottom:2 }}>{s.label}</div>
                    <div style={{ fontSize:11, color:T2.text3, lineHeight:1.4 }}>{s.desc}</div>
                  </div>
                  <Icon d={Icons.chevronR} size={14} color={T2.text3} style={{ marginLeft:"auto", flexShrink:0 }} />
                </button>
              ))}
            </div>

          ) : src?.upload ? (
            /* File upload */
            <div>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", color:T2.text3, marginBottom:5 }}>Display Name</label>
                <input value={connForm.name ?? ""} onChange={e => setConnForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={src.accept} style={{ width:"100%", padding:"9px 12px", background:T2.card, border:`1px solid ${T2.border2}`, borderRadius:7, color:T2.text, fontSize:13, outline:"none" }} />
              </div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{ border:`2px dashed ${dragOver?T2.accent:file?T2.green:T2.border2}`, borderRadius:10, padding:"32px 16px", textAlign:"center", cursor:"pointer", background:dragOver?T2.accentLo:file?"rgba(16,185,129,.06)":"transparent", transition:"all .2s" }}>
                <input ref={fileRef} type="file" accept={src.accept} style={{ display:"none" }} onChange={e => handleFile(e.target.files?.[0])} />
                <div style={{ fontSize:28, marginBottom:8 }}>{file ? "✅" : "📂"}</div>
                {file
                  ? <div style={{ fontSize:13, fontWeight:600, color:T2.green }}>{file.name}</div>
                  : <>
                      <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Drop your file here</div>
                      <div style={{ fontSize:12, color:T2.text2 }}>{src.accept} files</div>
                    </>}
              </div>
              <button onClick={handleSubmit} disabled={!file || connecting}
                style={{ marginTop:14, width:"100%", padding:"10px", borderRadius:7, border:"none", background:file&&!connecting?`linear-gradient(135deg,${T2.accent},#8b5cf6)`:"#2d3748", color:"#fff", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:!file||connecting?.6:1 }}>
                {connecting ? <><Spinner size={14} /> Uploading…</> : "Upload & Connect"}
              </button>
            </div>

          ) : (
            /* Connection form */
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {(src?.fields ?? []).map(f => (
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", color:T2.text3, marginBottom:5 }}>{f.label}</label>
                  {f.textarea
                    ? <textarea value={connForm[f.key] ?? ""} onChange={e => setConnForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.ph} rows={4}
                        style={{ width:"100%", padding:"9px 12px", background:T2.card, border:`1px solid ${T2.border2}`, borderRadius:7, color:T2.text, fontSize:12, outline:"none", resize:"vertical", fontFamily:T2.mono }}
                        onFocus={e => e.currentTarget.style.borderColor=T2.accent}
                        onBlur={e => e.currentTarget.style.borderColor=T2.border2} />
                    : <input type={f.type ?? "text"} placeholder={f.ph} value={connForm[f.key] ?? ""}
                        onChange={e => setConnForm(p => ({ ...p, [f.key]: e.target.value }))}
                        style={{ width:"100%", padding:"9px 12px", background:T2.card, border:`1px solid ${T2.border2}`, borderRadius:7, color:T2.text, fontSize:13, outline:"none", transition:"border-color .15s" }}
                        onFocus={e => e.currentTarget.style.borderColor=T2.accent}
                        onBlur={e => e.currentTarget.style.borderColor=T2.border2} />}
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <button onClick={handleSubmit} disabled={connecting}
                  style={{ flex:1, padding:"10px", borderRadius:7, border:"none", background:connecting?"#2d3748":`linear-gradient(135deg,${T2.accent},#8b5cf6)`, color:"#fff", fontWeight:600, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {connecting ? <><Spinner size={14} /> Connecting…</> : "Connect"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}