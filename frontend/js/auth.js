import { spotifyConfig } from "./config.js";

const loginButton = document.querySelector("#login-button");

if (loginButton) {
  loginButton.addEventListener("click", () => {
    console.log("TODO: start Spotify PKCE login flow", spotifyConfig);
    window.alert(
      "Next step: implement Spotify OAuth with PKCE in frontend/js/auth.js."
    );
  });
}
