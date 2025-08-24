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
      <ul>${groups[cat].map(s=>`<li><strong>${s.title}</strong> â€” ${s.description||""} ${s.link?`<a href="${s.link}" target="_blank" rel="noopener">More</a>`:""}</li>`).join("")}</ul>
    </section>`).join("");
})();
