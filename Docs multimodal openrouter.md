Docs OpenRouter Multimodal tolong kamu baca dan pahami semuanya

---

title: Image Inputs

subtitle: How to send images to OpenRouter models

headline: OpenRouter Image Inputs | Complete Documentation

canonical-url: '[https://openrouter.ai/docs/guides/overview/multimodal/images](https://openrouter.ai/docs/guides/overview/multimodal/images)'

'og:site_name': OpenRouter Documentation

'og:title': OpenRouter Image Inputs - Complete Documentation

'og:description': Send images to vision models through the OpenRouter API.

'og:image':

  type: url

  value: >-

```
[https://openrouter.ai/dynamic-og?title=OpenRouter%20Image%20Inputs&description=Send%20images%20to%20vision%20models%20through%20the%20OpenRouter%20API](https://openrouter.ai/dynamic-og?title=OpenRouter%20Image%20Inputs&description=Send%20images%20to%20vision%20models%20through%20the%20OpenRouter%20API).
```

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary_large_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

---

  API_KEY_REF,

} from '../../../../imports/constants';

Requests with images, to multimodel models, are available via the `/api/v1/chat/completions` API with a multi-part `messages` parameter. The `image_url` can either be a URL or a base64-encoded image. Note that multiple images can be sent in separate content array entries. The number of images you can send in a single request varies per provider and per model. Due to how the content is parsed, we recommend sending the text prompt first, then the images. If the images must come first, we recommend putting it in the system prompt.

OpenRouter supports both **direct URLs** and **base64-encoded data** for images:

- **URLs**: More efficient for publicly accessible images as they don't require local encoding
- **Base64**: Required for local files or private images that aren't publicly accessible

### Using Image URLs

Here's how to send an image using a URL:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemini-3-flash-preview'

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

const result = await [openRouter.chat](http://openRouter.chat).send({

  model: '{{MODEL}}',

  messages: [

    {

      role: 'user',

      content: [

        {

          type: 'text',

          text: "What's in this image?",

        },

        {

          type: 'image_url',

          imageUrl: {

            url: '[https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg](https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg)',

          },

        },

      ],

    },

  ],

  stream: false,

});

console.log(result);

```

```python

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

messages = [

    {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": "What's in this image?"

            },

            {

                "type": "image_url",

                "image_url": {

                    "url": "[https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg](https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg)"

                }

            }

        ]

    }

]

payload = {

    "model": "{{MODEL}}",

    "messages": messages

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

print(response.json())

```

```typescript title="TypeScript (fetch)"

const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    messages: [

      {

        role: 'user',

        content: [

          {

            type: 'text',

            text: "What's in this image?",

          },

          {

            type: 'image_url',

            image_url: {

              url: '[https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg](https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg)',

            },

          },

        ],

      },

    ],

  }),

});

const data = await response.json();

console.log(data);

```





### Using Base64 Encoded Images

For locally stored images, you can send them using base64 encoding. Here's how to do it:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemini-3-flash-preview'

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

async function encodeImageToBase64(imagePath: string): Promise<string> {

  const imageBuffer = await fs.promises.readFile(imagePath);

  const base64Image = imageBuffer.toString('base64');

  return `data:image/jpeg;base64,${base64Image}`;

}

// Read and encode the image

const imagePath = 'path/to/your/image.jpg';

const base64Image = await encodeImageToBase64(imagePath);

const result = await [openRouter.chat](http://openRouter.chat).send({

  model: '{{MODEL}}',

  messages: [

    {

      role: 'user',

      content: [

        {

          type: 'text',

          text: "What's in this image?",

        },

        {

          type: 'image_url',

          imageUrl: {

            url: base64Image,

          },

        },

      ],

    },

  ],

  stream: false,

});

console.log(result);

```

```python

from pathlib import Path

def encode_image_to_base64(image_path):

    with open(image_path, "rb") as image_file:

        return base64.b64encode(image_[file.read](http://file.read)()).decode('utf-8')

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

# Read and encode the image

image_path = "path/to/your/image.jpg"

base64_image = encode_image_to_base64(image_path)

data_url = f"data:image/jpeg;base64,{base64_image}"

messages = [

    {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": "What's in this image?"

            },

            {

                "type": "image_url",

                "image_url": {

                    "url": data_url

                }

            }

        ]

    }

]

payload = {

    "model": "{{MODEL}}",

    "messages": messages

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

print(response.json())

```

```typescript title="TypeScript (fetch)"

async function encodeImageToBase64(imagePath: string): Promise<string> {

  const imageBuffer = await fs.promises.readFile(imagePath);

  const base64Image = imageBuffer.toString('base64');

  return `data:image/jpeg;base64,${base64Image}`;

}

// Read and encode the image

const imagePath = 'path/to/your/image.jpg';

const base64Image = await encodeImageToBase64(imagePath);

const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    messages: [

      {

        role: 'user',

        content: [

          {

            type: 'text',

            text: "What's in this image?",

          },

          {

            type: 'image_url',

            image_url: {

              url: base64Image,

            },

          },

        ],

      },

    ],

  }),

});

const data = await response.json();

console.log(data);

```





Supported image content types are:

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/gif`

---

title: Image Generation

subtitle: How to generate images with OpenRouter models

headline: OpenRouter Image Generation | Complete Documentation

canonical-url: '[https://openrouter.ai/docs/guides/overview/multimodal/image-generation](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)'

'og:site_name': OpenRouter Documentation

'og:title': OpenRouter Image Generation - Complete Documentation

'og:description': Generate images using AI models through the OpenRouter API.

'og:image':

  type: url

  value: >-

```
[https://openrouter.ai/dynamic-og?title=OpenRouter%20Image%20Generation&description=Generate%20images%20using%20AI%20models%20through%20the%20OpenRouter%20API](https://openrouter.ai/dynamic-og?title=OpenRouter%20Image%20Generation&description=Generate%20images%20using%20AI%20models%20through%20the%20OpenRouter%20API).
```

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary_large_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

---

  API_KEY_REF,

} from '../../../../imports/constants';

OpenRouter supports image generation via the [Chat Completions](/docs/api/api-reference/chat/send-chat-completion-request) and [Responses](/docs/api/reference/responses/overview) endpoints. You can find the supported models, their capabilities, and pricing by filtering our [model list by image output]([https://openrouter.ai/models?output_modalities=image](https://openrouter.ai/models?output_modalities=image)).

## Model Discovery

You can find image generation models in several ways:

### Via the API

Use the `output_modalities` query parameter on the [Models API](/docs/api-reference/models/get-models) to programmatically discover image generation models:

```bash

# List only image generation models

curl "[https://openrouter.ai/api/v1/models?output_modalities=image](https://openrouter.ai/api/v1/models?output_modalities=image)"

# List models that support both text and image output

curl "[https://openrouter.ai/api/v1/models?output_modalities=text,image](https://openrouter.ai/api/v1/models?output_modalities=text,image)"

```

See [Models - Query Parameters](/docs/guides/overview/models#query-parameters) for the full list of supported modality values.

### On the Models Page

Visit the [Models page](/models) and filter by output modalities to find models capable of image generation. Look for models that list `"image"` in their output modalities.

### In the Chatroom

When using the [Chatroom](/chat), click the **Image** button to automatically filter and select models with image generation capabilities. If no image-capable model is active, you'll be prompted to add one.

## API Usage

To generate images, send a request to the `/api/v1/chat/completions` endpoint with the `modalities` parameter. The value depends on the model's capabilities:

- **Models that output both text and images** (e.g., Gemini): Use `modalities: ["image", "text"]`
- **Models that only output images** (e.g., Sourceful, Flux): Use `modalities: ["image"]`

### Basic Image Generation

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemini-2.5-flash-image'

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

const result = await [openRouter.chat](http://openRouter.chat).send({

  model: '{{MODEL}}',

  messages: [

    {

      role: 'user',

      content: 'Generate a beautiful sunset over mountains',

    },

  ],

  modalities: ['image', 'text'],

  stream: false,

});

// The generated image will be in the assistant message

if (result.choices) {

  const message = result.choices[0].message;

  if (message.images) {

    message.images.forEach((image, index) => {

      const imageUrl = image.imageUrl.url; // Base64 data URL

      console.log`Generated image ${index + 1}: ${imageUrl.substring(0, 50)}...`);

    });

  }

}

```

```python

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

payload = {

    "model": "{{MODEL}}",

    "messages": [

        {

            "role": "user",

            "content": "Generate a beautiful sunset over mountains"

        }

    ],

    "modalities": ["image", "text"]

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

result = response.json()

# The generated image will be in the assistant message

if result.get("choices"):

    message = result["choices"][0]["message"]

    if message.get("images"):

        for image in message["images"]:

            image_url = image["image_url"]["url"]  # Base64 data URL

            print(f"Generated image: {image_url[:50]}...")

```

```typescript title="TypeScript (fetch)"

const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    messages: [

      {

        role: 'user',

        content: 'Generate a beautiful sunset over mountains',

      },

    ],

    modalities: ['image', 'text'],

  }),

});

const result = await response.json();

// The generated image will be in the assistant message

if (result.choices) {

  const message = result.choices[0].message;

  if (message.images) {

    message.images.forEach((image, index) => {

      const imageUrl = image.image_url.url; // Base64 data URL

      console.log`Generated image ${index + 1}: ${imageUrl.substring(0, 50)}...`);

    });

  }

}

```





### Image Configuration Options

Some image generation models support additional configuration through the `image_config` parameter.

#### Aspect Ratio

Set `image_config.aspect_ratio` to request specific aspect ratios for generated images.

**Supported aspect ratios:**

- `1:1` → 1024×1024 (default)
- `2:3` → 832×1248
- `3:2` → 1248×832
- `3:4` → 864×1184
- `4:3` → 1184×864
- `4:5` → 896×1152
- `5:4` → 1152×896
- `9:16` → 768×1344
- `16:9` → 1344×768
- `21:9` → 1536×672

**Extended aspect ratios** (supported by `google/gemini-3.1-flash-image-preview`](/models/google/gemini-3.1-flash-image-preview) only):

- `1:4` → Tall, narrow format ideal for scrolling carousels and vertical UI elements
- `4:1` → Wide, short format for hero banners and horizontal layouts
- `1:8` → Extra-tall format for notification headers and narrow vertical spaces
- `8:1` → Extra-wide format for wide-format banners and panoramic layouts

#### Image Size

Set `image_config.image_size` to control the resolution of generated images.

**Supported sizes:**

- `1K` → Standard resolution (default)
- `2K` → Higher resolution
- `4K` → Highest resolution
- `0.5K` → Lower resolution, optimized for efficiency (supported by `google/gemini-3.1-flash-image-preview`](/models/google/gemini-3.1-flash-image-preview) only)

You can combine both `aspect_ratio` and `image_size` in the same request:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemini-3-pro-image-preview'

}}>



```python

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

payload = {

    "model": "{{MODEL}}",

    "messages": [

        {

            "role": "user",

            "content": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"

        }

    ],

    "modalities": ["image", "text"],

    "image_config": {

        "aspect_ratio": "16:9",

        "image_size": "4K"

    }

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

result = response.json()

if result.get("choices"):

    message = result["choices"][0]["message"]

    if message.get("images"):

        for image in message["images"]:

            image_url = image["image_url"]["url"]

            print(f"Generated image: {image_url[:50]}...")

```

