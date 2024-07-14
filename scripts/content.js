function createQRCode(url) {
  const container = document.createElement("div");
  container.id = "qr-code-container";
  container.style.marginTop = "20px";

  const title = document.createElement("div");
  title.textContent = "Scan to Watch on Mobile";
  title.style.fontSize = "16px";
  title.style.marginBottom = "10px";
  title.style.textAlign = "left";

  const qrContainer = document.createElement("div");
  qrContainer.id = "qr-code";

  const qrCode = new QRCode(qrContainer, {
    text: url,
    width: 128,
    height: 128,
  });

  container.appendChild(title);
  container.appendChild(qrContainer);

  return container;
}

function getStartTimeInSeconds() {
  const startAtCheckbox = document.querySelector(
    "#start-at #start-at-checkbox"
  );
  const startAtInput = document.querySelector("#start-at input");

  if (
    startAtCheckbox &&
    startAtCheckbox.getAttribute("aria-checked") === "true" &&
    startAtInput
  ) {
    const startTime = startAtInput.value;
    if (startTime) {
      return timeToSeconds(startTime);
    }
  }
  return null;
}

const secondsPerMinute = 60;
const secondsPerHour = 3600;
const secondsPerDay = 86400;

function timeToSeconds(timestamp) {
  let digitsArray = timestamp.split(":").map((digit) => parseInt(digit));
  if (![2, 3, 4].includes(digitsArray.length)) {
    if (!(digitsArray.length === 1 && isNaN(digitsArray[0]))) {
      console.warn("Invalid timestamp.");
    }
    return 0;
  }
  if (digitsArray.some((value) => isNaN(value))) {
    console.warn("Invalid digits in timestamp.");
    return 0;
  }
  let secondsPerDigit = [secondsPerDay, secondsPerHour, secondsPerMinute, 1];

  return digitsArray.reduceRight(
    (prev, curr, idx) =>
      prev +
      curr * secondsPerDigit[idx + secondsPerDigit.length - digitsArray.length],
    0
  );
}

function updateQRCode() {
  const startTimeInSeconds = getStartTimeInSeconds();
  let videoUrl = window.location.href;
  if (startTimeInSeconds) {
    const url = new URL(videoUrl);
    url.searchParams.set("t", startTimeInSeconds);
    videoUrl = url.toString();
  }
  const qrCodeElement = document.getElementById("qr-code-container");
  if (qrCodeElement) {
    qrCodeElement.querySelector("#qr-code").innerHTML = "";
    new QRCode(qrCodeElement.querySelector("#qr-code"), {
      text: videoUrl,
      width: 128,
      height: 128,
    });
  }
}

function observeShareButton() {
  const shareButtonSelector =
    "#actions-inner #top-level-buttons-computed ytd-button-renderer button";
  const shareButtonSelector2 =
    "#actions-inner #top-level-buttons-computed yt-button-view-model button";

  function handleShareButtonClick(event) {
    const popupObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const popup = document.querySelector("ytd-popup-container #contents");
          if (popup && !document.getElementById("qr-code-container")) {
            popup.style.minHeight = "500px";

            setTimeout(() => {
              let videoUrl = window.location.href;
              const startTimeInSeconds = getStartTimeInSeconds();
              if (startTimeInSeconds) {
                const url = new URL(videoUrl);
                url.searchParams.set("t", startTimeInSeconds);
                videoUrl = url.toString();
              }

              if (!document.getElementById("qr-code-container")) {
                const qrCodeElement = createQRCode(videoUrl);
                popup.appendChild(qrCodeElement);

                setTimeout(() => {
                  popup.style.minHeight = "";
                }, 100);
              }

              let previousCheckboxState = false;
              let previousInputValue = "";

              const interval = setInterval(() => {
                const startAtCheckbox = document.querySelector(
                  "#start-at #start-at-checkbox"
                );
                const startAtInput = document.querySelector("#start-at input");

                if (startAtCheckbox && startAtInput) {
                  const currentCheckboxState =
                    startAtCheckbox.getAttribute("aria-checked") === "true";
                  const currentInputValue = startAtInput.value;

                  if (
                    currentCheckboxState !== previousCheckboxState ||
                    currentInputValue !== previousInputValue
                  ) {
                    previousCheckboxState = currentCheckboxState;
                    previousInputValue = currentInputValue;
                    updateQRCode();
                  }
                } else {
                  clearInterval(interval);
                }
              }, 500);

              popupObserver.disconnect();
            }, 500);
          }
        }
      });
    });

    popupObserver.observe(document.body, { childList: true, subtree: true });
  }

  function findShareButton() {
    const shareButton =
      document.querySelector(shareButtonSelector) ||
      document.querySelector(shareButtonSelector2);

    if (shareButton) {
      shareButton.addEventListener("click", handleShareButtonClick);
      return true;
    }

    return false;
  }

  const pollInterval = setInterval(() => {
    if (findShareButton()) {
      clearInterval(pollInterval);
    }
  }, 500);
}

observeShareButton();

let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    observeShareButton();
  }
}).observe(document, { subtree: true, childList: true });
