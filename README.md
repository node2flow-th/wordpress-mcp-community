# WordPress MCP Server

[![npm version](https://img.shields.io/npm/v/@node2flow/wordpress-mcp.svg)](https://www.npmjs.com/package/@node2flow/wordpress-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for WordPress REST API. Manage posts, pages, media, comments, categories, tags, and users through 20 tools.

Works with Claude Desktop, Cursor, VS Code, and any MCP client.

---

## Quick Start

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@node2flow/wordpress-mcp"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

### Cursor / VS Code

Add to MCP settings:

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "@node2flow/wordpress-mcp"],
      "env": {
        "WORDPRESS_URL": "https://your-site.com",
        "WORDPRESS_USERNAME": "your-username",
        "WORDPRESS_APP_PASSWORD": "your-application-password"
      }
    }
  }
}
```

### HTTP Mode (Streamable HTTP)

For remote deployment or shared access:

```bash
WORDPRESS_URL=https://your-site.com WORDPRESS_USERNAME=user WORDPRESS_APP_PASSWORD=pass npx @node2flow/wordpress-mcp --http
```

Server starts on port 3000 (configurable via `PORT` env var). MCP endpoint: `http://localhost:3000/mcp`

---

## Configuration

| Environment Variable | Required | Description |
|---|---|---|
| `WORDPRESS_URL` | Yes | WordPress site URL (e.g. `https://your-site.com`) |
| `WORDPRESS_USERNAME` | Yes | WordPress username |
| `WORDPRESS_APP_PASSWORD` | Yes | Application Password (see below) |
| `PORT` | No | Port for HTTP server (default: `3000`, only used with `--http`) |

### How to Create an Application Password

1. Go to your WordPress Admin → **Users** → **Profile**
2. Scroll down to **Application Passwords**
3. Enter a name (e.g. "MCP Server") and click **Add New Application Password**
4. Copy the generated password

> **Important**: WordPress displays the password with spaces for readability (e.g. `cUAn CKZ1 u5DN`). The server automatically removes spaces — you can paste it as-is.

---

## All Tools (20 tools)

### Posts (5 tools)

| Tool | Description |
|---|---|
| `wp_list_posts` | List posts with filters (status, search, per_page) |
| `wp_get_post` | Get single post with full content |
| `wp_create_post` | Create post (title, content, status, categories, tags) |
| `wp_update_post` | Update post fields |
| `wp_delete_post` | Delete post (moves to trash) |

### Pages (5 tools)

| Tool | Description |
|---|---|
| `wp_list_pages` | List pages with status filter |
| `wp_get_page` | Get single page with full content |
| `wp_create_page` | Create page (title, content, status, parent) |
| `wp_update_page` | Update page fields |
| `wp_delete_page` | Delete page |

### Media (2 tools)

| Tool | Description |
|---|---|
| `wp_list_media` | List media files with type filter |
| `wp_delete_media` | Permanently delete media file |

### Comments (4 tools)

| Tool | Description |
|---|---|
| `wp_list_comments` | List comments, filter by post |
| `wp_create_comment` | Create comment on post |
| `wp_update_comment` | Moderate comment (approve/hold/spam/trash) |
| `wp_delete_comment` | Permanently delete comment |

### Taxonomy (2 tools)

| Tool | Description |
|---|---|
| `wp_list_categories` | List all categories with post counts |
| `wp_list_tags` | List all tags with post counts |

### Users & Site (2 tools)

| Tool | Description |
|---|---|
| `wp_list_users` | List users with roles |
| `wp_get_site_info` | Get site name, description, URL, timezone |

---

## Requirements

- **Node.js** 18+
- **WordPress** with REST API enabled (enabled by default)
- **Application Password** (WordPress 5.6+)

---

## For Developers

```bash
git clone https://github.com/node2flow-th/wordpress-mcp-community.git
cd wordpress-mcp-community
npm install
npm run build

# Run in stdio mode
WORDPRESS_URL=https://your-site.com WORDPRESS_USERNAME=user WORDPRESS_APP_PASSWORD=pass npm start

# Run in dev mode (hot reload)
WORDPRESS_URL=https://your-site.com WORDPRESS_USERNAME=user WORDPRESS_APP_PASSWORD=pass npm run dev

# Run in HTTP mode
WORDPRESS_URL=https://your-site.com WORDPRESS_USERNAME=user WORDPRESS_APP_PASSWORD=pass npm start -- --http
```

---

## License

MIT License - see [LICENSE](LICENSE)

Copyright (c) 2026 [Node2Flow](https://node2flow.net)

## Links

- [npm Package](https://www.npmjs.com/package/@node2flow/wordpress-mcp)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Node2Flow](https://node2flow.net)
