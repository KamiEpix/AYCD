# AI Integration Guide


This guide explains how AYCD integrates with external and local AI providers, and how to configure and use them safely.

## Overview

AYCD supports multiple AI providers with a consistent interface. All AI features are **optional** and **privacy-first**:

- API keys stored in OS keychain
- All processing logged locally
- No data sent without explicit user action
- Works fully offline if AI disabled

---

## Supported Providers

### 1. OpenAI (ChatGPT)

**Models**:
- `gpt-4o-mini` (recommended for speed/cost)
- `gpt-4o` (max quality)
- `gpt-4-turbo`

**Pricing** (as of Nov 2025):
- gpt-4o-mini: $0.15/1M input, $0.60/1M output
- gpt-4o: $2.50/1M input, $10/1M output

**Implementation**:
```rust
// apps/desktop/src-tauri/src/ai/openai.rs

use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<Message>,
    temperature: f32,
    max_tokens: u32,
    stream: bool,
}

#[derive(Deserialize)]
struct OpenAIResponse {
    choices: Vec<Choice>,
    usage: Usage,
}

pub async fn chat(
    api_key: &str,
    model: &str,
    messages: Vec<Message>,
    params: ChatParams,
) -> Result<String, Error> {
    let client = Client::new();
    
    let request = OpenAIRequest {
        model: model.to_string(),
        messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        stream: false,
    };
    
    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request)
        .send()
        .await?
        .json::<OpenAIResponse>()
        .await?;
    
    Ok(response.choices[0].message.content.clone())
}
```

---

### 2. Anthropic (Claude)

**Models**:
- `claude-sonnet-4-20250514` (recommended)
- `claude-opus-4-20250514` (max quality)
- `claude-haiku-4-20250416` (fastest)

**Pricing**:
- Sonnet 4: $3/1M input, $15/1M output
- Opus 4: $15/1M input, $75/1M output
- Haiku 4: $0.80/1M input, $4/1M output

**Implementation**:
```rust
// apps/desktop/src-tauri/src/ai/anthropic.rs

#[derive(Serialize)]
struct AnthropicRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<Message>,
    temperature: f32,
}

pub async fn chat(
    api_key: &str,
    model: &str,
    messages: Vec<Message>,
    params: ChatParams,
) -> Result<String, Error> {
    let client = Client::new();
    
    let request = AnthropicRequest {
        model: model.to_string(),
        max_tokens: params.max_tokens,
        messages,
        temperature: params.temperature,
    };
    
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&request)
        .send()
        .await?
        .json::<AnthropicResponse>()
        .await?;
    
    Ok(response.content[0].text.clone())
}
```

---

### 3. Google (Gemini)

**Models**:
- `gemini-1.5-pro` (recommended)
- `gemini-1.5-flash` (faster/cheaper)

**Pricing**:
- Pro: $1.25/1M input, $5/1M output
- Flash: $0.075/1M input, $0.30/1M output

**Implementation**:
```rust
// apps/desktop/src-tauri/src/ai/gemini.rs

pub async fn chat(
    api_key: &str,
    model: &str,
    messages: Vec<Message>,
    params: ChatParams,
) -> Result<String, Error> {
    let client = Client::new();
    
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );
    
    let request = GeminiRequest {
        contents: convert_messages(messages),
        generation_config: GenerationConfig {
            temperature: params.temperature,
            max_output_tokens: params.max_tokens,
        },
    };
    
    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await?
        .json::<GeminiResponse>()
        .await?;
    
    Ok(response.candidates[0].content.parts[0].text.clone())
}
```

---

### 4. Local Models (Ollama/LM Studio)

**Models** (via llama.cpp):
- Llama 3.1 (8B, 70B)
- Mistral 7B
- Mixtral 8x7B
- Custom GGUF files

**Pricing**: Free (runs on your hardware)

