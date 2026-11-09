"""A tiny Marionette client to drive headless Firefox: navigate, run scripts, take screenshots.
Usage: python3 -I drive.py <script.json>  where the script is a list of steps:
  ["go", url] | ["wait", js_condition, seconds] | ["js", code] | ["shot", path] | ["sleep", seconds]"""
import base64, json, socket, sys, time

def connect(port=2828, tries=60):
    for _ in range(tries):
        try:
            s = socket.create_connection(("127.0.0.1", port), timeout=30)
            return s
        except OSError:
            time.sleep(0.5)
    raise SystemExit("can't reach Marionette")

class M:
    def __init__(self):
        self.s = connect(); self.buf = b""; self.id = 0
        self.read()  # handshake
    def read(self):
        while b":" not in self.buf:
            self.buf += self.s.recv(65536)
        n, rest = self.buf.split(b":", 1); n = int(n)
        while len(rest) < n:
            rest += self.s.recv(65536)
        msg, self.buf = rest[:n], rest[n:]
        return json.loads(msg)
    def call(self, name, params):
        self.id += 1
        data = json.dumps([0, self.id, name, params]).encode()
        self.s.sendall(str(len(data)).encode() + b":" + data)
        while True:
            r = self.read()
            if r[0] == 1 and r[1] == self.id:
                if r[2]: raise RuntimeError(f"{name}: {r[2]}")
                return r[3]

m = M()
m.call("WebDriver:NewSession", {"capabilities": {}})
m.call("WebDriver:SetWindowRect", {"width": 1400, "height": 900})
for step in json.load(open(sys.argv[1])):
    kind = step[0]
    if kind == "go":
        m.call("WebDriver:Navigate", {"url": step[1]})
    elif kind == "wait":
        end = time.time() + step[2]
        while time.time() < end:
            if m.call("WebDriver:ExecuteScript", {"script": f"return !!({step[1]});", "args": []}).get("value"):
                break
            time.sleep(0.3)
        else:
            print("timeout waiting for", step[1])
    elif kind == "js":
        r = m.call("WebDriver:ExecuteScript", {"script": step[1], "args": []})
        if r.get("value") is not None: print(json.dumps(r["value"])[:4000])
    elif kind == "shot":
        png = m.call("WebDriver:TakeScreenshot", {"full": False})["value"]
        open(step[1], "wb").write(base64.b64decode(png)); print("shot", step[1])
    elif kind == "sleep":
        time.sleep(step[1])
m.call("WebDriver:DeleteSession", {})
