//Open or close the login dialog
var ToggleLoginDialog = function() {
  $("#LoginDialog").toggle("clip", 500);
};

//Open or close the Main overlay
var ToggleMainOverlay = function() {
  $("#LeftCorner").toggle("slide", {
    direction: 'left'
  }, 500);
  $("#RightCorner").toggle("slide", {
    direction: 'right'
  }, 500);
  $("#Title").toggle("slide", {
    direction: 'right'
  }, 500);
};

//Open or close the login dialog
var ToggleChat = function() {
  $("#messageContainer").toggle("slide", {
    direction: 'up'
  }, 100);
  $("#footer").toggle("slide", {
    direction: 'down'
  }, 500);
};

//Notification
function notifyMe(title, text, channel) {
  if ($('#notifications').is(":checked") && !document.hasFocus()) {
    if (typeof text != 'undefined') {
      notifySound.play();
      var Channel = channel;
      var notification = new Notification(title, { body: text,
        icon: 'https://toastystoemp.com/public/notifi-icon.png'
      });

      notification.onclick = function() {
        if (Channel)
          window.open('https://chat.toastystoemp.com/?' + Channel, '_blank');
        else
          window.focus()
      };
      setTimeout(function() {
        notification.close();
        notifications.splice(notifications.indexOf(notification), 1);
      }, 8000);
      notifications.push(notification);
    }
  }
}
