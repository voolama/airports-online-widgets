# --- Airports Online Widgets scaffold (single-quoted here-strings, zero Copy-Item) ---
$widgets = @("flights","dining","parking","lounges","transport","hotels","guide","faq")

# folders
$dirs = @(
  "common",
  "widgets"
) + ($widgets | ForEach-Object { "widgets/$_" }) + @(
  "data",
  "data/ATL"
)

foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

# root files
@'
# Airports Online Widgets

Embeddable widgets (HTML/CSS/JS) + JSON data for airport microsites.
'@ | Set-Content -Encoding UTF8 README.md

@'
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Airports Online Widgets</title>
<link rel="stylesheet" href="common/widget.css">
</head>
<body class="ao-container">
  <h1>Airports Online Widgets</h1>
  <ul>
    <li><a href="widgets/flights/?airport=ATL">flights</a></li>
    <li><a href="widgets/dining/?airport=ATL">dining</a></li>
    <li><a href="widgets/parking/?airport=ATL">parking</a></li>
    <li><a href="widgets/lounges/?airport=ATL">lounges</a></li>
    <li><a href="widgets/transport/?airport=ATL">transport</a></li>
    <li><a href="widgets/hotels/?airport=ATL">hotels</a></li>
    <li><a href="widgets/guide/?airport=ATL">guide</a></li>
    <li><a href="widgets/faq/?airport=ATL">faq</a></li>
  </ul>
</body>
</html>
'@ | Set-Content -Encoding UTF8 index.html

