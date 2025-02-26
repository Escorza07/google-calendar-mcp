#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
function validateArgs(args, requiredProps) {
    if (!args || typeof args !== 'object') {
        throw new McpError(ErrorCode.InvalidParams, 'Arguments must be an object');
    }
    for (const prop of requiredProps) {
        if (!(prop in args)) {
            throw new McpError(ErrorCode.InvalidParams, `Missing required property: ${String(prop)}`);
        }
    }
    return args;
}
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_REDIRECT_URI, } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !GOOGLE_REDIRECT_URI) {
    throw new Error('Missing required environment variables');
}
const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
});
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
class GoogleCalendarServer {
    server;
    constructor() {
        this.server = new Server({
            name: 'google-calendar-server',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'list_events',
                    description: 'List calendar events within a specified time range',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            timeMin: {
                                type: 'string',
                                description: 'Start time (ISO string)',
                            },
                            timeMax: {
                                type: 'string',
                                description: 'End time (ISO string)',
                            },
                            maxResults: {
                                type: 'number',
                                description: 'Maximum number of events to return',
                            },
                        },
                        required: ['timeMin', 'timeMax'],
                    },
                },
                {
                    name: 'create_event',
                    description: 'Create a new calendar event',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            summary: {
                                type: 'string',
                                description: 'Event title',
                            },
                            description: {
                                type: 'string',
                                description: 'Event description',
                            },
                            start: {
                                type: 'string',
                                description: 'Start time (ISO string)',
                            },
                            end: {
                                type: 'string',
                                description: 'End time (ISO string)',
                            },
                            attendees: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                },
                                description: 'List of attendee email addresses',
                            },
                        },
                        required: ['summary', 'start', 'end'],
                    },
                },
                {
                    name: 'update_event',
                    description: 'Update an existing calendar event',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            eventId: {
                                type: 'string',
                                description: 'ID of the event to update',
                            },
                            summary: {
                                type: 'string',
                                description: 'New event title',
                            },
                            description: {
                                type: 'string',
                                description: 'New event description',
                            },
                            start: {
                                type: 'string',
                                description: 'New start time (ISO string)',
                            },
                            end: {
                                type: 'string',
                                description: 'New end time (ISO string)',
                            },
                        },
                        required: ['eventId'],
                    },
                },
                {
                    name: 'delete_event',
                    description: 'Delete a calendar event',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            eventId: {
                                type: 'string',
                                description: 'ID of the event to delete',
                            },
                        },
                        required: ['eventId'],
                    },
                },
                {
                    name: 'find_free_time',
                    description: 'Find available time slots in the calendar',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            timeMin: {
                                type: 'string',
                                description: 'Start of search range (ISO string)',
                            },
                            timeMax: {
                                type: 'string',
                                description: 'End of search range (ISO string)',
                            },
                            duration: {
                                type: 'number',
                                description: 'Desired duration in minutes',
                            },
                        },
                        required: ['timeMin', 'timeMax', 'duration'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    case 'list_events': {
                        const args = validateArgs(request.params.arguments, ['timeMin', 'timeMax']);
                        const response = await calendar.events.list({
                            calendarId: 'primary',
                            timeMin: args.timeMin,
                            timeMax: args.timeMax,
                            maxResults: args.maxResults || 10,
                            singleEvents: true,
                            orderBy: 'startTime',
                        });
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(response.data.items, null, 2),
                                },
                            ],
                        };
                    }
                    case 'create_event': {
                        const args = validateArgs(request.params.arguments, ['summary', 'start', 'end']);
                        const response = await calendar.events.insert({
                            calendarId: 'primary',
                            requestBody: {
                                summary: args.summary,
                                description: args.description,
                                start: { dateTime: args.start },
                                end: { dateTime: args.end },
                                attendees: args.attendees?.map(email => ({ email })),
                            },
                        });
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(response.data, null, 2),
                                },
                            ],
                        };
                    }
                    case 'update_event': {
                        const args = validateArgs(request.params.arguments, ['eventId']);
                        const { eventId, ...updates } = args;
                        const response = await calendar.events.patch({
                            calendarId: 'primary',
                            eventId,
                            requestBody: {
                                ...updates,
                                start: updates.start ? { dateTime: updates.start } : undefined,
                                end: updates.end ? { dateTime: updates.end } : undefined,
                            },
                        });
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(response.data, null, 2),
                                },
                            ],
                        };
                    }
                    case 'delete_event': {
                        const args = validateArgs(request.params.arguments, ['eventId']);
                        await calendar.events.delete({
                            calendarId: 'primary',
                            eventId: args.eventId,
                        });
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `Event ${args.eventId} deleted successfully`,
                                },
                            ],
                        };
                    }
                    case 'find_free_time': {
                        const args = validateArgs(request.params.arguments, ['timeMin', 'timeMax', 'duration']);
                        const response = await calendar.freebusy.query({
                            requestBody: {
                                timeMin: args.timeMin,
                                timeMax: args.timeMax,
                                items: [{ id: 'primary' }],
                            },
                        });
                        const busyPeriods = response.data.calendars?.primary.busy || [];
                        const availableSlots = [];
                        let currentTime = new Date(args.timeMin);
                        const endTime = new Date(args.timeMax);
                        const durationMs = args.duration * 60000;
                        while (currentTime < endTime) {
                            const slotEnd = new Date(currentTime.getTime() + durationMs);
                            const isConflict = busyPeriods.some(period => {
                                const periodStart = new Date(period.start || '');
                                const periodEnd = new Date(period.end || '');
                                return ((currentTime >= periodStart && currentTime < periodEnd) ||
                                    (slotEnd > periodStart && slotEnd <= periodEnd));
                            });
                            if (!isConflict) {
                                availableSlots.push({
                                    start: currentTime.toISOString(),
                                    end: slotEnd.toISOString(),
                                });
                            }
                            currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute increments
                        }
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(availableSlots, null, 2),
                                },
                            ],
                        };
                    }
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                console.error('Tool execution error:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Google Calendar MCP server running on stdio');
    }
}
const server = new GoogleCalendarServer();
server.run().catch(console.error);
