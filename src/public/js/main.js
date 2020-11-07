(() => {
	function $(s) {
		return document.querySelector(s);
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

	function removeLastLine(str, cb) {
		cb(str.substring(0, str.lastIndexOf("\n")));
	}

	async function showMessage(msg, term) {
		// Process
		let res = JSON.parse(msg);

		let txt = "";
		if (res.code == 1) // msg
			txt = res.msg;
		else if (res.code == 2) // error
			txt = "Error : " + res.error;
		else // other
			notify("Terminal", `Response with code : ${res.code}\n with msg : ${res.msg}\n with error : ${res.error}`);

		// Print
		//term.textContent += "\n" + txt;
		//term.innerText += txt;
		//if (/^\033\[1A.*/i.test(txt)) removeLastLine(term.innerHTML, str => term.innerHTML = str);
		term.innerHTML += ansi_up.ansi_to_html(txt);
		term.scrollTop = term.scrollHeight;
	}

	// Init
	let ansi_up = new AnsiUp;
	let wsUrl = "ws://" + location.hostname;
	if (location.port) wsUrl += ":" + location.port;
	const terminalStatus = $("#terminalstatus");
	const rconTerminal = $("#rconterminal");
	let ws = null;

	function initWsConnection() {
		terminalStatus.innerText = "Connecting...";
		ws = new WebSocket(wsUrl);
		ws.addEventListener("error", e => {
			console.error(e);
			terminalStatus.innerText = "WebSocket error";
			notify("Rcon terminal", "Connection error!\n");
		});
		ws.addEventListener("open", () => {
			terminalStatus.innerText = "Rcon terminal connection established";
			notify("Rcon terminal", "Connection established!\n");
		});
		ws.addEventListener("message", msg =>
			showMessage(msg.data, rconTerminal)
		);
		ws.addEventListener("close", () => {
			notify("Rcon terminal", "Connection closed!\n");
			terminalStatus.innerText = "Rcon terminal connection closed";
			ws = null;
		});
	}

	function sendCmd(cmd) {
		if (!ws) terminalStatus.innerText = "Not connect to rcon terminal";
		else ws.send(cmd);
	}

	// Send commands
	$("#connection").addEventListener("submit", function (e) {
		sendCmd(JSON.stringify({
			code: 0,
			host: this["host"].value,
			port: this["port"].value,
			password: this["password"].value
		}));
		e.preventDefault();
	});

	$('button[name="close"]').addEventListener("click", () => {
		sendCmd(JSON.stringify({ code: 1, msg: "exit" }));
	});

	$("#cmd").addEventListener("submit", function (e) {
		sendCmd(JSON.stringify({ code: 1, msg: this["cmd"].value }));
		e.preventDefault();
	});

	// Init ws connection
	if (navigator.onLine) initWsConnection();
	window.addEventListener("online", () => {
		if (!ws) initWsConnection();
	});
})();