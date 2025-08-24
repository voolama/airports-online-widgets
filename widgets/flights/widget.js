// --- CONFIG ---
const API_BASE = "https://bold-star-0549.dean-brown.workers.dev/flights"; // your Worker
const MAX_ROWS = 300; // render cap per table

// --- UTILITIES ---
const $ = sel => document.querySelector(sel);
function hhmmKey(h){ const m=/^(\d{1,2}):(\d{2})$/.exec(h||""); return m? (+m[1]*60+ +m[2]) : 1e9; }
function airlineFromFlight(f){ return (String(f||"").match(/^[A-Z]{2,3}/)?.[0] || "").toUpperCase(); }
function logoUrl(code){
  // free logo source by airline IATA; falls back gracefully
  // (Aviasales CDN — widely used for IATA logos)
  return code ? `https://pics.avs.io/80/80/${code}.png` : `https://pics.avs.io/80/80/ZZ.png`;
}
function deriveAirport(){
  const qs = new URLSearchParams(location.search);
  const q = qs.get("airport");
  if (q && /^[A-Za-z]{3}$/.test(q)) return q.toUpperCase();
  const sub = location.hostname.split(".")[0];
  if (/^[A-Za-z]{3}$/i.test(sub)) return sub.toUpperCase();
  const m = location.pathname.match(/\/airport\/([a-z]{3})(?:\/|$)/i);
  return m ? m[1].toUpperCase() : "ATL";
}

// --- STATE ---
let DATA = { departures:[], arrivals:[] };
let FILTERS = { airline:"", flight:"", city:"" };
let COLFILTERS = { dep:{}, arr:{} };
let SORT = { dep:{key:"time_local",dir:1}, arr:{key:"time_local",dir:1} };

// --- RENDER ---
function rowHTML(r){
  const code = airlineFromFlight(r.flight_number);
  return `<tr>
    <td>${r.time_local||""}</td>
    <td>
      <div class="flightcell">
        <img src="${logoUrl(code)}" alt="${code} logo" loading="lazy" referrerpolicy="no-referrer">
        <div>
          <div class="flightno">${r.flight_number||""}</div>
          <div class="airline">${r.airline||""}</div>
        </div>
      </div>
    </td>
    <td>${r.city||""}</td>
    <td>${r.gate||""}</td>
    <td><span class="badge">${(r.status||"").replace(/\b\w/g,c=>c.toUpperCase())}</span></td>
  </tr>`;
}

function passesGlobalFilters(r){
  const a = FILTERS.airline.trim().toLowerCase();
  const f = FILTERS.flight.trim().toLowerCase();
  const c = FILTERS.city.trim().toLowerCase();
  if (a && !(r.airline||"").toLowerCase().includes(a)) return false;
  if (f && !(r.flight_number||"").toLowerCase().includes(f)) return false;
  if (c && !(r.city||"").toLowerCase().includes(c)) return false;
  return true;
}

function passesColFilters(r, tableKey){
  const cf = COLFILTERS[tableKey] || {};
  for (const k in cf){
    const v = (cf[k]||"").trim().toLowerCase();
    if (!v) continue;
    const val = (r[k]||"").toString().toLowerCase();
    if (!val.includes(v)) return false;
  }
  return true;
}

function sortRows(rows, tableKey){
  const {key, dir} = SORT[tableKey];
  const cmp = (a,b)=>{
    if (key==="time_local") return (hhmmKey(a.time_local)-hhmmKey(b.time_local))*dir;
    const av=(a[key]||"").toString().toLowerCase();
    const bv=(b[key]||"").toString().toLowerCase();
    return (av>bv?1:(av<bv?-1:0))*dir;
  };
  return rows.slice().sort(cmp);
}

function renderTable(tableKey, rows){
  const filt = rows.filter(passesGlobalFilters).filter(r=>passesColFilters(r, tableKey));
  const sorted = sortRows(filt, tableKey).slice(0, MAX_ROWS);
  const tb = tableKey==="dep" ? $("#tbl-dep tbody") : $("#tbl-arr tbody");
  tb.innerHTML = sorted.map(rowHTML).join("");
}

function render(){
  renderTable("dep", DATA.departures);
  renderTable("arr", DATA.arrivals);
}

// --- EVENTS (search strip) ---
function bindSearch(){
  $("#q-airline").addEventListener("input", e=>{ FILTERS.airline=e.target.value; render(); });
  $("#q-flight").addEventListener("input",  e=>{ FILTERS.flight =e.target.value; render(); });
  $("#q-city").addEventListener("input",    e=>{ FILTERS.city   =e.target.value; render(); });
  $("#q-clear").addEventListener("click", ()=>{
    FILTERS={airline:"",flight:"",city:""};
    $("#q-airline").value=""; $("#q-flight").value=""; $("#q-city").value="";
    document.querySelectorAll('thead .filters input').forEach(i=> i.value="");
    COLFILTERS={dep:{},arr:{}};
    render();
  });
}

// --- EVENTS (column filters + sort) ---
function bindTable(tableKey){
  const table = tableKey==="dep" ? $("#tbl-dep") : $("#tbl-arr");

  // sort on header click
  table.querySelectorAll("thead tr:first-child th.sortable").forEach(th=>{
    th.addEventListener("click", ()=>{
      const key = th.getAttribute("data-key");
      if (SORT[tableKey].key===key){ SORT[tableKey].dir *= -1; }
      else { SORT[tableKey] = {key, dir:1}; }
      renderTable(tableKey, tableKey==="dep"?DATA.departures:DATA.arrivals);
    });
  });

  // per-column filters (second header row)
  table.querySelectorAll("thead tr.filters input").forEach(inp=>{
    inp.addEventListener("input", ()=>{
      COLFILTERS[tableKey][inp.getAttribute("data-col")] = inp.value;
      renderTable(tableKey, tableKey==="dep"?DATA.departures:DATA.arrivals);
    });
  });
}

// --- BOOT ---
async function init(){
  bindSearch();
  bindTable("dep");
  bindTable("arr");

  const AIRPORT = deriveAirport();
  const url = `${API_BASE}?airport=${AIRPORT}`;
  try{
    const r = await fetch(url);
    if (!r.ok) throw new Error("API "+r.status);
    const j = await r.json();
    // sort by time ascending initially
    DATA.departures = (j.departures||[]).slice().sort((a,b)=>hhmmKey(a.time_local)-hhmmKey(b.time_local));
    DATA.arrivals   = (j.arrivals||[]).slice().sort((a,b)=>hhmmKey(a.time_local)-hhmmKey(b.time_local));
  }catch(err){
    console.warn("Live API failed, no data:", err);
    DATA = { departures:[], arrivals:[] };
  }
  render();
}

document.readyState==="loading"
  ? document.addEventListener("DOMContentLoaded", init, {once:true})
  : init();
