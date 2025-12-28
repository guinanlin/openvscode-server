/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as https from 'https';
import { URL } from 'url';

// Kimi API configuration
const KIMI_BASE_URL = 'https://api.gitcode.com/api/v5';
const KIMI_DEFAULT_API_KEY = '7hBwcGgKdSiGHS1zMBQm8YHN';
const KIMI_SECRET_KEY = 'kimi.apiKey';

// Message format interface
interface KimiMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}


// Get API Key
async function getApiKey(context: vscode.ExtensionContext): Promise<string> {
	// Try to read from secret storage first
	try {
		const apiKey = await context.secrets.get(KIMI_SECRET_KEY);
		if (apiKey) {
			return apiKey;
		}
	} catch (e) {
		console.warn('Failed to read from secret storage:', e);
	}

	// If not in secret storage, try reading from configuration
	const config = vscode.workspace.getConfiguration('kimi');
	const apiKey = config.get<string>('apiKey');

	if (apiKey) {
		return apiKey;
	}

	// If neither available, use default value (for development/testing only)
	return KIMI_DEFAULT_API_KEY;
}

// Save API Key
async function saveApiKey(context: vscode.ExtensionContext, apiKey: string): Promise<void> {
	await context.secrets.store(KIMI_SECRET_KEY, apiKey);
}

// Convert message format
function convertMessages(messages: readonly vscode.LanguageModelChatRequestMessage[]): KimiMessage[] {
	console.log('Kimi: Converting messages, count:', messages.length);

	const converted = messages.map((msg, index) => {
		let role: 'system' | 'user' | 'assistant' = 'user';

		// Determine message type based on role property
		if (msg.role === vscode.LanguageModelChatMessageRole.User) {
			role = 'user';
		} else if (msg.role === vscode.LanguageModelChatMessageRole.Assistant) {
			role = 'assistant';
		} else {
			// Default to system (although API may not have System role, for compatibility)
			role = 'system';
		}

		// Extract content
		const content = msg.content
			.map(part => {
				if (part instanceof vscode.LanguageModelTextPart) {
					return part.value;  // Use value property, not text
				}
				return '';
			})
			.join('');

		console.log(`Kimi: Message ${index}: role=${role}, content_length=${content.length}`);

		if (!content.trim()) {
			console.warn(`Kimi: Message ${index} has empty content`);
		}

		return { role, content };
	});

	console.log('Kimi: Message conversion complete');
	return converted;
}

// Call Kimi API and send response through progress callback
async function callKimiAPI(
	model: vscode.LanguageModelChatInformation,
	messages: readonly vscode.LanguageModelChatRequestMessage[],
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
	token: vscode.CancellationToken,
	context: vscode.ExtensionContext
): Promise<void> {
	// Convert message format
	const kimiMessages = convertMessages(messages);

	// Get API Key
	const apiKey = await getApiKey(context);
	console.log('Kimi: Starting API call, model:', model.id, 'message count:', kimiMessages.length);

	// Build request data (using model id)
	const requestData = JSON.stringify({
		model: model.id,  // Use model id
		messages: kimiMessages,
		stream: true,
		temperature: 0.7
	});

	console.log('Kimi: Request URL:', `${KIMI_BASE_URL}/chat/completions`);
	console.log('Kimi: Request data:', JSON.stringify({ model: model.id, messages: kimiMessages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })) }));

	// Make request and send response through progress callback
	try {
		await makeKimiRequest(apiKey, requestData, progress, token);
		console.log('Kimi: API call completed');
	} catch (error) {
		console.error('Kimi: API call failed:', error);
		throw error;
	}
}

