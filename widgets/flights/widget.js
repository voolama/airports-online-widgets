import { AIRPORT, loadJSON, byId, setTitle, sortTable, makeSearchInput } from "../../common/widget-utils.js";

const API_BASE = `https://bold-star-0549.dean-brown.workers.dev/flights`; // ← set this
const STATUS_CLASS = {
  active: "ao-badge",
  scheduled: "ao-badge",
  boarding: "ao-badge",
  departed: "ao-badge",
  landed: "ao-badge",
  diverted: "ao-badge",
  cancelled: "ao-badge"
};

const CITY_NOISE = [
  " international", " municipal", " airport", " apt", " aéroport", " aerodrome",
  " intl", " airpt", " air port"
];

function prettyCity(s) {
  if (!s) return "";
  let t = s.toLowerCase();
  CITY_NOISE.forEach(n => { if (t.endsWith(n)) t = t.slice(0, -n.length); });
  // Title-case
  t = t.split(/[\s-]/).map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
  // special fixups
  t = t.replace("Hartsfield-Jackson Atlanta", "Atlanta")
       .replace("John F Kennedy", "New York (JFK)")
       .replace("La Guardia", "New York (LGA)")
       .replace("Logan", "Boston (BOS)")
       .replace("Mc Carran", "Las Vegas (LAS)")
       .replace("Sky Harbor", "Phoenix (PHX)")
       .replace("Westchester County", "Westchester (HPN)")
       .replace("Minneapolis - St. Paul", "Minneapolis–St Paul (MSP)");
  return t;
}

function hhmmToSortKey(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "");
  if (!m) return 24 * 60 + 1;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function groupCodeshares(list) {
  // Records often repeat the same time/gate for codeshares. Group by time+gate+city.
  const keyOf = r => [r.time_local || "", r.gate || "", r.city || "", r.flight_number || ""].join("|");
  const map = new Map();
  for (const r of list) {
    const k = [r.time_local || "", r.gate || "", r.city || ""].join("|");
    if (!map.has(k)) {
      map.set(k, { ...r, codeshares: r.flight_number ? [r.flight_number] : [] });
    } else {
      const g = map.get(k);
      if (r.flight_number && !g.codeshares.includes(r.flight_number)) g.codeshares.push(r.flight_number);
      // Prefer a major airline name if empty/short
      if (!g.airline && r.airline) g.airline = r.airline;
      // If one of the rows has a more specific city, keep the longer one
      if ((r.city || "").length > (g.city || "").length) g.city = r.city;
    }
  }
  return [...map.values()];
}

function applyFilters(rows, { q, airline, flight, city }) {
  q = (q || "").toLowerCase();
  airline = (airline || "").toLowerCase();
  flight = (flight || "").toLowerCase();
  city = (city || "").toLowerCase();

  return rows.filter(r => {
    const hay = (r.time_local + " " + r.flight_number + " " + (r.airline || "") + " " + (r.city || "") + " " + (r.gate || "")).toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (airline && !(r.airline || "").toLowerCase().includes(airline)) return false;
    if (flight && !(r.flight_number || "").toLowerCase().includes(flight)) return false;
    if (city && !(r.city || "").toLowerCase().includes(city)) return false;
    return true;
  });
}

function statusBadge(s) {
  const cls = STATUS_CLASS[(s || "").toLowerCase()] || "ao-badge";
  const text = (s || "").replace(/\b\w/g, c => c.toUpperCase());
  return `<span class="${cls}">${text || "—"}</span>`;
}

function renderTable(containerId, rows) {
  const content = byId(containerId);
  const sorted = [...rows].sort((a, b) => hhmmToSortKey(a.time_local) - hhmmToSortKey(b.time_local));

  const body = sorted.map(r => {
    const codeshares = (r.codeshares || []).filter(cs => cs !== r.flight_number);
    const shareText = codeshares.length ? ` <span class="ao-badge">+${codeshares.length} codeshares</span>` : "";
    return `<tr>
      <td>${r.time_local || ""}</td>
      <td><strong>${r.flight_number || ""}</strong>${shareText}<div>${r.airline || ""}</div></td>
      <td>${prettyCity(r.city)}</td>
      <td>${r.gate || ""}</td>
      <td>${statusBadge(r.status)}</td>
    </tr>`;
  }).join("");

  content.innerHTML = `
    <table class="ao-table" id="${containerId}-table">
      <thead>
        <tr>
          <th data-col="0">Time</th>
          <th data-col="1">Flight / Airline</th>
          <th data-col="2">City</th>
          <th data-col="3">Gate</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;

  // enable click-to-sort on the first 4 cols
  content.querySelectorAll("th[data-col]").forEach(th => {
    let asc = true;
    th.addEventListener("click", () => {
      sortTable(content.querySelector("table"), parseInt(th.dataset.col, 10), asc);
      asc = !asc;
    });
  });
}

(async function init(){
  setTitle("Flights");

  // Controls
  const controls = document.getElementById("controls");
  const search = makeSearchInput("Search (airline, flight #, city)");
  search.style.minWidth = "260px";

  const filterBar = document.createElement("div");
  filterBar.className = "ao-controls";
  filterBar.style.display = "flex";
  filterBar.style.gap = "8px";
  filterBar.style.flexWrap = "wrap";

  const selDir = document.createElement("select");
  selDir.innerHTML = `<option value="both">Departures & Arrivals</option>
                      <option value="departures">Departures</option>
                      <option value="arrivals">Arrivals</option>`;

  const inAirline = document.createElement("input");
  inAirline.placeholder = "Filter airline";

  const inFlight = document.createElement("input");
  inFlight.placeholder = "Filter flight #";

  const inCity = document.createElement("input");
  inCity.placeholder = "Filter city";

  filterBar.appendChild(selDir);
  filterBar.appendChild(inAirline);
  filterBar.appendChild(inFlight);
  filterBar.appendChild(inCity);

  controls.appendChild(search);
  controls.appendChild(filterBar);

  // Content
  const content = document.getElementById("content");
  content.innerHTML = `
    <section class="ao-card">
      <h2>Departures</h2>
      <div id="dep"></div>
    </section>
    <section class="ao-card">
      <h2>Arrivals</h2>
      <div id="arr"></div>
    </section>
  `;

  // Load data (Worker → fallback to local sample)
  let data;
  try {
    const url = `${API_BASE}?airport=${AIRPORT}&force=0`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`API ${res.status}`);
    data = await res.json();
  } catch (e) {
    console.warn("Live API failed, using sample:", e.message || e);
    data = await loadJSON("./sample.json");
  }

  // Normalise + group codeshares
  const deps = groupCodeshares((data.departures || []).map(x => ({ ...x })));
  const arrs = groupCodeshares((data.arrivals || []).map(x => ({ ...x })));

  // Render
  function doRender() {
    const filters = {
      q: search.value,
      airline: inAirline.value,
      flight: inFlight.value,
      city: inCity.value
    };

    const show = selDir.value;
    if (show !== "arrivals") {
      renderTable("dep", applyFilters(deps, filters));
      byId("dep").parentElement.style.display = "";
    } else {
      byId("dep").parentElement.style.display = "none";
    }

    if (show !== "departures") {
      renderTable("arr", applyFilters(arrs, filters));
      byId("arr").parentElement.style.display = "";
    } else {
      byId("arr").parentElement.style.display = "none";
    }
  }

  [search, selDir, inAirline, inFlight, inCity].forEach(el => el.addEventListener("input", doRender));
  doRender();
})();
