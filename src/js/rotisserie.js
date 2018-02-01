window.onload = () => {
  updateIframe();
  setInterval(updateIframe, 15000);
};

let data = {};
let currentStreamName = "";

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
 * Determine if to pin or unpin stream
 * @param {bool} pinStreamBool - boolean to pin or unpin stream
 */
function pinStream(pinStreamBool) {
  let element = document.getElementById("buttonPin");
  const white = "rgb(255, 255, 255)";
  const green = "rgb(0, 170, 94)";
  if (pinStreamBool) {
    element.value = "on";
    element.innerHTML = "Unpin Stream";
    element.style.backgroundColor = green;
    element.style.color = white;
  } else {
    element.value = "off";
    element.innerHTML = "Pin Stream";
    element.style.backgroundColor = white;
    element.style.color = green;
  }
}

/**
 * Set current and closest stream
 * @param {array} data - array of streams
 * @param {int} index - index of current stream
 * @param {string} type - determines if we need to pin stream
 */
function setStream(data, index, type) {
  let currentStreamSrc = document.getElementById("twitch_iframe").src;
  let currentStream = data[index];
  currentStreamName = currentStream["stream_name"];
  document.getElementById("streamer_name").innerHTML =
  `${currentStream["stream_name"]} - ${currentStream["alive"]}`;
  let closestStreamIndex = index + 1;
  const closestStream = data[closestStreamIndex];
  document.getElementById("next_closest").innerHTML =
    `${closestStream["stream_name"]} - ${closestStream["alive"]}`;
  if (currentStreamSrc !== currentStream["stream_url"]) {
    document.getElementById("twitch_iframe").src = currentStream["stream_url"];
  }
  if (closestStreamIndex === (data.length - 1)) {
    document.getElementsByClassName("container__streamer-closest")[0]
      .style.visibility = "hidden";
  } else {
    document.getElementsByClassName("container__streamer-closest")[0]
      .style.visibility = "visible";
  }
  if (type === "pin") {
    pinStream(true);
  }
  let previousSteamIndex = index - 1;
  if (previousSteamIndex >= 0) {
    const previousStream = data[previousSteamIndex];
    document.getElementById("previous_stream").innerHTML =
    `${previousStream["stream_name"]} - ${previousStream["alive"]}`;
    document.getElementsByClassName("container__streamer-back")[0]
      .style.visibility = "visible";
  } else {
    document.getElementsByClassName("container__streamer-back")[0]
      .style.visibility = "hidden";
  }
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
      data = JSON.parse(xhr.response);
      setStream(data, 0, "set");
      document.getElementsByClassName("container__streamer-closest")[0]
        .style.visibility = "visible";
      document.getElementsByClassName("container__streamer-back")[0]
        .style.visibility = "hidden";
    }
  };
  xhr.open(options.method, options.url);
  xhr.send();
};

/**
 * Apply colors to buttons
 * @param {int} a - value of a
 * @param {int} b - value of b
 * @param {int} c - value of c
 * @param {string} white - rgb for white
 * @param {string} green - rgb for green
 *  @param {string} abcColor - rgb for a,b,c
 * @param {array} buttonItems - array of buttons
 */
function changeButtonColor(a, b, c, white, green, abcColor, buttonItems) {
  if (a !== 255 && b !== 255 && c !== 255) {
    buttonItems[0].style.backgroundColor = green;
    buttonItems[0].style.color = abcColor;
    buttonItems[1].style.backgroundColor = green;
    buttonItems[2].style.backgroundColor = green;
    buttonItems[1].getElementsByTagName("a")[0].style.color = abcColor;
    buttonItems[2].getElementsByTagName("a")[0].style.color = abcColor;
  } else {
    buttonItems[0].style.backgroundColor = white;
    buttonItems[0].style.color = green;
    buttonItems[1].style.backgroundColor = white;
    buttonItems[2].style.backgroundColor = white;
    buttonItems[1].getElementsByTagName("a")[0].style.color = green;
    buttonItems[2].getElementsByTagName("a")[0].style.color = green;
  }
}

/**
 * Apply text color
 * @param {string} element - html element
 *  @param {string} color - color to change to
 */
function changeTextColor(element, color) {
  for (let i = 0; i < element.length; i++) {
    element[i].style.color = color;
  }
}

// listen for user click on pin stream button
document.getElementById("buttonPin").addEventListener("click", () => {
  let element = document.getElementById("buttonPin");
  let pinned= element.value;
  if (pinned === "off") {
    pinStream(true);
  } else {
    pinStream(false);
  }
});

// listen for user click to view next closest stream
document.getElementsByClassName("container__streamer-closest")[0]
  .addEventListener("click", () => {
    let currentStreamIndex = data.findIndex((dataObj) => {
      return dataObj.stream_name === currentStreamName
      ;
    });
    let newStreamIndex = currentStreamIndex + 1;
    setStream(data, newStreamIndex, "pin");
  });

// listen for user click to view previous stream
document.getElementsByClassName("container__streamer-back")[0]
  .addEventListener("click", () => {
    let currentStreamIndex = data.findIndex((dataObj) => {
      return dataObj.stream_name === currentStreamName
      ;
    });
    let newStreamIndex = currentStreamIndex - 1;
    setStream(data, newStreamIndex, "pin");
  });

// listen for user to change range
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
  const contact = document.getElementById("contact");
  const buttons = document.getElementById("container__button");
  const buttonItems = buttons.getElementsByTagName("button");
  const contactUs = document.getElementById("contactUs");
  const contactLinks = contact.getElementsByTagName("a");

  document.body.style.backgroundColor = green;
  navbar.style.backgroundColor = white;
  navbar.style.border = white;
  navbar.style.color = green;
  about.style.backgroundColor = white;
  about.style.border = white;
  about.style.color = green;
  contact.style.color = white;
  contactUs.style.borderRight = `2px solid ${white}`;

  changeTextColor(contactLinks, white);
  changeTextColor(navbarLinks, green);
  changeButtonColor(a, b, c, "rgb(255, 255, 255)",
    "rgb(0, 170, 94)", white, buttonItems);
});
