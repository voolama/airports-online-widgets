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
