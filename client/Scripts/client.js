window.onload = function() {

  var ws;
  var myNick = "";
  var myChannel = window.location.search.replace(/^\?/, '');
  var onlineUsers = {};
  var ignoredUsers = [];
  var lastPoster = "";

  function join(channel) {
    if (document.domain == 'chat.toastystoemp.com') // For https://chat.toastystoemp.com/
      ws = new WebSocket('wss://chat.toastystoemp.com/chatws');
    else // for local installs
      ws = new WebSocket('ws://' + document.domain + ':6060');

    ws.onopen = function() {
      send({cmd: 'verify', version: webClientVersion});
    }
    ws.onclose = function() {
      // clearInterval(pongCheck);
      //
      // var secondsSinceConnection = (new Date() - connectTime) / 1000;
      // if (secondsSinceConnection > 2) {
      // 	joinTryCount = 0;
      // } else {
      // 	joinTryCount++; // Caused by connection error
      // }
      // var timeout = calculateRejoinTimeout() / 1000;
      //
      // pushMessage({nick: '!', text: "Disconnected. Waiting for <span id=\"reconnectTimer\">"+timeout+"</span> seconds till retry ("+joinTryCount+").", elementId: 'disconnect_message', replaceIfSameAsLast: true}, false);
      //
      // var timerEl = document.getElementById("reconnectTimer");
      // var reconnectInterval = window.setInterval(function() {
      // 	timeout -= 1;
      // 	timerEl.innerHTML = timeout;
      //
      // 	if(timeout <= 0) {
      // 		clearInterval(reconnectInterval);
      // 		timerEl.id = "oldReconnectTimer";
      // 		join(this.channel);
      // 	}
      // }, 1000);
    }
    ws.onmessage = function(message) {
      var args = JSON.parse(message.data);
      var cmd = args.cmd;
      var command = COMMANDS[cmd];
      if (command !== void 0)
        command.call(null, args);
      else
        console.warning('Unknown command: ' + String(cmd));
    }
  }

  var wasConnected = false;

  function connect(channel) {
    //myNick = localStorageGet('my-nick') || "";

    // var autoLoginOk = $('#auto-login').is(":checked") && myNick != "";
    // if (!wasConnected && !autoLoginOk) {
    //   myNick = prompt('Nickname:', myNick);
    // }
    if (myNick) {
      //localStorageSet('my-nick', myNick);
      var nick = myNick.split("#")[0];
      var pass = myNick.split("#")[1] || ''; // a random password will be generated on server side if empty
      myNick = nick;
      send({cmd: 'join', channel: channel, nick: nick, pass: pass });
    }
    // if !myNick: do nothing - reload continued to try again
    wasConnected = true;
  }

  function send(data) {
    if (ws && ws.readyState == ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  var COMMANDS = {
  	pong: function(args) {
  		// nothing to do
  	},
  	verify: function(args) {
      if (args.valid == true) {
        ToggleLoginDialog();
      }
  		else
  			pushMessage({nick: 'warn', errCode: 'E000', text: "You have an outdated client, CTRL + F5 to load the latest verison"});
  	},
  	chat: function(args) {
  		if (ignoredUsers.indexOf(args.nick) >= 0) {
  			return;
  		}
  		pushMessage(args);
  	},
  	info: function(args) {
  		args.nick = '*';
  		pushMessage(args);
  		if (args.infoCode == "I002")
  			notifyMe(args.nick + " invited you", args.text, false);
  	},
  	shout: function(args) {
  		args.nick = "<Server>";
  		pushMessage(args);
                  if (disconnectCodes.indexOf(args.errCode) != -1) {
                          ws.close();
                  }

  	},
  	warn: function(args) {
  		args.nick = '!';
  		pushMessage(args);
  		if (disconnectCodes.indexOf(args.errCode) != -1) {
  			ws.close();
  		}
  	},
  	onlineSet: function(args) {
  		onlineUsers = args.users;
  	},
  	onlineAdd: function(args) {
  		var nick = args.nick;
  		var trip = args.trip;
  		userAdd(nick, trip);
  		if ($('#joined-left').is(":checked")) {
  			pushMessage({nick: '*', text: nick + " joined"});
  		}
  	},
  	onlineRemove: function(args) {
  		var nick = args.nick;
  		userRemove(nick);
  		if ($('#joined-left').is(":checked")) {
  			pushMessage({nick: '*', text: nick + " left"});
  		}
  	},
  	play: function (args) {
  		var nick = args.nick;
  		handleViewer(parseUrl(args.url));
  		pushMessage({nick: "*", text: nick + " would like everyone to enjoy this"});
  	}
  }

  //Change the size of the input field acordingly
  // jQuery.each(jQuery('textarea[data-autoresize]'), function() {
  //     var offset = this.offsetHeight - this.clientHeight;
  //
  //     var resizeTextarea = function(el) {
  // 			// Scroll to bottom
  // 				var atBottom = isAtBottom();
  //         jQuery(el).css('height', 'auto').css('height', el.scrollHeight + offset);
  // 				$('#messages').css('margin-bottom', el.scrollHeight + offset + 5);
  // 				if (atBottom)
  // 					window.scrollTo(0, document.body.scrollHeight);
  //     };
  //     jQuery(this).on('keyup input', function() { resizeTextarea(this); }).removeAttr('data-autoresize');
  // });

  //Handle the nick input
  $("#chatinput").keyup(function(e) {
    if (e.keyCode == 13 && !e.shiftKey) {
      e.preventDefault();
      if (e.target.value != '') {
        var text = e.target.value;
        e.target.value = '';
        send({
          cmd: 'chat',
          text: text
        });

      }
    }
  });

  function isAtBottom() {
    return (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 1);
  }

  //Handle the nick input
  $("#nickinput").keydown(function(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      myNick = e.target.value;
      connect(myChannel);
      ToggleLoginDialog();
      setTimeout(function() {
        ToggleMainOverlay();
        setTimeout(function() {
          $("#svgcontainer").addClass("Hidden");
          ToggleChat();
          $("#chatinput").focus();
        }, 500);
      }, 500);
    }
  });

  function pushMessage(args) {
    var messageEl = document.createElement('div');
    messageEl.classList.add('message');
    if (args.nick == '!') {
      messageEl.classList.add('warn');
    } else if (args.nick == '*') {
      messageEl.classList.add('info');
    } else if (args.nick == '<Server>') {
      messageEl.classList.add('shout');
    }

    // if (args.elementId) { // for referencing special message
    // 	var oldElement = document.getElementById(args.elementId);
    // 	if (oldElement) oldElement.removeAttribute('id');
    // 	messageEl.id = args.elementId;
    // 	if (oldElement && args.replaceIfSameAsLast && oldElement == lastMessageElement)
    // 		oldElement.parentNode.removeChild(oldElement);
    // }

    // Nickname
    var nickSpanEl = document.createElement('span');
    nickSpanEl.style.color = "red" //args.color;
    nickSpanEl.classList.add('nick');
    messageEl.appendChild(nickSpanEl);


    if (args.nick != lastPoster) {
      var tripEl = document.createElement('span');
      tripEl.textContent = args.trip + " ";
      tripEl.classList.add("trip");
      tripEl.classList.add("AccentColor1");
      nickSpanEl.appendChild(tripEl);
    }

    if (args.nick != lastPoster) {
      var nickLinkEl = document.createElement('a');
      nickLinkEl.textContent = args.nick;
      nickLinkEl.onclick = function() {
        //insertAtCursor("@" + args.nick + " ");
        $('#chatinput').focus();
      }
      nickSpanEl.appendChild(nickLinkEl);

      if (args.donator) {
        var donatorLinkEl = document.createElement('img');
        donatorLinkEl.src = "https://toastystoemp.com/public/donator-icon.png";
        donatorLinkEl.style.marginLeft = "8px";
        donatorLinkEl.title = "Donator".toLocaleString();
        nickSpanEl.appendChild(donatorLinkEl);
      }
    }

    //-----------------------------
    // Text
    //-----------------------------
    var textEl = document.createElement('span'); //Create the TextSpan element
    textEl.innerHTML = args.text; //add the Text to the TextSpan element
    textEl.classList.add('text'); //add the CSS class 'text' to the TextSpan element

    //links = [];
    //textEl.innerHTML = textEl.innerHTML.replace(/(\?|https?:\/\/)\S+?(?=[,.!?:)]?\s|$)/g, parseLinks);
    var date = new Date(args.time || Date.now());
    textEl.title = date.toLocaleString();

    messageEl.appendChild(textEl);

    //Mentioning
    if (args.text.indexOf("@" + myNick) != -1) {
      messageEl.classList.add('mention');
      if ($('#notifications').is(":checked") && !document.hasFocus()) {
        notifyMe(args.nick + " mentioned you", args.text, false);
      }
    } else if (args.text.indexOf("@*") != -1) {
      messageEl.classList.add('mention');
      if ($('#notifications').is(":checked") && !document.hasFocus()) {
        notifyMe(args.nick + " mentioned you", args.text, false);
      }
    } else if (args.nick == '*') {

    } else if (!(args.nick == '!' || args.nick == '*' || args.nick == '<Server>')) {
      for (var nick in onlineUsers) {
        if (args.text.indexOf(nick) != -1) {
          var user = document.createElement('span');
          user.textContent = "@" + nick;
          user.style.color = onlineUsers[nick];
          try {
            textEl.outerHTML = textEl.outerHTML.replace("@" + nick, user.outerHTML);
          } catch (err) {
            console.warning(err.message);
          }
        }
      }
    }

    // Scroll to bottom
    var atBottom = isAtBottom();
    $('#messageContainer').append(messageEl);
    lastMessageElement = messageEl;
    if (atBottom) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }


  join(myChannel);
};
