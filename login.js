document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
  
    const loginStatus = document.getElementById("loginStatus");
    loginStatus.textContent = "Logging in...";
  
    fetch("https://apitest.sales-buddy.in/api/loginV3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.user?.access_token) {
          chrome.storage.sync.set({ accessToken: data.user.access_token }, () => {
            loginStatus.textContent = "Login successful!";
            // Redirect to popup
            window.location.href = "popup.html";
          });
        } else {
          loginStatus.textContent = "Login failed: " + (data.message || "Unknown error");
        }
      })
      .catch(err => {
        loginStatus.textContent = "Error logging in.";
        console.error(err);
      });
  });
  