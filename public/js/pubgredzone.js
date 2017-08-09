$(document).ready(function() {
  updateIframe();
  setInterval(updateIframe, 15000);

  /**
   * Updates webpage on a 15s interval if a new best stream is determined.
   */
  function updateIframe() {
    $.getJSON("/current", function(data) {
      let currentStream = $("#twitch_iframe").prop("src");
      console.log(currentStream);
      if (currentStream != data["stream_url"]) {
        $("#twitch_iframe").prop("src", data["stream_url"]);
        $("#streamer_name").text(data["stream_name"]);
      }
    });
  }
});