```typescript

const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    messages: [

      {

        role: 'user',

        content: 'Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme',

      },

    ],

    modalities: ['image', 'text'],

    image_config: {

      aspect_ratio: '16:9',

      image_size: '4K',

    },

  }),

});

const result = await response.json();

if (result.choices) {

  const message = result.choices[0].message;

  if (message.images) {

    message.images.forEach((image, index) => {

      const imageUrl = image.image_url.url;

      console.log`Generated image ${index + 1}: ${imageUrl.substring(0, 50)}...`);

    });

  }

}

```





#### Strength (Recraft only)

Set `image_config.strength` to control how much the output image differs from the input image during image-to-image generation. This parameter only applies when input images are provided in `messages`. It is only supported by Recraft models.

- **Range**: `0.0` to `1.0`
- **Default**: `0.2`
- Lower values produce outputs closer to the input image; higher values allow more creative deviation.

**Example:**

```json

{

  "image_config": {

    "strength": 0.7

  }

}

```

#### Text Layout (Recraft V3 only)

Use `image_config.text_layout` to place text at specific positions on the generated image. Each entry specifies the text to render and a bounding box defined by four corner points in normalized coordinates (0 to 1). This parameter is only supported by Recraft V3 `recraft/recraft-v3`) for both text-to-image and image-to-image requests. Recraft V4 and V4 Pro do not support `text_layout`.

Each text layout entry is an object with:

- `text` (required): The text string to render
- `bbox` (required): Array of 4 `[x, y]` coordinate pairs defining the bounding box corners (top-left, top-right, bottom-right, bottom-left), with values from 0 to 1

**Example:**

```json

{

  "image_config": {

    "text_layout": [

      {

        "text": "Hello",

        "bbox": [[0.3, 0.45], [0.6, 0.45], [0.6, 0.55], [0.3, 0.55]]

      },

      {

        "text": "World",

        "bbox": [[0.35, 0.6], [0.65, 0.6], [0.65, 0.7], [0.35, 0.7]]

      }

    ]

  }

}

```

#### Style (Recraft V3 only)

Use `image_config.style` to apply a specific artistic style to the generated image. This parameter is only supported by Recraft V3 `recraft/recraft-v3`). Recraft V4 and V4 Pro do not support styles.

See the [full list of available styles]([https://www.recraft.ai/docs/api-reference/styles#list-of-styles](https://www.recraft.ai/docs/api-reference/styles#list-of-styles)) in Recraft's documentation. Note that vector styles are not supported.

**Example:**

```json

{

  "image_config": {

    "style": "Photorealism"

  }

}

```

#### RGB Colors (Recraft only)

Use `image_config.rgb_colors` to specify a color palette that influences the generated image. Each color is a `[r, g, b]` array of three integers (0 to 255). This parameter is supported by Recraft models for both text-to-image and image-to-image requests.

**Example:**

```json

{

  "image_config": {

    "rgb_colors": [

      [255, 0, 0],

      [0, 128, 0]

    ]

  }

}

```

#### Background RGB Color (Recraft only)

Use `image_config.background_rgb_color` to set a specific background color for the generated image. The value is a `[r, g, b]` array of three integers (0 to 255). This parameter is supported by Recraft models for both text-to-image and image-to-image requests.

**Example:**

```json

{

  "image_config": {

    "background_rgb_color": [0, 0, 255]

  }

}

```

You can combine `rgb_colors` and `background_rgb_color` in the same request:

```json

{

  "image_config": {

    "rgb_colors": [[255, 0, 0]],

    "background_rgb_color": [255, 255, 255]

  }

}

```

#### Font Inputs (Sourceful only)

Use `image_config.font_inputs` to render custom text with specific fonts in generated images. The text you want to render must also be included in your prompt for best results. This parameter is only supported by Sourceful models `sourceful/riverflow-v2-fast` and `sourceful/riverflow-v2-pro`).

Each font input is an object with:

- `font_url` (required): URL to the font file
- `text` (required): Text to render with the font

**Limits:**

- Maximum 2 font inputs per request
- Additional cost: $0.03 per font input

**Example:**

```json

{

  "image_config": {

    "font_inputs": [

      {

        "font_url": "[https://example.com/fonts/custom-font.ttf](https://example.com/fonts/custom-font.ttf)",

        "text": "Hello World"

      }

    ]

  }

}

```

**Tips for best results:**

- Include the text in your prompt along with details about font name, color, size, and position
- The `text` parameter should match exactly what's in your prompt - avoid extra wording or quotation marks
- Use line breaks or double spaces to separate headlines and sub-headers when using the same font
- Works best with short, clear headlines and sub-headlines

#### Super Resolution References (Sourceful only)

Use `image_config.super_resolution_references` to enhance low-quality elements in your input image using high-quality reference images. The output image will match the size of your input image, so use larger input images for better results. This parameter is only supported by Sourceful models `sourceful/riverflow-v2-fast` and `sourceful/riverflow-v2-pro`) when using image-to-image generation (i.e., when input images are provided in `messages`).

**Limits:**

- Maximum 4 reference URLs per request
- Only works with image-to-image requests (ignored when there are no images in `messages`)
- Additional cost: $0.20 per reference

**Example:**

```json

{

  "image_config": {

    "super_resolution_references": [

      "[https://example.com/reference1.jpg](https://example.com/reference1.jpg)",

      "[https://example.com/reference2.jpg](https://example.com/reference2.jpg)"

    ]

  }

}

```

**Tips for best results:**

- Supply an input image where the elements to enhance are present but low quality
- Use larger input images for better output quality (output matches input size)
- Use high-quality reference images that show what you want the enhanced elements to look like

### Streaming Image Generation

Image generation also works with streaming responses:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemini-2.5-flash-image'

}}>



```python

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

payload = {

    "model": "{{MODEL}}",

    "messages": [

        {

            "role": "user",

            "content": "Create an image of a futuristic city"

        }

    ],

    "modalities": ["image", "text"],

    "stream": True

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload, stream=True)

for line in response.iter_lines():

    if line:

        line = line.decode('utf-8')

        if line.startswith('data: '):

            data = line[6:]

            if data != '[DONE]':

                try:

                    chunk = json.loads(data)

                    if chunk.get("choices"):

                        delta = chunk["choices"][0].get("delta", {})

                        if delta.get("images"):

                            for image in delta["images"]:

                                print(f"Generated image: {image['image_url']['url'][:50]}...")

                except json.JSONDecodeError:

                    continue

```

```typescript

const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    messages: [

      {

        role: 'user',

        content: 'Create an image of a futuristic city',

      },

    ],

    modalities: ['image', 'text'],

    stream: true,

  }),

});

const reader = response.body?.getReader();

const decoder = new TextDecoder();

while (true) {

  const { done, value } = await [reader.read](http://reader.read)();

  if (done) break;

  const chunk = decoder.decode(value);

  const lines = chunk.split('\n');

  for (const line of lines) {

    if (line.startsWith('data: ')) {

      const data = line.slice(6);

      if (data !== '[DONE]') {

        try {

          const parsed = JSON.parse(data);

          if (parsed.choices) {

            const delta = parsed.choices[0].delta;

            if (delta?.images) {

              delta.images.forEach((image, index) => {

                console.log`Generated image ${index + 1}: ${image.image_url.url.substring(0, 50)}...`);

              });

            }

          }

        } catch (e) {

          // Skip invalid JSON

        }

      }

    }

  }

}

```





## Response Format

When generating images, the assistant message includes an `images` field containing the generated images:

```json

{

  "choices": [

    {

      "message": {

        "role": "assistant",

        "content": "I've generated a beautiful sunset image for you.",

        "images": [

          {

            "type": "image_url",

            "image_url": {

              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."

            }

          }

        ]

      }

    }

  ]

}

```

### Image Format

- **Format**: Images are returned as base64-encoded data URLs
- **Types**: Typically PNG format `data:image/png;base64,`)
- **Multiple Images**: Some models can generate multiple images in a single response
- **Size**: Image dimensions vary by model capabilities

## Model Compatibility

Not all models support image generation. To use this feature:

1. **Check Output Modalities**: Ensure the model has `"image"` in its `output_modalities`
2. **Set Modalities Parameter**: Use `["image", "text"]` for models that output both, or `["image"]` for image-only models
3. **Use Compatible Models**: Examples include:
  - `google/gemini-3.1-flash-image-preview` (supports extended aspect ratios and 0.5K resolution)
  - `google/gemini-2.5-flash-image`
  - `black-forest-labs/flux.2-pro`
  - `black-forest-labs/flux.2-flex`
  - `sourceful/riverflow-v2-standard-preview`
  - Other models with image generation capabilities

## Best Practices

- **Clear Prompts**: Provide detailed descriptions for better image quality
- **Model Selection**: Choose models specifically designed for image generation
- **Error Handling**: Check for the `images` field in responses before processing
- **Rate Limits**: Image generation may have different rate limits than text generation
- **Storage**: Consider how you'll handle and store the base64 image data

## Troubleshooting

**No images in response?**

- Verify the model supports image generation `output_modalities` includes `"image"`)
- Ensure you've set the `modalities` parameter correctly: `["image", "text"]` for models that output both, or `["image"]` for image-only models
- Check that your prompt is requesting image generation

**Model not found?**

- Use the [Models page](/models) to find available image generation models
- Filter by output modalities to see compatible models

---

title: PDF Inputs

subtitle: How to send PDFs to OpenRouter models

headline: OpenRouter PDF Inputs | Complete Documentation

canonical-url: '[https://openrouter.ai/docs/guides/overview/multimodal/pdfs](https://openrouter.ai/docs/guides/overview/multimodal/pdfs)'

'og:site_name': OpenRouter Documentation

'og:title': OpenRouter PDF Inputs - Complete Documentation

'og:description': Send PDF documents to any model on OpenRouter.

'og:image':

  type: url

  value: >-

```
[https://openrouter.ai/dynamic-og?title=OpenRouter%20PDF%20Inputs&description=Send%20PDF%20documents%20to%20any%20model%20on%20OpenRouter](https://openrouter.ai/dynamic-og?title=OpenRouter%20PDF%20Inputs&description=Send%20PDF%20documents%20to%20any%20model%20on%20OpenRouter).
```

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary_large_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

---

  API_KEY_REF,

  DEFAULT_PDF_ENGINE,

  MISTRAL_OCR_USER_COST_PER_1K_PAGE_DOLLARS as MISTRAL_OCR_COST,

  PDFParserEngine,

} from '../../../../imports/constants';

OpenRouter supports PDF processing through the `/api/v1/chat/completions` API. PDFs can be sent as **direct URLs** or **base64-encoded data URLs** in the messages array, via the file content type. This feature works on **any** model on OpenRouter.

**URL support**: Send publicly accessible PDFs directly without downloading or encoding

**Base64 support**: Required for local files or private documents that aren't publicly accessible

PDFs also work in the chat room for interactive testing.



  When a model supports file input natively, the PDF is passed directly to the

  model. When the model does not support file input natively, OpenRouter will

  parse the file and pass the parsed results to the requested model.



You can send both PDFs and other file types in the same request.

## Plugin Configuration

To configure PDF processing, use the `plugins` parameter in your request. OpenRouter provides several PDF processing engines with different capabilities and pricing:

```typescript

{

  plugins: [

    {

      id: 'file-parser',

      pdf: {

        engine: 'cloudflare-ai', // or 'mistral-ocr' or 'native'

      },

    },

  ],

}

```

## Pricing

OpenRouter provides several PDF processing engines:

1. `"{PDFParserEngine.MistralOCR}"`: Best for scanned documents or
  PDFs with images (${MISTRAL_OCR_COST.toString()} per 1,000 pages).
2. `"{PDFParserEngine.CloudflareAI}"`: Converts PDFs to markdown
  using Cloudflare Workers AI (Free).
