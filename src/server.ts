/**
 * Shared MCP Server creation logic
 * Used by both Node.js entry (index.ts) and CF Worker entry (worker.ts)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WordPressClient } from './client.js';
import { TOOLS } from './tools.js';

export interface WordPressMcpConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

/**
 * Handle MCP tool calls by routing to WordPressClient methods
 */
export async function handleToolCall(toolName: string, args: Record<string, unknown>, client: WordPressClient): Promise<unknown> {
  switch (toolName) {
    // Posts
    case 'wp_list_posts':
      return client.listPosts(args as any);
    case 'wp_get_post':
      return client.getPost(args.id as number);
    case 'wp_create_post':
      return client.createPost(args as any);
    case 'wp_update_post': {
      const { id, ...data } = args;
      return client.updatePost(id as number, data as any);
    }
    case 'wp_delete_post':
      return client.deletePost(args.id as number);

    // Pages
    case 'wp_list_pages':
      return client.listPages(args as any);
    case 'wp_get_page':
      return client.getPage(args.id as number);
    case 'wp_create_page':
      return client.createPage(args as any);
    case 'wp_update_page': {
      const { id, ...data } = args;
      return client.updatePage(id as number, data as any);
    }
    case 'wp_delete_page':
      return client.deletePage(args.id as number);

    // Media
    case 'wp_list_media':
      return client.listMedia(args as any);
    case 'wp_delete_media':
      return client.deleteMedia(args.id as number);

    // Comments
    case 'wp_list_comments':
      return client.listComments(args as any);
    case 'wp_create_comment':
      return client.createComment(args as any);
    case 'wp_update_comment': {
      const { id, ...data } = args;
      return client.updateComment(id as number, data as any);
    }
    case 'wp_delete_comment':
      return client.deleteComment(args.id as number);

    // Taxonomy
    case 'wp_list_categories':
      return client.listCategories();
    case 'wp_list_tags':
      return client.listTags();

    // Users & Site
    case 'wp_list_users':
      return client.listUsers();
    case 'wp_get_site_info':
      return client.getSiteInfo();

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Create a configured MCP Server instance
 */
export function createServer(config?: WordPressMcpConfig): McpServer {
  const server = new McpServer({
    name: 'wordpress-mcp',
    version: '1.0.0',
  });

  let client: WordPressClient | null = null;

  for (const tool of TOOLS) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema as Record<string, unknown>,
      async (args: Record<string, unknown>) => {
        const siteUrl = config?.siteUrl || args.WORDPRESS_URL as string;
        const username = config?.username || args.WORDPRESS_USERNAME as string;
        const applicationPassword = config?.applicationPassword || args.WORDPRESS_APP_PASSWORD as string;

        if (!siteUrl || !username || !applicationPassword) {
          return {
            content: [{ type: 'text' as const, text: 'Error: WORDPRESS_URL, WORDPRESS_USERNAME, and WORDPRESS_APP_PASSWORD are required.' }],
            isError: true,
          };
        }

        if (!client) {
          client = new WordPressClient({ siteUrl, username, applicationPassword });
        }

        try {
          const result = await handleToolCall(tool.name, args, client);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            isError: false,
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}
