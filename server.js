const express = require('express');
const OpenAI = require('openai').default;
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

app.use(express.json());
app.use(express.static('public')); // serves index.html etc if present

// ✅ Root route so Railway returns something at /
app.get('/', (req, res) => {
  res.send('✅ Your Railway app is running!');
});

let history = [
  {
    role: 'system',
    content: `You are a text-based fantasy adventure game engine.
Respond only with immersive story narration and descriptive text.
Do NOT give multiple choice options or code.
Wait for the player's input to continue the story.`,
  },
];

function cleanResponse(text) {
  return text.replace(/```[\s\S]*?```/g, '').trim();
}

app.post('/api/chat', async (req, res) => {
  const userInput = req.body.message;

  const freshHistory = [
    {
      role: 'system',
      content: `You are a text-based fantasy adventure game engine.
Respond only with immersive story narration and vivid.
Do NOT progress the story without the user's input.
Do NOT reply with answers that are too long.
Do NOT give the user multiple choice options or suggest numbered options.
Do NOT give any form of suggestions.
Do NOT output code or instructions.
Simply continue the story based on the user's input.
Always wait for the player's next input to continue the story.`,
    },
    { role: 'user', content: 'Remember: do not give me any choices or multiple options. Only narrate the story.' },
    { role: 'user', content: userInput },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek/deepseek-prover-v2:free',
      messages: freshHistory,
    });

    const rawResponse = completion.choices[0].message.content;
    const response = cleanResponse(rawResponse);
    res.json({ reply: response });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ error: 'Error talking to AI' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