3. `"{PDFParserEngine.Native}"`: Only available for models that
  support file input natively (charged as input tokens).



  The `"pdf-text"` engine is deprecated and automatically redirected to

  `"cloudflare-ai"`. Existing requests using `"pdf-text"` will continue to work.





  OCR costs apply to all requests, including BYOK. OpenRouter uses its own Mistral

  key for OCR (not your BYOK key), so the per-page fee is always billed to your

  OpenRouter account.



If you don't explicitly specify an engine, OpenRouter will default first to the model's native file processing capabilities, and if that's not available, we will use the `"{DEFAULT_PDF_ENGINE}"` engine.

## OCR Image Limits

When the `"{PDFParserEngine.MistralOCR}"` engine extracts images from a PDF, OpenRouter requests at most **8 images per PDF** from Mistral via the OCR API's `image_limit` parameter, and forwards no more than 8 images per request to the downstream model. Surplus images are dropped while all extracted text is preserved in full.

This cap exists because per-prompt image limits vary significantly across providers — some reject requests with more than 8 images outright, and even providers with higher caps often fail with context-length errors when a long PDF emits one image per page. Capping at 8 keeps requests within the limits of every supported provider.

If your downstream model does not accept image input at all, OCR-extracted images are stripped entirely and only the parsed text is forwarded.

## Using PDF URLs

For publicly accessible PDFs, you can send the URL directly without needing to download and encode the file:

<Template data={{

  API_KEY_REF,

  MODEL: 'anthropic/claude-sonnet-4',

  ENGINE: PDFParserEngine.MistralOCR,

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

const result = await [openRouter.chat](http://openRouter.chat).send({

  model: '{{MODEL}}',

  messages: [

    {

      role: 'user',

      content: [

        {

          type: 'text',

          text: 'What are the main points in this document?',

        },

        {

          type: 'file',

          file: {

            filename: 'document.pdf',

            fileData: '[https://bitcoin.org/bitcoin.pdf](https://bitcoin.org/bitcoin.pdf)',

          },

        },

      ],

    },

  ],

  // Optional: Configure PDF processing engine

  plugins: [

    {

      id: 'file-parser',

      pdf: {

        engine: '{{ENGINE}}',

      },

    },

  ],

  stream: false,

});

console.log(result);

```

```python

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

messages = [

    {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": "What are the main points in this document?"

            },

            {

                "type": "file",

                "file": {

                    "filename": "document.pdf",

                    "file_data": "[https://bitcoin.org/bitcoin.pdf](https://bitcoin.org/bitcoin.pdf)"

                }

            },

        ]

    }

]

# Optional: Configure PDF processing engine

plugins = [

    {

        "id": "file-parser",

        "pdf": {

            "engine": "{{ENGINE}}"

        }

    }

]

payload = {

    "model": "{{MODEL}}",

    "messages": messages,

    "plugins": plugins

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

print(response.json())

```

```typescript title="TypeScript (fetch)"

const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    messages: [

      {

        role: 'user',

        content: [

          {

            type: 'text',

            text: 'What are the main points in this document?',

          },

          {

            type: 'file',

            file: {

              filename: 'document.pdf',

              file_data: '[https://bitcoin.org/bitcoin.pdf](https://bitcoin.org/bitcoin.pdf)',

            },

          },

        ],

      },

    ],

    // Optional: Configure PDF processing engine

    plugins: [

      {

        id: 'file-parser',

        pdf: {

          engine: '{{ENGINE}}',

        },

      },

    ],

  }),

});

const data = await response.json();

console.log(data);

```







  PDF URLs work with all processing engines. For Mistral OCR, the URL is passed directly to the service. For other engines, OpenRouter fetches the PDF and processes it internally.



## Using Base64 Encoded PDFs

For local PDF files or when you need to send PDF content directly, you can base64 encode the file:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemma-3-27b-it',

  ENGINE: PDFParserEngine.CloudflareAI,

  DEFAULT_PDF_ENGINE,

}}>



```python

from pathlib import Path

def encode_pdf_to_base64(pdf_path):

    with open(pdf_path, "rb") as pdf_file:

        return base64.b64encode(pdf_[file.read](http://file.read)()).decode('utf-8')

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

# Read and encode the PDF

pdf_path = "path/to/your/document.pdf"

base64_pdf = encode_pdf_to_base64(pdf_path)

data_url = f"data:application/pdf;base64,{base64_pdf}"

messages = [

    {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": "What are the main points in this document?"

            },

            {

                "type": "file",

                "file": {

                    "filename": "document.pdf",

                    "file_data": data_url

                }

            },

        ]

    }

]

# Optional: Configure PDF processing engine

# PDF parsing will still work even if the plugin is not explicitly set

plugins = [

    {

        "id": "file-parser",

        "pdf": {

            "engine": "{{ENGINE}}"  # defaults to "{{DEFAULT_PDF_ENGINE}}". See Pricing above

        }

    }

]

payload = {

    "model": "{{MODEL}}",

    "messages": messages,

    "plugins": plugins

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

print(response.json())

```

```typescript

async function encodePDFToBase64(pdfPath: string): Promise<string> {

  const pdfBuffer = await fs.promises.readFile(pdfPath);

  const base64PDF = pdfBuffer.toString('base64');

  return `data:application/pdf;base64,${base64PDF}`;

}

// Read and encode the PDF

const pdfPath = 'path/to/your/document.pdf';

const base64PDF = await encodePDFToBase64(pdfPath);

const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    messages: [

      {

        role: 'user',

        content: [

          {

            type: 'text',

            text: 'What are the main points in this document?',

          },

          {

            type: 'file',

            file: {

              filename: 'document.pdf',

              file_data: base64PDF,

            },

          },

        ],

      },

    ],

    // Optional: Configure PDF processing engine

    // PDF parsing will still work even if the plugin is not explicitly set

    plugins: [

      {

        id: 'file-parser',

        pdf: {

          engine: '{{ENGINE}}', // defaults to "{{DEFAULT_PDF_ENGINE}}". See Pricing above

        },

      },

    ],

  }),

});

const data = await response.json();

console.log(data);

```





## Skip Parsing Costs

When you send a PDF to the API, the response may include file annotations in the assistant's message. These annotations contain structured information about the PDF document that was parsed. By sending these annotations back in subsequent requests, you can avoid re-parsing the same PDF document multiple times, which saves both processing time and costs.

Here's how to reuse file annotations:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemma-3-27b-it'

}}>



```python

from pathlib import Path

# First, encode and send the PDF

def encode_pdf_to_base64(pdf_path):

    with open(pdf_path, "rb") as pdf_file:

        return base64.b64encode(pdf_[file.read](http://file.read)()).decode('utf-8')

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

# Read and encode the PDF

pdf_path = "path/to/your/document.pdf"

base64_pdf = encode_pdf_to_base64(pdf_path)

data_url = f"data:application/pdf;base64,{base64_pdf}"

# Initial request with the PDF

messages = [

    {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": "What are the main points in this document?"

            },

            {

                "type": "file",

                "file": {

                    "filename": "document.pdf",

                    "file_data": data_url

                }

            },

        ]

    }

]

