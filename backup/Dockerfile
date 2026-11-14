FROM postgres:18-alpine
RUN apk add --no-cache python3 py3-cryptography
WORKDIR /backup
COPY run.sh upload_backup.py crypto.py ./
RUN chmod 0755 /backup/run.sh
ENTRYPOINT ["/backup/run.sh"]
