# LectureTCI

LectureTCI is a static prototype for a participatory lecture screen.

## Prototype

The current prototype is built with plain HTML, CSS, and JavaScript.

GitHub Pages deployment target:

```text
Branch: main
Folder: /docs
```

Entry point:

```text
docs/index.html
```

## Planned Production Architecture

```text
Browser
  -> Spring Boot on Google Cloud Run
  -> Supabase PostgreSQL Free
```

The browser will call only Spring Boot APIs. Supabase credentials will stay on the server side.