payload = {

    "model": "{{MODEL}}",

    "messages": messages

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

response_data = response.json()

# Store the annotations from the response

file_annotations = None

if response_data.get("choices") and len(response_data["choices"]) > 0:

    if "annotations" in response_data["choices"][0]["message"]:

        file_annotations = response_data["choices"][0]["message"]["annotations"]

# Follow-up request using the annotations (without sending the PDF again)

if file_annotations:

    follow_up_messages = [

        {

            "role": "user",

            "content": [

                {

                    "type": "text",

                    "text": "What are the main points in this document?"

                },

                {

                    "type": "file",

                    "file": {

                        "filename": "document.pdf",

                        "file_data": data_url

                    }

                }

            ]

        },

        {

            "role": "assistant",

            "content": "The document contains information about...",

            "annotations": file_annotations

        },

        {

            "role": "user",

            "content": "Can you elaborate on the second point?"

        }

    ]

    follow_up_payload = {

        "model": "{{MODEL}}",

        "messages": follow_up_messages

    }

    follow_up_response = [requests.post](http://requests.post)(url, headers=headers, json=follow_up_payload)

    print(follow_up_response.json())

```

```typescript

async function encodePDFToBase64(pdfPath: string): Promise<string> {

  const pdfBuffer = await fs.readFile(pdfPath);

  const base64PDF = pdfBuffer.toString('base64');

  return `data:application/pdf;base64,${base64PDF}`;

}

// Initial request with the PDF

async function processDocument() {

  // Read and encode the PDF

  const pdfPath = 'path/to/your/document.pdf';

  const base64PDF = await encodePDFToBase64(pdfPath);

  const initialResponse = await fetch(

    '[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)',

    {

      method: 'POST',

      headers: {

        Authorization: `Bearer ${API_KEY_REF}`,

        'Content-Type': 'application/json',

      },

      body: JSON.stringify({

        model: '{{MODEL}}',

        messages: [

          {

            role: 'user',

            content: [

              {

                type: 'text',

                text: 'What are the main points in this document?',

              },

              {

                type: 'file',

                file: {

                  filename: 'document.pdf',

                  file_data: base64PDF,

                },

              },

            ],

          },

        ],

      }),

    },

  );

  const initialData = await initialResponse.json();

  // Store the annotations from the response

  let fileAnnotations = null;

  if (initialData.choices && initialData.choices.length > 0) {

    if (initialData.choices[0].message.annotations) {

      fileAnnotations = initialData.choices[0].message.annotations;

    }

  }

  // Follow-up request using the annotations (without sending the PDF again)

  if (fileAnnotations) {

    const followUpResponse = await fetch(

      '[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)',

      {

        method: 'POST',

        headers: {

          Authorization: `Bearer ${API_KEY_REF}`,

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({

          model: '{{MODEL}}',

          messages: [

            {

              role: 'user',

              content: [

                {

                  type: 'text',

                  text: 'What are the main points in this document?',

                },

                {

                  type: 'file',

                  file: {

                    filename: 'document.pdf',

                    file_data: base64PDF,

                  },

                },

              ],

            },

            {

              role: 'assistant',

              content: 'The document contains information about...',

              annotations: fileAnnotations,

            },

            {

              role: 'user',

              content: 'Can you elaborate on the second point?',

            },

          ],

        }),

      },

    );

    const followUpData = await followUpResponse.json();

    console.log(followUpData);

  }

}

processDocument();

```







  When you include the file annotations from a previous response in your

  subsequent requests, OpenRouter will use this pre-parsed information instead

  of re-parsing the PDF, which saves processing time and costs. This is

  especially beneficial for large documents or when using the `mistral-ocr`

  engine which incurs additional costs.



## File Annotations Schema

When OpenRouter parses a PDF, the response includes file annotations in the assistant message. Here is the TypeScript type for the annotation schema:

```typescript

type FileAnnotation = {

  type: 'file';

  file: {

    hash: string;           // Unique hash identifying the parsed file

    name?: string;          // Original filename (optional)

    content: ContentPart[]; // Parsed content from the file

  };

};

type ContentPart =

  | { type: 'text'; text: string }

  | { type: 'image_url'; image_url: { url: string } };

```

The `content` array contains the parsed content from the PDF, which may include text blocks and images (as base64 data URLs). The `hash` field uniquely identifies the parsed file content and is used to skip re-parsing when you include the annotation in subsequent requests.

## Response Format

The API will return a response in the following format:

```json

{

  "id": "gen-1234567890",

  "provider": "DeepInfra",

  "model": "google/gemma-3-27b-it",

  "object": "chat.completion",

  "created": 1234567890,

  "choices": [

    {

      "message": {

        "role": "assistant",

        "content": "The document discusses...",

        "annotations": [

          {

            "type": "file",

            "file": {

              "hash": "abc123...",

              "name": "document.pdf",

              "content": [

                { "type": "text", "text": "Parsed text content..." },

                { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }

              ]

            }

          }

        ]

      }

    }

  ],

  "usage": {

    "prompt_tokens": 1000,

    "completion_tokens": 100,

    "total_tokens": 1100

  }

}

```

## Error Responses with Parsed Annotations

If OpenRouter successfully parses your PDF but every inference provider then fails to generate a completion, the error response still includes the parsed annotations under `error.metadata.file_annotations`. The shape matches the success-path `FileAnnotation` documented above, so you can hand the same array straight back to OpenRouter on a retry to skip re-parsing.

This applies to the `"{PDFParserEngine.MistralOCR}"` and `"{PDFParserEngine.CloudflareAI}"` engines, which parse the PDF before sending it to a model. The `"{PDFParserEngine.Native}"` engine doesn't produce annotations because the file is forwarded directly to the model.

```json

{

  "error": {

    "code": 502,

    "message": "Provider returned an error",

    "metadata": {

      "file_annotations": [

        {

          "type": "file",

          "file": {

            "hash": "abc123...",

            "name": "document.pdf",

            "content": [

              { "type": "text", "text": "Parsed text content..." }

            ]

          }

        }

      ]

    }

  }

}

```

When you read annotations from both the success and error paths, dedupe by `file.hash` — the hash is stable across both shapes for the same parsed file:

```typescript

function isFileAnnotation(value: unknown): value is FileAnnotation {

  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as { type?: unknown; file?: { hash?: unknown } };

  return (

    candidate.type === 'file' &&

    typeof candidate.file?.hash === 'string'

  );

}

function extractFileAnnotations(response: unknown): FileAnnotation[] {

  if (typeof response !== 'object' || response === null) return [];

  const root = response as {

    choices?: Array<{ message?: { annotations?: unknown[] } }>;

    error?: { metadata?: { file_annotations?: unknown[] } };

  };

  const fromMessage = root.choices?.[0]?.message?.annotations ?? [];

  const fromError = root.error?.metadata?.file_annotations ?? [];

  const seen = new Set<string>();

  const out: FileAnnotation[] = [];

  for (const a of [...fromMessage, ...fromError]) {

    if (isFileAnnotation(a) && !seen.has(a.file.hash)) {

      seen.add(a.file.hash);

      out.push(a);

    }

  }

  return out;

}

```

---

title: Audio

subtitle: How to send and receive audio with OpenRouter models

headline: OpenRouter Audio | Complete Documentation

canonical-url: '[https://openrouter.ai/docs/guides/overview/multimodal/audio](https://openrouter.ai/docs/guides/overview/multimodal/audio)'

'og:site_name': OpenRouter Documentation

'og:title': OpenRouter Audio - Complete Documentation

'og:description': >-

  Send audio files to and receive audio responses from speech-capable models

  through the OpenRouter API.

'og:image':

  type: url

  value: >-

```
[https://openrouter.ai/dynamic-og?title=OpenRouter%20Audio&description=Send%20and%20receive%20audio%20with%20speech-capable%20models%20through%20the%20OpenRouter%20API](https://openrouter.ai/dynamic-og?title=OpenRouter%20Audio&description=Send%20and%20receive%20audio%20with%20speech-capable%20models%20through%20the%20OpenRouter%20API).
```

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary_large_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

---

OpenRouter supports both sending audio files to compatible models and receiving audio responses via the API. This guide covers how to work with audio inputs and outputs.

## Audio Inputs

Send audio files to compatible models for transcription, analysis, and processing. Audio input requests use the `/api/v1/chat/completions` API with the `input_audio` content type. Audio files must be base64-encoded and include the format specification.

**Note**: Audio files must be **base64-encoded** - direct URLs are not supported for audio content.

You can search for models that support audio input by filtering to audio input modality on our [Models page](/models?fmt=cards&input_modalities=audio).

### Sending Audio Files

Here's how to send an audio file for processing:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemini-2.5-flash'

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

async function encodeAudioToBase64(audioPath: string): Promise<string> {

  const audioBuffer = await fs.readFile(audioPath);

  return audioBuffer.toString("base64");

}

// Read and encode the audio file

const audioPath = "path/to/your/audio.wav";

const base64Audio = await encodeAudioToBase64(audioPath);

const result = await [openRouter.chat](http://openRouter.chat).send({

  model: "{{MODEL}}",

  messages: [

    {

      role: "user",

      content: [

        {

          type: "text",

          text: "Please transcribe this audio file.",

        },

        {

          type: "input_audio",

          inputAudio: {

            data: base64Audio,

            format: "wav",

          },

        },

      ],

    },

  ],

  stream: false,

});

console.log(result);

```

```python

def encode_audio_to_base64(audio_path):

    with open(audio_path, "rb") as audio_file:

        return base64.b64encode(audio_[file.read](http://file.read)()).decode('utf-8')

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

# Read and encode the audio file

audio_path = "path/to/your/audio.wav"

base64_audio = encode_audio_to_base64(audio_path)

messages = [

    {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": "Please transcribe this audio file."

            },

            {

                "type": "input_audio",

                "input_audio": {

                    "data": base64_audio,

                    "format": "wav"

                }

            }

        ]

    }

]

payload = {

    "model": "{{MODEL}}",

    "messages": messages

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

print(response.json())

```

```typescript title="TypeScript (fetch)"

async function encodeAudioToBase64(audioPath: string): Promise<string> {

  const audioBuffer = await fs.readFile(audioPath);

  return audioBuffer.toString("base64");

}

// Read and encode the audio file

const audioPath = "path/to/your/audio.wav";

const base64Audio = await encodeAudioToBase64(audioPath);

const response = await fetch("[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)", {

  method: "POST",

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    "Content-Type": "application/json",

  },

  body: JSON.stringify({

    model: "{{MODEL}}",

    messages: [

      {

        role: "user",

        content: [

          {

            type: "text",

            text: "Please transcribe this audio file.",

          },

          {

            type: "input_audio",

            input_audio: {

              data: base64Audio,

              format: "wav",

            },

          },

        ],

      },

    ],

  }),

});

const data = await response.json();

console.log(data);

```





### Supported Audio Input Formats

Supported audio formats vary by provider. Common formats include:

- `wav` - WAV audio
- `mp3` - MP3 audio
- `aiff` - AIFF audio
- `aac` - AAC audio
- `ogg` - OGG Vorbis audio
- `flac` - FLAC audio
- `m4a` - M4A audio
- `pcm16` - PCM16 audio
- `pcm24` - PCM24 audio

**Note:** Check your model's documentation to confirm which audio formats it supports. Not all models support all formats.

## Audio Output

OpenRouter supports receiving audio responses from models that have audio output capabilities. To request audio output, include the `modalities` and `audio` parameters in your request.

You can search for models that support audio output by filtering to audio output modality on our [Models page](/models?fmt=cards&output_modalities=audio).

### Requesting Audio Output

To receive audio output, set `modalities` to `["text", "audio"]` and provide the `audio` configuration with your desired voice and format:

<Template data={{

  API_KEY_REF,

  MODEL: 'openai/gpt-4o-audio-preview'

}}>



```python

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

payload = {

    "model": "{{MODEL}}",

    "messages": [

        {

            "role": "user",

            "content": "Say hello in a friendly tone."

        }

    ],

    "modalities": ["text", "audio"],

    "audio": {

        "voice": "alloy",

        "format": "wav"

    },

    "stream": True

}

# Audio output requires streaming — the response is delivered as SSE chunks

response = [requests.post](http://requests.post)(url, headers=headers, json=payload, stream=True)

audio_data_chunks = []

transcript_chunks = []

for line in response.iter_lines():

    if not line:

        continue

    decoded = line.decode("utf-8")

    if not decoded.startswith("data: "):

        continue

    data = decoded[len("data: "):]

    if data.strip() == "[DONE]":

        break

    chunk = json.loads(data)

    delta = chunk["choices"][0].get("delta", {})

    audio = delta.get("audio", {})

    if audio.get("data"):

        audio_data_chunks.append(audio["data"])

    if audio.get("transcript"):

        transcript_chunks.append(audio["transcript"])

transcript = "".join(transcript_chunks)

print(f"Transcript: {transcript}")

# Combine and decode the base64 audio chunks, then save

full_audio_b64 = "".join(audio_data_chunks)

audio_bytes = base64.b64decode(full_audio_b64)

with open("output.wav", "wb") as f:

    f.write(audio_bytes)

```

```typescript title="TypeScript (fetch)"

const response = await fetch("[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)", {

  method: "POST",

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    "Content-Type": "application/json",

  },

  body: JSON.stringify({

    model: "{{MODEL}}",

    messages: [

      {

        role: "user",

        content: "Say hello in a friendly tone.",

      },

    ],

    modalities: ["text", "audio"],

    audio: {

      voice: "alloy",

      format: "wav",

    },

    stream: true,

  }),

});

// Audio output requires streaming — parse the SSE chunks

const reader = response.body!.getReader();

const decoder = new TextDecoder();

const audioDataChunks: string[] = [];

const transcriptChunks: string[] = [];

let buffer = "";

while (true) {

  const { done, value } = await [reader.read](http://reader.read)();

  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  const lines = buffer.split("\n");

  buffer = lines.pop()!; // keep incomplete line in buffer

  for (const line of lines) {

    if (!line.startsWith("data: ")) continue;

    const data = line.slice("data: ".length).trim();

    if (data === "[DONE]") break;

    const chunk = JSON.parse(data);

    const audio = chunk.choices?.[0]?.delta?.audio;

    if (audio?.data) audioDataChunks.push([audio.data](http://audio.data));

    if (audio?.transcript) transcriptChunks.push(audio.transcript);

  }

}

const transcript = transcriptChunks.join("");

console.log`Transcript: ${transcript}`);

// audioDataChunks joined together is the full base64-encoded audio

const fullAudioB64 = audioDataChunks.join("");

```





### Streaming Chunk Format

Audio output requires streaming `stream: true`). Audio data and transcript are delivered incrementally via the `delta.audio` field in each chunk:

```json

{

  "choices": [

    {

      "delta": {

        "audio": {

          "data": "<base64-encoded audio chunk>",

          "transcript": "Hello"

        }

      }

    }

  ]

}

```

### Audio Configuration Options

The `audio` parameter accepts the following options:

| Option | Description |

|---|---|

| `voice` | The voice to use for audio generation (e.g., `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`). Available voices vary by model. |

| `format` | The audio format for the output (e.g., `wav`, `mp3`, `flac`, `opus`, `pcm16`). Available formats vary by model. |

---

title: Video Inputs

subtitle: How to send video files to OpenRouter models

headline: OpenRouter Video Inputs | Complete Documentation

canonical-url: '[https://openrouter.ai/docs/guides/overview/multimodal/videos](https://openrouter.ai/docs/guides/overview/multimodal/videos)'

'og:site_name': OpenRouter Documentation

'og:title': OpenRouter Video Inputs - Complete Documentation

'og:description': Send video files to video-capable models through the OpenRouter API.

'og:image':

  type: url

  value: >-

```
[https://openrouter.ai/dynamic-og?title=OpenRouter%20Video%20Inputs&description=Send%20video%20files%20to%20video-capable%20models%20through%20the%20OpenRouter%20API](https://openrouter.ai/dynamic-og?title=OpenRouter%20Video%20Inputs&description=Send%20video%20files%20to%20video-capable%20models%20through%20the%20OpenRouter%20API).
```

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary_large_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

---

OpenRouter supports sending video files to compatible models via the API. This guide will show you how to work with video using our API.

OpenRouter supports both **direct URLs** and **base64-encoded data URLs** for videos:

- **URLs**: Efficient for publicly accessible videos as they don't require local encoding
- **Base64 Data URLs**: Required for local files or private videos that aren't publicly accessible



**Important:** Video URL support varies by provider. OpenRouter only sends video URLs to providers that explicitly support them. For example, Google Gemini on AI Studio only supports YouTube links (not Vertex AI).





**API Only:** Video inputs are currently only supported via the API. Video uploads are not available in the OpenRouter chatroom interface at this time.



## Video Inputs

Requests with video files to compatible models are available via the `/api/v1/chat/completions` API with the `video_url` content type. The `url` can either be a URL or a base64-encoded data URL. Note that only models with video processing capabilities will handle these requests.

You can search for models that support video by filtering to video input modality on our [Models page](/models?fmt=cards&input_modalities=video).

### Using Video URLs

Here's how to send a video using a URL. Note that for Google Gemini on AI Studio, only YouTube links are supported:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemini-2.5-flash'

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

const result = await [openRouter.chat](http://openRouter.chat).send({

  model: "{{MODEL}}",

  messages: [

    {

      role: "user",

      content: [

        {

          type: "text",

          text: "Please describe what's happening in this video.",

        },

        {

          type: "video_url",

          videoUrl: {

            url: "[https://www.youtube.com/watch?v=dQw4w9WgXcQ](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",

          },

        },

      ],

    },

  ],

  stream: false,

});

console.log(result);

```

```python

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

messages = [

    {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": "Please describe what's happening in this video."

            },

            {

                "type": "video_url",

                "video_url": {

                    "url": "[https://www.youtube.com/watch?v=dQw4w9WgXcQ](https://www.youtube.com/watch?v=dQw4w9WgXcQ)"

                }

            }

        ]

    }

]

