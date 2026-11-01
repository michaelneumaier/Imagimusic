#!/usr/bin/env python3
"""Dependency-free, atomic, cross-application agent mailbox."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import tempfile
import uuid

ROOT = Path(__file__).resolve().parents[1] / 'collaboration'

def send(sender, recipient, subject, body):
    directory = ROOT / 'messages'
    directory.mkdir(parents=True, exist_ok=True)
    now = dt.datetime.now(dt.timezone.utc)
    identifier = now.strftime('%Y%m%dT%H%M%S%fZ') + '-' + uuid.uuid4().hex[:8]
    message = dict(id=identifier, timestamp=now.isoformat(), sender=sender, to=recipient, subject=subject, body=body)
    fd, temporary = tempfile.mkstemp(prefix='.pending-', dir=directory)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(message, stream, indent=2)
            stream.write('\n')
        os.replace(temporary, directory / (identifier + '.json'))
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return identifier

def inbox(agent):
    for path in sorted((ROOT / 'messages').glob('*.json')):
        message = json.loads(path.read_text())
        if message['to'].lower() in (agent.lower(), 'all'):
            print(json.dumps(message, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    outgoing = commands.add_parser('send')
    for key in ['sender', 'to', 'subject', 'body']:
        outgoing.add_argument('--' + key, required=True)
    incoming = commands.add_parser('inbox')
    incoming.add_argument('--agent', required=True)
    args = parser.parse_args()
    if args.command == 'send':
        print(send(args.sender, args.to, args.subject, args.body))
    else:
        inbox(args.agent)
