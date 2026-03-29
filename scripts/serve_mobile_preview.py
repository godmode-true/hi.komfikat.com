from __future__ import annotations

import argparse
import http.server
import ipaddress
import os
import socket
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serve the current site locally and print LAN URLs for mobile testing."
    )
    parser.add_argument("--port", type=int, default=8080, help="Port to serve on. Default: 8080")
    return parser.parse_args()


def is_private_ipv4(value: str) -> bool:
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        return False
    return isinstance(address, ipaddress.IPv4Address) and address.is_private and not address.is_loopback


def get_lan_ips() -> list[str]:
    candidates: set[str] = set()

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
            probe.connect(("8.8.8.8", 80))
            candidates.add(probe.getsockname()[0])
    except OSError:
        pass

    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            candidates.add(ip)
    except OSError:
        pass

    return sorted(ip for ip in candidates if is_private_ipv4(ip))


class PreviewRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(REPO_ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> None:
    args = parse_args()
    port = args.port
    lan_ips = get_lan_ips()
    handler = PreviewRequestHandler

    with http.server.ThreadingHTTPServer(("0.0.0.0", port), handler) as server:
        print()
        print(f"Serving: {REPO_ROOT}")
        print(f"Port: {port}")
        print(f"Local:  http://127.0.0.1:{port}")

        if lan_ips:
            print("Mobile:")
            for ip in lan_ips:
                print(f"  http://{ip}:{port}")
        else:
            print("Mobile: no LAN IPv4 address detected yet")

        print()
        print("Open one of the Mobile URLs on your phone while it is on the same Wi-Fi network.")
        print("Press Ctrl+C to stop the preview server.")
        print()

        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print()
            print("Preview server stopped.")


if __name__ == "__main__":
    main()
