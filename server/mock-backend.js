import express from 'express';
import bodyParser from 'body-parser';
import { readState, updateState } from './lib/fileStore.js';
import { evaluateExplanation } from './services/explainService.js';
import { z } from 'zod';
const app = express();
app.use(bodyParser.json());

const ticketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  domain: z.string().min(2),
});

const ticketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']),
});

const mockUser = {
  id: '69eb1778d6b6ee972cb59b2e',
  name: 'Nans',
  email: 'nan@gmail.com',
  role: 'user',
  language: 'en',
};

const mockAdmin = {
  id: 'admin-1',
  name: 'System Admin',
  email: 'admin@lumina.local',
  role: 'admin',
  language: 'en',
};

function getMockUserFromRequest(req) {
  const header = req.headers.authorization || '';
  if (header.includes('admin')) {
    return mockAdmin;
  }
  return mockUser;
}

app.get('/api/auth/me', (req, res) => {
  return res.json({ user: { id: '69eb1778d6b6ee972cb59b2e', name: 'Nans', email: 'nan@gmail.com', role: 'user', language: 'en' } });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body || {};
  return res.json({ token: 'mock-token', user: { id: '69eb1778d6b6ee972cb59b2e', name: 'Nans', email: email || 'nan@gmail.com', role: 'user' } });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email } = req.body || {};
  return res.status(201).json({ token: 'mock-token', user: { id: '69eb1778d6b6ee972cb59b2e', name: name || 'Nans', email: email || 'nan@gmail.com', role: 'user' } });
});

app.post('/api/chat', (req, res) => {
  const { message, domain, language } = req.body || {};
  const safeMessage = String(message || '').trim();

  const lower = safeMessage.toLowerCase();
  if (lower.includes('vitamin d')) {
    const answer = `What vitamin D is

Vitamin D is a fat-soluble vitamin that helps the body absorb calcium and phosphorus, supporting healthy bones, muscles, and immune function.

Common questions and practical answers

- How do people get vitamin D? From sun exposure (skin makes vitamin D when exposed to UVB), from foods (fatty fish like salmon, fortified milks and cereals, egg yolks), and from supplements.

- How much do I need? Recommendations vary by age and country. A common guideline for many adults is ~600–800 IU/day; individual needs vary with age, pregnancy, health, sun exposure, and skin tone. Ask a clinician for a personalized target.

- How do I know if I'm deficient? Symptoms can be subtle (fatigue, muscle weakness, bone pain). A blood test measuring 25-hydroxyvitamin D (25(OH)D) is the standard screening test. Common lab cutoffs many clinicians use: <20 ng/mL (deficiency), 20–30 ng/mL (insufficiency), ≥30 ng/mL (sufficient), though thresholds differ by guideline.

- Should I take supplements? Supplements help people with low sun exposure, darker skin, older adults, those with malabsorption, or other risk factors. Typical safe daily doses for maintenance often fall in the 400–2000 IU range; higher therapeutic doses are sometimes used short-term under medical supervision.

- Are there risks? Yes—excessive vitamin D over long periods can cause toxicity (hypercalcemia) with nausea, weakness, confusion, and kidney damage. Don't take very high doses long-term without medical advice.

Safe, practical advice

- If you suspect deficiency or are high-risk, get a 25(OH)D blood test and discuss results with your clinician.
- Prefer consistent daily dosing rather than very large intermittent 'bolus' doses unless directed by a provider.
- If you take other medications or have chronic illness (e.g., kidney disease, sarcoidosis), consult your clinician before starting supplements.

Trusted sources

- NIH Office of Dietary Supplements: https://ods.od.nih.gov/
- World Health Organization: https://www.who.int/

Disclaimer: This is general information, not medical advice. For personalized testing, dosing, or treatment, consult a licensed healthcare professional.`;

    return res.json({
      answer,
      domain: 'Healthcare',
      classification: { confidence: 0.95 },
      sources: [
        { title: 'NIH Office of Dietary Supplements', url: 'https://ods.od.nih.gov/' },
        { title: 'World Health Organization', url: 'https://www.who.int/' },
      ],
    });
  }

  const answer = `I received your question: "${safeMessage}". Based on the domain and retrieval, here is a grounded answer.`;

  return res.json({
    answer,
    domain: domain || 'Auto',
    classification: { confidence: 0.85 },
    sources: [],
  });
});

app.post('/api/evaluate', (req, res) => {
  const { question, referenceAnswer, explanation, domain } = req.body || {};

  if (!question || !referenceAnswer || !explanation) {
    return res.status(400).json({ message: 'question, referenceAnswer, and explanation are required' });
  }

  return res.json(
    evaluateExplanation({
      question: String(question),
      referenceAnswer: String(referenceAnswer),
      explanation: String(explanation),
      domain: String(domain || 'Education'),
    }),
  );
});

app.get('/api/tickets', async (req, res) => {
  const user = getMockUserFromRequest(req);
  const state = await readState();
  const tickets = user.role === 'admin'
    ? state.tickets
    : state.tickets.filter((ticket) => ticket.userId === user.id);

  return res.json({ tickets });
});

app.post('/api/tickets', async (req, res, next) => {
  try {
    const user = getMockUserFromRequest(req);
    const payload = ticketSchema.parse(req.body);

    const state = await updateState(async (current) => {
      const highest = current.tickets.reduce((max, ticket) => {
        const match = String(ticket.id).match(/TKT-(\d+)/);
        const value = match ? Number(match[1]) : 0;
        return Math.max(max, value);
      }, 1000);

      const ticket = {
        id: `TKT-${String(highest + 1).padStart(4, '0')}`,
        userId: user.id,
        title: String(payload.title),
        description: String(payload.description),
        domain: String(payload.domain),
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...current,
        tickets: [ticket, ...current.tickets],
      };
    });

    return res.status(201).json({ ticket: state.tickets[0] });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/tickets/:id', async (req, res, next) => {
  try {
    const user = getMockUserFromRequest(req);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const { status } = ticketStatusSchema.parse(req.body);
    const { id } = req.params;

    const state = await updateState(async (current) => ({
      ...current,
      tickets: current.tickets.map((ticket) =>
        ticket.id === id ? { ...ticket, status, updatedAt: new Date().toISOString() } : ticket,
      ),
    }));

    const ticket = state.tickets.find((entry) => entry.id === id);
    return res.json({ ticket });
  } catch (error) {
    return next(error);
  }
});

app.use('/api', (req, res) => {
  res.status(200).json({ message: 'mock backend responding' });
});

const port = 5000;
app.listen(port, () => console.log(`Mock backend listening on http://localhost:${port}`));
