# Overview

This projet is web application for use rcon.

## Start this application

### With docker

> install dependency packages :

```bash
npm install
```

```bash
# For dev
docker-compose up -d

# For production
docker-compose -f docker-compose.yml -f production.yml up
```

> remove : first for update

```bash
docker-compose restart
# or
docker-compose start
```

### With npm

install dependency packages :

```bash
npm install
```

```bash
npm start
```

### Manual

install dependency packages in node_modules

```bash
node src/app.js
```