payload = {

    "model": "{{MODEL}}",

    "messages": messages

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

print(response.json())

```

```typescript title="TypeScript (fetch)"

const response = await fetch("[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)", {

  method: "POST",

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    "Content-Type": "application/json",

  },

  body: JSON.stringify({

    model: "{{MODEL}}",

    messages: [

      {

        role: "user",

        content: [

          {

            type: "text",

            text: "Please describe what's happening in this video.",

          },

          {

            type: "video_url",

            video_url: {

              url: "[https://www.youtube.com/watch?v=dQw4w9WgXcQ](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",

            },

          },

        ],

      },

    ],

  }),

});

const data = await response.json();

console.log(data);

```





### Using Base64 Encoded Videos

For locally stored videos, you can send them using base64 encoding as data URLs:

<Template data={{

  API_KEY_REF,

  MODEL: 'google/gemini-2.5-flash'

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

async function encodeVideoToBase64(videoPath: string): Promise<string> {

  const videoBuffer = await fs.promises.readFile(videoPath);

  const base64Video = videoBuffer.toString('base64');

  return `data:video/mp4;base64,${base64Video}`;

}

// Read and encode the video

const videoPath = 'path/to/your/video.mp4';

const base64Video = await encodeVideoToBase64(videoPath);

const result = await [openRouter.chat](http://openRouter.chat).send({

  model: '{{MODEL}}',

  messages: [

    {

      role: 'user',

      content: [

        {

          type: 'text',

          text: "What's in this video?",

        },

        {

          type: 'video_url',

          videoUrl: {

            url: base64Video,

          },

        },

      ],

    },

  ],

  stream: false,

});

console.log(result);

```

```python

from pathlib import Path

def encode_video_to_base64(video_path):

    with open(video_path, "rb") as video_file:

        return base64.b64encode(video_[file.read](http://file.read)()).decode('utf-8')

url = "[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

# Read and encode the video

video_path = "path/to/your/video.mp4"

base64_video = encode_video_to_base64(video_path)

data_url = f"data:video/mp4;base64,{base64_video}"

messages = [

    {

        "role": "user",

        "content": [

            {

                "type": "text",

                "text": "What's in this video?"

            },

            {

                "type": "video_url",

                "video_url": {

                    "url": data_url

                }

            }

        ]

    }

]

payload = {

    "model": "{{MODEL}}",

    "messages": messages

}

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

print(response.json())

```

```typescript title="TypeScript (fetch)"

async function encodeVideoToBase64(videoPath: string): Promise<string> {

  const videoBuffer = await fs.promises.readFile(videoPath);

  const base64Video = videoBuffer.toString('base64');

  return `data:video/mp4;base64,${base64Video}`;

}

// Read and encode the video

const videoPath = 'path/to/your/video.mp4';

const base64Video = await encodeVideoToBase64(videoPath);

const response = await fetch('[https://openrouter.ai/api/v1/chat/completions](https://openrouter.ai/api/v1/chat/completions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    messages: [

      {

        role: 'user',

        content: [

          {

            type: 'text',

            text: "What's in this video?",

          },

          {

            type: 'video_url',

            video_url: {

              url: base64Video,

            },

          },

        ],

      },

    ],

  }),

});

const data = await response.json();

console.log(data);

```





## Supported Video Formats

OpenRouter supports the following video formats:

- `video/mp4`
- `video/mpeg`
- `video/mov`
- `video/webm`

## Common Use Cases

Video inputs enable a wide range of applications:

- **Video Summarization**: Generate text summaries of video content
- **Object and Activity Recognition**: Identify objects, people, and actions in videos
- **Scene Understanding**: Describe settings, environments, and contexts
- **Sports Analysis**: Analyze gameplay, movements, and tactics
- **Surveillance**: Monitor and analyze security footage
- **Educational Content**: Analyze instructional videos and provide insights

## Best Practices

### File Size Considerations

Video files can be large, which affects both upload time and processing costs:

- **Compress videos** when possible to reduce file size without significant quality loss
- **Trim videos** to include only relevant segments
- **Consider resolution**: Lower resolutions (e.g., 720p vs 4K) reduce file size while maintaining usability for most analysis tasks
- **Frame rate**: Lower frame rates can reduce file size for videos where high temporal resolution isn't critical

### Optimal Video Length

Different models may have different limits on video duration:

- Check model-specific documentation for maximum video length
- For long videos, consider splitting into shorter segments
- Focus on key moments rather than sending entire long-form content

### Quality vs. Size Trade-offs

Balance video quality with practical considerations:

- **High quality** (1080p+, high bitrate): Best for detailed visual analysis, object detection, text recognition
- **Medium quality** (720p, moderate bitrate): Suitable for most general analysis tasks
- **Lower quality** (480p, lower bitrate): Acceptable for basic scene understanding and action recognition

## Provider-Specific Video URL Support

Video URL support varies significantly by provider:

- **Google Gemini (AI Studio)**: Only supports YouTube links (e.g., `https://www.youtube.com/watch?v=...`)
- **Google Gemini (Vertex AI)**: Does not support video URLs - use base64-encoded data URLs instead
- **Other providers**: Check model-specific documentation for video URL support

## Troubleshooting

**Video not processing?**

- Verify the model supports video input (check `input_modalities` includes `"video"`)
- If using a video URL, confirm the provider supports video URLs (see Provider-Specific Video URL Support above)
- For Gemini on AI Studio, ensure you're using a YouTube link, not a direct video file URL
- If the video URL isn't working, try using a base64-encoded data URL instead
- Check that the video format is supported
- Verify the video file isn't corrupted

**Large file errors?**

- Compress the video to reduce file size
- Reduce video resolution or frame rate
- Trim the video to a shorter duration
- Check model-specific file size limits
- Consider using a video URL (if supported by the provider) instead of base64 encoding for large files

**Poor analysis results?**

- Ensure video quality is sufficient for the task
- Provide clear, specific prompts about what to analyze
- Consider if the video duration is appropriate for the model
- Check if the video content is clearly visible and well-lit

---

title: Video Generation

subtitle: How to generate videos with OpenRouter models

headline: OpenRouter Video Generation | Complete Documentation

canonical-url: '[https://openrouter.ai/docs/guides/overview/multimodal/video-generation](https://openrouter.ai/docs/guides/overview/multimodal/video-generation)'

'og:site_name': OpenRouter Documentation

'og:title': OpenRouter Video Generation - Complete Documentation

'og:description': Generate videos using AI models through the OpenRouter API.

'og:image':

  type: url

  value: >-

```
[https://openrouter.ai/dynamic-og?title=OpenRouter%20Video%20Generation&description=Generate%20videos%20using%20AI%20models%20through%20the%20OpenRouter%20API](https://openrouter.ai/dynamic-og?title=OpenRouter%20Video%20Generation&description=Generate%20videos%20using%20AI%20models%20through%20the%20OpenRouter%20API).
```

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary_large_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

---

  API_KEY_REF,

} from '../../../../imports/constants';

