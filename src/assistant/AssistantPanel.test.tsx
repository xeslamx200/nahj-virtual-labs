import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, type Lang } from '../i18n/i18n';
import { AssistantPanel, resetAssistantStatus } from './AssistantPanel';
import type { AssistantSnapshot } from './types';

const snapshot: AssistantSnapshot = { lab: 'electricity', facts: {}, stateText: 'I = 0.5 A', records: [] };
const citation = {
  id: 'phy-p122-1',
  book: { en: 'Science · Grade 10 · Semester 2 · Part 1 (Physics)', ar: 'العلوم · الصف العاشر · الفصل الثاني (الفيزياء)' },
  unit: 4,
  unitTitle: { en: 'Fundamentals of Electricity', ar: 'أساسيات الكهرباء التيارية' },
  lesson: '1-4',
  lessonTitle: { en: 'Current, Voltage and Resistance', ar: 'التيار والجهد والمقاومة' },
  page: 122,
};

function setup(lang: Lang, reply: () => Promise<Response>, textbook = { available: true }) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      url.endsWith('/status') ? Promise.resolve(new Response(JSON.stringify({ available: true, provider: 'gemini', model: 'm', textbook }))) : reply(),
    ),
  );
  render(
    <I18nProvider initial={lang}>
      <AssistantPanel snapshot={snapshot} onClose={() => {}} />
    </I18nProvider>,
  );
}
const ask = async (q: string, placeholder: RegExp) => {
  const input = await screen.findByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value: q } });
  fireEvent.submit(input.closest('form')!);
};
const ok = (sources: object) => () => Promise.resolve(new Response(JSON.stringify({ text: 'answer text', sources })));

afterEach(() => {
  vi.unstubAllGlobals();
  resetAssistantStatus();
});

describe('assistant answer sources', () => {
  it('shows the textbook citation for a textbook-grounded live answer (English)', async () => {
    setup('en', ok({ textbook: [citation], experiment: true, general: false, verified: true }));
    await ask('What is an ampere?', /ask a question/i);
    expect(await screen.findByText('answer text')).toBeInTheDocument();
    const box = screen.getByTestId('assistant-sources');
    expect(box).toHaveTextContent('From the textbook');
    expect(box).toHaveTextContent('From your current experiment');
    expect(box).toHaveTextContent(/Unit 4: Fundamentals of Electricity · Lesson 1-4: Current, Voltage and Resistance · p\. 122/);
    expect(box).not.toHaveTextContent('General science knowledge');
  });

  it('shows Arabic labels and citation (Arabic)', async () => {
    setup('ar', ok({ textbook: [citation], experiment: false, general: false, verified: true }));
    await ask('ما هو الأمبير؟', /اطرح سؤالًا/);
    const box = await screen.findByTestId('assistant-sources');
    expect(box).toHaveTextContent('من الكتاب المدرسي');
    expect(box).toHaveTextContent(/الوحدة 4: أساسيات الكهرباء التيارية · الدرس 1-4/);
    expect(box).toHaveTextContent('ص 122');
  });

  it('labels partly supported answers as such, and says lab values are reported, not server-verified', async () => {
    setup('en', ok({ textbook: [citation], support: 'partial', experiment: true, experimentCheck: 'format-only', general: true, verified: true }));
    await ask('x', /ask a question/i);
    const box = await screen.findByTestId('assistant-sources');
    expect(box).toHaveTextContent('Partly supported by the textbook');
    expect(box).not.toHaveTextContent(/^From the textbook/);
    expect(box).toHaveTextContent('were not re-checked by the server');
  });

  it('says when lab values passed the consistency checks (Arabic)', async () => {
    setup('ar', ok({ textbook: [], support: 'none', experiment: true, experimentCheck: 'consistent', general: false, verified: true }));
    await ask('x', /اطرح سؤالًا/);
    expect(await screen.findByTestId('assistant-sources')).toHaveTextContent('تحقّق الخادم من اتّساقها');
  });

  it('marks answers with no textbook support as general knowledge', async () => {
    setup('en', ok({ textbook: [], experiment: false, general: true, verified: true }));
    await ask('x', /ask a question/i);
    expect(await screen.findByTestId('assistant-sources')).toHaveTextContent('General science knowledge (not from the textbook)');
    expect(screen.getByTestId('assistant-sources')).toHaveTextContent(/No passage in the textbook sections available/);
  });

  it('shows "source not identified" when the reply could not be verified', async () => {
    setup('en', ok({ textbook: [], experiment: false, general: false, verified: false }));
    await ask('x', /ask a question/i);
    expect(await screen.findByTestId('assistant-sources')).toHaveTextContent('Source not identified');
  });

  it('tells the student when this server has no textbook index', async () => {
    setup('en', ok({ textbook: [], support: 'none', experiment: false, general: true, verified: true }), { available: false });
    expect(await screen.findByTestId('assistant-no-index')).toHaveTextContent('Textbook retrieval is not enabled on this server');
  });

  it('does not show the no-index notice when retrieval is available', async () => {
    setup('en', ok({ textbook: [], verified: true }));
    await screen.findByTestId('assistant-mode');
    expect(screen.queryByTestId('assistant-no-index')).toBeNull();
  });

  it('explains a quota / rate-limit failure (429) instead of a generic error', async () => {
    setup('en', () => Promise.resolve(new Response(JSON.stringify({ error: 'upstream_error', category: 'rate_limited' }), { status: 502 })));
    await ask('x', /ask a question/i);
    expect(await screen.findByText(/busy or its quota is used up/i)).toBeInTheDocument();
    expect(screen.getByText('Scripted offline answer, not AI-generated')).toBeInTheDocument();
  });

  it('labels a failed live request as a scripted offline answer, never as AI', async () => {
    setup('en', () => Promise.resolve(new Response('{}', { status: 502 })));
    await ask('What is an ampere?', /ask a question/i);
    expect(await screen.findByText(/offline tutor answered instead/i)).toBeInTheDocument();
    expect(screen.getByText('Scripted offline answer, not AI-generated')).toBeInTheDocument();
    expect(screen.queryByTestId('assistant-sources')).toBeNull();
  });
});
