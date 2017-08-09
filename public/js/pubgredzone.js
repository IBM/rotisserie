$(document).ready(function() {
  updateIframe();
  setInterval(updateIframe, 15000);

  /**
   * Updates webpage on a 15s interval if a new best stream is determined and there are more than 15 players alive on the current stream
   */
  function updateIframe() {
    $.getJSON("/current", function(data) {
      let currentStream = $("#twitch_iframe").prop("src");
      console.log(currentStream);
      if (data['alive'] > 15) {
        if (currentStream != data["stream_url"]) {
          $("#twitch_iframe").prop("src", data["stream_url"]);
          $("#streamer_name").text(data["stream_name"] + " - " + data["alive"]);
        }
      }
    });
  }
});