// Make Kimi API request
async function makeKimiRequest(
	apiKey: string,
	data: string,
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
	token: vscode.CancellationToken
): Promise<void> {
	return new Promise((resolve, reject) => {
		// Parse Base URL
		const apiUrl = new URL(KIMI_BASE_URL);
		const path = apiUrl.pathname.endsWith('/')
			? apiUrl.pathname + 'chat/completions'
			: apiUrl.pathname + '/chat/completions';

		console.log('Kimi: Making HTTP request to', `${apiUrl.protocol}//${apiUrl.hostname}${path}`);

		const options = {
			hostname: apiUrl.hostname,
			port: apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80),
			path: path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
				'Content-Length': Buffer.byteLength(data)
			}
		};

		// Add timeout to prevent hanging requests
		const timeoutId = setTimeout(() => {
			req.destroy();
			console.error('Kimi: API request timeout (30s elapsed)');
			reject(new Error('Kimi API request timeout (30s elapsed)'));
		}, 30000);  // 30 seconds timeout

		const req = https.request(options, (res) => {
			console.log('Kimi: API response status:', res.statusCode);
			console.log('Kimi: API response headers:', JSON.stringify(res.headers));

			// Check response status
			if (res.statusCode !== 200) {
				let errorBody = '';
				res.on('data', (chunk) => {
					errorBody += chunk.toString();
				});
				res.on('end', () => {
					clearTimeout(timeoutId);
					console.error('Kimi: API error response status:', res.statusCode);
					console.error('Kimi: API error response body:', errorBody);
					try {
						const errorJson = JSON.parse(errorBody);
						const errorMessage = errorJson.error?.message || errorBody || `HTTP ${res.statusCode}`;
						reject(new Error(`Kimi API request failed: ${errorMessage}`));
					} catch (e) {
						reject(new Error(`Kimi API request failed: HTTP ${res.statusCode}: ${errorBody}`));
					}
				});
				res.on('error', (err) => {
					clearTimeout(timeoutId);
					console.error('Kimi: API response error:', err.message);
					reject(new Error(`Kimi API request error: ${err.message}`));
				});
				return;
			} let buffer = '';
			let hasReceivedData = false;

			res.on('data', (chunk: any) => {
				hasReceivedData = true;
				console.log('Kimi: Received chunk, size:', chunk.length);
				buffer += chunk.toString();
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmedLine = line.trim();
					if (!trimmedLine) {
						continue;
					}

					if (trimmedLine.startsWith('data: ')) {
						const jsonStr = trimmedLine.slice(6);
						if (jsonStr === '[DONE]') {
							console.log('Kimi: Stream finished ([DONE] received)');
							clearTimeout(timeoutId);
							resolve();
							return;
						}
						try {
							const json = JSON.parse(jsonStr);
							// Check for errors
							if (json.error) {
								console.error('Kimi: API error in stream:', json.error);
								clearTimeout(timeoutId);
								reject(new Error(`Kimi API error: ${json.error.message || JSON.stringify(json.error)}`));
								return;
							}
							const content = json.choices?.[0]?.delta?.content || '';
							if (content) {
								console.log('Kimi: Got response chunk:', content.substring(0, 50) + '...');
								// Send response through progress callback
								progress.report(new vscode.LanguageModelTextPart(content));
							}
						} catch (e) {
							// Ignore parsing errors, continue processing next line
							console.warn('Failed to parse SSE data:', e, 'line:', jsonStr.substring(0, 100));
						}
					}
				}
			});

			res.on('end', () => {
				clearTimeout(timeoutId);
				// Process remaining buffer
				if (buffer.trim()) {
					const trimmedLine = buffer.trim();
					if (trimmedLine.startsWith('data: ')) {
						const jsonStr = trimmedLine.slice(6);
						if (jsonStr !== '[DONE]') {
							try {
								const json = JSON.parse(jsonStr);
								// Check for errors
								if (json.error) {
									console.error('Kimi: Final error:', json.error);
									reject(new Error(`Kimi API error: ${json.error.message || JSON.stringify(json.error)}`));
									return;
								}
								const content = json.choices?.[0]?.delta?.content || '';
								if (content) {
									console.log('Kimi: Processing final chunk:', content.substring(0, 50) + '...');
									progress.report(new vscode.LanguageModelTextPart(content));
								}
							} catch (e) {
								// Ignore parsing errors
								console.warn('Failed to parse final SSE data:', e);
							}
						}
					}
				}
				// If no data received, API may have returned empty response
				if (!hasReceivedData) {
					console.error('Kimi: API returned empty response');
					reject(new Error('Kimi API returned empty response'));
					return;
				}
				console.log('Kimi: Response stream completed');
				resolve();
			});

			res.on('error', (err: any) => {
				clearTimeout(timeoutId);
				console.error('Kimi: Response stream error:', err.message);
				reject(new Error(`Kimi API response error: ${err.message}`));
			});
		});

		req.on('error', (err) => {
			reject(err);
		});

		token.onCancellationRequested(() => {
			req.destroy();
			reject(new Error('Cancelled'));
		});

		req.write(data);
		req.end();
	});
}

