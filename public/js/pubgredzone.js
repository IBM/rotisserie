$(document).ready(function() {
  updateIframe();
  setInterval(updateIframe, 15000);

  /**
   * Updates webpage on a 15s interval if a new best stream is determined.
   */
  function updateIframe() {
    $.getJSON("/all", function(data) {
      let currentStream = $("#twitch_iframe").prop("src");
      top_result = data[0]
      console.log(currentStream);
      console.log(top_result);
      console.log((currentStream != top_result["stream_url"] ) )
      $("#streamer_name").text(top_result["stream_name"] + " - " + top_result["alive"]);
      if (currentStream != top_result["stream_url"] ) {
        $("#twitch_iframe").prop("src", top_result["stream_url"]);
      }
    });
  }
});

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
  $("#buttonFork").css("background", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#buttonFork").css("borderColor", "rgb(" +
      Math.floor(a1) + "," + Math.floor(b1) + "," + Math.floor(c1) + ")");
  $("#buttonView").css("color", "rgb(" +
      Math.floor(a) + "," + Math.floor(b) + "," + Math.floor(c) + ")");
  $("#buttonFork").css("color", "rgb(" +
      Math.floor(a) + "," + Math.floor(b) + "," + Math.floor(c) + ")");

  document.getElementById("navbar").style.boxShadow = "0 8px 6px -6px rgb(" +
      Math.floor(a2) + "," + Math.floor(b2) + "," + Math.floor(c2) + ")";
  document.getElementById("buttonView").style.boxShadow =
      "0 10px 6px -6px rgb(" +
      Math.floor(a2) + "," + Math.floor(b2) + "," + Math.floor(c2) + ")";
  document.getElementById("buttonFork").style.boxShadow =
      "0 10px 6px -6px rgb(" +
      Math.floor(a2) + "," + Math.floor(b2) + "," + Math.floor(c2) + ")";
};
