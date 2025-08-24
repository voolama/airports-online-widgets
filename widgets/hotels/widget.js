import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/hotels.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const cards = (data.hotels||[]).map(h=>`
    <div class="ao-card">
      <h3>${h.name}</h3>
      <div>${h.onsite?'<span class="ao-badge">Onsite</span>':'<span class="ao-badge">Offsite</span>'} Â· Rating ${h.rating??"N/A"}</div>
      <div>${h.address||""} Â· ${h.distance_km??"â€”"} km</div>
      <p>
        ${h.map_url?`<a href="${h.map_url}" target="_blank" rel="noopener">Map</a>`:""}
        ${h.book_url?` Â· <a href="${h.book_url}" target="_blank" rel="noopener">Book Now</a>`:""}
      </p>
    </div>`).join("");
  content.innerHTML = `<div class="ao-grid">${cards}</div>`;
})();
