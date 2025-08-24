// Airports Online · Flights Highlights (script-embed, no iframe)
// Usage in Duda: <div data-ao-flights data-airport="ATL"></div>
//                <script src="https://voolama.github.io/airports-online-widgets/widgets/flights/embed.js" async></script>
(function(){
  // ---- configuration --------------------------------------------------------
  const API_BASE = "https://bold-star-0549.dean-brown.workers.dev/flights"; // TODO: put your Worker URL
  const MAX_ROWS = 4;

  // ---- utility --------------------------------------------------------------
  function hhmmKey(h){ const m=/^(\d{1,2}):(\d{2})$/.exec(h||""); return m? (parseInt(m[1])*60+parseInt(m[2])): 24*60+1; }
  function prettyCity(s) {
    if (!s) return "";
    let t = s.toLowerCase();
    [" international"," municipal"," airport"," apt"," intl"," airpt"," air port"].forEach(n=>{ if(t.endsWith(n)) t=t.slice(0,-n.length); });
    t = t.split(/[\s-]/).map(w=>w? w[0].toUpperCase()+w.slice(1):w).join(" ");
    t = t.replace("Hartsfield-Jackson Atlanta","Atlanta")
         .replace("John F Kennedy","New York (JFK)")
         .replace("La Guardia","New York (LGA)")
         .replace("Logan","Boston (BOS)")
         .replace("Mc Carran","Las Vegas (LAS)")
         .replace("Sky Harbor","Phoenix (PHX)");
    return t;
  }
  function rowHTML(r){
    const status = (r.status||"").replace(/\b\w/g,c=>c.toUpperCase()) || "—";
    const gate = r.gate ? ("Gate "+r.gate) : "";
    const dest = prettyCity(r.city||"");
    return `<tr>
      <td>${r.time_local||""}</td>
      <td><strong>${r.flight_number||""}</strong><div class="meta">${r.airline||""}</div></td>
      <td>${dest}</td>
      <td class="meta">${gate}</td>
      <td><span class="status">${status}</span></td>
    </tr>`;
  }
  function deriveAirport(root){
    const explict = root.getAttribute("data-airport");
    if (explict && /^[A-Za-z]{3}$/.test(explict)) return explict.toUpperCase();
    const sub = location.hostname.split(".")[0];
    if (/^[A-Za-z]{3}$/i.test(sub)) return sub.toUpperCase();
    const m = location.pathname.match(/\/airport\/([a-z]{3})(?:\/|$)/i);
    return m ? m[1].toUpperCase() : "ATL";
  }

  // ---- render ---------------------------------------------------------------
  function template(airport){
    return `
      <style>
        :host{ all: initial; display:block; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
        .ao { padding: 8px 0; }
        .row { display:grid; grid-template-columns:1fr; gap:16px; }
        @media (min-width: 768px){ .row{ grid-template-columns:1fr 1fr; } }
        .card{ border:1px solid #e5e5e5; border-radius:12px; padding:14px; background:#fff; min-height:220px; }
        h3{ margin:0 0 8px; font-size:18px; }
        table{ width:100%; border-collapse:collapse; }
        td{ padding:6px 0; border-bottom:1px solid #f2f2f2; vertical-align:top; }
        td:first-child{ width:56px; font-weight:600; }
        .meta{ color:#555; font-size:13px; }
        .status{ display:inline-block; font-size:12px; border:1px solid #ddd; border-radius:999px; padding:2px 8px; }
        .cta{ margin-top:14px; display:flex; gap:12px; flex-wrap:wrap; }
        .button{ display:inline-block; padding:10px 14px; border-radius:10px; border:1px solid #222; text-decoration:none; color:#fff; background:#222; }
        .ghost{ background:#fff; color:#222; }
        .skeleton td{ color:transparent; background: linear-gradient(90deg,#f6f6f6 25%,#eee 37%,#f6f6f6 63%); background-size: 400% 100%; animation: sk 1.4s ease infinite; height:18px; }
        @keyframes sk{ 0%{background-position:100% 0} 100%{background-position:-100% 0} }
      </style>
      <div class="ao">
        <div class="row">
          <div class="card" id="card-dep">
            <h3>Next Departures (${airport})</h3>
            <table id="dep"><tbody>
              <tr class="skeleton"><td>00:00</td><td>DL0000</td><td>City</td><td class="meta">Gate</td><td class="status">—</td></tr>
              <tr class="skeleton"><td>00:00</td><td>DL0000</td><td>City</td><td class="meta">Gate</td><td class="status">—</td></tr>
              <tr class="skeleton"><td>00:00</td><td>DL0000</td><td>City</td><td class="meta">Gate</td><td class="status">—</td></tr>
              <tr class="skeleton"><td>00:00</td><td>DL0000</td><td>City</td><td class="meta">Gate</td><td class="status">—</td></tr>
            </tbody></table>
            <div class="cta">
              <a class="button" href="/flights/${airport.toLowerCase()}#departures">See all departures</a>
              <a class="button ghost" href="/flights/${airport.toLowerCase()}">Full flights page</a>
            </div>
          </div>
          <div class="card" id="card-arr">
            <h3>Next Arrivals (${airport})</h3>
            <table id="arr"><tbody>
              <tr class="skeleton"><td>00:00</td><td>DL0000</td><td>From</td><td class="meta">Gate</td><td class="status">—</td></tr>
              <tr class="skeleton"><td>00:00</td><td>DL0000</td><td>From</td><td class="meta">Gate</td><td class="status">—</td></tr>
              <tr class="skeleton"><td>00:00</td><td>DL0000</td><td>From</td><td class="meta">Gate</td><td class="status">—</td></tr>
              <tr class="skeleton"><td>00:00</td><td>DL0000</td><td>From</td><td class="meta">Gate</td><td class="status">—</td></tr>
            </tbody></table>
            <div class="cta">
              <a class="button" href="/flights/${airport.toLowerCase()}#arrivals">See all arrivals</a>
              <a class="button ghost" href="/flights/${airport.toLowerCase()}">Full flights page</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function render(root){
    const airport = deriveAirport(root);
    // Shadow DOM for isolation
    const shadowHost = document.createElement("ao-flights-panel");
    const shadow = shadowHost.attachShadow({ mode: "open" });
    shadow.innerHTML = template(airport);
    root.replaceWith(shadowHost); // swap the placeholder

    // Fetch live data
    try{
      const r = await fetch(`${API_BASE}?airport=${airport}`);
      if(!r.ok) throw new Error("API "+r.status);
      const data = await r.json();
      const deps = (data.departures||[]).sort((a,b)=> hhmmKey(a.time_local)-hhmmKey(b.time_local)).slice(0, MAX_ROWS);
      const arrs = (data.arrivals||[]).sort((a,b)=> hhmmKey(a.time_local)-hhmmKey(b.time_local)).slice(0, MAX_ROWS);
      shadow.querySelector("#dep tbody").innerHTML = deps.map(rowHTML).join("");
      shadow.querySelector("#arr tbody").innerHTML = arrs.map(rowHTML).join("");

      // Click anywhere on the card to navigate (progressive enhancement)
      shadow.querySelector("#card-dep")?.addEventListener("click", ()=>{ location.href = `/flights/${airport.toLowerCase()}#departures`; });
      shadow.querySelector("#card-arr")?.addEventListener("click", ()=>{ location.href = `/flights/${airport.toLowerCase()}#arrivals`; });
    }catch(err){
      console.warn("[AO flights embed] fallback:", err);
      shadow.querySelectorAll("#dep tbody, #arr tbody").forEach(tb => tb.innerHTML =
        `<tr><td colspan="5"><em>Live flight data temporarily unavailable.</em></td></tr>`);
    }
  }

  function boot(){
    // support multiple panels per page
    document.querySelectorAll('[data-ao-flights]').forEach(render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