**Implementation**:
```rust
// apps/desktop/src-tauri/src/ai/local.rs

pub async fn chat(
    base_url: &str,  // http://localhost:11434 for Ollama
    model: &str,
    messages: Vec<Message>,
    params: ChatParams,
) -> Result<String, Error> {
    let client = Client::new();
    
    // OpenAI-compatible API
    let request = OpenAIRequest {
        model: model.to_string(),
        messages,
        temperature: params.temperature,
        max_tokens: params.max_tokens,
        stream: false,
    };
    
    let response = client
        .post(format!("{}/v1/chat/completions", base_url))
        .json(&request)
        .send()
        .await?
        .json::<OpenAIResponse>()
        .await?;
    
    Ok(response.choices[0].message.content.clone())
}
```

---

## Provider Adapter

Unified interface for all providers:

```rust
// apps/desktop/src-tauri/src/ai/mod.rs

pub enum Provider {
    OpenAI { api_key: String, model: String },
    Anthropic { api_key: String, model: String },
    Gemini { api_key: String, model: String },
    Local { base_url: String, model: String },
}

pub struct ChatParams {
    pub temperature: f32,
    pub max_tokens: u32,
}

impl Provider {
    pub async fn chat(
        &self,
        messages: Vec<Message>,
        params: ChatParams,
    ) -> Result<String, Error> {
        match self {
            Provider::OpenAI { api_key, model } => {
                openai::chat(api_key, model, messages, params).await
            }
            Provider::Anthropic { api_key, model } => {
                anthropic::chat(api_key, model, messages, params).await
            }
            Provider::Gemini { api_key, model } => {
                gemini::chat(api_key, model, messages, params).await
            }
            Provider::Local { base_url, model } => {
                local::chat(base_url, model, messages, params).await
            }
        }
    }
    
    pub async fn chat_stream(
        &self,
        messages: Vec<Message>,
        params: ChatParams,
    ) -> Result<impl Stream<Item = String>, Error> {
        // Streaming implementation for each provider
        todo!()
    }
}
```

---

## Tauri Commands

### Setup Provider

```rust
#[tauri::command]
async fn setup_ai_provider(
    provider_type: String,
    api_key: String,
    model: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Validate API key
    test_connection(&provider_type, &api_key, &model).await?;
    
    // Store in OS keychain
    keyring::set_password("aycd", &provider_type, &api_key)
        .map_err(|e| e.to_string())?;
    
    // Save config
    let mut config = state.config.lock().await;
    config.ai_providers.insert(provider_type, ProviderConfig {
        model,
        enabled: true,
    });
    config.save()?;
    
    Ok(())
}
```

### Chat (Non-Streaming)

```rust
#[tauri::command]
async fn ai_chat(
    provider: String,
    messages: Vec<Message>,
    params: ChatParams,
    state: State<'_, AppState>,
) -> Result<ChatResponse, String> {
    let config = state.config.lock().await;
    let provider_config = config.ai_providers.get(&provider)
        .ok_or("Provider not configured")?;
    
    let api_key = keyring::get_password("aycd", &provider)
        .map_err(|e| e.to_string())?;
    
    let provider_instance = Provider::from_config(&provider, &api_key, provider_config)?;
    
    let start = Instant::now();
    let response = provider_instance.chat(messages.clone(), params).await?;
    let duration = start.elapsed();
    
    // Log interaction
    log_ai_interaction(AILog {
        provider: provider.clone(),
        model: provider_config.model.clone(),
        prompt: messages.last().unwrap().content.clone(),
        response: response.clone(),
        duration_ms: duration.as_millis() as u64,
    }).await?;
    
    Ok(ChatResponse {
        content: response,
        usage: calculate_tokens(&messages, &response),
        cost: estimate_cost(&provider, &usage),
    })
}
```

### Chat (Streaming)

```rust
use tauri::Manager;

#[tauri::command]
async fn ai_chat_stream(
    provider: String,
    messages: Vec<Message>,
    params: ChatParams,
    app: tauri::AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let stream_id = uuid::Uuid::new_v4().to_string();
    
    // Setup provider (same as non-streaming)
    let provider_instance = /* ... */;
    
    tokio::spawn(async move {
        let mut stream = provider_instance.chat_stream(messages, params).await?;
        
        while let Some(chunk) = stream.next().await {
            app.emit_all(&format!("chat-stream-{}", stream_id), chunk).ok();
        }
        
        app.emit_all(&format!("chat-complete-{}", stream_id), ()).ok();
    });
    
    Ok(stream_id)
}
```

