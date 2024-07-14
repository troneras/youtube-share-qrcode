console.log("Content script loaded.");

// Function to create QR code
function createQRCode(url) {
  console.log("Creating QR code for URL:", url);
  const qrContainer = document.createElement("div");
  qrContainer.id = "qr-code-container";
  const qrCode = new QRCode(qrContainer, {
    text: url,
    width: 128,
    height: 128,
  });
  console.log("QR code created:", qrContainer);
  return qrContainer;
}

// Function to append QR code to the share popup
function appendQRCode() {
  console.log("Attempting to append QR code.");

  // Selectors for the share buttons
  const shareButtonSelector =
    "#actions-inner #top-level-buttons-computed ytd-button-renderer button";
  const shareButtonSelector2 =
    "#actions-inner #top-level-buttons-computed yt-button-view-model button";

  // Polling function to find the share button
  function findShareButton() {
    const shareButton =
      document.querySelector(shareButtonSelector) ||
      document.querySelector(shareButtonSelector2);

    if (shareButton) {
      console.log("Share button found:", shareButton);

      shareButton.addEventListener("click", () => {
        console.log("Share button clicked.");
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
              const popup = document.querySelector(
                "ytd-popup-container #contents"
              );
              if (popup && !document.getElementById("qr-code-container")) {
                console.log("Share popup found:", popup);
                const videoUrl = window.location.href;
                const qrCodeElement = createQRCode(videoUrl);
                popup.appendChild(qrCodeElement);
                console.log("QR code appended to popup.");
                observer.disconnect(); // Stop observing once the QR code is added
              }
            }
          });
        });

        // Start observing the document for added nodes
        observer.observe(document.body, { childList: true, subtree: true });
      });

      return true; // Share button found, stop polling
    }

    console.log("Share button not found, retrying...");
    return false; // Share button not found, continue polling
  }

  // Poll for the share button every 500ms
  const pollInterval = setInterval(() => {
    if (findShareButton()) {
      clearInterval(pollInterval); // Stop polling once the share button is found
    }
  }, 500);
}

// Run the function to append QR code
appendQRCode();

// Re-run the function when the URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    console.log("URL changed:", currentUrl);
    lastUrl = currentUrl;
    appendQRCode();
  }
}).observe(document, { subtree: true, childList: true });