OpenRouter supports video generation from text prompts (and optional reference images) via a dedicated asynchronous API. You can find the supported models, their capabilities, and pricing by filtering our [model list by video output]([https://openrouter.ai/models?output_modalities=video](https://openrouter.ai/models?output_modalities=video)).



  Adding video generation to an app? The

  [Video Generation Cookbook](/docs/cookbook/video-generation/choose-video-model)

  breaks this workflow into step-by-step recipes for choosing a model,

  submitting text-to-video jobs, using images, passing provider options, and

  handling webhooks.

  For reusable agent knowledge across projects, install the

  [openrouter-video skill]([https://github.com/OpenRouterTeam/skills/tree/main/skills/openrouter-video](https://github.com/OpenRouterTeam/skills/tree/main/skills/openrouter-video)).



## Model Discovery

You can find video generation models in several ways:

### Via the Video Models API

Use the dedicated video models endpoint to list all available video generation models along with their supported parameters:

```bash

curl "[https://openrouter.ai/api/v1/videos/models](https://openrouter.ai/api/v1/videos/models)"

```

The response returns a `data` array where each model includes:

```json

{

  "data": [

    {

      "id": "google/veo-3.1",

      "canonical_slug": "google/veo-3.1",

      "name": "Google: Veo 3.1",

      "description": "...",

      "created": 1719792000,

      "supported_resolutions": ["720p", "1080p"],

      "supported_aspect_ratios": ["16:9", "9:16", "1:1"],

      "supported_sizes": ["1280x720", "1920x1080"],

      "pricing_skus": {

        "per-video-second": "0.50",

        "per-video-second-1080p": "0.75"

      },

      "allowed_passthrough_parameters": ["output_config"]

    }

  ]

}

```

| Field | Description |

|---|---|

| `id` | Model slug to use in generation requests |

| `canonical_slug` | Permanent model identifier |

| `supported_resolutions` | List of supported output resolutions (e.g., `720p`, `1080p`) |

| `supported_aspect_ratios` | List of supported aspect ratios (e.g., `16:9`, `9:16`) |

| `supported_sizes` | List of supported pixel dimensions (e.g., `1280x720`) |

| `pricing_skus` | Pricing information per SKU |

| `allowed_passthrough_parameters` | Provider-specific parameters that can be passed through via the `provider` option |

Use this endpoint to check which resolutions, aspect ratios, and passthrough parameters are supported by each model before submitting a generation request.

### Via the Models API

You can also use the `output_modalities` query parameter on the [Models API](/docs/api-reference/models/get-models) to discover video generation models:

```bash

# List only video generation models

curl "[https://openrouter.ai/api/v1/models?output_modalities=video](https://openrouter.ai/api/v1/models?output_modalities=video)"

```

### On the Models Page

Visit the [Models page](/models) and filter by output modalities to find models capable of video generation. Look for models that list `"video"` in their output modalities.

## How It Works

Unlike text or image generation, video generation is **asynchronous** because generating video takes significantly longer. The workflow is:

1. **Submit** a generation request to `POST /api/v1/videos`
2. **Receive** a job ID and polling URL immediately
3. **Poll** the polling URL `GET /api/v1/videos/{jobId}`) until the status is `completed`
4. **Download** the video from the content URL `GET /api/v1/videos/{jobId}/content`)

## API Usage

### Submitting a Video Generation Request

<Template data={{

  API_KEY_REF,

  MODEL: 'google/veo-3.1'

}}>



```python

url = "[https://openrouter.ai/api/v1/videos](https://openrouter.ai/api/v1/videos)"

headers = {

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

}

payload = {

    "model": "{{MODEL}}",

    "prompt": "A golden retriever playing fetch on a sunny beach with waves crashing in the background"

}

# Step 1: Submit the generation request

response = [requests.post](http://requests.post)(url, headers=headers, json=payload)

result = response.json()

job_id = result["id"]

polling_url = result["polling_url"]

print(f"Job submitted: {job_id}")

print(f"Status: {result['status']}")

# Step 2: Poll until completion

while True:

    time.sleep(30)  # Wait 30 seconds between polls

    poll_response = requests.get(polling_url, headers=headers)

    status = poll_response.json()

    print(f"Status: {status['status']}")

    if status["status"] == "completed":

        # Step 3: Download the video

        content_url = status["unsigned_urls"][0]

        video_response = requests.get(content_url)

        with open("output.mp4", "wb") as f:

            f.write(video_response.content)

        print("Video saved to output.mp4")

        break

    elif status["status"] == "failed":

        print(f"Generation failed: {status.get('error', 'Unknown error')}")

        break

```

```typescript title="TypeScript (fetch)"

const headers = {

  Authorization: `Bearer ${API_KEY_REF}`,

  'Content-Type': 'application/json',

};

// Step 1: Submit the generation request

const response = await fetch('[https://openrouter.ai/api/v1/videos](https://openrouter.ai/api/v1/videos)', {

  method: 'POST',

  headers,

  body: JSON.stringify({

    model: '{{MODEL}}',

    prompt: 'A golden retriever playing fetch on a sunny beach with waves crashing in the background',

  }),

});

const result = await response.json();

const jobId = [result.id](http://result.id);

const pollingUrl = result.polling_url;

console.log`Job submitted: ${jobId}`);

console.log`Status: ${result.status}`);

// Step 2: Poll until completion

while (true) {

  await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

  const pollResponse = await fetch(pollingUrl, { headers });

  const status = await pollResponse.json();

  console.log`Status: ${status.status}`);

  if (status.status === 'completed') {

    // Step 3: Download the video

    const contentUrl = status.unsigned_urls[0];

    const videoResponse = await fetch(contentUrl);

    const videoBuffer = await videoResponse.arrayBuffer();

    // Save or process the video buffer

    console.log`Video ready: ${contentUrl}`);

    break;

  } else if (status.status === 'failed') {

    console.error`Generation failed: ${status.error ?? 'Unknown error'}`);

    break;

  }

}

```

```bash title="cURL"

# Step 1: Submit the generation request

curl -X POST "[https://openrouter.ai/api/v1/videos](https://openrouter.ai/api/v1/videos)" \

  -H "Authorization: Bearer $OPENROUTER_API_KEY" \

  -H "Content-Type: application/json" \

  -d '{

    "model": "{{MODEL}}",

    "prompt": "A golden retriever playing fetch on a sunny beach with waves crashing in the background"

  }'

# Response:

# {

#   "id": "<job_id>",

#   "polling_url": "[https://openrouter.ai/api/v1/videos/<job_id>](https://openrouter.ai/api/v1/videos/<job_id>)",

#   "status": "pending"

# }

# Step 2: Poll for status

curl "[https://openrouter.ai/api/v1/videos/<job_id>](https://openrouter.ai/api/v1/videos/<job_id>)" \

  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# Step 3: Once status is "completed", download from unsigned_urls[0]

```





### Request Parameters

| Parameter | Type | Required | Description |

|---|---|---|---|

| `model` | string | Yes | The model to use for video generation (e.g., `google/veo-3.1`) |

| `prompt` | string | Yes | Text description of the video to generate |

| `duration` | integer | No | Duration of the generated video in seconds |

| `resolution` | string | No | Resolution of the output video (e.g., `720p`, `1080p`) |

| `aspect_ratio` | string | No | Aspect ratio of the output video (e.g., `16:9`, `9:16`, `3:2`) |

| `size` | string | No | Exact pixel dimensions in `WIDTHxHEIGHT` format (e.g., `1280x720`). Interchangeable with `resolution` + `aspect_ratio` |

| `frame_images` | array | No | Images for first/last frames (image-to-video) |

| `input_references` | array | No | Reference images for style guidance (reference-to-video) |

| `generate_audio` | boolean | No | Whether to generate audio alongside the video. Defaults to `true` for models that support audio output |

| `seed` | integer | No | Seed for deterministic generation (not guaranteed by all providers) |

| `callback_url` | string | No | URL to receive a webhook notification when the job completes. Overrides the workspace-level default callback URL if set. Must be HTTPS |

| `provider` | object | No | Provider-specific passthrough configuration |

### Supported Resolutions

- `480p`
- `720p`
- `1080p`
- `1K`
- `2K`
- `4K`

### Supported Aspect Ratios

- `16:9` — Widescreen landscape
- `9:16` — Vertical/portrait
- `1:1` — Square
- `4:3` — Standard landscape
- `3:4` — Standard portrait
- `3:2` — Photography landscape
- `2:3` — Photography portrait
- `21:9` — Ultra-wide
- `9:21` — Ultra-tall

### Using Images

There are two ways to provide images, each

triggering a different generation mode:

- *`frame_images`** — Specifies first or last frame
  images for **image-to-video** generation. Each entry
  must include a `frame_type` of `first_frame` or
  `last_frame`.
- *`input_references`** — Provides style or content
  reference images for **reference-to-video**
  generation. The model uses these as visual guidance
  rather than exact frames.

If both fields are provided, `frame_images` takes

precedence and the request is treated as

image-to-video.

#### Image-to-Video (frame_images)

```json

{

  "model": "alibaba/wan-2.7",

  "prompt": "A character walking through a forest",

  "frame_images": [

    {

      "type": "image_url",

      "image_url": {

        "url": "[https://example.com/first-frame.png](https://example.com/first-frame.png)"

      },

      "frame_type": "first_frame"

    }

  ],

  "resolution": "1080p"

}

```

#### Reference-to-Video (input_references)

```json

{

  "model": "alibaba/wan-2.7",

  "prompt": "A colossal solar flare beside a planet",

  "input_references": [

    {

      "type": "image_url",

      "image_url": {

        "url": "[https://example.com/style-ref.png](https://example.com/style-ref.png)"

      }

    }

  ],

  "resolution": "1080p"

}

```

### Provider-Specific Options

You can pass provider-specific options using the `provider` parameter. Options are keyed by provider slug, and only the options for the matched provider are forwarded:

```json

{

  "model": "google/veo-3.1",

  "prompt": "A time-lapse of a flower blooming",

  "provider": {

    "options": {

      "google-vertex": {

        "parameters": {

          "personGeneration": "allow",

          "negativePrompt": "blurry, low quality"

        }

      }

    }

  }

}

```

Use the [Video Models API](#via-the-video-models-api) to check which passthrough parameters each model supports via the `allowed_passthrough_parameters` field.

## Response Format

### Submit Response (202 Accepted)

When you submit a video generation request, you receive an immediate response with the job details:

```json

{

  "id": "abc123",

  "polling_url": "[https://openrouter.ai/api/v1/videos/abc123](https://openrouter.ai/api/v1/videos/abc123)",

  "status": "pending"

}

```

### Poll Response

When polling the job status, the response includes additional fields as the job progresses:

```json

{

  "id": "abc123",

  "generation_id": "gen-1234567890-abcdef",

  "polling_url": "[https://openrouter.ai/api/v1/videos/abc123](https://openrouter.ai/api/v1/videos/abc123)",

  "status": "completed",

  "unsigned_urls": [

    "[https://openrouter.ai/api/v1/videos/abc123/content?index=0](https://openrouter.ai/api/v1/videos/abc123/content?index=0)"

  ],

  "usage": {

    "cost": 0.25,

    "is_byok": false

  }

}

```

### Job Statuses

| Status | Description |

|---|---|

| `pending` | The job has been submitted and is queued |

| `in_progress` | The video is being generated |

| `completed` | The video is ready to download |

| `failed` | The generation failed (check the `error` field) |

### Downloading the Video

Once the job status is `completed`, the `unsigned_urls` array contains URLs to download the generated video content. You can also use the content endpoint directly:

```bash

curl "[https://openrouter.ai/api/v1/videos/{jobId}/content?index=0](https://openrouter.ai/api/v1/videos/{jobId}/content?index=0)" \

  -H "Authorization: Bearer $OPENROUTER_API_KEY" \

  --output video.mp4

```

The `index` query parameter defaults to `0` and can be used if the model generates multiple video outputs.

## Webhooks

Instead of polling for job status, you can receive a webhook notification when a video generation job completes. There are two ways to configure a callback URL:

1. **Per-request**: Pass `callback_url` in the request body. This takes priority over the workspace default.
2. **Workspace default**: Set a default callback URL in your [workspace settings](/workspaces). This applies to all video generation requests that don't specify their own `callback_url`.

### Webhook Payload

When a job reaches a terminal state, a POST request is sent to the callback

URL with an event envelope. Each delivery also carries an

`X-OpenRouter-Idempotency-Key` header of the form `<job_id>-<status>` for

safe retry deduplication.

`video.generation.completed`:

```json

{

  "type": "video.generation.completed",

  "created_at": "2026-04-24T12:00:00.000Z",

  "data": {

    "id": "abc123",

    "status": "completed",

    "generation_id": "gen-xyz789",

    "model": "google/veo-3.1",

    "unsigned_urls": [

      "[https://openrouter.ai/api/v1/videos/abc123/content?index=0](https://openrouter.ai/api/v1/videos/abc123/content?index=0)"

    ],

    "usage": {

      "cost": 0.5,

      "is_byok": false

    }

  }

}

```

`video.generation.failed`:

```json

{

  "type": "video.generation.failed",

  "created_at": "2026-04-24T12:00:00.000Z",

  "data": {

    "id": "abc123",

    "status": "failed",

    "generation_id": "gen-xyz789",

    "model": "google/veo-3.1",

    "error": "Content policy violation"

  }

}

```

`video.generation.cancelled`:

```json

{

  "type": "video.generation.cancelled",

  "created_at": "2026-04-24T12:00:00.000Z",

  "data": {

    "id": "abc123",

    "status": "cancelled",

    "generation_id": "gen-xyz789",

    "model": "google/veo-3.1",

    "error": "Job was cancelled"

  }

}

```

`video.generation.expired`:

```json

{

  "type": "video.generation.expired",

  "created_at": "2026-04-24T12:00:00.000Z",

  "data": {

    "id": "abc123",

    "status": "expired",

    "generation_id": "gen-xyz789",

    "model": "google/veo-3.1",

    "error": "Job exceeded maximum time to live"

  }

}

```

`generation_id` and `model` in `data` may be `null` when a job fails before

those values are assigned (e.g. an early validation failure).

### Signing Secret

You can configure a signing secret in your [workspace settings](/workspaces) to verify that webhook payloads are authentically from OpenRouter. When a signing secret is configured, each webhook delivery includes an `X-OpenRouter-Signature` header.

The signature includes a timestamp and an HMAC hash:

```

X-OpenRouter-Signature: t=1234567890,v1=a1b2c3d4...

```

### Verifying Signatures

To verify the signature on your webhook receiver:

1. Extract the timestamp `t`) and signature hash `v1`) from the header
2. Construct the signed payload: `{timestamp},{raw_request_body}` (joined with a comma)
3. Compute the HMAC-SHA256 of the signed payload using your signing secret as the key
4. Compare the hex-encoded result with the `v1` value

```typescript

const FIVE_MINUTES_IN_SECONDS = 300;

function verifyWebhookSignature(

  rawBody: string,

  signatureHeader: string,

  secret: string,

): boolean {

  const parts = signatureHeader.split(',');

  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);

  const hash = parts.find((p) => p.startsWith('v1='))?.slice(3);

  if (!timestamp || !hash) {

    return false;

  }

  // Reject timestamps older than 5 minutes to prevent replay attacks

  const age = Math.floor([Date.now](http://Date.now)() / 1000) - Number(timestamp);

  if (Number.isNaN(age) || age > FIVE_MINUTES_IN_SECONDS) {

    return false;

  }

  const signedPayload = `${timestamp},${rawBody}`;

  const expected = crypto

    .createHmac('sha256', secret)

    .update(signedPayload)

    .digest('hex');

  if (expected.length !== hash.length) {

    return false;

  }

  return crypto.timingSafeEqual(

    Buffer.from(expected),

    Buffer.from(hash),

  );

}

```



Use the **raw request body** (the exact bytes received) for verification. Parsing and re-serializing JSON may change key ordering or number formatting, which will cause verification to fail.



## Best Practices

- **Detailed Prompts**: Provide specific, descriptive prompts for better video quality. Include details about motion, camera angles, lighting, and scene composition
- **Appropriate Resolution**: Higher resolutions take longer to generate and cost more. Choose the resolution that fits your use case
- **Polling Interval**: Use a reasonable polling interval (e.g., 30 seconds) to avoid excessive API calls. Video generation typically takes 30 seconds to several minutes depending on the model and parameters
- **Error Handling**: Always check the job status for `failed` state and handle the `error` field appropriately
- **Reference Images**: When using reference images, ensure they are high quality and relevant to the desired video output

## Zero Data Retention

Video generation is **not eligible** for [Zero Data Retention (ZDR)](/docs/guides/features/zdr). Because video generation is asynchronous, the generated video output must be retained by the provider for a short period of time so that it can be retrieved after generation is complete. This temporary retention is inherent to the async polling workflow and cannot be bypassed.

If you have ZDR enforcement enabled (either via [account settings](/settings/privacy) or the per-request `zdr` parameter), video generation requests will not be routed.

## Troubleshooting

**Job stays in `pending` for a long time?**

- Video generation can take several minutes depending on the model, resolution, and server load
- Continue polling at regular intervals

**Generation failed?**

- Check the `error` field in the poll response for details
- Verify the model supports video generation `output_modalities` includes `"video"`)
- Ensure your prompt is appropriate and within model guidelines
- Check that any reference images are accessible and in supported formats

