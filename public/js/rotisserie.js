$(document).ready(function() {
  updateIframe();
  setInterval(updateIframe, 15000);

  /**
   * Updates webpage on a 15s interval if a new best stream is determined.
   */
  function updateIframe() {
    let pin = $("#buttonPin").attr("value");
    if (pin === "on") {
      return;
    }
    $.getJSON("/all", function(data) {
      let currentStream = $("#twitch_iframe").prop("src");
      let topResult = data[0];
      let secondResult = data[1];
      console.log(currentStream);
      console.log(topResult);
      console.log((currentStream != topResult["stream_url"]));

      $("#streamer_name").text(topResult["stream_name"]
        + " - " + topResult["alive"]);
      $("#next_closest").text(secondResult["stream_name"]
        + " - " + secondResult["alive"]);

      if (currentStream != topResult["stream_url"] && !(topResult >= 10)) {
        $("#twitch_iframe").prop("src", topResult["stream_url"]);
      }
    });
  }
});

$("#buttonPin").click(
  function() {
    let $this = $("#buttonPin");
    let pinned = $this.attr("value");
    if (pinned === "off") {
      $this.attr("value", "on");
      $this.text("Unpin Stream");
    } else {
      $this.attr("value", "off");
      $this.text("Pin Stream");
    }
  }
);

let slider = document.getElementById("myRange");

slider.oninput = function() {
  // body and button text color
  let a = (255 * this.value) / 100;
  let b = (255 * this.value) / 100;
  let c = (255 * this.value) / 100;
  // navbar and button - background,border color
  let a1 = (76 * this.value) / 100;
  let b1 = (175 * this.value) / 100;
  let c1 = (80 * this.value) / 100;
  // shadow color
  let a2 = (67 * this.value) / 100;
  let b2 = (160 * this.value) / 100;
  let c2 = (71 * this.value) / 100;
  document.body.style.backgroundColor = "rgb(" +
      Math.floor(a) + "," + Math.floor(b) + "," + Math.floor(c) + ")";

  $("#navbar").css("background", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#navbar").css("borderColor", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");

  $("#buttonView").css("background", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#buttonView").css("borderColor", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#buttonView").css("color", "rgb(" +
      Math.floor(a) + "," + Math.floor(b) + "," + Math.floor(c) + ")");

  $("#buttonFork").css("background", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#buttonFork").css("borderColor", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#buttonFork").css("color", "rgb(" +
      Math.floor(a) + "," + Math.floor(b) + "," + Math.floor(c) + ")");

  $("#buttonPin").css("background", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#buttonPin").css("borderColor", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#buttonPin").css("color", "rgb(" +
      Math.floor(a) + "," + Math.floor(b) + "," + Math.floor(c) + ")");

  document.getElementById("navbar").style.boxShadow = "0 8px 6px -6px rgb(" +
      Math.floor(a2) + "," + Math.floor(b2) + "," + Math.floor(c2) + ")";
  document.getElementById("buttonView").style.boxShadow =
      "0 10px 6px -6px rgb(" +
      Math.floor(a2) + "," + Math.floor(b2) + "," + Math.floor(c2) + ")";
  document.getElementById("buttonFork").style.boxShadow =
      "0 10px 6px -6px rgb(" +
      Math.floor(a2) + "," + Math.floor(b2) + "," + Math.floor(c2) + ")";
  document.getElementById("buttonPin").style.boxShadow =
      "0 10px 6px -6px rgb(" +
      Math.floor(a2) + "," + Math.floor(b2) + "," + Math.floor(c2) + ")";
};
