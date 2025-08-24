const qs = new URLSearchParams(location.search);
export const AIRPORT = qs.get("airport") || "ATL";
export const THEME = qs.get("theme") || "light";

export async function loadJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}
export function byId(id){ return document.getElementById(id); }
export function setTitle(text){ const el=document.getElementById("title"); if(el) el.textContent=text; }
export function makeSearchInput(ph="Search..."){ const i=document.createElement("input"); i.type="search"; i.placeholder=ph; i.id="ao-search"; return i; }
export function sortTable(table, colIndex, asc=true){
  const rows=[...table.tBodies[0].rows];
  rows.sort((a,b)=>{
    const A=a.cells[colIndex].textContent.trim().toLowerCase();
    const B=b.cells[colIndex].textContent.trim().toLowerCase();
    return asc ? A.localeCompare(B) : B.localeCompare(A);
  });
  rows.forEach(r=>table.tBodies[0].appendChild(r));
}