**Model not found?**

- Use the [Video Models API](#via-the-video-models-api) or the [Models page](/models) to find available video generation models
- Verify the model slug is correct (e.g., `google/veo-3.1`)

---

title: Text-to-Speech

subtitle: How to generate speech audio from text with OpenRouter models

headline: OpenRouter Text-to-Speech (TTS) | Complete Documentation

canonical-url: '[https://openrouter.ai/docs/guides/overview/multimodal/tts](https://openrouter.ai/docs/guides/overview/multimodal/tts)'

'og:site_name': OpenRouter Documentation

'og:title': OpenRouter Text-to-Speech - Complete Documentation

'og:description': Generate speech audio from text using AI models through the OpenRouter API.

'og:image':

  type: url

  value: >-

```
[https://openrouter.ai/dynamic-og?title=OpenRouter%20Text-to-Speech&description=Generate%20speech%20audio%20from%20text%20using%20AI%20models%20through%20the%20OpenRouter%20API](https://openrouter.ai/dynamic-og?title=OpenRouter%20Text-to-Speech&description=Generate%20speech%20audio%20from%20text%20using%20AI%20models%20through%20the%20OpenRouter%20API).
```

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary_large_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

---

  API_KEY_REF,

} from '../../../../imports/constants';

OpenRouter supports text-to-speech (TTS) via a dedicated `/api/v1/audio/speech` endpoint that is compatible with the [OpenAI Audio Speech API]([https://platform.openai.com/docs/api-reference/audio/createSpeech](https://platform.openai.com/docs/api-reference/audio/createSpeech)). Send text and receive a raw audio byte stream in your chosen format.

## Model Discovery

You can find TTS models in several ways:

### Via the API

Use the `output_modalities` query parameter on the [Models API](/docs/api-reference/models/get-models) to discover TTS models:

```bash

# List only TTS models

curl "[https://openrouter.ai/api/v1/models?output_modalities=speech](https://openrouter.ai/api/v1/models?output_modalities=speech)"

```

### On the Models Page

Visit the [Models page](/models) and filter by output modalities to find models capable of speech synthesis. Look for models that list `"speech"` in their output modalities.

## API Usage

Send a `POST` request to `/api/v1/audio/speech` with the text you want to synthesize. The response is a raw audio byte stream — not JSON — so you can pipe it directly to a file or audio player.

### Basic Example

<Template data={{

  API_KEY_REF,

  MODEL: 'openai/gpt-4o-mini-tts-2025-12-15'

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

const stream = await openRouter.tts.createSpeech({

  model: '{{MODEL}}',

  input: 'Hello! This is a text-to-speech test.',

  voice: 'alloy',

  responseFormat: 'mp3',

});

// Collect the audio stream and save to a file

const reader = stream.getReader();

const chunks: Uint8Array[] = [];

while (true) {

  const { done, value } = await [reader.read](http://reader.read)();

  if (done) break;

  chunks.push(value);

}

const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);

const buffer = new Uint8Array(totalLength);

let offset = 0;

for (const chunk of chunks) {

  buffer.set(chunk, offset);

  offset += chunk.length;

}

await fs.promises.writeFile('output.mp3', buffer);

console.log('Audio saved to output.mp3');

```

```python title="OpenAI Python"

from openai import OpenAI

client = OpenAI(

  base_url="[https://openrouter.ai/api/v1](https://openrouter.ai/api/v1)",

  api_key="{{API_KEY_REF}}",

)

with [client.audio](http://client.audio).speech.with_streaming_response.create(

  model="{{MODEL}}",

  input="Hello! This is a text-to-speech test.",

  voice="alloy",

  response_format="mp3"

) as response:

  [response.stream](http://response.stream)_to_file("output.mp3")

```

```python

response = [requests.post](http://requests.post)(

  url="[https://openrouter.ai/api/v1/audio/speech](https://openrouter.ai/api/v1/audio/speech)",

  headers={

    "Authorization": f"Bearer {API_KEY_REF}",

    "Content-Type": "application/json"

  },

  json={

    "model": "{{MODEL}}",

    "input": "Hello! This is a text-to-speech test.",

    "voice": "alloy",

    "response_format": "mp3"

  }

)

response.raise_for_status()

with open("output.mp3", "wb") as f:

  f.write(response.content)

generation_id = response.headers.get("X-Generation-Id")

print(f"Audio saved. Generation ID: {generation_id}")

```

```typescript title="TypeScript (fetch)"

const response = await fetch('[https://openrouter.ai/api/v1/audio/speech](https://openrouter.ai/api/v1/audio/speech)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer ${API_KEY_REF}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    input: 'Hello! This is a text-to-speech test.',

    voice: 'alloy',

    response_format: 'mp3',

  }),

});

if (!response.ok) {

  const err = await response.json();

  throw new Error`TTS error ${response.status}: ${JSON.stringify(err)}`);

}

const audioBuffer = await response.arrayBuffer();

const generationId = response.headers.get('X-Generation-Id');

console.log`Generation ID: ${generationId}`);

// Save audioBuffer to a file or play it directly

```

```bash title="cURL"

curl [https://openrouter.ai/api/v1/audio/speech](https://openrouter.ai/api/v1/audio/speech) \

  -H "Content-Type: application/json" \

  -H "Authorization: Bearer $OPENROUTER_API_KEY" \

  --output output.mp3 \

  -d '{

    "model": "{{MODEL}}",

    "input": "Hello! This is a text-to-speech test.",

    "voice": "alloy",

    "response_format": "mp3"

  }'

```





### Request Parameters

| Parameter | Type | Required | Description |

|---|---|---|---|

| `model` | string | Yes | The TTS model to use (e.g., `openai/gpt-4o-mini-tts-2025-12-15`, `mistralai/voxtral-mini-tts-2603`) |

| `input` | string | Yes | The text to synthesize into speech |

| `voice` | string | Yes | Voice identifier. Available voices vary by model — check each model's page on the [Models page](/models) for supported voices |

| `response_format` | string | No | Audio output format: `mp3` or `pcm`. Defaults to `pcm` |

| `speed` | number | No | Playback speed multiplier. Only used by models that support it (e.g., OpenAI TTS). Ignored by other providers. Defaults to `1.0` |

| `provider` | object | No | Provider-specific passthrough configuration |

### Provider-Specific Options

You can pass provider-specific options using the `provider` parameter. Options are keyed by provider slug, and only the options for the matched provider are forwarded:

```json

{

  "model": "openai/gpt-4o-mini-tts-2025-12-15",

  "input": "Hello world",

  "voice": "alloy",

  "provider": {

    "options": {

      "openai": {

        "instructions": "Speak in a warm, friendly tone."

      }

    }

  }

}

```

## Response Format

The TTS endpoint returns a **raw audio byte stream**, not JSON. The response includes the following headers:

| Header | Description |

|---|---|

| `Content-Type` | The MIME type of the audio. `audio/mpeg` for `mp3` format, `audio/pcm` for `pcm` format |

| `X-Generation-Id` | The unique generation ID for the request, useful for tracking and debugging |

### Output Formats

| Format | Content-Type | Description |

|---|---|---|

| `mp3` | `audio/mpeg` | Compressed audio, smaller file size. Good for storage and playback |

| `pcm` | `audio/pcm` | Uncompressed raw audio. Lower latency, suitable for real-time streaming pipelines |

## Pricing

TTS models are priced **per character** of input text. Pricing varies by model and provider. You can check the per-character cost for each model on the [Models page](/models) or via the [Models API](/docs/api-reference/models/get-models).

## OpenAI SDK Compatibility

The TTS endpoint is fully compatible with the OpenAI SDK. You can use the OpenAI client libraries by pointing them at OpenRouter's base URL:

<Template data={{

  API_KEY_REF,

}}>



```python title="OpenAI Python SDK"

from openai import OpenAI

client = OpenAI(

  base_url="[https://openrouter.ai/api/v1](https://openrouter.ai/api/v1)",

  api_key="{{API_KEY_REF}}",

)

# Non-streaming: get the full audio response

response = [client.audio](http://client.audio).speech.create(

  model="openai/gpt-4o-mini-tts-2025-12-15",

  input="The quick brown fox jumps over the lazy dog.",

  voice="nova",

  response_format="mp3"

)

response.write_to_file("output.mp3")

# Streaming: process audio chunks as they arrive

