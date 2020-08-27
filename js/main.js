(() => {
	function $(s) {
		return document.querySelector(s);
	}

	function toggle(elem) {
		elem.style.visibility = elem.style.visibility == "visible" ? "hidden" : "visible";
	}

	function removeLastLine(str, cb) {
		cb(str.substring(0, str.lastIndexOf("\n")));
	}

	async function showMessage(msg, term) {
		// Process
		let res = JSON.parse(msg);

		let txt = "";
		if (res.code == 1) {
			txt = res.content.stdout;
		} else if (res.code == 2) {
			txt = res.content.stderr;
		} else if (res.code == 200) {
			txt = res.content.msg;
		} else if (res.code == 500) {
			alert("Error : " + res.content.msg);
		} else {
			notify("Terminal", res.content.error);
		}

		// Print
		//term.textContent += "\n" + txt;
		//term.innerText += txt;
		//if (/^\033\[1A.*/i.test(txt)) removeLastLine(term.innerHTML, str => term.innerHTML = str);
		term.innerHTML += ansi_up.ansi_to_html(txt);
		term.scrollTop = term.scrollHeight;
	}

	function displayStatus(msg, status) {
		status.innerText = msg;
	}

	function attachToActionTerminal() {
		displayStatus("Connecting...", actionStatus);
		actionWs = new WebSocket(wsServer + "/servers/" + serverId + "/actions/terminal", localStorage.token, { headers: { Authorization: localStorage.token } });
		actionWs.addEventListener("error", () => {
			displayStatus("WebSocket error", actionStatus);
		});
		actionWs.addEventListener("open", () => {
			displayStatus("Actions terminal connection established", actionStatus);
		});
		actionWs.addEventListener("message", msg => {
			showMessage(msg.data, actionTerminal);
		});
		actionWs.addEventListener("close", () => {
			displayStatus("Actions terminal connection closed", actionStatus);
			actionWs = null;
		});
		return actionWs;
	}

	// Init
	let ansi_up = new AnsiUp;

	// Config
	const loginApiServer = "http://api.magicorp.fr/magicorp/v1";
	const apiServer = "http://api.magicorp.fr/batrenis/v1";
	const wsServer = "ws://api.magicorp.fr/batrenis/v1";

	// Auth
	const username = $("#username");
	const password = $("#password");
	const loginBtn = $("#loginbtn");
	const logoutBtn = $("#logoutbtn");

	// Actions
	const startBtn = $("#startbtn");
	const stopBtn = $("#stopbtn");

	// Terminals
	const actionStatus = $("#actionStatus");
	const serverStatus = $("#serverStatus");
	const actionTerminal = $("#actionterminal");
	const serverTerminal = $("#serverterminal");
	const cmd = $("#cmd");
	const sendcmd = $("#sendcmd");
	let actionWs = null;
	let serverWs = null;

	// Server
	let serverId = 1;

	// Init
	if (localStorage.token) {
		toggle($("#login"));
		toggle($("#logout"));
	}

	function notify(title, msg) {
		if (Notification.permission !== "granted") Notification.requestPermission();
		new Notification(title, {
			icon: "img/icon.gif",
			body: msg,
		}).addEventListener("click", () => {
			window.focus();
		});
	}

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
					notify("Login", "You are login!");
				});
			else
				return res.json().then(data => {
					notify("Login", "Check your credentials!\n" + data.error);
				});
		}).catch(err => {
			alert(err.message);
		});
	});

	logoutBtn.addEventListener("click", () => {
		localStorage.removeItem("userid");
		localStorage.removeItem("token");
		toggle($("#login"));
		toggle($("#logout"));
		notify("Logout", "You are logout!");
	});

	// Actions
	startBtn.addEventListener("click", () => {
		let actionWs = attachToActionTerminal();
		fetch(apiServer + "/servers/" + serverId + "/actions/start", {
			method: "GET",
			headers: {
				"Authorization": localStorage.token
			}
		}).then(res => {
			if (res.ok) {
				notify("Actions", "Server is starting!");
			} else {
				actionWs.close();
				return res.json().then(data => {
					notify("Actions", "Error on starting server!\n" + data.error);
				});
			}
		}).catch(err => {
			alert(err.message);
		});
	});

	stopBtn.addEventListener("click", () => {
		let actionWs = attachToActionTerminal();
		fetch(apiServer + "/servers/" + serverId + "/actions/stop", {
			method: "GET",
			headers: {
				"Authorization": localStorage.token
			}
		}).then(res => {
			if (res.ok) {
				notify("Actions", "Server is stopping!");
			} else {
				actionWs.close();
				return res.json().then(data => {
					notify("Actions", "Error on stopping server!\n" + data.error);
				});
			}
		}).catch(err => {
			alert(err.message);
		});
	});

	// Terminals
	setInterval(() => {
		if (!serverWs) {
			displayStatus("Connecting...", serverStatus);
			serverWs = new WebSocket(wsServer + "/servers/" + serverId + "/terminal", localStorage.token, { headers: { Authorization: localStorage.token } });
			serverWs.addEventListener("error", err => {
				displayStatus("WebSocket error", serverStatus);
			});
			serverWs.addEventListener("open", () => {
				displayStatus("Server terminal connection established", serverStatus);
			});
			serverWs.addEventListener("message", msg => {
				showMessage(msg.data, serverTerminal);
			});
			serverWs.addEventListener("close", () => {
				displayStatus("Server terminal connection closed", serverStatus);
				serverWs = null;
			});
		}
	}, 5000);

	sendcmd.addEventListener("click", () => {
		if (!serverWs) displayStatus("Not connect to server terminal", serverStatus);
		else serverWs.send(cmd.value);
	});
})();