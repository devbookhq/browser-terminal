---
- show "install devbookd" if not able to connect to devbookd
- maybe remove the always visible button for opening a terminal and instead open the terminal by clicking on the extension button
- resizing terminal
- share feedback/report bug button
- finalize private beta docs
- render in iframe for security
- publish to chrome web store
---

# Devbook Browser Terminal

This extension allows you to access your local terminal from any page in your browser.

Requires [Devbook daemon](https://github.com/devbookhq/devbookd) to be installed and running in the `user` mode on your computer.

## Private beta installation docs
Read the docs [here](https://mlejva.notion.site/Devbook-Browser-Terminal-7483ced5d2334d15955722e90e8e9e34).

## Build

### Development build (faster)

```sh
npm run build:dev
```

### Production build

```sh
npm run build:prod
```