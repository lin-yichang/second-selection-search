function updateInstalledEngineList(engines, selectedEngine) {
  const installedEngineList = document.querySelector("#installedEngineList");
  installedEngineList.innerHTML = "";
  engines.forEach((engine) => {
    const li = document.createElement("li");
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "selectedEngine";
    input.value = engine.name;
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + engine.name));
    li.appendChild(label);
    installedEngineList.appendChild(li);
  });
  document.querySelector("form").elements["selectedEngine"].value = selectedEngine;
}

async function loadSettings() {
  const settings = await browser.storage.local.get([
    "searchType",
    "selectedEngine",
    "independentUrl",
  ]);
  if (typeof settings.searchType !== "string") {
    settings.searchType = "";
  }
  if (typeof settings.selectedEngine !== "string") {
    settings.selectedEngine = "";
  }
  if (typeof settings.independentUrl !== "string") {
    settings.independentUrl = "";
  }
  return settings;
}

function updateForm(settings) {
  const form = document.querySelector("form");

  form.elements["searchType"].value = settings.searchType;
  if (form.elements["searchType"].value !== settings.searchType) {
    form.elements["searchType"].forEach((radio) => {
      radio.checked = false;
    });
  }
  document.querySelectorAll("fieldset").forEach((fieldset) => {
    fieldset.disabled = !fieldset.elements[0].checked;
  });

  form.elements["selectedEngine"].value = settings.selectedEngine;

  form.elements["independentUrl"].value = settings.independentUrl;
}

function readSettingsFromForm() {
  const form = document.querySelector("form");
  const searchType = form.elements["searchType"].value;
  const selectedEngine = form.elements["selectedEngine"].value;
  const independentUrl = form.elements["independentUrl"].value;
  return { searchType, selectedEngine, independentUrl };
}

function validateSettings(settings, installedEngines) {
  if (settings.searchType === "independent") {
    if (!settings.independentUrl.includes("%s")) {
      return {
        valid: false,
        message: "The search engine URL must include '%s' as a placeholder for the search term.",
      };
    }
    return { valid: true };
  } else if (settings.searchType === "installed") {
    if (!installedEngines.some((engine) => engine.name === settings.selectedEngine)) {
      return {
        valid: false,
        message: `The previously selected second search engine "${settings.selectedEngine}" is no longer available. Please select a new one from the list below.`,
      };
    }
    return { valid: true };
  } else {
    return {
      valid: false,
      message: "It looks like it's your first time using this extension. You need to set up a second search engine to get started.",
    };
  }
}

async function saveSettings(settings) {
  await browser.storage.local.set(settings);
}

let installedEngines = [];

async function init() {
  installedEngines = await browser.search.get();
  updateInstalledEngineList(installedEngines);
  let settings = await loadSettings();
  const validation = validateSettings(settings, installedEngines);
  if (!validation.valid) {
    document.querySelector("#message").textContent = validation.message;
  }
  // It would be extremely confusing and inconvenient if controls were
  // disabled and the user had to choose a search type first.
  if (!["installed", "independent"].includes(settings.searchType)) {
    settings = { ...settings, searchType: "installed" };
  }
  updateForm(settings);
  const saveButton = document.querySelector("#save");
  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    const settings = readSettingsFromForm();
    await saveSettings(settings);
    document.querySelector("#message").textContent = "";
  });
  function handleFormChange(e) {
    if (e.target.name === "searchType") {
      document.querySelectorAll("fieldset").forEach((fieldset) => {
        fieldset.disabled = !fieldset.elements[0].checked;
      });
    }
    saveButton.disabled = !validateSettings(readSettingsFromForm(), installedEngines).valid;
  }
  document.querySelector("form").addEventListener("input", handleFormChange);
  document.querySelector("#refreshEngineList").addEventListener("click", async () => {
    installedEngines = await browser.search.get();
    updateInstalledEngineList(installedEngines, readSettingsFromForm().selectedEngine);
    if (readSettingsFromForm().selectedEngine === "") {
      saveButton.disabled = true;
    }
  });
}

init();