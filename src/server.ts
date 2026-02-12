/**
 * Shared MCP Server creation logic
 * Used by both Node.js entry (index.ts) and CF Worker entry (worker.ts)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
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
    version: '1.0.3',
  });

  let client: WordPressClient | null = null;

  // Register all 20 tools with annotations
  for (const tool of TOOLS) {
    const registered = server.tool(
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
    registered.update({ annotations: tool.annotations });
  }

  // Register prompts
  server.prompt(
    'manage-content',
    'Guide for managing WordPress posts and pages — list, create, update, and delete content',
    () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            'You are a WordPress content management assistant.',
            '',
            'Available actions:',
            '1. **List posts** — Use wp_list_posts to see all blog posts',
            '2. **Get post** — Use wp_get_post to read a specific post',
            '3. **Create post** — Use wp_create_post with title, content, and status',
            '4. **Update post** — Use wp_update_post to modify existing posts',
            '5. **Delete post** — Use wp_delete_post to remove a post',
            '6. **Pages** — Same operations available for pages (wp_list_pages, etc.)',
            '',
            'Start by listing my current posts.',
          ].join('\n'),
        },
      }],
    })
  );

  server.prompt(
    'manage-media',
    'Guide for managing WordPress media library, comments, categories, and tags',
    () => ({
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            'You are a WordPress media and taxonomy assistant.',
            '',
            'Available actions:',
            '1. **List media** — Use wp_list_media to see uploaded files',
            '2. **Delete media** — Use wp_delete_media to remove files',
            '3. **Comments** — Use wp_list_comments, wp_create_comment, wp_update_comment, wp_delete_comment',
            '4. **Categories** — Use wp_list_categories to see all categories',
            '5. **Tags** — Use wp_list_tags to see all tags',
            '6. **Users** — Use wp_list_users to see site users',
            '7. **Site info** — Use wp_get_site_info for site details',
            '',
            'Start by listing the media library.',
          ].join('\n'),
        },
      }],
    })
  );

  // Register resources
  server.resource(
    'WordPress Server Info',
    'wordpress://server-info',
    {
      description: 'Connection status and available tools for this WordPress MCP server',
      mimeType: 'application/json',
    },
    async () => ({
      contents: [{
        uri: 'wordpress://server-info',
        mimeType: 'application/json',
        text: JSON.stringify({
          name: 'wordpress-mcp',
          version: '1.0.3',
          connected: !!config,
          wordpress_url: config?.siteUrl ?? null,
          tools_available: TOOLS.length,
          tool_categories: {
            posts: 5,
            pages: 5,
            media: 2,
            comments: 4,
            taxonomy: 2,
            users_and_site: 2,
          },
        }, null, 2),
      }],
    })
  );

  // Override tools/list handler to return raw JSON Schema with property descriptions.
  // McpServer's Zod processing strips raw JSON Schema properties, returning empty schemas.
  (server as any).server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
    })),
  }));

  return server;
}
