window.appStates = {};
window.appRefs = {};
function getState(key, initialSetup) {
  if (!Object.keys(window.appStates).includes(key) && !initialSetup)
    throw `getState Error: ${key} does not exist in window.appStates`;
  return initialSetup
    ? undefined
    : JSON.parse(JSON.stringify(window.appStates[key]));
}
function setState(key, properties, values, triggerEvent = true) {
  let edited = getState(key);

  properties.forEach((property, i) => {
    if (edited[property] === undefined) {
      throw `setState Error: State of ${key}.${property} is not initialized.`;
    } else {
      edited[property] = JSON.parse(JSON.stringify(values[i]));
    }
  });

  saveState(key, edited, triggerEvent);
}

function saveState(key, data, triggerEvent = true, initialSetup = false) {
  window.appStates[key + "_prev"] = getState(key, initialSetup);
  window.appStates[key] = JSON.parse(JSON.stringify(data));
  if (triggerEvent) createOrTriggerStateInput(key);
}

function saveStateInLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function initializeState(key, data) {
  saveState(key, data, true, true);
}

function createOrTriggerStateInput(key) {
  let container = document.querySelector("#appStateInputs");
  let id = `${key}-state`;
  let thisElement = document.querySelector("#" + id);
  if (!thisElement) {
    let hiddenInput = document.createElement("input");
    hiddenInput.id = `${key}-state`;
    hiddenInput.type = "hidden";
    hiddenInput.setAttribute("value", uuidv4());
    container.appendChild(hiddenInput);
  } else {
    thisElement.setAttribute("value", uuidv4());
    thisElement.dispatchEvent(new Event("input"));
  }
}

function addToStateChangeEvent(key, properties, func) {
  let input = document.querySelector(`#${key}-state`);
  input.addEventListener("input", () => {
    const prevVal = getState(key + "_prev");
    const newVal = getState(key);

    let stateChanged = false;

    const changedProps = {};
    const propsToCheck =
      properties.length > 0
        ? properties
        : Object.keys(newVal).length > 0 // TODO: did that .length fuck state handling up in other places ?
        ? Object.keys(newVal)
        : null;

    if (propsToCheck) {
      for (const prop of propsToCheck) {
        let propChanged = !deepEqual(prevVal[prop], newVal[prop]);
        changedProps[prop] = propChanged;
        if (propChanged) stateChanged = true;
      }
    } else if (prevVal !== newVal) {
      stateChanged = true;
    }

    if (stateChanged) func(newVal, changedProps, prevVal);
  });
}

function setRef(key, ref) {
  window.appRefs[key] = ref;
}
function getRef(key) {
  return window.appRefs[key];
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

function deepEqual(x, y) {
  const ok = Object.keys,
    tx = typeof x,
    ty = typeof y;
  return x && y && tx === "object" && tx === ty
    ? ok(x).length === ok(y).length &&
        ok(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
}
