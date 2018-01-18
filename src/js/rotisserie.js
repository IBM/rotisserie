window.onload = () => {
  updateIframe();
  setInterval(updateIframe, 15000);
};

/**
 * Updates webpage on a 15s interval if a new best stream is determined.
 */
function updateIframe() {
  let pin = document.getElementById("buttonPin").value;
  if (pin === "on") {
    return;
  }
  getJSON();
}

/**
 * Call API to get JSON from server.
 */
function getJSON() {
  const options = {
    url: "/all",
    method: "GET",
  };

  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status == 200) {
      const data = JSON.parse(xhr.response);
      let currentStream = document.getElementById("twitch_iframe").src;
      let topResult = data[0];
      let secondResult = data[1];
      console.log(currentStream);
      console.log(topResult);
      console.log((currentStream != topResult["stream_url"]));

      document.getElementById("streamer_name").innerHTML =
        `${topResult["stream_name"]} - ${topResult["alive"]}`;
      document.getElementById("next_closest").innerHTML =
        `${secondResult["stream_name"]} - ${secondResult["alive"]}`;

      if (currentStream !== topResult["stream_url"]) {
        document.getElementById("twitch_iframe").src = topResult["stream_url"];
      }
    }
  };
  xhr.open(options.method, options.url);
  xhr.send();
};

document.getElementById("buttonPin").addEventListener("click", () => {
  let element = document.getElementById("buttonPin");
  let pinned= element.value;
  if (pinned === "off") {
    element.value = "on";
    element.innerHTML = "Unpin Stream";
  } else {
    element.value = "off";
    element.innerHTML = "Pin Stream";
  }
});

/**
 * Apply background and border color to buttons
 * @param {array} element - html element
 *  @param {string} backgroundColor - color to change background to
 * @param {string} borderColor - color to change border to
 */
function changeButtonColor(element, backgroundColor, borderColor) {
  for (let i = 0; i < element.length; i++) {
    element[i].style.backgroundColor = backgroundColor;
    element[i].style.border = borderColor;
  }
}

/**
 * Apply text color
 * @param {array} element - html element
 *  @param {string} color - color to change to
 */
function changeTextColor(element, color) {
  for (let i = 0; i < element.length; i++) {
    element[i].style.color = color;
  }
}

document.getElementById("myRange").addEventListener("input", (evt) => {
  const sliderValue = document.getElementById("myRange").value;
  // body and button text color
  let a = (255 * sliderValue) / 100;
  let b = (255 * sliderValue) / 100;
  let c = (255 * sliderValue) / 100;
  // navbar and button - background,border color
  let a1 = (0 * sliderValue) / 100;
  let b1 = (170 * sliderValue) / 100;
  let c1 = (94 * sliderValue) / 100;

  const white = `rgb(${Math.floor(a1)},
    ${Math.floor(b1)}, ${Math.floor(c1)})`;
  // original color is green
  const green = `rgb(${Math.floor(a)}, ${Math.floor(b)}, ${Math.floor(c)})`;

  const navbar = document.getElementById("navbar");
  const navbarLinks = navbar.getElementsByTagName("a");
  const about = document.getElementById("about");
  const streamerInformation = document.getElementById("container__streamer");
  const contact = document.getElementById("contact");
  const buttons = document.getElementById("container__button");
  const buttonItems = buttons.getElementsByTagName("button");
  buttonItems[1].getElementsByTagName("a")[0].style.color = green;
  buttonItems[2].getElementsByTagName("a")[0].style.color = green;
  const contactUs = document.getElementById("contactUs");
  const contactLinks = contact.getElementsByTagName("a");

  document.body.style.backgroundColor = green;
  navbar.style.backgroundColor = white;
  navbar.style.border = white;
  navbar.style.color = green;
  about.style.backgroundColor = white;
  about.style.border = white;
  about.style.color = green;
  streamerInformation.style.color = white;
  contact.style.color = white;
  contactUs.style.borderRight = `2px solid ${white}`;

  changeButtonColor(buttonItems, white, green);
  changeTextColor(buttonItems, green);
  changeTextColor(contactLinks, white);
  changeTextColor(navbarLinks, green);
});

