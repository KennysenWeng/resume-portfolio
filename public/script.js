const STORAGE_KEY = "resumePortfolioEditorData";
const SETTINGS_KEY = "resumePortfolioEditorSettings";
const API_RESUME_URL = "/api/resume";

const defaultData = {
  name: "",
  role: "",
  location: "",
  email: "",
  linkedin: "",
  github: "",
  intro: "",
  statOne: "",
  statTwo: "",
  statThree: "",
  skillOneTitle: "",
  skillOneText: "",
  skillTwoTitle: "",
  skillTwoText: "",
  skillThreeTitle: "",
  skillThreeText: "",
  jobOnePeriod: "",
  jobOneTitle: "",
  jobOneText: "",
  jobTwoPeriod: "",
  jobTwoTitle: "",
  jobTwoText: "",
  projectOneTitle: "",
  projectOneText: "",
  projectTwoTitle: "",
  projectTwoText: "",
  projectThreeTitle: "",
  projectThreeText: "",
  education: "",
  certificate: "",
  languages: ""
};

const highlightKeywords = [
  "5 年",
  "系統分析與開發",
  "獨立負責",
  "需求訪談",
  "流程分析",
  "資料庫",
  "API",
  "FHIR",
  "SDLC",
  "Software Development Life Cycle",
  "data structures",
  "algorithms",
  "PHP",
  "C#",
  "JavaScript",
  "Oracle",
  "MySQL",
  "MSSQL",
  "View",
  "Trigger",
  "GRANT",
  "crontab",
  "Docker",
  "ISO"
];

const form = document.querySelector("#resume-form");
const editorPanel = document.querySelector("#editor-panel");
const editorToggle = document.querySelector('[data-action="toggle-editor"]');
const fields = document.querySelectorAll("[data-field]");
const completionText = document.querySelector("[data-completion-text]");
const completionBar = document.querySelector("[data-completion-bar]");
const saveStatus = document.querySelector("[data-save-status]");
const themeButtons = document.querySelectorAll("[data-theme]");

async function loadServerData() {
  try {
    const response = await fetch(API_RESUME_URL);
    if (!response.ok) {
      throw new Error("Failed to load server data");
    }

    const payload = await response.json();
    return payload.data ? { ...defaultData, ...payload.data } : null;
  } catch {
    return null;
  }
}

function loadLocalData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultData, ...JSON.parse(saved) } : { ...defaultData };
  } catch {
    return { ...defaultData };
  }
}

let resumeData = loadLocalData();
let settings = loadSettings();

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { theme: "green", compact: false, editorOpen: false, englishVisible: false, ...JSON.parse(saved) } : { theme: "green", compact: false, editorOpen: false, englishVisible: false };
  } catch {
    return { theme: "green", compact: false, editorOpen: false, englishVisible: false };
  }
}

function splitStat(value) {
  const [number = "", label = ""] = String(value || "").split("|");
  return { number: number.trim(), label: label.trim() };
}

function getInitials(name) {
  const cleaned = String(name || "").trim();
  if (!cleaned) {
    return "CV";
  }

  const chineseChars = cleaned.match(/[\u4e00-\u9fff]/g);
  if (chineseChars?.length) {
    return chineseChars.length >= 3 ? chineseChars.slice(-2).join("") : chineseChars.join("");
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }

  return cleaned.slice(0, 2).toUpperCase();
}

function setLink(node, value, fallbackText) {
  const url = String(value || "").trim();
  const container = node.closest("dd") || node;
  node.textContent = url || fallbackText;
  node.href = url || "#";
  node.toggleAttribute("aria-disabled", !url);
  container.hidden = !url;
}

function appendHighlightedText(parent, text) {
  const matches = highlightKeywords
    .map((keyword) => ({ keyword, index: text.indexOf(keyword) }))
    .filter((match) => match.index >= 0)
    .sort((a, b) => a.index - b.index || b.keyword.length - a.keyword.length);

  let cursor = 0;

  matches.forEach(({ keyword, index }) => {
    if (index < cursor) {
      return;
    }

    if (index > cursor) {
      parent.appendChild(document.createTextNode(text.slice(cursor, index)));
    }

    const strong = document.createElement("strong");
    strong.className = "keyword";
    strong.textContent = keyword;
    parent.appendChild(strong);
    cursor = index + keyword.length;
  });

  if (cursor < text.length) {
    parent.appendChild(document.createTextNode(text.slice(cursor)));
  }
}

function renderTextWithEnglishToggle(node, value) {
  const text = String(value || "");
  const parts = text.split(/\n\s*\n/);
  const fragment = document.createDocumentFragment();

  parts.forEach((part, index) => {
    const paragraph = document.createElement("span");
    const trimmed = part.trim();
    const isEnglish = /^(Summary:|[A-Za-z][A-Za-z\s]+:)/.test(trimmed);

    paragraph.className = isEnglish ? "english-block" : "text-block";
    appendHighlightedText(paragraph, trimmed);
    fragment.appendChild(paragraph);

    if (index < parts.length - 1) {
      fragment.appendChild(document.createElement("br"));
    }
  });

  node.replaceChildren(fragment);
}