---

## Recipe System

### Recipe Format (TOML)

```toml
# .aycd/recipes/expand_beat.toml

[metadata]
id = "expand_beat"
name = "Expand Beat to Scene"
description = "Turn a terse outline beat into vivid prose"
version = "1.0"
author = "AYCD"

[defaults]
provider = "local"
model = "llama3.1:8b"
temperature = 0.7
max_tokens = 600

[variables]
beat = { type = "text", required = true, description = "The beat to expand" }
style = { type = "enum", values = ["neutral", "noir", "whimsical"], default = "neutral" }
pov = { type = "text", required = false, description = "Point of view character" }
target_words = { type = "number", default = 500 }

[template]
system = """
You are a creative writing assistant. Expand terse beats into vivid, tightly paced prose.
Preserve POV/tense and continuity. Avoid clichés. Show don't tell.
"""

user = """
OUTLINE CONTEXT:
{{#if outline_context}}
{{outline_context}}
{{/if}}

BEAT TO EXPAND:
{{beat}}

CONSTRAINTS:
- Style: {{style}}
{{#if pov}}- POV: {{pov}}{{/if}}
- Target length: ~{{target_words}} words
- Maintain scene momentum
- Crisp dialogue, vivid sensory details

Expand the beat into a full scene.
"""

[post_processing]
strip_trailing_whitespace = true
ensure_smart_quotes = true
max_output_words = 800
```

### Recipe Execution

```rust
#[tauri::command]
async fn run_recipe(
    recipe_id: String,
    variables: HashMap<String, String>,
    override_provider: Option<String>,
    state: State<'_, AppState>,
) -> Result<RecipeResult, String> {
    // Load recipe
    let recipe = Recipe::load(&recipe_id)?;
    
    // Validate variables
    recipe.validate_variables(&variables)?;
    
    // Render template
    let handlebars = Handlebars::new();
    let system_prompt = handlebars.render_template(&recipe.template.system, &variables)?;
    let user_prompt = handlebars.render_template(&recipe.template.user, &variables)?;
    
    let messages = vec![
        Message { role: "system".to_string(), content: system_prompt },
        Message { role: "user".to_string(), content: user_prompt },
    ];
    
    // Execute
    let provider = override_provider.unwrap_or(recipe.defaults.provider);
    let params = ChatParams {
        temperature: recipe.defaults.temperature,
        max_tokens: recipe.defaults.max_tokens,
    };
    
    let response = ai_chat(provider, messages, params, state).await?;
    
    // Post-process
    let processed = apply_post_processing(&response.content, &recipe.post_processing)?;
    
    Ok(RecipeResult {
        content: processed,
        usage: response.usage,
        cost: response.cost,
    })
}
```

---

## Frontend Integration

### AI Chat Panel

```svelte
<!-- apps/desktop/src/lib/components/AIChat.svelte -->
<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';

  let messages = $state<Message[]>([]);
  let input = $state('');
  let streaming = $state(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    messages = [...messages, userMessage];
    input = '';
    streaming = true;

    const streamId = await invoke<string>('ai_chat_stream', {
      provider: 'anthropic',
      messages: [...messages],
      params: { temperature: 0.7, maxTokens: 1000 },
    });

    let assistantMessage = { role: 'assistant', content: '' };
    messages = [...messages, assistantMessage];

    const unlisten = await listen<string>(`chat-stream-${streamId}`, (event) => {
      assistantMessage.content += event.payload;
      messages = [...messages];
    });

    await listen(`chat-complete-${streamId}`, () => {
      streaming = false;
      unlisten();
    });
  }
</script>

<div class="flex flex-col h-full">
  <!-- Messages -->
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    {#each messages as message}
      <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="
          max-w-[80%] rounded-lg p-3
          {message.role === 'user' 
            ? 'bg-primary-500 text-white' 
            : 'bg-neutral-200 dark:bg-neutral-800'}
        ">
          {message.content}
        </div>
      </div>
    {/each}
  </div>

  <!-- Input -->
  <div class="border-t p-4">
    <form onsubmit={(e) => { e.preventDefault(); sendMessage(); }}>
      <textarea
        bind:value={input}
        disabled={streaming}
        placeholder="Ask AI for help..."
        class="w-full border rounded p-2"
        rows="3"
      />
      <button 
        type="submit"
        disabled={streaming || !input.trim()}
        class="mt-2 px-4 py-2 bg-primary-500 text-white rounded"
      >
        {streaming ? 'Sending...' : 'Send'}
      </button>
    </form>
  </div>
</div>
```

