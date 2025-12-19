import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

app.registerExtension({
  name: "Comfy.StopAndGo",
  async setup() {

    api.addEventListener("stop_and_go_trigger", (event) => {
      const { node_id, request_id } = event.detail;
      showStopAndGoDialog(node_id, request_id);
    });
  }
});

function showStopAndGoDialog(nodeId, requestId) {
  // Create the modal overlay
  const dialog = document.createElement("div");
  Object.assign(dialog.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
    zIndex: "10000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    color: "white",
    fontFamily: "sans-serif",
    pointerEvents: "none"
  });

  const content = document.createElement("div");
  Object.assign(content.style, {
    backgroundColor: "#222",
    padding: "20px",
    borderRadius: "10px",
    border: "1px solid #444",
    textAlign: "center",
    boxShadow: "0 0 20px rgba(0,0,0,0.5)",
    pointerEvents: "auto"
  });

  const message = document.createElement("h3");
  message.innerText = "⛔ Workflow Paused";
  message.style.marginTop = "0";

  const subtext = document.createElement("p");
  subtext.innerText = `Paused at Node #${nodeId}. Check your previews now.`;

  const buttonContainer = document.createElement("div");
  buttonContainer.style.marginTop = "20px";
  buttonContainer.style.display = "flex";
  buttonContainer.style.gap = "10px";
  buttonContainer.style.justifyContent = "center";


  const continueBtn = document.createElement("button");
  continueBtn.innerText = "✅ Continue";
  styleButton(continueBtn, "#28a745");
  continueBtn.onclick = () => sendResponse(requestId, "continue", dialog);


  const cancelBtn = document.createElement("button");
  cancelBtn.innerText = "🛑 Stop";
  styleButton(cancelBtn, "#dc3545");
  cancelBtn.onclick = () => sendResponse(requestId, "cancel", dialog);

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(continueBtn);
  content.appendChild(message);
  content.appendChild(subtext);
  content.appendChild(buttonContainer);
  dialog.appendChild(content);
  document.body.appendChild(dialog);
}

function styleButton(btn, color) {
  Object.assign(btn.style, {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: color,
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontWeight: "bold"
  });
}


async function sendResponse(requestId, action, dialogElement) {
  try {
    await api.fetchApi("/stop_and_go/respond", {
      method: "POST",
      body: JSON.stringify({ request_id: requestId, action: action }),
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("StopAndGo Error:", error);
  } finally {
    document.body.removeChild(dialogElement);
  }
}