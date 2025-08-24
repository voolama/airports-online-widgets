import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/lounges.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const cards = (data.lounges||[]).map(l=>`
    <div class="ao-card">
      <h3>${l.name}</h3>
      <div>Terminal ${l.terminal||""} Â· ${l.near_gate?("Gate "+l.near_gate):""}</div>
      <div>Busy: <span class="ao-badge">${l.busy_level||"n/a"}</span></div>
      <div>${(l.amenities||[]).join(" Â· ")}</div>
      <div>${l.hours||""}</div>
      ${l.book_url?`<p><a href="${l.book_url}" target="_blank" rel="noopener">Book Now</a></p>`:""}
    </div>`).join("");
  content.innerHTML = `<div class="ao-grid">${cards}</div>`;
})();
