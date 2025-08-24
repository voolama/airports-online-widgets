import { AIRPORT, loadJSON } from "../../common/widget-utils.js";
(async function(){
  const path = `/data/${AIRPORT}/transport.json`;
  let data; try{ data=await loadJSON(path); }catch{ data=await loadJSON("./sample.json"); }
  const content = document.getElementById("content");
  const rows = (data.options||[]).map(o=>`
    <tr>
      <td>${o.mode}</td><td>${o.name}</td><td>${(o.destinations||[]).join(", ")}</td>
      <td>${o.frequency_mins??"â€”"} min</td><td>${o.first_last||""}</td>
      <td>${o.book_url?`<a href="${o.book_url}" target="_blank" rel="noopener">Book</a>`:""}
          ${o.info_url?` <a href="${o.info_url}" target="_blank" rel="noopener">Info</a>`:""}</td>
    </tr>`).join("");
  content.innerHTML = `<table class="ao-table"><thead><tr><th>Mode</th><th>Name</th><th>Destinations</th><th>Freq</th><th>Hours</th><th>Links</th></tr></thead><tbody>${rows}</tbody></table>`;
})();