function renderPreview() {
  const statOne = splitStat(resumeData.statOne);
  const statTwo = splitStat(resumeData.statTwo);
  const statThree = splitStat(resumeData.statThree);
  const hasLinks = Boolean(String(resumeData.linkedin || "").trim() || String(resumeData.github || "").trim());

  const computed = {
    ...resumeData,
    initials: getInitials(resumeData.name),
    statOneNumber: statOne.number,
    statOneLabel: statOne.label,
    statTwoNumber: statTwo.number,
    statTwoLabel: statTwo.label,
    statThreeNumber: statThree.number,
    statThreeLabel: statThree.label
  };

  fields.forEach((node) => {
    const key = node.dataset.field;
    const value = computed[key] || "";

    if (key === "linkedin") {
      setLink(node, value, "LinkedIn");
      return;
    }

    if (key === "github") {
      setLink(node, value, "GitHub / Portfolio");
      return;
    }

    renderTextWithEnglishToggle(node, value);
  });

  document.querySelectorAll('[data-field-group="links"]').forEach((group) => {
    group.hidden = !hasLinks;
  });
}

function fillForm() {
  Object.entries(resumeData).forEach(([key, value]) => {
    const input = form.elements[key];
    if (input) {
      input.value = value;
    }
  });
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
  showSavedStatus();
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function showSavedStatus() {
  saveStatus.textContent = "已暫存";
  saveStatus.classList.remove("is-saving");
  saveStatus.classList.remove("is-error");
}

function showSavingStatus() {
  saveStatus.textContent = "暫存中";
  saveStatus.classList.add("is-saving");
  saveStatus.classList.remove("is-error");
}

function showFileSavedStatus(savedAt) {
  const time = savedAt ? new Date(savedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) : "";
  saveStatus.textContent = time ? `檔案已儲存 ${time}` : "檔案已儲存";
  saveStatus.classList.remove("is-saving");
  saveStatus.classList.remove("is-error");
}

function showSaveErrorStatus() {
  saveStatus.textContent = "檔案儲存失敗";
  saveStatus.classList.remove("is-saving");
  saveStatus.classList.add("is-error");
}

function updateCompletion() {
  const controls = Array.from(form.elements).filter((control) => control.name);
  const filled = controls.filter((control) => control.value.trim()).length;
  const percent = Math.round((filled / controls.length) * 100);

  completionText.textContent = `${percent}%`;
  completionBar.style.width = `${percent}%`;
}

function applySettings() {
  document.body.dataset.theme = settings.theme;
  document.body.classList.toggle("is-compact", settings.compact);
  document.body.classList.toggle("editor-open", settings.editorOpen);
  document.body.classList.toggle("show-english", settings.englishVisible);
  editorPanel.setAttribute("aria-hidden", String(!settings.editorOpen));
  editorToggle.setAttribute("aria-expanded", String(settings.editorOpen));
  editorToggle.classList.toggle("active", settings.editorOpen);

  themeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === settings.theme);
  });

  const compactButton = document.querySelector('[data-action="compact"]');
  compactButton.classList.toggle("active", settings.compact);
  compactButton.textContent = settings.compact ? "標準" : "緊湊";

  const englishButton = document.querySelector('[data-action="toggle-english"]');
  englishButton.classList.toggle("active", settings.englishVisible);
  englishButton.setAttribute("aria-pressed", String(settings.englishVisible));
  englishButton.textContent = settings.englishVisible ? "隱藏英文" : "顯示英文";
}

function setEditorOpen(isOpen) {
  settings.editorOpen = isOpen;
  saveSettings();
  applySettings();
}

form.addEventListener("input", (event) => {
  const target = event.target;
  if (!target.name) {
    return;
  }

  resumeData[target.name] = target.value;
  showSavingStatus();
  saveData();
  renderPreview();
  updateCompletion();
});

document.querySelector('[data-action="print"]').addEventListener("click", () => {
  window.print();
});

document.querySelector('[data-action="save-file"]').addEventListener("click", async () => {
  showSavingStatus();

  try {
    const response = await fetch(API_RESUME_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: resumeData })
    });

    if (!response.ok) {
      throw new Error("Failed to save resume file");
    }

    const payload = await response.json();
    showFileSavedStatus(payload.savedAt);
  } catch {
    showSaveErrorStatus();
  }
});

document.querySelector('[data-action="compact"]').addEventListener("click", () => {
  settings.compact = !settings.compact;
  saveSettings();
  applySettings();
});

document.querySelector('[data-action="toggle-english"]').addEventListener("click", () => {
  settings.englishVisible = !settings.englishVisible;
  saveSettings();
  applySettings();
});

editorToggle.addEventListener("click", () => {
  setEditorOpen(!settings.editorOpen);
});

document.querySelectorAll('[data-action="close-editor"]').forEach((button) => {
  button.addEventListener("click", () => {
    setEditorOpen(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settings.editorOpen) {
    setEditorOpen(false);
  }
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    settings.theme = button.dataset.theme;
    saveSettings();
    applySettings();
  });
});

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.scrollTarget).scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

async function initialize() {
  const serverData = await loadServerData();
  if (serverData) {
    resumeData = serverData;
    saveData();
  }

  applySettings();
  fillForm();
  renderPreview();
  updateCompletion();
}

initialize();

