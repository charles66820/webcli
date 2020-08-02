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
		actionWs = new WebSocket(wsServer + "/servers/" + serverId + "/actions/terminal", localStorage.token, { headers: { Authorization: localStorage.token } });
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
				return notify("Login", "Check your credentials!");
		}).catch(function (err) {
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
		fetch(apiServer + "/servers/" + serverId + "/start", {
			method: "GET",
			headers: {
				"Authorization": localStorage.token
			}
		}).then(res => {
			if (res.ok) {
				notify("Actions", "Server is starting!");
				return attatchToActionTerminal();
			} else
				return notify("Actions", "Error on starting server!");
		});
	});

	stopBtn.addEventListener("click", () => {
		fetch(apiServer + "/servers/" + serverId + "/stop", {
			method: "GET",
			headers: {
				"Authorization": localStorage.token
			}
		}).then(res => {
			if (res.ok){
				notify("Actions", "Server is stopping!");
				return attatchToActionTerminal();
			} else
				return notify("Actions", "Error on stopping server!");
		});
	});

	// Terminals
	setInterval(() => {
		if (!serverWs) {
			showMessage("Connecting...", serverTerminal);
			serverWs = new WebSocket(wsServer + "/servers/" + serverId + "/terminal", localStorage.token, { headers: { Authorization: localStorage.token } });
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