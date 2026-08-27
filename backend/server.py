import os
import asyncio
import subprocess
import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NODE_PORT = "8002"

state = {"proc": None, "client": None}


def start_node():
    subprocess.run(["pkill", "-f", "node --watch src/index.js"], capture_output=True)
    env = {**os.environ, "PORT": NODE_PORT}
    state["proc"] = subprocess.Popen(
        ["node", "--watch", "src/index.js"], cwd=BASE_DIR, env=env
    )
    state["client"] = httpx.AsyncClient(
        base_url=f"http://127.0.0.1:{NODE_PORT}", timeout=120
    )


async def app(scope, receive, send):
    if scope["type"] == "lifespan":
        while True:
            message = await receive()
            if message["type"] == "lifespan.startup":
                start_node()
                await send({"type": "lifespan.startup.complete"})
            elif message["type"] == "lifespan.shutdown":
                if state["client"]:
                    await state["client"].aclose()
                if state["proc"]:
                    state["proc"].terminate()
                await send({"type": "lifespan.shutdown.complete"})
                return
    elif scope["type"] == "http":
        body = b""
        more = True
        while more:
            msg = await receive()
            body += msg.get("body", b"")
            more = msg.get("more_body", False)
        headers = [
            (k.decode(), v.decode())
            for k, v in scope["headers"]
            if k.lower() != b"host"
        ]
        url = scope["path"]
        if scope.get("query_string"):
            url += "?" + scope["query_string"].decode()
        resp = None
        for _ in range(30):
            try:
                resp = await state["client"].request(
                    scope["method"], url, headers=headers, content=body
                )
                break
            except (httpx.ConnectError, httpx.ConnectTimeout):
                await asyncio.sleep(0.4)
        if resp is None:
            await send({"type": "http.response.start", "status": 502, "headers": [(b"content-type", b"application/json")]})
            await send({"type": "http.response.body", "body": b'{"error":"Node backend indisponivel"}'})
            return
        skip = {"content-encoding", "transfer-encoding", "content-length", "connection"}
        out_headers = [
            (k.encode(), v.encode())
            for k, v in resp.headers.multi_items()
            if k.lower() not in skip
        ]
        out_headers.append((b"content-length", str(len(resp.content)).encode()))
        await send({"type": "http.response.start", "status": resp.status_code, "headers": out_headers})
        await send({"type": "http.response.body", "body": resp.content})
