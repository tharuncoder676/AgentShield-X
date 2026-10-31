"""
AgentShield-X Port 8000 -> 8002 Transparent Bridge
Forward requests from legacy port 8000 to port 8002.
"""
import socket
import threading
import sys

def forward(src, dst):
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try:
            src.close()
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass

def handle_client(client_sock):
    try:
        backend_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        backend_sock.connect(('127.0.0.1', 8002))
        t1 = threading.Thread(target=forward, args=(client_sock, backend_sock), daemon=True)
        t2 = threading.Thread(target=forward, args=(backend_sock, client_sock), daemon=True)
        t1.start()
        t2.start()
    except Exception as e:
        client_sock.close()

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('0.0.0.0', 8000))
        server.listen(128)
        print("Port bridge active: 8000 -> 8002")
        while True:
            client, _ = server.accept()
            threading.Thread(target=handle_client, args=(client,), daemon=True).start()
    except Exception as e:
        print(f"Port 8000 bridge error (might be already bound): {e}")

if __name__ == '__main__':
    main()
