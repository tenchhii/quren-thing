const ayahList = document.getElementById("ayahList");
const checkBtn = document.getElementById("checkBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const statusText = document.getElementById("status");
const viewSurahBtn = document.getElementById("viewSurahBtn");
const numberModeSwitch = document.getElementById("numberModeSwitch");
const closeSurahBtn = document.getElementById("closeSurahBtn");
const surahModal = document.getElementById("surahModal");
const fullSurah = document.getElementById("fullSurah");
const scoreEl = document.getElementById("score");
const percentEl = document.getElementById("percent");
const progressFill = document.getElementById("progressFill");

let readingFontSize = 32;
let originalAyahs = [];
let cards = [];
let draggedIndex = null;
let numberMode = false;
let verseTileMode = false;
let roundSize = 5;
let roundStart = 0;
let roundCorrect = false;
let roundSlots = [];
let tileBank = [];
let draggedTile = null;

// Verse Tile Mode containers
const slotArea = document.createElement("div");
slotArea.className = "verse-slot-area";
const tileBankArea = document.createElement("div");
tileBankArea.className = "verse-tile-bank";
ayahList.insertAdjacentElement("beforebegin", slotArea);
ayahList.insertAdjacentElement("afterend", tileBankArea);
slotArea.style.display = "none";
tileBankArea.style.display = "none";

// Verse Tile Mode controls
const verseModeBtn = document.createElement("button");
verseModeBtn.className = "secondary";
verseModeBtn.textContent = "Verse Tile Mode";
numberModeSwitch.insertAdjacentElement("afterend", verseModeBtn);

const roundSizeSelect = document.createElement("select");
roundSizeSelect.className = "secondary";
roundSizeSelect.style.padding = "12px";
roundSizeSelect.style.borderRadius = "10px";
roundSizeSelect.style.color = "var(--text)";
roundSizeSelect.style.background = "var(--panel)";
roundSizeSelect.style.border = "1px solid var(--border)";
for (let i = 5; i <= 10; i++) {
  const option = document.createElement("option");
  option.value = i;
  option.textContent = `${i} Ayahs per round`;
  roundSizeSelect.appendChild(option);
}
roundSizeSelect.style.display = "none";
verseModeBtn.insertAdjacentElement("afterend", roundSizeSelect);

const nextRoundBtn = document.createElement("button");
nextRoundBtn.className = "primary";
nextRoundBtn.textContent = "Next Round →";
nextRoundBtn.style.display = "none";
nextRoundBtn.disabled = true;
roundSizeSelect.insertAdjacentElement("afterend", nextRoundBtn);

function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function loadSurah() {
  try {
    statusText.textContent = "Loading Arabic text...";
    const response = await fetch("https://api.alquran.cloud/v1/surah/76");
    if (!response.ok) throw new Error("Could not load Quran text.");
    const data = await response.json();
    if (data.code !== 200 || !data.data?.ayahs) throw new Error("API returned an error.");
    originalAyahs = data.data.ayahs.map((ayah, index) => ({ id: index + 1, text: ayah.text }));
    startGame();
  } catch (error) {
    statusText.textContent = "Could not load text. Check your internet connection and refresh.";
    console.error(error);
  }
}

function startGame() {
  verseTileMode = false;
  roundCorrect = false;
  cards = shuffleArray(originalAyahs);
  checkBtn.disabled = false;
  shuffleBtn.disabled = false;
  roundSizeSelect.style.display = "none";
  nextRoundBtn.style.display = "none";
  slotArea.style.display = "none";
  tileBankArea.style.display = "none";
  ayahList.style.display = "flex";
  numberModeSwitch.textContent = numberMode ? "Arrange Mode" : "Number Mode";
  checkBtn.textContent = numberMode ? "Check answers" : "Check order";
  verseModeBtn.textContent = "Verse Tile Mode";
  statusText.textContent = numberMode ? "Enter the number of each ayah." : "Drag the cards into the correct order.";
  renderCards();
  updateStats(0);
}

function startVerseTileMode() {
  verseTileMode = true;
  numberMode = false;
  roundStart = 0;
  roundCorrect = false;
  numberModeSwitch.textContent = "Number Mode";
  checkBtn.textContent = "Check round";
  verseModeBtn.textContent = "Exit Verse Tile Mode";
  roundSize = Number(roundSizeSelect.value);
  roundSizeSelect.style.display = "inline-block";
  nextRoundBtn.style.display = "none";
  checkBtn.disabled = false;
  shuffleBtn.disabled = true;
  loadRound();
}

function loadRound() {
  const end = Math.min(roundStart + roundSize, originalAyahs.length);
  const roundAyahs = originalAyahs.slice(roundStart, end);
  roundSlots = new Array(roundAyahs.length).fill(null);
  tileBank = shuffleArray(roundAyahs);
  roundCorrect = false;
  nextRoundBtn.disabled = true;
  nextRoundBtn.style.display = "none";
  checkBtn.disabled = false;
  statusText.textContent = `Round ${Math.floor(roundStart / roundSize) + 1} · Arrange ayahs ${roundStart + 1}–${end}`;
  renderVerseTiles();
  updateStats(0);
}

function renderCards() {
  slotArea.style.display = "none";
  tileBankArea.style.display = "none";
  ayahList.style.display = "flex";
  ayahList.innerHTML = "";

  cards.forEach((ayah, index) => {
    const card = document.createElement("article");
    card.className = "ayah-card";
    card.draggable = !numberMode;
    card.dataset.index = index;

    const position = document.createElement("div");
    position.className = "position";
    position.textContent = index + 1;
    const content = document.createElement("div");
    content.className = "ayah-content";
    const arabic = document.createElement("p");
    arabic.className = "arabic";
    arabic.textContent = ayah.text;
    arabic.lang = "ar";
    arabic.dir = "rtl";
    content.appendChild(arabic);
    card.append(position, content);

    if (numberMode && !verseTileMode) {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.max = "31";
      input.placeholder = "#";
      input.className = "ayah-number-input";
      input.setAttribute("aria-label", `Number for card ${index + 1}`);
      card.appendChild(input);
    }

    if (!numberMode) {
      const controls = document.createElement("div");
      controls.className = "card-controls";
      const upBtn = document.createElement("button");
      upBtn.className = "move-btn";
      upBtn.textContent = "↑";
      upBtn.title = "Move up";
      upBtn.onclick = () => moveCard(index, -1);
      const downBtn = document.createElement("button");
      downBtn.className = "move-btn";
      downBtn.textContent = "↓";
      downBtn.title = "Move down";
      downBtn.onclick = () => moveCard(index, 1);
      controls.append(upBtn, downBtn);
      card.appendChild(controls);
    }

    if (!numberMode) {
      card.addEventListener("dragstart", () => { draggedIndex = index; card.classList.add("dragging"); });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        draggedIndex = null;
        document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
      });
      card.addEventListener("dragover", event => { event.preventDefault(); card.classList.add("drag-over"); });
      card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
      card.addEventListener("drop", event => {
        event.preventDefault();
        card.classList.remove("drag-over");
        if (draggedIndex === null || draggedIndex === index) return;
        const moved = cards.splice(draggedIndex, 1)[0];
        cards.splice(index, 0, moved);
        roundCorrect = false;
        nextRoundBtn.style.display = "none";
        renderCards();
        updateStats(0);
      });
    }
    ayahList.appendChild(card);
  });
}

