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
