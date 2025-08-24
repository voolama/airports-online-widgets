import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/parking.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const rows = (data.carparks||[]).map(p=>{
    const pct = (p.capacity && p.occupied>=0) ? Math.round((p.occupied/p.capacity)*100) : null;
    return `<tr>
      <td>${p.name}</td><td>${p.status||""}${pct!==null?` (${pct}%)`:""}</td>
      <td>$${p.price_per_hour?.toFixed(2)??"â€”"}/hr</td>
      <td>${p.notes||""}</td>
      <td>${p.book_url?`<a href="${p.book_url}" target="_blank" rel="noopener">Book</a>`:""}
          ${p.directions_url?` <a href="${p.directions_url}" target="_blank" rel="noopener">Directions</a>`:""}</td>
    </tr>`;
  }).join("");
  content.innerHTML = `<table class="ao-table"><thead><tr><th>Car Park</th><th>Status</th><th>Price</th><th>Notes</th><th>Links</th></tr></thead><tbody>${rows}</tbody></table>`;
})();
