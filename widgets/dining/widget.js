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
      <div>${o.location_desc||""} ${o.near_gate?("Â· Gate "+o.near_gate):""}</div>
      <div>Rating: ${o.rating??"N/A"} ${o.open_now?'<span class="ao-badge">Open</span>':'<span class="ao-badge">Closed</span>'}</div>
      ${o.order_ahead_url?`<p><a href="${o.order_ahead_url}" target="_blank" rel="noopener">Order Ahead</a></p>`:""}
    </div>`).join("");
  content.innerHTML = `<div class="ao-grid">${items}</div>`;
})();
