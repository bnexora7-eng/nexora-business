FROM postgres:18-alpine
RUN apk add --no-cache python3 py3-cryptography coreutils
WORKDIR /backup
COPY run.sh upload_backup.py crypto.py ./
RUN chmod 0755 /backup/run.sh
ENTRYPOINT ["timeout", "--signal=TERM", "--kill-after=30s", "3600s", "/backup/run.sh"]