function renderVerseTiles() {
  slotArea.innerHTML = "";
  tileBankArea.innerHTML = "";
  slotArea.style.display = "flex";
  tileBankArea.style.display = "block";
  ayahList.style.display = "none";

  const slotsTitle = document.createElement("h3");
  slotsTitle.textContent = "Your Order";
  slotsTitle.className = "verse-mode-title";
  slotArea.appendChild(slotsTitle);

  roundSlots.forEach((ayah, index) => {
    const slot = document.createElement("div");
    slot.className = "verse-slot";
    slot.dataset.slot = index;
    const number = document.createElement("span");
    number.className = "verse-slot-number";
    number.textContent = index + 1;
    slot.appendChild(number);
    if (ayah) slot.appendChild(createVerseTile(ayah, "slot", index));
    else {
      const placeholder = document.createElement("span");
      placeholder.className = "verse-slot-placeholder";
      placeholder.textContent = "Drop an ayah here";
      slot.appendChild(placeholder);
    }
    slot.addEventListener("dragover", event => { event.preventDefault(); slot.classList.add("drag-over"); });
    slot.addEventListener("dragleave", event => { if (!slot.contains(event.relatedTarget)) slot.classList.remove("drag-over"); });
    slot.addEventListener("drop", event => {
      event.preventDefault();
      slot.classList.remove("drag-over");
      if (!draggedTile) return;
      if (draggedTile.source === "bank") {
        const picked = tileBank.splice(draggedTile.index, 1)[0];
        if (!picked) return;
        const previous = roundSlots[index];
        roundSlots[index] = picked;
        if (previous) tileBank.push(previous);
      } else if (draggedTile.source === "slot") {
        const from = draggedTile.index;
        if (from === index) return;
        [roundSlots[index], roundSlots[from]] = [roundSlots[from], roundSlots[index]];
      }
      draggedTile = null;
      roundCorrect = false;
      checkBtn.disabled = false;
      nextRoundBtn.style.display = "none";
      renderVerseTiles();
      updateStats(0);
    });
    slotArea.appendChild(slot);
  });

  const bankTitle = document.createElement("h3");
  bankTitle.textContent = "Shuffled Ayahs";
  bankTitle.className = "verse-mode-title";
  tileBankArea.appendChild(bankTitle);
  const bankGrid = document.createElement("div");
  bankGrid.className = "verse-bank-grid";
  tileBank.forEach((ayah, index) => bankGrid.appendChild(createVerseTile(ayah, "bank", index)));
  tileBankArea.appendChild(bankGrid);
  tileBankArea.addEventListener("dragover", event => event.preventDefault());
  tileBankArea.addEventListener("drop", event => {
    event.preventDefault();
    if (!draggedTile || draggedTile.source !== "slot") return;
    const index = draggedTile.index;
    const ayah = roundSlots[index];
    if (!ayah) return;
    roundSlots[index] = null;
    tileBank.push(ayah);
    draggedTile = null;
    roundCorrect = false;
    checkBtn.disabled = false;
    nextRoundBtn.style.display = "none";
    renderVerseTiles();
    updateStats(0);
  });
}