# common files
@'
.ao-container{font-family:system-ui,Segoe UI,Arial;padding:12px}
.ao-header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.ao-controls input,.ao-controls select{padding:6px}
.ao-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;border:1px solid #ddd}
.ao-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.ao-card{border:1px solid #e5e5e5;border-radius:10px;padding:12px}
.ao-table{width:100%;border-collapse:collapse}
.ao-table th,.ao-table td{border-bottom:1px solid #eee;padding:8px;text-align:left}
.ao-table th{cursor:pointer}
'@ | Set-Content -Encoding UTF8 common/widget.css

@'
const qs = new URLSearchParams(location.search);
export const AIRPORT = qs.get("airport") || "ATL";
export const THEME = qs.get("theme") || "light";

export async function loadJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}
export function byId(id){ return document.getElementById(id); }
export function setTitle(text){ const el=document.getElementById("title"); if(el) el.textContent=text; }
export function makeSearchInput(ph="Search..."){ const i=document.createElement("input"); i.type="search"; i.placeholder=ph; i.id="ao-search"; return i; }
export function sortTable(table, colIndex, asc=true){
  const rows=[...table.tBodies[0].rows];
  rows.sort((a,b)=>{
    const A=a.cells[colIndex].textContent.trim().toLowerCase();
    const B=b.cells[colIndex].textContent.trim().toLowerCase();
    return asc ? A.localeCompare(B) : B.localeCompare(A);
  });
  rows.forEach(r=>table.tBodies[0].appendChild(r));
}
'@ | Set-Content -Encoding UTF8 common/widget-utils.js

# per-widget boilerplate HTML (shared)
$widgetHtml = @'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Widget</title>
  <link rel="stylesheet" href="../../common/widget.css" />
</head>
<body>
  <div id="app" class="ao-container">
    <header class="ao-header">
      <h1 id="title">Widget</h1>
      <div id="controls" class="ao-controls"></div>
    </header>
    <div id="content" class="ao-content"></div>
  </div>
  <script type="module" src="./widget.js"></script>
</body>
</html>
'@

foreach ($w in $widgets) {
  Set-Content -Encoding UTF8 "widgets/$w/index.html" $widgetHtml

  switch ($w) {

    "flights" {
$schema = @'
{ "airport":"IATA","updated":"ISO-8601",
  "departures":[{"time_local":"HH:mm","flight_number":"","airline":"","city":"","gate":"","status":""}],
  "arrivals":[{"time_local":"HH:mm","flight_number":"","airline":"","city":"","gate":"","status":""}]
}
'@
$sample = @'
{ "airport":"ATL","updated":"2025-08-24T14:00:00Z",
  "departures":[{"time_local":"10:25","flight_number":"DL 123","airline":"Delta","city":"New York (JFK)","gate":"A12","status":"Boarding"}],
  "arrivals":[{"time_local":"10:10","flight_number":"UA 456","airline":"United","city":"Chicago (ORD)","gate":"B5","status":"Landed"}]
}
'@
$widget = @'
import { AIRPORT, loadJSON, byId, setTitle, sortTable, makeSearchInput } from "../../common/widget-utils.js";

(async function init(){
  setTitle("Flights");
  const dataPath = `/data/${AIRPORT}/flights.json`;
  let data;
  try { data = await loadJSON(dataPath); } catch { data = await loadJSON("./sample.json"); }

  const controls = document.getElementById("controls");
  const search = makeSearchInput("Search city / airline / flight #");
  controls.appendChild(search);

  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Departures</h2>
    <table class="ao-table" id="dep"><thead>
      <tr><th data-col="0">Time</th><th data-col="1">Flight</th><th data-col="2">Airline</th>
          <th data-col="3">City</th><th data-col="4">Gate</th><th>Status</th></tr></thead><tbody></tbody></table>
    <h2>Arrivals</h2>
    <table class="ao-table" id="arr"><thead>
      <tr><th data-col="0">Time</th><th data-col="1">Flight</th><th data-col="2">Airline</th>
          <th data-col="3">City</th><th data-col="4">Gate</th><th>Status</th></tr></thead><tbody></tbody></table>
  `;

  function fill(tableId, rows){
    const tb = byId(tableId).querySelector("tbody");
    rows.forEach(r=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.time_local||""}</td><td>${r.flight_number||""}</td><td>${r.airline||""}</td>
                      <td>${r.city||""}</td><td>${r.gate||""}</td><td>${r.status||""}</td>`;
      tb.appendChild(tr);
    });
    byId(tableId).querySelectorAll("th[data-col]").forEach(th=>{
      let asc = true;
      th.addEventListener("click", ()=>{ sortTable(byId(tableId), parseInt(th.dataset.col), asc); asc = !asc; });
    });
  }
  fill("dep", data.departures||[]);
  fill("arr", data.arrivals||[]);

  search.addEventListener("input", ()=>{
    const q = search.value.trim().toLowerCase();
    ["dep","arr"].forEach(id=>{
      [...byId(id).tBodies[0].rows].forEach(r=>{
        r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  });
})();
'@
      $schema  | Set-Content -Encoding UTF8 "widgets/$w/schema.json"
      $sample  | Set-Content -Encoding UTF8 "widgets/$w/sample.json"
      $sample  | Set-Content -Encoding UTF8 "data/ATL/$w.json"
      $widget  | Set-Content -Encoding UTF8 "widgets/$w/widget.js"
    }

    "dining" {
$schema = @'
{ "airport":"IATA","updated":"ISO-8601",
  "outlets":[{"name":"","type":"restaurant","cuisine":["American"],"near_gate":"A12","location_desc":"Concourse A","order_ahead_url":"","rating":4.3,"open_now":true}]
}
'@
$sample = @'
{ "airport":"ATL","updated":"2025-08-24T14:00:00Z",
  "outlets":[
    {"name":"Peachtree Grill","type":"restaurant","cuisine":["American"],"near_gate":"A12","location_desc":"Concourse A","order_ahead_url":"","rating":4.2,"open_now":true},
    {"name":"Sky Coffee","type":"cafe","cuisine":["Coffee"],"near_gate":"B7","location_desc":"Concourse B","order_ahead_url":"","rating":4.0,"open_now":false}
  ]
}
'@
$widget = @'
import { AIRPORT, loadJSON, setTitle } from "../../common/widget-utils.js";
(async function(){
  setTitle("Shop, Eat & Drink");
  const path = `/data/${AIRPORT}/dining.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const items = (data.outlets||[]).map(o => `
    <div class="ao-card">
      <h3>${o.name}</h3>
      <div class="ao-badge">${o.type}</div>
      <div>${(o.cuisine||[]).join(", ")}</div>
      <div>${o.location_desc||""} ${o.near_gate?("· Gate "+o.near_gate):""}</div>
      <div>Rating: ${o.rating??"N/A"} ${o.open_now?'<span class="ao-badge">Open</span>':'<span class="ao-badge">Closed</span>'}</div>
      ${o.order_ahead_url?`<p><a href="${o.order_ahead_url}" target="_blank" rel="noopener">Order Ahead</a></p>`:""}
    </div>`).join("");
  content.innerHTML = `<div class="ao-grid">${items}</div>`;
})();
'@
      $schema | Set-Content -Encoding UTF8 "widgets/$w/schema.json"
      $sample | Set-Content -Encoding UTF8 "widgets/$w/sample.json"
      $sample | Set-Content -Encoding UTF8 "data/ATL/$w.json"
      $widget | Set-Content -Encoding UTF8 "widgets/$w/widget.js"
    }

    "parking" {
$schema = @'
{ "airport":"IATA","updated":"ISO-8601",
  "carparks":[{"name":"North Garage","capacity":2500,"occupied":1900,"status":"limited","price_per_hour":4.0,"book_url":"","directions_url":"","notes":"EV on L2"}]
}
'@
$sample = @'
{ "airport":"ATL","updated":"2025-08-24T14:00:00Z",
  "carparks":[
    {"name":"North Garage","capacity":2500,"occupied":1900,"status":"limited","price_per_hour":4.0,"book_url":"","directions_url":"https://maps.google.com/?q=ATL+North+Garage","notes":"EV on L2"},
    {"name":"Economy Lot","capacity":3000,"occupied":2800,"status":"limited","price_per_hour":2.0,"book_url":"","directions_url":"https://maps.google.com/?q=ATL+Economy+Lot","notes":""}
  ]
}
'@
$widget = @'
import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/parking.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const rows = (data.carparks||[]).map(p=>{
    const pct = (p.capacity && p.occupied>=0) ? Math.round((p.occupied/p.capacity)*100) : null;
    return `<tr>
      <td>${p.name}</td><td>${p.status||""}${pct -ne $null ? ` (${pct}%)` : ""}</td>
      <td>$${p.price_per_hour?.toFixed(2)??"—"}/hr</td>
      <td>${p.notes||""}</td>
      <td>${p.book_url?`<a href="${p.book_url}" target="_blank" rel="noopener">Book</a>`:""}
          ${p.directions_url?` <a href="${p.directions_url}" target="_blank" rel="noopener">Directions</a>`:""}</td>
    </tr>`;
  }).join("");
  content.innerHTML = `<table class="ao-table"><thead><tr><th>Car Park</th><th>Status</th><th>Price</th><th>Notes</th><th>Links</th></tr></thead><tbody>${rows}</tbody></table>`;
})();
'@
      $schema | Set-Content -Encoding UTF8 "widgets/$w/schema.json"
      $sample | Set-Content -Encoding UTF8 "widgets/$w/sample.json"
      $sample | Set-Content -Encoding UTF8 "data/ATL/$w.json"
      $widget | Set-Content -Encoding UTF8 "widgets/$w/widget.js"
    }

    "lounges" {
$schema = @'
{ "airport":"IATA","updated":"ISO-8601",
  "lounges":[{"name":"Delta Sky Club","terminal":"A","near_gate":"A17","day_pass":true,"book_url":"","busy_level":"medium","amenities":["Wi-Fi","Showers"],"hours":"05:00–22:00"}]
}
'@
$sample = @'
{ "airport":"ATL","updated":"2025-08-24T14:00:00Z",
  "lounges":[
    {"name":"Delta Sky Club","terminal":"A","near_gate":"A17","day_pass":true,"book_url":"","busy_level":"high","amenities":["Wi-Fi","Showers"],"hours":"05:00–22:00"},
    {"name":"The Club ATL","terminal":"F","near_gate":"F10","day_pass":true,"book_url":"","busy_level":"low","amenities":["Snacks","Drinks"],"hours":"06:00–21:00"}
  ]
}
'@
$widget = @'
import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/lounges.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const cards = (data.lounges||[]).map(l=>`
    <div class="ao-card">
      <h3>${l.name}</h3>
      <div>Terminal ${l.terminal||""} · ${l.near_gate?("Gate "+l.near_gate):""}</div>
      <div>Busy: <span class="ao-badge">${l.busy_level||"n/a"}</span></div>
      <div>${(l.amenities||[]).join(" · ")}</div>
      <div>${l.hours||""}</div>
      ${l.book_url?`<p><a href="${l.book_url}" target="_blank" rel="noopener">Book Now</a></p>`:""}
    </div>`).join("");
  content.innerHTML = `<div class="ao-grid">${cards}</div>`;
})();
'@
      $schema | Set-Content -Encoding UTF8 "widgets/$w/schema.json"
      $sample | Set-Content -Encoding UTF8 "widgets/$w/sample.json"
      $sample | Set-Content -Encoding UTF8 "data/ATL/$w.json"
      $widget | Set-Content -Encoding UTF8 "widgets/$w/widget.js"
    }

    "transport" {
$schema = @'
{ "airport":"IATA","updated":"ISO-8601",
  "options":[{"mode":"train","name":"MARTA Red Line","destinations":["Downtown","Midtown"],"frequency_mins":10,"first_last":"05:00–01:00","book_url":"","info_url":""}]
}
'@
$sample = @'
{ "airport":"ATL","updated":"2025-08-24T14:00:00Z",
  "options":[
    {"mode":"train","name":"MARTA Red Line","destinations":["Downtown","Midtown"],"frequency_mins":10,"first_last":"05:00–01:00","info_url":"https://itsmarta.com"},
    {"mode":"rideshare","name":"Uber/Lyft","destinations":["Metro ATL"],"frequency_mins":0,"first_last":"24/7","book_url":"https://m.uber.com"}
  ]
}
'@
$widget = @'
import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/transport.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const rows = (data.options||[]).map(o=>`
    <tr>
      <td>${o.mode}</td><td>${o.name}</td><td>${(o.destinations||[]).join(", ")}</td>
      <td>${o.frequency_mins??"—"} min</td><td>${o.first_last||""}</td>
      <td>${o.book_url?`<a href="${o.book_url}" target="_blank" rel="noopener">Book</a>`:""}
          ${o.info_url?` <a href="${o.info_url}" target="_blank" rel="noopener">Info</a>`:""}</td>
    </tr>`).join("");
  content.innerHTML = `<table class="ao-table"><thead><tr><th>Mode</th><th>Name</th><th>Destinations</th><th>Freq</th><th>Hours</th><th>Links</th></tr></thead><tbody>${rows}</tbody></table>`;
})();
'@
      $schema | Set-Content -Encoding UTF8 "widgets/$w/schema.json"
      $sample | Set-Content -Encoding UTF8 "widgets/$w/sample.json"
      $sample | Set-Content -Encoding UTF8 "data/ATL/$w.json"
      $widget | Set-Content -Encoding UTF8 "widgets/$w/widget.js"
    }

    "hotels" {
$schema = @'
{ "airport":"IATA","updated":"ISO-8601",
  "hotels":[{"name":"Airport Marriott","onsite":false,"rating":4.2,"address":"123 Example Rd","distance_km":1.4,"map_url":"","book_url":""}]
}
'@
$sample = @'
{ "airport":"ATL","updated":"2025-08-24T14:00:00Z",
  "hotels":[
    {"name":"Renaissance Concourse ATL","onsite":false,"rating":4.4,"address":"1 Hartsfield Center Pkwy","distance_km":1.2,"map_url":"https://maps.google.com","book_url":""},
    {"name":"Minute Suites (Airside)","onsite":true,"rating":4.1,"address":"Concourse B","distance_km":0.0,"map_url":"https://maps.google.com","book_url":""}
  ]
}
'@
$widget = @'
import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/hotels.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const cards = (data.hotels||[]).map(h=>`
    <div class="ao-card">
      <h3>${h.name}</h3>
      <div>${h.onsite?'<span class="ao-badge">Onsite</span>':'<span class="ao-badge">Offsite</span>'} · Rating ${h.rating??"N/A"}</div>
      <div>${h.address||""} · ${h.distance_km??"—"} km</div>
      <p>
        ${h.map_url?`<a href="${h.map_url}" target="_blank" rel="noopener">Map</a>`:""}
        ${h.book_url?` · <a href="${h.book_url}" target="_blank" rel="noopener">Book Now</a>`:""}
      </p>
    </div>`).join("");
  content.innerHTML = `<div class="ao-grid">${cards}</div>`;
})();
'@
      $schema | Set-Content -Encoding UTF8 "widgets/$w/schema.json"
      $sample | Set-Content -Encoding UTF8 "widgets/$w/sample.json"
      $sample | Set-Content -Encoding UTF8 "data/ATL/$w.json"
      $widget | Set-Content -Encoding UTF8 "widgets/$w/widget.js"
    }

    "guide" {
$schema = @'
{ "airport":"IATA","updated":"ISO-8601",
  "sections":[
    {"category":"Services","title":"Baggage Wrap","description":"Secure wrap service near A11","link":"","map_embed":""}
  ]
}
'@
$sample = @'
{ "airport":"ATL","updated":"2025-08-24T14:00:00Z",
  "sections":[
    {"category":"Services","title":"Baggage Wrap","description":"Secure wrap near A11","link":"","map_embed":""},
    {"category":"Amenities","title":"Nursing Room","description":"Private room with sink","link":"","map_embed":""}
  ]
}
'@
$widget = @'
import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/guide.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const groups = {};
  (data.sections||[]).forEach(s => { (groups[s.category] ||= []).push(s); });
  content.innerHTML = Object.keys(groups).map(cat => `
    <section class="ao-card">
      <h2>${cat}</h2>
      <ul>${groups[cat].map(s=>`<li><strong>${s.title}</strong> — ${s.description||""} ${s.link?`<a href="${s.link}" target="_blank" rel="noopener">More</a>`:""}</li>`).join("")}</ul>
    </section>`).join("");
})();
'@
      $schema | Set-Content -Encoding UTF8 "widgets/$w/schema.json"
      $sample | Set-Content -Encoding UTF8 "widgets/$w/sample.json"
      $sample | Set-Content -Encoding UTF8 "data/ATL/$w.json"
      $widget | Set-Content -Encoding UTF8 "widgets/$w/widget.js"
    }

    "faq" {
$schema = @'
{ "airport":"IATA","updated":"ISO-8601",
  "faqs":[
    {"q":"Where do I find TSA wait times?","a":"Check the airport app or TSA.gov. Signs at security show current queue times."},
    {"q":"Is there free Wi-Fi?","a":"Yes—look for the airport SSID and accept the terms."}
  ]
}
'@
$sample = @'
{ "airport":"ATL","updated":"2025-08-24T14:00:00Z",
  "faqs":[
    {"q":"Where do I find TSA wait times?","a":"Check the airport app or TSA.gov. Signs at security show current queue times."},
    {"q":"Is there free Wi-Fi?","a":"Yes—look for the ATL Free Wi-Fi network and accept the terms."},
    {"q":"Can I sleep at the airport?","a":"Minute Suites are available airside; quiet areas marked on the map."},
    {"q":"Where is rideshare pickup?","a":"Follow signs for Rideshare; exact locations vary by terminal."},
    {"q":"Are there water bottle fillers?","a":"Yes, near most restrooms; bring an empty bottle through security."},
    {"q":"How early should I arrive?","a":"2 hours domestic, 3 hours international (check airline guidance)."}
  ]
}
'@
$widget = @'
import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/faq.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const acc = (data.faqs||[]).map((f,i)=>`
    <details class="ao-card"${i<2?" open":""}>
      <summary><strong>${f.q}</strong></summary>
      <p>${f.a}</p>
    </details>`).join("");
  content.innerHTML = acc;
})();
'@
      $schema | Set-Content -Encoding UTF8 "widgets/$w/schema.json"
      $sample | Set-Content -Encoding UTF8 "widgets/$w/sample.json"
      $sample | Set-Content -Encoding UTF8 "data/ATL/$w.json"
      $widget | Set-Content -Encoding UTF8 "widgets/$w/widget.js"
    }
  }
}

# minimal airport config
@'
{ "ATL": { "name":"Hartsfield–Jackson Atlanta International", "lat": 33.6407, "lng": -84.4277, "tz": "America/New_York" } }
'@ | Set-Content -Encoding UTF8 "data/config.json"

Write-Host "✅ Scaffold complete. Next: Commit & Push in GitHub Desktop, then enable GitHub Pages."
