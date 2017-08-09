
 $( document ).ready( function () {
    updateIframe();
    setInterval(updateIframe, 15000);
    function updateIframe() {
      $.getJSON( "/current", function ( data ) {
          var current_stream =  $("#twitch_iframe").prop('src');
          console.log(current_stream);
          if (current_stream != data['stream_url']) {
            $("#twitch_iframe").prop('src', data['stream_url']);
            $("#streamer_name").text(data['stream_name']);
          }
      });
    }
 });
