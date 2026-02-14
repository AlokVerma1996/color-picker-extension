const PICK_BUTTON = document.getElementById("pick");
const COLOR_BOX = document.getElementById("colorBox");
const TOAST = document.getElementById("toast");
const MEMORY_CONTAINER = document.getElementById("memory");
const STORAGE_KEY = "COLOR_MEMORY";


PICK_BUTTON.addEventListener("click", async () => {
  if (!window.EyeDropper) return;

  try {
    const EYE_DROPPER = new EyeDropper();
    const RESULT = await EYE_DROPPER.open();
    SET_COLOR_AND_SAVE(RESULT.sRGBHex.toUpperCase());

  } catch {}
});

function SET_COLOR(HEX) {
  const RGB = HEX_TO_RGB(HEX);
  const HSL = RGB_TO_HSL(RGB.R, RGB.G, RGB.B);

  COLOR_BOX.style.background = HEX;
  document.getElementById("hex").textContent = `HEX: ${HEX}`;
  document.getElementById("rgb").textContent = `RGB: ${RGB.R}, ${RGB.G}, ${RGB.B}`;
  document.getElementById("hsl").textContent = `HSL: ${HSL.H}, ${HSL.S}%, ${HSL.L}%`;
}

function SET_COLOR_AND_SAVE(HEX) {
  SET_COLOR(HEX);
  SAVE_TO_MEMORY(HEX);
}



document.querySelectorAll("[data-copy]").forEach(BUTTON => {
  BUTTON.addEventListener("click", () => {
    const ID = BUTTON.getAttribute("data-copy");
    const TEXT = document.getElementById(ID).textContent.split(": ")[1];
    navigator.clipboard.writeText(TEXT.toUpperCase());
    SHOW_TOAST();
  });
});

function SHOW_TOAST() {
  TOAST.classList.add("show");
  setTimeout(() => TOAST.classList.remove("show"), 800);
}

function HEX_TO_RGB(HEX) {
  const V = HEX.replace("#", "");
  return {
    R: parseInt(V.slice(0, 2), 16),
    G: parseInt(V.slice(2, 4), 16),
    B: parseInt(V.slice(4, 6), 16)
  };
}

function RGB_TO_HSL(R, G, B) {
  R /= 255; G /= 255; B /= 255;

  const MAX = Math.max(R, G, B);
  const MIN = Math.min(R, G, B);
  let H, S;
  const L = (MAX + MIN) / 2;

  if (MAX === MIN) {
    H = S = 0;
  } else {
    const D = MAX - MIN;
    S = L > 0.5 ? D / (2 - MAX - MIN) : D / (MAX + MIN);
    H =
      MAX === R ? (G - B) / D + (G < B ? 6 : 0) :
      MAX === G ? (B - R) / D + 2 :
                  (R - G) / D + 4;
    H *= 60;
  }

  return {
    H: Math.round(H),
    S: Math.round(S * 100),
    L: Math.round(L * 100)
  };
}

function SAVE_TO_MEMORY(HEX) {
  chrome.storage.local.get([STORAGE_KEY], RESULT => {
    let COLORS = RESULT[STORAGE_KEY] || [];

    COLORS = COLORS.filter(C => C !== HEX);
    COLORS.unshift(HEX);

    if (COLORS.length > 5) COLORS.pop();

    chrome.storage.local.set({ [STORAGE_KEY]: COLORS }, RENDER_MEMORY);
  });
}

function RENDER_MEMORY() {
  chrome.storage.local.get([STORAGE_KEY], RESULT => {
    const COLORS = RESULT[STORAGE_KEY] || [];
    MEMORY_CONTAINER.innerHTML = "";

    COLORS.forEach((HEX, INDEX) => {
      const ROW = document.createElement("div");
      ROW.className = "memory-row";

      ROW.innerHTML = `
        <div class="memory-left">
          <div class="memory-color" style="background:${HEX}"></div>
          <span class="memory-hex">${HEX}</span>
        </div>
        <span class="memory-delete" data-index="${INDEX}">×</span>
      `;

      // CLICK ROW → RESTORE COLOR
      ROW.addEventListener("click", () => {
        SET_COLOR(HEX);
      });

      // DELETE ICON (STOP PROPAGATION)
      ROW.querySelector(".memory-delete").addEventListener("click", (E) => {
        E.stopPropagation();
        DELETE_FROM_MEMORY(INDEX);
      });

      MEMORY_CONTAINER.appendChild(ROW);
    });
  });
}

function DELETE_FROM_MEMORY(INDEX) {
  chrome.storage.local.get([STORAGE_KEY], RESULT => {
    const COLORS = RESULT[STORAGE_KEY] || [];
    COLORS.splice(INDEX, 1);

    chrome.storage.local.set({ [STORAGE_KEY]: COLORS }, RENDER_MEMORY);
  });
}

// function ATTACH_DELETE_HANDLERS() {
//   document.querySelectorAll(".memory-delete").forEach(BTN => {
//     BTN.addEventListener("click", () => {
//       const INDEX = Number(BTN.dataset.index);

//       chrome.storage.local.get([STORAGE_KEY], RESULT => {
//         const COLORS = RESULT[STORAGE_KEY] || [];
//         COLORS.splice(INDEX, 1);

//         chrome.storage.local.set({ [STORAGE_KEY]: COLORS }, RENDER_MEMORY);
//       });
//     });
//   });
// }

RENDER_MEMORY();