// Token count estimation
async function estimateTokenCount(text: string | vscode.LanguageModelChatRequestMessage): Promise<number> {
	let content = '';

	if (typeof text === 'string') {
		content = text;
	} else {
		// Extract text from message
		content = text.content
			.map(part => {
				if (part instanceof vscode.LanguageModelTextPart) {
					return part.value;  // Use value property, not text
				}
				return '';
			})
			.join('');
	}

	// Simple estimation: Chinese ~1.5 chars = 1 token, English ~4 chars = 1 token
	// Should actually call model's tokenizer API
	const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
	const englishChars = content.length - chineseChars;

	return Math.ceil(chineseChars / 1.5 + englishChars / 4);
}


export function activate(context: vscode.ExtensionContext) {
	console.log('Kimi Chat Extension activated');

	// Register Kimi authentication provider (for Chat entitlement system)
	// This allows the Chat system to recognize Kimi as an available auth provider
	vscode.authentication.registerAuthenticationProvider('kimi', 'Kimi', {
		onDidChangeSessions: new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>().event,
		async getSessions(_scopes?: string[]): Promise<vscode.AuthenticationSession[]> {
			// Return a dummy session since Kimi API doesn't require traditional authentication
			// The actual API key is handled separately
			return [{
				id: 'kimi-default',
				accessToken: KIMI_DEFAULT_API_KEY,
				account: {
					id: 'kimi-user',
					label: 'Kimi User'
				},
				scopes: []
			}];
		},
		async createSession(_scopes: string[]): Promise<vscode.AuthenticationSession> {
			// Return the default session
			return {
				id: 'kimi-default',
				accessToken: KIMI_DEFAULT_API_KEY,
				account: {
					id: 'kimi-user',
					label: 'Kimi User'
				},
				scopes: []
			};
		},
		async removeSession(_sessionId: string): Promise<void> {
			// No-op for Kimi since we don't manage sessions
		}
	}, { supportsMultipleAccounts: false });

	// Register Kimi model provider
	const provider = vscode.lm.registerLanguageModelChatProvider('kimi', {
		async provideLanguageModelChatInformation(_options, _token) {
			console.log('Kimi: provideLanguageModelChatInformation called');
			const models = [
				{
					id: 'Kimi-K2',
					name: 'Kimi-K2',
					version: '1.0',
					family: 'kimi',
					maxInputTokens: 200000,
					maxOutputTokens: 8192,
					isUserSelectable: true,
					isDefault: true,
					capabilities: {
						toolCalling: false,
						imageInput: false
					},
					detail: 'Kimi-K2 large language model (via GitCode API)',
					tooltip: 'Kimi-K2 - Supports long text understanding'
				}
			];
			console.log('Kimi: Returning models:', JSON.stringify(models));
			return models;
		},

		async provideLanguageModelChatResponse(model, messages, _options, progress, token) {
			// Implement API call (using GitCode API), send response through progress callback
			try {
				await callKimiAPI(model, messages, progress, token, context);
			} catch (error) {
				// Ensure error is properly thrown so VS Code can handle it
				console.error('Kimi API call failed:', error);
				throw error;
			}
		},

		async provideTokenCount(_model, text, _token) {
			// Implement token counting
			return estimateTokenCount(text);
		}
	});

	// Register management command
	const manageCommand = vscode.commands.registerCommand('kimi.manageApiKey', async () => {
		// Read current API Key
		const currentKey = await getApiKey(context);
		const placeholder = currentKey && currentKey !== KIMI_DEFAULT_API_KEY
			? '***' + currentKey.slice(-4)
			: '';

		const apiKey = await vscode.window.showInputBox({
			prompt: 'Please enter Kimi API Key (via GitCode)',
			password: true,
			placeHolder: placeholder,
			ignoreFocusOut: true
		});

		if (apiKey) {
			await saveApiKey(context, apiKey);
			vscode.window.showInformationMessage('Kimi API Key saved');
		}
	});

	context.subscriptions.push(provider, manageCommand);
}

export function deactivate() {
	console.log('Kimi Chat Extension deactivated');
}
