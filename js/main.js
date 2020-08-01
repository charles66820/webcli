(() => {
	function $(s) {
		return document.querySelector(s);
	}

	function toggle(elem) {
		elem.style.visibility = elem.style.visibility == "visible" ? "hidden" : "visible";
	}
	
	function showMessage(msg, term) {
    	term.textContent += "\n" + msg;
		term.scrollTop = term.scrollHeight;
	}
	
	function attatchToActionTerminal() {
		showMessage("Connecting...", actionTerminal);
		actionWs = new WebSocket(wsServer + "/servers/" + serverId + "/actions/terminal", localStorage.token, { headers: { Authorization: localStorage.token }});
		actionWs.addEventListener("error", () => {
			showMessage("WebSocket error", actionTerminal);
    	});
		actionWs.addEventListener("open", () => {
			showMessage("Actions terminal connection established", actionTerminal);
		});
		actionWs.addEventListener("close", () => {
			showMessage("Actions terminal connection closed", actionTerminal);
			actionWs = null;
		});
	}

	// Config
	const loginApiServer = "http://localhost:8000";
	const apiServer = "http://localhost:8080";
	const wsServer = "ws://localhost:8080";
	
	// Auth
	const username = $("#username");
	const password = $("#password");
	const loginBtn = $("#loginbtn");
	const logoutBtn = $("#logoutbtn");

	// Actions
	const startBtn = $("#startbtn");
	const stopBtn = $("#stopbtn");

	// Terminals
	const actionTerminal = $("#actionterminal");
    const serverTerminal = $("#serverterminal");
	const cmd = $("#cmd");
    const sendcmd = $("#sendcmd");
	let actionWs = null;
	let serverWs = null;
	
	// Server
	let serverId = 1; 
	
	// Auth
	loginBtn.addEventListener("click", () => {
        fetch(loginApiServer + "/login", {
			method: "POST",
			headers: {
				"Authorization": btoa(username.value + ":" + password.value)
            }
		}).then(res => {
		    if (res.ok)
			    return res.json().then(data => {
			        localStorage.userid = data.id;
					localStorage.token = data.token;
					toggle($("#login"));
					toggle($("#logout"));
		        });
    		else
			    return Promise.reject(new Error('Unexpected response'));
		}).catch(function (err) {
			alert(err.message);
		});
    });
	
	logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userid");
        localStorage.removeItem("token");
    });

	// Actions
	startBtn.addEventListener("click", () => {
		fetch(apiServer + "/servers/" + serverId + "/start", {
			method: "GET",
			headers: {
				"Authorization": localStorage.token
			}
		}).then(res => {
			if (res.ok)
			    return attatchToActionTerminal();
			else
			    return Promise.reject(new Error('Unexpected response'));
		});
	});
	 
	stopBtn.addEventListener("click", () => {
		fetch(apiServer + "/servers/" + serverId + "/stop", {
			method: "GET",
			headers: {
				"Authorization": localStorage.token
			}
		}).then(res => {
			if (res.ok)
			    return attatchToActionTerminal();
			else
			    return Promise.reject(new Error('Unexpected response'));
		});
	});

	// Terminals
	setInterval(() => {
		if (!serverWs) {
      		showMessage("Connecting...", serverTerminal);
			serverWs = new WebSocket(wsServer + "/servers/" + serverId + "/terminal", localStorage.token, { headers: { Authorization: localStorage.token }});
    		serverWs.addEventListener("error", () => {
      			showMessage("WebSocket error", serverTerminal);
    		});
			serverWs.addEventListener("open", () => {
			  showMessage("Server terminal connection established", serverTerminal);
			});
			serverWs.addEventListener("close", () => {
			  showMessage("Server terminal connection closed", serverTerminal);
			  serverWs = null;
			});
    	}
	}, 2000);
	
	sendcmd.addEventListener("click", () => {
        if (!serverWs) showMessage("Not connect to server terminal", serverTerminal);
        else serverWs.send(cmd.value);
    });
})();