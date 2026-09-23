const $ = s => document.querySelector(s);
const DEF = {title:"",premise:"",genre:"Fantasy",tone:"Dark, atmospheric",pov:"Third person limited",tense:"Past",setting:"",rules:"",style:"",words:1200,characters:[],outline:[],chapters:[]};
let p = {...DEF, ...JSON.parse(localStorage.getItem("sf_project") || "{}")};
const save = () => localStorage.setItem("sf_project", JSON.stringify(p));
const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");
const status = t => $("#status").textContent = t;

const SYSTEM = "You are an award-winning novelist and ghostwriter. Write vivid, original prose with strong scenes, natural dialogue and consistent characters. Follow the story bible exactly. Output only the requested text, with no preamble or commentary.";

async function ask(prompt, max = 4000) {
  const key = $("#key").value.trim();
  if (!key) { $("#settings").open = true; throw new Error("Add your API key first."); }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body: JSON.stringify({model: $("#model").value.trim() || "claude-sonnet-5", max_tokens: max, system: SYSTEM, messages:[{role:"user",content:prompt}]})
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || r.status);
  return d.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
}

const bible = () => `TITLE: ${p.title}\nPREMISE / PLOT: ${p.premise}\nGENRE: ${p.genre}\nTONE / VIBE: ${p.tone}\nPOV: ${p.pov}  TENSE: ${p.tense}\nSETTING: ${p.setting}\nWORLD RULES / MUST-INCLUDE: ${p.rules}\nSTYLE NOTES: ${p.style}\nCHARACTERS:\n` +
  (p.characters.filter(c => c.name).map(c => `- ${c.name} (${c.role}): ${c.description}`).join("\n") || "(none given, invent fitting ones)");

async function makeOutline() {
  const n = +$("#nch").value || 8;
  const raw = await ask(`${bible()}\n\nPlan this story as exactly ${n} chapters with a strong arc (setup, escalation, climax, resolution). Return ONLY a JSON list like [{"title":"...","summary":"3-4 sentences of what happens"}].`);
  p.outline = JSON.parse(raw.replace(/^```(?:json)?|```$/gm, "").trim());
  p.chapters = [];
}

async function writeChapter(i, notes = "") {
  const done = p.chapters.slice(0, i).filter(Boolean);
  const recap = done.map((c, k) => `Ch ${k+1}: ${c.summary}`).join("\n") || "(this is the opening)";
  const tail = done.length ? done[done.length-1].text.slice(-1500) : "";
  const nxt = p.outline[i+1] ? `\nNEXT CHAPTER (do not cover yet): ${p.outline[i+1].summary}` : "\nThis is the FINAL chapter: give it a satisfying ending.";
  let prompt = `${bible()}\n\nSTORY SO FAR:\n${recap}\n\nEND OF PREVIOUS CHAPTER (continue smoothly):\n${tail}\n\nNOW WRITE CHAPTER ${i+1}: ${p.outline[i].title}\nWHAT HAPPENS: ${p.outline[i].summary}${nxt}\n\nLength: about ${p.words} words. Start with the chapter text directly (no title line).`;
  if (notes) prompt += `\n\nREADER NOTES TO APPLY: ${notes}`;
  const text = await ask(prompt, p.words * 2 + 500);
  const summary = await ask(`Summarize this chapter in 3 sentences, keeping names, key events and new facts:\n\n${text}`, 300);
  p.chapters[i] = {text, summary};
  save();
}

function render() {
  document.querySelectorAll("[data-k]").forEach(el => el.value = p[el.dataset.k]);
  $("#chars").innerHTML = p.characters.map((c, i) => `<div class="item">
    <input data-l="characters" data-i="${i}" data-f="name" placeholder="Name" value="${esc(c.name)}">
    <input data-l="characters" data-i="${i}" data-f="role" placeholder="Role (hero, rival...)" value="${esc(c.role)}">
    <textarea data-l="characters" data-i="${i}" data-f="description" rows="2" placeholder="Looks, personality, backstory">${esc(c.description)}</textarea>
    <button data-act="del" data-l="characters" data-i="${i}">Remove</button></div>`).join("");
  $("#outline").innerHTML = p.outline.map((o, i) => `<div class="item"><b>Chapter ${i+1}</b>
    <input data-l="outline" data-i="${i}" data-f="title" placeholder="Title" value="${esc(o.title)}">
    <textarea data-l="outline" data-i="${i}" data-f="summary" rows="3">${esc(o.summary)}</textarea>
    <button data-act="del" data-l="outline" data-i="${i}">Remove</button></div>`).join("");
  $("#chapters").innerHTML = p.outline.map((o, i) => {
    const c = p.chapters[i];
    return `<div class="item"><b>Chapter ${i+1}: ${esc(o.title)}</b>` + (c
      ? `<textarea class="chapter" data-ch="${i}">${esc(c.text)}</textarea>
         <input id="notes${i}" placeholder="Rewrite notes (e.g. more tension, shorter dialogue)">
         <button data-act="rewrite" data-i="${i}">🔁 Rewrite</button>`
      : `<br><button data-act="write" data-i="${i}">Write this chapter</button>`) + `</div>`;
  }).join("");
}

async function run(fn) {
  try { status("Working… this can take a minute."); await fn(); status("Done."); }
  catch (e) { status("Error: " + e.message); }
  save(); render();
}

const download = (name, text) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text])); a.download = name; a.click(); };

document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.k) p[t.dataset.k] = t.type === "number" ? +t.value : t.value;
  else if (t.dataset.l) p[t.dataset.l][t.dataset.i][t.dataset.f] = t.value;
  else if (t.dataset.ch) p.chapters[t.dataset.ch].text = t.value;
  else if (t.id === "key" || t.id === "model") localStorage.setItem("sf_" + t.id, t.value);
  save();
});

document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const i = +b.dataset.i, act = b.dataset.act;
  if (act === "addChar") { p.characters.push({name:"",role:"",description:""}); render(); }
  else if (act === "addCh") { p.outline.push({title:"",summary:""}); render(); }
  else if (act === "del") { p[b.dataset.l].splice(i, 1); if (b.dataset.l === "outline") p.chapters.splice(i, 1); render(); }
  else if (act === "outline") run(makeOutline);
  else if (act === "write") run(() => writeChapter(i));
  else if (act === "rewrite") run(() => writeChapter(i, $("#notes" + i).value));
  else if (act === "next") { const i = p.outline.findIndex((_, k) => !p.chapters[k]); if (i >= 0) run(() => writeChapter(i)); }
  else if (act === "all") run(async () => { for (let k = 0; k < p.outline.length; k++) if (!p.chapters[k]) { status(`Writing chapter ${k+1}/${p.outline.length}…`); await writeChapter(k); render(); } });
  else if (act === "exportMd") download((p.title || "story") + ".md", `# ${p.title}\n\n` + p.outline.map((o, k) => p.chapters[k] ? `## Chapter ${k+1}: ${o.title}\n\n${p.chapters[k].text}` : "").filter(Boolean).join("\n\n"));
  else if (act === "exportJson") download((p.title || "story") + ".json", JSON.stringify(p, null, 2));
  else if (act === "reset" && confirm("Start a new story? Save your project first.")) { p = JSON.parse(JSON.stringify(DEF)); save(); render(); }
});

$("#load").addEventListener("change", async e => { p = {...DEF, ...JSON.parse(await e.target.files[0].text())}; save(); render(); });
$("#key").value = localStorage.getItem("sf_key") || "";
$("#model").value = localStorage.getItem("sf_model") || "";
render();
