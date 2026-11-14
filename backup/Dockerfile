FROM postgres:18-alpine
RUN apk add --no-cache openssl python3
WORKDIR /backup
COPY run.sh upload_backup.py ./
RUN chmod 0755 /backup/run.sh
ENTRYPOINT ["/backup/run.sh"]