with [client.audio](http://client.audio).speech.with_streaming_response.create(

  model="openai/gpt-4o-mini-tts-2025-12-15",

  input="The quick brown fox jumps over the lazy dog.",

  voice="nova",

  response_format="mp3"

) as response:

  [response.stream](http://response.stream)_to_file("output.mp3")

```

```typescript title="OpenAI TypeScript SDK"

const client = new OpenAI({

  baseURL: '[https://openrouter.ai/api/v1](https://openrouter.ai/api/v1)',

  apiKey: '{{API_KEY_REF}}',

});

const response = await [client.audio](http://client.audio).speech.create({

  model: 'openai/gpt-4o-mini-tts-2025-12-15',

  input: 'The quick brown fox jumps over the lazy dog.',

  voice: 'nova',

  response_format: 'mp3',

});

const buffer = Buffer.from(await response.arrayBuffer());

await fs.promises.writeFile('output.mp3', buffer);

console.log('Audio saved to output.mp3');

```





## Best Practices

- **Choose the right format**: Use `mp3` for storage and general playback. Use `pcm` for real-time streaming pipelines where latency matters
- **Voice selection**: Different providers offer different voices. Check the model's documentation or experiment with available voices to find the best fit for your use case
- **Input length**: For very long texts, consider splitting the input into smaller segments and concatenating the audio output. This can improve reliability and reduce latency for the first audio chunk
- **Speed parameter**: The `speed` parameter is only supported by certain providers (e.g., OpenAI). It is silently ignored by providers that don't support it

## Troubleshooting

**Empty or corrupted audio file?**

- Verify the `response_format` matches how you're saving the file (e.g., don't save `pcm` output with a `.mp3` extension)
- Check the response status code — non-200 responses return JSON error bodies, not audio

**Model not found?**

- Use the [Models page](/models) to find available TTS models
- Verify the model slug is correct (e.g., `openai/gpt-4o-mini-tts-2025-12-15`, not `gpt-4o-mini-tts`)

**Voice not available?**

- Available voices vary by provider. Check the provider's documentation for supported voice identifiers
- Each model has its own set of voices — check the model's page on the [Models page](/models) for the full list

---

title: Speech-to-Text

subtitle: How to transcribe audio into text with OpenRouter models

headline: OpenRouter Speech-to-Text (STT) | Complete Documentation

canonical-url: '[https://openrouter.ai/docs/guides/overview/multimodal/stt](https://openrouter.ai/docs/guides/overview/multimodal/stt)'

'og:site_name': OpenRouter Documentation

'og:title': OpenRouter Speech-to-Text - Complete Documentation

'og:description': >-

  Transcribe audio into text using AI models through the OpenRouter API. Access

  multiple STT providers with a single unified interface.

'og:image':

  type: url

  value: >-

```
[https://openrouter.ai/dynamic-og?title=OpenRouter%20Speech-to-Text&description=Transcribe%20audio%20into%20text%20using%20AI%20models%20through%20the%20OpenRouter%20API](https://openrouter.ai/dynamic-og?title=OpenRouter%20Speech-to-Text&description=Transcribe%20audio%20into%20text%20using%20AI%20models%20through%20the%20OpenRouter%20API).
```

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary_large_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

---

  API_KEY_REF,

} from '../../../../imports/constants';

OpenRouter supports speech-to-text (STT) via a dedicated `/api/v1/audio/transcriptions` endpoint. Send base64-encoded audio and receive a JSON response with the transcribed text and usage statistics.

## Model Discovery

You can find STT models in several ways:

### Via the API

Use the `output_modalities` query parameter on the [Models API](/docs/api-reference/models/get-models) to discover STT models:

```bash

# List only STT models

curl "[https://openrouter.ai/api/v1/models?output_modalities=transcription](https://openrouter.ai/api/v1/models?output_modalities=transcription)"

```

### On the Models Page

Visit the [Models page](/models) and filter by output modalities to find models capable of audio transcription. You can also browse the [Speech-to-Text collection](/collections/speech-to-text-models) for a curated list.

## API Usage

Send a `POST` request to `/api/v1/audio/transcriptions` with a JSON body containing base64-encoded audio. The response is JSON with the transcribed text and optional usage statistics.

### Basic Example

<Template data={{

  API_KEY_REF,

  MODEL: 'openai/whisper-1'

}}>



```typescript title="TypeScript SDK"

const openRouter = new OpenRouter({

  apiKey: '{{API_KEY_REF}}',

});

const audioBuffer = await fs.promises.readFile('audio.wav');

const base64Audio = audioBuffer.toString('base64');

const result = await openRouter.stt.createTranscription({

  model: '{{MODEL}}',

  inputAudio: {

    data: base64Audio,

    format: 'wav',

  },

});

console.log(result.text);

```

```python title="Python"

with open("audio.wav", "rb") as f:

    base64_audio = base64.b64encode([f.read](http://f.read)()).decode("utf-8")

response = [requests.post](http://requests.post)(

    url="[https://openrouter.ai/api/v1/audio/transcriptions](https://openrouter.ai/api/v1/audio/transcriptions)",

    headers={

        "Authorization": "Bearer {{API_KEY_REF}}",

        "Content-Type": "application/json"

    },

    data=json.dumps({

        "model": "{{MODEL}}",

        "input_audio": {

            "data": base64_audio,

            "format": "wav"

        }

    })

)

result = response.json()

print(result["text"])

```

```typescript title="TypeScript (fetch)"

const audioBuffer = await fs.promises.readFile('audio.wav');

const base64Audio = audioBuffer.toString('base64');

const response = await fetch('[https://openrouter.ai/api/v1/audio/transcriptions](https://openrouter.ai/api/v1/audio/transcriptions)', {

  method: 'POST',

  headers: {

    Authorization: `Bearer {{API_KEY_REF}}`,

    'Content-Type': 'application/json',

  },

  body: JSON.stringify({

    model: '{{MODEL}}',

    input_audio: {

      data: base64Audio,

      format: 'wav',

    },

  }),

});

const result = await response.json();

console.log(result.text);

```

```bash title="cURL"

# Base64-encode your audio file

AUDIO_BASE64=$(base64 < audio.wav | tr -d '\n')

curl [https://openrouter.ai/api/v1/audio/transcriptions](https://openrouter.ai/api/v1/audio/transcriptions) \

  -H "Content-Type: application/json" \

  -H "Authorization: Bearer $OPENROUTER_API_KEY" \

  -d '{

    "model": "{{MODEL}}",

    "input_audio": {

      "data": "'"$AUDIO_BASE64"'",

      "format": "wav"

    }

  }'

```





### Request Parameters

| Parameter | Type | Required | Description |

|---|---|---|---|

| `model` | string | Yes | The STT model to use (e.g., `openai/whisper-1`) |

| `input_audio` | object | Yes | Audio data to transcribe |

| `input_audio.data` | string | Yes | Base64-encoded audio data (raw bytes, not a data URI) |

| `input_audio.format` | string | Yes | Audio format (e.g., `wav`, `mp3`, `flac`, `m4a`, `ogg`, `webm`, `aac`) |

| `language` | string | No | ISO-639-1 language code (e.g., `"en"`, `"ja"`). Auto-detected if omitted |

| `temperature` | number | No | Sampling temperature between 0 and 1. Lower values produce more deterministic results |

| `provider` | object | No | Provider-specific passthrough configuration |

### Provider-Specific Options

You can pass provider-specific options using the `provider` parameter. Options are keyed by provider slug, and only the options for the matched provider are forwarded:

```json

{

  "model": "openai/whisper-large-v3",

  "input_audio": {

    "data": "UklGRiQA...",

    "format": "wav"

  },

  "provider": {

    "options": {

      "groq": {

        "prompt": "Expected vocabulary: OpenRouter, API, transcription"

      }

    }

  }

}

```

## Response Format

The STT endpoint returns a JSON response with the transcribed text:

```json

{

  "text": "Hello, this is a test of speech-to-text transcription.",

  "usage": {

    "seconds": 9.2,

    "total_tokens": 113,

    "input_tokens": 83,

    "output_tokens": 30,

    "cost": 0.000508

  }

}

```

### Response Fields

| Field | Type | Description |

|---|---|---|

| `text` | string | The transcribed text |

| `usage.seconds` | number | Duration of the input audio in seconds |

| `usage.total_tokens` | number | Total number of tokens used (input + output) |

| `usage.input_tokens` | number | Number of input tokens billed |

| `usage.output_tokens` | number | Number of output tokens generated |

| `usage.cost` | number | Total cost of the request in USD |

### Response Headers

| Header | Description |

|---|---|

| `X-Generation-Id` | Unique generation ID for the request, useful for tracking and debugging |

## Supported Audio Formats

Supported audio formats vary by provider. Common formats include:

| Format | MIME Type | Description |

|---|---|---|

| `wav` | `audio/wav` | Uncompressed audio, highest quality |

| `mp3` | `audio/mpeg` | Compressed audio, widely compatible |

| `flac` | `audio/flac` | Lossless compressed audio |

| `m4a` | `audio/mp4` | MPEG-4 audio |

| `ogg` | `audio/ogg` | Ogg Vorbis audio |

| `webm` | `audio/webm` | WebM audio, common in browser recordings |

| `aac` | `audio/aac` | Advanced Audio Coding |

## Pricing

STT models use different pricing strategies depending on the provider:

- **Duration-based** (e.g., OpenAI Whisper): Priced per second of audio input
- **Token-based** (e.g., newer OpenAI models): Priced per input/output token, similar to text models

You can check the cost for each model on the [Models page](/models) or via the [Models API](/docs/api-reference/models/get-models). The `usage.cost` field in the response shows the actual cost for each request.

## BYOK (Bring Your Own Key)

STT supports [BYOK](/docs/guides/overview/auth/byok), allowing you to use your own provider API keys. When configured, requests are routed directly to the provider using your key, and OpenRouter charges only its platform fee rather than the per-usage model cost.

## Playground

You can test STT models directly in the browser using the [OpenRouter Playground](/playground). Navigate to any STT model's page and use the playground tab to upload an audio file and see the transcription result.

## Differences from Audio Input

OpenRouter supports two ways to process audio:

1. **Speech-to-Text** (this page): A dedicated `/api/v1/audio/transcriptions` endpoint optimized for transcription. Returns structured JSON with the transcribed text and usage data. Best for converting audio to text.
2. **Audio input via Chat Completions** ([Audio docs](/docs/features/multimodal/audio)): Send audio as part of a `/api/v1/chat/completions` request using the `input_audio` content type. The model processes the audio alongside text and responds conversationally. Best for audio analysis, question answering about audio content, or combining audio with other modalities.

## Best Practices

- **Choose the right format**: WAV provides the best quality for transcription. MP3 and other compressed formats work well but may slightly reduce accuracy for borderline audio
- **File size**: For very long audio files, consider splitting them into smaller segments. The upstream provider timeout is 60 seconds, so very large files may time out
- **Base64 encoding**: Audio must be sent as base64-encoded data (raw bytes, not a data URI). Most programming languages have built-in base64 encoding utilities

## Troubleshooting

**Empty or incorrect transcription?**

- Verify the audio format matches the `format` field in your request
- Ensure the audio quality is sufficient for transcription

**Request timing out?**

- Large audio files may exceed the 60-second timeout. Split long recordings into smaller segments
- Compressed formats (MP3, AAC) produce smaller payloads and transfer faster

**Model not found?**

- Use the [Models page](/models) or the [Models API](/docs/api-reference/models/get-models) with `output_modalities=transcription` to find available STT models
- Verify the model slug is correct (e.g., `openai/whisper-1`, not `whisper-1`)

**Authentication error?**

- Ensure you're using a valid API key from [your OpenRouter dashboard](/settings/keys)
- The STT endpoint uses the same authentication as the Chat Completions API