### Recipe Runner

```svelte
<!-- apps/desktop/src/lib/components/RecipeRunner.svelte -->
<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';

  let recipes = $state<Recipe[]>([]);
  let selectedRecipe = $state<Recipe | null>(null);
  let variables = $state<Record<string, string>>({});
  let result = $state<string>('');
  let running = $state(false);

  async function runRecipe() {
    if (!selectedRecipe) return;

    running = true;
    try {
      const response = await invoke<RecipeResult>('run_recipe', {
        recipeId: selectedRecipe.id,
        variables,
      });
      result = response.content;
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      running = false;
    }
  }
</script>

<div class="grid grid-cols-2 gap-4 h-full">
  <!-- Recipe selection -->
  <div class="border-r p-4">
    <h2 class="text-lg font-semibold mb-4">AI Recipes</h2>
    
    <div class="space-y-2">
      {#each recipes as recipe}
        <button
          onclick={() => selectedRecipe = recipe}
          class="w-full text-left p-3 rounded hover:bg-neutral-100"
        >
          <div class="font-medium">{recipe.name}</div>
          <div class="text-sm text-neutral-600">{recipe.description}</div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Recipe form -->
  <div class="p-4">
    {#if selectedRecipe}
      <h3 class="text-lg font-semibold mb-4">{selectedRecipe.name}</h3>

      <form onsubmit={(e) => { e.preventDefault(); runRecipe(); }} class="space-y-4">
        {#each Object.entries(selectedRecipe.variables) as [key, config]}
          <div>
            <label class="block text-sm font-medium mb-1">{config.description}</label>
            {#if config.type === 'text'}
              <textarea
                bind:value={variables[key]}
                required={config.required}
                class="w-full border rounded p-2"
                rows="3"
              />
            {:else if config.type === 'enum'}
              <select bind:value={variables[key]} class="w-full border rounded p-2">
                {#each config.values as value}
                  <option {value}>{value}</option>
                {/each}
              </select>
            {/if}
          </div>
        {/each}

        <button 
          type="submit"
          disabled={running}
          class="px-4 py-2 bg-primary-500 text-white rounded"
        >
          {running ? 'Running...' : 'Run Recipe'}
        </button>
      </form>

      {#if result}
        <div class="mt-6">
          <h4 class="font-semibold mb-2">Result:</h4>
          <pre class="bg-neutral-100 dark:bg-neutral-900 rounded p-4 whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      {/if}
    {/if}
  </div>
</div>
```

---

## Cost Tracking

```typescript
// apps/desktop/src/lib/utils/ai-cost.ts

const PRICING = {
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'gpt-4o': { input: 2.50 / 1_000_000, output: 10 / 1_000_000 },
  'claude-sonnet-4-20250514': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  'claude-opus-4-20250514': { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  'gemini-1.5-pro': { input: 1.25 / 1_000_000, output: 5 / 1_000_000 },
};

export function estimateCost(
  model: string,
  usage: { promptTokens: number; completionTokens: number }
): number {
  const pricing = PRICING[model];
  if (!pricing) return 0;

  const inputCost = usage.promptTokens * pricing.input;
  const outputCost = usage.completionTokens * pricing.output;
  
  return inputCost + outputCost;
}
```

---

**Next**: See `09_Build.md` for deployment and distribution.
