// Create the offline popup element
var offlinePopup = document.createElement('div');
offlinePopup.className = 'offline-popup';
offlinePopup.innerHTML = '<span class="offline-popup-text">You are currently offline. Please check your internet connection.</span>';
document.body.appendChild(offlinePopup);

// CSS styles for the popup
var styles = `
  .offline-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f44336;
    color: white;
    text-align: center;
    font-size: 16px;
    z-index: 9999;
    display: none;
  }

  .offline-popup-text {
    padding: 15px;
  }

  /* Additional CSS styles for mobile users */
  @media only screen and (max-width: 600px) {
    .offline-popup {
      font-size: 14px;
    }

    .offline-popup-text {
      padding: 10px;
    }
  }
`;

// Create a style element and add the CSS styles
var styleElement = document.createElement('style');
styleElement.appendChild(document.createTextNode(styles));
document.head.appendChild(styleElement);

// Function to check online status and show/hide the popup
function checkOnlineStatus() {
  if (!navigator.onLine) {
    offlinePopup.style.display = 'flex';
  } else {
    offlinePopup.style.display = 'none';
  }
}

// Add event listeners to check the online status
window.addEventListener('load', checkOnlineStatus);
window.addEventListener('online', checkOnlineStatus);
window.addEventListener('offline', checkOnlineStatus);

// Check online status for mobile devices
window.addEventListener('pageshow', checkOnlineStatus);
window.addEventListener('pagehide', checkOnlineStatus);
window.addEventListener('resize', checkOnlineStatus);
window.addEventListener('orientationchange', checkOnlineStatus);