## syntax=docker/dockerfile:1.7

ARG RUST_VERSION=1.85
ARG NODE_VERSION=22
ARG DEBIAN_SUITE=bookworm

########################
# Backend build target #
########################
FROM rust:${RUST_VERSION}-${DEBIAN_SUITE} AS backend-builder
WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations

RUN cargo build --release

##########################
# Backend runtime target #
##########################
FROM debian:${DEBIAN_SUITE}-slim AS backend-runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Shanghai \
    SERVER__HOST=0.0.0.0 \
    SERVER__PORT=9000

COPY --from=backend-builder /app/target/release/Demeter /usr/local/bin/demeter
COPY migrations ./migrations

EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/demeter"]

#########################
# Frontend build target #
#########################
FROM node:${NODE_VERSION}-${DEBIAN_SUITE}-slim AS frontend-builder
WORKDIR /webapp

COPY webapp/package.json webapp/yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY webapp ./

ARG VITE_API_BASE_URL=http://localhost:9000/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN yarn build

###########################
# Frontend runtime target #
###########################
FROM nginx:1.27-alpine AS frontend-runtime

RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 3000;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
EOF

COPY --from=frontend-builder /webapp/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
