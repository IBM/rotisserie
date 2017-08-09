
 $( document ).ready( function () {
    var current_stream = ""
    updateIframe();
    setInterval(updateIframe, 15000);
    function updateIframe() {
      $.getJSON( "/current", function ( data ) {
      console.log(current_stream);
          if (current_stream != data['stream_url']) {
            $("#twitch_iframe").prop('src', data['stream_url']);
            current_stream = data['scream_url']
          }
      });
    }
 });
