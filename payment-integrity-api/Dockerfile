FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache postgresql18-client python3 py3-cryptography py3-pynacl coreutils
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY backup-runtime /backup
RUN chmod 0755 /backup/run.sh
EXPOSE 8080
USER node
CMD ["node", "src/server.js"]