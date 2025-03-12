document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("input");
  const outputField = document.getElementById("output");
  const convertButton = document.getElementById("convert");
  const copyButton = document.getElementById("copy");

  // Capture and preserve rich text formatting on paste
  inputField.addEventListener("paste", function (event) {
      event.preventDefault();
      const clipboardData = event.clipboardData || window.clipboardData;
      if (clipboardData) {
          const htmlData = clipboardData.getData("text/html");
          const textData = clipboardData.getData("text/plain");
          
          if (htmlData) {
              inputField.insertAdjacentHTML("beforeend", htmlData);
          } else {
              inputField.textContent += textData;
          }
      }
  });

  convertButton.addEventListener("click", function () {
      const text = inputField.innerHTML; // Now captures raw HTML to preserve formatting
      fetch("/convert", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ text })
      })
      .then(response => response.json())
      .then(data => {
          outputField.textContent = data.dumbdown;
      })
      .catch(error => console.error("Error:", error));
  });

  copyButton.addEventListener("click", function () {
      navigator.clipboard.writeText(outputField.textContent).then(() => {
          alert("Copied to clipboard!");
      }).catch(error => console.error("Copy failed:", error));
  });
});