function createVerseTile(ayah, source, index) {
  const tile = document.createElement("div");
  tile.className = "verse-tile";
  tile.draggable = true;
  const arabic = document.createElement("p");
  arabic.className = "arabic";
  arabic.textContent = ayah.text;
  arabic.lang = "ar";
  arabic.dir = "rtl";
  tile.appendChild(arabic);
  tile.addEventListener("dragstart", event => {
    draggedTile = { source, index };
    tile.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${source}:${index}`);
  });
  tile.addEventListener("dragend", () => { tile.classList.remove("dragging"); draggedTile = null; });
  return tile;
}

function moveCard(index, direction) {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= cards.length) return;
  const moved = cards.splice(index, 1)[0];
  cards.splice(newIndex, 0, moved);
  roundCorrect = false;
  nextRoundBtn.style.display = "none";
  renderCards();
  updateStats(0);
}

function checkOrder() {
  if (verseTileMode) {
    if (roundSlots.some(slot => slot === null)) {
      statusText.textContent = "Fill every slot first!";
      return;
    }
    let correctCount = 0;
    roundSlots.forEach((ayah, index) => {
      const slot = slotArea.querySelector(`.verse-slot[data-slot="${index}"]`);
      slot.classList.remove("correct", "incorrect");
      if (ayah.id === originalAyahs[roundStart + index].id) { slot.classList.add("correct"); correctCount++; }
      else slot.classList.add("incorrect");
    });
    updateStats(correctCount, roundSlots.length);
    if (correctCount === roundSlots.length) {
      roundCorrect = true;
      statusText.textContent = "Round complete! All correct!";
      nextRoundBtn.style.display = "inline-block";
      nextRoundBtn.disabled = false;
      checkBtn.disabled = true;
    } else {
      roundCorrect = false;
      statusText.textContent = `${correctCount} of ${roundSlots.length} correct. Try again!`;
      nextRoundBtn.style.display = "none";
      checkBtn.disabled = false;
    }
    return;
  }

  let correctCount = 0;
  cards.forEach((ayah, index) => {
    const card = ayahList.children[index];
    card.classList.remove("correct", "incorrect");
    let isCorrect;
    if (numberMode) isCorrect = Number(card.querySelector(".ayah-number-input").value) === ayah.id;
    else isCorrect = ayah.id === index + 1;
    if (isCorrect) { card.classList.add("correct"); correctCount++; }
    else card.classList.add("incorrect");
  });
  updateStats(correctCount, cards.length);
  statusText.textContent = correctCount === cards.length ? "All 31 ayahs are correct!" : `${correctCount} of ${cards.length} are correct.`;
}

function updateStats(correctCount, total = cards.length) {
  scoreEl.textContent = `${correctCount} / ${total}`;
  const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  percentEl.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;
}

function nextRound() {
  if (!roundCorrect) return;
  roundStart += roundSize;
  if (roundStart >= originalAyahs.length) {
    roundSlots = [];
    tileBank = [];
    slotArea.innerHTML = "";
    tileBankArea.innerHTML = "";
    nextRoundBtn.style.display = "none";
    checkBtn.disabled = true;
    statusText.textContent = "You completed all 31 ayahs! Mashallah!";
    updateStats(31, 31);
    return;
  }
  loadRound();
}

function switchMode() {
  if (verseTileMode) return;
  numberMode = !numberMode;
  numberModeSwitch.textContent = numberMode ? "Arrange Mode" : "Number Mode";
  checkBtn.textContent = numberMode ? "Check answers" : "Check order";
  statusText.textContent = numberMode ? "Enter the number of each ayah." : "Drag the cards into the correct order.";
  renderCards();
  updateStats(0);
}

function exitVerseTileMode() {
  verseTileMode = false;
  verseModeBtn.textContent = "Verse Tile Mode";
  roundSizeSelect.style.display = "none";
  nextRoundBtn.style.display = "none";
  numberMode = false;
  numberModeSwitch.textContent = "Number Mode";
  checkBtn.textContent = "Check order";
  startGame();
}

function showFullSurah() {
  if (originalAyahs.length === 0) {
    statusText.textContent = "Surah is still loading!";
    return;
  }
  fullSurah.replaceChildren();
  const fontControls = document.createElement("div");
  fontControls.className = "reading-controls";
  const smallerBtn = document.createElement("button");
  smallerBtn.textContent = "−";
  smallerBtn.className = "secondary";
  smallerBtn.title = "Decrease font size";
  const sizeLabel = document.createElement("span");
  const biggerBtn = document.createElement("button");
  biggerBtn.textContent = "+";
  biggerBtn.className = "secondary";
  biggerBtn.title = "Increase font size";
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  resetBtn.className = "secondary";
  fontControls.append(smallerBtn, sizeLabel, biggerBtn, resetBtn);
  fullSurah.appendChild(fontControls);
  const page = document.createElement("div");
  page.className = "surah-reading-page";
  fullSurah.appendChild(page);

  function renderReadingText() {
    page.replaceChildren();
    sizeLabel.textContent = `${readingFontSize}px`;
    originalAyahs.forEach(ayah => {
      const verse = document.createElement("span");
      verse.className = "surah-reading-ayah";
      verse.dir = "rtl";
      verse.lang = "ar";
      verse.style.fontSize = `${readingFontSize}px`;
      const text = document.createElement("span");
      text.textContent = ayah.text;
      const number = document.createElement("span");
      number.className = "reading-verse-number";
      number.textContent = ` ۞ ${ayah.id} `;
      verse.append(text, number);
      page.appendChild(verse);
    });
  }
  smallerBtn.onclick = () => { readingFontSize = Math.max(18, readingFontSize - 2); renderReadingText(); };
  biggerBtn.onclick = () => { readingFontSize = Math.min(60, readingFontSize + 2); renderReadingText(); };
  resetBtn.onclick = () => { readingFontSize = 32; renderReadingText(); };
  renderReadingText();
  surahModal.classList.add("open");
}

viewSurahBtn.addEventListener("click", showFullSurah);
closeSurahBtn.addEventListener("click", () => surahModal.classList.remove("open"));
surahModal.addEventListener("click", event => { if (event.target === surahModal) surahModal.classList.remove("open"); });
numberModeSwitch.addEventListener("click", switchMode);
checkBtn.onclick = checkOrder;
shuffleBtn.onclick = startGame;
verseModeBtn.addEventListener("click", () => { verseTileMode ? exitVerseTileMode() : startVerseTileMode(); });
roundSizeSelect.addEventListener("change", () => { if (!verseTileMode) return; roundSize = Number(roundSizeSelect.value); roundStart = 0; loadRound(); });
nextRoundBtn.addEventListener("click", nextRound);
loadSurah();
